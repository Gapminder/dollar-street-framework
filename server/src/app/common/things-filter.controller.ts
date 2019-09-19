import { Application, Request, Response } from 'express';
import { chain, map, head, get, compact, reduce } from 'lodash';
import * as mongoose from 'mongoose';

import { CategoriesForThings, CategoriesForThingsFilter, ThingsWithIcon } from '../../interfaces/things';
import { regionsRepositoryService } from '../../repositories/region.repository.service';
import { locationRepositoryService } from '../../repositories/location.repository.service';
import { placesRepositoryService } from '../../repositories/place.repository.service';
import { mediaRepositoryService } from '../../repositories/media.repository.service';
import { thingRepositoryService } from '../../repositories/thing.repository.service';
import { thingsFilterRepositoryService } from '../../repositories/thingsFilter.repository.service';
import { articleRepositoryService } from '../../repositories/article.repository.service';
import { ArticleData } from '../../interfaces/articleData';

let placeTypeId: mongoose.Types.ObjectId;
let familyIconThingId: mongoose.Types.ObjectId;
let homeId: mongoose.Types.ObjectId;

const ERROR_CODE = 309;

module.exports = (app: Application) => {
  const nconf = app.get('nconf');
  const compression = app.get('compression.middleware');

  placeTypeId = new mongoose.Types.ObjectId(nconf.get('placeTypeId'));
  familyIconThingId = new mongoose.Types.ObjectId(nconf.get('familyIconThingId'));
  homeId = new mongoose.Types.ObjectId(nconf.get('homeThingId'));

  const BASE_HREF = nconf.get('BASE_HREF');

  const S3_SERVER_PREFIX = nconf.get('S3_SERVER_PREFIX');
  const S3_BUCKET = nconf.get('S3_BUCKET');
  const S3_SERVER = `//${S3_SERVER_PREFIX}${S3_BUCKET}/`;

  app.get(`${BASE_HREF}/v1/things-filter`, compression(), getSearchData.bind(getSearchData, S3_SERVER));
};

async function getSearchData(S3_SERVER, req: Request, res: Response): Promise<Response> {
  try {
    const {
      query: { thing, lang: langUse, place, regions, countries }
    } = req;

    const activeThing = await thingRepositoryService.getThingByName(thing);

    if (!activeThing) {
      throw new Error(`Error: Things by name ${thing} were not found!`);
    }

    let placeId: mongoose.Types.ObjectId | null;

    placeId = place ? new mongoose.Types.ObjectId(place) : null;

    const _regions: string[] = regions ? regions.split(',') : ['World'];
    const _countries: string[] = countries ? countries.split(',') : ['World'];

    const [filters, things, receivedThing] = await Promise.all([
      thingsFilterRepositoryService.getAllTopicsAndPopular(),
      getAllThings(S3_SERVER, langUse, activeThing._id, placeId, _regions, _countries),
      getThing(S3_SERVER, langUse, activeThing._id)
    ]);

    const activeRelatedThings: string[] = get(receivedThing, 'relatedThings', [])
      .join(',')
      .split(',');
    const popularThingsIds: string[] = filters.popularThings.join(',').split(',');
    const allTopicsIds: string[] = filters.allTopics.join(',').split(',');

    const data = {
      otherThings: getTypeOfThings(allTopicsIds, things),
      relatedThings: getTypeOfThings(activeRelatedThings, things),
      popularThings: getTypeOfThings(popularThingsIds, things),
      thing: receivedThing
    };

    return res.json({ success: true, msg: [], data, error: null });
  } catch (err) {
    console.error(err);

    return res.json({ success: !err, msg: [], data: null, error: `Error code for things filter: ${ERROR_CODE}` });
  }
}

function getTypeOfThings(thingIds: string[], data: CategoriesForThingsFilter[]): CategoriesForThingsFilter[] {
  const thingsByIds = map(thingIds, (id) => data.find((dataItem) => dataItem._id.toString() === id));

  return compact(thingsByIds);
}

async function getAllThings(
  S3_SERVER: string,
  lang: string,
  thingId: mongoose.Types.ObjectId,
  placeId: mongoose.Types.ObjectId,
  regions: string[],
  countries: string[]
): Promise<CategoriesForThingsFilter[]> {
  const [receivedThings, notEmptyThings] = await Promise.all([
    getAllThingsList(lang, placeId),
    getNotEmptyThings(placeId, regions, countries)
  ]);

  if (placeId) {
    return filterReceivedThings(S3_SERVER, receivedThings, thingId);
  }

  const thingsId = chain(notEmptyThings)
    .compact()
    .map((thing: string) => {
      return thing.toString();
    })
    .uniq()
    .value();

  const _thingsWithIcon = setThingsIcon(S3_SERVER, receivedThings, thingsId);

  return chain(_thingsWithIcon)
    .filter(
      (thing: ThingsWithIcon): boolean => {
        return thing._id.toString() !== thingId.toString() || thing._id.toString() !== familyIconThingId.toString();
      }
    )
    .sortBy('thingName')
    .value();
}

function filterReceivedThings(
  S3_SERVER,
  receivedThings: CategoriesForThingsFilter[],
  thingId: mongoose.Types.ObjectId
) {
  return reduce(
    receivedThings,
    (result, thing: CategoriesForThings) => {
      thing.icon = thing.icon ? `${S3_SERVER}thing/${thing._id}/2C4351-${thing.icon}` : null;

      if (thing._id.toString() !== thingId) {
        result.push(thing);
      }

      return result;
    },
    []
  );
}

function setThingsIcon(S3_SERVER, receivedThings: CategoriesForThingsFilter[], thingsId: string[]): ThingsWithIcon[] {
  return map(
    receivedThings,
    (thing: CategoriesForThingsFilter): ThingsWithIcon => {
      const _thingIcon = thing.icon ? `${S3_SERVER}thing/${thing._id}/2C4351-${thing.icon}` : null;

      return {
        _id: thing._id,
        synonymous: thing.synonymous,
        thingName: thing.thingName,
        relatedThings: thing.relatedThings,
        plural: thing.plural,
        originPlural: thing.originPlural,
        icon: _thingIcon,
        empty: thingsId.indexOf(thing._id.toString()) === -1
      };
    }
  );
}

async function getNotEmptyThings(
  placeId: mongoose.Types.ObjectId,
  regions: string[],
  countries: string[]
): Promise<string[]> {
  if (placeId) {
    return null;
  }

  const newCountries = await setCountries(regions, countries);

  if (!newCountries) {
    throw new Error('Error: Countries were not found!');
  }

  const placesId = await placesRepositoryService.getPlacesIdsByCountries(newCountries, placeTypeId);

  if (!placesId) {
    throw new Error('Error: Places ids were not found!');
  }

  const mediaThings: { _id: string }[] = await mediaRepositoryService.getMediaThings(placesId);

  if (!mediaThings) {
    throw new Error('Error: MediaThings were not found!');
  }

  return map(mediaThings, '_id');
}

async function getAllThingsList(lang: string, placeId: mongoose.Types.ObjectId): Promise<CategoriesForThingsFilter[]> {
  const placesId: string[] = await placesRepositoryService.getPlaces(placeId, placeTypeId);

  if (!placesId) {
    throw new Error('Error: Places were not found!');
  }

  const mediaThings: { _id: string }[] = await mediaRepositoryService.getMediaThings(placesId);

  if (!mediaThings) {
    throw new Error('Error: MediaThings were not found!');
  }

  const mediaThingsId: string[] = map(mediaThings, '_id');
  const categoriesForThings: CategoriesForThingsFilter[] = await setCategoriesForThings(lang, mediaThingsId);

  if (!categoriesForThings) {
    throw new Error('Error: Things-filter Categories were not found!');
  }

  return categoriesForThings;
}

async function setCategoriesForThings(langUse: string, thingsId: string[]): Promise<CategoriesForThingsFilter[]> {
  const categories: CategoriesForThings[] = await thingRepositoryService.getCategoriesForThings(langUse, thingsId);

  if (!categories) {
    throw new Error('Error: Categories were not found!');
  }

  return map(categories, (category: CategoriesForThings) => {
    const translation = head(category.translations);

    return {
      _id: category._id,
      originPlural: category.plural,
      icon: category.icon,
      plural: translation ? translation.plural : category.plural,
      synonymous: translation ? translation.synonymous : category.synonymous,
      thingName: translation ? translation.thingName : category.thingName,
      relatedThings: category.relatedThings
    };
  });
}

async function getThing(S3_SERVER, lang: string, thingId: mongoose.Types.ObjectId): Promise<CategoriesForThings> {
  const [thing, article] = await Promise.all([setThingData(S3_SERVER, lang, thingId), setThingArticle(thingId, lang)]);

  if (article) {
    thing.shortDescription = article.shortDescription;
    thing.isShowReadMore = !!article.description;
  }

  return thing;
}

async function setThingData(
  S3_SERVER,
  langUse: string,
  thingId: mongoose.Types.ObjectId
): Promise<CategoriesForThings> {
  const thingData: CategoriesForThings = await thingRepositoryService.getThingData(langUse, thingId);

  if (!thingData) {
    throw new Error('Error: Things data does not found!');
  }

  if (thingData._id.toString() !== homeId.toString()) {
    thingData.relatedThings = thingData.relatedThings ? [homeId, ...thingData.relatedThings] : [homeId];
  }

  thingData.iconDark = thingData.icon ? `${S3_SERVER}thing/${thingData._id}/2C4351-${thingData.icon}` : null;
  thingData.iconLight = thingData.icon ? `${S3_SERVER}thing/${thingData._id}/2C4351-${thingData.icon}` : null;

  thingData.originPlural = thingData.plural;

  const translation = head(thingData.translations);

  if (translation) {
    thingData.plural = translation.plural;
    thingData.thingName = translation.thingName;
    thingData.synonymous = translation.synonymous;

    delete thingData.translations;
  }

  return thingData;
}

async function setCountries(regions: string[], countries: string[]): Promise<string[]> {
  const regionsData = await regionsRepositoryService.getRegions();

  if (!regionsData) {
    throw new Error('Error: Data for Regions does not found!');
  }

  const regionsIds: string[] = reduce(
    regionsData,
    (result, data) => {
      if (data.name) {
        result.push(data._id);
      }

      return result;
    },
    []
  );

  const locationsIds: string[] = await locationRepositoryService.getLocationsIds(regions, countries, regionsIds);

  if (!locationsIds) {
    throw new Error('Error: Ids for Locations were not found!');
  }

  return locationsIds;
}

// tslint:disable
async function setThingArticle(thingId: mongoose.Types.ObjectId, langUse: string): Promise<ArticleData | any> {
  const article: ArticleData = await articleRepositoryService.getArticleData(thingId, langUse);

  if (!article) {
    return [];
  }

  const translation = head(article.translations);

  if (translation) {
    article.shortDescription = translation.shortDescription;
    article.description = translation.description;

    delete article.translations;
  }

  return article;
}

// tslint:enable
