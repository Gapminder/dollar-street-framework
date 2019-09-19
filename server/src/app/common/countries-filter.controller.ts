// Todo: Need refactor according to "noImplicitAny" rule

import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import { Application, Request, Response } from 'express';

import { CountriesForFilters, CountryAliasLocations, TranslatedCountryLocations } from '../../interfaces/locations';
import { PlaceEntity } from '../../interfaces/places';
import { HashRegions, RegionsForFilters } from '../../interfaces/regions';

import { locationRepositoryService } from '../../repositories/location.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { regionsRepositoryService } from '../../repositories/region.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { Translation } from '../../interfaces/articleData';

let placeTypeId: mongoose.Types.ObjectId;
let homeThingId: mongoose.Types.ObjectId;
let familyThingId: mongoose.Types.ObjectId;

const ERROR_CODE = 301;

module.exports = (app: Application) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');

  const BASE_HREF = nconf.get('BASE_HREF');
  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  homeThingId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));
  familyThingId = new mongoose.Types.ObjectId(nconf.get('familyThingId'));

  app.get(`${BASE_HREF}/v1/countries-filter`, compression(), getCountriesFilterList);
};

async function getCountriesFilterList(req: Request, res: Response): Promise<Response | object> {
  try {
    const {
      query: { lang: langUse, thing: _thing }
    } = req;
    const activeThing = await thingRepositoryService.getThingByName(_thing);

    if (!activeThing) {
      throw new Error(`Error: Thing ${_thing} were not found!`);
    }

    const [countriesAlias, countries, _countriesForThing, hashRegionsById] = await Promise.all([
      setCountriesAlias(langUse),
      placesRepositoryService.getCountriesByPlaces(placeTypeId),
      getCountriesForThing(activeThing._id),
      setRegions(langUse)
    ]);

    const countriesForThing: string[] = [
      ...new Set(_countriesForThing.map((item: Partial<PlaceEntity>) => item.country.toString()))
    ];
    // todo: Create request to db that return value
    const countriesForFilters: CountriesForFilters[] = _.map(countries, (item: CountriesForFilters) => {
      const country = item.country.toString();
      const location: { country: string; region: string; originRegionName: string; originName: string } =
        countriesAlias[country];
      const _region = hashRegionsById[location.region].name;

      return {
        empty: countriesForThing.indexOf(country) === -1,
        region: _region,
        originRegionName: hashRegionsById[_region].originRegionName,
        country: location.country,
        originName: location.originName
      };
    });

    const data: RegionsForFilters[] = _.chain(countriesForFilters)
      .uniqBy('country')
      .sortBy('country')
      .groupBy('region')
      .map((value: CountriesForFilters[], index: string) => {
        return {
          region: index,
          originRegionName: hashRegionsById[index].originRegionName,
          countries: value,
          empty: !_.find(value, { empty: false })
        };
      })
      .sortBy('region')
      .value();
    // todo: Create request to db that return value

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: false, msg: [], data: null, error: `Error code for countries filter: ${ERROR_CODE}` });
  }
}

async function setCountriesAlias(langUse: string): Promise<object> {
  const locations: CountryAliasLocations[] = await locationRepositoryService.getCountriesAlias(langUse);

  if (!locations) {
    throw new Error('Error: Locations were not found!');
  }

  const countriesAliasLocations: TranslatedCountryLocations[] = _.map(locations, (item: CountryAliasLocations) => {
    const translation: Translation = _.head(item.translations);

    return {
      _id: item._id,
      originName: item.alias || item.country,
      country: translation ? translation.country : item.country,
      alias: translation ? translation.alias : item.alias,
      region: item.region
    };
  });

  return setHashCountriesAlias(countriesAliasLocations);
}

function setHashCountriesAlias(locations: TranslatedCountryLocations[]) {
  return _.reduce(
    locations,
    (result, location: TranslatedCountryLocations) => {
      result[location._id.toString()] = {
        country: location.alias || location.country,
        region: location.region.toString(),
        originName: location.originName
      };

      return result;
    },
    {}
  );
}

async function getCountriesForThing(thingId: mongoose.Types.ObjectId): Promise<{ country: string }[]> {
  const placesIds: string[] = await mediaRepositoryService.getPlacesIdForThing(thingId, homeThingId, familyThingId);
  if (!placesIds) {
    throw new Error('Error: Ids for places were not found!');
  }

  const countriesByPlacesIds: { country: string }[] = await placesRepositoryService.getCountriesByPlacesId(
    placesIds,
    placeTypeId
  );

  if (!countriesByPlacesIds) {
    throw new Error('Error: Ids for countries by places were not found!');
  }

  return countriesByPlacesIds;
}

async function setRegions(langUse: string): Promise<object> {
  const regions: HashRegions[] = await regionsRepositoryService.getHashRegions(langUse);

  if (!regions) {
    throw new Error('Error: Regions were not found!');
  }

  const hashRegions: HashRegions[] = _.map(regions, (item: HashRegions) => {
    const translation = _.head(item.translations);

    return {
      _id: item._id,
      originRegionName: item.name,
      name: translation ? translation.name : item.name
    };
  });

  return setHashRegionsById(hashRegions);
}

function setHashRegionsById(regions: HashRegions[]) {
  return _.reduce(
    regions,
    (result, region: { _id: mongoose.Types.ObjectId; originRegionName: string; name: string }) => {
      result[region._id.toString()] = { name: region.name };
      result[region.name] = { originRegionName: region.originRegionName };

      return result;
    },
    {}
  );
}
