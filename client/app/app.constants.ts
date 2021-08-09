import _ from 'lodash';

import sharedConfig from '../../server/config/environment/shared';

let localConfig = {
    gcp: {
        clientAPIKey: process.env.GCP_CLIENT_API_KEY
    }
};

export default _.merge(
    sharedConfig,
    localConfig);
