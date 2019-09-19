// tslint:disable:no-floating-promises

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as async from 'async';

import * as uuid from 'node-uuid';
import * as mongoose from 'mongoose';
import * as express from 'express';
import * as multer from 'multer';
import * as mkdirp from 'mkdirp';
import * as sanitize from 'sanitize-filename';

import { subClass } from 'gm';

import { Uploads } from './work_with_queuing_pictures';
import { Uploads as UploadsV2 } from './test-queue';
import { ThingEntity } from '../things/things.interface';
import { UpdateUserMediaQuery, UserMediaQuery } from './uploads.interface';
import { ComparisonEntity } from '../comparisons/comparisons.interface';
import { UserEntity } from '../user/users.interfaces';

const gm = subClass({ imageMagick: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const {
        user: { _id: userId },
        params: { placeId, type = 'unsorted' }
      } = req;
      const dirpath = path.resolve(`uploads`, userId.toString(), placeId, type);

      mkdirp.sync(dirpath);

      return cb(null, dirpath);
    } catch (error) {
      return cb(error);
    }
  },
  filename: (req, file, cb) => {
    const newFilename = `${Date.now()}.${sanitize(file.originalname)}`;

    console.log(`${file.originalname} -> ${newFilename}`);

    return cb(null, newFilename);
  }
});

const upload = multer({ storage });
// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');
// tslint:disable-next-line:variable-name
const Differences = mongoose.model('Differences');
// tslint:disable-next-line:variable-name
const Similarities = mongoose.model('Similarities');

export const uploadsMedia = (app: express.Application) => {
  const nconf = app.get('nconf');
  const io = app.get('io');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');
  const region = nconf.get('S3_REGION');
  const S3_BUCKET = nconf.get('S3_BUCKET');

  AWS.config.region = region;
  AWS.config.update({
    accessKeyId: nconf.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('S3_SECRET_ACCESS_KEY')
  });

  const familyThingId = nconf.get('familyThingId');
  const homeThingId = nconf.get('homeThingId');

  const s3 = new AWS.S3();

  const hasUser = app.get('validate').hasUser;

  const queuingPictures = new Uploads(io, s3, nconf);
  const queuingPicturesV2 = new UploadsV2(io, s3, nconf);

  app.get(`/${CMS_SERVER_VERSION}/media`, hasUser, getAllMedia);
  app.post(`/${CMS_SERVER_VERSION}/image/display`, hasUser, updateDisplayImage);
  app.post(`/${CMS_SERVER_VERSION}/mediaIsTrash/:id`, hasUser, updateMediaIsTrash);
  app.post(
    `/${CMS_SERVER_VERSION}/upload/:placeId/:type`,
    hasUser,
    upload.single('file'),
    (req: express.Request & { user: UserEntity; file: multer.File }, res) => {
      const { placeId, type } = req.params;
      const root = process.cwd();
      const fileNameToAmazon = uuid.v4();

      const file = req.file;
      const fileExt = getFileExt(file.originalname);
      const fileMediaExt = getMediaExt(fileExt);

      const oldWritePath = path.join(root, 'uploads', `0${file.originalname}`);
      const origWritePath = path.join(root, 'uploads', transformFileExt(file.originalname));

      Places.find({ _id: placeId })
        .limit(1)
        .lean()
        .exec((findPlacesErr, data) => {
          if (findPlacesErr) {
            return res.json({ success: findPlacesErr, msg: [], data: false, error: findPlacesErr });
          }

          function _formImg() {
            const resizePath = path.join(root, 'uploads');
            const resizePathSave = path.join(resizePath, `thumb-${fileNameToAmazon}.${fileMediaExt}`);
            const pathSave = `media/${data[0].name}/${type}/${fileNameToAmazon}/`;
            const amazonFileName = `${fileNameToAmazon}.${fileMediaExt}`;
            const originFile = `origin-file-format-${fileNameToAmazon}.${fileExt}`;
            const original = `original-${fileNameToAmazon}.${fileMediaExt}`;
            const fileNameReseze = `${fileNameToAmazon}.${fileMediaExt}`;
            const amazonResizeSave = `media/${data[0].name}/image/${fileNameToAmazon}/`;

            return {
              file,
              resizePath,
              resizePathSave,
              pathSave,
              amazonFileName,
              originFile,
              original,
              fileNameReseze,
              amazonResizeSave,
              oldWritePath,
              origWritePath,
              trueAmazonfilename: `${fileNameToAmazon}.${fileMediaExt}`,
              trueSrc: `media/${data[0].name}/${type}/${fileNameToAmazon}/`
            };
          }

          const img = _formImg();
          let _size = Number(file.size) / (1024 * 1024);
          let size = '';

          if (_size < 1) {
            _size *= 1000;
            size = `${Math.round(_size)}kB`;
          } else {
            size = `${Math.round(_size)}Mb`;
          }

          const mediaObj = {
            filename: transformFileExt(file.originalname),
            originFile: img.originFile,
            amazonfilename: `${fileNameToAmazon}.${fileMediaExt}`,
            src: `media/${data[0].name}/${type}/${fileNameToAmazon}/`,
            rotate: 0,
            size,
            place: data[0]._id,
            isTrash: false,
            isPortrait: false,
            isApproved: false,
            isHouse: false,
            type: 'image',
            show: true,
            things: []
          };

          queuingPictures.add(img, data[0]._id, mediaObj, req.user);

          Users.find({ _id: data[0].author })
            .limit(1)
            .lean()
            .exec((findUsersErr, users) => {
              if (findUsersErr) {
                return res.json({ err: findUsersErr, success: !findUsersErr });
              }

              const user = users[0];

              if (user.role === 'admin') {
                return res.json({ err: !findUsersErr, success: findUsersErr });
              }

              Users.update({ _id: users._id }, { $set: { role: 'photographer' } })
                .lean()
                .exec((updateUserErr) => {
                  return res.json({ err: updateUserErr, success: !updateUserErr });
                });
            });
        });
    }
  );

  app.post(
    `/${CMS_SERVER_VERSION}/upload/v2/:placeId/:type`,
    hasUser,
    upload.single('file'),
    async (req: express.Request & { user: UserEntity; file: multer.File }, res) => {
      try {
        await queuingPicturesV2.add(req.file, req.params.placeId, req.params.type, req.user);

        return res.json({ success: true, msg: [], data: null, error: null });
      } catch (error) {
        return res.json({ success: false, msg: [], data: null, error });
      }
    }
  );

  app.post(`/${CMS_SERVER_VERSION}/removeMedia`, hasUser, (req: express.Request & { user: UserEntity }, res) => {
    const image = req.body;

    removeMedias(image, (removeMediasErr) => {
      if (removeMediasErr) {
        return res.json({ success: removeMediasErr, msg: [], data: false, error: removeMediasErr });
      }

      async.parallel(
        {
          similarities: (cb) => {
            removeComparisonsImage('Similarities', image._id, image.place, cb);
          },
          differences: (cb) => {
            removeComparisonsImage('Differences', image._id, image.place, cb);
          },
          updateUser: updateUser(image.place, req.user)
        },
        (parallelRemovingAndUpdatingErr) => {
          if (parallelRemovingAndUpdatingErr) {
            return res.json({
              success: parallelRemovingAndUpdatingErr,
              msg: [],
              data: false,
              error: parallelRemovingAndUpdatingErr
            });
          }

          const thingsId = _.map(req.body.things, '_id');

          Media.collection
            .aggregate([
              { $unwind: '$things' },
              { $match: { 'things._id': { $in: thingsId } } },
              { $group: { _id: '$things._id', count: { $sum: 1 } } }
            ])
            .toArray((getMediaErr, data) => {
              if (getMediaErr) {
                return res.json({ success: getMediaErr, msg: [], data: false, error: getMediaErr });
              }

              const countThingsId = _.map(data, '_id');

              const removeThingsRating = _.difference(thingsId, countThingsId);

              if (!removeThingsRating.length) {
                return res.json({ success: !getMediaErr, msg: [], data, error: getMediaErr });
              }

              async.each(
                removeThingsRating,
                (thingId, cb) => {
                  Things.update(
                    { _id: thingId },
                    {
                      $set: { rating: 0 }
                    }
                  ).exec(cb);
                },
                (updateThingErr) => {
                  res.json({ success: !updateThingErr, msg: [], data: true, error: updateThingErr });
                }
              );
            });
        }
      );
    });
  });

  app.post(`/${CMS_SERVER_VERSION}/rotate/:id`, hasUser, (req, res) => {
    const root = process.cwd();
    const media = req.body.media;
    const rotateDegrees = req.body.rotate;

    const amazonOriginPath = media.src;

    const mobileFile = `150x150-${media.amazonfilename}`;
    const pathMobile = `${root}/uploads/${mobileFile}`;

    const thumbFile = `thumb-${media.amazonfilename}`;
    const pathThumb = `${root}/uploads/${thumbFile}`;

    const desktopThumbFile = `480x480-${media.amazonfilename}`;
    const pathDesktopThumb = `${root}/uploads/${desktopThumbFile}`;

    const devicesFile = `devices-${media.amazonfilename}`;
    const pathDevices = `${root}/uploads/${devicesFile}`;

    const tabletsFile = `tablets-${media.amazonfilename}`;
    const pathTablets = `${root}/uploads/${tabletsFile}`;

    const desktopsFile = `desktops-${media.amazonfilename}`;
    const pathDesktops = `${root}/uploads/${desktopsFile}`;

    const originalFile = `original-${media.amazonfilename}`;
    const pathOriginal = `${root}/uploads/${originalFile}`;

    const files = [
      { name: mobileFile, pathAmazon: amazonOriginPath, pathLocal: pathMobile, rotateDegrees },
      { name: thumbFile, pathAmazon: amazonOriginPath, pathLocal: pathThumb, rotateDegrees },
      {
        name: desktopThumbFile,
        pathAmazon: amazonOriginPath,
        pathLocal: pathDesktopThumb,
        rotateDegrees
      },
      { name: devicesFile, pathAmazon: amazonOriginPath, pathLocal: pathDevices, rotateDegrees },
      { name: tabletsFile, pathAmazon: amazonOriginPath, pathLocal: pathTablets, rotateDegrees },
      { name: desktopsFile, pathAmazon: amazonOriginPath, pathLocal: pathDesktops, rotateDegrees },
      { name: originalFile, pathAmazon: amazonOriginPath, pathLocal: pathOriginal, rotateDegrees }
    ];

    rotateImage(files, (rotateImageErr) => {
      if (!rotateImageErr) {
        Media.update({ _id: req.params.id }, { $set: { rotate: rotateDegrees } }).exec((updateMediaError) => {
          if (updateMediaError) {
            return res.json({ done: false, err: updateMediaError });
          }

          return res.json({ done: true });
        });
      }

      return res.json({ done: false, err: rotateImageErr });
    });
  });

  app.post(`/${CMS_SERVER_VERSION}/mediaInfo/:id`, hasUser, (req, res) => {
    const options = req.body;
    const things = [];

    things.push(options.thing);

    if (options.isPortrait && options.thing._id !== familyThingId.toString()) {
      things.push({
        _id: familyThingId,
        hidden: 'show',
        rating: 0,
        tags: []
      });
    }

    if (options.isHouse && options.thing._id !== homeThingId.toString()) {
      things.push({
        _id: homeThingId,
        hidden: 'show',
        rating: 0,
        tags: []
      });
    }

    Media.update(
      { _id: req.params.id },
      {
        $set: {
          isHouse: options.isHouse,
          isPortrait: options.isPortrait,
          things
        }
      }
    ).exec((err, num) => {
      if (err) {
        return res.json({ success: !err, msg: [], num, error: err });
      }

      async.each(
        things,
        (thing, cb) => {
          Things.find({ _id: thing._id }, { rating: 1 })
            .limit(1)
            .lean()
            .exec((findThingsError, data) => {
              if (findThingsError) {
                return cb(findThingsError);
              }

              if (!data[0].rating) {
                return cb(null);
              }

              Things.update(
                { _id: thing._id },
                {
                  $set: { rating: 3 }
                }
              ).exec(cb);
            });
        },
        (findThingsError) => {
          res.json({ success: !findThingsError, msg: [], num: null, error: findThingsError });
        }
      );
    });
  });

  app.post(`/${CMS_SERVER_VERSION}/editMediaInfo/:id`, hasUser, (req, res) => {
    const options = req.body;

    const thingsId = _.map(options.things, '_id');

    if (options.isPortrait && thingsId.indexOf(familyThingId.toString()) === -1) {
      options.things.push({
        _id: familyThingId,
        hidden: 'show',
        rating: 0,
        tags: []
      });
    }

    if (options.isHouse && thingsId.indexOf(homeThingId.toString()) === -1) {
      options.things.push({
        _id: homeThingId,
        hidden: 'show',
        rating: 0,
        tags: []
      });
    }

    Media.update(
      { _id: req.params.id },
      {
        $set: {
          isHouse: options.isHouse,
          isPortrait: options.isPortrait,
          things: options.things
        }
      }
    ).exec((err, num) => {
      if (err) {
        return res.json({ success: !err, msg: [], num, error: err });
      }

      async.parallel(
        [
          (cb) => {
            async.each(
              options.things,
              (thing: ThingEntity, callback) => {
                Things.find({ _id: thing._id })
                  .lean()
                  .exec((findThingsError, data) => {
                    if (findThingsError) {
                      return callback(findThingsError);
                    }

                    if (!data[0].rating) {
                      return callback(null);
                    }

                    Things.update(
                      { _id: thing._id },
                      {
                        $set: { rating: 3 }
                      }
                    ).exec(callback);
                  });
              },
              cb
            );
          },
          (cb) => {
            if (!options.deleteRatingThings.length) {
              return cb(null);
            }

            async.each(
              options.deleteRatingThings,
              (thing, callback) => {
                Things.update(
                  { _id: thing },
                  {
                    $set: {
                      rating: 0
                    }
                  }
                ).exec(callback);
              },
              cb
            );
          }
        ],
        (updateThingsError, results) => {
          res.json({ success: !updateThingsError, msg: [], num: results, error: updateThingsError });
        }
      );
    });
  });

  app.get(`/${CMS_SERVER_VERSION}/download_image`, (req, res) => {
    const parseUrl = req.url.split('?')[1];
    const amazonPath = parseUrl.split(';')[0].split('=')[1];
    let fileName = parseUrl.split(';')[1].split('=')[1];
    let thing = parseUrl.split(';')[2].split('=')[1];
    let place = parseUrl.split(';')[3].split('=')[1];
    const income = parseUrl.split(';')[4].split('=')[1];
    const url = amazonPath.split('%20').join(' ');

    fileName = fileName.split('%20').join(' ');
    place = place.split('%20').join(' ');
    thing = thing.split('%20').join(' ');

    const imageKey = url;

    const getParams = {
      Bucket: S3_BUCKET,
      Key: imageKey
    };

    downloadImage(getParams);

    function downloadImage(downloadGetParams) {
      s3.getObject(downloadGetParams, (err, data: AWS.S3.Types.GetObjectOutput) => {
        if (err) {
          console.log(err, err.stack);

          if (downloadGetParams.Key.match('original-')) {
            return res.json({ success: !err, msg: [], data: false, error: err });
          }

          downloadGetParams.Key = downloadGetParams.Key.replace('origin-file-format-', 'original-');

          return downloadImage(downloadGetParams);
        }

        const mediaBody = data.Body;
        const pathToMedia = `${process.cwd()}/uploads/DS_${place}_${income}$_${thing}_${fileName}`;

        fs.writeFile(pathToMedia, mediaBody, (writeFileError) => {
          if (writeFileError) {
            console.log(writeFileError);

            return res.json({ success: !writeFileError, msg: [], data: false, error: writeFileError });
          }

          res.download(pathToMedia, (downloadResErr) => {
            if (downloadResErr) {
              console.log(downloadResErr);

              return res.json({ success: !downloadResErr, msg: [], data: false, error: downloadResErr });
            }

            fs.unlink(pathToMedia, (unlinkFsError) => {
              if (unlinkFsError) {
                return console.log(unlinkFsError);
              }

              console.log('good remove file');
            });
          });
        });
      });
    }
  });

  app.post(
    `/${CMS_SERVER_VERSION}/placeInfoImageUpload/:placeId`,
    hasUser,
    upload.single('file'),
    (req: express.Request & { file: multer.File }, res) => {
      Places.find({ _id: req.params.placeId })
        .limit(1)
        .lean()
        .exec((err, data) => {
          if (!err) {
            const root = process.cwd();

            const nameSplit = req.file.originalname.split('.');
            nameSplit[nameSplit.length - 1] = 'jpg';
            const fileName = nameSplit.join('.');

            const pathSave = `${root}/uploads/`;

            fs.createReadStream(req.file.path)
              .pipe(fs.createWriteStream(`${pathSave}${fileName}`))
              .on('finish', () => {
                const options = {
                  pathOrigin: `${pathSave}${fileName}`,
                  pathSave,
                  size: {
                    width: 450,
                    height: 450
                  },
                  name: fileName,
                  device: 'info',
                  amazonResizeSave: `media/${data[0].name}/`,
                  type: 'image/jpeg'
                };

                gmResize(options, () => {
                  removeTemporaryFile(`${pathSave}${fileName}`);
                  io.emit('update_info_image', req.params.placeId);

                  res.json({ success: !err, msg: [], data, error: err });
                });
              });
          }
        });
    }
  );

  function gmResize(options, cb) {
    const pathOrigin = options.pathOrigin;
    const pathSave = options.pathSave;
    const size = options.size;
    const name = options.name;
    const device = options.device;
    const amazonResizeSave = options.amazonResizeSave;
    const type = options.type;
    const width = size.width;
    const height = size.height;

    gm(pathOrigin)
      .resize(width, height)
      .autoOrient()
      .interlace('line')
      .write(path.join(pathSave, `${device}-${name}`), (err) => {
        if (err) {
          console.log('FAILED TO CREATE THUMBNAIL', JSON.stringify(err, null, 2), options);
          gmResize(options, cb);
        } else {
          amazonPutObject(
            path.join(pathSave, `${device}-${transformFileExt(name)}`),
            `${amazonResizeSave}${device}-${transformFileExt(name)}`,
            type,
            cb
          );
        }
      });
  }

  function amazonPutObject(sourceFilePath, destinationFilePath, type, cb) {
    fs.readFile(sourceFilePath, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        const mediaBody = Buffer.from(data);
        const params = {
          Bucket: S3_BUCKET,
          Key: destinationFilePath,
          ContentType: type,
          Body: mediaBody,
          ACL: 'public-read',
          CacheControl: 'max-age=2628000'
        };

        s3.putObject(params, (putObjectErr) => {
          if (putObjectErr) {
            console.log(putObjectErr);
          }

          removeTemporaryFile(sourceFilePath);

          if (cb) {
            cb();
          }
        });
      }
    });
  }

  function removeTemporaryFile(origWritePath) {
    fs.unlink(origWritePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  function rotateImage(files, cb) {
    const rotateArray = _.map(files, doRotateImage);

    async.parallel(rotateArray, cb);
  }

  function doRotateImage(cur) {
    const getParams = { Bucket: S3_BUCKET, Key: `${cur.pathAmazon}${cur.name}` };

    return (cb) => {
      s3.getObject(getParams, (err, data: AWS.S3.Types.GetObjectOutput) => {
        if (err) {
          console.log(`Error: ${err} in getObject`, err.stack);

          return cb(err);
        }
        const mediaBody = data.Body;

        fs.writeFile(cur.pathLocal, mediaBody, (writeFileErr) => {
          if (writeFileErr) {
            console.log(`Error: ${writeFileErr} in writeFile`);

            return cb(writeFileErr);
          }
          gm(cur.pathLocal)
            .rotate('transparent', cur.rotateDegrees)
            .interlace('line')
            .write(cur.pathLocal, (gmConvertError) => {
              if (gmConvertError) {
                console.log(`Error: ${gmConvertError} in rotate`);

                return cb(gmConvertError);
              }
              fs.readFile(cur.pathLocal, (readFileError, mediaContent) => {
                if (readFileError) {
                  console.log(`Error: ${readFileError} in readFile`);

                  return cb(readFileError);
                }
                const _mediaBody = Buffer.from(mediaContent);
                const imageType = cur.name.split('.');
                const putParams = {
                  Bucket: S3_BUCKET,
                  Key: `${cur.pathAmazon}${cur.name}`,
                  ContentType: `image/${imageType[imageType.length - 1]}`,
                  Body: _mediaBody,
                  ACL: 'public-read',
                  CacheControl: 'max-age=2628000'
                };

                const params = {
                  Bucket: S3_BUCKET,
                  Delete: {
                    Objects: [{ Key: `${cur.pathAmazon}${cur.name}` }],
                    Quiet: true
                  }
                };

                s3.deleteObjects(params, (deleteObjectsError) => {
                  if (deleteObjectsError) {
                    console.log(`Error: ${deleteObjectsError} in deleteObjects`, deleteObjectsError.stack);

                    return cb(deleteObjectsError);
                  }
                  s3.putObject(putParams, (putObjectError) => {
                    if (putObjectError) {
                      console.log(`Error: ${putObjectError} in putObject`, putObjectError.stack);

                      return cb(putObjectError);
                    }
                    fs.unlink(cur.pathLocal, cb);
                  });
                });
              });
            });
        });
      });
    };
  }

  function getFileExt(file) {
    return file.split('.')[1];
  }

  function getMediaExt(ext) {
    if (
      ext.toLowerCase() === 'nef' ||
      ext.toLowerCase() === 'dng' ||
      ext.toLowerCase() === 'tif' ||
      ext.toLowerCase() === 'cr2' ||
      ext.toLowerCase() === 'png'
    ) {
      return 'jpg';
    }

    if (ext.toLowerCase() === 'mts' || ext.toLowerCase() === 'mov') {
      return 'mp4';
    }

    return ext.toLowerCase();
  }

  function transformFileExt(file) {
    return `${file.split('.')[0]}.${getFileExt(file)}`;
  }

  function removeMedias(image, cb) {
    Media.remove({ _id: image._id }).exec((err) => {
      if (err) {
        console.log(err);
      }

      const params = {
        Bucket: S3_BUCKET,
        Delete: {
          Objects: [
            { Key: `${image.src}original-${image.amazonfilename}` },
            { Key: `${image.src}${image.originFile}` },
            { Key: `${image.src}thumb-${image.amazonfilename}` },
            { Key: `${image.src}devices-${image.amazonfilename}` },
            { Key: `${image.src}tablets-${image.amazonfilename}` },
            { Key: `${image.src}desktops-${image.amazonfilename}` },
            { Key: `${image.src}480x480-${image.amazonfilename}` },
            { Key: `${image.src}150x150-${image.amazonfilename}` }
          ],
          Quiet: true
        }
      };

      s3.deleteObjects(params, cb);
    });
  }
};

function getAllMedia(req, res) {
  Media.find({})
    .lean()
    .exec((err, data) => {
      res.json({ success: !err, msg: [], data, error: err });
    });
}

function updateDisplayImage(req, res) {
  Media.update({ _id: req.body.id }, { $set: { show: req.body.show } }).exec((err, num) => {
    res.json({ success: !err, msg: [], error: err, num });
  });
}

function updateMediaIsTrash(req, res) {
  Media.update({ _id: req.params.id }, { $set: { isTrash: req.body.isTrash } }).exec((err, data) => {
    res.json({ success: err, msg: [], data, error: err });
  });
}

function updateUser(placeId, user) {
  return (cb) => {
    const query: UserMediaQuery = {};

    if (user.role === 'admin') {
      query._id = mongoose.Types.ObjectId(placeId);
    } else {
      query.author = user._id;
    }

    Places.find(query, { _id: 1, author: 1 })
      .lean()
      .exec((err, places) => {
        if (err) {
          return cb(err);
        }

        Media.count({ place: { $in: _.map(places, '_id') } }).exec((countMediaError, count) => {
          if (countMediaError) {
            return cb(countMediaError);
          }

          if (count) {
            return cb(null);
          }

          const toUpdateUser: UpdateUserMediaQuery = {};

          toUpdateUser._id = user.role === 'admin' ? places[0].author : user._id;

          Users.update(toUpdateUser, { $set: { role: 'ambassador' } }).exec(cb);
        });
      });
  };
}

function removeComparisonsImage(type, imageId, imagePlaceId, cb) {
  let comparisons = null;

  if (type === 'Differences') {
    comparisons = Differences;
  }

  if (type === 'Similarities') {
    comparisons = Similarities;
  }

  comparisons
    .find({
      $or: [{ 'snippetImages.image': imageId }, { 'comparisonImages.image': imageId }]
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
            (snippet) => snippet.image.toString() !== imageId.toString()
          );

          comparison.comparisonImages = _.filter(
            comparison.comparisonImages,
            (comparisonImage) => comparisonImage.image.toString() !== imageId.toString()
          );

          comparison.countries = _.filter(
            comparison.countries,
            (country) => country.place.toString() !== imagePlaceId.toString()
          );

          if (comparison.snippetImages.length < 2) {
            comparison.isHidden = true;
          }

          comparisons
            .update(
              { _id: comparison._id },
              {
                $set: comparison
              }
            )
            .exec(collback);
        },
        cb
      );
    });
}
