import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';
import { ObjectID } from 'mongodb';
import { head, find, reduce, map } from 'lodash';

import { MatrixBlockPhotographer } from '../../interfaces/users';
import { Translation } from '../../interfaces/translation';
import { MatrixBlockLocations } from '../../interfaces/locations';
import { PlacesDataForMatrixBlock, PlacesForMatrixBlock } from '../../interfaces/places';
import { MatrixBlockInfoPlace, MatrixBlockInfoPlaces } from '../../interfaces/infoPlaces';
import { MatrixBlockMedia, MatrixBlockMediaData, MatrixBlockResponse } from '../../interfaces/media';
import { ThingByPlural } from '../../interfaces/things';
import { CommonHashInterface } from '../../interfaces/hash.interfaces';

import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { usersRepositoryService } from '../../repositories/users.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { infoPlacesRepositoryService } from '../../repositories/infoPlaces.repository.service';

const ERROR_CODE = 314;

let homeThingId: ObjectID;
let familyThingId: ObjectID;
let questionnaireV3: ObjectID;
let questionnaireV2: ObjectID;
let questionnaireV1: ObjectID;
let familyNameId: ObjectID;
let interviewedPerson: ObjectID;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');
  const config = app.get('nconf');

  const BASE_HREF = config.get('BASE_HREF');
  questionnaireV3 = new mongoose.Types.ObjectId(nconf.get('questionnaireV3'));
  questionnaireV1 = new mongoose.Types.ObjectId(nconf.get('questionnaireV1'));
  questionnaireV2 = new mongoose.Types.ObjectId(nconf.get('questionnaireV2'));
  interviewedPerson = new mongoose.Types.ObjectId(nconf.get('interviewedPerson'));
  familyNameId = new mongoose.Types.ObjectId(nconf.get('familyNameId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  app.get(`${BASE_HREF}/v1/matrix-view-block/`, compression(), getData.bind(getData, S3_SERVER));
};

async function getData(S3_SERVER: string, req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { thingId, lang: langUse }
    } = req;
    let {
      query: { placeId }
    } = req;

    placeId = new mongoose.Types.ObjectId(placeId);
    const activeThing: { _id: ObjectID } = await thingRepositoryService.getThingByName(thingId);

    if (!activeThing) {
      throw new Error(`Thing ${thingId} not found`);
    }

    const [placeData, familyImage, _houseImage, hashThingsFamilyHome, _activeThing] = await Promise.all([
      getPlaceData(placeId, langUse),
      setPlaceFamilyOrHousePhoto(S3_SERVER, placeId, familyThingId.toString(), 'family'),
      setPlaceFamilyOrHousePhoto(S3_SERVER, placeId, homeThingId.toString(), 'house'),
      setThingsFamilyAndHome(),
      setThing(langUse, thingId)
    ]);

    const [photographer, _country] = await Promise.all([
      setPhotographer(placeData.author, langUse),
      setCountryByCountryId(placeData.country, langUse)
    ]);

    if (!photographer) {
      throw new Error(`Photographer ${placeData.author} not found`);
    }

    if (!_country) {
      throw new Error(`Country ${placeData.country} not found`);
    }
    const response: MatrixBlockResponse = {
      familyName: placeData.familyName,
      photographer: { name: photographer, id: placeData.author },
      familyData: placeData.familyInfo,
      country: _country,
      houseImage: _houseImage,
      activeThing: _activeThing,
      translated: placeData.translated
    };

    if (familyImage) {
      familyImage.thing = hashThingsFamilyHome[familyImage.thing.toString()];
      response.familyImage = familyImage;
    }

    if (_houseImage) {
      _houseImage.thing = hashThingsFamilyHome[_houseImage.thing.toString()];
      response.houseImage = _houseImage;
    }

    res.json({
      success: true,
      data: response,
      error: null
    });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, data: null, error: `Error code for team: ${ERROR_CODE}` });
  }
}

async function setPhotographer(authorId: string, langUse: string): Promise<string> {
  const _authorId = new mongoose.Types.ObjectId(authorId);
  const photographer: MatrixBlockPhotographer = await usersRepositoryService.getPhotographer(_authorId, langUse);

  if (!photographer) {
    throw new Error(`Photographer ${_authorId} was not found`);
  }

  const translation: Translation = head(photographer.translations);

  photographer.firstName = translation ? translation.firstName : photographer.firstName;
  photographer.lastName = translation ? translation.lastName : photographer.lastName;

  return `${photographer.firstName} ${photographer.lastName}`;
}

async function setCountryByCountryId(countryId: string, langUse: string): Promise<MatrixBlockLocations> {
  const country: MatrixBlockLocations = await locationRepositoryService.getCountryByCountryId(countryId, langUse);

  if (!country) {
    throw new Error(`Locations for ${countryId} were not found`);
  }

  country.originName = country.alias || country.country;

  const translation: Translation = head(country.translations);

  country.country = translation ? translation.country : country.country;
  country.alias = translation ? translation.alias : country.alias;

  delete country.translations;

  return country;
}

async function getPlaceData(placeId: string, langUse: string): Promise<PlacesDataForMatrixBlock> {
  const [place, familyNames, secondFamilyNames] = await Promise.all([
    setPlace(placeId, langUse),
    setInfoPlace(placeId, familyNameId, langUse),
    setInfoPlace(placeId, interviewedPerson, langUse)
  ]);
  let familyName: MatrixBlockInfoPlace = find(familyNames, { form: questionnaireV3 });
  let secondFamilyName: MatrixBlockInfoPlace = find(secondFamilyNames, { form: questionnaireV3 });

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

  return {
    familyName: familyName ? familyName.answer : '',
    familyInfo: place.familyInfoSummary,
    author: place.author,
    country: place.country,
    translated: place.translated
  };
}

async function setPlaceFamilyOrHousePhoto(
  S3_SERVER: string,
  placeId: string,
  thingId: string,
  type: string
): Promise<MatrixBlockMediaData> {
  const image: MatrixBlockMedia = await mediaRepositoryService.getMatrixPlaceFamilyOrHousePhoto(placeId, thingId, type);

  if (!image) {
    return null;
  }

  return {
    _id: image._id,
    url: `${S3_SERVER}${image.src}thumb-${image.amazonfilename}`,
    thing: thingId
  };
}

async function setThing(langUse: string, thingName: string): Promise<ThingByPlural> {
  const thing: ThingByPlural = await thingRepositoryService.getThingByPluralName(thingName, langUse);

  if (!thing) {
    throw new Error(`Thing ${thingName} was not found`);
  }

  thing.originPlural = thing.plural;
  thing.originThingName = thing.thingName;

  const translation: Translation = head(thing.translations);

  if (translation) {
    thing.plural = translation.plural;
    thing.thingName = translation.thingName;

    delete thing.translations;
  }

  return thing;
}

async function setThingsFamilyAndHome(): Promise<CommonHashInterface> {
  const things: { _id: string; thingName: string }[] = await thingRepositoryService.getThingsFamilyAndHome(
    homeThingId,
    familyThingId
  );

  if (!things) {
    throw new Error(`Things were not found`);
  }

  return reduce(
    things,
    (result: CommonHashInterface, thing: { _id: string; thingName: string }) => {
      result[thing._id.toString()] = thing.thingName;

      return result;
    },
    {}
  );
}

async function setPlace(placeId: string, langUse: string): Promise<PlacesForMatrixBlock> {
  const place: PlacesForMatrixBlock = await placesRepositoryService.getPlace(placeId, langUse);

  if (!place) {
    throw new Error(`Plase ${placeId} was not found`);
  }

  const translation: Translation = head(place.translations);

  if (translation) {
    if (!translation.familyInfoSummary) {
      place.translated = false;
    } else {
      const areTransEqual: boolean =
        translation.familyInfoSummary.slice(0, 50).replace(/\s+/g, '') ===
        place.familyInfoSummary.slice(0, 50).replace(/\s+/g, '');

      !areTransEqual ? (place.translated = true) : (place.translated = false);
      place.familyInfoSummary = translation.familyInfoSummary;
    }
  }

  delete place.translations;

  return place;
}

async function setInfoPlace(placeId: string, questionId: ObjectID, langUse: string): Promise<MatrixBlockInfoPlace[]> {
  const info: MatrixBlockInfoPlaces[] = await infoPlacesRepositoryService.getInfoPlace(
    placeId,
    questionId,
    langUse,
    questionnaireV3,
    questionnaireV2,
    questionnaireV1
  );

  if (!info) {
    throw new Error(`Information about place ${placeId} was not found`);
  }

  return map(
    info,
    (item: MatrixBlockInfoPlaces): MatrixBlockInfoPlace => {
      const translation: Translation = head(item.translations);

      return {
        answer: translation ? translation.answer : item.answer,
        form: item.form
      };
    }
  );
}
