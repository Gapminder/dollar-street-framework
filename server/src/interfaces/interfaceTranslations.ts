import { Document } from 'mongoose';

export interface InterfaceTranslations extends Document {
  translations: {
    lang: string;
  }[];
}
