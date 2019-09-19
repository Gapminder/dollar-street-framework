import { Document, DocumentToObjectOptions, MongooseDocument, Types } from 'mongoose';
import { EmbedMedia } from './media';
import { EmbedThing } from './things';

export interface EmbedPreview {
  imageUrl: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

export interface EmbedQuery {
  _id?: Types.ObjectId;
  thing: string | Types.ObjectId | EmbedThing;
  medias: (string | Types.ObjectId | EmbedMedia)[];
  version: string;
  env: string;
  lang: string;
  resolution: string;
  currentId?: Types.ObjectId;
  imageSize?: {
    width: number;
    height: number;
  };
}

export interface Embed {
  _id?: Types.ObjectId;
  thing: string | Types.ObjectId | EmbedThing;
  medias: (string | Types.ObjectId | EmbedMedia)[];
  version: string;
  env: string;
  lang: string;
  resolution: string;
  currentId?: Types.ObjectId;
  imageSize?: {
    width: number;
    height: number;
  };
  createdAt: number | Date;
  updatedAt: number | Date;
  // tslint:disable-next-line:no-any
  toObject(options?: DocumentToObjectOptions): any;
}

export interface EmbedDTO extends MongooseDocument, Document, Embed {
  _id: Types.ObjectId;
  thing: string;
  medias: EmbedMedia[];
  version: string;
  env: string;
  lang: string;
  resolution: string;
  currentId?: Types.ObjectId;
  imageSize?: {
    width: number;
    height: number;
  };
  createdAt: number | Date;
  updatedAt: number | Date;
}
