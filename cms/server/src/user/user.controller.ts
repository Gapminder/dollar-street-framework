// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import { RelatedEntitiesAmount } from './users.interfaces';

import { subClass } from 'gm';

const gm = subClass({ imageMagick: true });

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');

export const user = (app) => {
  const isAdmin = app.get('validate').isAdmin;
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

  const s3 = new AWS.S3();

  const options = { bucket: S3_BUCKET, s3, S3_SERVER };

  app.get(`/${CMS_SERVER_VERSION}/user/:id`, isAdmin, getUser(options));
  app.put(`/${CMS_SERVER_VERSION}/user/:id`, isAdmin, editUser);
  app.post(`/${CMS_SERVER_VERSION}/user/avatar`, isAdmin, editUserAvatar(options));
};

function getUser(options) {
  return (req, res) => {
    const params = req.params;

    Users.find({ _id: params.id }, { salt: 0, password: 0 })
      .populate({
        path: 'country',
        select: 'country'
      })
      .lean()
      .exec((err, currentUser) => {
        if (err) {
          return res.json({ success: !err, msg: [], data: null, error: err });
        }

        const userObj = currentUser[0];

        async.waterfall(
          [getCountPlacesForUser(userObj._id), getCountImagesForUser],
          (error, results: RelatedEntitiesAmount) => {
            if (error) {
              return res.json({ success: !error, msg: [], data: null, error });
            }

            userObj.imagesCount = results.imagesCount;
            userObj.placesCount = results.placesCount;
            userObj.avatar = userObj.avatar ? `${options.S3_SERVER}${userObj.avatar}` : null;

            res.json({ success: !error, msg: [], data: userObj, error });
          }
        );
      });
  };
}

function getCountPlacesForUser(id) {
  return (cb) => {
    Places.find({ author: id }, { _id: 1 }).exec(cb);
  };
}

function getCountImagesForUser(places, cb) {
  const placesIds = _.map(places, (place) => new mongoose.Types.ObjectId(place._id));

  Media.count({ place: { $in: placesIds } }).exec((err, imagesCount) => {
    if (err) {
      return cb(err);
    }

    cb(null, { imagesCount, placesCount: placesIds.length });
  });
}

function editUser(req, res) {
  delete req.body.avatar;

  const body = req.body;
  const params = req.params;

  Users.update({ _id: params.id }, { $set: body }).exec((err, num) => {
    res.json({ success: !err, msg: [], data: err ? null : num, error: err });
  });
}

function editUserAvatar(options) {
  return (req, res) => {
    const body = req.body;
    const files = req.files;

    options.userId = body.userId;
    options.x = body.x;
    options.y = body.y;
    options.width = body.width;
    options.height = body.height;
    options.file = files[0];
    options.amasonFilePath = `users/${options.userId}/avatar.jpg`;

    fs.readFile(
      options.file.path,
      cropImage(
        options,
        convertImage(
          sendToAmazon(
            options,
            removeTemporaryFile(
              options.file.path,
              updateUserAvatar(options, (err) =>
                res.json({
                  success: !err,
                  msg: [],
                  data: err ? null : `${options.S3_SERVER}${options.amasonFilePath}`,
                  error: err
                })
              )
            )
          )
        )
      )
    );
  };
}

function cropImage(options, cb) {
  return (err, buffer) => {
    if (err) {
      return cb(err);
    }

    gm(buffer)
      .crop(options.width, options.height, options.x, options.y)
      .toBuffer('jpg', cb);
  };
}

function convertImage(cb) {
  return (err, buffer) => {
    if (err) {
      return cb(err);
    }

    gm(buffer)
      .interlace('plane')
      .resize(200, 200)
      .toBuffer('jpg', cb);
  };
}

function sendToAmazon(options, cb) {
  return (err, buffer) => {
    if (err) {
      return cb(err);
    }

    const params = {
      Bucket: options.bucket,
      Key: options.amasonFilePath,
      ContentType: 'image/jpeg',
      Body: buffer,
      ACL: 'public-read',
      CacheControl: 'max-age=2628000'
    };

    options.s3.putObject(params, cb);
  };
}

function removeTemporaryFile(origWritePath, cb) {
  return (err) => {
    if (err) {
      return cb(err);
    }

    fs.unlink(origWritePath, cb);
  };
}

function updateUserAvatar(options, cb) {
  return (err) => {
    if (err) {
      return cb(err);
    }

    Users.update({ _id: options.userId }, { $set: { avatar: options.amasonFilePath } }).exec(cb);
  };
}
