import { Translation } from './articleData';
import * as mongoose from 'mongoose';

export interface Onboarding extends mongoose.Document {
  name: string;
  header: string;
  description: string;
  translations: Translation[];
}

export interface TranslatedOnboarding {
  _id: mongoose.Types.ObjectId;
  name: string;
  header: string;
  description: string;
}
