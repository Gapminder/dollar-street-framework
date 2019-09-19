import * as mongoose from 'mongoose';
import { Languages } from '../interfaces/languages';
import { queryRetry } from './query-retry.decorator';

class LanguagesRepositoryService {
  private readonly language: mongoose.Model<Languages>;

  constructor() {
    this.language = mongoose.model('Languages');
  }

  @queryRetry()
  async getLanguagesList(): Promise<Languages[]> {
    return this.language
      .find({ isPublic: true }, { alias: 1, code: 1, name: 1 })
      .sort({ position: 1 })
      .lean()
      .exec() as Promise<Languages[]>;
  }
}

export const languagesRepositoryService = new LanguagesRepositoryService();
