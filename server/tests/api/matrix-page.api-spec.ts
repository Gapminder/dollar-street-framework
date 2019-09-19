import { allHousesOnMatrixPageTemplate, eachHouseOnMatrixPageTemplate } from './format-templates';
import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';
import * as querystring from 'querystring';

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

describe('Matrix page check', () => {
  const listOfHousesIds = [];
  const listOfEachFamilyDescription = [];

  before(async () => {
    const getAllFamiliesList = await request({ method: 'GET', uri: getHousesListUrl, json: true });

    listOfEachFamilyDescription.push(...getAllFamiliesList.data.streetPlaces);
    listOfHousesIds.push(...getAllFamiliesList.data.streetPlaces.map((thing) => thing._id));
  });

  it(`all houses on matrix page format`, () => {
    const unexpectedErrors = [];

    for (const house of listOfEachFamilyDescription) {
      const expResult = joi.validate(house, allHousesOnMatrixPageTemplate);

      if (!!expResult.error) {
        unexpectedErrors.push({
          _id: house._id,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });

  it('each house on matrix page format', async () => {
    const unexpectedErrors = [];

    for (const houseId of listOfHousesIds) {
      const getHousesUri = `${API_URL}${BASE_HREF}/v1/matrix-view-block/?placeId=${houseId}&thingId=Families&lang=en`;
      const house = await request({ method: 'GET', uri: getHousesUri, json: true });
      const expResult = joi.validate(house, eachHouseOnMatrixPageTemplate);

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
