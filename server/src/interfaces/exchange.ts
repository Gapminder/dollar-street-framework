import { Document } from 'mongoose';

export interface Exchange extends Document {
  currency: string;
  code: string;
  value: number;
  symbol: string;
  updated: Date;
  translations: [
    {
      lang: string;
      CURRENCY_TEXT: string;
      COUNTRY_CODE: string;
      COUNTRY_NAME: string;
    }
  ];
}

export interface ExchangeUpdate {
  value: number;
  updated: Date;
}
