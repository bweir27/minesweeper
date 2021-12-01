/*eslint no-process-env:0*/

import _ from 'lodash';

// Development specific configuration
// ==================================
module.exports = _.merge({
    // MongoDB connection options
    mongo: {
        useMongoClient: true,
        uri: 'mongodb://brianweirdev-minesweeper-mongodb/brianweirdevminesweeper-dev'
    },
    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'brianweirdevminesweeper-secret'
    },
    // Seed database on startup
    seedDB: true,
    websiteUrl: 'http://localhost:8080'
},
require('./local.js') || {});
