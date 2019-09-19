import * as mongoose from 'mongoose';
import { CommonHashLocations } from './locations';

export interface CountriesPlacesImageCount {
  [key: string]: number;
}

export interface CommonHashInterface {
  [key: string]: string;
}

export interface CountriesPlacesImages {
  [key: string]: {
    _id: mongoose.Types.ObjectId;
    url: string;
    thing: string;
  };
}

export interface HomeHeaderCountriesById {
  [key: string]: {
    _id: mongoose.Types.ObjectId;
    alias: string;
    region: string;
    lat: number;
    lng: number;
    originName: string;
  };
}

export interface CommonHashRegions {
  [key: string]: CommonHashLocations;
}

export interface EmbedMedia {
  [key: string]: { image: string; background: string };
}
