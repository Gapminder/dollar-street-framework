import * as compression from 'compression';

export const compressionMiddleware = (app) => {
  const ENV = process.env.NODE_ENV || 'dev';
  const next = () => {
    return (req, res, _next) => {
      _next();
    };
  };

  app.set('compression.middleware', ENV !== 'local' ? compression : next);
};
