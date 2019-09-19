import { Categories } from './categories';
import * as mongoose from 'mongoose';
import { Translation } from './articleData';

export interface EmbedThing {
  _id: string | mongoose.Types.ObjectId;
  list: string;
  isPublic: boolean;
  hidden: string;
  thingName: string;
  originThingName: string;
  plural: string;
  empty: boolean;
}

export interface Things extends mongoose.Document, EmbedThing {
  _id: string | mongoose.Types.ObjectId;
  thingCategory: string | mongoose.Types.ObjectId | Categories;
  relatedThings: mongoose.Types.ObjectId[];
  rating: {
    type: number;
    default: number;
  };
  list: string;
  isPublic: boolean;
  hidden: string;
  icon: string;
  synonymous: { text: string }[];
  thingName: string;
  originThingName: string;
  tags: { text: string }[];
  plural: string;
  originPlural: string;
  thingDescription: string;
  shortDescription: string;
  isShowReadMore: boolean;
  translations: Translation[];
  empty: boolean;
  iconDark: string;
  iconLight: string;
}

export interface ThingByPlural extends mongoose.Document {
  plural: string;
  thingName: string;
  originPlural?: string;
  originThingName?: string;
  translations: Translation[];
}

export interface CategoriesForThings extends mongoose.Document {
  synonymous: { text: string }[];
  thingName: string;
  relatedThings: mongoose.Types.ObjectId[];
  plural: string;
  originPlural: string;
  icon: string;
  translations: Translation[];
  iconDark: string;
  iconLight: string;
  shortDescription: string;
  isShowReadMore: boolean;
  empty: boolean;
}

export interface CategoriesForThingsFilter {
  _id: mongoose.Types.ObjectId;
  synonymous: { text: string }[];
  thingName: string;
  relatedThings: mongoose.Types.ObjectId[];
  plural: string;
  originPlural: string;
  icon: string;
}

export interface ThingsWithIcon {
  _id: mongoose.Types.ObjectId;
  synonymous: { text: string }[];
  thingName: string;
  relatedThings: mongoose.Types.ObjectId[];
  plural: string;
  originPlural: string;
  icon: string;
  empty: boolean;
}

export interface ThingsForHomeMedia extends mongoose.Document {
  thingName: string;
  plural: string;
  icon: string;
  thingCategory: {
    _id: mongoose.Types.ObjectId;
    name: string;
  }[];
  translations: Translation[];
}

export interface ThingForHomeMediaViewBlock extends mongoose.Document {
  thingName: string;
  plural: string;
  icon: string;
  originPlural: string;
  originThingName: string;
  translations: Translation[];
}

export interface ThingValue {
  thingName: string;
  plural: string;
  thingCategory?: string;
  thingIcon?: string;
}

export interface HomeMediaThing {
  _id: mongoose.Types.ObjectId;
  icon: string;
  plural: string;
  thingCategory: {
    _id: mongoose.Types.ObjectId;
    name: string;
  }[];
  thingName: string;
}
