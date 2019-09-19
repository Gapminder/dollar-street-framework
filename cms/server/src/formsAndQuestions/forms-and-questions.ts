import * as mongoose from 'mongoose';

export interface FormEntity {
  _id: mongoose.Types.ObjectId;
  hidden: boolean;
  position: number;
}

export interface QuestionEntity {
  _id: mongoose.Types.ObjectId;
  forms: FormEntity[];
}

export interface FormsQuery {
  name?: { [key: string]: object | boolean | string | number };
}

export interface QuestionBaseQuery {
  [key: string]: object | boolean | string | number;
  $or?: { [key: string]: object | boolean | string | number }[];
}

export interface QuestionQuery extends QuestionBaseQuery {
  name?: { [key: string]: object | boolean | string | number };
}
