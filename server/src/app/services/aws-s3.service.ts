// Todo: Need refactor according to "noImplicitAny" rule

import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk/lib/error';
import * as _ from 'lodash';

export class AwsS3Service {
  readonly S3_REGION: string;
  readonly S3_KEY_ID: string;
  readonly S3_ACCESS_KEY: string;
  readonly S3_SERVER_PREFIX: string;
  readonly S3_BUCKET: string;
  readonly S3: AWS.S3;
  readonly S3_PROTOCOL: string;
  readonly S3_SERVER: string;
  readonly S3_EMBED_VERSION: string;
  readonly S3_EMBED_FOLDER_PATH: string;

  readonly config: { bucket: string; server: string };

  constructor(nconf) {
    this.S3_REGION = nconf.get('S3_REGION');
    this.S3_KEY_ID = nconf.get('S3_ACCESS_KEY_ID');
    this.S3_ACCESS_KEY = nconf.get('S3_SECRET_ACCESS_KEY');
    this.S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
    this.S3_BUCKET = nconf.get('S3_BUCKET');
    this.S3_PROTOCOL = nconf.get('S3_PROTOCOL') || 'https';
    this.S3_EMBED_VERSION = nconf.get('S3_EMBED_VERSION');
    this.S3_SERVER = `//${this.S3_SERVER_PREFIX}${this.S3_BUCKET}/`;
    this.S3_EMBED_FOLDER_PATH = `shared/${this.S3_EMBED_VERSION}`;

    AWS.config.update({
      region: this.S3_REGION,
      accessKeyId: this.S3_KEY_ID,
      secretAccessKey: this.S3_ACCESS_KEY
    });

    this.S3 = new AWS.S3();

    // TODO: move to all credentials
  }

  async uploadBufferToS3(externalContext): Promise<void | AWSError> {
    const { folderpath, image, filename, contentType, metadata, requestUuid: uuid } = externalContext;
    const filepath = `${folderpath}/${filename}`;

    const params = {
      Bucket: this.S3_BUCKET,
      Key: filepath,
      ContentType: contentType,
      Body: image,
      ACL: 'public-read',
      CacheControl: 'max-age=2628000',
      Metadata: metadata
    };

    console.time(`aws.${uuid}: ${filepath}`);

    return new Promise<void | AWSError>((resolve, reject) => {
      this.S3.putObject(params, (err) => {
        console.timeEnd(`aws.${uuid}: ${filepath}`);

        return err ? reject(err) : resolve();
      });
    });
  }

  async getMetadataFromS3File(externalContext): Promise<AWS.S3.Types.HeadObjectOutput> {
    const { folderpath, filename } = externalContext;
    const filepath = `${folderpath}/${filename}`;

    const params = {
      Bucket: this.S3_BUCKET,
      Key: filepath
    };

    return new Promise<AWS.S3.Types.HeadObjectOutput>((resolve, reject) => {
      this.S3.headObject(params, (err: AWS.AWSError, data: AWS.S3.Types.HeadObjectOutput) => {
        if (err) {
          if (_.includes(err.toString(), 'NotFound')) {
            return resolve(null);
          }

          return reject(err);
        }

        const metadata = _.get(data, 'Metadata', null);

        return resolve(metadata);
      });
    });
  }

  getImageUrl(filename: string, folderpath: string) {
    return `${this.S3_PROTOCOL}:${this.S3_SERVER}${folderpath}/${filename}.jpeg`;
  }

  async downloadFromS3(externalContext): Promise<string> {
    const { folderpath, filename } = externalContext;
    const filepath = `${folderpath}/${filename}`;

    const params = {
      Bucket: this.S3_BUCKET,
      Key: filepath
    };

    return new Promise<string>((resolve, reject) => {
      this.S3.getObject(params, (err, data: { Body: Buffer }) => {
        if (err) {
          return reject(err);
        }

        const imageBuffer = data.Body;
        const imageBinary = imageBuffer.toString('binary');

        return resolve(imageBinary);
      });
    });
  }
}

export async function downloadFromS3(imageUrl, awsConfig): Promise<string> {
  const { region, accessKeyId, secretAccessKey, bucket } = awsConfig;
  AWS.config.update({
    region,
    accessKeyId,
    secretAccessKey
  });
  const s3 = new AWS.S3();
  const params = {
    Bucket: bucket,
    Key: imageUrl
  };

  return new Promise<string>((resolve, reject) => {
    s3.getObject(params, (err, data: { Body: Buffer }) => {
      if (err) {
        reject(err);
      }

      const imageBuffer = data.Body;
      const imageBinary = imageBuffer.toString('binary');

      resolve(imageBinary);
    });
  });
}
