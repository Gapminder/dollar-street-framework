import { langFormatTemplate } from './format-templates';

import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;
const getLanguagesListUrl = `${API_URL}${BASE_HREF}/v1/languagesList`;

describe('Languages list request', async () => {
  let listOfLangs = [];

  before(async () => {
    const getFullLangList = await request({ method: 'GET', uri: getLanguagesListUrl, json: true });
    listOfLangs = getFullLangList.data;
  });

  it('should return languages list in correct format', () => {
    const unexpectedErrors = [];

    for (const lang of listOfLangs) {
      const expResult = joi.validate(lang, langFormatTemplate);

      if (expResult.error) {
        unexpectedErrors.push({
          ambassador: lang.name,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });
});
