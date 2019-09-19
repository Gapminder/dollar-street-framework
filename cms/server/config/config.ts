import { credentialsService } from '../../../common/credential.service';
import { dbConfig } from '../../../common/db.config';

export const config = (app) => {
  const pathToCredentials = '../..';
  const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

  app.set('nconf', actualCredentials);

  dbConfig(actualCredentials);
};
