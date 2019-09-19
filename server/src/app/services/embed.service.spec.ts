// Todo: Need refactor according to "noImplicitAny" rule

// tslint:disable:no-implicit-dependencies
import 'mocha';
import * as sinon from 'sinon';
import * as chai from 'chai';
// tslint:enable:no-implicit-dependencies

import '../../models';
import { embedRepositoryService } from '../../repositories/embed.repository.service';
import { AwsS3Service } from './aws-s3.service';
import { EmbedService } from './embed.service';
import { ScreenshotService } from './screenshot.service';
import { DataProvider } from '../../../tests/data/data-provider';
import { EmbedParams, EmbedUrls } from '../../interfaces/puppeteer.interfaces';
import { EMBED_ERRORS } from '../../../constants/embed-preview-constants';
import { credentialsService } from '../../../../common/credential.service';

// TODO: assert console log, error, etc in all needed tests
// sinon.assert.calledWith(consoleStub.error, sinon.match.has('message', EMBED_ERRORS.THING_NOT_FOUND));

const sandbox = sinon.createSandbox();
const expect = chai.expect;

// tslint:disable-next-line:no-var-requires
const pathToCredentials = '../..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

describe('Embed should ', () => {
  let embedRepositoryServiceStub;
  let awsS3ServiceStub;
  let screenshotServiceStub;
  let embedService;

  beforeEach(() => {
    embedRepositoryServiceStub = sandbox.stub(embedRepositoryService);
    awsS3ServiceStub = sandbox.createStubInstance(AwsS3Service);
    screenshotServiceStub = sandbox.stub(new ScreenshotService(actualCredentials, awsS3ServiceStub));
    embedService = new EmbedService(actualCredentials, screenshotServiceStub, awsS3ServiceStub);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('generate new embed using makePuppeteerClusterScreenshot by default ', async () => {
    // tslint:disable:no-object-literal-type-assertion

    const populatedEmbed = DataProvider.populatedEmbed;
    const existedEmbed = DataProvider.existedEmbed;
    const embedParams: EmbedParams = DataProvider.embedParams;

    // tslint:enable:no-object-literal-type-assertion
    const populatedEmbedStub = sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
    embedRepositoryServiceStub._findEmbed.resolves(existedEmbed);
    embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
    screenshotServiceStub.makePuppeteerClusterScreenshot.resolves([Buffer.alloc(256), Buffer.alloc(256)]);
    screenshotServiceStub.makeScreenshot.restore();
    embedRepositoryServiceStub.upsertEmbed.restore();

    const data: EmbedUrls = await embedService.newComparison(embedParams);

    populatedEmbedStub.restore();

    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerCloudScreenshot);
    sinon.assert.called(screenshotServiceStub.makePuppeteerClusterScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makeSplashClusterScreenshot);
    sinon.assert.called(embedRepositoryServiceStub._findEmbed);
    sinon.assert.notCalled(embedRepositoryServiceStub._createEmbed);
    sinon.assert.called(embedRepositoryServiceStub._populateEmbed);
    // tslint:disable-next-line:no-unused-expression
    expect(data).to.not.be.empty;
  });

  it('generate new embed using makeSplashClusterScreenshot splash', async () => {
    // TODO validate for each model
    // tslint:disable:no-object-literal-type-assertion

    const populatedEmbed = DataProvider.populatedEmbed;
    const existedEmbed = DataProvider.existedEmbed;
    const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, tool: 'splash' });

    sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
    embedRepositoryServiceStub._findEmbed.resolves(null);
    embedRepositoryServiceStub._createEmbed.resolves(existedEmbed);
    embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
    embedRepositoryServiceStub.upsertEmbed.restore();
    screenshotServiceStub.makeSplashClusterScreenshot.resolves([Buffer.alloc(256), Buffer.alloc(256)]);
    screenshotServiceStub.makeScreenshot.restore();

    const data: EmbedUrls = await embedService.newComparison(embedParams);

    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerCloudScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerClusterScreenshot);
    sinon.assert.called(screenshotServiceStub.makeSplashClusterScreenshot);
    sinon.assert.called(embedRepositoryServiceStub._findEmbed);
    sinon.assert.called(embedRepositoryServiceStub._createEmbed);
    sinon.assert.called(embedRepositoryServiceStub._populateEmbed);

    // tslint:disable-next-line:no-unused-expression
    expect(data).to.not.be.empty;
  });

  it('generate new embed using makePuppeteerClusterScreenshot puppeteer', async () => {
    // TODO validate for each model
    // tslint:disable:no-object-literal-type-assertion

    const populatedEmbed = DataProvider.populatedEmbed;
    const existedEmbed = DataProvider.existedEmbed;
    const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, tool: 'puppeteer' });

    // tslint:enable:no-object-literal-type-assertion
    sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
    embedRepositoryServiceStub._findEmbed.resolves(null);
    embedRepositoryServiceStub._createEmbed.resolves(existedEmbed);
    embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
    embedRepositoryServiceStub.upsertEmbed.restore();
    screenshotServiceStub.makePuppeteerClusterScreenshot.resolves([Buffer.alloc(256), Buffer.alloc(256)]);
    screenshotServiceStub.makeScreenshot.restore();

    const data: EmbedUrls = await embedService.newComparison(embedParams);

    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerCloudScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makeSplashClusterScreenshot);
    sinon.assert.called(screenshotServiceStub.makePuppeteerClusterScreenshot);
    sinon.assert.called(embedRepositoryServiceStub._findEmbed);
    sinon.assert.called(embedRepositoryServiceStub._createEmbed);
    sinon.assert.called(embedRepositoryServiceStub._populateEmbed);

    // tslint:disable-next-line:no-unused-expression
    expect(data).to.not.be.empty;
  });

  it('generate new embed using makePuppeteerCloudScreenshot cloud', async () => {
    // tslint:disable:no-object-literal-type-assertion

    const populatedEmbed = DataProvider.populatedEmbed;
    const existedEmbed = DataProvider.existedEmbed;
    const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, tool: 'cloud' });

    // tslint:enable:no-object-literal-type-assertion
    sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
    embedRepositoryServiceStub._findEmbed.resolves(null);
    embedRepositoryServiceStub._createEmbed.resolves(existedEmbed);
    embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
    embedRepositoryServiceStub.upsertEmbed.restore();
    screenshotServiceStub.makePuppeteerCloudScreenshot.resolves([Buffer.alloc(256), Buffer.alloc(256)]);
    screenshotServiceStub.makeScreenshot.restore();

    const data: EmbedUrls = await embedService.newComparison(embedParams);

    sinon.assert.notCalled(screenshotServiceStub.makeSplashClusterScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerLocalScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerClusterScreenshot);
    sinon.assert.called(screenshotServiceStub.makePuppeteerCloudScreenshot);
    sinon.assert.called(embedRepositoryServiceStub._findEmbed);
    sinon.assert.called(embedRepositoryServiceStub._createEmbed);
    sinon.assert.called(embedRepositoryServiceStub._populateEmbed);

    // tslint:disable-next-line:no-unused-expression
    expect(data).to.not.be.empty;
  });

  it('generate new embed using makePuppeteerLocalScreenshot local', async () => {
    // tslint:disable:no-object-literal-type-assertion

    const populatedEmbed = DataProvider.populatedEmbed;
    const existedEmbed = DataProvider.existedEmbed;
    const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, tool: 'local' });

    // tslint:enable:no-object-literal-type-assertion
    sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
    embedRepositoryServiceStub._findEmbed.resolves(null);
    embedRepositoryServiceStub._createEmbed.resolves(existedEmbed);
    embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
    embedRepositoryServiceStub.upsertEmbed.restore();
    screenshotServiceStub.makePuppeteerLocalScreenshot.resolves([Buffer.alloc(256), Buffer.alloc(256)]);
    screenshotServiceStub.makeScreenshot.restore();

    const data: EmbedUrls = await embedService.newComparison(embedParams);

    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerCloudScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makePuppeteerClusterScreenshot);
    sinon.assert.notCalled(screenshotServiceStub.makeSplashClusterScreenshot);
    sinon.assert.called(screenshotServiceStub.makePuppeteerLocalScreenshot);
    sinon.assert.called(embedRepositoryServiceStub._findEmbed);
    sinon.assert.called(embedRepositoryServiceStub._createEmbed);
    sinon.assert.called(embedRepositoryServiceStub._populateEmbed);

    // tslint:disable-next-line:no-unused-expression
    expect(data).to.not.be.empty;
  });

  describe('or should throw', async () => {
    it(`"Thing was not found" error for empty thing id`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, thingId: '' });
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Error: Thing is invalid" error for invalid thing id`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign(
          {},
          {
            ...DataProvider.embedParams,
            thingId: DataProvider.invalidId
          }
        );
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Error: Embed is invalid" error for invalid thing id and non empty embed id`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign(
          {},
          {
            ...DataProvider.embedParams,
            embed: DataProvider.invalidId,
            thingId: DataProvider.invalidId
          }
        );
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Error: Referer were not found" error for empty referer`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, referer: '' });
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Error: Referer were not found" error when all params are empty `, async () => {
      try {
        await embedService.newComparison({});
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Medias were not found" error for empty mediaIds Arr`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign({}, { ...DataProvider.embedParams, mediasIds: [] });
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Medias are invalid" error for invalid mediaId in mediaIds Arr`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign(
          {},
          {
            ...DataProvider.embedParams,
            mediasIds: [DataProvider.validId, DataProvider.invalidId]
          }
        );
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Medias are invalid" error for empty mediaId in mediaIds Arr`, async () => {
      try {
        const embedParams: EmbedParams = Object.assign(
          {},
          {
            ...DataProvider.embedParams,
            mediasIds: [DataProvider.validId, '']
          }
        );
        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Thing is empty" error for no Thing in populated Embed`, async () => {
      try {
        const populatedEmbed = Object.assign(
          {},
          {
            ...DataProvider.populatedEmbed,
            thing: {}
          }
        );
        const existedEmbed = DataProvider.existedEmbed;
        const embedParams: EmbedParams = DataProvider.embedParams;

        sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
        embedRepositoryServiceStub._findEmbed.resolves(existedEmbed);
        embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
        embedRepositoryServiceStub.upsertEmbed.restore();

        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Thing is not valid" error if Thing is not public`, async () => {
      try {
        const populatedEmbed = Object.assign(
          {},
          {
            ...DataProvider.populatedEmbed,
            thing: Object.assign({}, { ...DataProvider.existedThing, isPublic: false })
          }
        );
        const existedEmbed = DataProvider.existedEmbed;
        const embedParams: EmbedParams = DataProvider.embedParams;

        sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
        embedRepositoryServiceStub._findEmbed.resolves(existedEmbed);
        embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
        embedRepositoryServiceStub.upsertEmbed.restore();

        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });

    it(`"Thing is not valid" error if Thing is in black list`, async () => {
      try {
        const populatedEmbed = Object.assign(
          {},
          {
            ...DataProvider.populatedEmbed,
            thing: Object.assign({}, { ...DataProvider.existedThing, list: 'black' })
          }
        );
        const existedEmbed = DataProvider.existedEmbed;
        const embedParams: EmbedParams = DataProvider.embedParams;

        sandbox.stub(populatedEmbed, 'toObject').returns(populatedEmbed);
        embedRepositoryServiceStub._findEmbed.resolves(existedEmbed);
        embedRepositoryServiceStub._populateEmbed.resolves(populatedEmbed);
        embedRepositoryServiceStub.upsertEmbed.restore();

        await embedService.newComparison(embedParams);
      } catch (error) {
        // tslint:enable:no-object-literal-type-assertion
        expect(error.toString()).to.equal(`Error: ${EMBED_ERRORS.NO_LONGER_AVAILABLE}`);
      }
    });
  });
});
