import { Document } from 'mongoose';

export interface Forms extends Document {
  name: string;
  description: string;
  translations: {
    lang: string;
    name: string;
    description: string;
  }[];
}
