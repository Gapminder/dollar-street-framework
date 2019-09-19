// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');

export const images = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  // get image
  app.get(`${CMS_SERVER_VERSION}/images/:id`, hasUser, getSimilarityImage);

  // deprecated
  app.get(`/${CMS_SERVER_VERSION}/comparison/image/:id`, hasUser, getSimilarityImage);
};

/**
 * Find media for similarity comparison or snippet field
 * @param {String} req.params.id - media id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getSimilarityImage(req, res) {
  const mediaId = req.params.id;

  Media.find({ _id: mediaId }, { place: 1, amazonfilename: 1, src: 1 })
    .lean()
    .exec((err, _images) => {
      if (err) {
        res.json({ success: err, msg: [], data: _images, error: err });

        return;
      }

      if (!_images.length) {
        res.json({ success: err, msg: [], data: _images, error: 'This image does not exist!' });

        return;
      }

      const image = _images[0];

      Places.collection
        .aggregate([
          { $match: { _id: image.place } },
          { $unwind: '$info' },
          {
            $project: {
              country: { $cond: { if: { $eq: ['$info.id', 'country'] }, then: '$info.answers', else: null } },
              income: { $cond: { if: { $eq: ['$info.id', 'income'] }, then: '$info.answers', else: null } }
            }
          },
          {
            $group: {
              _id: '$_id',
              country: { $addToSet: '$country' },
              income: { $addToSet: '$income' }
            }
          },
          {
            $project: {
              _id: 1,
              country: { $setDifference: ['$country', [null]] },
              income: { $setDifference: ['$income', [null]] }
            }
          },
          { $unwind: '$country' },
          { $unwind: '$income' }
        ])
        .toArray((getPlacesError, place) => {
          if (getPlacesError) {
            res.json({ success: getPlacesError, msg: [], data: place, error: getPlacesError });

            return;
          }

          image.income = place[0].income;
          image.country = place[0].country;

          res.json({ success: !getPlacesError, msg: [], data: image, error: getPlacesError });
        });
    });
}
