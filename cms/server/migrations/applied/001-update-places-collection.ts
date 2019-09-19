import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';
import { PlaceEntity } from '../../../../server/src/interfaces/places';

const Places = mongoose.model('Places');
const Questions = mongoose.model('Questions');
const Locations = mongoose.model('Locations');
const InfoPlaces = mongoose.model('InfoPlaces');

const infoToRemove = ['income', 'country', 'photographer', 'date', 'type'];
const dbIdKey = '_id';

exports.up = (next) => {
  async.parallel(
    {
      places: getPlaces,
      hashCountries: getHashCountries,
      hashQuestions: getHashQuestions
    },
    (getDataErr, results: { places: PlaceEntity[]; hashCountries: object; hashQuestions: object }) => {
      if (getDataErr) {
        console.error('parallel get data error: ', getDataErr);

        return next(getDataErr);
      }

      const places = results.places;
      const hashCountries = results.hashCountries;
      const hashQuestions = results.hashQuestions;

      const placesChunk = _.chunk(places, 100);
      const updatePlacesForParallel = {};

      _.forEach(placesChunk, (part, index) => {
        updatePlacesForParallel[`part${index}`] = updatePlaces(part, hashCountries, hashQuestions);
      });

      async.parallelLimit(updatePlacesForParallel, 5, (error) => {
        if (error) {
          console.error('parallelLimit error', error);

          return next(error);
        }

        console.log('Done');

        next();
      });
    }
  );
};

exports.down = (next) => {
  next();
};

function updatePlaces(places, hashCountries, hashQuestions): (callback) => void {
  return (callback) => {
    async.eachLimit(
      places,
      5,
      (item: PlaceEntity, cb) => {
        console.log('Start update place: ', item[dbIdKey]);

        const infoOfPlace = _.chain(item.info)
          .map((info) => {
            if (info.id === 'income') {
              item.income = info.answers;
            }

            if (info.id === 'country') {
              item.country = hashCountries[info.answers];
            }

            if (infoToRemove.indexOf(info.id) === -1) {
              return info;
            }
          })
          .compact()
          .value();

        const newPlace = {
          find: { _id: item[dbIdKey] },
          update: {}
        };

        delete item.info;

        createNewInfoForPlace(infoOfPlace, item[dbIdKey], hashQuestions, (err, newInfo) => {
          if (err) {
            console.error('Create new info for place error: ', err);

            return cb(err);
          }

          delete item[dbIdKey];

          newPlace.update = {
            $unset: { info: true },
            $set: item
          };

          async.parallel(
            {
              updatePlace: updatePlace(newPlace),
              updateInfoPlace: updateInfoPlace(newInfo)
            },
            cb
          );
        });
      },
      callback
    );
  };
}

function getPlaces(cb): void {
  Places.find({}, { __v: 0 })
    .lean()
    .exec(cb);
}

function getHashCountries(cb) {
  Locations.find({}, { country: 1 })
    .lean()
    .exec((err, countries) => {
      if (err) {
        return cb(err);
      }

      const hashCountries = _.reduce(
        countries,
        (result, country) => {
          result[country.country] = country[dbIdKey];

          return result;
        },
        {}
      );

      return cb(null, hashCountries);
    });
}

function getHashQuestions(cb): Promise<any> {
  return Questions.find({}, { id: 1 })
    .lean()
    .exec((err, questions) => {
      if (err) {
        return cb(err);
      }

      const hashQuestion = _.reduce(
        questions,
        (result, question) => {
          result[question.id] = question[dbIdKey];

          return result;
        },
        {}
      );

      return cb(null, hashQuestion);
    });
}

function createNewInfoForPlace(infoPlace, placeId, hashQuestions, cb): any {
  const newInfoFormat = [];

  _.forEach(infoPlace, (info) => {
    _.forEach(info.forms, (form) => {
      if (form.answers) {
        newInfoFormat.push({
          place: placeId,
          question: hashQuestions[info.id],
          form: form.formId,
          answer: form.answers
        });
      }
    });
  });

  return cb(null, newInfoFormat);
}

function updatePlace(place): (cb) => void {
  return (cb) => Places.collection.update(place.find, place.update, cb);
}

function updateInfoPlace(info): (cb) => any | void {
  return (cb) => {
    if (!info.length) {
      return cb(null);
    }

    return InfoPlaces.collection.insert(info, cb);
  };
}
