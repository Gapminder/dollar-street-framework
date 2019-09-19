// Todo: Need refactor according to "noImplicitAny" rule

// tslint:disable:no-implicit-dependencies
import 'mocha';
import * as sinon from 'sinon';
import * as awsS3Service from './aws-s3.service';
import * as mediaRepository from './media.repository';
import * as localStorageService from './local-storage.service';
import * as imageProcessService from './image-proccess.service';
import * as removeMetadataService from './remove-metadata.service';
// tslint:enable:no-implicit-dependencies

const sandbox = sinon.createSandbox();
const assert = sinon.assert;
const match = sinon.match;

const imageId = '54b6414938ef07015525f2c6';
const imagePath = './tests/fixtures';
const expectedImageUrl = 'url';
const imageBinary = Buffer.from('test', 'binary');

describe('Image proccess service', () => {
  let stubMediaRepository;
  let stubAwsS3Service;
  let stubLocalStorageService;
  let stubRemoveMetadataService;

  beforeEach(() => {
    stubMediaRepository = sandbox.stub(mediaRepository);
    stubAwsS3Service = sandbox.stub(awsS3Service);
    stubLocalStorageService = sandbox.stub(localStorageService);
    stubRemoveMetadataService = sandbox.stub(removeMetadataService);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('remove metadata was successfully', async () => {
    const testAwsConfig = {
      region: 'test',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucket: 'test'
    };
    const getImageFileNameStub = stubMediaRepository.getImageFileName.resolves(expectedImageUrl);
    const downloadFromS3Stub = stubAwsS3Service.downloadFromS3
      .withArgs(expectedImageUrl, testAwsConfig)
      .resolves(imageBinary);
    const getLocalPathStub = stubLocalStorageService.getLocalPath.withArgs(expectedImageUrl).returns(imagePath);
    const putImageLocalyStub = stubLocalStorageService.putImageLocaly.withArgs(imagePath, imageBinary).resolves();
    const removeMetadataStub = stubRemoveMetadataService.removeMetadata.withArgs(imagePath).resolves();

    await imageProcessService.prepareImageForDownload(imageId, testAwsConfig);

    assert.calledOnce(getImageFileNameStub);
    assert.calledOnce(downloadFromS3Stub);
    assert.calledOnce(getLocalPathStub);
    assert.calledOnce(putImageLocalyStub);
    assert.calledOnce(removeMetadataStub);
  });

  it('remove metadata was not completed successfully', async () => {
    const errorText = 'this test of the Error in putImageLocaly should be';
    const stubConosleLog = sandbox.stub(console, 'error');
    const testAwsConfig = {
      region: 'test',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucket: 'test'
    };

    const getImageFileNameStub = stubMediaRepository.getImageFileName.resolves(expectedImageUrl);
    const downloadFromS3Stub = stubAwsS3Service.downloadFromS3
      .withArgs(expectedImageUrl, testAwsConfig)
      .resolves(imageBinary);
    const getLocalPathStub = stubLocalStorageService.getLocalPath.withArgs(expectedImageUrl).returns(imagePath);
    const putImageLocalyStub = stubLocalStorageService.putImageLocaly
      .withArgs(imagePath, imageBinary)
      .rejects(errorText);
    const removeMetadataStub = stubRemoveMetadataService.removeMetadata.withArgs(imagePath).resolves();

    await imageProcessService.prepareImageForDownload(imageId, testAwsConfig);

    assert.calledOnce(getImageFileNameStub);
    assert.calledOnce(downloadFromS3Stub);
    assert.calledOnce(getLocalPathStub);
    assert.calledOnce(putImageLocalyStub);
    assert.notCalled(removeMetadataStub);
    assert.calledWithExactly(stubConosleLog, match({ name: errorText }).and(match.instanceOf(Error)));
  });
});
