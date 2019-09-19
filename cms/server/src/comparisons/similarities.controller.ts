// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';
import { ComparisonQuery } from './comparisons.interface';

// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Locations = mongoose.model('Locations');
// tslint:disable-next-line:variable-name
const Similarities = mongoose.model('Similarities');

export const similarities = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  // get similarities list
  app.get(`/${CMS_SERVER_VERSION}/comparisons/similarities/next`, hasUser, getSimilaritiesNext);

  // similarity crud
  // createSimilarities
  app.post(`/${CMS_SERVER_VERSION}/comparisons/similarities`, hasUser, editSimilarities);
  app.put(`/${CMS_SERVER_VERSION}/comparisons/similarities/:id`, hasUser, editSimilarities);
  app.delete(`/${CMS_SERVER_VERSION}/comparisons/similarities/:id`, hasUser, removeSimilarities);

  // switch similarity status
  app.put(`/${CMS_SERVER_VERSION}/comparisons/similarities/status/:id`, hasUser, statusSimilarities);

  // deprecated
  app.get(`/${CMS_SERVER_VERSION}/comparison/similarities`, hasUser, getSimilaritiesNext);
  app.post(`/${CMS_SERVER_VERSION}/comparison/similarities/new`, hasUser, createSimilarities);
  app.post(`/${CMS_SERVER_VERSION}/comparison/similarities/edit/:id`, hasUser, editSimilarities);
  app.post(`/${CMS_SERVER_VERSION}/comparison/similarities/status/:id`, hasUser, statusSimilarities);
  app.post(`/${CMS_SERVER_VERSION}/comparison/similarities/remove/:id`, hasUser, removeSimilarities);
};

/**
 * Find all similarities and things
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getSimilaritiesNext(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  async.parallel(
    {
      similarities: getSimilarities(skip, limit, query, sort),
      hashThingsById: getHashThingsById,
      hashCountriesById: getHashCountriesById
    },
    (err, results) => {
      if (err) {
        res.json({ success: !err, msg: [], data: results, error: err });

        return;
      }

      const hashThingsById = results.hashThingsById;
      const hashCountriesById = results.hashCountriesById;

      results.similarities = _.chain(results.similarities)
        .map((similarity) => {
          if (similarity.thing) {
            const thingName = hashThingsById[similarity.thing.toString()];

            if (thingName) {
              similarity.thingName = thingName;
            }
          }

          similarity.comparisonImages = _.map(similarity.comparisonImages, (comparisonImage) => {
            const place = comparisonImage.place;

            comparisonImage.image.country = hashCountriesById[place.country.toString()];
            comparisonImage.image.income = place.income;
            comparisonImage.image.place = place._id;
            comparisonImage.image.fullUrl = comparisonImage.fullUrl;

            return comparisonImage.image;
          });

          similarity.snippetImages = _.map(similarity.snippetImages, (snippetImage) => {
            const place = snippetImage.place;

            snippetImage.image.country = hashCountriesById[place.country.toString()];
            snippetImage.image.income = place.income;
            snippetImage.image.place = place._id;
            snippetImage.image.fullUrl = snippetImage.fullUrl;

            return snippetImage.image;
          });

          return similarity;
        })
        .value();

      res.json({ success: !err, msg: [], data: results.similarities, error: err });
    }
  );
}

/**
 * Create new similarity
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function createSimilarities(req, res) {
  /** @type Similarities */
  const similarity = req.body;
  // tslint:disable-next-line:variable-name
  const Similarity = new Similarities(similarity);

  Similarity.save((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

/**
 * Update similarity
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function editSimilarities(req, res) {
  /** @type Similarities */
  const similarity = req.body;
  const query = req.params.id ? { _id: req.params.id } : {};
  delete similarity.__v;

  similarity.comparisonImages = _.map(similarity.comparisonImages, (image) => ({
    image: image._id,
    place: image.place,
    fullUrl: image.fullUrl
  }));

  similarity.snippetImages = _.map(similarity.snippetImages, (image) => ({
    image: image._id,
    place: image.place,
    fullUrl: image.fullUrl
  }));

  if (_.isEmpty(query)) {
    // tslint:disable-next-line:variable-name
    const Similarity = new Similarities(similarity);

    Similarity.save((err, _similarity) => {
      res.json({ success: !err, msg: [], data: { comparison: _similarity }, error: err });
    });

    return;
  }

  Similarities.update(query, {
    $set: similarity
  }).exec((err, _similarity) => {
    res.json({ success: !err, msg: [], data: { comparison: _similarity }, error: err });
  });
}

/**
 * Update status field for similarity
 * @param {String} req.params.id - similarity id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function statusSimilarities(req, res) {
  Similarities.update({ _id: req.params.id }, { $set: { isHidden: req.body.status } }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

/**
 * Remove similarity
 * @param {String} req.params.id - similarity id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function removeSimilarities(req, res) {
  Similarities.remove({ _id: req.params.id }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

/**
 * Get all similarities
 * @param {Number} skip - skip
 * @param {Number} limit - limit
 * @param {Object} query - query
 * @param {Object} sort - sort
 * @returns {Function} - Function
 */
function getSimilarities(skip, limit, query, sort) {
  return (cb) => {
    Similarities.find(query)
      .populate([
        { path: 'snippetImages.image', select: 'amazonfilename src' },
        { path: 'snippetImages.place', select: 'country income' },
        { path: 'comparisonImages.image', select: 'amazonfilename src' },
        { path: 'comparisonImages.place', select: 'country income' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(cb);
  };
}

/**
 * Get all hash things by id
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getHashThingsById(cb) {
  Things.find({}, { thingName: 1 })
    .lean()
    .exec((err, things) => {
      if (err) {
        return cb(err);
      }

      const hashThingsById = _.reduce(things, (result, thing) => {
        result[thing._id.toString()] = thing.thingName;

        return result;
      });

      return cb(null, hashThingsById);
    });
}

/**
 * Get all hash countries by id
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getHashCountriesById(cb) {
  Locations.find({}, { country: 1 })
    .lean()
    .exec((err, locations) => {
      if (err) {
        return cb(err);
      }

      const hashCountriesById = _.reduce(locations, (result, location) => {
        result[location._id.toString()] = location.country;

        return result;
      });

      return cb(null, hashCountriesById);
    });
}

function preparationQuery(request) {
  const query: ComparisonQuery = {};

  if (request.title) {
    query.title = { $regex: request.title, $options: 'i' };
  }

  return query;
}

function preparationSort(request) {
  let query = {};

  if (request.sort) {
    query = JSON.parse(request.sort);
  }

  return query;
}
