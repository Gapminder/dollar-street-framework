import * as path from 'path';
import * as fs from 'fs';
import { credentialsService } from './credential.service';

const pathToCredentials = path.resolve(__dirname, '../credentials');
// tslint:disable-next-line:no-var-requires
const angularJSON = require('../.angular-cli.json');
const DEFAULT_ENVIRONMENT_FILE = `${credentialsService.DEFAULT_MODE_ENV}.${credentialsService.DEFAULT_NODE_ENV}`;

console.log(`Default environment: `, DEFAULT_ENVIRONMENT_FILE);

readCredentialsFolder();

export function readCredentialsFolder() {
  try {
    const files = fs.readdirSync(pathToCredentials);

    for (const file of files) {
      if (path.extname(file) === '.json') {
        const environmentName = file.replace(/\.json$/, '');
        createEnvFile(path.join(pathToCredentials, file), environmentName);
      }
    }

    fs.writeFileSync('.angular-cli.json', JSON.stringify(angularJSON, null, '\t'));
  } catch (error) {
    if (error.path.match(/credentials$/) && error.code === 'ENOENT') {
      process.exit(0);
    }

    console.error(error);
    process.exit(1);
  }
}

export function createEnvFile(pathToCredentialFile, environmentName) {
  console.log(`Сheck required fields in cred file: '${pathToCredentialFile}'`);
  const [MODE_ENV, ...NODE_ENV] = environmentName.split('.');
  const credentials = require(pathToCredentialFile);
  const pickedCredentialsForUI = credentialsService.pickRequiredUiCredentials(credentials);
  const extendedCredentials = Object.assign({ MODE_ENV, NODE_ENV: NODE_ENV.join('.') }, pickedCredentialsForUI);

  const envData = `export const environment = ${JSON.stringify(extendedCredentials, null, '\t')};`;
  const pathToFile = path.resolve(__dirname, `../client/src/environments/environment.${environmentName}.ts`);

  try {
    fs.writeFileSync(pathToFile, envData);
    console.log(`Created  ${pathToFile}`);

    if (DEFAULT_ENVIRONMENT_FILE === environmentName) {
      const pathToDefaultFile = path.resolve(__dirname, `../client/src/environments/environment.ts`);

      fs.writeFileSync(pathToDefaultFile, envData);
      console.log(`Created  ${pathToDefaultFile}`);
    }

    angularJSON.apps[0].environments[environmentName] = `environments/environment.${environmentName}.ts`;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
