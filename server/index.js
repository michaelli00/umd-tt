const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const {
  getPlayerRatingsBeforeDate,
  getFutureEventIds,
  formatMatches,
  updateEventResults,
} = require('./Utils');

const {
  DEFAULT_DATE,
  SELECT_PLAYERS_QUERY,
  SELECT_PLAYER_INFO_QUERY,
  SELECT_EVENTS_QUERY,
  SELECT_EVENT_INFO_QUERY,
  SELECT_EVENT_MATCHES_QUERY,
  INSERT_INTO_EVENTS_QUERY,
  INSERT_INTO_MATCHES_QUERY,
  INSERT_INTO_PLAYER_HISTORIES_QUERY,
  INSERT_INTO_PLAYERS_QUERY,
  UPDATE_PLAYERS_QUERY,
  UPDATE_EVENTS_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY,
  SELECT_FUTURE_EVENT_IDS_WITH_EVENT_ID_QUERY,
} = require('./Constant');

const port = process.env.PORT || 5000;

// middleware
app.use(express.static(path.join(__dirname, '../build')));
app.use(cors());
app.use(express.json());

// returns
//    [
//      {
//        "id": player_ID,
//        "name": player_name,
//        "rating": rating,
//        "active": active
//      },
//      ...
//    ]
app.get('/api/players', (req, res) => {
  pool.query(SELECT_PLAYERS_QUERY, (err, results) => {
    if (err) {
      res.status(500).send('GET players list errored');
      return;
    }
    const toRet = results.rows;
    res.status(200).json(toRet);
  });
});

// returns
//    {
//      "id": player_ID,
//      "name": player_name,
//      "rating": rating,
//      "active": active,
//      "events":
//        [
//          {
//            "id": event_id,
//            "event_num": event_num,
//            "date": event_date,
//            "rating_before": rating_before,
//            "rating_after": rating_after
//          }, ...
//        ],
//      ...
//    }
app.get('/api/player/:id', (req, res) => {
  const playerId = req.params.id;
  pool.query(SELECT_PLAYER_INFO_QUERY(playerId), (err, results) => {
    if (err) {
      res.status(500).send('GET player information errored');
      return;
    }
    const dataRow = results.rows[0];
    const toRet = {
      id: dataRow.id,
      name: dataRow.name,
      rating: dataRow.rating,
      active: dataRow.active,
      events: dataRow.events ? dataRow.events : [],
    };
    res.status(200).json(toRet);
  });
});

// returns
//    [
//      {
//        "date": event_date,
//        "events":
//          [
//            {
//              "id": event_id,
//              "event_num": event_num
//            },
//            ...
//          ]
//      },
//      ...
//    ]
app.get('/api/events', (req, res) => {
  pool.query(SELECT_EVENTS_QUERY, (err, results) => {
    if (err) {
      res.status(500).send('GET events errored');
      return;
    }
    const toRet = results.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      events: row.ids.map((id, index) => ({
        id: id,
        event_num: row.event_nums[index],
      })),
    }));
    res.status(200).json(toRet);
  });
});

// returns
//    {
//      “event_num”: event_num,
//      “date”: event_date,
//      "matches":
//        [
//          {
//            "winner_id": winner_id,
//            "winner_name": winner_name,
//            "loser_id": loser_id,
//            “loser_name”: loser_name,
//            "winner_score": winner_score,
//            "loser_score": loser_score,
//            "rating_change": rating_change
//          },
//          ...
//        ],
//      "ratings" :
//        [
//          {
//            "id": player_id,
//            "name": player_name,
//            "rating_before": rating_before,
//            "rating_after": rating_after
//          },
//          ...
//        ],
//    }
app.get('/api/event/:event_id', (req, res) => {
  const eventId = req.params.event_id;
  pool.query(SELECT_EVENT_INFO_QUERY(eventId), (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('GET event information errored');
      return;
    }
    const dataRow = results.rows[0];
    const toRet = {
      event_num: dataRow.event_num,
      date: dataRow.date.toISOString().split('T')[0],
      matches: dataRow.matches ? dataRow.matches : [],
      ratings: dataRow.ratings ? dataRow.ratings : [],
    };
    res.status(200).json(toRet);
  });
});

// Adds a new event by calculating the new ratings and updating tables
// input
//    {
//      "event_num": event_num,
//      "date": event_date,
//      “matches”:
//        [
//          {
//            "winner_id": winner_id,
//            "loser_id": loser_id,
//            "winner_score": winner_score,
//            "loser_score": loser_score
//          },
//          ...
//        ]
//    }
// return
//    [
//      {
//        "date": event_date,
//        "events":
//          [
//            {
//              "id": event_id,
//              "event_num": event_num
//            },
//            ...
//          ]
//      },
//      ...
//    ]
app.post('/api/admin/add_event', async (req, res) => {
  const client = await pool.connect();
  const eventDate = req.body.date;
  const eventNum = req.body.event_num;
  const matches = req.body.matches;
  let toRet;
  try {
    await client.query('BEGIN');

    // Insert into events
    const eventId = (
      await client.query(INSERT_INTO_EVENTS_QUERY(eventNum, eventDate))
    ).rows[0].id;

    // Get running mapping of all player ratings BEFORE the old date
    const selectPlayerRatingsQueryResults = await getPlayerRatingsBeforeDate(
      client,
      eventDate
    );
    const oldPlayerRatings = {};
    const updatedPlayerRatings = {};
    selectPlayerRatingsQueryResults.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });

    // insert match results
    const formattedMatches = formatMatches(
      eventId,
      matches,
      oldPlayerRatings,
      updatedPlayerRatings
    );
    const insertMatchesQuery = INSERT_INTO_MATCHES_QUERY(formattedMatches);
    await client.query(insertMatchesQuery);

    // For players in the event, insert into player_histories
    const eventPlayerSet = Array.from(
      new Set(
        matches
          .map(match => match.winner_id)
          .concat(matches.map(match => match.loser_id))
      )
    );

    await client.query(
      INSERT_INTO_PLAYER_HISTORIES_QUERY(
        eventPlayerSet.map(id => [
          id,
          eventId,
          `\'${eventDate}\'`,
          oldPlayerRatings[id],
          updatedPlayerRatings[id],
        ])
      )
    );

    // Cascade update
    const futureEventIds = await getFutureEventIds(client, eventId, eventDate);
    futureEventIds.forEach(async id => {
      oldPlayerRatings = updatedPlayerRatings;
      updatedPlayerRatings = { ...oldPlayerRatings };
      const eventMatches = (await client.query(SELECT_EVENT_MATCHES_QUERY(id)))
        .rows;
      if (eventMatches.length > 0) {
        updateEventResults(
          client,
          id,
          oldPlayerRatings,
          updatedPlayerRatings,
          eventMatches
        );
      }
    });

    // After cascade updating results, update the final player ratings
    await client.query(
      UPDATE_PLAYERS_QUERY(
        Object.keys(updatedPlayerRatings).map(id => [
          id,
          updatedPlayerRatings[id],
        ])
      )
    );

    // Get return query
    toRet = (await client.query(SELECT_EVENTS_QUERY)).rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      events: row.ids.map((id, index) => ({
        id: id,
        event_num: row.event_nums[index],
      })),
    }));
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(err);
    res.status(500).send('POST add event errored');
    return;
  } finally {
    client.release();
  }
  res.status(200).json(toRet);
});

// Updates an existing event by calculating the new ratings and updating tables
// input
//    {
//      "id": event_id,
//      "event_num": event_num,
//      "date": event_date,
//      “matches”:
//        [
//          {
//            "winner_id": winner_id,
//            "loser_id": loser_id,
//            "winner_score": winner_score,
//            "loser_score": loser_score
//          },
//          ...
//        ]
//    }
// return
//    [
//      {
//        "date": event_date,
//        "events":
//          [
//            {
//              "id": event_id,
//              "event_num": event_num
//            },
//            ...
//          ]
//      },
//      ...
//    ]
app.put('/api/admin/update_event', async (req, res) => {
  const client = await pool.connect();
  const eventId = req.body.id;
  const eventNum = req.body.event_num;
  const eventDate = req.body.date;
  const matches = req.body.matches;
  let toRet;

  try {
    await client.query('BEGIN');

    const oldEventInfo = (await client.query(SELECT_EVENT_INFO_QUERY(eventId)))
      .rows[0];
    // TODO if only eventNum changes, nothing to do
    const minDate =
      new Date(eventDate) <= new Date(oldEventInfo.date)
        ? eventDate
        : oldEventInfo.date.toISOString().split('T')[0];

    await client.query(UPDATE_EVENTS_QUERY(eventId, eventNum, eventDate));

    const selectPlayersQueryResults = (
      await client.query(SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY(minDate))
    ).rows;
    let oldPlayerRatings = {};
    let updatedPlayerRatings = {};
    selectPlayersQueryResults.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });

    const futureEventIds = (
      await client.query(
        SELECT_FUTURE_EVENT_IDS_WITH_EVENT_ID_QUERY(minDate, eventId)
      )
    ).rows.map(row => row.id);
    futureEventIds.forEach(async id => {
      oldPlayerRatings = updatedPlayerRatings;
      updatedPlayerRatings = { ...oldPlayerRatings };
      if (id === eventId) {
        updateEventResults(
          client,
          id,
          oldPlayerRatings,
          updatedPlayerRatings,
          matches,
          eventDate
        );
      } else {
        const eventMatches = await client.query(SELECT_EVENT_MATCHES_QUERY(id));
        if (eventMatches.length > 0) {
          updateEventResults(
            client,
            id,
            oldPlayerRatings,
            updatedPlayerRatings,
            eventMatches
          );
        }
      }
    });

    // After cascade updating results, update the final player ratings
    await client.query(
      UPDATE_PLAYERS_QUERY(
        Object.keys(updatedPlayerRatings).map(id => [
          id,
          updatedPlayerRatings[id],
        ])
      )
    );

    // Get return query
    toRet = (await client.query(SELECT_EVENTS_QUERY)).rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      events: row.ids.map((id, index) => ({
        id: id,
        event_num: row.event_nums[index],
      })),
    }));
    await client.query('COMMIT');
  } catch (err) {
    console.log(err);
    await client.query('ROLLBACK');
    res.status(500).send('PUT update event errored');
    return;
  } finally {
    client.release();
  }
  res.status(200).json(toRet);
});

// Adds a new player to the database
// input
//   {
//      "name": name,
//      "rating": rating,
//   }
//
// returns
//    [
//      {
//        "id": player_ID,
//        "name": player_name,
//        "rating": rating,
//        "active": active
//      },
//      ...
//    ]
app.post('/api/admin/add_player', async (req, res) => {
  const playerName = req.body.name;
  const playerRating = req.body.rating;
  const client = await pool.connect();
  let toRet;
  try {
    await client.query('BEGIN');
    const playerId = (
      await client.query(INSERT_INTO_PLAYERS_QUERY(playerName, playerRating))
    ).rows[0].id;
    console.log(playerId);

    // When we create a player, set a default date for player_histories table
    await client.query(
      INSERT_INTO_PLAYER_HISTORIES_QUERY([
        [playerId, 0, DEFAULT_DATE, playerRating, playerRating],
      ])
    );

    toRet = (await client.query(SELECT_PLAYERS_QUERY)).rows;
    await client.query('COMMIT');
  } catch (err) {
    console.log(err);
    await client.query('ROLLBACK');
    res.status(500).send('POSt add player errored');
    return;
  } finally {
    client.release();
  }
  res.status(200).json(toRet);
});

/**/
/* // Updates a player's info */
/* // input */
/* //   { */
/* //      "id": player_id, */
/* //      "name": name, */
/* //      "rating": rating, */
/* //      "active": active */
/* //   } */
/* // */
/* // returns */
/* //    [ */
/* //      { */
/* //        "id": player_ID, */
/* //        "name": player_name, */
/* //        "rating": rating, */
/* //        "active": active */
/* //      }, */
/* //      ... */
/* //    ] */
/* app.put('/api/admin/update_player', async (req, res) => { */
/*   const playerId = req.body.id; */
/*   const playerName = req.body.name; */
/*   const playerRating = req.body.rating; */
/*   const playerActive = req.body.active; */
/*   const client = await pool.connect(); */
/*   let toRet; */
/*   try { */
/*     await client.query('BEGIN'); */
/*     const updateQuery = `UPDATE players SET name='${playerName}', rating=${playerRating}, active=${playerActive} WHERE id=${playerId}`; */
/*     await client.query(updateQuery); */
/*     const selectQuery = `SELECT * FROM players ORDER BY active DESC, rating DESC, id ASC`; */
/*     toRet = (await client.query(selectQuery)).rows; */
/*     await client.query('COMMIT'); */
/*   } catch (e) { */
/*     await client.query('ROLLBACK'); */
/*     res.status(500).send('PUT update player errored'); */
/*     return; */
/*   } finally { */
/*     client.release(); */
/*   } */
/*   res.status(200).json(toRet); */
/* }); */

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// /////////////////////////////

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
