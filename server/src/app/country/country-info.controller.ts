// Todo: Need refactor according to "noImplicitAny" rule

import { head, reduce } from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';
import { LocationByCountryId } from '../../interfaces/locations';
import { Regions } from '../../interfaces/regions';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { regionsRepositoryService } from '../../repositories/region.repository.service';

let placeTypeId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;

const ERROR_CODE = 311;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const config = app.get('nconf');

  const BASE_HREF = config.get('BASE_HREF');
  placeTypeId = new mongoose.Types.ObjectId(config.get('placeTypeId'));
  familyThingId = new mongoose.Types.ObjectId(config.get('familyThingId'));
  homeThingId = new mongoose.Types.ObjectId(config.get('homeThingId'));

  app.get(`${BASE_HREF}/v1/country-info`, compression(), getCountryInfo);
};

async function getCountryInfo(req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { id: countryId, lang: langUse }
    } = req;

    const [hashRegionsById, country, thing] = await Promise.all([
      setHashRegionsById(),
      setLocationByCountryId(countryId, langUse),
      thingRepositoryService.getThingNameByThingId(familyThingId, langUse)
    ]);

    country.region = hashRegionsById[country.region.toString()];

    const placesIds = await placesRepositoryService.getPlacesQuantity(country._id, placeTypeId);
    const placesIdsByPortraitAndHouse = await mediaRepositoryService.getPlacesByPortraitAndHouse(
      placesIds,
      familyThingId,
      homeThingId
    );
    const things: string[] = await mediaRepositoryService.getThingsIdByPlaces(placesIdsByPortraitAndHouse);
    const images: number = await thingRepositoryService.countImagesForCountry(things);

    const data: { country: LocationByCountryId; places: number; images: number; thing: string } = {
      country,
      places: placesIdsByPortraitAndHouse.length,
      images,
      thing: thing.plural
    };

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: false, msg: [], data: null, err: `Error code for country info: ${ERROR_CODE}` });
  }
}

async function setLocationByCountryId(
  countryId: mongoose.Types.ObjectId,
  langUse: string
): Promise<LocationByCountryId> {
  const location: LocationByCountryId = await locationRepositoryService.getLocationByCountryId(countryId, langUse);

  if (!location) {
    throw new Error(`Error: Location ${countryId} does not found!`);
  }

  location.originName = location.alias || location.country;
  const translation = head(location.translations);
  location.country = translation ? translation.country : location.country;
  location.alias = translation ? translation.alias : location.alias;
  location.description = translation ? translation.description : location.description;
  delete location.translations;

  return location;
}

async function setHashRegionsById(): Promise<object> {
  const regions = await regionsRepositoryService.getHashRegionsByIdForCountryInfo();

  if (!regions) {
    throw new Error('Error: Regions were not found!');
  }

  return reduce(
    regions,
    (result: { _id: string }, region: Regions) => {
      result[region._id.toString()] = region.name;

      return result;
    },
    {}
  );
}
