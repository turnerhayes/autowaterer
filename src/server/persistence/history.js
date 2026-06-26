const fs = require('fs').promises;
const path = require('node:path');
const pool = require('./connection');


module.exports.dropTable = async (
    {
        client = null,
    } = {}
) => {
    const query = `
      DROP TABLE IF EXISTS history;
    `;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.truncate = async (
    {
        client = null,
    } = {}
) => {
    const query = `TRUNCATE TABLE history;`;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.insertHistory = async (
    {
        client = null,
        timestamp,
        moisture_pct,
        did_water,
    }
) => {
    const query = `
      INSERT INTO history (timestamp, moisture_pct, did_water)
      VALUES ($1, $2, $3)
      ON CONFLICT (timestamp) DO NOTHING;
    `;
    const instance = client || pool;
    await instance.query(query, [timestamp, moisture_pct, did_water]);
};

module.exports.insertHistoryLines = async (
    {
        client = null,
        historyLines,
    }
) => {
    const valueParams = historyLines.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');

    const query = `
      INSERT INTO history (timestamp, moisture_pct, did_water)
      VALUES ${valueParams}
      ON CONFLICT (timestamp) DO NOTHING;
    `;

    const instance = client || pool;
    const result = await instance.query(query, historyLines.flatMap(line => [new Date(line.timestamp), line.moisture_pct, line.did_water])    );

    return result.rowCount;
};

module.exports.getHistory = async (
    {
        limit = null,
        client = null,
    } = {}
) => {
    let query = `
      SELECT * FROM history
      ORDER BY timestamp DESC
    `;
    if (limit !== null) {
        query += ` LIMIT $1`;
    }

    const instance = client || pool;

    const result = await instance.query(query, limit !== null ? [limit] : []);
    return result.rows;
};

module.exports.getLatestEntryTimestamp = async (
    {
        client = null,
    } = {}
) => {
    const query = `
      SELECT timestamp FROM history
      ORDER BY timestamp DESC
      LIMIT 1;
    `;

    const instance = client || pool;
    const result = await instance.query(query);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].timestamp;
};

