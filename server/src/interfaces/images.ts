import * as mongoose from 'mongoose';

export interface Images {
  _id: mongoose.Types.ObjectId;
  place?: string;
  src?: string;
  amazonfilename?: string;
  thing: string;
  url: string;
  isPortrait?: boolean;
  thingName?: string;
  thingCategory?: string;
  thingIcon?: string;
  plural?: string;
  background?: string;
}

export interface HomeMediaImage {
  _id: mongoose.Types.ObjectId;
  background: string;
  plural: string;
  thing: string;
  thingCategory: string;
  thingName: string;
}

export interface ImagesForMap extends mongoose.Document {
  _id: string;
  family: {
    imageId: string;
    background: string;
    thing: string;
  };
}
