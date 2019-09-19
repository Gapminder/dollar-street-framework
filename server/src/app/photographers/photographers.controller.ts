// Todo: Need refactor according to "noImplicitAny" rule

import { map, filter, reduce, chain, forEach, head, values, isEmpty, uniq } from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { PlaceEntity, PlacesByPhotografers } from '../../interfaces/places';
import { CountryAliasLocations } from '../../interfaces/locations';
import { HashPhotographer, Users, UsersForPhotographers } from '../../interfaces/users';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { usersRepositoryService } from '../../repositories/users.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { CountriesPlacesImageCount } from '../../interfaces/hash.interfaces';
import { thingRepositoryService } from '../../repositories/thing.repository.service';

let placeTypeId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;

const ERROR_CODE = 360;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  const BASE_HREF = nconf.get('BASE_HREF');
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));

  app.get(`${BASE_HREF}/v1/photographers`, compression(), getPhotographers.bind(getPhotographers, S3_SERVER));
};

async function getPhotographers(S3_SERVER: string, req: Request, res: Response): Promise<Response | void> {
  try {
    const {
      query: { lang: langUse }
    } = req;
    const data = await setPhotographers(S3_SERVER, langUse);

    res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: false, msg: [], data: null, error: `Error code for photographers: ${ERROR_CODE}` });
  }
}

async function setPhotographers(S3_SERVER: string, langUse: string) {
  const places: { author: string; country: string }[] = await setPlaces();

  if (isEmpty(places)) {
    throw new Error(`Error: Places were not found!`);
  }

  const placesIds: string[] = map(places, '_id');

  const [locations, users] = await Promise.all([setLocations(langUse), setUsersByPlaces(S3_SERVER, langUse)]);

  const hashLocations = setHashLocations(locations);
  const hashUsers = setHashUsers(users);
  const hashImages = await setImagesCount(placesIds);
  const hashPlaces = setHashPlaces(places, hashLocations, hashUsers, hashImages);

  let photographersList = setPhotographersList(hashPlaces);
  photographersList = sortPhotographerImages(photographersList);

  let countryList = setCountryList(hashPlaces);
  countryList = sortCountryList(countryList, hashLocations);

  return { countryList, photographersList };
}

async function setImagesCount(photographerPlacesIds: string[]): Promise<CountriesPlacesImageCount | {}> {
  const things: string[] = await mediaRepositoryService.getThingsIdByPlaces(photographerPlacesIds);
  const thingsIds: string[] = await thingRepositoryService.getWhiteListThings(things);
  const media: { place: string; things: { _id: string }[] }[] = await mediaRepositoryService.getMediaByPlaces(
    photographerPlacesIds,
    thingsIds
  );

  if (!media) {
    return {};
  }

  return getUniqMedia(media);
}

function getUniqMedia(media: { place: string; things: { _id: string }[] }[]): CountriesPlacesImageCount | {} {
  const allHashMedia = {};
  const uniqHashMedia = {};

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
    uniqHashMedia[key] = uniq(allHashMedia[key]).length;
  }

  return uniqHashMedia;
}

function sortPhotographerImages(photographersList) {
  return chain(photographersList)
    .reduce((photographers, photographer) => {
      if (isEmpty(photographer.images)) {
        photographers.push(photographer);
      }

      return photographers;
    }, [])
    .sortBy('name')
    .value();
}

function sortCountryList(countryList, hashLocations) {
  return chain(countryList)
    .mapValues(
      (_users: HashPhotographer, key: string): { name: string; photographers: (number | string)[] } => {
        return { name: hashLocations[key] || key, photographers: values(_users) };
      }
    )
    .values()
    .sortBy('name')
    .value();
}

function setHashLocations(locations: CountryAliasLocations[]): { [key: string]: string } {
  return reduce(
    locations,
    (result, location: CountryAliasLocations) => {
      result[location._id.toString()] = location.alias || location.country;

      return result;
    },
    {}
  );
}

function setHashUsers(users: UsersForPhotographers[]) {
  return reduce(
    users,
    (result, user: UsersForPhotographers) => {
      result[user._id] = {
        photographer: user.photographer,
        avatar: user.avatar
      };

      return result;
    },
    {}
  );
}

function setHashPlaces(places: Partial<PlaceEntity>[], hashLocations, hashUsers, hashImages) {
  return reduce(
    places,
    (result, place: Partial<PlaceEntity>) => {
      result[place._id] = {
        country: hashLocations[place.country.toString()] || place.country,
        photographer: hashUsers[place.author].photographer,
        avatar: hashUsers[place.author].avatar,
        imagesCount: hashImages[place._id],
        userId: place.author
      };

      return result;
    },
    {}
  );
}

function setPhotographersList(hashPlaces) {
  return reduce(
    hashPlaces,
    (result, place: PlaceEntity) => {
      if (!result[place.photographer]) {
        result[place.photographer] = {
          name: place.photographer,
          userId: place.userId,
          avatar: place.avatar,
          images: 0,
          places: 1
        };

        if (place.imagesCount) {
          result[place.photographer].images = place.imagesCount;
        }

        return result;
      }

      if (place.imagesCount) {
        result[place.photographer].images += place.imagesCount;
        result[place.photographer].places++;
      }

      return result;
    },
    {}
  );
}

function setCountryList(hashPlaces) {
  return reduce(
    hashPlaces,
    (result, place: HashPhotographer) => {
      if (!place.imagesCount) {
        return result;
      }

      if (!result[place.country]) {
        result[place.country] = {};
      }

      if (!result[place.country][place.photographer]) {
        result[place.country][place.photographer] = {
          name: place.photographer,
          userId: place.userId,
          avatar: place.avatar,
          images: place.imagesCount,
          places: 1
        };

        return result;
      }

      result[place.country][place.photographer].images += place.imagesCount;
      result[place.country][place.photographer].places++;

      return result;
    },
    {}
  );
}

async function setLocations(langUse: string) {
  const locations: CountryAliasLocations[] = await locationRepositoryService.getPhotographersLocations(langUse);

  if (isEmpty(locations)) {
    throw new Error(`Error: Locations were not found!`);
  }

  forEach(
    locations,
    (item: CountryAliasLocations): void => {
      const translation = head(item.translations);

      item.country = translation ? translation.country : item.country;
      item.alias = translation ? translation.alias : item.alias;

      delete item.translations;
    }
  );

  return locations;
}

async function setPlacesByPortraitAndHouse(places: { _id: string }[]): Promise<string[]> {
  const data: { _id: string }[] = await mediaRepositoryService.getPlacesByFamilyPortraitAndHouse(
    places,
    familyThingId,
    homeThingId
  );

  if (isEmpty(data)) {
    throw new Error(`Error: Places Ids by Family were not found!`);
  }

  return map(data, '_id');
}

async function setUsersByPlaces(S3_SERVER: string, langUse: string) {
  const users: UsersForPhotographers[] = await usersRepositoryService.getUsersForPhotographers(langUse);

  if (isEmpty(users)) {
    throw new Error('Error: Users were not found!');
  }

  forEach(
    users,
    (item: Users): void => {
      item.avatar = !isEmpty(item.avatar) ? `url("${S3_SERVER}${item.avatar}")` : null;

      item.firstName = item.firstName || '';
      item.lastName = item.lastName || '';

      const translation = head(item.translations);

      item.description = translation && translation.description ? translation.description : item.description;

      const firstName: string = translation && translation.firstName ? translation.firstName : item.firstName;
      const lastName: string = translation && translation.lastName ? translation.lastName : item.lastName;

      item.photographer = `${firstName} ${lastName}`;

      delete item.translations;
    }
  );

  return users;
}

async function setPlaces() {
  const places: PlacesByPhotografers[] = await placesRepositoryService.getPhotographersPlaces(placeTypeId);

  if (isEmpty(places)) {
    throw new Error(`Error: Places by placeTypeId: ${placeTypeId} were not found`);
  }

  const placesByPhotografersId: { _id: string }[] = map(places, (place) => ({ _id: place._id.toString() }));
  const placesIds: string[] = await setPlacesByPortraitAndHouse(placesByPhotografersId);

  return filter(
    places,
    (place: PlacesByPhotografers): boolean => {
      if (placesIds.toString().indexOf(place._id.toString()) === -1) {
        return false;
      }

      return true;
    }
  );
}
