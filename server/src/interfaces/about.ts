import { Document } from 'mongoose';

export interface About extends Document {
  position: number;
  name: string;
  description: string;
  translations: {
    lang: string;
    name: string;
    description: string;
  }[];
}
