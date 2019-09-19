import * as mongoose from 'mongoose';

export interface LocationTranslation {
  lang: string;
  country: string;
  alias: string;
  description: string;
}

export interface RegionTranslation {
  lang: string;
  name: string;
}

export interface LocationEntity {
  _id: mongoose.Types.ObjectId;
  region: mongoose.Types.ObjectId;
  code: string;
  lng: number;
  lat: number;
  country: string;
  alias: string;
  description: string;
  translations: LocationTranslation[];
}

export interface RegionEntity {
  _id: mongoose.Types.ObjectId;
  name: string;
  translations: RegionTranslation[];
}

export interface RegionHash {
  [key: string]: string;
}
