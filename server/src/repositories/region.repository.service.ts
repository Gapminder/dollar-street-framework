import * as mongoose from 'mongoose';
import { HashRegions, Regions } from '../interfaces/regions';
import { queryRetry } from './query-retry.decorator';

class RegionsRepositoryService {
  private readonly regions: mongoose.Model<Regions>;

  constructor() {
    this.regions = mongoose.model('Regions');
  }

  @queryRetry()
  async getHashRegions(langUse: string): Promise<HashRegions[]> {
    return this.regions
      .find({}, { name: 1, translations: { $elemMatch: { lang: langUse } } })
      .lean()
      .exec() as Promise<HashRegions[]>;
  }

  @queryRetry()
  async getRegions(): Promise<Regions[]> {
    return this.regions
      .find()
      .lean()
      .exec() as Promise<Regions[]>;
  }

  @queryRetry()
  async getHashRegionsByIdForCountryInfo(): Promise<Regions[]> {
    return this.regions
      .find()
      .lean()
      .exec() as Promise<Regions[]>;
  }

  @queryRetry()
  async getHashRegionsForMap(): Promise<Regions[]> {
    return this.regions
      .find()
      .lean()
      .exec() as Promise<Regions[]>;
  }
}

export const regionsRepositoryService = new RegionsRepositoryService();
