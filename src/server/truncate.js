const {truncate: truncateHistory} = require("./persistence/history");

(async () => {
    await truncateHistory();
    console.log("Truncated history");
})();