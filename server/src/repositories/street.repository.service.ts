import * as mongoose from 'mongoose';
import { Street } from '../interfaces/street';
import { queryRetry } from './query-retry.decorator';

class StreetRepositoryService {
  private readonly street: mongoose.Model<Street>;

  constructor() {
    this.street = mongoose.model('StreetSettings');
  }

  @queryRetry()
  async getStreet(): Promise<Street> {
    return this.street
      .findOne()
      .lean()
      .exec() as Promise<Street>;
  }
}

export const streetRepositoryService = new StreetRepositoryService();
