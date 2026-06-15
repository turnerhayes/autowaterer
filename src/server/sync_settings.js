const { syncSettings } = require('./sync');

(async () => {
    try {
        await syncSettings();
        
        console.log('Settings sync complete');
    }
    catch (error) {
        console.error('Error syncing settings:', error);
    }
})();
