// Todo: Need refactor according to "noImplicitAny" rule

import { reduce } from 'lodash';
import * as mongoose from 'mongoose';

import { Images } from '../../interfaces/images';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';

export async function getImagesByCountryPlaces(
  placesId,
  familyThingId: mongoose.Types.ObjectId,
  homeThingId: mongoose.Types.ObjectId,
  s3server
) {
  try {
    const [images, things] = await Promise.all([
      mediaRepositoryService.getImagesByPlaces(placesId, familyThingId, homeThingId),
      thingRepositoryService.getThingsForImages(familyThingId, homeThingId)
    ]);

    const hashThings = setHashThings(things);

    return setHashImages(images, hashThings, s3server);
  } catch (err) {
    console.error(err);

    throw new Error(err);
  }
}

function setHashThings(things: { _id: string; thingName: string }[]) {
  return reduce(
    things,
    (result, thing: { _id: string; thingName: string }) => {
      result[thing._id] = thing.thingName;

      return result;
    },
    {}
  );
}

function setHashImages(images: Images[], hashThings, s3server) {
  return reduce(
    images,
    (result, image: Images) => {
      result[image.place] = {
        _id: image._id,
        url: `${s3server}${image.src}thumb-${image.amazonfilename}`,
        thing: hashThings[image.thing]
      };

      return result;
    },
    {}
  );
}
