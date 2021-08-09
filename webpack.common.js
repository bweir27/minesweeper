/*eslint-env node*/
const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');

module.exports = function makeWebpackConfig(options) {
    /**
     * Environment type
     * BUILD is for generating minified builds
     * TEST is for generating test builds
     */
    const BUILD = !!options.BUILD;
    const TEST = !!options.TEST;
    const DEV = !!options.DEV;

    /**
     * Config
     * Reference: http://webpack.github.io/docs/configuration.html
     * This is the object where all configuration gets set
     */
    const config = {};

    config.mode = BUILD
        ? 'production'
        : 'development';

    config.resolve = {
        modules: ['node_modules'],
        extensions: [".ts", ".js"],
        alias: {
            primus: path.resolve(__dirname, 'client/components/socket/primus.js'),
        },
        mainFields: [
            'browser',
            'module',
            'main'
        ]
    };

    /**
     * Entry
     * Reference: http://webpack.github.io/docs/configuration.html#entry
     * Should be an empty object if it's generating a test build
     * Karma will set this when it's a test build
     */
    config.entry = {
        app: DEV || TEST ? './client/app/app-local.ts' : './client/app/app-prod.ts',
        polyfills: './client/app/polyfills.ts',
        vendor: [
            'lodash'
        ]
    };

    /**
     * Output
     * Reference: http://webpack.github.io/docs/configuration.html#output
     * Should be an empty object if it's generating a test build
     * Karma will handle setting it up for you when it's a test build
     */
    config.output = {
        // Absolute output directory
        path: BUILD ? path.join(__dirname, '/dist/client/') : path.join(__dirname, '/.tmp/'),

        // Output path from the view of the page
        // Uses webpack-dev-server in development
        publicPath: BUILD || DEV ? '/' : `http://localhost:${8080}/`,

        // Filename for entry points
        // Only adds hash in build mode
        filename: BUILD ? '[name].[hash].js' : '[name].bundle.js',

        // Filename for non-entry points
        // Only adds hash in build mode
        chunkFilename: BUILD ? '[name].[hash].js' : '[name].bundle.js',
    };

    let localEnv;
    try {
        localEnv = require('./server/config/local.env').default;
    } catch (e) {
        localEnv = {};
    }
    localEnv = _.mapValues(localEnv, value => `"${value}"`);
    localEnv = _.mapKeys(localEnv, (value, key) => `process.env.${key}`);

    let env = _.merge({
        'process.env.NODE_ENV': DEV ? '"development"'
            : BUILD ? '"production"'
                : TEST ? '"test"'
                    : '"development"'
    }, localEnv);

    // Reference: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
    // Define free global variables
    config.plugins = [
        new webpack.DefinePlugin(env)
    ];

    config.bail = true;

    config.cache = DEV;

    return config;
};
