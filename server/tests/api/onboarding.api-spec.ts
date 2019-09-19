import { onboardingStepsFormatTemplate } from './format-templates';

import * as chai from 'chai';
import * as request from 'request-promise-native';
import * as joi from 'joi';
import { credentialsService } from '../../../common/credential.service';

const nconf = credentialsService.loadCredentials('../');
const API_URL = nconf.get('API_URL');
const BASE_HREF = nconf.get('BASE_HREF');
const expect = chai.expect;
const getLanguagesListUrl = `${API_URL}${BASE_HREF}/v1/onboarding`;

describe('Languages list request', async () => {
  let listOfSteps = [];

  before(async () => {
    const getOnboardingStepsList = await request({ method: 'GET', uri: getLanguagesListUrl, json: true });
    listOfSteps = getOnboardingStepsList.data;
  });

  it('should return languages list in correct format', () => {
    const unexpectedErrors = [];

    for (const step of listOfSteps) {
      const expResult = joi.validate(step, onboardingStepsFormatTemplate);

      if (expResult.error) {
        unexpectedErrors.push({
          ambassador: step.name,
          message: expResult.error.message
        });
      }
    }

    expect(unexpectedErrors).to.be.deep.equal([]);
  });
});
