const format = require('pg-format');

const DEFAULT_DATE = '2000-01-01';

const SELECT_PLAYERS_QUERY = `
  SELECT id, name, rating, active FROM players
  ORDER BY active DESC, rating DESC, name ASC
`;

const SELECT_PLAYER_INFO_QUERY = playerId => `
    SELECT id, name, rating, active, (
      SELECT JSON_AGG(agg) FROM (
        SELECT id, event_num, events.date, rating_before, rating_after
        FROM player_histories
        INNER JOIN events ON player_histories.event_id=events.id
        WHERE player_histories.player_id=${playerId}
      ) AS agg
    ) AS events
    FROM players
    WHERE id = ${playerId}
`;

const SELECT_EVENTS_QUERY = `
    SELECT date, ARRAY_AGG(id) AS ids, ARRAY_AGG(event_num) AS event_nums
    FROM events
    GROUP BY date ORDER BY date
`;

const SELECT_EVENT_INFO_QUERY = eventId => `
    SELECT event_num, date, (
      SELECT JSON_AGG(agg1) FROM (
        SELECT winner_id, p1.name AS winner_name, loser_id, p2.name AS loser_name, winner_score, loser_score, rating_change
        FROM matches
        INNER JOIN players p1 ON winner_id=p1.id
        INNER JOIN players p2 ON loser_id=p2.id
        WHERE event_id=${eventId}
      ) AS agg1
    ) AS matches, (
      SELECT JSON_AGG(agg2) FROM (
        SELECT player_id, name, rating_before, rating_after
        FROM player_histories
        INNER JOIN players ON player_id=id
      ) AS agg2
    ) AS ratings
    FROM events
    WHERE id=${eventId}
`;

const SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY = date => `
    SELECT ph2.player_id as id, ph1.rating_after as rating
    FROM (
      SELECT player_id, MAX(ph.date) as max_date
      FROM player_histories ph
      INNER JOIN events e on e.id=ph.event_id
      WHERE ph.date < '${date}'
      GROUP BY player_id
    ) as ph2
    INNER JOIN player_histories ph1 ON ph1.date=ph2.max_date AND ph1.player_id=ph2.player_id
`;

// In the case of inserting an event, the target eventId will already be calculated so we need to ignore it
const SELECT_FUTURE_EVENT_IDS_WITH_EVENT_ID_QUERY = (eventDate, eventId) => `
  SELECT id
  FROM events
  WHERE date >= '${eventDate}' AND id != ${eventId}
  ORDER BY date ASC, event_num ASC
`;

// In the case of updating an event, the target eventId will NOT be calculated so we need to calculate it
const SELECT_FUTURE_EVENT_IDS_WITHOUT_EVENT_ID_QUERY = eventDate => `
  SELECT id
  FROM events
  WHERE date >= '${eventDate}'
  ORDER BY date ASC, event_num ASC
`;

const SELECT_EVENT_MATCHES_QUERY = id => `
  SELECT winner_id, loser_id, winner_score, loser_score
  FROM matches
  WHERE event_id=${id}
`;

const INSERT_INTO_EVENTS_QUERY = (eventNum, eventDate) => `
  INSERT INTO events (event_num, date)
  VALUES ('${eventNum}','${eventDate}')
  RETURNING id
`;

const INSERT_INTO_MATCHES_QUERY = formattedMatches =>
  format(
    `
      INSERT INTO matches (event_id, winner_id, loser_id, winner_score, loser_score, rating_change)
      VALUES %s
    `,
    formattedMatches
  );

const INSERT_INTO_PLAYER_HISTORIES_QUERY = formattedPlayersHistories => {
  const temp = format(
    `
      INSERT INTO player_histories (player_id, event_id, date, rating_before, rating_after)
      VALUES %s
    `,
    formattedPlayersHistories
  );
  console.log(temp);
  return temp;
}

const INSERT_INTO_PLAYERS_QUERY = (playerName, playerRating) => `
  INSERT INTO players (name, rating, active)
  VALUES ('${playerName}', ${playerRating}, TRUE)
  RETURNING id
`;

const UPDATE_MATCHES_QUERY = formattedMatches =>
  format(
    `
      UPDATE matches m
      SET winner_id=updated_m.winner_id, loser_id=updated_m.loser_id, winner_score=updated_m.winner_score, loser_score=updated_m.loser_score, rating_change=updated_m.rating_change
      FROM (VALUES %s) AS updated_m (event_id, winner_id, loser_id, winner_score, loser_score, rating_change)
      WHERE m.event_id=updated_m.event_id
    `,
    formattedMatches
  );

const UPDATE_EVENTS_QUERY = (eventId, eventNum, eventDate) => `
  UPDATE events
  SET event_num='${eventNum}', date='${eventDate}'
  WHERE id=${eventId}
`;

const UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY = formattedPlayersHistories =>
  format(
    `
      UPDATE player_histories ph
      SET player_id=updated_ph.player_id, rating_before=updated_ph.rating_before, rating_after=updated_ph.rating_after
      FROM (VALUES %s) AS updated_ph(player_id, event_id, rating_before, rating_after)
      WHERE ph.event_id=updated_ph.event_id
    `,
    formattedPlayersHistories
  );

const UPDATE_PLAYER_HISTORIES_WITH_DATE_QUERY = formattedPlayersHistories =>
  format(
    `
      UPDATE player_histories ph
      SET player_id=updated_ph.player_id, date=updated_ph.date, rating_before=updated_ph.rating_before, rating_after=updated_ph.rating_after
      FROM (VALUES %s) AS updated_ph(player_id, event_id, date, rating_before, rating_after)
      WHERE ph.event_id=updated_ph.event_id
    `,
    formattedPlayersHistories
  );

const UPDATE_PLAYERS_QUERY = formattedPlayers => {
  console.log(formattedPlayers)
  return format(
    `
      UPDATE players p SET rating=updated_p.rating FROM (VALUES %s) AS updated_p(id, rating) WHERE p.id=updated_p.id
    `,
    formattedPlayers
  );
}

module.exports = {
  DEFAULT_DATE,
  SELECT_PLAYERS_QUERY,
  SELECT_PLAYER_INFO_QUERY,
  SELECT_EVENTS_QUERY,
  SELECT_EVENT_INFO_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY,
  SELECT_FUTURE_EVENT_IDS_WITH_EVENT_ID_QUERY,
  SELECT_FUTURE_EVENT_IDS_WITHOUT_EVENT_ID_QUERY,
  SELECT_EVENT_MATCHES_QUERY,
  INSERT_INTO_EVENTS_QUERY,
  INSERT_INTO_MATCHES_QUERY,
  INSERT_INTO_PLAYER_HISTORIES_QUERY,
  INSERT_INTO_PLAYERS_QUERY,
  UPDATE_MATCHES_QUERY,
  UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY,
  UPDATE_PLAYER_HISTORIES_WITH_DATE_QUERY,
  UPDATE_PLAYERS_QUERY,
  UPDATE_EVENTS_QUERY,
};
