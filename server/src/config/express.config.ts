import * as cors from 'cors';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import { compressionMiddleware } from './compression.middleware';
import { serveStatic } from './serve-static.middleware';

export const expressConfig = (app) => {
  app.use(logger('dev'));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());

  compressionMiddleware(app);
  serveStatic(app);
};
