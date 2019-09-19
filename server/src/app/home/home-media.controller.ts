// Todo: Need refactor according to "noImplicitAny" rule

import { head, reduce, map, uniqBy, includes } from 'lodash';
import { Application, Request, Response } from 'express';
import * as mongoose from 'mongoose';

import { HomeMediaPhotographer, Users } from '../../interfaces/users';
import { HomeMediaThing, ThingsForHomeMedia, ThingValue } from '../../interfaces/things';
import { HomeMediaImage, Images } from '../../interfaces/images';

import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { usersRepositoryService } from '../../repositories/users.repository.service';
import { consumerThumbnailsRepositoryService } from '../../repositories/consumerThumbnails.repository.service';
import { ObjectID } from 'mongodb';

let familyIconThingId: mongoose.Types.ObjectId;

const ERROR_CODE = 317;

module.exports = (app: Application) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');

  familyIconThingId = new mongoose.Types.ObjectId(nconf.get('familyIconThingId'));
  const BASE_HREF = nconf.get('BASE_HREF');

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  app.get(`${BASE_HREF}/v1/home-media`, compression(), getThingImages.bind(getThingImages, S3_SERVER));
};

async function getThingImages(S3_SERVER: string, req: Request, res: Response): Promise<Response> {
  const {
    query: { lang: langUse, resolution, placeId }
  } = req;

  try {
    const _placeId = new mongoose.Types.ObjectId(placeId);

    const [things, showOneImageOfPlace, authorId] = await Promise.all([
      setThings(langUse),
      consumerThumbnailsRepositoryService.getConsumerThumbnailsStatus(),
      placesRepositoryService.getAuthorIdByPlaceId(_placeId)
    ]);
    const showOneImageOfPlaceStatus: boolean = showOneImageOfPlace.all;
    const thingsIds: mongoose.Types.ObjectId[] = map(things, '_id');

    const images: Images[] = await mediaRepositoryService.getPlaceImages(_placeId, thingsIds, resolution, S3_SERVER);
    const photographer: HomeMediaPhotographer = await setPhotographer(authorId.author, langUse);
    const hashThings = setHashThings(S3_SERVER, things);
    let _images = setImages(images, hashThings);

    if (showOneImageOfPlaceStatus) {
      _images = uniqBy(_images, 'thing');
    }

    const currentImages: HomeMediaImage[] = setCurrentImages(_images);

    const data: { images: HomeMediaImage[]; photographer: HomeMediaPhotographer } = {
      images: currentImages,
      photographer: photographer ? photographer : null
    };

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for home media: ${ERROR_CODE}` });
  }
}

function setHashThings(S3_SERVER: string, things: HomeMediaThing[]): object {
  return reduce(
    things,
    (result, thing: ThingsForHomeMedia) => {
      const thingValue: ThingValue = {
        thingName: thing.thingName,
        plural: thing.plural
      };

      thingValue.thingCategory = 'Without category';

      if (thing.thingCategory[0]) {
        thingValue.thingCategory = thing.thingCategory[0].name;
      }

      if (thing.icon) {
        thingValue.thingIcon = `${S3_SERVER}thing/${thing._id}/FFFFFF-${thing._id}.svg`;
      }

      result[thing._id.toString()] = thingValue;

      return result;
    },
    {}
  );
}

async function setPhotographer(photographerId: ObjectID, langUse: string): Promise<HomeMediaPhotographer> {
  const photographer: Users = await usersRepositoryService.getPhotographer(photographerId, langUse);

  if (!photographer) {
    throw new Error(`Error: Photographer ${photographerId} does not found!`);
  }

  const translation = head(photographer.translations);

  if (translation) {
    photographer.lastName = translation.lastName;
    photographer.firstName = translation.firstName;

    delete photographer.translations;
  }

  return photographer;
}

async function setThings(langUse: string): Promise<HomeMediaThing[]> {
  const things: ThingsForHomeMedia[] = await thingRepositoryService.getThingsForHomeMedia(langUse, familyIconThingId);

  if (!things) {
    throw new Error('Error: Things were not found!');
  }

  return map(things, (thing: ThingsForHomeMedia) => {
    const translation = head(thing.translations);

    return {
      _id: thing._id,
      icon: thing.icon,
      plural: translation ? translation.plural : thing.plural,
      thingCategory: thing.thingCategory,
      thingName: translation ? translation.thingName : thing.thingName
    };
  });
}

function setImages(images: Images[], hashThings): HomeMediaImage[] {
  return map(images, (image) => {
    const imageThing = image.thing.toString();
    const thing = hashThings[imageThing];

    return {
      _id: image._id,
      background: image.background,
      plural: thing.plural,
      thing: image.thing.toString(),
      thingCategory: thing.thingCategory,
      thingIcon: thing.thingIcon,
      thingName: thing.thingName
    };
  });
}

function setCurrentImages(images: HomeMediaImage[]): HomeMediaImage[] {
  return reduce(
    images,
    (result, img) => {
      if (includes(map(result, 'thingCategory'), img.thingCategory)) {
        delete img.thingCategory;
      }

      result.push(img);

      return result;
    },
    []
  );
}
