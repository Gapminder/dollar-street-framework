import * as mongoose from 'mongoose';
import { InterfaceTranslations } from '../interfaces/interfaceTranslations';
import { queryRetry } from './query-retry.decorator';

class InterfaceTranslationsService {
  private readonly translations: mongoose.Model<InterfaceTranslations>;

  constructor() {
    this.translations = mongoose.model('InterfaceTranslations');
  }

  @queryRetry()
  async getInterfaceTranslations(): Promise<InterfaceTranslations> {
    return this.translations
      .findOne()
      .lean()
      .exec() as Promise<InterfaceTranslations>;
  }
}

export const interfaceTranslationsService = new InterfaceTranslationsService();
