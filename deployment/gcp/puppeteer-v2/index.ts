import { ScreenshotService } from '../../../server/src/app/services/screenshot.service';
import { AwsS3Service } from '../../../server/src/app/services/aws-s3.service';
import { credentialsService } from '../../../common/credential.service';

const pathToCredentials = '../../..';
const actualCredentials = credentialsService.loadCredentials(pathToCredentials);

// console.log(JSON.stringify(actualCredentials, null, '\t'));
const awsS3Service = new AwsS3Service(actualCredentials);
const screenshotService = new ScreenshotService(actualCredentials, awsS3Service);

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.createImage = createImage;

export async function createImage(req, res) {
  const params = { ...req.query, ...req.body };

  try {
    // console.log(JSON.stringify(params, null, '\t'));
    const { metadata, embedId, embedUrl, placesCount, requestUuid } = params;
    const context = {
      params: { tool: 'local' },
      requestUuid,
      metadata,
      embedId,
      embedUrl: decodeURIComponent(embedUrl),
      placesCount
    };
    // console.log(JSON.stringify(context, null, '\t'));
    await screenshotService.makePuppeteerLocalScreenshot(context);

    return res.json({ success: true, data: context });
  } catch (error) {
    console.error(req.method, params, error);

    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
      method: req.method,
      params
    });
  }
}
