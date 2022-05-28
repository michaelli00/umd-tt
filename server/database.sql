-- creating the database called league
create database league;

-- creating the relations
create table ratings (
    player_id serial primary key,
    player_name varchar(30),
    rating integer,
    active boolean
);

create table events (
    event_id integer primary key, -- prob should be serial
    event_name varchar(100) not null,
    event_date date not null default current_date
);

create table matches (
    event_id integer primary key,
    winner_id integer,
    loser_id integer,
    winner_score integer,
    loser_score integer,
    rating_diff integer
);


-- inserting some values for testing
insert into ratings (player_name, rating, active) values ('yash', 2400, TRUE), ('michael', 300, TRUE), ('chris', 400, TRUE);