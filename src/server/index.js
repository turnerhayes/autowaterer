require('./env');

const express = require('express');
const app = express();
const port = process.env.API_PORT || 3001;

const { syncHistory } = require('./sync');
router = require('./routes');

app.use('/api', router);

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

app.listen(port, () => {
  console.log(`API server is running at http://localhost:${port}`);
});