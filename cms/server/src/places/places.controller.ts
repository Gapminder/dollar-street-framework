// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
// tslint:disable:no-floating-promises

import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime';
import * as _ from 'lodash';
import * as xlsx from 'xlsx';
import * as AWS from 'aws-sdk';
import * as async from 'async';
import * as moment from 'moment';
import * as request from 'request-promise-native';
import * as mongoose from 'mongoose';
import { UserEntity } from '../user/users.interfaces';
import { HouseMedia, MediaEntity, MediaThing, PlaceIconMedia, PortraitMedia } from '../.controllers/medias.interfaces';
import { LocationEntity, RegionHash } from '../.controllers/locations.interface';
import { ComparisonEntity } from '../comparisons/comparisons.interface';
import { PlaceCell, PlaceCellEntity } from './places.interface';
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
const Regions = mongoose.model('Regions');
// tslint:disable-next-line:variable-name
const Questions = mongoose.model('Questions');
// tslint:disable-next-line:variable-name
const Locations = mongoose.model('Locations');
// tslint:disable-next-line:variable-name
const InfoPlaces = mongoose.model('InfoPlaces');
// tslint:disable-next-line:variable-name
const Differences = mongoose.model('Differences');
// tslint:disable-next-line:variable-name
const Similarities = mongoose.model('Similarities');

let familyThingId;
let familyIconThingId;
let homeThingId;

const dbIdKey = '_id';

export const places = (app) => {
  const hasUser = app.get('validate').hasUser;
  const io = app.get('io');

  const nconf = app.get('nconf');
  const region = nconf.get('S3_REGION');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  AWS.config.region = region;
  AWS.config.update({
    accessKeyId: nconf.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('S3_SECRET_ACCESS_KEY')
  });

  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  familyIconThingId = new mongoose.Types.ObjectId(nconf.get('familyIconThingId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));

  const s3 = new AWS.S3();

  app.get(`/${CMS_SERVER_VERSION}/places`, hasUser, getAllPlaces);
  app.get(`/${CMS_SERVER_VERSION}/place/:id`, hasUser, getPlaceById);
  app.get(`/${CMS_SERVER_VERSION}/place/isPortraitAndIsHouse/:id`, hasUser, getPlaceIsPortraitAndIsHouse);
  app.get(`/${CMS_SERVER_VERSION}/placesAdmin`, hasUser, getOwnPlaces);
  app.get(`/${CMS_SERVER_VERSION}/places/names`, hasUser, getNamesPlaces);
  app.get(`/${CMS_SERVER_VERSION}/places/regions-and-countries`, hasUser, getRegionsAndCountries);
  app.get(`/${CMS_SERVER_VERSION}/photographers`, hasUser, getPhotographers);
  app.get(`/${CMS_SERVER_VERSION}/places/template`, hasUser, getTemplate);
  app.get(`/${CMS_SERVER_VERSION}/place-icons/:placeId`, hasUser, getPlaceIcons.bind(getPlaceIcons, S3_SERVER));
  app.get(
    `/${CMS_SERVER_VERSION}/images-tagging/:placeId`,
    hasUser,
    getPlaceImagesForImagesTagging.bind(getPlaceImagesForImagesTagging, S3_SERVER)
  );

  app.post(`/${CMS_SERVER_VERSION}/places/template/update`, hasUser, updatePlacesFromTemplate);
  app.post(`/${CMS_SERVER_VERSION}/places/create-template`, hasUser, createTemplate);
  app.post(`/${CMS_SERVER_VERSION}/place/confirm`, hasUser, createPlaceConfirm);
  app.post(`/${CMS_SERVER_VERSION}/places/new`, hasUser, createPlace);
  app.post(`/${CMS_SERVER_VERSION}/places/edit/:id`, hasUser, editPlaceById(io));
  app.post(`/${CMS_SERVER_VERSION}/places/edit/list/:id`, hasUser, editPlaceListById);
  app.post(`/${CMS_SERVER_VERSION}/place/:id/public`, hasUser, editPlacePublic);
  app.post(`/${CMS_SERVER_VERSION}/place/editFamilyInfo/:id`, hasUser, editPlaceFamilyInfo);
  app.post(`/${CMS_SERVER_VERSION}/places/editInfo/:id`, hasUser, editInfoById(io));
  app.post(`/${CMS_SERVER_VERSION}/places/isTrash/:id`, hasUser, placeOnTrashById);
  app.post(`/${CMS_SERVER_VERSION}/places/remove/:id`, hasUser, removePlaceAndOwnImagesById);
  app.post(`/${CMS_SERVER_VERSION}/edit/all_images`, hasUser, editAllImages(io));
  app.post(`/${CMS_SERVER_VERSION}/place-icons`, hasUser, updatePlaceIcons);
  app.post(`/${CMS_SERVER_VERSION}/images-tagging`, hasUser, updateImages);

  function getPlaceById(req, res) {
    const placeId = req.params.id;

    async.parallel(
      {
        places: getPlaceByIdWithoutInfo(placeId),
        info: getInfoPlace(placeId),
        hashQuestionsById: getHashQuestionsById,
        locations: getLocations
      },
      (err, results) => {
        if (err) {
          return res.json({ success: !err, msg: [], data: null, error: err });
        }

        const place = results.places[0];

        if (!place) {
          return res.json({ success: !err, msg: [], data: null, error: err });
        }

        const hashQuestionsById = results.hashQuestionsById;

        const hashCountries = _.reduce(
          results.locations,
          (result, locations) => {
            result[locations._id.toString()] = { _id: locations._id.toString(), name: locations.country };

            return result;
          },
          {}
        );

        // TODO: Removed question lead to null _id needs to be solved properly.
        const info = _.reduce(
          results.info,
          (result, item) => {
            const _id = _.get(item, '_id') || `WARNING-EMPTY-ID-${item.formId}`;
            item.id = hashQuestionsById[_id.toString()];
            result.push(item);

            return result;
          },
          []
        );

        place.info = info;
        place.country = hashCountries[place.country.toString()];

        return Users.find({ _id: place.author }, { _id: 0, firstName: 1, lastName: 1 })
          .limit(1)
          .lean()
          .exec((errorFindUser, users) => {
            if (errorFindUser) {
              return res.json({ success: !errorFindUser, msg: [], data: null, error: errorFindUser });
            }

            const user: UserEntity = _.first(users);

            place.photographer = `${user.firstName || ''} ${user.lastName || ''}`;

            return res.json({ success: !errorFindUser, msg: [], data: place, error: errorFindUser });
          });
      }
    );
  }

  function getPlaceIsPortraitAndIsHouse(req, res) {
    const placeId = req.params.id;

    Media.find({
      place: placeId,
      $or: [{ isPortrait: true }, { isHouse: true }]
    })
      .lean()
      .exec((err, media) => {
        res.json({ success: !err, msg: [], data: media, error: err });
      });
  }

  /**
   * @param {HttpRequest} req - http request
   * @param {Object} res - http response
   * @returns {void} - nothing
   */
  function getAllPlaces(req, res) {
    async.parallel(
      {
        places: getPlaces,
        hashPhotographersById: getHashPhotographersById
      },
      (err, results) => {
        if (err) {
          return res.json({ success: !err, msg: [], data: null, error: err });
        }

        const _places = results.places;
        const hashPhotographersById = results.hashPhotographersById;

        _.each(_places, (place) => {
          place.author = hashPhotographersById[place.author];
        });

        res.json({ success: !err, msg: [], data: results.places, error: err });
      }
    );
  }

  function getPlaces(cb) {
    Places.find({})
      .lean()
      .exec((err, _places) => {
        if (err) {
          return cb(err);
        }

        return cb(null, _places);
      });
  }

  /**
   * @param {HttpRequest} req - http request
   * @param {Object} res - http response
   * @returns {void} - nothing
   */
  function getOwnPlaces(req, res) {
    Places.find({})
      .lean()
      .exec((err, _places) => {
        if (err) {
          res.json({ success: !err, msg: [], data: false, error: err });

          return;
        }

        const placesNames = _.map(_places, (place) => place.name);

        const response = { places: _places, allPlacesName: placesNames };
        res.json({ success: !err, msg: [], data: response, error: err });
      });
  }

  /**
   * @param {HttpRequest} req - http request
   * @param {Object} res - http response
   * @returns {void} - nothing
   */
  function createPlace(req, res) {
    const user = req.user;
    const place = req.body;

    place.author = user.role === 'photographer' || user.role === 'ambassador' ? user._id : place.photographer._id;

    const date = moment(new Date()).format('YYYY-M-D');

    // tslint:disable-next-line:variable-name
    const Place = new Places({
      author: place.author,
      name: place.name,
      description: place.description,
      rating: place.rating,
      list: place.list,
      type: place.type._id,
      isTrash: false,
      incomeQuality: place.incomeQuality,
      aboutData: place.aboutData || '',
      income: Number(place.income),
      country: place.country,
      date
    });

    Place.save((err, _place) => {
      res.json({ success: !err, msg: [], data: _place, error: err });
    });
  }

  function editPlaceFamilyInfo(req, res) {
    const params = req.params;
    const place = req.body;

    Places.update(
      { _id: params.id },
      {
        $set: {
          familyInfo: place.familyInfo,
          familyInfoSummary: place.familyInfoSummary
        }
      }
    ).exec((err, num) => {
      res.json({ success: !err, msg: [], data: num, error: err });
    });
  }

  function editPlaceById(_io) {
    /**
     * @param {String} req.params.id - id of place
     * @param {Object} req.body - place obj
     *
     * @param {HttpRequest} req - http request
     * @param {Object} res - http response
     * @returns {void} - nothing
     */
    return (req, res) => {
      const param = req.params;
      const place = req.body;

      Places.update({ _id: param.id }, { $set: place }).exec((err, num) => {
        res.json({ success: !err, msg: [], data: num, error: err });
        _io.sockets.emit('comparison_income', place);
      });
    };
  }

  /**
   * @param {String} req.params.id - id of place
   * @param {Object} req.body - place obj
   *
   * @param {HttpRequest} req - http request
   * @param {Object} res - http response
   * @returns {void} - nothing
   */

  function editPlaceListById(req, res) {
    const param = req.params;
    const place = req.body;

    Places.update(
      { _id: param.id },
      {
        $set: {
          list: place.list
        }
      }
    ).exec((err, num) => {
      res.json({ success: !err, msg: [], data: num, error: err });
    });
  }

  function editPlacePublic(req, res) {
    const param = req.params;
    const place = req.body;

    Places.update(
      { _id: param.id },
      {
        $set: {
          isPublic: place.isPublic
        }
      }
    ).exec((err, num) => {
      res.json({ success: !err, msg: [], data: num, error: err });
    });
  }

  /**
   * @param {String} req.params.id - id of place
   * @param {Boolean} req.body.IsTrash - place in trash
   *
   * @param {HttpRequest} req - http request
   * @param {Object} res - http response
   * @returns {void} - nothing
   */

  function placeOnTrashById(req, res) {
    const params = req.params;
    const onTrash = req.body;

    Places.update(
      { _id: params.id },
      {
        $set: {
          isTrash: onTrash.isTrash
        }
      }
    ).exec((err, num) => {
      res.json({ success: !err, msg: [], data: num, error: err });
    });
  }

  function editInfoById(_io) {
    return (req, res) => {
      const params = req.params;
      const placeInfo = req.body;

      const infoPlace = [];

      _.forEach(placeInfo.info, (question) => {
        _.forEach(question.forms, (form) => {
          if (!form.answers) {
            return;
          }

          infoPlace.push({
            place: params.id,
            question: question._id,
            form: form.formId,
            answer: form.answers
          });
        });
      });

      async.eachLimit(infoPlace, 3, updateInfoPlace, (err) => {
        _io.sockets.emit('update_info', params.id);

        return res.json({ success: !err, msg: [], data: null, error: err });
      });
    };
  }

  /**
   * @param {String} req.params.id - id of place
   *
   * @param {HttpRequest} req - http request
   * @param {Object} res - http response
   * @returns {*} - nothing
   */

  function removePlaceAndOwnImagesById(req, res) {
    const pipe = { placeId: req.params.id };
    const w = callbackWrappersFactory(pipe);

    async.waterfall(
      [
        (cb) => {
          getMediasByPlaceId(pipe.placeId, w('images', cb));
        },
        (_pipe, cb) => {
          // if there are not images in S3, just remove place in DB
          if (!_pipe.images || !_pipe.images.length) {
            return cb(null, _pipe);
          }

          deleteImagesFromS3(_pipe.images, w(cb));
        },
        (_pipe, cb) => {
          if (!_pipe.images || !_pipe.images.length) {
            return cb(null, _pipe);
          }

          removeMediasByPlaceId(_pipe.placeId, w(cb));
        },
        (_pipe, cb) => {
          if (!_pipe.images || !_pipe.images.length) {
            return cb(null, _pipe);
          }

          removeComparisonMediasByPlaceId(_pipe.images, _pipe.placeId, w(cb));
        },
        (_pipe, cb) => {
          InfoPlaces.remove({ place: _pipe.placeId }).exec(w(cb));
        },
        (_pipe, cb) => {
          Places.remove({ _id: _pipe.placeId }).exec(w(cb));
        }
      ],
      (err) => {
        if (err) {
          return res.json({ success: !err, msg: [], data: false, error: err });
        }

        Places.find({ author: req.user._id }, { _id: 1 })
          .lean()
          .exec((findPlacesError, _places) => {
            if (findPlacesError) {
              return res.json({ success: !findPlacesError, msg: [], data: false, error: findPlacesError });
            }

            Media.count({ place: { $in: _.map(_places, '_id') } }, (countMediaError, count) => {
              if (countMediaError) {
                return res.json({ success: !countMediaError, msg: [], data: false, error: countMediaError });
              }

              if (count || req.user.role === 'admin') {
                return res.json({ success: !countMediaError, msg: [], data: true, error: countMediaError });
              }

              Users.update({ _id: req.user._id }, { $set: { role: 'ambassador' } }).exec((updateUserError) => {
                return res.json({ success: !updateUserError, msg: [], data: true, error: updateUserError });
              });
            });
          });
      }
    );
  }

  // todo: move to async utils service
  function callbackWrappersFactory(pipe) {
    /**
     * waterfall callback wrapper
     * @param {String|Function} field - name of field in pipe, or cb
     * @param {Function=} cb - should be called at the end
     * @returns {Function} - actual callback
     */
    return (field, _cb?) => (err, data) => {
      const cb = _cb || field;

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

  // todo: move to Medias repository
  function getMediasByPlaceId(placeId, cb) {
    Media.find({ place: placeId }, { src: 1, originFile: 1, amazonfilename: 1 })
      .lean()
      .exec(cb);
  }

  // todo: move to Medias repository
  function removeMediasByPlaceId(placeId, cb) {
    Media.remove({ place: placeId }).exec(cb);
  }

  // todo: move to MediasS3 service
  function genAllS3ImageFormats(image) {
    return [
      { Key: `${image.src}${image.originFile}` },
      { Key: `${image.src}original-${image.amazonfilename}` },
      { Key: `${image.src}thumb-${image.amazonfilename}` },
      { Key: `${image.src}devices-${image.amazonfilename}` },
      { Key: `${image.src}tablets-${image.amazonfilename}` },
      { Key: `${image.src}desktops-${image.amazonfilename}` }
    ];
  }

  // todo: move to MediasS3 service
  function deleteImagesFromS3(images, cb) {
    const imagesToRemove = _.chain(images)
      .map(genAllS3ImageFormats)
      .flatten()
      .chunk(200)
      .value();

    async.eachLimit(imagesToRemove, 3, deleteMediaPlaceAws, cb);
  }

  // todo: move to MediasS3 service
  function deleteMediaPlaceAws(medias, cb) {
    const params = {
      // todo: get from config
      Bucket: S3_BUCKET,
      Delete: {
        Objects: medias,
        Quiet: true
      }
    };

    s3.deleteObjects(params, cb);
  }

  function editAllImages(_io) {
    /**
     * Adding several medias to one thing
     *
     * @param {String} req.body[0] - id of place
     * @param {Object} req.body[1] - object of
     *
     * @param {HttpRequest} req - http request
     * @param {Object} res - http response
     * @returns {void} - nothing
     */
    return (req, res) => {
      const imagesId = req.body.imagesIs;
      const thingOptions = req.body.thingOptions;

      Media.find({ _id: { $in: imagesId } }, { things: 1 })
        .lean()
        .exec((err, images: MediaEntity[]) => {
          if (err) {
            return res.json({ success: err, msg: [], data: images, error: err });
          }

          async.eachLimit(
            images,
            100,
            (image, cb) => {
              let inThing = false;

              if (!image.things.length) {
                image.things.push(thingOptions);
                inThing = true;
              } else {
                _.forEach(image.things, (thing) => {
                  if (thing._id.toString() !== thingOptions._id) {
                    return;
                  }

                  inThing = true;

                  if (thingOptions.rating) {
                    thing.rating = thingOptions.rating;
                  }

                  if (thingOptions.tags) {
                    thing.tags = thing.tags.concat(thingOptions.tags);
                  }

                  if (thingOptions.hidden) {
                    thing.hidden = thingOptions.hidden;
                  }
                });
              }

              if (!inThing) {
                image.things.push(thingOptions);
              }

              const imageId = image._id;

              Media.update({ _id: imageId }, { things: image.things }).exec((updateMediaError) => {
                if (updateMediaError) {
                  _io.sockets.emit('media_update_error', updateMediaError);
                }

                _io.sockets.emit('media_update', { _id: imageId, things: image.things });
                cb(updateMediaError);
              });
            },
            (findMediaError) => {
              res.json({ success: !findMediaError, msg: [], data: true, error: findMediaError });
            }
          );
        });
    };
  }
};

function getPlaceByIdWithoutInfo(placeId) {
  return (cb) => {
    Places.find({ _id: placeId })
      .limit(1)
      .lean()
      .exec(cb);
  };
}

function getInfoPlace(placeId) {
  const placeIdObject = new mongoose.Types.ObjectId(placeId);

  return (cb) =>
    InfoPlaces.collection
      .aggregate([
        {
          $match: {
            place: placeIdObject
          }
        },
        {
          $group: {
            _id: '$question',
            forms: {
              $addToSet: {
                formId: '$form',
                answers: '$answer'
              }
            }
          }
        }
      ])
      .toArray(cb);
}

function getHashPhotographersById(cb) {
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

function getHashQuestionsById(cb) {
  Questions.find({}, { id: 1 })
    .lean()
    .exec((err, questions) => {
      if (err) {
        return cb(err);
      }

      const hashQuestionsById = _.reduce(
        questions,
        (result, question) => {
          result[question._id.toString()] = question.id;

          return result;
        },
        {}
      );

      return cb(null, hashQuestionsById);
    });
}

function getPlaceImagesForImagesTagging(S3_SERVER, req, res) {
  const params = req.params;
  const placeId = mongoose.Types.ObjectId(params.placeId);

  async.parallel(
    {
      images: getPlaceImages(S3_SERVER, placeId),
      hashThings: getThings
    },
    (err, result) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: result, error: err });
      }

      const hashThings = result.hashThings;

      _.forEach(result.images, (image) => {
        _.forEach(image.things, (thing) => {
          const thingName = hashThings[thing.toString()];

          if (!image.thingsName) {
            image.thingsName = [];
          }

          image.thingsName.push(thingName);
        });

        if (image.thingsName) {
          image.thingsName = _.sortBy(image.thingsName).join('<br/>');
        }
      });

      res.json({ success: !err, msg: [], data: result.images, error: err });
    }
  );
}

function getPlaceImages(S3_SERVER, placeId) {
  return (cb) => {
    Media.collection
      .aggregate([
        {
          $match: {
            place: placeId,
            isTrash: false
          }
        },
        {
          $project: {
            _id: 1,
            things: '$things._id',
            image: {
              $concat: ['url("', S3_SERVER, '$src', 'thumb-', '$amazonfilename', '")']
            }
          }
        }
      ])
      .toArray(cb);
  };
}

function getThings(cb) {
  Things.find({}, { thingName: 1 })
    .lean()
    .exec((err, things) => {
      if (err) {
        return cb(err);
      }

      const hashThings = _.reduce(
        things,
        (result, thing) => {
          result[thing._id.toString()] = thing.thingName;

          return result;
        },
        {}
      );

      cb(null, hashThings);
    });
}

function updateImages(req, res) {
  const images = req.body;

  async.parallel(
    {
      update: addThingToImages(images.update),
      remove: removeThingFromImages(images.remove)
    },
    (err, result) => {
      res.json({ success: !err, msg: [], data: result, error: err });
    }
  );
}

function addThingToImages(images: MediaThing[]) {
  return (cb) => {
    if (!images.length) {
      return cb(null);
    }

    async.each(
      images,
      (image, callback) => {
        const thing = {
          _id: image.thing,
          rating: 0,
          hidden: 'show',
          tags: []
        };

        Media.update({ _id: image._id }, { $push: { things: thing } }).exec(callback);
      },
      cb
    );
  };
}

function removeThingFromImages(images: MediaThing[]) {
  return (cb) => {
    if (!images.length) {
      return cb(null);
    }

    async.each(
      images,
      (image, callback) => {
        Media.update({ _id: image._id }, { $pull: { things: { _id: image.thing } } }).exec(callback);
      },
      cb
    );
  };
}

function getPlaceIcons(S3_SERVER, req, res) {
  const params = req.params;
  const placeId = mongoose.Types.ObjectId(params.placeId);

  Media.collection
    .aggregate([
      {
        $match: {
          place: placeId,
          isTrash: false,
          $or: [{ isPortrait: true }, { isHouse: true }, { isIcon: true }]
        }
      },
      {
        $project: {
          _id: 1,
          isPortrait: 1,
          isHouse: 1,
          isIcon: 1,
          image: {
            $concat: ['url("', S3_SERVER, '$src', 'thumb-', '$amazonfilename', '")']
          }
        }
      }
    ])
    .toArray((err, data) => {
      const portrait: PortraitMedia = {
        isPortrait: true,
        type: 'portrait'
      };

      const house: HouseMedia = {
        isHouse: true,
        type: 'house'
      };

      const placeIcon: PlaceIconMedia = {
        isIcon: true,
        type: 'icon'
      };

      _.forEach(data, (image) => {
        if (image.isPortrait) {
          portrait._id = image._id;
          portrait.image = image.image;
        }

        if (image.isHouse) {
          house._id = image._id;
          house.image = image.image;
        }

        if (image.isIcon) {
          placeIcon._id = image._id;
          placeIcon.image = image.image;
        }
      });

      const response = [portrait, house, placeIcon];

      res.json({ success: !err, msg: [], data: response, error: err });
    });
}

function updatePlaceIcons(req, res) {
  const body = req.body;
  const updateImage = [];

  if (body.old.isPortrait) {
    updateImage.push({ _id: body.old._id, isPortrait: false });
    updateImage.push({
      _id: body.newIcon._id,
      isPortrait: true,
      thing: {
        _id: familyThingId,
        rating: 0,
        hidden: 'show',
        tags: []
      }
    });
  }

  if (body.old.isHouse) {
    updateImage.push({ _id: body.old._id, isHouse: false });
    updateImage.push({
      _id: body.newIcon._id,
      isHouse: true,
      thing: {
        _id: homeThingId,
        rating: 0,
        hidden: 'show',
        tags: []
      }
    });
  }

  if (body.old.isIcon) {
    updateImage.push({ _id: body.old._id, isIcon: false });
    updateImage.push({
      _id: body.newIcon._id,
      isIcon: true,
      thing: {
        _id: familyIconThingId,
        rating: 0,
        hidden: 'show',
        tags: []
      }
    });
  }

  async.each(
    updateImage,
    (image, cb) => {
      if (!image._id) {
        return cb(null);
      }

      const imageId = image._id;

      delete image._id;

      Media.find({ _id: imageId }, { things: 1 })
        .limit(1)
        .lean()
        .exec((err, data) => {
          if (err) {
            return cb(err);
          }

          if (image.thing) {
            _.forEach(data[0].things, (thing) => {
              if (!image.thing || !thing._id) {
                return;
              }

              if (thing._id.toString() === image.thing._id.toString()) {
                delete image.thing;
              }
            });
          }

          if (image.thing) {
            image.$push = { things: image.thing };

            delete image.thing;
          }

          Media.update({ _id: imageId }, image).exec(cb);
        });
    },
    (err) => {
      res.json({ success: !err, msg: [], data: null, error: err });
    }
  );
}

/**
 * @param {HttpRequest} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getNamesPlaces(req, res) {
  Places.distinct('name')
    .lean()
    .exec((err, place) => {
      res.json({ success: !err, msg: [], data: place, error: err });
    });
}

/**
 * @param {HttpRequest} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getRegionsAndCountries(req, res) {
  return async.parallel(
    {
      hashRegions: getHashRegions,
      locations: getLocations
    },
    (err, results: { hashRegions: RegionHash; locations: LocationEntity[] }) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: null, error: err });
      }

      const hashRegions = results.hashRegions;
      const locations: LocationEntity[] = results.locations;

      const regions = _.chain(locations)
        .map('region')
        .uniq()
        .map((region) => ({ name: hashRegions[region.toString()] }))
        .sortBy('name')
        .value();

      const countries = _.map(locations, (location) => ({ name: location.country, code: location.code }));

      return res.json({
        success: !err,
        msg: [],
        data: { regions, countries: _.sortBy(countries, 'name') },
        error: err
      });
    }
  );
}

function getLocations(cb) {
  Locations.find({}, { region: 1, country: 1, code: 1 })
    .lean()
    .exec(cb);
}

function getHashRegions(cb) {
  Regions.find({})
    .lean()
    .exec((err, regions) => {
      if (err) {
        return cb(err);
      }

      const hashRegions: RegionHash = _.reduce(
        regions,
        (result, region) => {
          result[region._id.toString()] = region.name;

          return result;
        },
        {}
      );

      return cb(null, hashRegions);
    });
}

/**
 * @param {HttpRequest} req - http request
 * @param {Object} res - http response
 * @returns {void} - nothing
 */
function getPhotographers(req, res) {
  Users.find({ role: 'photographer' }, { lastName: 1, firstName: 1 })
    .sort({ firstName: 1 })
    .exec((err, photographers: UserEntity[]) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: null, error: err });
      }

      const newPhotographers = _.chain(photographers)
        .map((user) => ({
          _id: user._id,
          name: `${user.firstName || ''} ${user.lastName || ''}`
        }))
        .value();

      res.json({ success: !err, msg: [], data: newPhotographers, error: err });
    });
}

// todo: move to Comparison repository
function removeComparisonMediasByPlaceId(images, placeId, cb) {
  const imagesId = _.map(images, (image) => image._id.toString());

  async.parallel(
    {
      similarities: (callback) => {
        removeComparisonsImages('Similarities', imagesId, placeId, callback);
      },
      differences: (callback) => {
        removeComparisonsImages('Differences', imagesId, placeId, callback);
      }
    },
    cb
  );
}

// todo: move to Comparison repository
function removeComparisonsImages(type, imagesId, placeId, cb) {
  let comparisons = null;

  if (type === 'Similarities') {
    comparisons = Similarities;
  }

  if (type === 'Differences') {
    comparisons = Differences;
  }

  if (!comparisons) {
    cb('The wrong type comparison');
  }

  comparisons
    .find({
      $or: [{ 'snippetImages.image': { $in: imagesId } }, { 'comparisonImages.image': { $in: imagesId } }]
    })
    .lean()
    .exec((err, data) => {
      if (err) {
        cb(err);
      }

      async.each(
        data,
        (comparison: ComparisonEntity, collback) => {
          comparison.snippetImages = _.filter(
            comparison.snippetImages,
            (snippet) => imagesId.indexOf(snippet.image.toString()) === -1
          );

          comparison.comparisonImages = _.filter(
            comparison.comparisonImages,
            (comparisonImage) => imagesId.indexOf(comparisonImage.image.toString()) === -1
          );

          comparison.countries = _.filter(
            comparison.countries,
            (country) => country.place.toString() !== placeId.toString()
          );

          if (comparison.snippetImages.length < 2) {
            comparison.isHidden = true;
          }

          comparisons.update(
            { _id: comparison._id },
            {
              $set: comparison
            },
            collback
          );
        },
        cb
      );
    });
}

function createTemplate(req, res) {
  Places.find(
    {
      isTrash: false
    },
    {
      name: 1,
      income: 1,
      incomeQuality: 1,
      aboutData: 1
    }
  )
    .sort({ name: 1 })
    .lean()
    .exec((err, _places: PlaceEntity[]) => {
      if (err) {
        return res.json({ success: !err, msg: [], data: _places, error: err });
      }

      // tslint:disable-next-line:no-unbound-method
      const placesValues = _.map(_places, _.values);
      placesValues.unshift(['ID', 'Name', 'About the data', 'Income quality rating', 'Income']);

      const wsName = 'DS Places';
      const wb = {
        Sheets: {},
        Props: {},
        SSF: {},
        SheetNames: []
      };

      const ws = {};
      const range = { s: { c: 0, r: 0 }, e: { c: 0, r: 0 } };

      for (let R = 0; R !== placesValues.length; ++R) {
        if (range.e.r < R) {
          range.e.r = R;
        }

        for (let C = 0; C !== placesValues[R].length; ++C) {
          if (range.e.c < C) {
            range.e.c = C;
          }

          const cell: PlaceCell = { v: placesValues[R][C] };

          if (cell.v === null) {
            continue;
          }

          const cellRef = xlsx.utils.encode_cell({ c: C, r: R });

          if (typeof cell.v === 'number') {
            cell.t = 'n';
          } else if (typeof cell.v === 'boolean') {
            cell.t = 'b';
          } else {
            cell.t = 's';
          }

          ws[cellRef] = cell;
        }
      }

      ws['!ref'] = xlsx.utils.encode_range(range);
      ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 10 }];

      wb.SheetNames.push(wsName);
      wb.Sheets[wsName] = ws;
      xlsx.writeFile(wb, 'ds-places-template.xlsx');

      res.json({ success: !err, msg: [], data: true, error: err });
    });
}

function getTemplate(req, res) {
  const file = path.join(process.cwd(), 'ds-places-template.xlsx');

  const filename = path.basename(file);
  const mimetype = mime.lookup(file);

  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-type', mimetype);

  const filestream = fs.createReadStream(file);
  filestream.pipe(res);
}

function updatePlacesFromTemplate(req, res) {
  const file = req.files.file;
  const getFile = xlsx.readFile(file.path);

  const excelData: PlaceCellEntity[] = xlsx.utils.sheet_to_json(getFile.Sheets[getFile.SheetNames[0]]);

  const excelDataChunk = _.chunk(excelData, 100);
  const updatePlacesForParallel = {};

  _.forEach(excelDataChunk, (part, index) => {
    updatePlacesForParallel[`part${index}`] = updatePlacesByExcel(part);
  });

  async.parallelLimit(updatePlacesForParallel, 5, (err, results) => {
    if (err) {
      return res.json({ success: !err, msg: [], data: results, error: err });
    }

    fs.unlink(file.path, (error) => {
      res.json({ success: !error, msg: [], data: null, error });
    });
  });
}

function updatePlacesByExcel(_places: PlaceCellEntity[]) {
  return (callback) => {
    async.eachLimit(
      _places,
      5,
      (item: PlaceCellEntity, cb) => {
        let placeId: mongoose.Types.ObjectId;

        try {
          placeId = mongoose.Types.ObjectId(item.ID);
        } catch (err) {
          return cb(err);
        }

        Places.find({ _id: placeId }, { income: 1, name: 1, incomeQuality: 1, aboutData: 1 })
          .limit(1)
          .lean()
          .exec((err, data: PlaceEntity) => {
            if (err) {
              return cb(err);
            }

            const oldPlace = data[0];

            if (!oldPlace) {
              return cb(null);
            }

            const place: { find: { _id: mongoose.Types.ObjectId }; update: Partial<PlaceEntity> } = {
              find: { _id: placeId },
              update: {
                _id: placeId,
                name: item.Name ? item.Name : oldPlace.name,
                aboutData: item['About the data'] ? item['About the data'] : oldPlace.aboutData,
                income: item.Income && !isNaN(item.Income) ? +item.Income : oldPlace.income
              }
            };

            place.update.incomeQuality =
              item['Income quality rating'] && !isNaN(item['Income quality rating'])
                ? +item['Income quality rating']
                : oldPlace.incomeQuality || 0;

            Places.update(place.find, place.update).exec(cb);
          });
      },
      callback
    );
  };
}

async function createPlaceConfirm(req, res) {
  const body = req.body;

  const option = body.option ? 'Its OK with me' : 'Its not OK with me';
  const option1 = body.option1 ? 'Yes, its Ok with me' : 'No, its not OK with me';
  const option2 = body.option2 ? 'Yes' : 'No';

  const params = `entry.1418077589=${option}&entry.1974947278=${option1}&entry.1903320922=${option2}&entry.1063508143=${
    body.name
  }&entry.704409821=${body.email}&entry.1506837572=${body.work}`;

  try {
    await request({
      url: `https://docs.google.com/forms/d/1EDH5V0ak6HmB6WfgLWZai-rwvt6-_Rpg1-H9p4scCBQ/formResponse?${params}`,
      method: 'POST'
    }).promise();

    return res.json({ success: true, msg: [], data: null, error: null });
  } catch (error) {
    return res.json({ success: !error, msg: [], data: null, error });
  }
}

function updateInfoPlace(info, cb) {
  InfoPlaces.update(
    {
      place: info.place,
      question: info.question,
      form: info.form
    },
    info,
    {
      upsert: true
    }
  ).exec(cb);
}
