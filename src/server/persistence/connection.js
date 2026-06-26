require('../env');

const pg = require('pg');

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;

if (!dbUser) {
  throw new Error("DB_USER environment variable not set");
}

if (!dbPassword) {
  throw new Error("DB_PASSWORD environment variable not set");
}

if (!dbName) {
  throw new Error("DB_NAME environment variable not set");
}

if (!dbHost) {
  throw new Error("DB_HOST environment variable not set");
}

const pool = new pg.Pool({
  user: dbUser,
  password: dbPassword,
  database: dbName,
  host: dbHost,
});

module.exports = pool;
