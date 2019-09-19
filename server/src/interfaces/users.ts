import { Locations } from './locations';
import { UserTypeEntity } from './usersTypes';
import { Translation } from './articleData';
import * as mongoose from 'mongoose';

export interface HomeMediaPhotographer {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
}

export interface MatrixBlockPhotographer {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  translations: Translation[];
}

export interface Users extends mongoose.Document {
  email: string;
  password: string;
  salt: string;
  username: string;
  avatar: string;
  country: Locations;
  google: string;
  facebook: string;
  twitter: string;
  linkedIn: string;
  role: string;
  type: string | UserTypeEntity;
  firstName: string;
  lastName: string;
  description: string;
  priority: number;
  imagesCount: number;
  placesCount: number;
  company: {
    name: string;
    link: string;
    description: string;
  };
  translations: Translation[];
  photographer: string;
}

export interface UsersForPhotographers extends mongoose.Document {
  avatar: string;
  firstName: string;
  lastName: string;
  photographer: string;
  translations: Translation[];
}

export interface Photographer {
  name: string;
  userId: string;
  avatar: string;
  imagesCount: number;
  places: number;
  images: string[];
}

export interface HashPhotographer {
  country: string;
  photographer: string;
  avatar: string;
  imagesCount: number;
  userId: string;
}
