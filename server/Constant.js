const format = require('pg-format');

const APP_DOES_NOT_SUPPORT_MESSAGE =
  "App doesn't support updating event dates that have been adjusted";

const DUPLICATE_EVENT_NUM_MESSAGE = 'Event Group Number already exists for this date. Please select another group number or date';

const DEFAULT_DATE = `\'2000-01-01\'`;

const DELETE_PLAYER_HISTORIES_WITH_EVENT_ID_QUERY = `
  DELETE FROM player_histories
  WHERE event_id = $1
`;

const DELETE_MATCHES_WITH_EVENT_ID_QUERY = `
  DELETE FROM matches
  WHERE event_id = $1
`;

const SELECT_ALL_PLAYERS_QUERY = `
  SELECT id, name, rating, active FROM players
  ORDER BY active DESC, rating DESC, name ASC
`;

const SELECT_ACTIVE_PLAYERS_QUERY = `
  SELECT id, name, rating, active FROM players
  WHERE active = true
  ORDER BY active DESC, rating DESC, name ASC
`;

const SELECT_PLAYER_INFO_QUERY = `
  SELECT id, name, rating, active, (
    SELECT JSON_AGG(agg) FROM (
      SELECT id, event_num, events.date, rating_before, rating_after
      FROM player_histories
      INNER JOIN events ON player_histories.event_id = events.id
      WHERE player_histories.player_id = $1 AND event_num != 0
      ORDER BY events.date ASC, event_num ASC
    ) AS agg
  ) AS events
  FROM players
  WHERE id = $1
`;

const SELECT_PLAYER_INFO_WITH_LAST_EVENT_QUERY = `
  SELECT id, name, rating, active, (
    SELECT JSON_AGG(agg) FROM (
      SELECT id, event_num, events.date, rating_before, rating_after
      FROM player_histories
      INNER JOIN events ON player_histories.event_id = events.id
      WHERE player_histories.player_id = $1 AND id = (
        SELECT MAX(id)
        FROM events
        INNER JOIN player_histories ON event_id = id
        WHERE player_id = $1
      )
    ) AS agg
  ) AS events
  FROM players
  WHERE id = $1
`;

// pg-node converts dates to timesetamp so we convert the date to a string for ease of use
const SELECT_EVENTS_QUERY = `
  SELECT CAST(date AS VARCHAR), ARRAY_AGG(id) AS ids, ARRAY_AGG(event_num) AS event_nums
  FROM events
  WHERE event_num != 0
  GROUP BY date
  ORDER BY date DESC
`;

// Used for displaying event info
// pg-node converts dates to timesetamp so we convert the date to a string for ease of use
const SELECT_EVENT_INFO_WITH_PLAYER_NAMES_QUERY = `
  SELECT event_num, CAST(date AS VARCHAR), (
    SELECT JSON_AGG(agg1) FROM (
      SELECT winner_id, p1.name AS winner_name, loser_id, p2.name AS loser_name, winner_score, loser_score, rating_change
      FROM matches
      INNER JOIN players p1 ON winner_id = p1.id
      INNER JOIN players p2 ON loser_id = p2.id
      WHERE event_id = $1
    ) AS agg1
  ) AS matches, (
    SELECT JSON_AGG(agg2) FROM (
      SELECT player_id, name, rating_before, rating_after
      FROM player_histories
      INNER JOIN players ON player_id = id
      WHERE event_id = $1
    ) AS agg2
  ) AS ratings
  FROM events
  WHERE id = $1
`;

// Used for comparing if there are any changes in matches when updating and event
// pg-node converts dates to timesetamp so we convert the date to a string for ease of use
const SELECT_EVENT_INFO_WITHOUT_PLAYER_NAMES_QUERY = `
  SELECT event_num, CAST(date AS VARCHAR), (
    SELECT JSON_AGG(agg1) FROM (
      SELECT winner_id, loser_id, winner_score, loser_score
      FROM matches
      INNER JOIN players p1 ON winner_id = p1.id
      INNER JOIN players p2 ON loser_id = p2.id
      WHERE event_id = $1
    ) AS agg1
  ) AS matches, (
    SELECT JSON_AGG(agg2) FROM (
      SELECT player_id, name, rating_before, rating_after
      FROM player_histories
      INNER JOIN players ON player_id = id
      WHERE event_id = $1
    ) AS agg2
  ) AS ratings
  FROM events
  WHERE id = $1
`;

const SELECT_EVENTS_WITH_DATE_AND_EVENT_NUM_QUERY = `
  SELECT id
  FROM events
  WHERE date = $1 AND event_num = $2
`;

const SELECT_LATEST_PLAYER_RATINGS_QUERY = `
  SELECT ph2.player_id as id, ph1.rating_after, ph1.adjusted_rating
  FROM (
    SELECT player_id, MAX(ph.date) as max_date, MAX(ph.event_id)
    FROM player_histories ph
    INNER JOIN events e on e.id = ph.event_id
    GROUP BY player_id
  ) as ph2
  INNER JOIN player_histories ph1 ON ph1.date = ph2.max_date AND ph1.player_id = ph2.player_id
`;

const SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY = `
  SELECT ph2.player_id as id, ph1.rating_after, ph1.adjusted_rating
  FROM (
    SELECT player_id, MAX(ph.date) as max_date, MAX(ph.event_id)
    FROM player_histories ph
    INNER JOIN events e on e.id = ph.event_id
    WHERE ph.date < $1
    GROUP BY player_id
  ) as ph2
  INNER JOIN player_histories ph1 ON ph1.date = ph2.max_date AND ph1.player_id = ph2.player_id
`;

// In the case of inserting an event, the target eventId will already be calculated so we need to ignore it
// pg-node converts dates to timesetamp so we convert the date to a string for ease of use
const SELECT_FUTURE_EVENT_IDS_AND_DATES_EXCLUDING_EVENT_ID_QUERY = `
  SELECT id, CAST(date AS VARCHAR)
  FROM events
  WHERE date >= $1 AND id != $2 AND event_num != 0
  ORDER BY date ASC, event_num ASC
`;

// In the case of updating an event, the target eventId will NOT be calculated so we need to calculate it
// pg-node converts dates to timesetamp so we convert the date to a string for ease of use
const SELECT_FUTURE_EVENT_IDS_AND_DATES_QUERY = `
  SELECT id, CAST(date AS VARCHAR)
  FROM events
  WHERE date >= $1 AND event_num != 0
  ORDER BY date ASC, event_num ASC
`;

const SELECT_ADJUSTED_RATINGS_FROM_EVENT_ID_QUERY = `
  SELECT player_id, adjusted_rating
  FROM player_histories
  WHERE event_id = $1
`;

const SELECT_EVENT_MATCHES_QUERY = `
  SELECT winner_id, loser_id, winner_score, loser_score
  FROM matches
  WHERE event_id = $1
`;

const INSERT_INTO_EVENTS_QUERY = `
  INSERT INTO events (event_num, date)
  VALUES ($1, $2)
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

const INSERT_INTO_PLAYER_HISTORIES_QUERY = formattedPlayerHistories =>
  format(
    `
      INSERT INTO player_histories (player_id, event_id, date, rating_before, rating_after)
      VALUES %s
    `,
    formattedPlayerHistories
  );

const INSERT_INTO_PLAYERS_QUERY = `
  INSERT INTO players (name, rating, active)
  VALUES ($1, $2, TRUE)
  RETURNING id
`;

const UPDATE_EVENTS_QUERY = `
  UPDATE events
  SET event_num = $2, date = $3
  WHERE id = $1
`;

const UPDATE_PLAYER_INFO_QUERY = `
  UPDATE players
  SET name = $2, rating = $3, active = $4
  WHERE id = $1
`;

const UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY = `
  UPDATE player_histories ph
  SET rating_before = $3, rating_after = $4
  WHERE player_id = $1 AND ph.event_id = $2
`;

const UPDATE_PLAYER_HISTORIES_WITH_DATE_QUERY = `
  UPDATE player_histories ph
  SET date = $5, rating_before = $3, rating_after = $4
  WHERE player_id = $1 AND ph.event_id = $2
`;

const UPDATE_PLAYER_HISTORIES_WITH_ADJUSTED_RATING_QUERY = `
  UPDATE player_histories
  SET adjusted_rating = $3
  WHERE player_id = $1 AND event_id = $2
`;

// Keeping this since it doesn't involve dates
const UPDATE_PLAYER_QUERY = `
  UPDATE players p
  SET rating = $2
  WHERE p.id = $1
`;

const UPDATE_MATCHES_RATING_QUERY = formattedMatches =>
  format(
    `
      UPDATE matches m SET rating_change = updated_m.rating_change
      FROM (VALUES %s) AS updated_m (event_id, winner_id, loser_id, winner_score, loser_score, rating_change)
      WHERE m.event_id = updated_m.event_id AND m.winner_id = updated_m.winner_id AND m.loser_id = updated_m.loser_id AND m.winner_score = updated_m.winner_score AND m.loser_score = updated_m.loser_score
    `,
    formattedMatches
  );
module.exports = {
  APP_DOES_NOT_SUPPORT_MESSAGE,
  DUPLICATE_EVENT_NUM_MESSAGE,
  DEFAULT_DATE,
  DELETE_PLAYER_HISTORIES_WITH_EVENT_ID_QUERY,
  DELETE_MATCHES_WITH_EVENT_ID_QUERY,
  INSERT_INTO_EVENTS_QUERY,
  INSERT_INTO_MATCHES_QUERY,
  INSERT_INTO_PLAYER_HISTORIES_QUERY,
  INSERT_INTO_PLAYERS_QUERY,
  SELECT_ACTIVE_PLAYERS_QUERY,
  SELECT_ADJUSTED_RATINGS_FROM_EVENT_ID_QUERY,
  SELECT_ALL_PLAYERS_QUERY,
  SELECT_EVENT_INFO_WITH_PLAYER_NAMES_QUERY,
  SELECT_EVENT_INFO_WITHOUT_PLAYER_NAMES_QUERY,
  SELECT_EVENT_MATCHES_QUERY,
  SELECT_EVENTS_QUERY,
  SELECT_EVENTS_WITH_DATE_AND_EVENT_NUM_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATES_EXCLUDING_EVENT_ID_QUERY,
  SELECT_FUTURE_EVENT_IDS_AND_DATES_QUERY,
  SELECT_LATEST_PLAYER_RATINGS_QUERY,
  SELECT_PLAYER_INFO_QUERY,
  SELECT_PLAYER_INFO_WITH_LAST_EVENT_QUERY,
  SELECT_PLAYER_RATINGS_BEFORE_DATE_QUERY,
  UPDATE_EVENTS_QUERY,
  UPDATE_MATCHES_RATING_QUERY,
  UPDATE_PLAYER_HISTORIES_WITH_ADJUSTED_RATING_QUERY,
  UPDATE_PLAYER_HISTORIES_WITH_DATE_QUERY,
  UPDATE_PLAYER_HISTORIES_WITHOUT_DATE_QUERY,
  UPDATE_PLAYER_INFO_QUERY,
  UPDATE_PLAYER_QUERY,
};
