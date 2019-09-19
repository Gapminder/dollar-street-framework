import * as path from 'path';
import * as bunyan from 'bunyan';
import * as PrettyStream from 'bunyan-prettystream';
import { credentialsService } from './credential.service';

const pathToCredentials = path.resolve(__dirname, '../credentials');
const nconf = credentialsService.loadDeployDefaultEnvs(pathToCredentials);
const MODE_ENV = nconf.get('MODE_ENV');
const NODE_ENV = nconf.get('NODE_ENV');

const logger = bunyan.createLogger({
  name: `${MODE_ENV}_${NODE_ENV}`,
  streams: getBunyanStreams(NODE_ENV)
});

function getBunyanStreams(environment: string): object[] {
  const consoleStream = {
    name: 'deploy',
    src: environment,
    level: 'info',
    stream: new PrettyStream().pipe(process.stdout)
  };

  return [consoleStream];
}

export { logger };
