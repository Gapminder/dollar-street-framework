import * as mongoose from 'mongoose';
import { Info } from '../interfaces/info';
import { queryRetry } from './query-retry.decorator';

class InfoRepositoryService {
  private readonly info: mongoose.Model<Info>;

  constructor() {
    this.info = mongoose.model('Info');
  }

  @queryRetry()
  async getInfoTranslations(): Promise<Info> {
    return this.info
      .findOne()
      .lean()
      .exec() as Promise<Info>;
  }
}

export const infoRepositoryService = new InfoRepositoryService();
