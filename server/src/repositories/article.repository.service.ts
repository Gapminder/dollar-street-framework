import * as mongoose from 'mongoose';
import { Articles } from '../interfaces/articles';
import { ArticleData } from '../interfaces/articleData';
import { queryRetry } from './query-retry.decorator';

class ArticleRepositoryService {
  readonly articles: mongoose.Model<Articles>;

  constructor() {
    this.articles = mongoose.model('Articles');
  }

  @queryRetry()
  async getArticleData(thingId, langUse): Promise<ArticleData> {
    return this.articles
      .findOne(
        {
          thing: thingId
        },
        {
          shortDescription: 1,
          description: 1,
          translations: { $elemMatch: { lang: langUse } }
        }
      )
      .lean()
      .exec() as Promise<ArticleData>;
  }
}

export const articleRepositoryService = new ArticleRepositoryService();
