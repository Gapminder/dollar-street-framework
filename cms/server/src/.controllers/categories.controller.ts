// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';
import { ThingEntity } from '../things/things.interface';
import { CategoryEntity, CategoryQuery } from './categories.interface';
import { PlaceTypeEntity } from '../../../../server/src/interfaces/places';

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Categories = mongoose.model('Categories');
// tslint:disable-next-line:variable-name
const PlacesType = mongoose.model('TypesPlaces');

export const categories = (app) => {
  const hasUser = app.get('validate').hasUser;
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/categories/next`, hasUser, getPagingCategories);
  app.get(`/${CMS_SERVER_VERSION}/categories`, hasUser, getCategories);
  app.get(`/${CMS_SERVER_VERSION}/category/other`, hasUser, getOtherCategory);

  app.post(`/${CMS_SERVER_VERSION}/category/new`, hasUser, createCategory);
  app.post(`/${CMS_SERVER_VERSION}/category/edit/:id`, hasUser, editCategory);
  app.post(`/${CMS_SERVER_VERSION}/category/remove/:id`, isAdmin, removeCategory);
};

interface CategoriesContext {
  placesType?: PlaceTypeEntity[];
  hashSetThings?: { [key: string]: ThingEntity };
  placesTypeId?: mongoose.Types.ObjectId;
  categories?: CategoryEntity[];
}

function getPagingCategories(req, res) {
  const pipe: CategoriesContext = {};
  const w = callbackWrappersFactory(pipe);

  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  async.waterfall(
    [
      (cb) => {
        getCategoriesSkip(query, sort, skip, limit, w('categories', cb));
      },
      (_pipe, cb) => {
        if (!_pipe.categories || !_pipe.categories.length) {
          return cb(null, _pipe);
        }

        const categoriesId = _.map(_pipe.categories, '_id');

        getThingsCategories(categoriesId, w('things', cb));
      },
      (_pipe, cb) => {
        if (!_pipe.things || !_pipe.things.length) {
          return cb(null, _pipe);
        }

        _pipe.hashSetThings = _.reduce(
          _pipe.things,
          (result, thing) => {
            result[thing._id.toString()] = { thingCategory: thing.thingCategory.join().split(',') };

            return result;
          },
          {}
        );

        const thingsId = _.map(_pipe.things, '_id');

        getImagesThings(thingsId, w('images', cb));
      },
      (_pipe, cb) => {
        if (!_pipe.images || !_pipe.images.length) {
          return cb(null, _pipe);
        }

        _.forEach(_pipe.images, (image) => {
          if (!image.things.length) {
            return;
          }

          _.forEach(image.things, (thing) => {
            if (thing._id && _pipe.hashSetThings[thing._id.toString()]) {
              const thingObject = _pipe.hashSetThings[thing._id.toString()];

              if (!thingObject.placesTypeId) {
                thingObject.placesTypeId = [];
              }

              if (image.place && thingObject.placesTypeId.indexOf(image.place.type.toString()) === -1) {
                thingObject.placesTypeId.push(image.place.type.toString());
              }
            }
          });
        });

        const placesTypeId = _.map(_pipe.images, 'place.type');

        getPlacesTypePlaces(placesTypeId, w('placesType', cb));
      }
    ],
    (err, result: CategoriesContext) => {
      _.forEach(pipe.placesType, (placeType: PlaceTypeEntity) => {
        _.forIn(pipe.hashSetThings, (value: ThingEntity) => {
          const searchElement = placeType._id.toString();
          if (value.placesTypeId && value.placesTypeId.indexOf(searchElement) !== -1) {
            if (!value.placesType) {
              value.placesType = [];
            }

            if (value.placesType.indexOf(placeType.name) === -1) {
              value.placesType.push(placeType.name);
            }
          }
        });
      });

      _.forIn(pipe.hashSetThings, (value: ThingEntity) => {
        _.forEach(pipe.categories, (category: CategoryEntity) => {
          const searchElement = category._id.toString();
          if (value.thingCategory.indexOf(searchElement) !== -1) {
            if (!category.placesType) {
              category.placesType = [];
            }

            Array.prototype.push.apply(category.placesType, value.placesType);
            category.placesType = _.uniq(category.placesType);
          }
        });
      });

      res.json({ success: !err, msg: [], data: result.categories, error: err });
    }
  );
}

function getCategoriesSkip(query, sort, skip, limit, cb) {
  Categories.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .exec(cb);
}

function getThingsCategories(categoriesId, cb) {
  Things.find({ thingCategory: { $in: categoriesId } }, { _id: 1, thingCategory: 1 })
    .lean()
    .exec(cb);
}

function getImagesThings(thingsId, cb) {
  Media.find({ things: { $not: { $size: 0 } }, 'things._id': { $in: thingsId } }, { place: 1, things: 1 })
    .populate([{ path: 'place', select: 'type' }])
    .lean()
    .exec(cb);
}

function getPlacesTypePlaces(placesTypeId, cb) {
  PlacesType.find({ _id: { $in: placesTypeId } }, { name: 1 })
    .lean()
    .exec(cb);
}

// todo: move to async utils service
function callbackWrappersFactory(pipe) {
  /**
   * waterfall callback wrapper
   * @param {String|Function} field - name of field in pipe, or cb
   * @param {Function=} cb - should be called at the end
   * @returns {Function} - actual callback
   */
  return (field, _cb) => (err, data) => {
    const cb = _cb || field;

    if (typeof cb !== 'function') {
      console.error(err);

      return;
    }

    if (err) {
      console.error(err);

      return cb(err);
    }

    if (field) {
      pipe[field] = data;
    }

    return cb(err, pipe);
  };
}

/**
 * Get all categories
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getCategories(req, res) {
  Categories.find({})
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function getOtherCategory(req, res) {
  Categories.find({ name: 'Other' })
    .lean()
    .limit(0)
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data: data[0], error: err });
    });
}

/**
 * Create category
 * @param {Category} req.body
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */

function createCategory(req, res) {
  const data = req.body;

  const category = new Categories({
    name: data.name,
    description: data.description,
    list: data.list,
    rating: data.rating
  });

  category.save((err, newCategory) => {
    res.json({ success: !err, msg: [], data: newCategory, error: err });
  });
}

/**
 * Update category
 * @param {String} req.params.id - category id
 * @param {Category} req.body
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */

function editCategory(req, res) {
  const category = req.body;

  Categories.update(
    { _id: req.params.id },
    {
      $set: {
        name: category.name,
        description: category.description || '',
        list: category.list,
        rating: category.rating
      }
    }
  ).exec((err) => {
    res.json({ success: !err, msg: [], data: category, error: err });
  });
}

/**
 * Update category
 * @param {String} req.params.id - category id
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */

function removeCategory(req, res) {
  const params = req.params;

  async.parallel(
    {
      things: (cb) => {
        Things.update({ thingCategory: params.id }, { $pull: { thingCategory: req.params.id } }, { multi: true }).exec(
          cb
        );
      },
      category: (cb) => {
        Categories.remove({ _id: params.id }).exec(cb);
      }
    },
    (err, results) => {
      res.json({ success: !err, msg: [], data: results, error: err });
    }
  );
}

function preparationQuery(request) {
  const query: CategoryQuery = {};

  if (request.list) {
    query.list = request.list;
  }

  if (request.name) {
    query.$or = query.$or || [];
    query.$or.push({ name: { $regex: request.name, $options: 'i' } });
    query.$or.push({ description: { $regex: request.name, $options: 'i' } });
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
