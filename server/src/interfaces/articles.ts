import mongoose from 'mongoose';

export interface Articles extends mongoose.Document {
  thing: mongoose.Schema.Types.ObjectId;
  shortDescription: string;
  description: string;
  isDescription: boolean;
  translations: {
    lang: string;
    shortDescription: string;
    description: string;
  }[];
  translated: boolean;
}
