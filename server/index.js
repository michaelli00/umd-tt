const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path')
const pool = require('./db');
const get_points_exchanged = require('./rating_algo');

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../build')));

// routes

// TODO why can't we just return an array rather than access it through .list field
// returns the id, name and rating of each player
// returns { "list" : [ {"pid" : player_ID, "pname" : player_name, "pr" : rating, "active" : active}, ... ] }
app.get('/api/players', (req, res) => {
    pool.query("select player_id as pid, player_name as pname, rating as pr, active from ratings order by rating desc, player_id asc", (err, results) => {
        // console.log("results:\n"+JSON.stringify(results.rows)+"\n\n\n");
        if (err) { /*console.log("hey there was an error: \n" + err);*/ res.status(500).send("something went wrong"); return;}
        let result = results.rows;
        res.status(200).json(result)
    });
});

// returns all the information for a single player given the player id
// returns { "pid" : player_ID, "pname" : player_name, "pr" : rating, events : [{ "eid" : event_id, "ename" : event_name, "rating_before" : rating_before, "rating_after" : rating_after }, ... ] }
app.get('/api/player/:id', (req, res) => {
    // pool.query(``, (err, results) => {

    // });
    res.status(501).send("not implemented yet");
});

// returns all the unique dates for all the events
// returns { "dates" : [ date1, date2, ... ] }
app.get('/api/dates', (req, res) => {
    pool.query("select distinct event_date from events order by event_date asc", (err,results) => {
        // console.log("results:\n"+JSON.stringify(results.rows)+"\n");
        if (err) { console.log("hey there was an error: \n" + err); res.status(500).send("something went wrong"); return;}
        let result = {"dates": []}
        if (results) {
            for (let row of results.rows) {
                // console.log(JSON.stringify(row["event_date"]));
                result["dates"].push((row["event_date"].toISOString()).split("T")[0]);
            }
        }
        res.status(200).json(result)
    });
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

