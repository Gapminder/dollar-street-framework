// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

import { addCurrentPlugin } from './plugins/add-current-id.plugin';
import * as mongoose from 'mongoose';
import { EmbedDTO } from '../interfaces/embed';

const Schema = mongoose.Schema;

const embedSchema = new Schema(
  {
    // places: [{ type: Schema.Types.ObjectId, ref: 'Places' }],
    thing: { type: Schema.Types.ObjectId, ref: 'Things' },
    medias: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    env: String,
    lang: String,
    currentId: { type: Schema.Types.ObjectId, ref: 'Embed' },
    version: { default: 'v1', type: String },
    resolution: String,

    imageSize: {
      width: Number,
      height: Number
    }
  },
  {
    timestamps: true
  }
);

embedSchema.plugin(addCurrentPlugin);

embedSchema.index({ version: 1, env: 1, lang: 1, thing: 1, medias: 1 });

mongoose.model<EmbedDTO>('Embed', embedSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Embed');
