// Todo: Need refactor according to "noImplicitAny" rule

import * as gm from 'gm';

export async function removeMetadata(imagePath) {
  return new Promise((resolve, reject) => {
    gm(imagePath)
      .noProfile()
      .write(imagePath, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(imagePath);
      });
  });
}
