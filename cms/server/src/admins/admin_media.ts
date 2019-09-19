// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import { AdminsPlacesAndThingsMedia } from './admins.interface';
import { ThingEntity } from '../things/things.interface';
import { PlaceEntity } from '../../../../server/src/interfaces/places';

// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');
// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Locations = mongoose.model('Locations');
// tslint:disable-next-line:variable-name
const Categories = mongoose.model('Categories');

export const adminMedia = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/admin/filters/images`, isAdmin, getAllMedia);
};

/**
 * @typedef {Object} QueryFilters - list of filters
 * @property {String} amount
 * @property {String} category
 * @property {String} country
 * @property {String} date
 * @property {String} income
 * @property {String} photographer
 * @property {String} place
 * @property {String} rating
 * @property {String} thing
 */

/**
 * Filter images
 * @param {QueryFilters} req.query - list of filters
 *
 * @param {Object} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getAllMedia(req, res) {
  /** @type QueryFilters */
  const query = req.query;
  const url = req.url.split('?')[1];

  if (!url) {
    emptyQuery(res);

    return;
  }

  async.parallel(
    {
      countryId: getCountryId(query),
      photographerId: getPhotographerId(query)
    },
    (error, results) => {
      if (error) {
        res.json({ success: error, data: null, error });

        return;
      }

      query.country = results.countryId;
      query.photographer = results.photographerId;

      async.parallel(
        {
          readyPlace: filterByPlaces(query),
          readyThing: filterByThingsAndCategory(query)
        },
        (parallelErr, adminsMedia: AdminsPlacesAndThingsMedia) => {
          if (parallelErr) {
            res.json({ success: parallelErr, data: null, error: parallelErr });

            return;
          }
          const readyPlace: Dictionary<PlaceEntity[]> = _.get(adminsMedia, 'readyPlace');
          const readyThing: Dictionary<ThingEntity[]> = _.get(adminsMedia, 'readyThing');
          const placesIds = _.map(readyPlace, '_id');
          const thingsIds = _.map(readyThing, '_id');

          async.parallel(
            {
              categories: getAllCategory,
              countries: getCountriesPlaces,
              images: getImages(query, placesIds, thingsIds),
              photographers: getPhotographersPlaces,
              placeIncome: getAllPlacesIncome,
              places: getAllPlaces,
              things: getAllThings,
              hashCountriesById: getHashCountriesById,
              hashPhotographersById: getHashPhotographersById
            },
            (err, result) => {
              if (err) {
                return res.json({ success: !err, msg: [], data: null, error: err });
              }

              const hashCountriesById = result.hashCountriesById;
              const hashPhotographersById = result.hashPhotographersById;

              const countries = _.chain(result.countries)
                .map((country) => ({ name: hashCountriesById[country.country.toString()] }))
                .uniqBy('name')
                .sortBy('name')
                .value();

              const photographers = _.chain(result.photographers)
                .map((photographer) => ({ name: hashPhotographersById[photographer.author.toString()] }))
                .uniqBy('name')
                .sortBy('name')
                .value();

              const places = _.map(result.places, (place) => {
                place.author = hashPhotographersById[place.author];

                return place;
              });

              const newResults = {
                categories: result.categories,
                countries,
                images: result.images,
                photographers,
                placeIncome: result.placeIncome,
                places,
                things: result.things
              };

              // todo: placeIncome transform in hashSet
              /** @type {{success: boolean, msg: Array, data: {
               * categories: Categories[],
               * countries: Countries[],
               * images: Images[],
               * photographers: Photographers[],
               * placeIncome: PlaceIncome[],
               * places: Places[],
               * things: Things[]
               * }, error: Object}}*/
              const response = {
                success: !err,
                msg: [],
                data: newResults,
                error: err
              };

              res.json(response);
            }
          );
        }
      );
    }
  );
}

/**
 * Setting is query for rating
 *
 * @param {String} rating - filter of rating
 * @returns {Object} object
 */
function getQueryRatingFilter(rating) {
  if (!rating) {
    return { $gte: 0 };
  }

  switch (rating) {
    case '1':
      return { $lte: 1, $gte: 1 };
    case '2':
      return { $lte: 2, $gte: 2 };
    case '3':
      return { $lte: 3, $gte: 3 };
    case '4':
      return { $lte: 4, $gte: 5 };
    case '5':
      return { $lte: 5, $gte: 5 };
    case '6':
      return { $gt: 1 };
    case '7':
      return { $gt: 2 };
    case '8':
      return { $gt: 3 };
    case '9':
      return { $gt: 4 };
    case '10':
      return { $lt: 2 };
    case '11':
      return { $lt: 3 };
    case '12':
      return { $lt: 4 };
    case '13':
      return { $lt: 5 };
    default:
  }
}

/**
 * Setting is query for income
 *
 * @param {String} income - filter of rating
 * @returns {Object} object
 */
function getQueryIncomeFilter(income) {
  if (!income) {
    return { $gte: 0 };
  }

  switch (income) {
    case '1':
      return { $lte: 5 };
    case '2':
      return { $gte: 5, $lte: 9 };
    case '3':
      return { $gte: 10, $lte: 24 };
    case '4':
      return { $gte: 25, $lte: 49 };
    case '5':
      return { $gte: 50, $lte: 100 };
    case '6':
      return { $gte: 100 };
    default:
  }
}

/**
 * Setting is query for date
 *
 * @param {String} date - filter of rating
 * @returns {Object | String}
 */
function getQueryDateFilter(date) {
  if (!date) {
    return { $ne: null };
  }

  if (date) {
    const newDate = new Date(date);

    return moment(newDate).format('YYYY-M-D');
  }
}

/**
 * Get filters
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function emptyQuery(res) {
  async.parallel(
    {
      categories: getAllCategory,
      countries: getCountriesPlaces,
      photographers: getPhotographersPlaces,
      places: getAllPlaces,
      things: getAllThings,
      hashCountriesById: getHashCountriesById,
      hashPhotographersById: getHashPhotographersById
    },
    (err, results) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: null, error: err });
      }

      const hashCountriesById = results.hashCountriesById;
      const hashPhotographersById = results.hashPhotographersById;

      const countries = _.chain(results.countries)
        .map((country) => ({ name: hashCountriesById[country.country.toString()] }))
        .uniqBy('name')
        .sortBy('name')
        .value();

      const photographers = _.chain(results.photographers)
        .map((photographer) => ({ name: hashPhotographersById[photographer.author.toString()] }))
        .uniqBy('name')
        .sortBy('name')
        .value();

      const places = _.map(results.places, (place) => {
        place.author = hashPhotographersById[place.author];

        return place;
      });

      const result = {
        categories: results.categories,
        places,
        countries,
        photographers,
        things: results.things
      };

      /** @type {{success: boolean, msg: Array, data: {
       * categories: Categories[],
       * countries: Countries[],
       * photographers: Photographers[],
       * places: Places[],
       * things: Things[]
       * }, error: Object}}
       **/
      const response = {
        success: !err,
        msg: [],
        data: result,
        error: err
      };

      res.json(response);
    }
  );
}

function getCountryId(query) {
  return (cb) => {
    const countryName = query.country;

    if (!countryName) {
      return cb(null, null);
    }

    Locations.find({ country: countryName }, { _id: 1 })
      .limit(1)
      .lean()
      .exec((err, locations) => {
        if (err) {
          return cb(err);
        }

        const location = locations[0];

        if (!location) {
          return cb(null, null);
        }

        return cb(null, location._id.toString());
      });
  };
}

function getPhotographerId(query) {
  return (cb) => {
    const photographer = query.photographer;

    if (!photographer) {
      return cb(null, null);
    }

    const splitPhotographer = photographer.split(' ');

    const firstName = splitPhotographer[0];
    const lastName = splitPhotographer[1];

    Users.find({ firstName, lastName }, { _id: 1 })
      .limit(1)
      .lean()
      .exec((err, users) => {
        if (err) {
          return cb(err);
        }

        const user = users[0];

        if (!user) {
          return cb(null, null);
        }

        return cb(null, user._id.toString());
      });
  };
}

/**
 * Filter by place
 * @param {QueryFilters} query - list of filters
 * @returns {Function} Function
 */
function filterByPlaces(query) {
  return (cb) => {
    let options = null;
    const queryDate = getQueryDateFilter(query.date);
    const queryIncome = getQueryIncomeFilter(query.income);
    const photographer = query.photographer ? query.photographer : { $ne: null };

    console.log(query);
    console.log(queryDate);
    console.log(queryIncome);
    console.log(photographer);

    if (query.country && query.place) {
      options = {
        date: queryDate,
        name: query.place,
        country: query.country,
        income: queryIncome,
        photographer
      };

      findPlacesOnCountryAndPlaceName(options, cb);

      return;
    }

    if (!query.place && !query.country) {
      options = {
        date: queryDate,
        income: queryIncome,
        photographer
      };

      findPlaceWherePlaceNameAndCountryDoNotHave(options, cb);

      return;
    }

    if (query.country) {
      options = {
        date: queryDate,
        country: query.country,
        income: queryIncome,
        photographer
      };

      console.log('options', options);

      findPlacesOnCountry(options, cb);

      return;
    }

    if (query.place) {
      options = {
        date: queryDate,
        name: query.place,
        income: queryIncome,
        photographer
      };

      findPlacesOnPlaceName(options, cb);

      return;
    }

    cb('Not incorrect query!');
  };
}

/**
 * Filter by things and category
 * @param {QueryFilters} query - list of filters
 * @returns {Function} Function
 */
function filterByThingsAndCategory(query) {
  return (cb) => {
    let options = null;

    if (query.category && query.thing) {
      options = {
        categoryName: query.category,
        thingName: query.thing
      };

      findThingsByCategoryNameAndThingName(options, cb);

      return;
    }

    if (!query.category && !query.thing) {
      getAllThings(cb);

      return;
    }

    if (query.category) {
      findThingsByCategoryName(query.category, cb);

      return;
    }

    if (query.thing) {
      findThingsByThingName(query.thing, cb);

      return;
    }

    cb('Not incorrect query!');
  };
}

/**
 * Find things by category name and thing name
 * @param {OptionsThingsCategoryAndThingName} options - filter params
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findThingsByCategoryNameAndThingName(options, cb) {
  Categories.find({ name: options.categoryName }, { _id: 1 })
    .limit(0)
    .lean()
    .exec((err, category) => {
      if (err) {
        return cb(err);
      }

      Things.find({ thingName: options.thingName, thingCategory: category[0]._id })
        .lean()
        .exec(cb);
    });
}

/**
 * Find things by category name
 * @param {String} categoryName - category name
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findThingsByCategoryName(categoryName, cb) {
  Categories.find({ name: categoryName }, { _id: 1 })
    .limit(0)
    .lean()
    .exec((err, category) => {
      if (err) {
        return cb(err);
      }

      Things.find({ thingCategory: category[0]._id })
        .lean()
        .exec(cb);
    });
}

/**
 * Find things by thing name
 * @param {String} thingName - thing name
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findThingsByThingName(thingName, cb) {
  Things.find({ thingName })
    .lean()
    .exec(cb);
}

function getPhotographersPlaces(cb) {
  Places.find({ isTrash: false }, { _id: 0, author: 1 })
    .lean()
    .exec(cb);
}

function getCountriesPlaces(cb) {
  Places.find({ isTrash: false }, { _id: 0, country: 1 })
    .lean()
    .exec(cb);
}

/**
 * Get images
 * @param {QueryFilters} query - list of filters
 * @param {ObjectId[]} placesIds - list of places id
 * @param {ObjectId[]} thingsIds - list of things id
 * @returns {Function} Function
 */
function getImages(query, placesIds, thingsIds) {
  return (cb) => {
    const queryRating = getQueryRatingFilter(query.rating);

    Media.find(
      {
        isTrash: false,
        place: { $in: placesIds },
        'things._id': { $in: thingsIds },
        'things.rating': queryRating
      },
      {
        _id: 1,
        amazonfilename: 1,
        filename: 1,
        place: 1,
        rotate: 1,
        size: 1,
        src: 1,
        things: 1
      }
    )
      .sort({ _id: 1 })
      .lean()
      .exec(cb);
  };
}

/**
 * Find places on country and place name
 * @param {OptionsCountryAndPlaceName} options - filter params
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findPlacesOnCountryAndPlaceName(options, cb) {
  Places.find(
    {
      isTrash: false,
      date: options.date,
      name: options.name,
      country: options.country,
      income: options.income,
      author: options.photographer
    },
    {
      _id: 1
    }
  )
    .lean()
    .exec(cb);
}

/**
 * Find place where place name and country do not have
 * @param {OptionsCountryAndPlaceNameDoNotHave} options - filter params
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findPlaceWherePlaceNameAndCountryDoNotHave(options, cb) {
  Places.find(
    {
      isTrash: false,
      date: options.date,
      income: options.income,
      author: options.photographer
    },
    {
      _id: 1
    }
  )
    .lean()
    .exec(cb);
}

/**
 * Find place on country
 * @param {OptionsCountry} options - filter params
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findPlacesOnCountry(options, cb) {
  Places.find(
    {
      isTrash: false,
      date: options.date,
      country: options.country,
      income: options.income,
      author: options.photographer
    },
    {
      _id: 1
    }
  )
    .lean()
    .exec(cb);
}

/**
 * Find place on place name
 * @param {OptionsPlaceName} options - filter params
 * @param {Function} cb - callback
 * @returns {void} - nothing
 */
function findPlacesOnPlaceName(options, cb) {
  Places.find(
    {
      isTrash: false,
      date: options.date,
      name: options.name,
      income: options.income,
      author: options.photographer
    },
    {
      _id: 1
    }
  )
    .lean()
    .exec(cb);
}

function getAllPlaces(cb) {
  Places.find({ isTrash: false }, { name: 1, income: 1, author: 1 })
    .sort({ name: 1 })
    .lean()
    .exec(cb);
}

function getAllCategory(cb) {
  Categories.find({}, { _id: 1, name: 1 })
    .sort({ name: 1 })
    .lean()
    .exec(cb);
}

function getAllThings(cb) {
  Things.find({}, { thingName: 1, thingCategory: 1 })
    .sort({ thingName: 1 })
    .lean()
    .exec(cb);
}

function getAllPlacesIncome(cb) {
  Places.find(
    {
      isTrash: false
    },
    {
      income: 1
    }
  )
    .lean()
    .exec(cb);
}

function getHashCountriesById(cb) {
  Locations.find({}, { country: 1 })
    .lean()
    .exec((err, locations) => {
      if (err) {
        return cb(err);
      }

      const hashCountries = _.reduce(locations, (result, location) => {
        result[location._id.toString()] = location.country;

        return result;
      });

      return cb(null, hashCountries);
    });
}

function getHashPhotographersById(cb) {
  Users.find({}, { firstName: 1, lastName: 1 })
    .lean()
    .exec((err, users) => {
      if (err) {
        return cb(err);
      }

      const hashPhotographersById = _.reduce(users, (result, user) => {
        result[user._id.toString()] = `${user.firstName || ''} ${user.lastName || ''}`;

        return result;
      });

      return cb(null, hashPhotographersById);
    });
}

/**
 @typedef {Object} Categories - category
 @property {ObjectId} _id - category id
 @property {String} name - category name
 **/

/**
 @typedef {Object} Countries - country of places
 @property {ObjectId} _id - country id
 @property {String} name - country name
 **/

/**
 @typedef {Object} Images - all filtered images
 @property {ObjectId} _id - _id of image
 @property {String} amazonfilename - file name in amazon in format bcrypt
 @property {String} filename - name of image
 @property {ObjectId} place - place id of image
 @property {Number} rotate - how many degrees rotated image
 @property {String} size - size file of media
 @property {String} src - path of image
 @property {ThingsImage[]} things
 **/

/**
 @typedef {Object} Photographers - all photographers of places
 @property {ObjectId} _id - photographer id
 @property {String} name - photographer name
 **/

/**
 @typedef {Object} PlaceIncome - all income of places
 @property {ObjectId} _id - place id
 @property {String} income - income of place
 **/

/**
 @typedef {Object} Places - all places
 @property {ObjectId} _id - place id
 @property {Info[]} info - info of place
 @property {String} name - name of place
 **/

/**
 @typedef {Object} Things - all things
 @property {ObjectId} _id - thing id
 @property {ObjectId[]} thingCategory - categories of thing
 @property {String} thingName - thing name
 **/

/**
 @typedef {Object} ThingsImage - things of image
 @property {ObjectId} _id - _id of thing
 @property {String} hidden - hidden of thing
 @property {Number} rating - rating of thing
 @property {{text: String}} tags - tags of thing
 **/

/**
 @typedef {Object} Info - info of places
 @property {String} id - info id
 @property {String} answers - answers of place
 @property {String} questions - question of place
 @property {{formId: String, answers: String}[]} forms
 **/

/**
 @typedef {Object} OptionsCountryAndPlaceName - filter params
 @property {String} date - date create place
 @property {String} country - country of place
 @property {String} name - place name
 @property {String} photographer - photographer of place
 @property {String} income - income of place
 **/

/**
 @typedef {Object} OptionsCountryAndPlaceNameDoNotHave - filter params
 @property {String} date - date create place
 @property {String} photographer - photographer of place
 @property {String} income - income of place
 **/

/**
 @typedef {Object} OptionsCountry - filter params
 @property {String} date - date create place
 @property {String} country - country of place
 @property {String} photographer - photographer of place
 @property {String} income - income of place
 **/

/**
 @typedef {Object} OptionsPlaceName - filter params
 @property {String} date - date create place
 @property {String} name - place name
 @property {String} photographer - photographer of place
 @property {String} income - income of place
 **/

/**
 @typedef {Object} OptionsThingsCategoryAndThingName - filter params
 @property {String} categoryName - category name
 @property {String} thingName - thing name
 **/
