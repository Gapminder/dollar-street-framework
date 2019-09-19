// Todo: Need refactor according to "noImplicitAny" rule

import { head, map, get, reduce } from 'lodash';
import * as mongoose from 'mongoose';
import { Request, Response, Application } from 'express';

import { HashLocation } from '../../interfaces/locations';
import { HashRegions } from '../../interfaces/regions';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { articleRepositoryService } from '../../repositories/article.repository.service';
import { ArticleData } from '../../interfaces/articleData';
import { regionsRepositoryService } from '../../repositories/region.repository.service';

let placeTypeId: string;

const ERROR_CODE = 318;

module.exports = (app: Application) => {
  const compression = app.get('compression.middleware');
  const nconf = app.get('nconf');
  const BASE_HREF = nconf.get('BASE_HREF');

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;
  placeTypeId = nconf.get('placeTypeId');

  app.get(`${BASE_HREF}/v1/home-media-view-block`, compression(), getData.bind(getData, S3_SERVER));
};

async function getData(S3_SERVER, req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { placeId, thingId, lang: langUse }
    } = req;
    const data = await setData(S3_SERVER, langUse, placeId, thingId);

    res.json({ success: true, data, error: null });
  } catch (err) {
    return res.json({ success: !err, data: null, error: `Error code for home media view block: ${ERROR_CODE}` });
  }
}

async function setData(S3_SERVER: string, langUse: string, placeId: string, thingId: string) {
  try {
    const _placeId = new mongoose.Types.ObjectId(placeId);
    const _thingId = new mongoose.Types.ObjectId(thingId);
    const [thing, place, article, hashRegionsById, hashLocationById] = await Promise.all([
      setThing(S3_SERVER, langUse, _thingId),
      placesRepositoryService.getCountry(_placeId),
      setArticle(_thingId, langUse),
      getHashRegions(langUse),
      getHashLocations()
    ]);

    const country = await setCountryById(place.country, langUse);

    if (article) {
      article.isDescription = !!article.description;
    }

    country.region = hashRegionsById[country.region];
    country.originRegionName = hashRegionsById[country.region];
    country.countriesName = map(country.countriesName, (countryId: string) => {
      return hashLocationById[countryId];
    });

    return { country, article, thing };
  } catch (err) {
    console.error(err);

    throw new Error(err);
  }
}

async function setThing(S3_SERVER: string, langUse: string, thingId: mongoose.Types.ObjectId) {
  const thing = await thingRepositoryService.getThingHomeMediaViewBlock(langUse, thingId);

  if (!thing) {
    throw new Error(`Error: Thing ${thingId} does not found!`);
  }

  get(thing, 'icon', false)
    ? (thing.icon = `${S3_SERVER}thing/${thing._id}/2C4351-${thing.icon}`)
    : (thing.icon = null);

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

async function setCountryById(countryId: string, langUse: string) {
  try {
    const country = await locationRepositoryService.getCountryByIdForHomeMedia(countryId, langUse);

    if (!country) {
      console.error(`Error: Country ${countryId} does not found`);

      return null;
    }

    country.originName = country.alias || country.country;
    const translation = head(country.translations);
    country.country = translation ? translation.country : country.country;
    country.alias = translation ? translation.alias : country.alias;
    delete country.translations;
    country.name = country.alias || country.country;

    delete country.alias;
    delete country.country;

    country.countriesName = await setCountriesByRegion(country.region);

    return country;
  } catch (err) {
    console.error(err);

    throw new Error(err);
  }
}

async function setArticle(thingId: mongoose.Types.ObjectId, langUse: string) {
  const article: ArticleData = await articleRepositoryService.getArticleData(thingId, langUse);

  if (!article) {
    return null;
  }

  const translation = head(article.translations);

  // tslint:disable
  if (translation) {
    const areTransEqual: boolean =
      article.shortDescription.slice(0, 50).replace(/\s+/g, '') ===
      translation.shortDescription.slice(0, 50).replace(/\s+/g, '');

    !areTransEqual ? (article.translated = true) : (article.translated = false);

    article.description = translation.description;
    article.shortDescription = translation.shortDescription;
  }
  // tslint:enable

  delete article.translations;

  return article;
}

async function setCountriesByRegion(region: string): Promise<string[]> {
  const countries = await locationRepositoryService.getCountriesByRegion(region);

  if (!countries) {
    throw new Error(`Error: Countries by region ${region} were not found!`);
  }

  const countriesIds: string[] = map(countries, '_id');
  const existCountries: string[] = await placesRepositoryService.getExistCountriesByCountries(
    countriesIds,
    placeTypeId
  );

  if (!existCountries) {
    throw new Error(`Error: Countries were not found!`);
  }

  return existCountries;
}

async function getHashLocations() {
  const locations = await locationRepositoryService.getLocations();

  if (!locations) {
    throw new Error(`Error: Locations were not found!`);
  }

  return setHashLocations(locations);
}

function setHashLocations(locations: HashLocation[]) {
  return reduce(
    locations,
    (result, location: HashLocation) => {
      result[location._id.toString()] = location.alias || location.country;

      return result;
    },
    {}
  );
}

async function getHashRegions(langUse: string) {
  const regions: HashRegions[] = await regionsRepositoryService.getHashRegions(langUse);

  if (!regions) {
    throw new Error(`Error: Regions were not found!`);
  }

  const _regions: HashRegions[] = map(regions, (region: HashRegions) => {
    const translation = head(region.translations);
    const _originRegionName = region.name;

    return {
      _id: region._id,
      name: translation ? translation.name : region.name,
      originRegionName: _originRegionName
    };
  });

  return setHashRegionsById(_regions);
}

function setHashRegionsById(regions: HashRegions[]) {
  return reduce(
    regions,
    (result, region: HashRegions) => {
      result[region._id.toString()] = region.name;
      result[region.name] = region.originRegionName;

      return result;
    },
    {}
  );
}
