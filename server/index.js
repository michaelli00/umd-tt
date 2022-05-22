const express = require('express');
const app = express();
const cors = require('cors');
// const pool = require('./db');
const get_points_exchanged = require('./rating_algo');

// middleware
app.use(cors());
app.use(express.json());

// routes

// get player rating

// 

/////////////////////////////

app.listen(5000, () => {
    console.log('server started on port 5000');
});

