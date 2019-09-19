// Todo: Need refactor according to "noImplicitAny" rule

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { Regions } from '../../interfaces/regions';
import { PlaceEntity } from '../../interfaces/places';
import { CountryAliasLocations } from '../../interfaces/locations';
import { InfoPlaces } from '../../interfaces/infoPlaces';
import { usersRepositoryService } from '../../repositories/users.repository.service';
import { infoPlacesRepositoryService } from '../../repositories/infoPlaces.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { regionsRepositoryService } from '../../repositories/region.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';

import { getImagesByCountryPlaces } from '../services/get-images-by-places.service';

let placeTypeId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;
let questionnaireV3: mongoose.Types.ObjectId;
let questionnaireV1: mongoose.Types.ObjectId;
let questionnaireV2: mongoose.Types.ObjectId;
let familyNameId: mongoose.Types.ObjectId;

const ERROR_CODE = 350;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');
  const BASE_HREF = nconf.get('BASE_HREF');

  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  questionnaireV3 = new mongoose.Types.ObjectId(nconf.get('questionnaireV3'));
  questionnaireV1 = new mongoose.Types.ObjectId(nconf.get('questionnaireV1'));
  questionnaireV2 = new mongoose.Types.ObjectId(nconf.get('questionnaireV2'));
  familyNameId = new mongoose.Types.ObjectId(nconf.get('familyNameId'));

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  app.get(
    `${BASE_HREF}/v1/photographer-places`,
    compression(),
    getPhotographerPlaces.bind(getPhotographerPlaces, S3_SERVER)
  );
};

async function getPhotographerPlaces(S3_SERVER: string, req: Request, res: Response): Promise<Response | object> {
  try {
    const {
      query: { lang: langUse, id: userId }
    } = req;
    const user = await usersRepositoryService.getUsers(userId);

    if (!user) {
      throw new Error(`Error: User ${userId} were not found`);
    }

    const places = await setPlaces(S3_SERVER, userId, langUse);

    return res.json({ success: true, msg: [], data: { places }, error: null });
  } catch (err) {
    return res.json({
      success: !err,
      msg: [],
      data: null,
      error: `Error code for photographer places: ${ERROR_CODE}`
    });
  }
}

async function setPlaces(S3_SERVER: string, userId: string, langUse: string): Promise<PlaceEntity[]> {
  const [regions, locations, places] = await Promise.all([
    regionsRepositoryService.getRegions(),
    setLocations(langUse),
    getCountriesByPhotographer(S3_SERVER, userId, langUse)
  ]);

  if (!regions) {
    throw new Error('Error: Regions were not found!');
  }

  const hashRegions = setHashRegions(regions);
  const hashCountries = setHashCountries(locations);

  _.forEach(places, (place: PlaceEntity) => {
    const countryId: string = typeof place.country === 'string' ? place.country : place.country._id.toString();
    const location = hashCountries[countryId];

    place.region = hashRegions[location.region.toString()];
    place.country = location.alias;
    place.placeId = place._id;
  });

  return _.chain(places)
    .filter('imageId')
    .sortBy('country')
    .value();
}

function setHashRegions(regions: Regions[]) {
  return _.reduce(
    regions,
    (result, region: Regions) => {
      result[region._id.toString()] = region.name;

      return result;
    },
    {}
  );
}

function setHashCountries(locations: CountryAliasLocations[]) {
  return _.reduce(
    locations,
    (result: { alias: string; region: string }, location: CountryAliasLocations) => {
      result[location._id.toString()] = {
        alias: location.alias || location.country,
        region: location.region
      };

      return result;
    },
    {}
  );
}

async function setLocations(langUse: string): Promise<CountryAliasLocations[]> {
  const locations = await locationRepositoryService.getPhotographerLocations(langUse);

  if (!locations) {
    throw new Error('Error: Locations were not found!');
  }

  _.forEach(locations, (item: CountryAliasLocations) => {
    const translation = _.head(item.translations);

    item.country = translation ? translation.country : item.country;
    item.alias = translation ? translation.alias : item.alias;

    delete item.translations;
  });

  return locations;
}

async function getCountriesByPhotographer(S3_SERVER: string, userId: string, langUse: string): Promise<PlaceEntity[]> {
  const places = await setPlacesByPhotographer(userId, langUse);

  if (!places) {
    throw new Error('Error: Places were not found!');
  }

  const placesId = _.map(places, '_id');
  const images = await getImagesByCountryPlaces(placesId, familyThingId, homeThingId, S3_SERVER);

  if (!images) {
    throw new Error('Error: Images by photographer places does not found!');
  }

  _.forEach(places, (place: PlaceEntity) => {
    const image = images[place._id.toString()];

    if (image) {
      place.imageId = image._id;
      place.thing = image.thing;
      place.image = image.url;
    }
  });

  return places;
}

async function setPlacesByPhotographer(userId: string, langUse: string): Promise<PlaceEntity[]> {
  const places = await placesRepositoryService.getPlacesByPhotographer(userId, placeTypeId);

  if (!places) {
    throw new Error(`Error: Places by user id: ${userId} were not found`);
  }

  const placesIds: mongoose.Types.ObjectId[] = _.map(places, '_id');
  const [familiesNames, secondFamiliesNames] = await Promise.all([
    setInfoPlaceByPlacesIds(placesIds, langUse),
    infoPlacesRepositoryService.getInfoPlaceByPlacesIds(
      placesIds,
      familyNameId,
      langUse,
      questionnaireV3,
      questionnaireV2,
      questionnaireV1
    )
  ]);

  if (!secondFamiliesNames) {
    throw new Error(`Error: Places were not found`);
  }

  const { hashFamiliesNamesByPlacesIds, hashSecondFamiliesNamesByPlacesIds } = getHashFamiliesNamesByPlacesIds(
    familiesNames,
    secondFamiliesNames
  );

  _.forEach(places, (place: PlaceEntity) => {
    const familyName: string = hashFamiliesNamesByPlacesIds[place._id.toString()];
    const secondFamilyName: string = hashSecondFamiliesNamesByPlacesIds[place._id.toString()];

    place.family = familyName || secondFamilyName || '';
  });

  return places;
}

async function setInfoPlaceByPlacesIds(placesIds: mongoose.Types.ObjectId[], langUse: string): Promise<InfoPlaces[]> {
  const info = await infoPlacesRepositoryService.getInfoPlaceByPlacesIds(
    placesIds,
    familyNameId,
    langUse,
    questionnaireV3,
    questionnaireV2,
    questionnaireV1
  );

  if (!info) {
    throw new Error('Error: Info does not found!');
  }

  _.forEach(info, (item: InfoPlaces) => {
    const translation = _.head(item.translations);

    item.answer = translation ? translation.answer : item.answer;

    delete item.translations;
  });

  return info;
}

function getHashFamiliesNamesByPlacesIds(familiesNames, secondFamiliesNames) {
  const hashSecondFamiliesNamesByPlacesIds = setHashFamiliesNamesByPlacesIds(secondFamiliesNames);
  const hashFamiliesNamesByPlacesIds = setHashFamiliesNamesByPlacesIds(familiesNames);

  return { hashFamiliesNamesByPlacesIds, hashSecondFamiliesNamesByPlacesIds };
}

function setHashFamiliesNamesByPlacesIds(name) {
  // tslint:disable
  return _.chain(name)
    .groupBy('place')
    .mapValues(
      (value: InfoPlaces[]): string => {
        let familyName = _.find(value, { form: questionnaireV3 });
        // tslint:enable

        if (value && value.length && !familyName) {
          familyName = _.find(value, { form: questionnaireV2 });

          if (!familyName) {
            familyName = _.find(value, { form: questionnaireV1 });
          }
        }

        return familyName.answer;
      }
    )
    .value();
}
