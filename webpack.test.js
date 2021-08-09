const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const {NamedModulesPlugin} = require('webpack');
const fs = require('fs');

/**
 * Webpack config for testing
 */
let config = require('./webpack.common')({
    BUILD: false,
    DEV: true,
    TEST: false
});

config.devtool = 'cheap-module-eval-source-map';
config.mode = 'development';

config.module = {
    rules: [
        {
            test: /\.(png|jpe?g|gif|cur|woff|woff2|ttf|eot|ico)$/,
            loader: 'file-loader'
        },
        {
            test: /\.html|svg$/,
            loader: 'raw-loader'
        },
        {
            test: /\.css$/,
            use: ['to-string-loader?sourceMap', 'css-loader?sourceMap']
        },
        {
            test: /\.(scss|sass)$/,
            use: [
                'to-string-loader?sourceMap',
                'css-loader?sourceMap',
                'postcss-loader?sourceMap',
                'sass-loader?sourceMap',
                {
                    loader: 'sass-resources-loader?sourceMap',
                    options: {
                        sourceMap: true,
                        resources: './client/app/variables.scss'
                    }
                }
            ],
            exclude: [
                path.resolve(__dirname, 'client/app/app.scss')
            ]
        },
        {
            test: /\.(scss|sass)$/,
            use: [
                'style-loader?sourceMap',
                'css-loader?sourceMap',
                'postcss-loader?sourceMap',
                'sass-loader?sourceMap',
                {
                    loader: 'sass-resources-loader?sourceMap',
                    options: {
                        sourceMap: true,
                        resources: './client/app/variables.scss'
                    }
                }
            ],
            include: [
                path.resolve(__dirname, 'client/app/app.scss')
            ]
        },
        {
            test: /\.tsx?$/,
            use: ['source-map-loader'],
            enforce: 'pre'
        },
        {
            test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
            loaders: ['awesome-typescript-loader', 'angular2-template-loader'],
            exclude: path.resolve(__dirname, 'node_modules')
        }
    ]
};

config.plugins.push(
    new HtmlWebpackPlugin({
        template: 'client/app.template.html'
    }),
    new NamedModulesPlugin({}),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.SourceMapDevToolPlugin({
        filename: '[file].map[query]',
        moduleFilenameTemplate: '[resource-path]',
        fallbackModuleFilenameTemplate: '[resource-path]?[hash]',
        sourceRoot: 'webpack:///'
    }),
    new webpack.SourceMapDevToolPlugin({
        filename: null,
        exclude: [/node_modules/],
        test: /\.ts($|\?)/i
    })
);

config.node = {
    fs: 'empty',
    global: true,
    crypto: 'empty',
    tls: 'empty',
    net: 'empty',
    process: true,
    module: false,
    clearImmediate: false,
    setImmediate: false
};

config.stats = {
    colors: true,
    reasons: true
};

config.optimization = {
    noEmitOnErrors: true,
    splitChunks: {
        cacheGroups: {
            styles: {
                name: 'styles',
                test: /\.css$/,
                chunks: 'all',
                enforce: true
            },
            vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor',
                enforce: true,
                chunks: 'all'
            },
            default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true
            }
        },
        chunks: 'all'
    }
};

module.exports = config;
