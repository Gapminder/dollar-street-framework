import { Translation } from './articleData';
import * as mongoose from 'mongoose';
import { Regions } from './regions';

export interface EmbedCountry {
  name: string;
  region: string | Regions;
  lng: number;
  lat: number;
  country: string;
  alias: string;
  empty: boolean;
  createdAt: number | Date;
  updatedAt: number | Date;
}

interface LocationTranslation {
  lang: string;
  country: string;
  alias: string;
  description: string;
}

export interface Locations extends mongoose.Document, EmbedCountry {
  name: string;
  countriesName: string[];
  region: string | Regions;
  code: string;
  lng: number;
  lat: number;
  country: string;
  alias: string;
  description: string;
  originName: string;
  empty: boolean;
  originRegionName: string;
  placeId: string;
  translations: LocationTranslation[];
  createdAt: number | Date;
  updatedAt: number | Date;
}

export interface LocationByCountryId extends mongoose.Document {
  region: string;
  code: string;
  lng: number;
  lat: number;
  country: string;
  alias: string;
  description: string;
  originName: string;
  translations: Translation[];
}

export interface CommonLocations {
  _id?: mongoose.Types.ObjectId;
  alias: string;
  country: string;
  description: string;
  lat?: number;
  lng?: number;
  originName: string;
  region: string;
  translations?: Translation[];
}

export interface CountriesByRegion {
  _id: mongoose.Types.ObjectId;
  alias: string;
  country: string;
  description: string;
  lat: number;
  lng: number;
  originName: string;
  region: string;
  translations?: Translation[];
}

export interface TranslatedCommonLocations {
  _id: mongoose.Types.ObjectId;
  alias: string;
  country: string;
  region: string;
  lng: number;
  lat: number;
  originName: string;
}

export interface CountryForHomeMediaViewBlock extends mongoose.Document {
  alias: string;
  country: string;
  region: string;
  translations: Translation[];
  name: string;
  originName: string;
  countriesName: string[];
  originRegionName: string;
}

export interface HashLocation extends mongoose.Document {
  alias: string;
  country: string;
}

export interface MatrixBlockLocations extends mongoose.Document {
  alias: string;
  country: string;
  translations?: Translation[];
  originName: string;
}

export interface CountryAliasLocations extends mongoose.Document {
  alias: string;
  country: string;
  region?: mongoose.Types.ObjectId;
  originName?: string;
  translations?: Translation[];
}

export interface CommonHashLocations {
  alias: string;
  region: string;
  lat: number;
  lng: number;
}

export interface TranslatedCountryLocations {
  _id: mongoose.Types.ObjectId;
  originName: string;
  country: string;
  alias: string;
  region: mongoose.Types.ObjectId;
}

export interface TeamLocations extends mongoose.Document {
  country: string;
  translations: Translation[];
}

export interface CountriesForFilters {
  empty: boolean;
  region: string;
  originRegionName: string;
  country: string;
  originName: string;
}
