import * as mongoose from 'mongoose';

export interface ThingQuery {
  list?: number;
  $or?: { [key: string]: object | string | number | { [key: string]: object | string | number } }[];
}

export interface ThingEntity extends mongoose.Document {
  placesTypeId: string[];
  placesType: string[];
  thingCategory: string[];
}
