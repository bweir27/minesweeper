/*eslint no-process-env:0*/

// Test specific configuration
// ===========================
module.exports = {
    // MongoDB connection options
    mongo: {
        useMongoClient: true,
        uri: 'mongodb://brianweirdevminesweeper-mongodb/brianweirdevminesweeper-test'
    },
    port: '9001',
    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'brianweirdevminesweeper-secret'
    },
    // Seed database on startup
    seedDB: true,
    websiteUrl: 'http://localhost:8080'
};
