import * as mongoose from 'mongoose';
import { Footer } from '../interfaces/footer';
import { queryRetry } from './query-retry.decorator';

class FooterRepositoryService {
  private readonly footer: mongoose.Model<Footer>;

  constructor() {
    this.footer = mongoose.model('Footer');
  }

  @queryRetry()
  async getFooter(langUse: string): Promise<Footer> {
    const projection = {
      _id: 0,
      text: 1,
      translations: { $elemMatch: { lang: langUse } }
    };

    return this.footer
      .findOne({}, projection)
      .lean()
      .exec() as Promise<Footer>;
  }
}

export const footerRepositoryService = new FooterRepositoryService();
