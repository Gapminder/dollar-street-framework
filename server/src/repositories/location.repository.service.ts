import * as mongoose from 'mongoose';

import {
  CountryForHomeMediaViewBlock,
  HashLocation,
  LocationByCountryId,
  Locations,
  CommonLocations,
  TeamLocations,
  CountryAliasLocations,
  MatrixBlockLocations
} from '../interfaces/locations';
import { Regions } from '../interfaces/regions';
import { queryRetry } from './query-retry.decorator';

class LocationRepositoryService {
  private readonly locations: mongoose.Model<Locations>;

  constructor() {
    this.locations = mongoose.model('Locations');
  }

  @queryRetry()
  async getCountriesAlias(langUse: string): Promise<CountryAliasLocations[]> {
    const projection = {
      alias: 1,
      country: 1,
      region: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .find({}, projection)
      .lean()
      .exec() as Promise<CountryAliasLocations[]>;
  }

  @queryRetry()
  async getCountryById(countryId: mongoose.Types.ObjectId): Promise<Locations> {
    return this.locations
      .findOne(
        {
          _id: countryId
        },
        {
          _id: 1
        }
      )
      .lean()
      .exec() as Promise<Locations>;
  }

  @queryRetry()
  async getLocationsIds(regions: string[], countries: string[], regionsIds: string[]): Promise<string[]> {
    // tslint:disable
    const query: any = {};
    // tslint:enable

    if (regions.length === 1 && regions[0] === 'World' && countries.length === 1 && countries[0] === 'World') {
      return this.locations
        .find(query)
        .distinct('_id')
        .lean()
        .exec() as Promise<string[]>;
    }

    query.$or = [];

    if (regions.length && regions.indexOf('World') === -1) {
      query.$or.push({ region: { $in: regionsIds } });
    }

    if (countries.length && countries.indexOf('World') === -1) {
      query.$or.push({ $or: [{ country: { $in: countries } }, { alias: { $in: countries } }] });
    }

    return this.locations
      .find(query)
      .distinct('_id')
      .lean()
      .exec() as Promise<string[]>;
  }

  @queryRetry()
  async getLocationByCountryId(countryId: mongoose.Types.ObjectId, langUse: string): Promise<LocationByCountryId> {
    const query = { _id: countryId };
    const projection = {
      code: 1,
      region: 1,
      country: 1,
      lat: 1,
      lng: 1,
      alias: 1,
      description: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .findOne(query, projection)
      .lean()
      .exec() as Promise<LocationByCountryId>;
  }

  @queryRetry()
  async getCommonLocations(langUse: string): Promise<CommonLocations[]> {
    const projection = {
      alias: 1,
      country: 1,
      region: 1,
      lat: 1,
      lng: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .find({}, projection)
      .lean()
      .exec() as Promise<CommonLocations[]>;
  }

  // TODO: fix type for query
  // tslint:disable:no-any
  @queryRetry()
  async getMatrixLocations(query: { $or?: any }, langUse: string): Promise<CommonLocations[]> {
    const projection = {
      alias: 1,
      country: 1,
      region: 1,
      lat: 1,
      lng: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .find(query, projection)
      .lean()
      .exec() as Promise<CommonLocations[]>;
  }
  // tslint:enable:no-any

  @queryRetry()
  async getCountryByIdForHomeMedia(countryId: string, langUse: string): Promise<CountryForHomeMediaViewBlock> {
    const projection = {
      _id: 0,
      alias: 1,
      country: 1,
      region: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .findOne({ _id: countryId }, projection)
      .lean()
      .exec() as Promise<CountryForHomeMediaViewBlock>;
  }

  @queryRetry()
  async getCountriesByRegion(region: string): Promise<Regions[]> {
    return this.locations
      .find({ region }, { _id: 1, country: 1 })
      .lean()
      .exec() as Promise<Regions[]>;
  }

  @queryRetry()
  async getLocations(): Promise<HashLocation[]> {
    return this.locations
      .find({}, { country: 1, alias: 1 })
      .lean()
      .exec() as Promise<HashLocation[]>;
  }

  @queryRetry()
  async getEmbedLocations(langUse: string): Promise<CommonLocations[]> {
    const locationProjection = {
      alias: 1,
      country: 1,
      region: 1,
      lat: 1,
      lng: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .find({}, locationProjection)
      .lean()
      .exec() as Promise<CommonLocations[]>;
  }

  @queryRetry()
  async getPhotographerLocations(langUse: string): Promise<CountryAliasLocations[]> {
    const projection = {
      country: 1,
      alias: 1,
      region: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .find({}, projection)
      .lean()
      .exec() as Promise<CountryAliasLocations[]>;
  }

  @queryRetry()
  async getPhotographersLocations(langUse: string): Promise<CountryAliasLocations[]> {
    const projection = {
      alias: 1,
      country: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .find({}, projection)
      .lean()
      .exec() as Promise<CountryAliasLocations[]>;
  }

  @queryRetry()
  async getHashCountries(langUse: string): Promise<TeamLocations[]> {
    return this.locations
      .find(
        {},
        {
          country: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<TeamLocations[]>;
  }

  @queryRetry()
  async getCountryByCountryId(countryId: string, langUse: string): Promise<MatrixBlockLocations> {
    const query = { _id: countryId };
    const projection = {
      alias: 1,
      country: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.locations
      .findOne(query, projection)
      .lean()
      .exec() as Promise<MatrixBlockLocations>;
  }
}

export const locationRepositoryService = new LocationRepositoryService();
