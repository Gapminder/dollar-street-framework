import * as express from 'express';
import * as path from 'path';

export const serveStaticMiddleware = (app) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.set('health-check.middleware', (req, res, next) => {
    if (req.url.indexOf('healthz') !== -1) {
      return res.json({ success: true, message: `Instance of CMS is alive` });
    }

    return next();
  });

  app.set('serve-static.middleware', express.static(path.resolve(__dirname, '../../client')));

  app.use(compression());

  app.set('serve-index.middleware', (req, res, next) => {
    // AJAX or BackEnd requests
    if (req.xhr || req.url.indexOf(`/${CMS_SERVER_VERSION}/`) !== -1) {
      return next();
    }

    // send STATIC for all other requests
    return res.sendFile('/index.html', { root: path.resolve(__dirname, `../../client`) });
  });
};
