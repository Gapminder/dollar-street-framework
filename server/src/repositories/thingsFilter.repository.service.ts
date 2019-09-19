import * as mongoose from 'mongoose';
import { ThingsFilter } from '../interfaces/thingsFilter';
import { queryRetry } from './query-retry.decorator';

class ThingsFilterRepositoryService {
  private readonly thingsFilter: mongoose.Model<ThingsFilter>;

  constructor() {
    this.thingsFilter = mongoose.model('ThingsFilter');
  }

  @queryRetry()
  async getAllTopicsAndPopular(): Promise<ThingsFilter> {
    return this.thingsFilter
      .findOne(
        {
          allTopics: { $not: { $size: 0 } }
        },
        {
          allTopics: 1,
          popularThings: 1
        }
      )
      .lean()
      .exec() as Promise<ThingsFilter>;
  }
}

export const thingsFilterRepositoryService = new ThingsFilterRepositoryService();
