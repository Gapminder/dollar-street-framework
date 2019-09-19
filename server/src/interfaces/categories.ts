import { Document } from 'mongoose';

export interface Categories extends Document {
  list: string;
  rating: {
    type: number;
  };
  name: string;
  description: string;
  translations: [
    {
      lang: string;
      name: string;
      description: string;
    }
  ];
}
