import { removeImageLocaly } from '../services/local-storage.service';
import { prepareImageForDownload } from '../services/image-proccess.service';
import { Application, Request, Response } from 'express';

module.exports = (app: Application) => {
  const config = app.get('nconf');

  const S3_BUCKET = config.get('S3_BUCKET');
  const AWS_CONFIG = {
    region: config.get('S3_REGION'),
    accessKeyId: config.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: config.get('S3_SECRET_ACCESS_KEY'),
    bucket: S3_BUCKET
  };
  const BASE_HREF = config.get('BASE_HREF');
  app.get(`${BASE_HREF}/v1/download-image/:id`, downloadImage);

  async function downloadImage(req: Request, res: Response) {
    const pathToLocalImage = await prepareImageForDownload(req.params.id, AWS_CONFIG);

    if (pathToLocalImage) {
      return res.download(pathToLocalImage, async (err: Error) => {
        if (err) {
          console.error(err);
        }

        try {
          await removeImageLocaly(pathToLocalImage);
        } catch (e) {
          console.error(e);
        }
      });
    }

    // tslint:disable
    return res.status(500).send({ status: false });
  }
};
