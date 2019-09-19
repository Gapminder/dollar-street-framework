import { Document } from 'mongoose';

export interface Languages extends Document {
  isPublic: boolean;
  alias: string;
  code: string;
  name: string;
  position: number;
  translations: [
    {
      lang: string;
      name: string;
    }
  ];
}
