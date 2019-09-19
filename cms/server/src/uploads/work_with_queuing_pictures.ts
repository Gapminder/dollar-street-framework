// tslint:disable:no-floating-promises

import * as fs from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as mongoose from 'mongoose';
import { spawn } from 'child_process';
import * as gm from 'gm';
import { EPQueue } from './ep-queue';
import { NewImageProcessing, UploadsOptions2 } from './uploads.interface';
import { MediaEntity } from '../.controllers/medias.interfaces';

const GM = gm.subClass({ imageMagick: true });

// tslint:disable-next-line:variable-name
const Media = mongoose.model<MediaEntity>('Media');

export class Uploads {
  queue = new EPQueue({ concurrency: 5, timeout: 30000, throwOnTimeout: true });

  queuningPictures: NewImageProcessing[] = [];
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
    const pathOrigin = options.pathOrigin;
    const pathSave = options.pathSave;
    const size = options.size;
    const name = options.name;
    const device = options.device;
    const amazonResizeSave = options.amazonResizeSave;
    const type = options.type;

    try {
      const gmSavePath = path.join(pathSave, `${device}-${name}`);
      const sourcePath = path.join(pathSave, `${device}-${transformFileExt(name)}`);
      const destinationPath = `${amazonResizeSave}${device}-${transformFileExt(name)}`;
      const gravity = options.thumb ? 'Center' : 'NorthWest';
      await _gmResizePromise(pathOrigin, 'Line', 90, size, gravity, gmSavePath);
      await this._amazonPutObjectPromise(sourcePath, destinationPath, type);
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

  async add(img, place, mediaObj, user): Promise<void> {
    mediaObj.queue = 'queued';
    mediaObj.progress = 0;

    const newImage: NewImageProcessing = {
      img,
      place,
      mediaObj
    };

    // this.queue.add(async () => {
    //   try {
    //     // await this.
    //   } catch (error) {
    //     console.error(error);
    //   }
    // });

    this.queuningPictures.push(newImage);

    await this.watch();
  }

  async watch(): Promise<void> {
    if (this.queuningPictures.length && this.picturesInProgress.length <= 5) {
      const picture = this.queuningPictures.shift();
      this.picturesInProgress.push(picture);

      const { img, mediaObj } = picture;

      try {
        mediaObj.queue = 'start converting';
        this.io.emit('start_convert', mediaObj);

        fs.copyFileSync(img.file.path, img.oldWritePath);

        const destinationPathSave = `${img.pathSave}${img.originFile}`;

        await this._amazonPutObjectPromise(img.oldWritePath, destinationPathSave, img.file.mimetype);

        mediaObj.queue = 'Convert to JPG';
        mediaObj.progress = 16;

        this.io.emit('convert_progress', mediaObj);

        fs.copyFileSync(img.file.path, img.origWritePath);

        const _destinationPathSave = `${img.pathSave}${img.original}`;
        await this._amazonPutObjectPromise(img.origWritePath, _destinationPathSave, img.file.mimetype);

        mediaObj.queue = 'Create thumbnail';
        mediaObj.progress = 32;

        this.io.emit('convert_progress', mediaObj);

        const size = { width: 300, height: 300 };
        await _gmResizePromise(img.file.path, 'Line', 90, size, 'Center', img.resizePathSave);
        const destinationPath = `${img.pathSave}thumb-${img.amazonFileName}`;
        await this._amazonPutObjectPromise(img.resizePathSave, destinationPath, img.file.mimetype);

        mediaObj.queue = 'resize to desktops';
        mediaObj.progress = 48;

        this.io.emit('convert_progress', mediaObj);

        const options: UploadsOptions2 = {
          pathOrigin: img.file.path,
          pathSave: img.resizePath,
          size: {
            width: 1024,
            height: 1024
          },
          name: img.fileNameReseze,
          device: 'desktops',
          amazonResizeSave: img.amazonResizeSave,
          type: img.file.mimetype
        };

        await this.gmResize(options);

        mediaObj.queue = 'resize to tablets';
        mediaObj.progress = 64;
        this.io.emit('convert_progress', mediaObj);

        options.size = {
          width: 768,
          height: 768
        };

        options.device = 'tablets';

        await this.gmResize(options);

        mediaObj.queue = 'create thumbnail - 480x480';
        mediaObj.progress = 90;

        this.io.emit('convert_progress', mediaObj);

        options.size = {
          width: 480,
          height: 480
        };

        options.thumb = true;
        options.device = '480x480';

        await this.gmResize(options);

        mediaObj.queue = 'resize to devices';
        mediaObj.progress = 90;

        this.io.emit('convert_progress', mediaObj);

        options.size = {
          width: 480,
          height: 480
        };

        options.thumb = false;
        options.device = 'devices';

        await this.gmResize(options);

        mediaObj.queue = 'create thumbnail - 150x150';
        mediaObj.progress = 90;

        this.io.emit('convert_progress', mediaObj);

        options.size = {
          width: 150,
          height: 150
        };

        options.thumb = true;
        options.device = '150x150';

        await this.gmResize(options);
        await this.addNewMedia(picture);

        await this.watch();
      } catch (error) {
        this.ifErr(error, img);
        await this.watch();
      }
    }
  }

  async addNewMedia(picture: NewImageProcessing): Promise<MediaEntity | void> {
    const { img, mediaObj, place } = picture;

    try {
      const _media = new Media(mediaObj);

      const media = (await _media.save()).toObject();

      mediaObj.queue = 'done';
      mediaObj.progress = 100;

      spawn('rm', ['-f', img.file.path]);

      mediaObj.queue = 'remove';
      mediaObj.progress = 100;

      this.io.emit('convert_progress', mediaObj);
      this.io.emit(`add_loaded_image_${media.place.toString()}`, media);

      this.picturesInProgress = this.picturesInProgress.filter((item) => item.place !== place);
    } catch (error) {
      throw error;
    }
  }

  ifErr(err, img, filePathToRemove?): void {
    if (err) {
      console.log(err);
    }

    if (filePathToRemove) {
      fs.unlinkSync(filePathToRemove);
    }

    this.io.emit('convert_err', { err, img });
  }

  private async _amazonPutObjectPromise(sourcePath, destinationPath, type): Promise<void> {
    try {
      await promisify(this.amazonPutObject.bind(this))(sourcePath, destinationPath, type);
    } catch (error) {
      throw error;
    } finally {
      fs.unlinkSync(sourcePath);
    }
  }
}

function extention(ext): string {
  if (
    ext.toLowerCase() === 'nef' ||
    ext.toLowerCase() === 'dng' ||
    ext.toLowerCase() === 'tif' ||
    ext.toLowerCase() === 'cr2'
  ) {
    return 'jpg';
  }

  if (ext.toLowerCase() === 'mts' || ext.toLowerCase() === 'mov') {
    return 'mp4';
  }

  return ext.toLowerCase();
}

function transformFileExt(file): string {
  return `${file.split('.')[0]}.${extention(file.split('.')[1])}`;
}

function _gmResize(pathOrigin, interlace, quality, size, gravity, pathSave, cb): void {
  GM(pathOrigin)
    .strip()
    .interlace(interlace)
    .quality(quality)
    .resize(size.width, size.height, '^')
    .gravity(gravity)
    .extent(size.width, size.height)
    .write(pathSave, cb);
}

async function _gmResizePromise(...args): Promise<string> {
  return promisify(_gmResize)(...args);
}
