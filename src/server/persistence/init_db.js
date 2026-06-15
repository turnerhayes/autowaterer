const pool = require('./connection');
const {
    createTable: createHistoryTable,
    dropTable: dropHistoryTable
} = require('./history');
const {
    createTable: createSettingsTable,
    dropTable: dropSettingsTable
} = require('./settings');

module.exports.dropTables = async () => {
    const client = await pool.connect();
    client.query('BEGIN');
    try {
        await dropHistoryTable({ client });
        await dropSettingsTable({ client });
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
    const client = await pool.connect();
    client.query('BEGIN');
    try {
        await createHistoryTable({ client });
        await createSettingsTable({ client });
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
