const {initDb, dropTables} = require('./persistence/init_db');

(async () => {
    try {
        await dropTables();
        await initDb();
        console.log('Database initialized successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
})();
