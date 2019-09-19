// Todo: Need refactor according to "noImplicitAny" rule

import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';
import * as _ from 'lodash';
import * as uuidv4 from 'uuid/v4';

import { EMBED_ERROR_CODE } from '../../../constants/embed-preview-constants';
import { EmbedPlace } from '../../interfaces/places';
import { EmbedParams, EmbedUrls } from '../../interfaces/puppeteer.interfaces';

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');

  const nconf = app.get('nconf');
  const awsS3Service = app.get('awsS3Service');
  const screenshotService = app.get('screenshotService');
  const embedService = app.get('embedService');

  // TODO: move to all credentials
  const BASE_HREF = nconf.get('BASE_HREF');

  // TODO put into the nconf ObjectId not string
  const context = {
    FAMILY_THING_ID: mongoose.Types.ObjectId(nconf.get('familyThingId')),
    HOME_THING_ID: mongoose.Types.ObjectId(nconf.get('homeThingId')),
    PLACE_TYPE_ID: mongoose.Types.ObjectId(nconf.get('placeTypeId')),
    awsS3Service,
    screenshotService,
    embedService,
    BASE_HREF,
    NODE_ENV: nconf.get('NODE_ENV'),
    SHARE_EMBED_TITLE: nconf.get('SHARE_EMBED_TITLE'),
    SHARE_EMBED_DESCRIPTION: nconf.get('SHARE_EMBED_DESCRIPTION')
  };

  app.get(`${BASE_HREF}/v1/set-pinned-places`, compression(), setPinnedPlaces.bind(setPinnedPlaces, context));
  app.get(`${BASE_HREF}/v1/get-pinned-places`, compression(), getPinnedPlaces.bind(getPinnedPlaces, context));
};

async function setPinnedPlaces(externalContext, req: Request, res: Response): Promise<Response> {
  const { embedService, screenshotService } = externalContext;

  try {
    const {
      query: {
        resolution = screenshotService.DEFAULT_RESOLUTION,
        // screenshot = screenshotService.DEFAULT_SCREENSHOT,
        tool = screenshotService.DEFAULT_TOOL_FOR_CREATE_EMBED,
        // download = screenshotService.DEFAULT_DOWNLOAD_SCREENSHOT,
        embed = '',
        medias = '',
        thingId = '',
        lang = screenshotService.DEFAULT_LANGUAGE
      },
      protocol,
      headers: { host, referer }
    } = req;

    const uuid = uuidv4();

    const embedParams: EmbedParams = {
      // screenshot,
      tool,
      // download,
      medias,
      thingId,
      lang,
      requestUuid: uuid,
      referer: referer.toString() || `${protocol}://${host}${externalContext.BASE_HREF}/matrix`,
      resolution,
      mediasIds: _.split(medias, ','),
      embed
    };

    const data: EmbedUrls = await embedService.newComparison(embedParams);

    return res.json({ success: true, msg: [], data, error: null });
  } catch (error) {
    const message = error.message;
    console.error(`[code=${EMBED_ERROR_CODE}] ${message}`, error);

    return res.json({ success: false, msg: [], data: null, error: { message } });
  }
}

async function getPinnedPlaces(externalContext, req: Request, res: Response): Promise<Response> {
  const { embedService, screenshotService } = externalContext;

  try {
    const {
      query: {
        resolution = screenshotService.DEFAULT_RESOLUTION,
        screenshot = screenshotService.DEFAULT_SCREENSHOT,
        tool,
        embed = '',
        medias = '',
        thingId = '',
        lang = screenshotService.DEFAULT_LANGUAGE
      },
      protocol,
      headers: { host, referer }
    } = req;

    const uuid = uuidv4();

    const embedParams: EmbedParams = {
      screenshot,
      tool,
      medias,
      thingId,
      lang,
      requestUuid: uuid,
      referer: referer.toString() || `${protocol}://${host}${externalContext.BASE_HREF}/matrix`,
      resolution,
      mediasIds: _.split(medias, ','),
      embed
    };

    const data: EmbedPlace[] = await embedService.openComparison(embedParams);

    return res.json({ success: true, msg: [], data, error: null });
  } catch (error) {
    const message = error.message;
    console.error(`[code=${EMBED_ERROR_CODE}] ${message}`, error);

    return res.json({ success: false, msg: [], data: null, error: { message } });
  }
}
