const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const {
  calculateAndFormatMatches,
  getPlayerRatingsBeforeDate,
  getFutureEventIdsAndDates,
  updateEventResults,
  areMatchListsDifferent,
  getLatestPlayerRatings,
  isDuplicateEventNum,
} = require('./Utils');

const {
  APP_DOES_NOT_SUPPORT_MESSAGE,
  DUPLICATE_EVENT_NUM_MESSAGE,
  DEFAULT_DATE,
  SELECT_ADJUSTED_RATINGS_FROM_EVENT_ID_QUERY,
  SELECT_EVENT_INFO_WITH_PLAYER_NAMES_QUERY,
  SELECT_EVENT_INFO_WITHOUT_PLAYER_NAMES_QUERY,
  SELECT_EVENT_MATCHES_QUERY,
  SELECT_EVENTS_QUERY,
  SELECT_PLAYER_INFO_QUERY,
  SELECT_PLAYER_INFO_WITH_LAST_EVENT_QUERY,
  SELECT_ACTIVE_PLAYERS_QUERY,
  SELECT_ALL_PLAYERS_QUERY,
  INSERT_INTO_EVENTS_QUERY,
  INSERT_INTO_MATCHES_QUERY,
  INSERT_INTO_PLAYER_HISTORIES_QUERY,
  INSERT_INTO_PLAYERS_QUERY,
  UPDATE_EVENTS_QUERY,
  UPDATE_PLAYER_HISTORIES_WITH_ADJUSTED_RATING_QUERY,
  UPDATE_PLAYER_INFO_QUERY,
  UPDATE_PLAYER_QUERY,
  DELETE_PLAYER_HISTORIES_WITH_EVENT_ID_QUERY,
  DELETE_MATCHES_WITH_EVENT_ID_QUERY,
} = require('./Constant');

const port = process.env.PORT || 5000;

// middleware
app.use(express.static(path.join(__dirname, '../build')));
app.use(cors());
app.use(express.json());

// returns
//    [
//      {
//        "id": player_id,
//        "name": player_name,
//        "rating": rating,
//        "active": true
//      },
//      ...
//    ]
app.get('/api/players', (req, res) => {
  pool.query(SELECT_ACTIVE_PLAYERS_QUERY, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('GET players list errored');
      return;
    }
    const toRet = results.rows;
    res.status(200).json(toRet);
  });
});

// returns
//    [
//      {
//        "id": player_id,
//        "name": player_name,
//        "rating": rating,
//        "active": active
//      },
//      ...
//    ]
app.get('/api/all_players', (req, res) => {
  pool.query(SELECT_ALL_PLAYERS_QUERY, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('GET players list errored');
      return;
    }
    const toRet = results.rows;
    res.status(200).json(toRet);
  });
});

// returns
//    {
//      "id": player_id,
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
  pool.query(SELECT_PLAYER_INFO_QUERY, [playerId], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send('GET player information errored');
      return;
    } else if (results.rows.length !== 1) {
      res.status(404).send('GET player information invalid player id');
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
      console.log(err);
      res.status(500).send('GET events errored');
      return;
    }
    const toRet = results.rows.map(row => {
      const events = row.ids.map((id, index) => ({
        id: id,
        event_num: row.event_nums[index],
      }));
      events.sort((row1, row2) => row1.event_num - row2.event_num);

      return {
        date: row.date,
        events: events,
      };
    });
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
  pool.query(
    SELECT_EVENT_INFO_WITH_PLAYER_NAMES_QUERY,
    [eventId],
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('GET event information errored');
        return;
      } else if (results.rows.length != 1) {
        res.status(404).send('GET event information invalid event id');
        return;
      }
      const dataRow = results.rows[0];
      const toRet = {
        event_num: dataRow.event_num,
        date: dataRow.date,
        matches: dataRow.matches ? dataRow.matches : [],
        ratings: dataRow.ratings ? dataRow.ratings : [],
      };
      res.status(200).json(toRet);
    }
  );
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
  const eventDateString = req.body.date;
  const eventNum = req.body.event_num;
  const matches = req.body.matches;
  let toRet;
  try {
    await client.query('BEGIN');

    if (await isDuplicateEventNum(client, eventDateString, eventNum)) {
      throw new Error(DUPLICATE_EVENT_NUM_MESSAGE);
    }

    // Insert into events
    const eventId = (
      await client.query(INSERT_INTO_EVENTS_QUERY, [eventNum, eventDateString])
    ).rows[0].id;

    // Get running mapping of all player ratings before the event date
    const playerRatings = await getPlayerRatingsBeforeDate(
      client,
      eventDateString
    );
    let oldPlayerRatings = {};
    let updatedPlayerRatings = {};
    playerRatings.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });

    // Calculate match results and rating changes, and insert matches
    const formattedMatches = calculateAndFormatMatches(
      eventId,
      matches,
      oldPlayerRatings,
      updatedPlayerRatings
    );
    await client.query(INSERT_INTO_MATCHES_QUERY(formattedMatches));

    // For players in the event, insert into player_histories
    const eventPlayers = Array.from(
      new Set(
        matches
          .map(match => match.winner_id)
          .concat(matches.map(match => match.loser_id))
      )
    );
    await client.query(
      INSERT_INTO_PLAYER_HISTORIES_QUERY(
        eventPlayers.map(id => [
          id,
          eventId,
          `\'${eventDateString}\'`,
          oldPlayerRatings[id],
          updatedPlayerRatings[id],
        ])
      )
    );

    // Cascade update future events
    const futureEventIdsAndDates = await getFutureEventIdsAndDates(
      client,
      eventDateString,
      eventId
    );
    for (const row of futureEventIdsAndDates) {
      const playerRatings = await getPlayerRatingsBeforeDate(client, row.date);
      playerRatings.forEach(player => {
        oldPlayerRatings[player.id] = player.rating;
        updatedPlayerRatings[player.id] = player.rating;
      });
      const eventMatches = (
        await client.query(SELECT_EVENT_MATCHES_QUERY, [row.id])
      ).rows;
      if (eventMatches.length > 0) {
        await updateEventResults(
          client,
          row.id,
          oldPlayerRatings,
          updatedPlayerRatings,
          eventMatches
        );
      }
    }

    // After cascade updating results, retrieve the current ratings and update the final player ratings
    const mostUpdatedPlayerRatings = await getLatestPlayerRatings(client);
    mostUpdatedPlayerRatings.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });
    for (const id of Object.keys(updatedPlayerRatings)) {
      await client.query(UPDATE_PLAYER_QUERY, [id, updatedPlayerRatings[id]]);
    }

    // Get return query
    toRet = (await client.query(SELECT_EVENTS_QUERY)).rows.map(row => ({
      date: row.date,
      events: row.ids.map((id, index) => ({
        id: id,
        event_num: row.event_nums[index],
      })),
    }));
    await client.query('COMMIT');
  } catch (err) {
    console.log(err);
    await client.query('ROLLBACK');
    if (err.message === DUPLICATE_EVENT_NUM_MESSAGE) {
      res.status(403).send('POST event duplicate event number found');
    } else {
      res.status(500).send('POST event errored');
    }
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
  const eventDateString = req.body.date;
  const eventDate = new Date(eventDateString);
  const matches = req.body.matches;
  let toRet;

  try {
    await client.query('BEGIN');

    if (await isDuplicateEventNum(client, eventDateString, eventNum)) {
      throw new Error(DUPLICATE_EVENT_NUM_MESSAGE);
    }

    const oldEventInfo = (
      await client.query(SELECT_EVENT_INFO_WITHOUT_PLAYER_NAMES_QUERY, [
        eventId,
      ])
    ).rows[0];

    const oldEventDateString = oldEventInfo.date;
    const oldEventDate = new Date(oldEventInfo.date);
    const minDateString =
      eventDate <= oldEventDate ? eventDateString : oldEventDateString;

    // Get a list of players w/ adjusted ratings from the target event
    const adjustedPlayers = (
      await client.query(SELECT_ADJUSTED_RATINGS_FROM_EVENT_ID_QUERY, [eventId])
    ).rows;
    if (eventDateString !== oldEventDateString && adjustedPlayers.length > 0) {
      throw new Error(APP_DOES_NOT_SUPPORT_MESSAGE);
    }
    await client.query(UPDATE_EVENTS_QUERY, [
      eventId,
      eventNum,
      eventDateString,
    ]);

    if (
      eventDateString !== oldEventDateString ||
      areMatchListsDifferent(matches, oldEventInfo.matches)
    ) {
      // Delete the old player history and matches entries
      await client.query(DELETE_PLAYER_HISTORIES_WITH_EVENT_ID_QUERY, [
        eventId,
      ]);
      await client.query(DELETE_MATCHES_WITH_EVENT_ID_QUERY, [eventId]);

      // Get running mapping of all player ratings BEFORE the old date time
      const futureEventIdsAndDates = await getFutureEventIdsAndDates(
        client,
        minDateString
      );

      let oldPlayerRatings = {};
      let updatedPlayerRatings = {};
      for (const row of futureEventIdsAndDates) {
        const playerRatings = await getPlayerRatingsBeforeDate(
          client,
          row.date
        );
        playerRatings.forEach(player => {
          oldPlayerRatings[player.id] = player.rating;
          updatedPlayerRatings[player.id] = player.rating;
        });

        // If it's the target event, we need to insert into player_histories and matches
        if (row.id === eventId) {
          // Calculate match results and rating changes, and insert matches
          const formattedMatches = calculateAndFormatMatches(
            eventId,
            matches,
            oldPlayerRatings,
            updatedPlayerRatings
          );
          await client.query(INSERT_INTO_MATCHES_QUERY(formattedMatches));

          // For players in the event, insert into player_histories
          const eventPlayers = Array.from(
            new Set(
              matches
                .map(match => match.winner_id)
                .concat(matches.map(match => match.loser_id))
            )
          );
          await client.query(
            INSERT_INTO_PLAYER_HISTORIES_QUERY(
              eventPlayers.map(id => [
                id,
                eventId,
                `\'${row.date}\'`,
                oldPlayerRatings[id],
                updatedPlayerRatings[id],
              ])
            )
          );

          // Reinsert the adjusted ratings
          adjustedPlayers.forEach(async player => {
            // If the new matches containd the player, we can directly update the player history entry's adjusted rating
            if (eventPlayers.contains(player.player_id)) {
              await client.query(
                UPDATE_PLAYER_HISTORIES_WITH_ADJUSTED_RATING_QUERY,
                [player.player_id, eventId, player.adjusted_rating]
              );
              // Otherwise we need to find the latest player history entry and update the adjusted rating
            } else {
              const eventPlayerInfo = (
                await client.query(SELECT_PLAYER_INFO_WITH_LAST_EVENT_QUERY, [
                  id,
                ])
              ).rows[0];
              await client.query(
                UPDATE_PLAYER_HISTORIES_WITH_ADJUSTED_RATING_QUERY,
                [
                  player.player_id,
                  eventPlayerInfo.events[0].id,
                  player.adjusted_rating,
                ]
              );
            }
          });
        } else {
          const eventMatches = (
            await client.query(SELECT_EVENT_MATCHES_QUERY, [row.id])
          ).rows;
          if (eventMatches.length > 0) {
            await updateEventResults(
              client,
              row.id,
              oldPlayerRatings,
              updatedPlayerRatings,
              eventMatches
            );
          }
        }
      }

      // After cascade updating results, retrieve the current ratings and update the final player ratings
      const mostUpdatedPlayerRatings = await getPlayerRatingsBeforeDate(
        client,
        new Date()
      );
      mostUpdatedPlayerRatings.forEach(player => {
        oldPlayerRatings[player.id] = player.rating;
        updatedPlayerRatings[player.id] = player.rating;
      });
      for (const id of Object.keys(updatedPlayerRatings)) {
        await client.query(UPDATE_PLAYER_QUERY, [id, updatedPlayerRatings[id]]);
      }
    }

    // Get return query
    toRet = (await client.query(SELECT_EVENTS_QUERY)).rows.map(row => ({
      date: row.date,
      events: row.ids.map((id, index) => ({
        id: id,
        event_num: row.event_nums[index],
      })),
    }));
    await client.query('COMMIT');
  } catch (err) {
    console.log(err);
    await client.query('ROLLBACK');
    if (err.message === APP_DOES_NOT_SUPPORT_MESSAGE) {
      res.status(404).send("PUT update event app doesn't support");
    } else if (err.message === DUPLICATE_EVENT_NUM_MESSAGE) {
      res.status(403).send('PUT event duplicate event number found');
    } else {
      res.status(500).send('PUT update event errored');
    }
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
      await client.query(INSERT_INTO_PLAYERS_QUERY, [playerName, playerRating])
    ).rows[0].id;

    // When creating a player, add a dummy entry to player_histories with default date time
    await client.query(
      INSERT_INTO_PLAYER_HISTORIES_QUERY([
        [playerId, 0, DEFAULT_DATE, playerRating, playerRating],
      ])
    );

    toRet = (await client.query(SELECT_ALL_PLAYERS_QUERY)).rows;
    await client.query('COMMIT');
  } catch (err) {
    console.log(err);
    await client.query('ROLLBACK');
    res.status(500).send('POST add player errored');
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
    await client.query('BEGIN');
    const oldPlayerInfo = (
      await client.query(SELECT_PLAYER_INFO_WITH_LAST_EVENT_QUERY, [id])
    ).rows[0];

    // If rating is updated, update the latest event to include the adjusted rating
    if (rating !== oldPlayerInfo.rating) {
      await client.query(UPDATE_PLAYER_HISTORIES_WITH_ADJUSTED_RATING_QUERY, [
        id,
        oldPlayerInfo.events[0].id,
        rating,
      ]);
    }

    // Only update player info if one of the fields changed
    if (
      name !== oldPlayerInfo.name ||
      rating !== oldPlayerInfo.rating ||
      active !== oldPlayerInfo.active
    ) {
      await client.query(UPDATE_PLAYER_INFO_QUERY, [id, name, rating, active]);
    }

    toRet = (await client.query(SELECT_ALL_PLAYERS_QUERY)).rows;
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
