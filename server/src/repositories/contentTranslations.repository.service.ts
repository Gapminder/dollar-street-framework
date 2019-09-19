import * as mongoose from 'mongoose';
import { ContentTranslations } from '../interfaces/contentTranslations';
import { queryRetry } from './query-retry.decorator';

class ContentTranslationsRepositoryService {
  private readonly contentTranslations: mongoose.Model<ContentTranslations>;

  constructor() {
    this.contentTranslations = mongoose.model('ContentTranslations');
  }

  @queryRetry()
  async getContentTranslations(): Promise<ContentTranslations> {
    return this.contentTranslations
      .findOne()
      .lean()
      .exec() as Promise<ContentTranslations>;
  }
}

export const contentTranslationsRepositoryService = new ContentTranslationsRepositoryService();
