import { MediaObject } from '../.controllers/medias.interfaces';
import * as mongoose from 'mongoose';

export interface UploadsSize {
  width: number;
  height: number;
}

export interface UploadsOptions2 {
  pathOrigin: string;
  pathSave: string;
  size: UploadsSize;
  name: string;
  device: string;
  amazonResizeSave: string;
  type: string;
  thumb?: boolean;
}

export interface UploadsOptions {
  pathOrigin: string;
  size: UploadsSize;
  gmSavePath: string;
  sourcePath: string;
  destinationPath: string;
  gravity;
  type: string;
  thumb?: boolean;
}

export interface NewImageProcessing {
  img;
  place;
  mediaObj: MediaObject & { queue?: string; progress?: number };
}

export interface UserMediaQuery {
  _id?: mongoose.Types.ObjectId;
  author?: mongoose.Types.ObjectId;
}

export interface UpdateUserMediaQuery {
  _id?: mongoose.Types.ObjectId;
}
