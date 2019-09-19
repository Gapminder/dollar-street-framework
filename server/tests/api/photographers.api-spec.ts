import { photographerProfileDataTemplate, photographerProfilePreviewTemplate } from './format-templates';

import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;
const getAllPhotographersUrl = `${API_URL}${BASE_HREF}/v1/photographers?&lang=en`;
const getPhotographerUrl = `${API_URL}${BASE_HREF}/v1/photographer-profile?lang=en&id=`;

describe('Photographer Page check', () => {
  const listOfPhotographers = [];
  const listOfPhotographersIds = [];
  const listOfPhotographersOneByOne = [];

  before(async () => {
    const getAllPhotographersList = await request({ method: 'GET', uri: getAllPhotographersUrl, json: true });

    listOfPhotographers.push(...getAllPhotographersList.data.photographersList);
    listOfPhotographersIds.push(...listOfPhotographers.map((thing) => thing.userId));

    for (const photographerId of listOfPhotographersIds) {
      const currentPhotographer = await request({
        method: 'GET',
        uri: `${getPhotographerUrl}${photographerId}`,
        json: true
      });
      listOfPhotographersOneByOne.push(currentPhotographer);
    }
  });

  it(`photographer data on all photographers page`, () => {
    const unexpectedErrors = [];

    for (const photographer of listOfPhotographers) {
      const expResult = joi.validate(photographer, photographerProfilePreviewTemplate);

      if (!!expResult.error) {
        unexpectedErrors.push({
          _id: photographer.userId,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });

  it(`photographer data on single photographer page`, () => {
    const unexpectedErrors2 = [];

    for (const photographer of listOfPhotographersOneByOne) {
      const expResult = joi.validate(photographer, photographerProfileDataTemplate);

      if (!!expResult.error) {
        unexpectedErrors2.push({
          _id: photographer.data._id,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors2).to.be.deep.equal([]);
  });

  it(`data consistency form All and Single photographer pages`, () => {
    listOfPhotographersOneByOne.forEach((photographer, index) => {
      expect(
        `${photographer.data.firstName} ${photographer.data.lastName}`,
        `${listOfPhotographers[index].name} has different name`
      ).equal(listOfPhotographers[index].name);
      expect(photographer.data.imagesCount, `${listOfPhotographers[index].name} has different imagesCount`).equal(
        listOfPhotographers[index].images
      );
      expect(photographer.data.placesCount, `${listOfPhotographers[index].name} has different placesCount`).equal(
        listOfPhotographers[index].places
      );
    });
  });
});
