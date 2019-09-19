import * as mongoose from 'mongoose';

export interface ArticlesToExport {
  directory: string;
  titles: string[];
}

export interface LanguageEntity {
  code: string;
  name: string;
  position: number;
}

export interface TranslationsToExport {
  articles: ArticlesToExport;

  [key: string]: { directory: string };
}

export interface TranslatedEntity {
  _id: mongoose.Types.ObjectId;
  lang: string;
  description: string;
  shortDescription: string;
}

export interface UpdateTranslationQuery {
  $set?: { translations: object[] } | {};
  $push?: { translations: object };
}
