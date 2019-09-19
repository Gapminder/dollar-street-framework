import { Document } from 'mongoose';

export interface PlacesType extends Document {
  name: string;
  translations: {
    lang: string;
    name: string;
  }[];
}
