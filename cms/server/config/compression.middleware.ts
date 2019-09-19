import * as compression from 'compression';

export const compressionMiddleware = (app) => {
  app.set('compression.middleware', compression);
};
