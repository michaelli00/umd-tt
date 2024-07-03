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
INSERT INTO events (event_num, date) VALUES (1, '2024-07-01');
INSERT INTO events (event_num, date) VALUES (2, '2024-08-01');
-- insert players
INSERT INTO players (name, rating, active) VALUES ('Player1', 1000, true);
INSERT INTO players (name, rating, active) VALUES ('Player2', 1250, true);
INSERT INTO players (name, rating, active) VALUES ('Player3', 1500, true);
-- insert matches
INSERT INTO matches (
  event_id, 
  winner_id, 
  loser_id, 
  winner_score, 
  loser_score, 
  rating_change
) VALUES (1, 1, 2, 2, 1, 5);
INSERT INTO matches (
  event_id, 
  winner_id, 
  loser_id, 
  winner_score, 
  loser_score, 
  rating_change
) VALUES (1, 3, 2, 2, 1, 5);
INSERT INTO matches (
  event_id, 
  winner_id, 
  loser_id, 
  winner_score, 
  loser_score, 
  rating_change
) VALUES (1, 3, 1, 2, 0, 5);
INSERT INTO matches (
  event_id, 
  winner_id, 
  loser_id, 
  winner_score, 
  loser_score, 
  rating_change
) VALUES (2, 1, 2, 2, 1, 5);
INSERT INTO matches (
  event_id, 
  winner_id, 
  loser_id, 
  winner_score, 
  loser_score, 
  rating_change
) VALUES (2, 3, 2, 2, 1, 5);
INSERT INTO matches (
  event_id, 
  winner_id, 
  loser_id, 
  winner_score, 
  loser_score, 
  rating_change
) VALUES (2, 1, 3, 2, 1, 5);
-- insert rating changes
INSERT INTO player_histories (
  player_id,
  event_id,
  date,
  rating_before,
  rating_after,
  adjusted_rating
) VALUES (1, 1, '2024-07-01', 1000, 1000, 1000);
INSERT INTO player_histories (
  player_id,
  event_id,
  date,
  rating_before,
  rating_after,
  adjusted_rating
) VALUES (2, 1, '2024-07-01', 1260, 1250, 1260);
INSERT INTO player_histories (
  player_id,
  event_id,
  date,
  rating_before,
  rating_after,
  adjusted_rating
) VALUES (3, 1, '2024-07-01', 1490, 1500, 1490);

INSERT INTO player_histories (
  player_id,
  event_id,
  date,
  rating_before,
  rating_after,
  adjusted_rating
) VALUES (1, 2, '2024-08-01', 1000, 1000, 1000);
INSERT INTO player_histories (
  player_id,
  event_id,
  date,
  rating_before,
  rating_after,
  adjusted_rating
) VALUES (2, 2, '2024-08-01', 1260, 1250, 1260);
INSERT INTO player_histories (
  player_id,
  event_id,
  date,
  rating_before,
  rating_after,
  adjusted_rating
) VALUES (3, 2, '2024-08-01', 1490, 1500, 1490);
