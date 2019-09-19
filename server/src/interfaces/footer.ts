import { Document } from 'mongoose';

export interface Footer extends Document {
  text: string;
  translations: [
    {
      lang: string;
      text: string;
    }
  ];
}
