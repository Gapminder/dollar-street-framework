import * as mongoose from 'mongoose';
import { Dictionary } from 'lodash';
import { ThingEntity } from '../things/things.interface';
import { PlaceEntity } from '../../../../server/src/interfaces/places';

export interface AdminsBaseQuery {
  [key: string]: object | boolean | string | number;
  $or?: { [key: string]: object | boolean | string | number }[];
}

export interface AdminsQuery extends AdminsBaseQuery {
  place: mongoose.Types.ObjectId;
  isTrash?: boolean;
  isApproved?: boolean;
}

export interface AdminsSortQuery extends AdminsBaseQuery {
  name?: string;
  blacklisted?: number;
  list?: number;
  images?: number;
  thinged?: number;
  questions?: number;
}

export interface AdminsPlacesQuery extends AdminsBaseQuery {
  isTrash: boolean;
  list?: number;
  type?: mongoose.Types.ObjectId;
  name?: { [key: string]: object | boolean | string | number };
}

export interface AdminsPlacesAndThingsMedia {
  readyPlace: Dictionary<PlaceEntity[]>;
  readyThing: Dictionary<ThingEntity[]>;

  [key: string]: Dictionary<object>;
}

export interface AdminsPlacesAndCountriesMedia {
  placesCount: Dictionary<PlaceEntity[]>;
  countriesCount: ArrayLike<CountryEntity[]>;
}

export interface CountryEntity {
  _id: mongoose.Types.ObjectId;
}
