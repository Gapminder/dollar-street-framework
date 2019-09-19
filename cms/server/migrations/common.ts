import * as express from 'express';
import { dbConfig } from '../../../common/db.config';
import '../../../server/src/models';
import { credentialsService } from '../../../common/credential.service';

const app = express();
const pathToCredentials = '../..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

app.set('nconf', actualCredentials);
dbConfig(actualCredentials);

module.exports = app;
