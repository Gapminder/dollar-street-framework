import { credentialsService } from '../../../common/credential.service';

export const configMigration = (app) => {
  const pathToCredentials = '..';
  const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

  app.set('nconf', actualCredentials);
};
