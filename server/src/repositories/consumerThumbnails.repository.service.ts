import * as mongoose from 'mongoose';
import { ConsumerThumbnails } from '../interfaces/consumerThumbnails';
import { queryRetry } from './query-retry.decorator';

class ConsumerThumbnailsRepositoryService {
  private readonly consumerThumbnails: mongoose.Model<ConsumerThumbnails>;

  constructor() {
    this.consumerThumbnails = mongoose.model('ConsumerThumbnails');
  }

  @queryRetry()
  async getConsumerThumbnailsStatus(): Promise<ConsumerThumbnails> {
    return this.consumerThumbnails
      .findOne({})
      .lean()
      .exec() as Promise<ConsumerThumbnails>;
  }
}

export const consumerThumbnailsRepositoryService = new ConsumerThumbnailsRepositoryService();
