import * as fs from 'fs';
import * as AWS from 'aws-sdk';

export const downloadAllImagesPerThing = (app) => {
  const nconf = app.get('nconf');
  const region = nconf.get('S3_REGION');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  AWS.config.region = region;
  AWS.config.update({
    accessKeyId: nconf.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: nconf.get('S3_SECRET_ACCESS_KEY')
  });

  const s3 = new AWS.S3();
  const hasUser = app.get('validate').hasUser;
  const io = app.get('io');

  app.get(`/${CMS_SERVER_VERSION}/download/thing/images/archive/:name`, hasUser, (req, res) => {
    const url = req.url.split('/')[5];
    const name = url.split('%20').join(' ');

    res.tgz(`${process.cwd()}/uploads/${name}/`, `${name}.tar`, false);
  });

  app.post(`/${CMS_SERVER_VERSION}/download/all_images/one_thing`, hasUser, (req, res) => {
    const user = req.user._id;
    let thing = req.body.thing.split('/').join('_');

    thing += Date.now();

    const dir = `${process.cwd()}/uploads/${thing}`;

    fs.mkdir(dir, (err) => {
      if (err) {
        console.log(err);
      }

      const files = req.body.images;
      const index = files.length;

      // tslint:disable-next-line:no-empty
      amazonGetObject(files, dir, thing, user, index, () => {});

      res.json(req.body);
    });
  });

  function amazonGetObject(files, dir, thing, user, index, cb) {
    // tslint:disable-next-line:no-parameter-reassignment
    index--;

    if (index < 0) {
      setTimeout(() => {
        const spawn = require('child_process').spawn;

        // tslint:disable-next-line:no-empty
        spawn('rm', ['-rf', dir]).on('close', () => {});
      }, 3600000);

      return;
    }

    const image = files[index];
    /* todo: need load origin-file-format and change error handler*/
    const imageKey = `${image.src}${image.originFile.replace('origin-file-format-', 'original-')}`;
    const getParams = {
      Bucket: S3_BUCKET,
      Key: imageKey
    };

    s3.getObject(getParams, (err, data: AWS.S3.Types.GetObjectOutput) => {
      if (err) {
        console.log(err, err.stack, getParams);
        // tslint:disable-next-line:no-parameter-reassignment
        amazonGetObject(files, dir, thing, user, index--, cb);
        io.emit('image_to_archive', { count: index, user, archiveName: thing });

        return;
      }

      let income;

      if (image.income < 10) {
        income = '/income_000';
      }

      if (image.income < 100 && image.income >= 10) {
        income = '/income_00';
      }

      if (image.income < 1000 && image.income >= 100) {
        income = '/income_0';
      }

      if (image.income < 10000 && image.income >= 1000) {
        income = '/income_';
      }

      const mediaBody = data.Body;
      const path = `${dir}${income}${image.income}_${image.originFile}`;

      fs.writeFile(path, mediaBody, (error) => {
        if (error) {
          console.log('err 2', error);
          amazonGetObject(files, dir, thing, user, index, cb);

          return;
        }

        io.emit('image_to_archive', { count: index, user, archiveName: thing });
        amazonGetObject(files, dir, thing, user, index, cb);
      });
    });
  }
};
