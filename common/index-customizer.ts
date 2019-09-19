import * as _ from 'lodash';
import * as replace from 'replace';
import { credentialsService } from './credential.service';

function customizeIndexHtml(prefix, credentials) {
  for (const credKey in credentials) {
    if (credentials.hasOwnProperty(credKey)) {
      const credValue = credentials[credKey];

      const newPrefix = prefix ? _.join([prefix, credKey], '.') : credKey;

      if (_.isObject(credValue)) {
        return customizeIndexHtml(newPrefix, credValue);
      }

      const replaceObject = {
        regex: `{{\\s?${newPrefix}\\s?}}`,
        replacement: credValue,
        paths: ['./dist/client'],
        includes: 'index.html',
        recursive: true,
        silent: true
      };

      replace(replaceObject);
    }
  }
}

const pathToCredentials = '..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);
const store = actualCredentials.get();
delete store.type;
delete store.$0;
delete store._;
customizeIndexHtml(null, store);
