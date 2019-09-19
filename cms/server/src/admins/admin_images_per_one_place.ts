// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';
import { AdminsQuery } from './admins.interface';

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');

export const adminImagesPerOnePlace = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/images/per_place/:id`, hasUser, getMedia);
};

/**
 * Find media by place id
 * @param {String} req.params.id - id of place
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getMedia(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request, req.params.id);

  Media.find(query)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec((err, medias) => {
      res.json({ success: !err, msg: [], data: medias, error: err });
    });
}

function preparationQuery(request, id) {
  const query: AdminsQuery = { place: id };

  if (request.isTrash) {
    query.isTrash = request.isTrash;
  }

  if (request.isApproved) {
    query.isApproved = request.isApproved;
  }

  return query;
}
