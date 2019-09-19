import { find, map, uniq } from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { Users } from '../../interfaces/users';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { usersRepositoryService } from '../../repositories/users.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';

let placeTypeId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;

const ERROR_CODE = 351;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');

  const BASE_HREF = nconf.get('BASE_HREF');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));

  app.get(
    `${BASE_HREF}/v1/photographer-profile`,
    compression(),
    setPhotographerPlaces.bind(setPhotographerPlaces, S3_SERVER)
  );
};

async function setPhotographerPlaces(S3_SERVER: string, req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { lang: langUse, id: userId }
    } = req;
    const currentUser: Users = await usersRepositoryService.getPhotographerPlaces(userId, langUse);
    const places = await placesRepositoryService.getPlacesIds(userId, placeTypeId);
    const placesByPortraitAndHouse = await mediaRepositoryService.getPlacesByFamilyPortraitAndHouse(
      places,
      familyThingId,
      homeThingId
    );

    const images = await imagesCount(placesByPortraitAndHouse);
    const data = getCurrentUser(S3_SERVER, currentUser, images, langUse);

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      msg: [],
      data: null,
      err: `Error code for photographer profile: ${ERROR_CODE}`
    });
  }
}

function getCurrentUser(
  S3_SERVER: string,
  currentUser: Users,
  images: { imagesCount: number; placesCount: number },
  langUse: string
) {
  if (currentUser) {
    currentUser.imagesCount = images.imagesCount;
    currentUser.placesCount = images.placesCount;
    currentUser.avatar = currentUser.avatar ? S3_SERVER + currentUser.avatar : null;

    if (currentUser.country) {
      const translation = find(currentUser.country.translations, { lang: langUse });

      if (translation) {
        currentUser.country.country = translation.country;
        currentUser.country.alias = translation.alias;

        delete currentUser.country.translations;
      }
    }

    if (currentUser.translations) {
      const translationCurrentUser = find(currentUser.translations, { lang: langUse });

      if (translationCurrentUser) {
        currentUser.firstName = translationCurrentUser.firstName;
        currentUser.lastName = translationCurrentUser.lastName;
        currentUser.description = translationCurrentUser.description;
        currentUser.company = translationCurrentUser.company;

        delete currentUser.translations;
      }
    }
  }

  return currentUser;
}

async function imagesCount(places: { _id: string }[]): Promise<{ imagesCount: number; placesCount: number }> {
  const placesIds: string[] = map(places, '_id');
  const photographerMediaThings = await mediaRepositoryService.getThingsIdByPlaces(placesIds);
  const whiteListPhotographersThings = await thingRepositoryService.getWhiteListThings(photographerMediaThings);

  const media = await mediaRepositoryService.getMediaByPlaces(placesIds, whiteListPhotographersThings);
  const uniqMedia = media ? getUniqMedia(media) : 0;

  return { imagesCount: uniqMedia, placesCount: placesIds.length };
}

function getUniqMedia(media: { place: string; things: { _id: string }[] }[]) {
  const allHashMedia = {};
  let imageCount = 0;

  for (const mediaRecord of media) {
    const mediaValues = allHashMedia[mediaRecord.place] || [];

    mediaValues.push(
      ...mediaRecord.things.map((thing) => {
        if (thing._id) {
          return thing._id.toString();
        }
      })
    );
    allHashMedia[mediaRecord.place] = mediaValues;
  }

  for (const key of Object.keys(allHashMedia)) {
    imageCount += uniq(allHashMedia[key]).length;
  }

  return imageCount;
}
