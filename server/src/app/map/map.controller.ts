// Todo: Need refactor according to "noImplicitAny" rule

import { reduce, chain, forEach, head, map, find } from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { Things } from '../../interfaces/things';
import { Locations, CommonLocations } from '../../interfaces/locations';
import { Regions } from '../../interfaces/regions';
import { PlaceEntity } from '../../interfaces/places';
import { InfoPlaces } from '../../interfaces/infoPlaces';
import { ImagesForMap } from '../../interfaces/images';

import { locationRepositoryService } from '../../repositories/location.repository.service';
import { regionsRepositoryService } from '../../repositories/region.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { infoPlacesRepositoryService } from '../../repositories/infoPlaces.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';

let familyId: mongoose.Types.ObjectId;
let placeTypeId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;
let questionnaireV3: mongoose.Types.ObjectId;
let questionnaireV2: mongoose.Types.ObjectId;
let questionnaireV1: mongoose.Types.ObjectId;
let familyNameId: mongoose.Types.ObjectId;
let interviewedPerson: mongoose.Types.ObjectId;

const ERROR_CODE = 330;

module.exports = (app: Application) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  const BASE_HREF = nconf.get('BASE_HREF');
  familyId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  questionnaireV3 = new mongoose.Types.ObjectId(nconf.get('questionnaireV3'));
  questionnaireV2 = new mongoose.Types.ObjectId(nconf.get('questionnaireV2'));
  questionnaireV1 = new mongoose.Types.ObjectId(nconf.get('questionnaireV1'));
  familyNameId = new mongoose.Types.ObjectId(nconf.get('familyNameId'));
  interviewedPerson = new mongoose.Types.ObjectId(nconf.get('interviewedPerson'));

  app.get(`${BASE_HREF}/v1/map`, compression(), getMapPlaces.bind(getMapPlaces, S3_SERVER));
};

async function getMapPlaces(S3_SERVER: string, req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { thing, lang: langUse }
    } = req;
    const activeThing: { _id: mongoose.Types.ObjectId } = await thingRepositoryService.getThingByName(thing);

    if (!activeThing) {
      throw new Error(`Thing ${thing} not found`);
    }

    const data = await setMapPlaces(S3_SERVER, thing, langUse, activeThing);

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for map: ${ERROR_CODE}` });
  }
}

async function setMapPlaces(S3_SERVER: string, thing, langUse: string, activeThing: { _id: mongoose.Types.ObjectId }) {
  const placesIds: mongoose.Types.ObjectId[] = await mediaRepositoryService.getPlacesIdsByThingFromMedia(activeThing);

  if (!placesIds) {
    throw new Error(`Error: Places ids by thing: ${activeThing} were not found!`);
  }

  const [images, hashLocations, hashRegions, places, hashThingsFamilyHome] = await Promise.all([
    mediaRepositoryService.getImagesByPlacesForMap(placesIds, familyId, S3_SERVER),
    setHashLocations(langUse),
    setHashRegions(),
    setPlacesByIds(placesIds, langUse),
    setThingsFamilyAndHome(familyId)
  ]);

  const hashImages = setHashImages(images, hashThingsFamilyHome);
  const currentPlaces = defineCurrentPlaces(places, hashLocations, hashRegions, hashImages);
  const countries = setCountries(currentPlaces);

  return { places: currentPlaces, countries, thing };
}

function setHashImages(images: ImagesForMap[], hashThingsFamilyHome) {
  return reduce(
    images,
    (result, image: ImagesForMap) => {
      image.family.thing = hashThingsFamilyHome[image.family.thing.toString()];
      result[image._id] = image.family;

      return result;
    },
    {}
  );
}

function defineCurrentPlaces(places: PlaceEntity[], hashLocations, hashRegions, hashImages) {
  return reduce(
    places,
    (result, place: PlaceEntity) => {
      const location = hashLocations[place.country.toString()];

      place.locationId = location._id;
      place.region = hashRegions[location.region.toString()];
      place.lat = location.lat;
      place.lng = location.lng;
      place.familyImg = hashImages[place._id];
      place.country = location.alias || place.country;
      place.countryOriginName = location.originName;

      result.push(place);

      return result;
    },
    []
  );
}

function setCountries(currentPlaces) {
  return chain(currentPlaces)
    .map((place: PlaceEntity) => {
      return {
        _id: place.locationId,
        name: place.country
      };
    })
    .uniqBy('name')
    .sortBy('name')
    .groupBy((country: Locations) => {
      return country.name.substr(0, 1);
    })
    .map((newCountries, letter) => {
      return { countries: newCountries, letter };
    })
    .value();
}

async function setHashLocations(langUse: string) {
  const locations: CommonLocations[] = await locationRepositoryService.getCommonLocations(langUse);

  if (!locations) {
    throw new Error(`Error: Locations were not found!`);
  }

  forEach(
    locations,
    (item: CommonLocations): void => {
      item.originName = item.alias || item.country;

      const translation = head(item.translations);

      item.country = translation ? translation.country : item.country;
      item.alias = translation ? translation.alias : item.alias;

      delete item.translations;
    }
  );

  return reduce(
    locations,
    (result, country: CommonLocations) => {
      result[country._id.toString()] = {
        _id: country._id,
        alias: country.alias,
        region: country.region,
        lat: country.lat,
        lng: country.lng,
        originName: country.originName
      };

      return result;
    },
    {}
  );
}

async function setHashRegions() {
  const regions: Regions[] = await regionsRepositoryService.getHashRegionsForMap();

  if (!regions) {
    throw new Error(`Error: Regions were not found!`);
  }

  return reduce(
    regions,
    (result, region: Regions) => {
      result[region._id.toString()] = region.name;

      return result;
    },
    {}
  );
}

async function setThingsFamilyAndHome(familyThingId: mongoose.Types.ObjectId) {
  const things: Things[] = await thingRepositoryService.getThingsForFamilyAndHome(familyThingId, homeThingId);

  if (!things) {
    throw new Error(`Error: Things were not found!`);
  }

  return reduce(
    things,
    (result, thing: Things) => {
      result[thing._id.toString()] = thing.thingName;

      return result;
    },
    {}
  );
}

async function setPlacesByIds(placesIds: mongoose.Types.ObjectId[], langUse: string): Promise<PlaceEntity[]> {
  const places: PlaceEntity[] = await placesRepositoryService.getPlacesByIds(placesIds, placeTypeId);

  if (!places) {
    throw new Error(`Error: Places were not found!`);
  }

  const newPlacesIds: mongoose.Types.ObjectId[] = map(places, '_id');

  const [familiesNames, secondFamiliesNames] = await Promise.all([
    setInfoPlaceByPlacesIds(newPlacesIds, familyNameId, langUse),
    setInfoPlaceByPlacesIds(newPlacesIds, interviewedPerson, langUse)
  ]);

  const { hashFamiliesNamesByPlacesIds, hashSecondFamiliesNamesByPlacesIds } = getHashFamiliesNamesByPlacesIds(
    familiesNames,
    secondFamiliesNames
  );

  forEach(places, (place: PlaceEntity) => {
    const familyName: string = hashFamiliesNamesByPlacesIds[place._id.toString()];
    const secondFamilyName: string = hashSecondFamiliesNamesByPlacesIds[place._id.toString()];

    place.family = familyName || secondFamilyName || '';
  });

  return places;
}

async function setInfoPlaceByPlacesIds(
  placesIds: mongoose.Types.ObjectId[],
  questionId: mongoose.Types.ObjectId,
  langUse: string
) {
  const info: InfoPlaces[] = await infoPlacesRepositoryService.getInfoPlaceByPlacesIds(
    placesIds,
    questionId,
    langUse,
    questionnaireV3,
    questionnaireV2,
    questionnaireV1
  );

  if (!info) {
    throw new Error('Error: Info does not found!');
  }

  forEach(
    info,
    (item: InfoPlaces): void => {
      const translation = head(item.translations);

      item.answer = translation ? translation.answer : item.answer;

      delete item.translations;
    }
  );

  return info;
}

function getHashFamiliesNamesByPlacesIds(familiesNames, secondFamiliesNames) {
  const hashSecondFamiliesNamesByPlacesIds = getAnswers(secondFamiliesNames);
  const hashFamiliesNamesByPlacesIds = getAnswers(familiesNames);

  return { hashFamiliesNamesByPlacesIds, hashSecondFamiliesNamesByPlacesIds };
}

function getAnswers(names) {
  // tslint:disable
  return chain(names)
    .groupBy('place')
    .mapValues(
      (value: any[]): string => {
        let familyName: any = find(value, { form: questionnaireV3 });

        if (value && value.length && !familyName) {
          familyName = find(value, { form: questionnaireV2 });

          if (!familyName) {
            familyName = find(value, { form: questionnaireV1 });
          }
        }

        return familyName.answer;
      }
    )
    .value();
  // tslint:enable
}
