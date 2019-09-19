// Todo: Need refactor according to "noImplicitAny" rule

import { get } from 'lodash';
import * as mongoose from 'mongoose';

export async function getImageFileName(imageId) {
  const modelMedia = mongoose.model('Media');

  const images = await modelMedia
    .find(
      {
        _id: imageId
      },
      {
        src: 1,
        amazonfilename: 1
      }
    )
    .limit(1)
    .lean()
    .exec();

  if (!images[0]) {
    throw new Error('Doesn`t have image with this ID');
  }

  const image = images[0];

  return `${get(image, 'src', '')}original-${get(image, 'amazonfilename', '')}`;
}
