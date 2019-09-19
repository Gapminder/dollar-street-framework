import { Document } from 'mongoose';

export interface CountriesAlias extends Document {
  region: string;
  country: string;
  alias: string;
  translations: {
    lang: string;
    country: string;
    alias: string;
    description: string;
  }[];
}
