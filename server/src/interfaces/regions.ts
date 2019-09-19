import { Document, Types } from 'mongoose';
import { CountriesForFilters } from './locations';
import { Translation } from './articleData';

export interface Regions extends Document {
  name: string;
  originRegionName: string;
  countries: string[];
  empty: boolean;
  translations: {
    lang: string;
    name: string;
  }[];
}

export interface HashRegions {
  _id: Types.ObjectId;
  name: string;
  originRegionName?: string;
  translations?: Translation[];
}

export interface RegionsForFilters {
  region: string;
  originRegionName: string;
  countries: CountriesForFilters[];
  empty?: boolean;
}
