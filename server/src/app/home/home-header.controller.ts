// Todo: Need refactor according to "noImplicitAny" rule

import { reduce, head, find, map } from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { Regions } from '../../interfaces/regions';
import { PlaceEntity } from '../../interfaces/places';
import { ThingByPlural } from '../../interfaces/things';
import { CommonLocations, TranslatedCommonLocations } from '../../interfaces/locations';
import { FamilyName, InfoPlaces } from '../../interfaces/infoPlaces';
import { CommonHashInterface } from '../../interfaces/hash.interfaces';
import { CommonShortInfoIncomes } from '../../interfaces/commonShortInfoIncomes';

import { regionsRepositoryService } from '../../repositories/region.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { shortInfoIncomesRepositoryService } from '../../repositories/commonShortInfoIncomes.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { infoPlacesRepositoryService } from '../../repositories/infoPlaces.repository.service';

let BASE_HREF: string;
let placeTypeId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;
let familyIconThingId: mongoose.Types.ObjectId;
let questionnaireV3: mongoose.Types.ObjectId;
let questionnaireV1: mongoose.Types.ObjectId;
let questionnaireV2: mongoose.Types.ObjectId;
let familyNameId: mongoose.Types.ObjectId;
let interviewedPerson: mongoose.Types.ObjectId;

const ERROR_CODE = 316;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');

  BASE_HREF = nconf.get('BASE_HREF');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  familyIconThingId = new mongoose.Types.ObjectId(nconf.get('familyIconThingId'));
  questionnaireV3 = new mongoose.Types.ObjectId(nconf.get('questionnaireV3'));
  questionnaireV1 = new mongoose.Types.ObjectId(nconf.get('questionnaireV1'));
  questionnaireV2 = new mongoose.Types.ObjectId(nconf.get('questionnaireV2'));
  familyNameId = new mongoose.Types.ObjectId(nconf.get('familyNameId'));
  interviewedPerson = new mongoose.Types.ObjectId(nconf.get('interviewedPerson'));

  app.get(`${BASE_HREF}/v1/home-header`, compression(), getHomeHeaderData.bind(getHomeHeaderData, S3_SERVER));
};

async function getHomeHeaderData(S3_SERVER, req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { lang: langUse, placeId }
    } = req;
    const _placeId = new mongoose.Types.ObjectId(placeId);

    const [hashRegions, place, familyImage, houseImage, familyIcon, commonAboutData, thing] = await Promise.all([
      setLocations(langUse),
      getPlace(_placeId, langUse),
      setPlaceFamilyOrHousePhoto(S3_SERVER, _placeId, familyThingId, 'family'),
      setPlaceFamilyOrHousePhoto(S3_SERVER, _placeId, homeThingId, 'house'),
      setPlaceFamilyOrHousePhoto(S3_SERVER, _placeId, familyIconThingId, 'icon'),
      getAboutDescription(langUse),
      setFamilyThing(langUse, familyThingId)
    ]);

    const data: PlaceEntity = getAdditionalFieldsToPlace(
      place,
      hashRegions,
      commonAboutData,
      thing,
      familyImage,
      houseImage,
      familyIcon
    );

    res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for home head: ${ERROR_CODE}` });
  }
}

function getAdditionalFieldsToPlace(
  place: PlaceEntity,
  hashRegions: object,
  commonAboutData: string,
  thing: ThingByPlural,
  familyImage: string,
  houseImage: string,
  familyIcon: string
): PlaceEntity {
  const countryId: string = typeof place.country === 'string' ? place.country : place.country._id.toString();
  place.country = hashRegions[countryId];

  place.commonAboutData = commonAboutData;
  place.thing = thing;

  if (familyImage) {
    place.image = familyImage;
    place.familyThingId = familyThingId;
  } else if (houseImage) {
    place.image = houseImage;
    place.familyThingId = homeThingId;
  } else if (familyIcon) {
    place.image = familyIcon;
    place.familyThingId = familyIconThingId;
  }

  return place;
}

async function setLocations(langUse: string): Promise<object> {
  const regions: Regions[] = await regionsRepositoryService.getRegions();

  if (!regions) {
    throw new Error('Error: Regions were not found!');
  }

  const hashRegions: CommonHashInterface = setHashRegions(regions);
  const locations: CommonLocations[] = await locationRepositoryService.getCommonLocations(langUse);

  if (!locations) {
    throw new Error('Error: Locations were not found!');
  }

  const _locations = map(locations, (location: CommonLocations) => {
    const translation = head(location.translations);

    return {
      _id: location._id,
      alias: translation ? translation.alias : location.alias,
      country: translation ? translation.country : location.country,
      lat: location.lat,
      lng: location.lng,
      originName: location.alias || location.country,
      region: location.region
    };
  });

  return setHashCountriesById(_locations, hashRegions);
}

function setHashCountriesById(locations: TranslatedCommonLocations[], hashRegions: CommonHashInterface): object {
  return reduce(
    locations,
    (result: object, location: TranslatedCommonLocations) => {
      result[location._id.toString()] = {
        _id: location._id,
        alias: location.alias || location.country,
        region: hashRegions[location.region.toString()],
        lat: location.lat,
        lng: location.lng,
        originName: location.originName
      };

      return result;
    },
    {}
  );
}

function setHashRegions(regions: Regions[]): CommonHashInterface {
  return reduce(
    regions,
    (result: CommonHashInterface, region: Regions) => {
      result[region._id.toString()] = region.name;

      return result;
    },
    {}
  );
}

async function getPlace(placeId: mongoose.Types.ObjectId, langUse: string): Promise<PlaceEntity> {
  const place: PlaceEntity = await setPlaceById(placeId, placeTypeId, langUse);

  if (!place) {
    throw new Error(`Error: Place ${placeId} does not found!`);
  }

  const familyNames: FamilyName[] = await setInfoPlaceById(placeId, familyNameId, langUse);

  if (!familyNames) {
    throw new Error('Error: Family names does not found!');
  }

  const secondFamilyNames: FamilyName[] = await setInfoPlaceById(placeId, interviewedPerson, langUse);

  if (!secondFamilyNames) {
    throw new Error('Error: Second family names does not found!');
  }

  const familyName: FamilyName = setFamilyNamesConditions(familyNames, secondFamilyNames);

  place.familyName = familyName ? familyName.answer : '';

  return place;
}

function setFamilyNamesConditions(familyNames: FamilyName[], secondFamilyNames: FamilyName[]): FamilyName {
  let familyName = find(familyNames, { form: questionnaireV3 });
  let secondFamilyName = find(secondFamilyNames, { form: questionnaireV3 });

  if (familyNames && familyNames.length && !familyName) {
    familyName = find(familyNames, { form: questionnaireV2 });

    if (!familyName) {
      familyName = find(familyNames, { form: questionnaireV1 });
    }
  }

  if (secondFamilyNames && secondFamilyNames.length && !familyName && !secondFamilyName) {
    secondFamilyName = find(secondFamilyNames, { form: questionnaireV2 });

    if (!secondFamilyNames) {
      secondFamilyName = find(secondFamilyNames, { form: questionnaireV1 });
    }
  }

  if (!familyName && secondFamilyName) {
    familyName = secondFamilyName;
  }

  return familyName;
}

async function setPlaceFamilyOrHousePhoto(
  S3_SERVER: string,
  placeId: mongoose.Types.ObjectId,
  thingId: mongoose.Types.ObjectId,
  type: string
): Promise<string> {
  const image = await mediaRepositoryService.getPlaceFamilyOrHousePhoto(placeId, thingId, type);

  if (!image) {
    return null;
  }

  return `${S3_SERVER}${image.src}thumb-${image.amazonfilename}`;
}

async function setFamilyThing(langUse: string, thingId: mongoose.Types.ObjectId): Promise<ThingByPlural> {
  const thing: ThingByPlural = await thingRepositoryService.getFamilyThing(langUse, thingId);

  if (!thing) {
    throw new Error(`Error: Thing ${thingId} does not found!`);
  }

  thing.originPlural = thing.plural;
  thing.originThingName = thing.thingName;

  const translation = head(thing.translations);

  if (translation) {
    thing.plural = translation.plural;
    thing.thingName = translation.thingName;

    delete thing.translations;
  }

  return thing;
}

async function getAboutDescription(langUse: string): Promise<string> {
  const about: CommonShortInfoIncomes = await shortInfoIncomesRepositoryService.getAboutData(langUse);

  if (!about) {
    return null;
  }

  const translation = head(about.translations);

  if (translation) {
    about.description = translation ? translation.description : about.description;

    delete about.translations;
  }

  return about.description || '';
}

async function setPlaceById(
  placeId: mongoose.Types.ObjectId,
  _placeTypeId: mongoose.Types.ObjectId,
  langUse: string
): Promise<PlaceEntity> {
  const place: PlaceEntity = await placesRepositoryService.getPlaceById(placeId, placeTypeId, langUse);

  if (!place) {
    throw new Error(`Error : Data for place ${placeId} does not found!`);
  }

  const translation = head(place.translations);

  if (translation) {
    if (!translation.familyInfoSummary) {
      place.translated = false;
    } else {
      // tslint:disable
      const areTransEqual: boolean =
        place.familyInfoSummary.slice(0, 50).replace(/\s+/g, '') ===
        translation.familyInfoSummary.slice(0, 50).replace(/\s+/g, '');
      // tslint:enable

      place.translated = !areTransEqual;
      place.aboutData = translation.aboutData;
      place.familyInfo = translation.familyInfo;
      place.familyInfoSummary = translation.familyInfoSummary;
    }
  }

  delete place.translations;

  return place;
}

async function setInfoPlaceById(
  placeId: mongoose.Types.ObjectId,
  questionId: mongoose.Types.ObjectId,
  langUse: string
): Promise<FamilyName[]> {
  const info: InfoPlaces[] = await infoPlacesRepositoryService.getInfoPlacesById(
    placeId,
    questionId,
    langUse,
    questionnaireV3,
    questionnaireV2,
    questionnaireV1
  );

  if (!info) {
    throw new Error('Error: Places info does not found!');
  }

  return map(info, (item: FamilyName) => {
    const translation = head(item.translations);

    return {
      answer: translation ? translation.answer : item.answer,
      form: item.form
    };
  });
}
