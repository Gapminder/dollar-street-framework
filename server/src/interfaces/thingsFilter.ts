import { Document } from 'mongoose';
import { Things } from './things';

export interface ThingsFilter extends Document {
  popularThings: string[] | Things[];
  allTopics: string[] | Things[];
}
