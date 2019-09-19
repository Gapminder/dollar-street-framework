import * as mongoose from 'mongoose';
import { EmbedThing, ThingByPlural, Things } from './things';
import { EmbedPlace, PlaceEntity } from './places';
import { MatrixBlockLocations } from './locations';

export interface MatrixBlockMedia {
  _id: string;
  src: string;
  amazonfilename: string;
  familyImage?: string;
}

export interface MatrixBlockMediaData {
  _id: string;
  url: string;
  thing: string;
}

export interface MatrixBlockResponse {
  familyName: string;
  photographer: { name: string; id: string };
  familyData: string;
  country: MatrixBlockLocations;
  houseImage: HouseFamilyImage;
  activeThing: ThingByPlural;
  translated: boolean;
  familyImage?: HouseFamilyImage;
}

export interface HouseFamilyImage {
  _id: string;
  url: string;
  thing: string;
}

export interface GetMediaOptions {
  placesIds: string[];
  thingId: mongoose.Types.ObjectId;
  FAMILY_THING_ID: mongoose.Types.ObjectId;
  HOME_THING_ID: mongoose.Types.ObjectId;
}

export interface PlacesForEmbed {
  _id: mongoose.Types.ObjectId;
  place: mongoose.Types.ObjectId;
}

export interface EmbedMedia {
  _id: string | mongoose.Types.ObjectId;
  filename: string;
  originFile: string;
  amazonfilename: string;
  src: string;
  rotate: number;
  size: string;
  things: {
    _id: string | EmbedThing;
    rating?: number;
    tags?: { text: string }[];
    hidden: string;
    list?: string;
    isPublic?: boolean;
    thingName?: string;
    originThingName?: string;
    plural?: string;
    originPlural?: string;
    empty?: boolean;
  }[];
  place: string | PlaceEntity | EmbedPlace;
  isTrash: boolean;
  isHouse: boolean;
  isPortrait: boolean;
  isApproved: boolean;
  isIcon: boolean;
  show: string;
  type: string;
  image?: string;
  background?: string;
  createdAt: number | Date;
  updatedAt: number | Date;
}

export interface Media extends mongoose.Document, EmbedMedia {
  _id: string | mongoose.Types.ObjectId;
  filename: string;
  originFile: string;
  amazonfilename: string;
  src: string;
  rotate: number;
  size: string;
  things: {
    _id: string | Things;
    rating: number;
    tags: { text: string }[];
    hidden: string;
  }[];
  place: string | PlaceEntity | EmbedPlace;
  isTrash: boolean;
  isHouse: boolean;
  isPortrait: boolean;
  isApproved: boolean;
  isIcon: boolean;
  show: string;
  type: string;
  image?: string;
  background?: string;
  createdAt: number | Date;
  updatedAt: number | Date;
}
