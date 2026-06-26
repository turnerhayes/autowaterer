const path = require('node:path');
const fs = require('node:fs/promises');
const pool = require('./connection');
const {
    dropTable: dropHistoryTable
} = require('./history');
const {
    dropTable: dropSettingsTable
} = require('./settings');
const {
    dropTable: dropLogsTable
} = require('./logs');

module.exports.dropTables = async () => {
    const client = await pool.connect();
    client.query('BEGIN');
    try {
        await dropHistoryTable({ client });
        await dropSettingsTable({ client });
        await dropLogsTable({ client });
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}

module.exports.initDb = async () => {
    const query = await fs.readFile(path.resolve("init_db.sql"));

    await pool.query(query);
};
