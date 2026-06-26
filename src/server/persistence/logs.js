const pool = require('./connection');


module.exports.dropTable = async (
    {
        client = null,
    } = {}
) => {
    const query = `
      DROP TABLE IF EXISTS logs;
    `;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.truncate = async (
    {
        client = null,
    } = {}
) => {
    const query = `TRUNCATE TABLE logs;`;
    const instance = client || pool;
    await instance.query(query);
};

module.exports.addEntries = async (
    {
        entries,
        client = null,
    }
) => {
    if (!Array.isArray(entries)) {
        throw new Error("entries argument must be an array of entries; was " + (typeof entries));
    }
    
    const valueParams = [];
    
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const numParams = valueParams.length * 5;
        if (!entry.receivedAt) {
            throw new Error(`Entry at index ${i} is missing "receivedAt" field`);
        }
        if (!entry.message) {
            throw new Error(`Entry at index ${i} is missing "message" field`);
        }
        if (!entry.level) {
            throw new Error(`Entry at index ${i} is missing "level" field`);
        }
        if (!entry.ms && !entry.timestamp) {
            throw new Error(`Entry at index ${i} is missing one of "ms" or "timestamp" fields`);
        }
        // Add params for each field
        valueParams.push(`($${numParams + 1}, $${numParams + 2}, $${numParams + 3}, $${numParams + 4}, $${numParams + 5})`);
    }
    
    const query = `
        INSERT INTO logs (timestamp, ms, received_at, level, message)
        VALUES ${valueParams.join(", ")};`;

    const values = entries.flatMap(
        (entry) => [
            entry.timestamp ? new Date(entry.timestamp) : undefined,
            entry.ms ?? undefined,
            new Date(entry.receivedAt),
            entry.level,
            entry.message,
        ]
    );
    const instance = client || pool;
    const result = await instance.query(query, values);
    return result.rowCount;
};

module.exports.addEntry = async (
    {
        entry,
        client = null,
    }
) => module.exports.addEntries({
    entries: [entry],
    client,
});

module.exports.getEntries = async (
    {
        client = null,
    } = {}
) => {
    const query = `
        SELECT timestamp, ms, level, message, received_at FROM logs
        ORDER BY received_at ASC
    `;

    const instance = client || pool;
    const result = await instance.query(query);

    return result.rows.map((row) => ({
        timestamp: row.timestamp?.getTime(),
        ms: row.ms,
        level: row.level,
        message: row.message,
        receivedAt: row.received_at.getTime(),
    }));
};

module.exports.clearEntriesBefore = async (
    {
        cutoffDate,
        client = null,
    }
) => {
    const query = `DELETE FROM logs WHERE received_at < $1`;
    const instance = client || pool;
    const result = await instance.query(query, cutoffDate);
    return result.rowCount;
};
