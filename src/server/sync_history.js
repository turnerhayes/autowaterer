const { syncData } = require('./sync');

(async () => {
    try {
        await syncData();
        
        console.log('History sync complete');
    }
    catch (error) {
        console.error('Error syncing history:', error);
    }
})();
