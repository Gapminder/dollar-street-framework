import { Document } from 'mongoose';
import { Translation } from './articleData';

export interface UserTypeEntity extends Document {
  position: number;
  isPublic: boolean;
  name: string;
  translations: Translation[];
  originTypeName: string;
}
