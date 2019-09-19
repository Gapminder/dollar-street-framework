// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const ConsumerThumbnails = mongoose.model('ConsumerThumbnails');

export const consumerAllImages = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/consumer/all/images`, hasUser, getAllImages);
  app.post(`/${CMS_SERVER_VERSION}/consumer/all/images`, hasUser, editAllImages);
};

/**
 * Get flag thumbnail
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getAllImages(req, res) {
  ConsumerThumbnails.find({})
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

/**
 * Update flag of thumbnail
 * @param {ObjectId} req.body.id - flag id
 * @param {Boolean} req.body.allImage - flag status
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function editAllImages(req, res) {
  const flag = req.body;

  ConsumerThumbnails.update({ _id: flag._id }, { $set: { all: flag.all } }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}
