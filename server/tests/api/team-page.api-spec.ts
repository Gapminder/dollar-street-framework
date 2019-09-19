import { coreTeamPreviewTemplate, contributorsPreviewTemplate } from './format-templates';

import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;
const getTeamUrl = `${API_URL}${BASE_HREF}/v1/team`;

describe('Team Page check', () => {
  const listOfCoreTeam = [];
  const listOfContributor = [];

  before(async () => {
    const getCoreTeamList = await request({ method: 'GET', uri: getTeamUrl, json: true });
    listOfCoreTeam.push(...getCoreTeamList.data[0].ambassadors);
    listOfContributor.push(...getCoreTeamList.data[1].ambassadors);
  });

  it(`Core Team data `, () => {
    const unexpectedErrors = [];

    for (const ambassador of listOfCoreTeam) {
      const expResult = joi.validate(ambassador, coreTeamPreviewTemplate);

      if (!!expResult.error) {
        unexpectedErrors.push({
          ambassador: ambassador.name,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });

  it(`Contributors data `, () => {
    const unexpectedErrors1 = [];

    for (const ambassador of listOfContributor) {
      const expResult = joi.validate(ambassador, contributorsPreviewTemplate);

      if (!!expResult.error) {
        unexpectedErrors1.push({
          ambassador: ambassador.name,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors1).to.be.deep.equal([]);
  });
});
