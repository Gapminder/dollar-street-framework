// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Street
 @property {Boolean} showDivider - trigger of showing/not showing dividers
 @property {Number} low - data for lowest income to the street
 @property {Number} medium - data for medium income to the street
 @property {Number} high - data for highest income to the street
 @property {Number} poor - data for poorest income to the street
 @property {Number} rich - data for richest income to the street
 @property {Number} lowDividerCoord  - first number for street multiply
 @property {Number} mediumDividerCoord  - second number for street multiply
 @property {Number} highDividerCoord  - third number for street multiply
 @property {Array} dividers - array of points for dividers on the street
 */
const streetSettingsSchema = new Schema({
  low: Number,
  medium: Number,
  high: Number,
  poor: Number,
  rich: Number,
  showDividers: Boolean,
  showCurrency: Boolean,
  showLabels: Boolean,
  lowDividerCoord: Number,
  mediumDividerCoord: Number,
  highDividerCoord: Number,
  firstLabelName: String,
  secondLabelName: String,
  thirdLabelName: String,
  fourthLabelName: String,
  dividers: Array
});

streetSettingsSchema.index({
  low: 1,
  medium: 1,
  high: 1,
  poor: 1,
  rich: 1,
  showDividers: false,
  showCurrency: false,
  showLabels: false,
  lowDividerCoord: 1,
  mediumDividerCoord: 1,
  highDividerCoord: 1,
  firstLabelName: '',
  secondLabelName: '',
  thirdLabelName: '',
  fourthLabelName: '',
  dividers: []
});

mongoose.model('StreetSettings', streetSettingsSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('StreetSettings');
