// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');

export const adminAllImagesEdit = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.post(`/${CMS_SERVER_VERSION}/images/common/things`, hasUser, findCommonThings);
  app.post(`/${CMS_SERVER_VERSION}/delete/together_thing`, hasUser, updateImages);
};

/**
 * Find things by id
 * @param {String[]} req.body - list of images ids
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function findCommonThings(req, res) {
  const imagesId = req.body;

  const ids = imagesId.map((id) => mongoose.Types.ObjectId(id));

  Media.collection
    .aggregate([
      {
        $match: {
          _id: { $in: ids },
          things: { $ne: { $size: 0 } }
        }
      },
      {
        $unwind: '$things'
      },
      {
        $group: {
          _id: '$things._id',
          images: { $addToSet: '$_id' }
        }
      },
      {
        $match: {
          images: { $size: ids.length }
        }
      }
    ])
    .toArray((err, thingsIds) => {
      if (err) {
        res.json({ success: !err, data: null, error: err });

        return;
      }

      const thingsId = _.map(thingsIds, '_id');

      Things.find({ _id: { $in: thingsId } }).exec((error, things) => {
        res.json({ success: !error, data: things, error });
      });
    });
}

/**
 * Updates things of images
 * @param {String[]} req.body.images - list of images ids
 * @param {String[]} req.body.thing - thing id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function updateImages(req, res) {
  const body = req.body;

  const images = body.images;
  const thing = body.thing[0];
  const thingId = new mongoose.Types.ObjectId(thing._id);

  Media.update({ _id: { $in: images } }, { $pull: { things: { _id: thingId } } }, { multi: true }).exec((err) => {
    res.json({ success: !err, data: err, error: err });
  });
}
