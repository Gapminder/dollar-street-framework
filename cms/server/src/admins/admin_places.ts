// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as moment from 'moment';
import * as mongoose from 'mongoose';
import { AdminsPlacesQuery, AdminsSortQuery } from './admins.interface';
import { PlaceEntity } from '../../../../server/src/interfaces/places';

// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');
// tslint:disable-next-line:variable-name
const Locations = mongoose.model('Locations');
// tslint:disable-next-line:variable-name
const InfoPlaces = mongoose.model('InfoPlaces');
// tslint:disable-next-line:variable-name
const TypesPlaces = mongoose.model('TypesPlaces');

const dbIdKey = '_id';
let checkAdmin = null;

export const adminPlaces = (app) => {
  const hasUser = app.get('validate').hasUser;
  checkAdmin = app.get('validate').checkAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/admin_places`, hasUser, getPlaces);
  app.get(`/${CMS_SERVER_VERSION}/admin_places/place/:id`, hasUser, getPlace);
  app.get(`/${CMS_SERVER_VERSION}/admin_places/next`, hasUser, getPlacesPaging);
  app.get(`/${CMS_SERVER_VERSION}/admin_places/count`, hasUser, getPlacesAndCountryCount);
};

function getPlace(req, res): void {
  const id = req.params.id;

  Places.find({ _id: id })
    .limit(1)
    .lean()
    .exec((err, places) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: null, error: err });
      }

      res.json({ success: !err, msg: [], data: places[0], error: err });
    });
}

function getPlacesPaging(req, res): void {
  const request = req.query;
  const skip = parseInt(request.skip, 10);
  const limit = parseInt(request.limit, 10);
  const query = preparationQuery(request);
  const sort = preparationSort(request);

  async.parallel(
    {
      places: getPlacesByLimit(query, sort),
      imagePortrait: getImagePortrait,
      imagesCountPlace: getImagesCountPlace,
      imagesNoThing: getImagesNoThing,
      hashCountriesById: getHashCountriesById,
      hashPhotographersById: getHashPhotographersById,
      hashQuestionsCountByPlacesIds: getHashQuestionsCountByPlacesIds
    },
    (err, results) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: null, error: err });
      }

      let places = results.places;
      const hashCountriesById = results.hashCountriesById;
      const hashPhotographersById = results.hashPhotographersById;
      const hashQuestionsCountByPlacesIds = results.hashQuestionsCountByPlacesIds;

      _.forEach(places, (place) => {
        place.date = moment(new Date(place.date)).format('YYYY-M-D');
        place.country = {
          _id: place.country.toString(),
          name: hashCountriesById[place.country.toString()]
        };
        place.photographer = hashPhotographersById[_.get(place, 'author', '').toString()];
      });

      const placePortrait = _.reduce(
        results.imagePortrait,
        (result, image) => {
          result[image.place.toString()] = image.url;

          return result;
        },
        {}
      );

      const imagesCountPlace = _.reduce(
        results.imagesCountPlace,
        (result, image) => {
          result[image[dbIdKey].toString()] = image.count;

          return result;
        },
        {}
      );

      const imagesNoThing = _.reduce(
        results.imagesNoThing,
        (result, image) => {
          result[image[dbIdKey].toString()] = image.count;

          return result;
        },
        {}
      );

      const isAdmin = checkAdmin(req);

      if (!isAdmin) {
        places = _.filter(places, (place) => {
          return place.author && place.author.toString() === req.user[dbIdKey].toString();
        });
      }

      _.each(places, (place) => {
        place.imagesLength = imagesCountPlace[place[dbIdKey]] || 0;
        place.imagesThings = place.imagesLength - (imagesNoThing[place[dbIdKey]] || 0);
        place.portrait = placePortrait[place[dbIdKey]];
        place.questions = hashQuestionsCountByPlacesIds[place[dbIdKey]] || 0;
      });

      const pagingPlaces = _.sortBy(places, (place) => {
        if (sort.images) {
          return sort.images * place.imagesLength;
        }

        if (sort.thinged) {
          return sort.thinged * place.imagesThings;
        }

        if (sort.blacklisted) {
          return sort.thinged * place.list;
        }

        if (sort.questions) {
          return sort.questions * place.questions;
        }

        return void 0;
      }).splice(skip, limit);

      res.json({ success: !err, msg: [], data: pagingPlaces, error: err });
    }
  );
}

function getPlaces(req, res): void {
  async.parallel(
    {
      allPlacesName: getPlacesName,
      photographers: getPhotographers,
      placesType: getPlacesType,
      countries: getCountries
    },
    (err, results) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: results, error: err });
      }

      const placesType = results.placesType;

      const photographers = _.chain(results.photographers).map((user) => ({
        _id: user[dbIdKey],
        name: `${user.firstName || ''} ${user.lastName || ''}`
      }));

      /** @type {{places: Place[], placesType: PlacesType[], photographer: String[], allPlacesName: String[]}} */
      const dataSending = {
        placesType,
        photographers,
        allPlacesName: results.allPlacesName,
        countries: results.countries
      };

      res.json({ success: !err, msg: [], data: dataSending, error: err });
    }
  );
}

async function getPlacesAndCountryCount(req, res): Promise<void> {
  const request = req.query;
  const _query = preparationQuery(request);
  const isAdmin = checkAdmin(req);

  if (!isAdmin) {
    _query.author = mongoose.Types.ObjectId(req.user[dbIdKey]);
  }

  try {
    const placesCount = await getPlacesCount(_query);
    const countriesCount = _.uniq(await getCountriesCount(_query));

    return res.json({
      success: true,
      msg: [],
      data: { placesCount, countriesCount: countriesCount.length },
      error: null
    });
  } catch (error) {
    return res.json({ success: !error, msg: [], data: null, error });
  }
}

async function getPlacesCount(_query): Promise<number> {
  return Places.count(_query).exec();
}

async function getCountriesCount(_query): Promise<PlaceEntity[]> {
  return Places.find(_query)
    .distinct('country')
    .lean()
    .exec();
}

function getPlacesByLimit(query, sort): (cb) => void {
  return (cb) => {
    Places.find(query, { familyInfo: 0, familyInfoSummary: 0 })
      .sort(sort)
      .lean()
      .exec(cb);
  };
}

function getHashCountriesById(cb): void {
  Locations.find({}, { country: 1 })
    .lean()
    .exec((err, locations) => {
      if (err) {
        return cb(err);
      }

      const hashCountriesById = _.reduce(
        locations,
        (result, location) => {
          result[location[dbIdKey].toString()] = location.country;

          return result;
        },
        {}
      );

      return cb(null, hashCountriesById);
    });
}

function getHashPhotographersById(cb): void {
  Users.find({}, { firstName: 1, lastName: 1 })
    .lean()
    .exec((err, users) => {
      if (err) {
        return cb(err);
      }

      const hashPhotographersById = _.reduce(
        users,
        (result, user) => {
          result[user[dbIdKey].toString()] = `${user.firstName} ${user.lastName}`;

          return result;
        },
        {}
      );

      return cb(null, hashPhotographersById);
    });
}

function getHashQuestionsCountByPlacesIds(cb): void {
  InfoPlaces.collection
    .aggregate([
      {
        $group: {
          _id: '$place',
          count: { $sum: 1 }
        }
      }
    ])
    .toArray((err, info) => {
      if (err) {
        return cb(err);
      }

      const hashQuestionsCountByPlacesIds = _.reduce(
        info,
        (result, item) => {
          result[item[dbIdKey].toString()] = item.count;

          return result;
        },
        {}
      );

      return cb(null, hashQuestionsCountByPlacesIds);
    });
}

/**
 * Get all places
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getPlacesName(cb): void {
  Places.find({})
    .distinct('name')
    .lean()
    .exec(cb);
}

/**
 * Get all photographers
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getPhotographers(cb): void {
  Users.find({ role: 'photographer' }, { lastName: 1, firstName: 1 })
    .sort({ firstName: 1 })
    .lean()
    .exec(cb);
}

/**
 * Get all places type
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getPlacesType(cb): void {
  TypesPlaces.find({})
    .sort({ name: 1 })
    .lean()
    .exec(cb);
}

/**
 * Get all countries
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getCountries(cb): void {
  Locations.find({}, { country: 1, code: 1 })
    .sort({ country: 1 })
    .lean()
    .exec((err, locations) => {
      if (err) {
        return cb(err);
      }

      const countries = _.map(locations, (location) => ({
        _id: location[dbIdKey],
        name: location.country,
        code: location.code
      }));

      cb(null, countries);
    });
}

/**
 * Get all image portrait
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getImagePortrait(cb): void {
  Media.collection
    .aggregate([
      {
        $match: { isPortrait: true, place: { $ne: null } }
      },
      {
        $project: {
          place: '$place',
          url: {
            $concat: ['$src', 'thumb-', '$amazonfilename']
          }
        }
      }
    ])
    .toArray(cb);
}

/**
 * Get numbers images in place
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getImagesCountPlace(cb): void {
  Media.collection
    .aggregate([
      {
        $match: { place: { $ne: null } }
      },
      {
        $group: {
          _id: '$place',
          count: { $sum: 1 }
        }
      }
    ])
    .toArray(cb);
}

/**
 * Get the images that are not things
 * @param {Function} cb - callback function
 * @returns {void} - nothing
 */
function getImagesNoThing(cb): void {
  Media.collection
    .aggregate([
      {
        $match: { place: { $ne: null } }
      },
      {
        $match: {
          things: { $size: 0 }
        }
      },
      {
        $group: {
          _id: '$place',
          count: { $sum: 1 }
        }
      }
    ])
    .toArray(cb);
}

function preparationQuery(request): AdminsPlacesQuery {
  const query: AdminsPlacesQuery = {
    isTrash: JSON.parse(request.isTrash)
  };

  if (request.list) {
    query.list = request.list;
  }

  if (request.placeTypeId) {
    query.type = mongoose.Types.ObjectId(request.placeTypeId);
  }

  if (request.name) {
    query.name = { $regex: request.name, $options: 'i' };
  }

  return query;
}

function preparationSort(request): AdminsSortQuery {
  const query: AdminsSortQuery = request.sort ? JSON.parse(request.sort) : { name: 1 };

  if (query.blacklisted) {
    query.list = query.blacklisted;

    delete query.blacklisted;
  }

  return query;
}
