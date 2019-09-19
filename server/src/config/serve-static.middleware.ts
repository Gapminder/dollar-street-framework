// TODO: make a common module

import * as express from 'express';
import * as path from 'path';
import {
  BOT_CHECHER_REGEX,
  DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT,
  RESPONSE_200_STATUS_CODE
} from '../../constants/embed-preview-constants';
import { PREVIEW_HTML } from '../app/embed/embed-preview-html';
import { get } from 'lodash';

export const serveStatic = (app) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');
  const baseHref = nconf.get('BASE_HREF');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  const SHARE_EMBED_TITLE = nconf.get('SHARE_EMBED_TITLE');
  const SHARE_EMBED_DESCRIPTION = nconf.get('SHARE_EMBED_DESCRIPTION');
  const S3_EMBED_VERSION = nconf.get('S3_EMBED_VERSION');
  const S3_FOLDER_PATH = `shared/${S3_EMBED_VERSION}`;

  app.set('health-check.middleware', (req, res, next) => {
    if (req.url.indexOf('healthz') !== -1) {
      return res.json({ success: true, message: `Instance of pages is alive` });
    }

    return next();
  });

  app.set('serve-static.middleware', express.static(path.resolve(__dirname, '../../../client')));

  app.use(compression());

  app.set('serve-embed-preview', (req, res, next) => {
    const userAgent = get(req, 'headers.user-agent', null);
    const embedId = get(req, 'query.embed', null);

    if (userAgent && embedId && BOT_CHECHER_REGEX.test(userAgent)) {
      const imageUrl = `https:${S3_SERVER}${S3_FOLDER_PATH}/embed_${embedId}.jpeg`;
      const { width, height } = DEFAULT_SOCIAL_SCREENSHOT_VIEWPORT;
      const previewData = { imageUrl, width, height, title: SHARE_EMBED_TITLE, description: SHARE_EMBED_DESCRIPTION };

      res.writeHead(RESPONSE_200_STATUS_CODE, { 'Content-Type': 'text/html' });
      res.write(PREVIEW_HTML(previewData));

      return res.end();
    }

    return next();
  });

  app.set('serve-index.middleware', (req, res, next) => {
    // AJAX or BackEnd requests
    if (req.xhr || req.url.indexOf('v1/') !== -1) {
      return next();
    }

    return res.sendFile('./index.html', { root: `dist/client${baseHref}` });
  });
};
