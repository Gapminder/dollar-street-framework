import * as mongoose from 'mongoose';

export interface RelatedEntitiesAmount {
  imagesCount: number;
  placesCount: number;
}

export interface UserEntity {
  _id: mongoose.Types.ObjectId;
  salt: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
}
