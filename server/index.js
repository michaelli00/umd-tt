const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const format = require('pg-format');
const get_points_exchanged = require('./rating_algo');
const { warn } = require('console');

const port = process.env.PORT || 5000;

const updateEventResults = async (client, eventId, oldPlayerRatings, updatedPlayerRatings, matches) => {
  const formattedMatches = [];
  matches.forEach(match => {
    const winner_rating = oldPlayerRatings[match.winner_id];
    const loser_rating = oldPlayerRatings[match.loser_id];
    const rating_change = get_points_exchanged(
      winner_rating,
      loser_rating,
      1
    );
    formattedMatches.push([
      eventId,
      match['winner_id'],
      match['loser_id'],
      match['winner_score'],
      match['loser_score'],
      rating_change,
    ]);
    updatedPlayerRatings[match['winner_id']] += rating_change;
    updatedPlayerRatings[match['loser_id']] = Math.max(
      updatedPlayerRatings[match['loser_id']] - rating_change,
      0
    );
  });
  const eventPlayers = Array.from(
    new Set(
      matches
        .map(match => match['winner_id'])
        .concat(matches.map(match => match['loser_id']))
    )
  );
  const updateMatchesQuery = format(
    `UPDATE matches m SET winner_id=updated_m.winner_id, loser_id=updated_m.loser_id, winner_score=updated_m.winner_score, loser_score=updated_m.loser_score, rating_change=updated_m.rating_change FROM (VALUES %s) AS updated_m (event_id, winner_id, loser_id, winner_score, loser_score, rating_change) WHERE m.event_id=updated_m.event_id`,
    formattedMatches
  );
  await client.query(updateMatchesQuery);

  const updatePlayersQuery = format(
    `UPDATE players p SET rating=updated_p.rating FROM (VALUES %s) AS updated_p(id, rating) WHERE p.id=updated_p.id`,
    Object.keys(updatedPlayerRatings).map(id => [
      id,
      updatedPlayerRatings[id],
    ])
  );
  await client.query(updatePlayersQuery);
  const updatePlayerHistoriesQuery = format(
    `UPDATE player_histories ph SET player_id=updated_ph.player_id, rating_before=updated_ph.rating_before, rating_after=updated_ph.rating_after FROM (VALUES %s) AS updated_ph(player_id, event_id, rating_before, rating_after) WHERE ph.event_id=updated_ph.event_id`,
    eventPlayers.map(id => [
      id,
      eventId,
      oldPlayerRatings[id],
      updatedPlayerRatings[id],
    ])
  );
  await client.query(updatePlayerHistoriesQuery);
}

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
  pool.query(
    `
      SELECT id, name, rating, active FROM players
      ORDER BY active DESC, rating DESC, id ASC
    `,
    (err, results) => {
      if (err) {
        res.status(500).send('GET players list errored');
        return;
      }
      const toRet = results.rows;
      res.status(200).json(toRet);
    }
  );
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
//            "name": event_name,
//            "date": event_date,
//            "rating_before": rating_before,
//            "rating_after": rating_after
//          }, ...
//        ],
//      ...
//    }
app.get('/api/player/:id', (req, res) => {
  pool.query(
    `
      SELECT id, name, rating, active, (
        SELECT JSON_AGG(agg) FROM (
          SELECT id, name, date, rating_before, rating_after
          FROM player_histories
          INNER JOIN events ON player_histories.event_id=events.id
          WHERE player_histories.player_id=${req.params.id}
        ) AS agg
      ) AS events
      FROM players
      WHERE id = ${req.params.id}
    `,
    (err, results) => {
      if (err) {
        res.status(500).send('GET player information errored');
        return;
      }
      const toRet = {
        id: results.rows[0]['id'],
        name: results.rows[0]['name'],
        rating: results.rows[0]['rating'],
        active: results.rows[0]['active'],
        events: results.rows[0]['events'],
      };
      res.status(200).json(toRet);
    }
  );
});

// returns
//    [
//      {
//        "date": event_date,
//        "events":
//          [
//            {
//              "id": event_id,
//              "name": event_name
//            },
//            ...
//          ]
//      },
//      ...
//    ]
app.get('/api/events', (req, res) => {
  pool.query(
    `
      SELECT date, ARRAY_AGG(id) AS ids, ARRAY_AGG(name) AS names
      FROM events
      GROUP BY date ORDER BY date
    `,
    (err, results) => {
      if (err) {
        res.status(500).send('GET events errored');
        return;
      }
      const toRet = results.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        events: row.ids.map((id, index) => ({
          id: id,
          name: row.names[index],
        })),
      }));
      res.status(200).json(toRet);
    }
  );
});

// returns
//    {
//      “name”: event_name,
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
  pool.query(
    `
      SELECT name, date, (
        SELECT JSON_AGG(agg1) FROM (
          SELECT winner_id, p1.name AS winner_name, loser_id, p2.name AS loser_name, winner_score, loser_score, rating_change
          FROM matches
          INNER JOIN players p1 ON winner_id=p1.id
          INNER JOIN players p2 ON loser_id=p2.id
          WHERE event_id=${req.params.event_id}
        ) AS agg1
      ) AS matches, (
        SELECT JSON_AGG(agg2) FROM (
          SELECT player_id, name, rating_before, rating_after
          FROM player_histories
        ) AS agg2
      ) AS ratings
      FROM events
      WHERE id=${req.params.event_id}
    `,
    (err, results) => {
      if (err) {
        res.status(500).send('GET event information errored');
        return;
      }
      const toRet = {
        name: results.rows[0]['name'],
        date: results.rows[0]['date'].toISOString().split('T')[0],
        matches: results.rows[0]['matches'],
        ratings: results.rows[0]['ratings'],
      };
      res.status(200).json(toRet);
    }
  );
});

// Adds a new event by calculating the new ratings and updating tables
// input
//    {
//      "name": event_name,
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
//              "name": event_name
//            },
//            ...
//          ]
//      },
//      ...
//    ]
app.post('/api/admin/add_event', async (req, res) => {
  const client = await pool.connect();
  let toRet;
  try {
    await client.query('BEGIN');
    const insertQuery = `INSERT INTO events (name, date) VALUES ('${req.body['name']}','${req.body['date']}') RETURNING id`;
    const event_id = (await client.query(insertQuery)).rows[0]['id'];

    const selectPlayersQuery = `SELECT id, rating FROM players WHERE active=TRUE`;
    const selectPlayersQueryResults = (await client.query(selectPlayersQuery))
      .rows;
    const all_players = {};
    const updatedPlayerRatings = {};
    selectPlayersQueryResults.forEach(player => {
      all_players[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });
    const matches = [];
    req.body['matches'].forEach(match => {
      const winner_rating = all_players[match.winner_id];
      const loser_rating = all_players[match.loser_id];
      const rating_change = get_points_exchanged(
        winner_rating,
        loser_rating,
        1
      );
      matches.push([
        event_id,
        match['winner_id'],
        match['loser_id'],
        match['winner_score'],
        match['loser_score'],
        rating_change,
      ]);
      updatedPlayerRatings[match['winner_id']] += rating_change;
      updatedPlayerRatings[match['loser_id']] = Math.max(
        updatedPlayerRatings[match['loser_id']] - rating_change,
        0
      );
    });
    const insertMatchesQuery = format(
      `INSERT INTO matches (event_id, winner_id, loser_id, winner_score, loser_score, rating_change) VALUES %s`,
      matches
    );
    await client.query(insertMatchesQuery);

    const updatePlayersQuery = format(
      `UPDATE players p SET rating=updated_p.rating FROM (VALUES %s) AS updated_p(id, rating) WHERE p.id=updated_p.id`,
      Object.keys(updatedPlayerRatings).map(id => [
        id,
        updatedPlayerRatings[id],
      ])
    );
    await client.query(updatePlayersQuery);

    const eventPlayers = Array.from(
      new Set(
        req.body['matches']
          .map(match => match['winner_id'])
          .concat(req.body['matches'].map(match => match['loser_id']))
      )
    );
    const insertPlayerHistoriesQuery = format(
      `INSERT INTO player_histories (player_id, event_id, rating_before, rating_after) VALUES %s`,
      eventPlayers.map(id => [
        id,
        event_id,
        all_players[id],
        updatedPlayerRatings[id],
      ])
    );
    await client.query(insertPlayerHistoriesQuery);

    const selectEventsQuery = `SELECT date, ARRAY_AGG(id) AS ids, ARRAY_AGG(name) AS names FROM events GROUP BY date ORDER BY date`;
    toRet = (await client.query(selectEventsQuery)).rows;
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).send('POST add event errored');
    return;
  } finally {
    client.release();
    res.status(200).json(toRet);
  }
});

// Updates an existing event by calculating the new ratings and updating tables
// input
//    {
//      "id": event_id,
//      "name": event_name,
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
//              "name": event_name
//            },
//            ...
//          ]
//      },
//      ...
//    ]
app.put('/api/admin/update_event', async (req, res) => {
  const client = await pool.connect();
  let toRet;
  const event_id = req.body['id'];
  const event_name = req.body['name'];
  const event_date = req.body['date'];
  const matches = req.body['matches'];

  try {
    await client.query('BEGIN');

    const updateEventsQuery = `UPDATE events SET name='${event_name}', date='${event_date}' WHERE id=${event_id}`;
    await client.query(updateEventsQuery);

    const selectPlayersQuery = `SELECT id, rating FROM players WHERE active=TRUE`;
    const selectPlayersQueryResults = (await client.query(selectPlayersQuery))
      .rows;
    let oldPlayerRatings = {};
    let updatedPlayerRatings = {};
    selectPlayersQueryResults.forEach(player => {
      oldPlayerRatings[player.id] = player.rating;
      updatedPlayerRatings[player.id] = player.rating;
    });
    // START
    await updateEventResults(client, event_id, oldPlayerRatings, updatedPlayerRatings, matches);

    const allFutureEventsQuery = `SELECT id FROM events WHERE date > '${event_date}'`;
    const futureEventIds = (await client.query(allFutureEventsQuery)).rows.map(row => row.id);
    futureEventIds.forEach(async id => {
      oldPlayerRatings = updatedPlayerRatings;
      updatedPlayerRatings = {...oldPlayerRatings};
      const selectEventMatchesQuery = `SELECT winner_id, loser_id, winner_score, loser_score FROM matches WHERE event_id=${id}`;
      const eventMatches = (await client.query(selectEventMatchesQuery)).rows;
      if (eventMatches.length > 0) {
        updateEventResults(client, id, oldPlayerRatings, updatedPlayerRatings, eventMatches);
      }
    })


    const selectEventsQuery = `SELECT date, ARRAY_AGG(id) AS ids, ARRAY_AGG(name) AS names FROM events GROUP BY date ORDER BY date`;
    toRet = (await client.query(selectEventsQuery)).rows;
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.log(e);
    res.status(500).send('PUT update event errored');
    return;
  } finally {
    client.release();
    res.status(200).json(toRet);
  }
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
  const client = await pool.connect();
  let toRet;
  try {
    await client.query('BEGIN');
    const insertQuery = `INSERT INTO players (name, rating, active) VALUES ('${req.body.name}', ${req.body.rating}, TRUE)`;
    await client.query(insertQuery);
    const selectQuery = `SELECT * FROM players ORDER BY active DESC, rating DESC, id ASC`;
    toRet = await client.query(selectQuery);
    await client.query('COMMIT');
  } catch (e) {
  } finally {
    client.release();
    res.status(200).json(toRet.rows);
  }
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
  const client = await pool.connect();
  let toRet;
  try {
    await client.query('BEGIN');
    const updateQuery = `UPDATE players SET name='${req.body.name}', rating=${req.body.rating}, active=${req.body.active} WHERE id=${req.body.id}`;
    await client.query(updateQuery);
    const selectQuery = `SELECT * FROM players ORDER BY active DESC, rating DESC, id ASC`;
    toRet = (await client.query(selectQuery)).rows;
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).send('PUT update player errored');
    return;
  } finally {
    client.release();
    res.status(200).json(toRet);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// /////////////////////////////

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
