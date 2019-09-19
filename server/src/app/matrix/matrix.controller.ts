import { chain as _, head, map, reduce } from 'lodash';
import { Application, Request, Response } from 'express';
import * as mongoose from 'mongoose';

import { CommonLocations } from '../../interfaces/locations';
import { PlaceForMatrix } from '../../interfaces/places';
import { Media } from '../../interfaces/media';
import { Regions } from '../../interfaces/regions';
import { Translation } from '../../interfaces/translation';

import { regionsRepositoryService } from '../../repositories/region.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { EmbedMedia, CommonHashInterface, CommonHashRegions } from '../../interfaces/hash.interfaces';

let placeTypeId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;

const ERROR_CODE = 371;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');

  const BASE_HREF = nconf.get('BASE_HREF');
  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));

  app.get(`${BASE_HREF}/v1/things`, compression(), getMatrix.bind(getMatrix, S3_SERVER));
};

async function getMatrix(S3_SERVER: string, req: Request, res: Response): Promise<Response> {
  try {
    let {
      query: { thing, countries, regions, zoom }
    } = req;
    const {
      query: { resolution, lang }
    } = req;
    const zoomNum = 4;

    const activeThing = await thingRepositoryService.getThingByName(thing);

    if (!activeThing) {
      throw new Error(`Thing ${thing} was not found`);
    }

    thing = activeThing._id;
    zoom = zoom ? zoom : zoomNum;
    countries = countries ? countries : 'World';
    regions = regions ? regions : 'World';

    countries = countries.split(',');
    regions = regions.split(',');

    const countriesByRegion: CommonLocations[] = await setLocations(regions, countries, lang);

    if (!countriesByRegion) {
      throw new Error(`Countries by Regions were not found`);
    }

    const hashRegions: CommonHashRegions = reduce(
      countriesByRegion,
      (result: CommonHashRegions, location: CommonLocations) => {
        result[location._id.toString()] = {
          alias: location.alias,
          region: location.region,
          lat: location.lat,
          lng: location.lng
        };

        return result;
      },
      {}
    );

    const countiesArr: string[] = _(countriesByRegion)
      .map((country: CommonLocations) => {
        return country._id.toString();
      })
      .uniq()
      .compact()
      .value();

    const places: PlaceForMatrix[] = await placesRepositoryService.getMatrixPlaces(countiesArr, placeTypeId);

    if (!places) {
      throw new Error(`Places were not found`);
    }

    const placesID: string[] = map(places, '_id');

    const images: Media[] = await mediaRepositoryService.getMediaForMatrix(
      placesID,
      thing,
      resolution,
      familyThingId,
      homeThingId,
      S3_SERVER
    );

    if (!images) {
      throw new Error(`Images were not found`);
    }
    const hashImages: EmbedMedia = reduce(
      images,
      (result: EmbedMedia, image: Media) => {
        result[image._id.toString()] = {
          image: image.image,
          background: image.background
        };

        return result;
      },
      {}
    );

    const streetPlaces = _(places)
      .map((place: PlaceForMatrix) => {
        const image = hashImages[place._id];

        if (!image) {
          return place;
        }

        const country = hashRegions[place.country.toString()];

        place.image = image.image;
        place.region = country.region;
        place.lat = country.lat;
        place.lng = country.lng;
        place.country = country.alias || place.country;
        place.background = image.background;
        place.showIncome = place.income;

        return place;
      })
      .filter('image')
      .value();

    res.json({ success: true, msg: [], data: { streetPlaces }, error: null });
  } catch (error) {
    console.error(error);

    return res.json({
      success: !error,
      msg: [],
      data: null,
      error: `Error code for matrix controller: ${ERROR_CODE}`
    });
  }
}

async function setLocations(regions: string, countries: string, langUse: string): Promise<CommonLocations[]> {
  const regionsData: Regions[] = await regionsRepositoryService.getRegions();

  // TODO: fix type for query
  // tslint:disable-next-line:no-any
  const query: { $or?: any } = {};
  let locations: CommonLocations[];

  if (!regionsData) {
    throw new Error(`Regions were not found`);
  }

  const regionsIds: string[] = _(regionsData)
    .map((region: Regions) => {
      if (regions.indexOf(region.name) === -1) {
        return false;
      }

      return region._id;
    })
    .compact()
    .value();

  const hashRegionsById: CommonHashInterface = reduce(
    regionsData,
    (result: CommonHashInterface, region: Regions) => {
      result[region._id.toString()] = region.name;

      return result;
    },
    {}
  );

  if (regions.length === 1 && regions[0] === 'World' && countries.length === 1 && countries[0] === 'World') {
    locations = await locationRepositoryService.getCommonLocations(langUse);

    if (!locations) {
      throw new Error(`Locations were not found`);
    }

    return setMatrixLocations(locations, hashRegionsById);
  }

  query.$or = [];

  if (regions.length && regions.indexOf('World') === -1) {
    query.$or.push({ region: { $in: regionsIds } });
  }

  if (countries.length && countries.indexOf('World') === -1) {
    query.$or.push({ $or: [{ country: { $in: countries } }, { alias: { $in: countries } }] });
  }

  locations = await locationRepositoryService.getMatrixLocations(query, langUse);

  if (!locations) {
    throw new Error(`Locations by query ${query} were not found`);
  }

  return setMatrixLocations(locations, hashRegionsById);
}

function setMatrixLocations(locations: CommonLocations[], hashRegionsById: CommonHashInterface): CommonLocations[] {
  return map(locations, (item) => {
    const translation: Translation = head(item.translations);
    const _region: string = hashRegionsById[item.region.toString()];

    return {
      _id: item._id,
      originName: item.alias || item.country,
      country: translation ? translation.country : item.country,
      alias: translation ? translation.alias : item.alias,
      description: translation ? translation.description : item.description,
      region: _region,
      lat: item.lat,
      lng: item.lng
    };
  });
}
