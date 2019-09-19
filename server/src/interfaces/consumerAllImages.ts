import { Document } from 'mongoose';

export interface ConsumerAllImages extends Document {
  all: boolean;
}
