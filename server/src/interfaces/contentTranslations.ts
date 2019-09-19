import { Document } from 'mongoose';

export interface ContentTranslations extends Document {
  label: string;
  name: string;
  key: string;
  value: string;
  translations: [
    {
      lang: string;
      value: string;
    }
  ];
}
