/**
 * Express configuration
 */

import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import favicon from 'serve-favicon';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import path from 'path';
import config from './environment';
import helmet from 'helmet';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
const noir = require('pino-noir');
const redaction = noir(
    {
        req: require('express-pino-logger').stdSerializers.req,
        res: require('pino').stdSerializers.res,
        err: require('pino').stdSerializers.err,
    },
    ['req.headers.authorization']
);
const expressPino = require('express-pino-logger')({
    serializers: redaction,
    autoLogging: {
        ignorePaths: ['/health']
    }
});

export default function(app) {
    var env = process.env.NODE_ENV;

    if(env === 'development' || env === 'test') {
        app.use(express.static(path.join(config.root, '.tmp')));
        app.use(require('cors')());
    }

    if(env === 'production') {
        app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    }

    app.set('appPath', path.join(config.root, 'client'));
    app.use(express.static(app.get('appPath')));
    if(env === 'production') {
        app.use('/', expressStaticGzip(app.get('appPath')));
    }

    app.set('views', `${config.root}/server/views`);
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(compression());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(passport.initialize());
    app.use(expressPino);

    // Persist sessions with MongoStore / sequelizeStore
    // We need to enable sessions for passport-twitter because it's an
    // oauth 1.0 strategy, and Lusca depends on sessions
    app.use(session({
        secret: config.secrets.session,
        saveUninitialized: true,
        resave: false,
        store: MongoStore.create({
            mongoUrl: `${config.mongo.uri}`
        })
    }));

    /**
     * Helmet - Express.js security
     * https://www.npmjs.com/package/helmet
     * https://expressjs.com/en/advanced/best-practice-security.html
     * I am not including CSRF protection because JWT bearer authentication is an effective mitigation of CSRF:
     * https://security.stackexchange.com/questions/170388/do-i-need-csrf-token-if-im-using-bearer-jwt
     */
    if(env !== 'test' && env !== 'development') {
        // Set Content Security Policies
        const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'www.google-analytics.com', 'code.jquery.com', 'maps.googleapis.com', 'www.googletagmanager.com'];
        const styleSources = ["'self'", "'unsafe-inline'", 'blob:', 'fonts.googleapis.com'];
        const fontSources = ["'self'", "'unsafe-inline'", 'fonts.gstatic.com'];
        const connectSources = ["'self'", 'www.google-analytics.com'];
        const imageSources = ["'self'", 'data:', 'i.imgur.com', 'maps.gstatic.com', 'maps.googleapis.com', 'secure.gravatar.com'];
        app.use(
            helmet.contentSecurityPolicy({
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: scriptSources,
                    scriptSrcElem: scriptSources,
                    styleSrc: styleSources,
                    connectSrc: connectSources,
                    imgSrc: imageSources,
                    fontSrc: fontSources
                }
            })
        );
        // Use default values for remaining helmet security checks
        app.use(helmet({
            contentSecurityPolicy: false,
        }));

        // Trust X-Forwarded-* headers since we are running behind a proxy server in production
        app.enable('trust proxy');

        // Force https in production
        app.use(function(req, res, next) {
            if(req.secure) {
                // request was via https, so do no special handling
                return next();
            } else {
                // request was via http, so redirect to https
                res.redirect('https://' + req.headers.host + req.url);
            }
        });
    }

    if(env === 'development' || env === 'test') {
        app.use(errorHandler()); // Error handler - has to be last
    }
}
