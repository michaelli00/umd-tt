-- i have my instance of postgres set up with both username and password being postgres
-- so to interact with the database i use the following commands
-- psql -U postgres league     <-- league is the name of the database and should only be specified from the second time around, after you have created it using the command below
-- the first time u enter psql and create league you can exit and use the above command to get into it
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
    event_id serial primary key, 
    event_name varchar(100) not null,
    event_date date not null default current_date
);

create table matches (
    event_id integer,
    winner_id integer,
    loser_id integer,
    winner_score integer,
    loser_score integer,
    rating_diff integer
);


-- inserting some values for testing
insert into ratings (player_name, rating, active) values 
    ('yash', 2400, TRUE), ('michael', 300, TRUE), ('chris', 400, FALSE), ('jamie', 1600, TRUE);

insert into events (event_name,event_date) values
    ('test1','2022-01-01'), ('test2','2022-03-03'), ('test1-2','2022-01-01');

insert into matches values 
    (1,1,2,3,0,2), (1,1,3,3,0,5), (1,2,3,4,1,9), (1,4,1,3,2,8);