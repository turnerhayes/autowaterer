const {parseArgs} = require('node:util');
const {initDb, dropTables} = require('./persistence/init_db');

const args = parseArgs({
    options: {
        drop: {
            type: "boolean",
            short: "d",
            default: false,
        },
    },
});

(async () => {
    try {
        if (args.values.drop) {
            console.log("Dropping tables");
            await dropTables();
        }
        await initDb();
        console.log('Database initialized successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
})();
