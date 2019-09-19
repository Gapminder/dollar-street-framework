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
const DifferencesController = mongoose.model('Differences');

export const differences = (app) => {
  const hasUser = app.get('validate').hasUser;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  // get differences list
  app.get(`/${CMS_SERVER_VERSION}/comparisons/differences/next`, hasUser, getDifferencesNext);

  // difference crud
  // createDifferences
  app.post(`/${CMS_SERVER_VERSION}/comparisons/differences`, hasUser, editDifferences);
  app.put(`/${CMS_SERVER_VERSION}/comparisons/differences/:id`, hasUser, editDifferences);
  app.delete(`/${CMS_SERVER_VERSION}/comparisons/differences/:id`, hasUser, removeDifferences);

  // switch difference status
  app.put(`/${CMS_SERVER_VERSION}/comparisons/differences/status/:id`, hasUser, statusDifferences);

  // deprecated
  app.get(`/${CMS_SERVER_VERSION}/comparison/differences`, hasUser, getDifferencesNext);
  app.post(`/${CMS_SERVER_VERSION}/comparison/differences/new`, hasUser, createDifferences);
  app.post(`/${CMS_SERVER_VERSION}/comparison/differences/edit/:id`, hasUser, editDifferences);
  app.post(`/${CMS_SERVER_VERSION}/comparison/differences/status/:id`, hasUser, statusDifferences);
  app.post(`/${CMS_SERVER_VERSION}/comparison/differences/remove/:id`, hasUser, removeDifferences);
};

/**
 * Find all differences and things
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getDifferencesNext(req, res) {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  async.parallel(
    {
      differences: getDifferences(skip, limit, query, sort),
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

      results.differences = _.chain(results.differences)
        .map((difference) => {
          if (difference.thing) {
            const thingName = hashThingsById[difference.thing.toString()];

            if (thingName) {
              difference.thingName = thingName;
            }
          }

          difference.comparisonImages = _.map(difference.comparisonImages, (comparisonImage) => {
            const place = comparisonImage.place;

            comparisonImage.image.country = hashCountriesById[place.country.toString()];
            comparisonImage.image.income = place.income;
            comparisonImage.image.place = place._id;
            comparisonImage.image.fullUrl = comparisonImage.fullUrl;

            return comparisonImage.image;
          });

          difference.snippetImages = _.map(difference.snippetImages, (snippetImage) => {
            const place = snippetImage.place;

            snippetImage.image.country = hashCountriesById[place.country.toString()];
            snippetImage.image.income = place.income;
            snippetImage.image.place = place._id;
            snippetImage.image.fullUrl = snippetImage.fullUrl;

            return snippetImage.image;
          });

          return difference;
        })
        .value();

      res.json({ success: !err, msg: [], data: results.differences, error: err });
    }
  );
}

/**
 * Create new difference
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function createDifferences(req, res) {
  /** @type DifferencesController */
  const difference = req.body;
  // tslint:disable-next-line:variable-name
  const Difference = new DifferencesController(difference);

  Difference.save((err, data) => {
    res.json({ success: !err, msg: [], data, error: err });
  });
}

/**
 * Update difference
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function editDifferences(req, res) {
  /** @type DifferencesController */
  const difference = req.body;
  const query = req.params.id ? { _id: req.params.id } : {};

  delete difference.__v;

  difference.comparisonImages = _.map(difference.comparisonImages, (image) => ({
    image: image._id,
    place: image.place,
    fullUrl: image.fullUrl
  }));

  difference.snippetImages = _.map(difference.snippetImages, (image) => ({
    image: image._id,
    place: image.place,
    fullUrl: image.fullUrl
  }));

  if (_.isEmpty(query)) {
    // tslint:disable-next-line:variable-name
    const Difference = new DifferencesController(difference);

    Difference.save((err, newDifference) => {
      res.json({ success: !err, msg: [], data: { comparison: newDifference }, error: err });
    });

    return;
  }

  DifferencesController.update(query, {
    $set: difference
  }).exec((err, numDifference) => {
    res.json({ success: !err, msg: [], data: { comparison: numDifference }, error: err });
  });
}

/**
 * Update status field for difference
 * @param {String} req.params.id - difference id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function statusDifferences(req, res) {
  DifferencesController.update({ _id: req.params.id }, { $set: { isHidden: req.body.status } }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

/**
 * Remove difference
 * @param {String} req.params.id - difference id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function removeDifferences(req, res) {
  DifferencesController.remove({ _id: req.params.id }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

/**
 * Get all differences
 * @param {Number} skip - skip
 * @param {Number} limit - limit
 * @param {Object} query - query
 * @param {Object} sort - sort
 * @returns {Function} - Function
 */
function getDifferences(skip, limit, query, sort) {
  return (cb) => {
    DifferencesController.find(query)
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
