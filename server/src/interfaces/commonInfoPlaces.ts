import { Document } from 'mongoose';

export interface CommonInfoPlaces extends Document {
  description: string;
  translations: [
    {
      lang: string;
      description: string;
    }
  ];
}
