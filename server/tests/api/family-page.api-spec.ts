import { eachHouseHeaderInfoTemplate, eachHousePageDataTemplate } from './format-templates';

import * as querystring from 'querystring';
import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;

const urlParams = {
  lang: 'en',
  thing: 'Families',
  countries: 'World',
  zoom: 4,
  mobileZoom: 4,
  lowIncome: 13,
  highIncome: 10813,
  currency: 'usd',
  time: 'month',
  resolution: '480x480'
};

const getHousesListUrl = `${API_URL}${BASE_HREF}/v1/things?${querystring.stringify(urlParams)}`;

describe('Family Page check', () => {
  const listOfHousesIds = [];
  const listOfEachFamilyDescription = [];

  before(async () => {
    const getListOfAllFamilies = await request({ method: 'GET', uri: getHousesListUrl, json: true });
    listOfHousesIds.push(...getListOfAllFamilies.data.streetPlaces.map((thing) => thing._id));

    for (const houseId of listOfHousesIds) {
      const getEachFamilyList = await request({
        method: 'GET',
        uri: `${API_URL}${BASE_HREF}/v1/home-media?placeId=${houseId}&resolution=480x480&lang=en`,
        json: true
      });

      listOfEachFamilyDescription.push({ ...getEachFamilyList, houseId: houseId });
    }
  });

  it('each family data format', () => {
    const unexpectedErrors = [];

    for (const family of listOfEachFamilyDescription) {
      const expResult = joi.validate(family, eachHousePageDataTemplate);

      if (!!expResult.error) {
        unexpectedErrors.push({
          _id: family.houseId,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });

  it('each family header info format', async () => {
    const unexpectedErrors = [];

    for (const houseId of listOfHousesIds) {
      const houseHeaderInfo = await request({
        method: 'GET',
        uri: `${API_URL}${BASE_HREF}/v1/home-header?placeId=${houseId}&lang=en`,
        json: true
      });

      const expResult = joi.validate(houseHeaderInfo, eachHouseHeaderInfoTemplate);

      if (!!expResult.error) {
        unexpectedErrors.push({
          _id: houseId,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });
});
