import * as mongoose from 'mongoose';
import { CommonShortInfoIncomes } from '../interfaces/commonShortInfoIncomes';
import { queryRetry } from './query-retry.decorator';

class CommonShortInfoIncomesRepositoryService {
  private readonly commonShortInfoIncomes: mongoose.Model<CommonShortInfoIncomes>;

  constructor() {
    this.commonShortInfoIncomes = mongoose.model('CommonShortInfoIncome');
  }

  @queryRetry()
  async getAboutData(langUse: string): Promise<CommonShortInfoIncomes> {
    return this.commonShortInfoIncomes
      .findOne({}, { description: 1, translations: { $elemMatch: { lang: langUse } } })
      .lean()
      .exec() as Promise<CommonShortInfoIncomes>;
  }
}

export const shortInfoIncomesRepositoryService = new CommonShortInfoIncomesRepositoryService();
