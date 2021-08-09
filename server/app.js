/**
 * Main application file
 */

import express from 'express';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import config from './config/environment';
import http from 'http';

import expressConfig from './config/express';
import registerRoutes from './routes';
const expressOasGenerator = require('express-oas-generator');
const _ = require('lodash');

// Connect to MongoDB
// const mongooseConnectionPromise = mongoose.connect(config.mongo.uri, config.mongo.options, );
// mongooseConnectionPromise;
mongoose.connect(config.mongo.uri, config.mongo.options,);
mongoose.connection.on('error', function(err) {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(-1); // eslint-disable-line no-process-exit
});

// Setup server
var app = express();
expressOasGenerator.init(app, function(spec) {
    _.merge(spec, {
        info: {
            title: 'BrianWeirDev API Documentation',
            version: '1.0.0',
            description: ''
        },
        securityDefinitions: {
            Bearer: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header'
            }
        },
        tags: [
        ],
        paths: {
            // Users
            '/api/users': {
                get: {
                    tags: ['users'],
                    summary: 'Get all users',
                },
                post: {
                    tags: ['users'],
                    summary: 'Create user',
                    consumes: ['application/json'],
                    parameters: [
                        {name: 'body', consumes: ['application/json'], in: 'body', description: '', required: true}
                    ],
                }
            },
            '/api/users/{id}': {
                delete: {
                    tags: ['users'],
                    summary: 'Delete user by id',
                    consumes: ['application/json'],
                    parameters: [
                        {name: 'id', in: 'path', required: true, description: 'User Identifier'}
                    ],
                    security: [
                        {
                            Bearer: []
                        }
                    ]
                },
                put: {
                    tags: ['users'],
                    summary: 'Update user by id',
                    consumes: ['application/json'],
                    parameters: [
                        {name: 'id', in: 'path', required: true, description: 'User Identifier'},
                        {name: 'body', consumes: ['application/json'], in: 'body', description: '', required: true}
                    ],
                    security: [
                        {
                            Bearer: []
                        }
                    ]
                },
                get: {
                    tags: ['users'],
                    summary: 'Get user by id',
                    consumes: ['application/json'],
                    parameters: [
                        {name: 'id', in: 'path', required: true, description: 'User Identifier'}
                    ],
                    security: [
                        {
                            Bearer: []
                        }
                    ]
                }
            },
            '/api/users/me': {
                get: {
                    tags: ['users'],
                    summary: 'Get current user',
                    consumes: ['application/json'],
                    security: [
                        {
                            Bearer: []
                        }
                    ]
                }
            },
            '/api/users/{id}/password': {
                put: {
                    tags: ['users'],
                    summary: 'Get user\'s passord by user id',
                    consumes: ['application/json'],
                    parameters: [
                        {name: 'id', in: 'path', required: true, description: 'User Identifier'},
                        {name: 'body', consumes: ['application/json'], in: 'body', description: '', required: true}
                    ],
                    security: [
                        {
                            Bearer: []
                        }
                    ]
                }
            },

            // Auth
            '/auth/local': {
                post: {
                    tags: ['auth'],
                    summary: 'Authenticate locally',
                    consumes: ['application/json'],
                    parameters: [
                        {consumes: ['application/json'], in: 'body', name: 'body', description: '', required: true}
                    ]
                }
            },
        }
    });

    return spec;
},);


var server = http.createServer(app);

var events = require('events');
events.defaultMaxListeners = 1000;

expressConfig(app);
registerRoutes(app);

// Start server
function startServer() {
    app.minesweeper = server.listen(config.port, config.ip, function() {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
    let env = process.env.NODE_ENV;
    if(env === 'development' || env === 'test') {

    }
}

setImmediate(startServer);

// Expose app
exports = module.exports = app;
