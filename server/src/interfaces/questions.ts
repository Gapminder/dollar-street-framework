import { Document } from 'mongoose';
import { Forms } from './forms';

export interface Questions extends Document {
  id: string;
  forms: {
    _id: string | Forms;
    hidden: boolean;
    position: number;
  }[];
  type: string;
  list: {
    name: string;
  }[];
  listSelect: string;
  name: string;
  description: string;
  translations: {
    lang: string;
    name: string;
    description: string;
  }[];
}
