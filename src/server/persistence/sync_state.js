const path = require('node:path');
const fs = require('node:fs/promises');

const LAST_HISTORY_SYNC_FILE_PATH = path.join(__dirname, 'last_history_sync_timestamp.txt');
const LAST_SETTINGS_SYNC_FILE_PATH = path.join(__dirname, 'last_settings_sync_timestamp.txt');


module.exports.setLastHistorySyncTimestamp = async (timestamp) => {
    await fs.writeFile(LAST_HISTORY_SYNC_FILE_PATH, String(timestamp));
};

module.exports.getLastHistorySyncTimestamp = async () => {
    try {
        await fs.access(LAST_HISTORY_SYNC_FILE_PATH);
        const timestampStr = await fs.readFile(LAST_HISTORY_SYNC_FILE_PATH, 'utf-8');
        if (!timestampStr) {
            console.error('Last history sync timestamp file is empty');
            return null;
        }
        const timestamp = Number(timestampStr);
        if (isNaN(timestamp)) {
            console.error('Invalid timestamp in last history sync file:', timestampStr);
            return null;
        }
        return timestamp;
    }
    catch (error) {
        // File doesn't exist or is not accessible
        return null;
    }
};

module.exports.setLastSettingsSyncTimestamp = async (timestamp) => {
    await fs.writeFile(LAST_SETTINGS_SYNC_FILE_PATH, String(timestamp));
};

module.exports.getLastSettingsSyncTimestamp = async () => {
    try {
        await fs.access(LAST_SETTINGS_SYNC_FILE_PATH);
        const timestampStr = await fs.readFile(LAST_SETTINGS_SYNC_FILE_PATH, 'utf-8');
        if (!timestampStr) {
            console.error('Last settings sync timestamp file is empty');
            return null;
        }
        const timestamp = Number(timestampStr);
        if (isNaN(timestamp)) {
            console.error('Invalid timestamp in last settings sync file:', timestampStr);
            return null;
        }
        return timestamp;
    }
    catch (error) {
        // File doesn't exist or is not accessible
        return null;
    }
};