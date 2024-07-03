\c league

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
