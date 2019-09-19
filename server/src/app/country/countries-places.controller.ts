// Todo: Need refactor according to "noImplicitAny" rule

import { chain, filter, head, map, reduce, find, uniq } from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { Locations } from '../../interfaces/locations';
import { PlaceEntity, PlacesByCountry } from '../../interfaces/places';
import { FamilyName, InfoPlaces } from '../../interfaces/infoPlaces';
import { Images } from '../../interfaces/images';

import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { infoPlacesRepositoryService } from '../../repositories/infoPlaces.repository.service';
import {
  CommonHashInterface,
  CountriesPlacesImageCount,
  CountriesPlacesImages
} from '../../interfaces/hash.interfaces';

let placeTypeId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;
let questionnaireV3: mongoose.Types.ObjectId;
let questionnaireV1: mongoose.Types.ObjectId;
let questionnaireV2: mongoose.Types.ObjectId;
let familyNameId: mongoose.Types.ObjectId;
let interviewedPerson: mongoose.Types.ObjectId;

const ERROR_CODE = 310;

module.exports = (app: Application) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');

  const BASE_HREF = nconf.get('BASE_HREF');
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  questionnaireV3 = new mongoose.Types.ObjectId(nconf.get('questionnaireV3'));
  questionnaireV1 = new mongoose.Types.ObjectId(nconf.get('questionnaireV1'));
  questionnaireV2 = new mongoose.Types.ObjectId(nconf.get('questionnaireV2'));
  familyNameId = new mongoose.Types.ObjectId(nconf.get('familyNameId'));
  interviewedPerson = new mongoose.Types.ObjectId(nconf.get('interviewedPerson'));

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  app.get(`${BASE_HREF}/v1/country-places`, compression(), getCountryPlaces.bind(getCountryPlaces, S3_SERVER));
};

async function getCountryPlaces(S3_SERVER, req: Request, res: Response): Promise<void | Response> {
  try {
    const {
      query: { id, lang: langUse }
    } = req;
    const countryId = new mongoose.Types.ObjectId(id);
    const country: Locations = await locationRepositoryService.getCountryById(countryId);

    let places: PlaceEntity[] = await setPlacesByCountryId(countryId, langUse);

    if (!places) {
      return res.json({
        success: false,
        msg: [],
        data: null,
        error: `Places were not found. Error code: ${ERROR_CODE}`
      });
    }

    const placesIds: string[] = map(places, '_id');

    const [hashImagesCountByPlacesId, images, things] = await Promise.all([
      setImagesCount(placesIds),
      mediaRepositoryService.getImagesForCountriesPlaces(placesIds, familyThingId, homeThingId),
      thingRepositoryService.getThingsForImages(familyThingId, homeThingId)
    ]);
    const hashThings: CommonHashInterface = setHashThings(things);
    const hashImages = setHashImages(S3_SERVER, images, hashThings);

    places = filterPlaces(places, hashImages, hashImagesCountByPlacesId);

    const data: { country: Locations; places: PlacesByCountry[] } = { country, places };

    return res.json({ success: null, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for countries places: ${ERROR_CODE}` });
  }
}

function filterPlaces(
  places: PlaceEntity[],
  hashImages: CountriesPlacesImages,
  hashImagesCountByPlacesId: CountriesPlacesImageCount
) {
  return filter(places, (place: PlaceEntity) => {
    const image: Images = hashImages[place._id.toString()];

    if (!image) {
      console.error('Error: Image were not found!');

      return false;
    }

    return true;
  }).map((place: PlaceEntity) => {
    const image: Images = hashImages[place._id.toString()];

    place.imageId = image._id;
    place.thing = image.thing;
    place.image = image.url;
    place.placeId = place._id;
    place.imagesCount = hashImagesCountByPlacesId[place._id.toString()];

    return place;
  });
}

function setHashThings(things: { _id: string; thingName: string }[]): CommonHashInterface {
  return reduce(
    things,
    (result: CommonHashInterface, thing: { _id: string; thingName: string }) => {
      result[thing._id.toString()] = thing.thingName;

      return result;
    },
    {}
  );
}

function setHashImages(S3_SERVER: string, images: Images[], hashThings: CommonHashInterface): CountriesPlacesImages {
  return reduce(
    images,
    (result: CountriesPlacesImages, image: Images) => {
      result[image.place.toString()] = {
        _id: image._id,
        url: `${S3_SERVER}${image.src}thumb-${image.amazonfilename}`,
        thing: hashThings[image.thing.toString()]
      };

      return result;
    },
    {}
  );
}

async function setImagesCount(placesIds: string[]): Promise<CountriesPlacesImageCount | {}> {
  const things: string[] = await mediaRepositoryService.getThingsIdByPlaces(placesIds);
  const thingsIds: string[] = await thingRepositoryService.getWhiteListThings(things);
  const media: { place: string; things: { _id: string }[] }[] = await mediaRepositoryService.getMediaByPlaces(
    placesIds,
    thingsIds
  );

  if (!media.length) {
    return {};
  }

  const allHashMedia = {};
  const uniqHashMedia = {};

  for (const mediaRecord of media) {
    const values = allHashMedia[mediaRecord.place] || [];

    values.push(
      ...mediaRecord.things.map((thing) => {
        if (thing._id) {
          return thing._id.toString();
        }
      })
    );
    allHashMedia[mediaRecord.place] = values;
  }

  for (const key of Object.keys(allHashMedia)) {
    uniqHashMedia[key] = uniq(allHashMedia[key]).length;
  }

  return uniqHashMedia;
}

async function setPlacesByCountryId(countryId: mongoose.Types.ObjectId, langUse: string): Promise<PlaceEntity[]> {
  const places: PlaceEntity[] = await placesRepositoryService.getIncomePlacesByCountryId(countryId, placeTypeId);

  if (!places) {
    throw new Error(`Error: Places by countryId: ${countryId} were not found`);
  }

  const placesIds: mongoose.Types.ObjectId[] = map(places, '_id');

  const [familiesNames, secondFamiliesNames] = await Promise.all([
    setInfoPlaceByPlacesIds(placesIds, familyNameId, langUse),
    setInfoPlaceByPlacesIds(placesIds, interviewedPerson, langUse)
  ]);

  const { hashFamiliesNamesByPlacesIds, hashSecondFamiliesNamesByPlacesIds } = getHashFamiliesNamesByPlacesIds(
    familiesNames,
    secondFamiliesNames
  );

  return map(
    places,
    (place: PlaceEntity): PlaceEntity => {
      const familyName: string = hashFamiliesNamesByPlacesIds[place._id.toString()];
      const secondFamilyName: string = hashSecondFamiliesNamesByPlacesIds[place._id.toString()];

      return Object.assign({ family: familyName || secondFamilyName || '' }, place);
    }
  );
}

// todo: all method replace to query to db
async function setInfoPlaceByPlacesIds(
  placesIds: mongoose.Types.ObjectId[],
  questionId: mongoose.Types.ObjectId,
  langUse: string
): Promise<FamilyName[]> {
  const info: InfoPlaces[] = await infoPlacesRepositoryService.getInfoPlaceByPlacesIds(
    placesIds,
    questionId,
    langUse,
    questionnaireV3,
    questionnaireV2,
    questionnaireV1
  );

  if (!info) {
    throw new Error('Error: Info about place does not found!');
  }

  return map(info, (item: InfoPlaces) => {
    const translation = head(item.translations);

    return {
      answer: translation ? translation.answer : item.answer,
      form: item.form,
      place: item.place
    };
  });
}

function getHashFamiliesNamesByPlacesIds(familiesNames: FamilyName[], secondFamiliesNames: FamilyName[]) {
  const hashSecondFamiliesNamesByPlacesIds = setHashFamiliesNamesByPlacesIds(secondFamiliesNames);
  const hashFamiliesNamesByPlacesIds = setHashFamiliesNamesByPlacesIds(familiesNames);

  return { hashFamiliesNamesByPlacesIds, hashSecondFamiliesNamesByPlacesIds };
}

function setHashFamiliesNamesByPlacesIds(names: FamilyName[]) {
  return chain(names)
    .groupBy('place')
    .mapValues(
      (value: FamilyName[]): string => {
        let familyName = find(value, { form: questionnaireV3 });

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
}
