require('../env');

const pg = require('pg');

const connectionString = process.env.DB_CONNECTION_STRING;
if (!connectionString) {
  throw new Error('DB_CONNECTION_STRING environment variable is not set');
}

const pool = new pg.Pool({
  connectionString,
});

module.exports = pool;
