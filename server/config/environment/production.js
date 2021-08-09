/*eslint no-process-env:0*/

// Production specific configuration
// =================================
module.exports = {
    aws: {
        bucketName: process.env.S3_BUCKET_NAME,
        fileNamePrefix: 'Production',
        fromEmail: 'info@hecommunityexchange.com',
        emailDisabled: false
    },
    facebook: {
        clientID: process.env.FACEBOOK_ID,
        clientSecret: process.env.FACEBOOK_SECRET,
        callbackURL: `${process.env.DOMAIN || ''}/auth/facebook/callback`
    },
    gcp: {
        serverAPIKey: process.env.GCP_SERVER_API_KEY,
        clientAPIKey: process.env.GCP_CLIENT_API_KEY
    },
    google: {
        clientID: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: `${process.env.DOMAIN || ''}/auth/google/callback`
    },
    // Server IP
    ip: process.env.OPENSHIFT_NODEJS_IP
        || process.env.ip
        || undefined,
    kml: {
        domain: process.env.KML_DOMAIN
    },
    // MongoDB connection options
    mongo: {
        useMongoClient: true,
        uri: process.env.MONGODB_URI
             || process.env.MONGOHQ_URL
             || process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME
    },
    // Server port
    port: process.env.OPENSHIFT_NODEJS_PORT
          || process.env.PORT
          || 8080,
    secrets: {
        session: process.env.SESSION_SECRET
    },
    // Do not seed database on startup
    seedDB: false,
    twitter: {
        clientID: process.env.TWITTER_ID,
        clientSecret: process.env.TWITTER_SECRET,
        callbackURL: `${process.env.DOMAIN || ''}/auth/twitter/callback`
    },
    websiteUrl: process.env.DOMAIN
};
