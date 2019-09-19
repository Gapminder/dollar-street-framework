import * as fs from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as mongoose from 'mongoose';
import { spawn } from 'child_process';
import * as gm from 'gm';
import * as _ from 'lodash';
import * as uuid from 'node-uuid';

import '../../../../server/src/models';
import { EPQueue } from './ep-queue';
import { UploadsOptions } from './uploads.interface';
import { MediaEntity } from '../.controllers/medias.interfaces';
import { UserEntity } from '../user/users.interfaces';
import { PlaceEntity } from '../../../../server/src/interfaces/places';

const GM = gm.subClass({ imageMagick: true });

// tslint:disable-next-line:variable-name
const Media = mongoose.model<MediaEntity>('Media');
// tslint:disable-next-line:variable-name
const Users = mongoose.model('Users');
// tslint:disable-next-line:variable-name
const Places = mongoose.model('Places');

export class Uploads {
  queue = new EPQueue({ concurrency: 5, timeout: 30000 });

  picturesInProgress = [];

  private readonly s3: AWS.S3;
  private readonly io;
  private readonly S3_BUCKET: string;

  constructor(io, s3, nconf) {
    this.S3_BUCKET = nconf.get('S3_BUCKET');
    this.s3 = s3;
    this.io = io;
  }

  async gmResize(options): Promise<void> {
    try {
      await _gmResizePromise(
        options.pathOrigin,
        'Line',
        90,
        options.size,
        options.gravity,
        options.gmSavePath,
        options.doResize
      );
      await this._amazonPutObjectPromise(options.sourcePath, options.destinationPath, options.type);
      fs.unlinkSync(options.sourcePath);
    } catch (error) {
      throw error;
    }
  }

  amazonPutObject(originalFilepath, pathSave, type, cb): void {
    // tslint:disable-next-line:no-this-assignment
    const mediaBody = fs.readFileSync(originalFilepath);
    const params = {
      Bucket: this.S3_BUCKET,
      Key: pathSave,
      ContentType: type,
      Body: mediaBody,
      ACL: 'public-read',
      CacheControl: 'max-age=2628000'
    };

    this.s3.putObject(params, cb);
  }

  async getUser(authorId): Promise<UserEntity> {
    return Users.findOne({ _id: authorId })
      .lean()
      .exec();
  }

  async setPhotograferUserRole(userId): Promise<void> {
    return Users.update({ _id: userId }, { $set: { role: 'photographer' } })
      .lean()
      .exec();
  }

  async getPlaceById(placeId): Promise<PlaceEntity> {
    return Places.findOne({ _id: placeId })
      .lean()
      .exec();
  }

  async add(file, placeId, type, user): Promise<void> {
    this.queue.add(async () => {
      // tslint:disable-next-line:max-line-length
      console.time(
        `start converting: User = ${user._id.toString()}, Place = ${placeId}, File = ${file.filename}, Type = ${type}`
      );
      try {
        const place = await this.getPlaceById(placeId);

        const fileNameToAmazon = uuid.v4();
        const splittedFilename = _.split(file.filename, '.');
        const originalFileExt = splittedFilename.pop();
        const targetFileExt = getMediaExt(originalFileExt);
        const pathSave = `media/${place.name}/${type}/${fileNameToAmazon}/`;
        const amazonfilename = `${fileNameToAmazon}.${targetFileExt}`;
        const originFile = `origin-file-format-${fileNameToAmazon}.${targetFileExt}`;
        const mediasOptions = getMediasOptions(amazonfilename);

        let progressStep = 0;
        const progressStepAmount = mediasOptions.length + 6;
        const progressStepDelta = Math.ceil(100 / progressStepAmount);

        let _size = Number(file.size) / (1024 * 1024);
        let size;

        if (_size < 1) {
          _size *= 1000;
          size = `${Math.round(_size)}kB`;
        } else {
          size = `${Math.round(_size)}Mb`;
        }

        const sessionPrefix = splittedFilename.shift();
        const filenameWithoutExtension = splittedFilename.join('.');
        const mediaObj = {
          filename: `${filenameWithoutExtension}.jpg`,
          mimetype: 'image/jpeg',
          originalMimeType: file.mimetype,
          originalFileExt,
          originFile,
          amazonfilename,
          src: pathSave,
          rotate: 0,
          size,
          place: place._id,
          isTrash: false,
          isPortrait: false,
          isApproved: false,
          isHouse: false,
          type: 'image',
          show: true,
          things: []
        };

        // TODO: rewrite it to Promise.all
        this.io.emit(
          'start_convert',
          Object.assign(mediaObj, {
            queue: 'queued',
            progress: progressStepDelta * progressStep
          })
        );

        for (const mediaOptions of mediasOptions) {
          this.io.emit(
            'convert_progress',
            Object.assign(mediaObj, {
              // tslint:disable-next-line:max-line-length
              queue: `Create new image and resize to ${mediaOptions.size.width}x${mediaOptions.size.height} for ${
                mediaOptions.mediaType
              }`,
              progress: progressStepDelta * ++progressStep
            })
          );

          const options: UploadsOptions = {
            pathOrigin: file.path,
            size: mediaOptions.size,
            gmSavePath: path.join(file.destination, `${mediaOptions.mediaPrefix}-${amazonfilename}`),
            // tslint:disable-next-line:max-line-length
            sourcePath: path.join(
              file.destination,
              `${mediaOptions.mediaPrefix}-${mediaOptions.amazonfilenameWithExt}`
            ),
            destinationPath: `${pathSave}${mediaOptions.mediaPrefix}-${mediaOptions.amazonfilenameWithExt}`,
            gravity: mediaOptions.gravity,
            type: mediaObj.mimetype
          };

          await this.gmResize(options);
        }

        await this.gmResize({
          pathOrigin: file.path,
          gmSavePath: path.join(file.destination, `${sessionPrefix}.${mediaObj.filename}.orig~`),
          sourcePath: path.join(file.destination, `${sessionPrefix}.${mediaObj.filename}.orig~`),
          destinationPath: `${pathSave}${originFile}`,
          type: mediaObj.mimetype,
          doResize: false
        });

        this.io.emit(
          'convert_progress',
          Object.assign(mediaObj, {
            queue: 'Convert to JPG',
            progress: progressStepDelta * ++progressStep
          })
        );

        await this.gmResize({
          pathOrigin: file.path,
          gmSavePath: path.join(file.destination, `${sessionPrefix}.${mediaObj.filename}.original~`),
          sourcePath: path.join(file.destination, `${sessionPrefix}.${mediaObj.filename}.original~`),
          destinationPath: `${pathSave}original-${amazonfilename}`,
          type: mediaObj.mimetype,
          doResize: false
        });

        this.io.emit(
          'convert_progress',
          Object.assign(mediaObj, {
            queue: `Create media in db`,
            progress: progressStepDelta * ++progressStep
          })
        );

        const _media = new Media(mediaObj);
        const media = (await _media.save()).toObject();

        this.io.emit(
          'convert_progress',
          Object.assign({}, media, {
            queue: `done`,
            progress: progressStepDelta * ++progressStep
          })
        );

        spawn('rm', ['-f', file.path]);

        this.io.emit(
          'convert_progress',
          Object.assign({}, media, {
            queue: `remove`,
            progress: progressStepDelta * ++progressStep
          })
        );
        this.io.emit(`add_loaded_image_${media.place.toString()}`, media);

        this.picturesInProgress = this.picturesInProgress.filter((item) => item.place !== place);

        const photographer = await this.getUser(place.author);

        if (photographer.role === 'admin') {
          throw new Error('User is not available');
        }

        this.io.emit(
          'update_user_role',
          Object.assign(mediaObj, {
            queue: `Update user role to photographer: ${photographer.firstName} ${photographer.lastName}`,
            progress: progressStepDelta * ++progressStep
          })
        );

        await this.setPhotograferUserRole(photographer._id);

        this.io.emit(
          'image_processing_finished',
          Object.assign(mediaObj, {
            // tslint:disable-next-line:max-line-length
            queue: `${file.filename}: Photographer = ${photographer._id.toString()}, Place = ${placeId}, File = ${
              file.filename
            }, Type = ${type}`,
            progress: 100
          })
        );

        // tslint:disable-next-line:max-line-length
        console.timeEnd(
          `start converting: User = ${user._id.toString()}, Place = ${placeId}, File = ${file.filename}, Type = ${type}`
        );
      } catch (error) {
        console.error(error);
        // tslint:disable-next-line:max-line-length
        console.timeEnd(
          `start converting: User = ${user._id.toString()}, Place = ${placeId}, File = ${file.filename}, Type = ${type}`
        );
        this.io.emit('convert_err', error);
      }
    });
  }

  private async _amazonPutObjectPromise(sourcePath, destinationPath, type): Promise<void> {
    return promisify(this.amazonPutObject.bind(this))(sourcePath, destinationPath, type);
  }
}

function getMediaExt(ext) {
  const _ext = ext.toLowerCase();

  if (_.includes(['nef', 'dng', 'tif', 'cr2', 'png'], _ext)) {
    return 'jpg';
  }

  if (_.includes(['mts', 'mov'], _ext)) {
    return 'mp4';
  }

  return _ext;
}

function extention(ext): string {
  if (
    ext.toLowerCase() === 'nef' ||
    ext.toLowerCase() === 'dng' ||
    ext.toLowerCase() === 'tif' ||
    ext.toLowerCase() === 'cr2'
  ) {
    return ext.toLowerCase();
  }

  if (ext.toLowerCase() === 'mts' || ext.toLowerCase() === 'mov') {
    return 'mp4';
  }

  return ext.toLowerCase();
}

function transformFileExt(file): string {
  return `${file.split('.')[0]}.${extention(file.split('.')[1])}`;
}

function getMediasOptions(amazonfilename) {
  return [
    {
      mediaType: 'thumb',
      mediaPrefix: 'thumb',
      size: {
        width: 300,
        height: 300
      },
      gravity: 'Center',
      amazonfilenameWithExt: amazonfilename
    },
    {
      mediaType: 'desktops',
      mediaPrefix: 'desktops',
      size: {
        width: 1024,
        height: 1024
      },
      gravity: 'NorthWest',
      amazonfilenameWithExt: transformFileExt(amazonfilename)
    },
    {
      mediaType: 'tablets',
      mediaPrefix: 'tablets',
      size: {
        width: 768,
        height: 768
      },
      gravity: 'NorthWest',
      amazonfilenameWithExt: transformFileExt(amazonfilename)
    },
    {
      mediaType: 'thumb',
      mediaPrefix: '480x480',
      size: {
        width: 480,
        height: 480
      },
      gravity: 'Center',
      amazonfilenameWithExt: transformFileExt(amazonfilename)
    },
    {
      mediaType: 'devices',
      mediaPrefix: 'devices',
      size: {
        width: 480,
        height: 480
      },
      gravity: 'NorthWest',
      amazonfilenameWithExt: transformFileExt(amazonfilename)
    },
    {
      mediaType: 'thumbnail',
      mediaPrefix: '150x150',
      size: {
        width: 150,
        height: 150
      },
      gravity: 'Center',
      amazonfilenameWithExt: transformFileExt(amazonfilename)
    }
  ];
}

function _gmResize(pathOrigin, interlace, quality, size, gravity, pathSave, doResize = true, cb): void {
  (doResize
    ? GM(pathOrigin)
        .noProfile()
        .setFormat('jpg')
        .strip()
        .interlace(interlace)
        .quality(quality)
        .resize(size.width, size.height, '^')
        .gravity(gravity)
        .extent(size.width, size.height)
    : GM(pathOrigin)
        .noProfile()
        .setFormat('jpg')
  ).write(pathSave, cb);
}

async function _gmResizePromise(...args): Promise<string> {
  return promisify(_gmResize)(...args);
}
