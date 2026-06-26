const { insertHistoryLines, getLatestEntryTimestamp } = require('./persistence/history');
const { upsertSettings } = require('./persistence/settings');
const { setLastHistorySyncTimestamp, setLastSettingsSyncTimestamp } = require('./persistence/sync_state');
const { MCU_BASE_URL } = require('./mcu');


const MCU_HISTORY_ENDPOINT = `${MCU_BASE_URL}/history`;

const MCU_SETTINGS_ENDPOINT = `${MCU_BASE_URL}/settings`;

module.exports.syncHistory = async () => {
    const lastEntryTimestamp = await getLatestEntryTimestamp();
    console.log('Latest entry timestamp in DB:', lastEntryTimestamp ?? 'None');
    const headers = {};
    if (lastEntryTimestamp) {
        headers['X-Since-Timestamp'] = lastEntryTimestamp;
    }
    const response = await fetch(MCU_HISTORY_ENDPOINT, {
        headers,
    });
    if (response.status === 304) {
        console.log('No new history data to sync from MCU');
        await setLastHistorySyncTimestamp(Date.now());
        return;
    }
    if (!response.ok) {
        console.error('Failed to fetch history data from MCU:', response.status, response.statusText);
        return;
    }
    const data = await response.json();

    if (!Array.isArray(data)) {
        console.error('Unexpected data format from MCU history endpoint:', data);
        return;
    }
    
    const numInserted = await insertHistoryLines({ historyLines: data.map(line => ({
        timestamp: line.timestamp * 1000, // Convert seconds (Unix timestamp) to milliseconds (JS timestamp)
        moisture_pct: line.moisture_pct,
        did_water: line.did_water,
    })) });

    console.log(`Synced ${numInserted} history lines from MCU`);

    await setLastHistorySyncTimestamp(Date.now());
};

module.exports.syncSettings = async function getSettings() {
    const response = await fetch(MCU_SETTINGS_ENDPOINT);

    if (!response.ok) {
        console.error('Failed to fetch settings from MCU:', response.status, response.statusText);
        return;
    }
    const data = await response.json();
    
    if (typeof data !== 'object' || data === null) {
        console.error('Unexpected data format from MCU settings endpoint:', data);
        return;
    }

    try {
        await upsertSettings({
            settings: data,
        });
        setLastSettingsSyncTimestamp(Date.now());
    }
    catch (error) {
        console.error('Error upserting settings into DB:', error);
        throw error;
    }
}

module.exports.updateSetting = async function updateSetting(key, value) {
    const response = await fetch(`${MCU_SETTINGS_ENDPOINT}/${key}`, {
        method: "POST",
        body: JSON.stringify(value),
    });

    if (response.ok) {
        await module.exports.syncSettings();
    }
}
