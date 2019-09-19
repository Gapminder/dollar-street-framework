// Todo: Need refactor according to "noImplicitAny" rule

import * as shortUrl from 'shorturl-2';
import { Response, Request, Express } from 'express';

module.exports = (app: Express) => {
  const config = app.get('nconf');
  const BASE_HREF = config.get('BASE_HREF');

  app.post(`${BASE_HREF}/v1/shorturl`, getShortUrl);
};

function getShortUrl(req: Request, res: Response): void {
  const {
    body: { url },
    headers: { origin }
  } = req;
  const isFullUrlRegexp = /^https?:\/\/(.*)/;
  const fullUrl = isFullUrlRegexp.test(url) ? url : `${origin}${url}`;

  return shortUrl(
    fullUrl,
    (resUrl: string): Response => {
      return res.json({ success: !null, msg: [], data: resUrl, error: null });
    }
  );
}
