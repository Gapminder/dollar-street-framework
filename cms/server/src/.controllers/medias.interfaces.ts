import * as mongoose from 'mongoose';
import { UploadsSize } from '../uploads/uploads.interface';

export interface MediaObject {
  filename: string;
  originFile: string;
  amazonfilename: string;
  src: string;
  rotate: number;
  size: UploadsSize;
  place: mongoose.Types.ObjectId;
  isTrash: boolean;
  isPortrait: boolean;
  isApproved: boolean;
  isHouse: boolean;
  type: string;
  show: boolean;
  things: {
    _id: mongoose.Types.ObjectId;
    rating: number;
    tags: { text: string }[];
    hidden: string;
  }[];
}

export interface MediaEntity extends mongoose.Document, MediaObject {}

export interface MediaThing {
  _id: mongoose.Types.ObjectId;
  thing: mongoose.Types.ObjectId;
}

export interface CustomBaseMedia {
  _id?: mongoose.Types.ObjectId;
  image?: mongoose.Types.ObjectId;
  type: string;
}

export interface PortraitMedia extends CustomBaseMedia {
  isPortrait: boolean;
}

export interface HouseMedia extends CustomBaseMedia {
  isHouse: boolean;
}

export interface PlaceIconMedia extends CustomBaseMedia {
  isIcon: boolean;
}
