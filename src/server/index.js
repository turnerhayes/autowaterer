require('./env');

const express = require('express');
const { attachLogger } = require('./log_stream.js');
const app = express();
const port = process.env.API_PORT || 3001;

const { syncHistory } = require('./sync');
const { ping, recordHealthyPing } = require('./heartbeat');
router = require('./routes');

app.use('/api', router);
attachLogger(app, {
});

const syncIntervalMsString = process.env.SYNC_INTERVAL_MS;

if (!syncIntervalMsString) {
    throw new Error('SYNC_INTERVAL_MS environment variable is not set');
}

const syncIntervalMs = parseInt(syncIntervalMsString, 10);

if (isNaN(syncIntervalMs)) {
    throw new Error('SYNC_INTERVAL_MS environment variable must be a valid integer');
}

setInterval(async () => {
    try {
        console.log('Starting history sync with MCU...');
        await syncHistory();
    }
    catch (error) {
        console.error('Error syncing history:', error);
    }
}, syncIntervalMs);

const heartbeatIntervalMs = process.env.HEARTBEAT_POLL_INTERVAL_MS ?
    Number(process.env.HEARTBEAT_POLL_INTERVAL_MS) :
    60000;

if (Number.isNaN(heartbeatIntervalMs)) {
    throw new Error(`HEARTBEAT_POLL_INTERVAL_MS environment variable is not a valid number: ${process.env.HEARTBEAT_POLL_INTERVAL_MS}`);
}

setInterval(async () => {
    try {
        const result = await ping();

        if (result) {
            await recordHealthyPing(Date.now());
        }
    }
    catch (error) {
        console.error("Error pinging MCU:", error);
    }
}, heartbeatIntervalMs);

app.listen(port, () => {
  console.log(`API server is running at http://localhost:${port}`);
});