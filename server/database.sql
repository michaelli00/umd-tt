create database league;

create table players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30),
  rating INTEGER,
  active BOOLEAN
);

create table events (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

create table player_histories (
  player_id INTEGER REFERENCES players(id),
  event_id INTEGER REFERENCES events(id),
  rating_before INTEGER,
  rating_after INTEGER
);

create table matches (
  event_id INTEGER REFERENCES events(id),
  winner_id INTEGER REFERENCES players(id),
  loser_id INTEGER REFERENCES players(id),
  winner_score INTEGER,
  loser_score INTEGER,
  rating_change INTEGER
);


-- inserting some values for testing
insert into players (name, rating, active) values
('Yash Kapoor', 900, FALSE),
('Michael Li', 900, FALSE),
('Crystal Lin', 900, TRUE);

insert into events (name, date) values
('Group 1','2022-01-05');

insert into player_histories (player_id, event_id, rating_before, rating_after) values
(1, 1, 910, 900),
(2, 1, 890, 900);

insert into matches values
(1,1,2,3,0,2),
(1,1,3,3,0,5),
(1,2,3,4,1,9);
