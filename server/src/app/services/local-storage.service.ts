import * as fs from 'fs';
import * as path from 'path';

const IMAGE_UPLOADED_PATH = `${process.cwd()}/uploads/`;

async function putImageLocaly(imagePath: string, imageBuffer: Buffer): Promise<object> {
  return new Promise(
    (resolve, reject): void => {
      fs.writeFile(imagePath, imageBuffer, (err) => {
        return err ? reject(err) : resolve(imagePath);
      });
    }
  );
}

async function removeImageLocaly(imagePath: string): Promise<object> {
  return new Promise(
    (resolve, reject): void => {
      fs.unlink(imagePath, (err) => {
        return err ? reject(err) : resolve(imagePath);
      });
    }
  );
}

function getLocalPath(imageFileName: string) {
  return `${IMAGE_UPLOADED_PATH}${path.basename(imageFileName)}`;
}

export { getLocalPath, putImageLocaly, removeImageLocaly };
