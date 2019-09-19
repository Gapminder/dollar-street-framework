// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} InterfaceTranslations
 @property {{lang: String, interface: {}}[]} translations - translations fields
 */
const interfaceTranslationsSchema = new Schema({
  translations: []
});

mongoose.model('InterfaceTranslations', interfaceTranslationsSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('InterfaceTranslations');
