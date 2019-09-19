import * as path from 'path';
import * as nconf from 'nconf';
import * as _ from 'lodash';
import * as moment from 'moment';

const REQUIRED_UI_CREDENTIALS = [
  'BASE_HREF',
  'STRIPE_PUBLIC_KEY',
  'PATH_TO_DOWNLOAD_IMAGES',
  'FLAG_BUILD_ANGULAR_PRODUCTION',
  'DEFAULT_STATE',
  'SHARE_EMBED_DESCRIPTION',
  'SHARE_EMBED_TITLE',
  'S3_EMBED_VERSION',
  'S3_BUCKET',
  'S3_SERVER_PREFIX'
];

export class CredentialsService {
  DEFAULT_NODE_ENV = 'ds';
  DEFAULT_MODE_ENV = 'local';

  pickRequiredUiCredentials(credentials) {
    nconf.defaults(credentials);
    nconf.required(REQUIRED_UI_CREDENTIALS);

    return _.pick(credentials, REQUIRED_UI_CREDENTIALS);
  }

  loadCredentials(pathToCredentials) {
    const NODE_ENV = process.env.NODE_ENV || this.DEFAULT_NODE_ENV;
    const MODE_ENV = process.env.MODE_ENV || this.DEFAULT_MODE_ENV;
    nconf.set('NODE_ENV', NODE_ENV);
    nconf.set('MODE_ENV', MODE_ENV);

    console.log(`Was detected NODE_ENV: ${NODE_ENV}; MODE_ENV: ${MODE_ENV}`);

    try {
      const pathToConfig = path.resolve(
        __dirname,
        pathToCredentials,
        'credentials',
        `${MODE_ENV.toLowerCase()}.${NODE_ENV.toLowerCase()}.json`
      );
      nconf
        .argv()
        .env()
        .file(pathToConfig);
      console.log(`Was loaded config: ${pathToConfig}`);

      return nconf;
    } catch (error) {
      console.error(error);
    }

    try {
      const pathToConfig = path.resolve(
        __dirname,
        `${pathToCredentials}/credentials/${this.DEFAULT_MODE_ENV}.${this.DEFAULT_NODE_ENV}.json`
      );
      nconf
        .argv()
        .env()
        .file(pathToConfig);
      console.log(`Was loaded default config: ${pathToConfig}`);

      return nconf;
    } catch (error) {
      console.error(error);
      console.log('Provide correct file with credentials');
      process.exit(1);
    }
  }

  loadDeployDefaultEnvs(pathToCredentials) {
    const _nconf = this.loadCredentials(pathToCredentials);

    const DEFAULT_TIMESTAMP = moment().format('YYYY-MM-DD-hh-mm-ss');
    const TIMESTAMP = process.env.TIMESTAMP || DEFAULT_TIMESTAMP;

    const STREET_NAME = 'street';
    const CMS_NAME = 'cms';

    const STREET_NEW_INSTANCE_NAME = `${STREET_NAME}-${TIMESTAMP}`;
    const CMS_NEW_INSTANCE_NAME = `${CMS_NAME}-${TIMESTAMP}`;
    const DOCKERFILE_SUFFIX_STREET = 'env';
    const DOCKERFILE_SUFFIX_CMS = `${CMS_NAME}`;

    const standalone = {
      TIMESTAMP,
      STREET_NEW_INSTANCE_NAME,
      CMS_NEW_INSTANCE_NAME,
      STREET_NAME,
      CMS_NAME,
      DOCKERFILE_SUFFIX_STREET,
      DOCKERFILE_SUFFIX_CMS
    };

    _nconf.defaults(standalone);

    return _nconf;
  }
}

export const credentialsService = new CredentialsService();
