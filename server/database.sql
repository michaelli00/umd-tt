CREATE DATABASE league;

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30),
  rating INTEGER,
  active BOOLEAN
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_num INTEGER,
  date_time TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

CREATE TABLE player_histories (
  player_id INTEGER REFERENCES players(id),
  event_id INTEGER REFERENCES events(id),
  date_time TIMESTAMP WITHOUT TIME ZONE,
  rating_before INTEGER,
  rating_after INTEGER
);

CREATE TABLE matches (
  event_id INTEGER REFERENCES events(id),
  winner_id INTEGER REFERENCES players(id),
  loser_id INTEGER REFERENCES players(id),
  winner_score INTEGER,
  loser_score INTEGER,
  rating_change INTEGER
);

-- insert event
INSERT INTO events (id, event_num, date_time) VALUES (0, 0, '2000-01-01 00:00:00.00-05')
