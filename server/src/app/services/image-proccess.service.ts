// Todo: Need refactor according to "noImplicitAny" rule

import { getImageFileName } from './media.repository';
import { getLocalPath, putImageLocaly } from './local-storage.service';
import { downloadFromS3, AwsS3Service } from './aws-s3.service';
import { removeMetadata } from './remove-metadata.service';

export class ImageProcessService {
  private readonly awsS3Service: AwsS3Service;

  constructor(awsS3Service) {
    this.awsS3Service = awsS3Service;
    // TODO: move to all credentials
  }

  async prepareImageForDownload(imageID) {
    try {
      const imageId = imageID.replace(/[^a-zA-Z0-9 ]/g, '');
      const folderpath = '';
      const filename = await getImageFileName(imageId);
      const imageBinary = await this.awsS3Service.downloadFromS3({ folderpath, filename });
      const imagePath = getLocalPath(filename);
      await putImageLocaly(imagePath, Buffer.from(imageBinary, 'binary'));
      await removeMetadata(imagePath);

      return imagePath;
    } catch (err) {
      console.error(err);

      return null;
    }
  }
}

export async function prepareImageForDownload(imageID, awsConfig) {
  try {
    const imageId = imageID.replace(/[^a-zA-Z0-9 ]/g, '');
    const imageFileName = await getImageFileName(imageId);
    const imageBinary = await downloadFromS3(imageFileName, awsConfig);
    const imagePath = getLocalPath(imageFileName);
    await putImageLocaly(imagePath, Buffer.from(imageBinary, 'binary'));
    await removeMetadata(imagePath);

    return imagePath;
  } catch (err) {
    console.error(err);

    return null;
  }
}
