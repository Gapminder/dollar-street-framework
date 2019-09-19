import * as mongoose from 'mongoose';
import { Translation } from './articleData';
import { ThingByPlural } from './things';
import { EmbedCountry, Locations } from './locations';

export interface PlaceEntity extends mongoose.Document {
  author: string;
  list: string;
  rating: number;
  date: Date;
  incomeQuality: number;
  type: string;
  isTrash: boolean;
  isPublic: boolean;
  income: number;
  country: string | Locations;
  name: string;
  description: string;
  familyInfo: string;
  family: string;
  familyInfoSummary: string;
  familyName: string;
  familyThingId: mongoose.Types.ObjectId;
  aboutData: string;
  commonAboutData: string;
  thing: string | ThingByPlural;
  translations: {
    lang: string;
    name: string;
    description: string;
    familyInfo: string;
    familyInfoSummary: string;
    aboutData: string;
  }[];
  locationId: string;
  region: string;
  lat: number;
  lng: number;
  familyImg: string;
  countryOriginName: string;
  photographer: string;
  userId: string;
  avatar: string;
  imagesCount: number;
  imageId: mongoose.Types.ObjectId;
  image: string;
  placeId: string;
  translated: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PlacesForMatrixBlock extends mongoose.Document {
  country: string;
  income: number;
  familyInfoSummary: string;
  author: string;
  translated?: boolean;
  translations?: Translation[];
}

export interface PlacesDataForMatrixBlock {
  familyName: string;
  familyInfo: string;
  author: string;
  country: string;
  translated: boolean;
}

export interface PlacesByPhotografers {
  _id: mongoose.Types.ObjectId | string;
  author: string;
  country: string;
}

export interface PlacesByCountry {
  _id: mongoose.Types.ObjectId;
  income: number;
  family: string;
}

export interface PlacesByCountryId {
  _id: mongoose.Types.ObjectId;
  income: number;
}

export interface ProjectedEmbedPlace {
  background: string;
  showBackground: string;
  country: string;
  image: string;
  income: number;
  incomeQuality: number;
  region: string;
  lat: number;
  lng: number;
  _id: string;
}

export interface EmbedPlace {
  _id: string | mongoose.Types.ObjectId;
  list: string;
  isPublic: boolean;
  isTrash: boolean;
  country: string | EmbedCountry;
  background: string;
  image: string;
  income: number;
  lat: number;
  lng: number;
  createdAt: number | Date;
  updatedAt: number | Date;
}

export interface PlacesQuery {
  _id?: mongoose.Types.ObjectId;
  type: mongoose.Types.ObjectId;
  list: string;
  isTrash: boolean;
  country?: object;
  income?: object;
}

export interface PlaceForMatrix extends mongoose.Document {
  country: string;
  income: number;
  incomeQuality: number;
  date: Date;
  image?: string;
  region?: string;
  lat?: number;
  lng?: number;
  background?: string;
  showIncome?: number;
}

export interface PlaceTypeTranslation {
  lang: string;
  name: string;
}

export interface PlaceTypeEntity extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  translations: PlaceTypeTranslation[];
}

export interface PlaceTypeQuery {
  name?: { [key: string]: object | boolean | string | number };
}
