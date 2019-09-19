// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

const exchangeSchema = new Schema({
  currency: String,
  code: String,
  value: Number,
  symbol: String,
  updated: Date,
  translations: [
    {
      lang: String,
      CURRENCY_TEXT: String,
      COUNTRY_CODE: String,
      COUNTRY_NAME: String
    }
  ]
});

mongoose.model('Exchange', exchangeSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Exchange');
