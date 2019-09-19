import { Document } from 'mongoose';

export interface ConsumerThumbnails extends Document {
  all: boolean;
}
