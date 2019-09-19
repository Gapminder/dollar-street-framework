import { Questions } from './questions';
import * as mongoose from 'mongoose';
import { Translation } from './translation';

export interface InfoPlaces extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  place: mongoose.Types.ObjectId;
  question: string | Questions;
  form: mongoose.Types.ObjectId;
  answer: string;
  translations?: Translation[];
}

export interface MatrixBlockInfoPlaces {
  _id: mongoose.Types.ObjectId;
  form: mongoose.Types.ObjectId;
  answer: string;
  translations?: Translation[];
}

export interface MatrixBlockInfoPlace {
  form: mongoose.Types.ObjectId;
  answer: string;
}

export interface FamilyName {
  answer: string;
  form: mongoose.Types.ObjectId;
  place?: mongoose.Types.ObjectId;
  translations?: Translation[];
}
