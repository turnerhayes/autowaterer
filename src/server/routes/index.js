require('../env');

const express = require('express');
const cors = require('cors');
const { getHistory } = require('../persistence/history');
const { syncHistory, syncSettings } = require('../sync');
const { getLastHistorySyncTimestamp, getLastSettingsSyncTimestamp, setLastSettingsSyncTimestamp } = require('../persistence/sync_state');
const { getSettings } = require('../persistence/settings');


const maxSettingsSyncAgeMsString = process.env.MAX_SETTINGS_SYNC_AGE_MS;

if (!maxSettingsSyncAgeMsString) {
    throw new Error('MAX_SETTINGS_SYNC_AGE_MS environment variable is not set');
}

const maxSettingsSyncAgeMs = parseInt(maxSettingsSyncAgeMsString, 10);

if (isNaN(maxSettingsSyncAgeMs)) {
    throw new Error('MAX_SETTINGS_SYNC_AGE_MS environment variable must be a valid integer');
}

const router = express.Router();
router.use(cors());

const prepareEntry = (entry) => ({
    ...entry,
    timestamp: entry.timestamp.getTime(),
});

router.get('/history', async (req, res) => {
    const limitStr = req.query.limit?.trim();

    const limit = limitStr ? Number(limitStr) : null;

    if (Number.isNaN(limit)) {
        res.status(400).json({error: `limit query parameter must be a number`});
        return;
    }
    const [history, lastSyncTimestamp] = await Promise.all([
        getHistory({
            limit,
        }),
        getLastHistorySyncTimestamp(),
    ]);
    res.json({
        history: history.map(prepareEntry),
        lastSyncTimestamp,
    });
});

router.route('/sync').get(async (req, res) => {
    try {
        const lastSyncTimestamp = await getLastHistorySyncTimestamp();
        res.json(lastSyncTimestamp);
    } catch (error) {
        console.error('Error fetching last sync timestamp:', error);
        res.status(500).json({ error: 'Failed to fetch last historysync timestamp' });
    }
}).post(async (req, res) => {;
    try {
        await syncHistory();
        res.sendStatus(200);
    } catch (error) {
        console.error('Error syncing history:', error);
        res.status(500).json({ error: 'Failed to sync history' });
    }
});

router.get('/settings', async (req, res) => {
    let lastSettingsSyncTimestamp = await getLastSettingsSyncTimestamp();
    const now = Date.now();
    let settings;
    if (!lastSettingsSyncTimestamp || (now - lastSettingsSyncTimestamp) >= maxSettingsSyncAgeMs) {
        settings = await getSettings();
    }
    try {
        console.log("Syncing settings from MCU...");
        await syncSettings();
    }
    catch (error) {
        console.error('Error syncing settings from MCU:', error);
    }
    try {
        settings = await getSettings(settings);
        try {
            lastSettingsSyncTimestamp = now;
            await setLastSettingsSyncTimestamp(now);
        } catch (error) {
            console.error('Error updating setting sync timestamp:', error);
        }
    }
    catch (error) {
        console.error('Error syncing settings from MCU:', error);
        res.status(500).json({ error: 'Failed to sync settings from MCU' });
        return;
    }
    res.json({
        settings: Object.keys(settings).reduce((obj, key) => {
            const val = Number(settings[key]);
            if (isNaN(val)) {
                console.error(`Invalid value for setting "${key}":`, settings[key]);
            }
            else {
                obj[key] = val;
            }
            return obj;
        }, {}),
        lastSettingsSyncTimestamp,
    });
});

router.get('/settings/:key', async (req, res) => {
    const key = req.params.key;
    try {
        const settings = await getSettings();
        if (key in settings) {
            res.json({ key, value: settings[key] });
        } else {
            res.status(404).json({ error: `Setting with key "${key}" not found` });
        }
    } catch (error) {
        console.error(`Error fetching setting with key "${key}":`, error);
        res.status(500).json({ error: 'Failed to fetch setting' });
    }
});

module.exports = router;
