import { mapCountriesTemplate, mapPageCommon, mapPlacesTemplate } from './format-templates';

import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;
const getTheMapsUrl = `${API_URL}${BASE_HREF}/v1/map?thing=Families`;

describe('Map Page check', () => {
  let getMapData;
  let getMapRout;

  before(async () => {
    getMapRout = await request({ method: 'GET', uri: getTheMapsUrl, json: true });
    getMapData = getMapRout.data;
  });

  it('Should have correct general format', () => {
    const expResult = joi.validate(getMapRout, mapPageCommon);
    expect(expResult.error).equal(null);
  });

  it(`Places data`, () => {
    const unexpectedErrors = [];

    for (const places of getMapData.places) {
      const expResult = joi.validate(places, mapPlacesTemplate);
      if (!!expResult.error) {
        unexpectedErrors.push({
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });

  it(`Countries data`, () => {
    const unexpectedErrors = [];

    for (const countries of getMapData.countries) {
      const expResult = joi.validate(getMapData.countries, mapCountriesTemplate);

      if (!!expResult.error) {
        unexpectedErrors.push({
          message: expResult.error.message
        });
      }
    }
    expect(unexpectedErrors).to.be.deep.equal([]);
  });
});
