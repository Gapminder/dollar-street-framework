import { Document } from 'mongoose';

export interface Info extends Document {
  context: string;
  translations: [
    {
      lang: string;
      context: string;
    }
  ];
}
