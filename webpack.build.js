const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const {AngularCompilerPlugin} = require('@ngtools/webpack');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * Webpack config for builds
 */
let config = require('./webpack.common')({
    BUILD: true,
    DEV: false,
    TEST: false
});

config.devtool = 'source-map';
config.mode = 'production';

config.module = {
    rules: [
        {
            test: /\.(png|jpe?g|gif|cur|woff|woff2|ttf|eot|ico)$/,
            loader: 'file-loader?name=assets/[name].[hash].[ext]',
            options: {
                esModule: false,
            }
        },
        {
            test: /\.svg$/,
            loader: 'raw-loader'
        },
        {
            test: /\.html$/,
            loader: 'html-loader',
            options: {minimize: {caseSensitive: true}}
        },
        {
            test: /\.css$/,
            use: ['to-string-loader?sourceMap', 'style-loader?sourceMap', 'css-loader?sourceMap']
        },
        {
            test: /\.(scss|sass)$/,
            use: [
                'to-string-loader?sourceMap',
                'css-loader?sourceMap',
                'postcss-loader?sourceMap',
                'sass-loader?sourceMap',
                {
                    loader: 'sass-resources-loader',
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
                'style-loader',
                'css-loader?sourceMap',
                'postcss-loader?sourceMap',
                'sass-loader?sourceMap',
                {
                    loader: 'sass-resources-loader',
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
            test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.tsx?)$/,
            loader: '@ngtools/webpack'
        }
    ]
};

config.plugins.push(
    new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './client/app.template.html'),
        filename: path.resolve(__dirname, './dist/client/app.html')
    }),
    new AngularCompilerPlugin({
        entryModule: path.resolve(__dirname, './client/app/app.module#AppModule'),
        sourceMap: true,
        tsConfigPath: 'tsconfig.json',
    }),
    new webpack.SourceMapDevToolPlugin({
        exclude: [/node_modules/],
        test: /\.ts($|\?)/i
    })
);

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
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
    },
    runtimeChunk: 'single',
    minimizer: [
        new TerserPlugin({
            parallel: true,
        }),
        new OptimizeCssAssetsPlugin({
            sourceMap: true,
            cssProcessorPluginOptions: {
                preset: ['default', {discardComments: {removeAll: true}}],
                map: {
                    inline: false
                },
                safe: true
            }
        })
    ]
};

module.exports = config;
