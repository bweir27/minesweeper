/**
 * Main application routes
 */

import errors from './components/errors';
import path from 'path';

export default function(app) {
    // Insert API routes here
    app.use('/api/users', require('./api/user'));
    app.use('/auth', require('./auth').default);

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|auth|components|app|bower_components|assets)/*')
        .get(errors[404]);

    // All other routes (except Swagger-UI) should redirect to the app.html for Angular
    app.route('/*').get((req, res, next) => {
        if(req.url.startsWith('/api-docs') || req.url.startsWith('/api-spec')) { return next(); }
        // Send app.html
        res.sendFile(path.resolve(`${app.get('appPath')}/app.html`));
    });
}
