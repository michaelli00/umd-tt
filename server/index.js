const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const get_points_exchanged = require('./rating_algo');

const port = process.env.PORT || 5000;

// middleware
app.use(express.static(path.join(__dirname, '../build')));
app.use(cors());
app.use(express.json());

// routes

// returns the id, name and rating of each player
// returns { "players" : [ {"pid" : player_ID, "pname" : player_name, "pr" : rating, "active" : active}, ... ] }
app.get('/api/players', (req, res) => {
  pool.query(
    'SELECT player_id as pid, player_name as pname, rating as pr, active FROM ratings ORDER BY active desc, rating desc, player_id asc',
    (err, results) => {
      if (err) {
        res.status(500).send('GET players list errored');
        return;
      }
      let toRet = { players: results.rows };
      res.status(200).json(toRet);
    }
  );
});

// returns all the information for a single player given the player id
// returns { "pid" : player_ID, "pname" : player_name, "pr" : rating, "active": active, events : [{ "eid" : event_id, "ename" : event_name, "edate" : event_date, "rating_before" : rating_before, "rating_after" : rating_after }, ... ] }
app.get('/api/player/:id', (req, res) => {
  const toRet = { pid: -1, pname: '', pr: -1, active: false, events: [] };
  // getting the name, id and current rating
  pool.query(
    `SELECT * from ratings WHERE player_id=${req.params.id}`,
    (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('GET player information errored');
        return;
      }
      toRet['pid'] = results.rows[0]['player_id'];
      toRet['pname'] = results.rows[0]['player_name'];
      toRet['pr'] = results.rows[0]['rating'];
      toRet['active'] = results.rows[0]['active'];
    }
  );

  // getting event information
  //
  pool.query(
    `drop table if exists temp;
    create temporary table temp (eid integer,ename varchar(255),edate varchar(10),rating_before integer,rating_after integer);
    do
    $$
    declare
        f record;
    begin

        for f in (
            with events (eid, ename, edate) as (
                select distinct event_id,event_name,event_date
                from (
                    select e.event_name, e.event_id,e.event_date,m.winner_id, m.loser_id
                    from events e join matches m
                    on m.winner_id=${req.params.id} or m.loser_id=${req.params.id}
                    where e.event_id in (select distinct event_id from matches)
                ) as temp
            ) select eid,ename,edate from events order by eid asc
        )
        loop
            insert into temp select f.eid, f.ename,f.edate,coalesce((select sum(rating_diff) from matches m where winner_id=${req.params.id} and m.event_id<f.eid),0) - coalesce((select sum(rating_diff) from matches m where loser_id=${req.params.id} and m.event_id<f.eid),0) as rating_before, coalesce((select sum(rating_diff) from matches m where winner_id=${req.params.id} and m.event_id<=f.eid),0) - coalesce((select sum(rating_diff) from matches m where loser_id=${req.params.id} and m.event_id<=f.eid),0) as rating_after;

        end loop;
    end;
    $$;
    select * from temp;`,
    (err, results) => {
      if (err) {
        res.status(500).send('GET player information errored');
        return;
      }
      toRet['events'] = results[3].rows;
      res.status(200).json(toRet);
    }
  );
  // res.status(200).json(result);
});

// returns all the unique dates for all the events
// returns { "dates" : [ date1, date2, ... ] }
app.get('/api/dates', (req, res) => {
  pool.query(
    'select distinct event_date from events order by event_date asc',
    (err, results) => {
      if (err) {
        res.status(500).send('GET dates errored');
        return;
      }
      let toRet = { dates: [] };
      if (results) {
        for (let row of results.rows) {
          toRet['dates'].push(row['event_date'].toISOString().split('T')[0]);
        }
      }
      res.status(200).json(toRet);
    }
  );
});

// returns all events group by date
// returns { "all_events" : [ { "date" : event_date, "events" : [ "eid" : event_id, "ename" : event_name ] } ] }
app.get('/api/events', (req, res) => {
  pool.query(
    'select event_date, array_agg(event_id) as ids, array_agg(event_name) as names from events group by event_date order by event_date',
    (err, results) => {
      if (err) {
        res.status(500).send('GET events errored');
        return;
      }
      let toRet = { all_events: [] };
      if (results) {
        for (let row of results.rows) {
          toRet['all_events'].push({
            date: row['event_date'].toISOString().split('T')[0],
            events: row['ids'].map((e, i) => ({
              eid: e,
              ename: row['names'][i],
            })),
          });
        }
      }
      res.status(200).json(toRet);
    }
  );
});

// returns all the information for a specific event given event id
// returns { "matches" : [ { "winner_id" : winner_id, "winner_name" : winner_name, "loser_id" : loser_id,
// “loser_name” : loser_name, "winner_score" : winner_score, "loser_score" : loser_score, "points_exchanged": points_exchanged}, ... ],
// "ratings" : [ { "pid" : player_id, "pname" : player_name, "rating_before" : rating_before,
// "rating_after" : rating_after }, ... ], “ename”: event_name, “edate”: event_date }
app.get('/api/event/:event_id', (req, res) => {
  let toRet = { matches: [], ratings: [], ename: '', edate: '' };

  // adding the event name and date to the result
  pool.query(
    `select event_name, event_date from events where event_id=${req.params.event_id}`,
    (err, results) => {
      if (err) {
        res.status(500).send('GET event information errored');
        return;
      }
      toRet['ename'] = results.rows[0]['event_name'];
      toRet['edate'] = results.rows[0]['event_date']
        .toISOString()
        .split('T')[0];
    }
  );

  // adding the matches to the result
  pool.query(
    `select m.winner_id, m.loser_id, m.winner_score, m.loser_score, r1.player_name as winner_name, r2.player_name as loser_name, m.rating_diff from (matches m join ratings r1 on m.winner_id=r1.player_id) join ratings r2 on m.loser_id=r2.player_id where m.event_id=${req.params.event_id}`,
    (err, results) => {
      if (err) {
        res.status(500).send('GET event information errored');
        return;
      }
      toRet['matches'] = results.rows;
      // res.status(200).json(result);
    }
  );

  // adding the ratings to the result
  // for each player, sum up all the rating_diff for all past events - assuming that event id's are absolutely increasing (earliest events always entered first) - for every time player id = winner id, and subtract from that the sum of rating_diff from all past events for whenever player id = loser id
  // sum(select rating_diff from matches where event_id<${req.params.event_id} and player_id=winner_id) - sum(select rating_diff from matches where event_id<${req.params.event_id} and player_id=loser_id) as rating_before group by player_id
  // with players (pid, pname) as (select distinct player_id,player_name from (select r.player_name, r.player_id,m.winner_id, m.loser_id from ratings r join matches m on r.player_id=m.winner_id or r.player_id=m.loser_id) as temp) select * from players order by pid asc;
  // select sum(m1.rating_diff)-sum(m2.rating_diff) as tot_diff from matches m1 full outer join matches m2 on m1.winner_id=m2.loser_id;
  pool.query(
    `drop table if exists temp;
    create temporary table temp (pid integer,pname varchar(255),rating_before integer,rating_after integer);
    do
    $$
    declare
        f record;
    begin
        for f in (with players (pid, pname) as (
            select distinct player_id,player_name
            from (
                select r.player_name, r.player_id,m.winner_id, m.loser_id
                from ratings r join matches m
                on r.player_id=m.winner_id or r.player_id=m.loser_id
                where m.event_id=${req.params.event_id}
            ) as temp
        ) select pid,pname from players order by pid asc)
        loop
            insert into temp select f.pid, f.pname, coalesce((select sum(rating_diff) from matches m where winner_id=f.pid and m.event_id<${req.params.event_id}),0) - coalesce((select sum(rating_diff) from matches m where loser_id=f.pid and m.event_id<${req.params.event_id}),0) as rating_before, coalesce((select sum(rating_diff) from matches m where winner_id=f.pid and m.event_id<=${req.params.event_id}),0) - coalesce((select sum(rating_diff) from matches m where loser_id=f.pid and m.event_id<=${req.params.event_id}),0) as rating_after;
        end loop;
    end;
    $$;
    select * from temp;`,
    (err, results) => {
      if (err) {
        res.status(500).send('GET event information errored');
        return;
      }
      toRet['ratings'] = results[3].rows;
      res.status(200).json(toRet);
    }
  );
});

// takes { "edate" : event_date, "ename" : event_name,
//   “matches” : [ { "winner_id" : winner_id, "loser_id" : loser_id,
//   "winner_score" : winner_score, "loser_score" : loser_score }, ... ] }
// calculates the new ratings and updates the database
app.post('/api/admin/add_event', async (req, res) => {
  let event = { event_id: -1, matches: '', ratings: '' };
  // adding event name and date to the events table
  let results = await pool.query(
    `insert into events (event_name,event_date) values ('${req.body['ename']}','${req.body['edate']}'); select max(event_id) as m from events;` /*, (err,results) => {
        // if (err) { /*console.log("hey there was an error: \n" + err);* res.status(500).send("something went wrong"); return;}
        // console.log("\n\n"+err+"\n\n"+results);
        // event.event_id = await results[1].rows[0]['m'];
        // console.log(event);
    }*/
  );
  event.event_id = await results[1].rows[0]['m'];

  for (let match of req.body['matches']) {
    results = await pool.query(
      `select rating from ratings where player_id=${match['winner_id']}; select rating from ratings where player_id=${match['loser_id']};`
    ); //, async (err,results) => {
    let wr = parseInt(results[0].rows[0]['rating']);
    let lr = parseInt(results[1].rows[0]['rating']);
    let pts_ex = get_points_exchanged(wr, lr, 1);
    // console.log(wr,lr,pts_ex)
    // console.log(event)
    // add all the info as another row in the matches array
    event.matches += `(${event.event_id}, ${match['winner_id']}, ${match['loser_id']}, ${match['winner_score']}, ${match['loser_score']}, ${pts_ex}), `;

    // update both players' ratings in the ratings_arr array
    event.ratings += `(${match['winner_id']}, ${wr + pts_ex}), (${
      match['loser_id']
    }, ${wr + pts_ex}), `;
  }
  // console.log(`insert into matches values ${event.matches.substring(0,event.matches.length-2)}`)
  results = await pool.query(
    `insert into matches values ${event.matches.substring(
      0,
      event.matches.length - 2
    )}`
  ); //,(err,results) => {
  // console.log(results);
  // });

  results = await pool.query(`
    update ratings as r set
        rating = r2.new_rating
    from (values
        ${event.ratings.substring(0, event.ratings.length - 2)}
    ) as r2 (pid,new_rating)
    where r.player_id=r2.pid
    `); //, (err,results) => {console.log(err+"\n\n"+results)})

  pool.query(
    'select event_date, array_agg(event_id) as ids, array_agg(event_name) as names from events group by event_date order by event_date',
    (err, results) => {
      if (err) {
        res.status(500).send('POST new event errored');
        return;
      }
      let toRet = { all_events: [] };
      if (results) {
        for (let row of results.rows) {
          toRet['all_events'].push({
            date: row['event_date'].toISOString().split('T')[0],
            events: row['ids'].map((e, i) => ({
              eid: e,
              ename: row['names'][i],
            })),
          });
        }
      }
      res.status(200).json(toRet);
    }
  );
});

// add new players to the database so they can be selected for matches
// { "players" : [ { "pname" : player_name, "init_rating" : initial_rating }, ... ] }
app.post('/api/admin/add_new_players', (req, res) => {
  let s = '';
  for (let player of req.body['players']) {
    s +=
      "(DEFAULT,'" +
      player['pname'] +
      "'," +
      player['init_rating'] +
      ',TRUE), ';
  }
  pool.query(
    `insert into ratings values ${s.substring(0, s.length - 2)}`,
    (err, results) => {
      if (err) {
        res.status(500).send('POST new players errored');
        return;
      }
      pool.query(
        'SELECT player_id as pid, player_name as pname, rating as pr, active FROM ratings ORDER BY active desc, rating desc, player_id asc',
        (err, results) => {
          if (err) {
            res.status(500).send('POST new players errored');
            return;
          }
          let toRet = { players: results.rows };
          res.status(200).json(toRet);
        }
      );
    }
  );
});

// update players' info
// { "players" : [ { "pid" : player_id, "pname" : player_name, "new_rating" : initial_rating, "active" : active }, ... ] }
app.put('/api/admin/update_players', (req, res) => {
  let s = '';
  for (let player of req.body['players']) {
    s += `(${player['pid']}, '${player['pname']}', ${player['rating']}, ${player['active']}), `;
  }
  pool.query(
    `
    update ratings as r set
        player_name = r2.pname,
        rating = r2.new_rating,
        active = r2.active
    from (values
        ${s.substring(0, s.length - 2)}
    ) as r2 (pid,pname,new_rating,active)
    where r.player_id=r2.pid
    `,
    (err, results) => {
      if (err) {
        res.status(500).send('PUT update players');
        return;
      }
      pool.query(
        'SELECT player_id as pid, player_name as pname, rating as pr, active FROM ratings ORDER BY active desc, rating desc, player_id asc',
        (err, results) => {
          if (err) {
            res.status(500).send('POST new players errored');
            return;
          }
          let toRet = { players: results.rows };
          res.status(200).json(toRet);
        }
      );
    }
  );
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

/////////////////////////////

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
