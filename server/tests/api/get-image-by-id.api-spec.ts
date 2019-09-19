// Todo: Need refactor according to "noImplicitAny" rule

import 'mocha';
import * as path from 'path';
import * as chai from 'chai';
import * as request from 'request';
import * as piexif from 'piexifjs';
import * as fs from 'fs';
import { DataProvider } from '../data/data-provider';
import { credentialsService } from '../../../common/credential.service';

const pathToCredentials = '..';
const nconf = credentialsService.loadCredentials(pathToCredentials);
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;
const PHOTO_PATH = 'tests/temp';

describe('Download-image should ', () => {
  it('throw error for png', () => {
    try {
      const jpeg = fs.readFileSync(path.resolve(__dirname, `../../${PHOTO_PATH}/fakejpg.jpg`));
      const data = jpeg.toString('binary');
      piexif.load(data);
    } catch (error) {
      expect(error).to.be.equal("'load' gots invalid file data.");
    }
  });
  it('convert from png to jpg on fly', (done) => {
    const query = `${API_URL}${BASE_HREF}/v1/download-image/${DataProvider.imageDownload.PngToJpgImage.id}`;
    const responseStream = fs.createWriteStream(path.resolve(__dirname, `../../${PHOTO_PATH}/testjpg.jpg`));

    responseStream.on('finish', () => {
      try {
        const jpeg = fs.readFileSync(path.resolve(__dirname, `../../${PHOTO_PATH}/testjpg.jpg`));
        const data = jpeg.toString('binary');
        piexif.load(data);
        piexif.remove(data);
        fs.unlinkSync(path.resolve(__dirname, `../../${PHOTO_PATH}/testjpg.jpg`));

        return done();
      } catch (error) {
        return done(error);
      }
    });

    request
      .get(query)
      .on('error', (err) => {
        return done(err);
      })
      .on('response', (response) => {
        expect(response.statusCode).to.be.equal(200);
        expect(response.headers['content-length']).to.be.equal('700423');
        expect(response.headers['content-disposition']).to.be.equal(
          DataProvider.imageDownload.PngToJpgImage.contentDisposition
        );
        expect(response.headers['content-type']).to.be.equal('image/jpeg');
      })
      .pipe(responseStream);
  });
  it('returns correct jpg', (done) => {
    const query = `${API_URL}${BASE_HREF}/v1/download-image/${DataProvider.imageDownload.JpgImage.id}`;
    const responseStream = fs.createWriteStream(path.resolve(__dirname, `../../${PHOTO_PATH}/testjpg.jpg`));

    responseStream.on('finish', () => {
      try {
        const jpeg = fs.readFileSync(path.resolve(__dirname, `../../${PHOTO_PATH}/testjpg.jpg`));
        const data = jpeg.toString('binary');
        piexif.load(data);
        piexif.remove(data);
        fs.unlinkSync(path.resolve(__dirname, `../../${PHOTO_PATH}/testjpg.jpg`));

        return done();
      } catch (error) {
        return done(error);
      }
    });

    request
      .get(query)
      .on('error', (err) => {
        return done(err);
      })
      .on('response', (response) => {
        expect(response.statusCode).to.be.equal(200);
        expect(response.headers['content-length']).to.be.equal('3517550');
        expect(response.headers['content-disposition']).to.be.equal(
          DataProvider.imageDownload.JpgImage.contentDisposition
        );
        expect(response.headers['content-type']).to.be.equal('image/jpeg');
      })
      .pipe(responseStream);
  });
});
