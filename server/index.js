const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./db');
const get_points_exchanged = require('./rating_algo');

// middleware
app.use(cors());
app.use(express.json());

// routes

// returns the id, name and rating of each player
// returns { "list" : [ {"pid" : player_ID, "pname" : player_name, "pr" : rating}, ... ] }
app.get('/api/players', (req, res) => {
    pool.query("select * from ratings where active=TRUE order by rating desc, player_id asc", (err, results) => {
        console.log("results:\n"+results+"\n\n\n");
        if (err) { console.log("hey there was an error: \n" + err); res.status(500).send("something went wrong"); return;}
        res.status(200).json(results.rows)
    });
});

// returns all the information for a single player given the player id
// returns { "pid" : player_ID, "pname" : player_name, "pr" : rating, events : [{ "eid" : event_id, "ename" : event_name, "rating_before" : rating_before, "rating_after" : rating_after }, ... ] }
app.get('/api/player/:id', (req, res) => {

});

// returns all the unique dates for all the events
// returns { "dates" : [ date1, date2, ... ] }
app.get('/api/dates', (req, res) => {

});

// returns all the information for a specific event given event id
// returns { "matches" : [ { "winner_id" : winner_id, "winner_name" : winner_name, "loser_id" : loser_id, 
// “loser_name” : loser_name, "winner_score" : winner_score, "loser_score" : loser_score }, ... ], 
// "ratings" : [ { "pid" : player_id, "pname" : player_name, "rating_before" : rating_before, 
// "rating_after" : rating_after }, ... ], “ename”: event_name, “edate”: event_date }
app.get('/api/event/:event_id', (req, res) => {

});

/////////////////////////////

app.listen(5000, () => {
    console.log('server started on port 5000');
});

