import { Document } from 'mongoose';

export interface CommonShortInfoIncomes extends Document {
  description: string;
  translations: { _id: string; lang: string; description: string }[];
}
