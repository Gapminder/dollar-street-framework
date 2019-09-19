// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * @typedef {Object} ConsumerThumbnails
 * @property {Boolean} all - show all things on consumer from one place
 */
const consumerThumbnails = new Schema({ all: Boolean });

mongoose.model('ConsumerThumbnails', consumerThumbnails);
// tslint:disable-next-line:no-default-export
export default mongoose.model('ConsumerThumbnails');
