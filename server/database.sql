create database league;

create table ratings(
    player_id serial primary key,
    player_name varchar(30),
    rating integer
);

create table event_times (
    event_date date primary key,
    event_id integer
);

create table event_matches (
    event_id integer primary key,
    winner_id integer,
    loser_id integer,
    score integer[]
);

create table event_ratings (
    event_id integer primary key,
    player_id integer,
    rating_before integer,
    rating_after integer
);
