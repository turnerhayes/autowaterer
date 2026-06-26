const pool = require("./persistence/connection");
const {truncate: truncateHistory} = require("./persistence/history");
const {truncate: truncateSettings} = requore("./persistence/settings");
const {truncate: truncateLogs} = require("./persistence/logs");

(async () => {
    const client = await pool.connect();
    try {
        client.query("BEGIN TRANSACTION");
        await truncateHistory({
            client,
        });
        console.log("Truncated history");
        await truncateSettings({
            client,
        });
        console.log("Truncated settings");
        await truncateLogs({
            client,
        });
        console.log("Truncated logs");
        await client.query("COMMIT");
    }
    catch (ex) {
        console.error("Error truncating tables:", ex);
        await client.query("ROLLBACK");
    }
    finally {
        client.release();
    }
})();