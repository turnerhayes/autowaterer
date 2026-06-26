const path = require("node:path");
const fs = require("node:fs/promises");
const { MCU_BASE_URL } = require('./mcu');

const LAST_PING_FILE_PATH = path.join(__dirname, 'last_healthy_ping_timestamp.txt');


module.exports.ping = async () => {
    try {
        const response = await fetch(`${MCU_BASE_URL}/ping`, {
            method: getUptime ? "GET" : "HEAD",
            signal: AbortSignal.timeout(5000),
        });
    
        if (!response.ok) {
            console.error(`Error pinging MCU: ${response.statusText} (${response.status})`);
            throw new Error(`Error pinging MCU`);
        }
    }
    catch (error) {
        if (error.name === "TimeoutError") {
            return false;
        }
    }

    return true;
};

module.exports.recordHealthyPing = async (timestamp) => {
    if (!timestamp) {
        timestamp = Date.now();
    }

    await fs.writeFile(LAST_PING_FILE_PATH, String(timestamp));
};

module.exports.getLastHealthyPing = async () => {
    const contents = String(await fs.readFile(LAST_PING_FILE_PATH)).trim();

    if (!contents) {
        console.error(`${LAST_PING_FILE_PATH} is empty`);
        await fs.rm(LAST_PING_FILE_PATH);
    }

    const timestamp = Number(contents);

    if (Number.isNaN(timestamp)) {
        throw new Error(`Last healthy ping value is not a valid number: ${contents}`);
    }

    return timestamp;
};
