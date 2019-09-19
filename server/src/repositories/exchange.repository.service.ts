import * as mongoose from 'mongoose';
import { Exchange, ExchangeUpdate } from '../interfaces/exchange';
import { queryRetry } from './query-retry.decorator';

class ExchangeRepositoryService {
  private readonly exchange: mongoose.Model<Exchange>;

  constructor() {
    this.exchange = mongoose.model('Exchange');
  }

  @queryRetry()
  async getExchanges(): Promise<Exchange[]> {
    return this.exchange
      .find()
      .lean()
      .exec() as Promise<Exchange[]>;
  }

  @queryRetry()
  async updateExchange(key: string, data: ExchangeUpdate): Promise<void> {
    return this.exchange.update({ code: key }, { $set: data }).exec();
  }
}

export const exchangeRepositoryService = new ExchangeRepositoryService();
