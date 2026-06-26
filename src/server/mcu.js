const MCU_IP_ADDRESS = '192.168.86.200';
module.exports.MCU_IP_ADDRESS = MCU_IP_ADDRESS;

const MCU_BASE_URL = `http://${MCU_IP_ADDRESS}`;
module.exports.MCU_BASE_URL = MCU_BASE_URL;

module.exports.getMoisture = async () => {
    const response = await fetch(`${MCU_BASE_URL}/moisture`);

    if (!response.ok) {
        console.error(`Error fetching current moisture reading: `, {
            status: response.status,
            statusText: response.statusText,
        });
        throw new Error(`Error fetching current moisture reading`);
    }

    const moistureStr = (await response.text()).trim();

    if (!moistureStr) {
        throw new Error(`MCU did not send a number back`);
    }

    const moisture = Number(moistureStr);

    if (Number.isNaN(moisture)) {
        throw new Error(`MCU sent an invalid formatted response`);
    }

    return moisture;
};
