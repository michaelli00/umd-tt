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
// returns { "list" : [ {"pid" : player_ID, "pname" : player_name, "pr" : rating, "active" : active}, ... ] }
app.get('/api/players', (req, res) => {
    pool.query("select player_id as pid, player_name as pname, rating as pr, active from ratings order by rating desc, player_id asc", (err, results) => {
        // console.log("results:\n"+JSON.stringify(results.rows)+"\n\n\n");
        if (err) { /*console.log("hey there was an error: \n" + err);*/ res.status(500).send("something went wrong"); return;}
        let result = {"list": results.rows}
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
        if (err) { /*console.log("hey there was an error: \n" + err);*/ res.status(500).send("something went wrong"); return;}
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
    let result = {"matches" : [], "ratings" : [], "ename" : "", "edate" : ""};
    
    // adding the event name and date to the result
    pool.query(`select event_name, event_date from events where event_id=${req.params.event_id}`, (err,results) => {
        if (err) { /*console.log("hey there was an error: \n" + err);*/ res.status(500).send("something went wrong"); return;}
        // console.log(results.rows[0]["event_name"]+"\n"+results.rows[0]["event_date"].toISOString().split("T")[0])
        result["ename"] = results.rows[0]["event_name"];
        result["edate"] = results.rows[0]["event_date"].toISOString().split("T")[0];
    });

    // adding the matches to the result
    pool.query(`select m.winner_id, m.loser_id, m.winner_score, m.loser_score, r1.player_name as winner_name, r2.player_name as loser_name from (matches m join ratings r1 on m.winner_id=r1.player_id) join ratings r2 on m.loser_id=r2.player_id where m.event_id=${req.params.event_id}`, (err,results) => {
        if (err) { /*console.log("hey there was an error: \n" + err);*/ res.status(500).send("something went wrong"); return;}
        result["matches"] = results.rows;
        console.log(result);
        // res.status(200).json(result);
    });

    // adding the ratings to the result
    // pool.query()
    // for each player, sum up all the rating_diff for all past events (making the assumption that event id's are absolutely increasing) for every time player id = winner id, and subtract from that the sum of rating_diff from all past events for whenever player id = loser id
    // sum(select rating_diff from matches where event_id<${req.params.event_id} and player_id=winner_id) - sum(select rating_diff from matches where event_id<${req.params.event_id} and player_id=loser_id) as rating_before group by player_id
    // console.log(result);
    res.status(200).json(result);
});

/////////////////////////////

app.listen(5000, () => {
    console.log('server started on port 5000');
});

