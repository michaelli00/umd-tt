/* TODO add check for when event_num = 0 */
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const {
  getPlayerRatingsBeforeDateTime,
  getFutureEventIds,
  formatMatches,
  updateEventResults,
} = require('./Utils');

const {
  DEFAULT_DATE_TIME,
  SELECT_PLAYERS_QUERY,
  SELECT_PLAYER_INFO_QUERY,
  SELECT_EVENTS_QUERY,
  SELECT_EVENT_INFO_QUERY,
  SELECT_EVENT_MATCHES_QUERY,
  SELECT_MOST_UPDATED_PLAYER_RATINGS_QUERY,
  INSERT_INTO_EVENTS_QUERY,
  INSERT_INTO_MATCHES_QUERY,
  INSERT_INTO_PLAYER_HISTORIES_QUERY,
  INSERT_INTO_PLAYERS_QUERY,
  UPDATE_PLAYERS_QUERY,
  UPDATE_EVENTS_QUERY,
  UPDATE_PLAYER_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_TIME_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATE_TIME_WITH_EVENT_ID_QUERY,
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
//            "date_time": event_date_time,
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
//        "date_time": event_date_time,
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
      date_time: row.date_time.toISOString().split('T')[0],
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
//      “date_time”: event_date_time,
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
      date_time: dataRow.date_time.toISOString().split('T')[0],
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
//      "date_time": event_date_time,
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
//        "date_time": event_date_time,
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
  const eventDateTime = req.body.date_time;
  const eventNum = req.body.event_num;
  const matches = req.body.matches;
  let toRet;
  try {
    await client.query('BEGIN');

    // Insert into events
    const eventId = (
      await client.query(INSERT_INTO_EVENTS_QUERY(eventNum, eventDateTime))
    ).rows[0].id;

    // Get running mapping of all player ratings BEFORE the old date time
    const selectPlayerRatingsQueryResults = await getPlayerRatingsBeforeDateTime(
      client,
      eventDateTime
    );
    let oldPlayerRatings = {};
    let updatedPlayerRatings = {};
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
          `\'${eventDateTime}\'`,
          oldPlayerRatings[id],
          updatedPlayerRatings[id],
       ])
      )
    );

    // Cascade update
    const futureEventIds = await getFutureEventIds(client, eventDateTime, eventId);
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

    // After cascade updating results, retrieve the current ratings and update the final player ratings
    const mostUpdatedPlayerRatings = (
      await client.query(SELECT_MOST_UPDATED_PLAYER_RATINGS_QUERY)
    ).rows;
    mostUpdatedPlayerRatings.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });
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
      date_time: row.date_time.toISOString().split('T')[0],
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
//      "date_time": event_date_time,
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
//        "date_time": event_date_time,
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
  const eventDateTime = req.body.date_time;
  const matches = req.body.matches;
  let toRet;

  try {
    await client.query('BEGIN');

    const oldEventInfo = (await client.query(SELECT_EVENT_INFO_QUERY(eventId)))
      .rows[0];
    // TODO if only eventNum changes, nothing to do
    const minDate =
      new Date(eventDateTime) <= new Date(oldEventInfo.date_time)
        ? eventDateTime
        : oldEventInfo.date_time.toISOString().split('T')[0];

    await client.query(UPDATE_EVENTS_QUERY(eventId, eventNum, eventDateTime));

    const selectPlayersQueryResults = (
      await client.query(SELECT_PLAYER_RATINGS_BEFORE_DATE_TIME_QUERY(minDateTime))
    ).rows;
    let oldPlayerRatings = {};
    let updatedPlayerRatings = {};
    selectPlayersQueryResults.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });

    const futureEventIdsAndDateTimes = (
      await client.query(
        SELECT_FUTURE_EVENT_IDS_AND_DATE_TIME_WITH_EVENT_ID_QUERY(minDateTime, eventId)
      )
    ).rows.map(row => ({id: row.id, date_time: row.date_time }));
    futureEventIdsAndDateTimes.forEach(async row => {
      oldPlayerRatings = updatedPlayerRatings;
      updatedPlayerRatings = { ...oldPlayerRatings };
      if (row.id === eventId) {
        updateEventResults(
          client,
          row.id,
          oldPlayerRatings,
          updatedPlayerRatings,
          matches,
          row.date_time,
          true
        );
      } else {
        const eventMatches = await client.query(SELECT_EVENT_MATCHES_QUERY(row));
        if (eventMatches.length > 0) {
          updateEventResults(
            client,
            row.id,
            oldPlayerRatings,
            updatedPlayerRatings,
            eventMatches,
            row.date_time,
            false
          );
        }
      }
    });

    // After cascade updating results, retrieve the current ratings and update the final player ratings
    const mostUpdatedPlayerRatings = (
      await client.query(SELECT_MOST_UPDATED_PLAYER_RATINGS_QUERY)
    ).rows;
    mostUpdatedPlayerRatings.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });
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
      date_time: row.date_time.toISOString().split('T')[0],
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

    // When we create a player, set a default date time for player_histories table
    await client.query(
      INSERT_INTO_PLAYER_HISTORIES_QUERY([
        [playerId, 0, `\'${DEFAULT_DATE_TIME}\'`, playerRating, playerRating],
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

// Updates a player's info
// input
//   {
//      "id": player_id,
//      "name": name,
//      "rating": rating,
//      "active": active
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
app.put('/api/admin/update_player', async (req, res) => {
  const { id, name, rating, active } = req.body;
  const client = await pool.connect();
  let toRet;
  try {
    const currDateTime = new Date();
    await client.query('BEGIN');
    const oldRating = await client.query(SELECT_PLAYER_INFO_QUERY(id));
    await client.query(UPDATE_PLAYER_QUERY(id, name, rating, active));

    // Create a dummy event for the player rating update
    if (rating !== oldRating) {
      const eventId = (
        await client.query(INSERT_INTO_EVENTS_QUERY(0, currDateTime))
      ).rows[0].id;
      await client.query(
        INSERT_INTO_PLAYER_HISTORIES_QUERY([
          [id, eventId, `\'${currDateTime}\'`, rating, rating],
        ])
      );
    }

    toRet = (await client.query(SELECT_PLAYERS_QUERY)).rows;
    await client.query('COMMIT');
  } catch (err) {
    console.log(err);
    await client.query('ROLLBACK');
    res.status(500).send('PUT update player errored');
    return;
  } finally {
    client.release();
  }
  res.status(200).json(toRet);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// /////////////////////////////

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
