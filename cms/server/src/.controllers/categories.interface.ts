import * as mongoose from 'mongoose';

export interface CategoryEntity {
  _id: mongoose.Types.ObjectId;
  placesType?: string[];
}

export interface CategoryQuery {
  list?: string;
  $or?: { [key: string]: { [key: string]: string | number } }[];
}
