CREATE DATABASE league;

\c league

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  rating INTEGER NOT NULL,
  active BOOLEAN NOT NULL
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_num INTEGER NOT NULL,
  date DATE NOT NULL
);

CREATE TABLE player_histories (
  player_id INTEGER REFERENCES players(id),
  event_id INTEGER REFERENCES events(id),
  date DATE NOT NULL,
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  adjusted_rating INTEGER
);

CREATE TABLE matches (
  event_id INTEGER REFERENCES events(id),
  winner_id INTEGER REFERENCES players(id),
  loser_id INTEGER REFERENCES players(id),
  winner_score INTEGER NOT NULL,
  loser_score INTEGER NOT NULL,
  rating_change INTEGER NOT NULL
);

-- insert event
INSERT INTO events (id, event_num, date) VALUES (0, 0, '2000-01-01');
