const pool = require('./connection');

module.exports.createTable = async (
    {
        client = null,
    } = {}
) => {
    const query = `
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.dropTable = async (
    {
        client = null,
    } = {}
) => {
    const query = `
      DROP TABLE IF EXISTS settings;
    `;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.truncate = async (
    {
        client = null,
    } = {}
) => {
    const query = `TRUNCATE TABLE settings;`;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.getSettings = async (
    {
        client = null,
    } = {}
) => {
    const query = `SELECT key, value FROM settings;`;
    const instance = client || pool;
    const result = await instance.query(query);
    const settings = {};
    result.rows.forEach(row => {
        settings[row.key] = row.value;
    });
    return settings;
};

module.exports.getSetting = async (
    {
        client = null,
        key,
    }
) => {
    const query = `SELECT value FROM settings WHERE key = $1;`;
    const instance = client || pool;
    const result = await instance.query(query, [key]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].value;
}

module.exports.upsertSetting = async (
    {
        client = null,
        key,
        value,
    }
) => {
    const query = `
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;
    const instance = client || pool;
    await instance.query(query, [key, value]);
};

module.exports.upsertSettings = async (
    {
        client = null,
        settings,
    }
) => {
    const valueParams = Object.entries(settings).map(([key, _], index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');

    const query = `
      INSERT INTO settings (key, value)
      VALUES ${valueParams}
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    `;

    const instance = client || pool;
    await instance.query(query, Object.entries(settings).flatMap(([key, value]) => [key, value]));
};
