require('dotenv').config();
const Pool = require('pg').Pool;

const devConfig = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
}
const prodConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
}

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

const pool = new Pool(config);

module.exports = pool;
