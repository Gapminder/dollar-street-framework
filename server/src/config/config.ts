import { AwsS3Service } from '../app/services/aws-s3.service';
import { ScreenshotService } from '../app/services/screenshot.service';
import { EmbedService } from '../app/services/embed.service';
import { ImageProcessService } from '../app/services/image-proccess.service';
import { credentialsService } from '../../../common/credential.service';
import { dbConfig } from '../../../common/db.config';

export const config = (app) => {
  const pathToCredentials = '../..';
  const actualCredentials = credentialsService.loadCredentials(pathToCredentials);
  const awsS3Service = new AwsS3Service(actualCredentials);
  const screenshotService = new ScreenshotService(actualCredentials, awsS3Service);
  const embedService = new EmbedService(actualCredentials, screenshotService, awsS3Service);
  const imageProcessService = new ImageProcessService(awsS3Service);

  app.set('nconf', actualCredentials);
  app.set('awsS3Service', awsS3Service);
  app.set('screenshotService', screenshotService);
  app.set('embedService', embedService);
  app.set('imageProcessService', imageProcessService);

  dbConfig(actualCredentials);
};
