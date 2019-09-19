// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc
import * as mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 @typedef {Object} Media
 @property {String} filename - name of media
 @property {String} originFile - origin name of media
 @property {String} amazonfilename - file name in amazon in format bcrypt
 @property {String} src - path of media
 @property {Number} rotate - how many degrees rotated media
 @property {String} size - size file of media
 @property {{_id: String, rating: Number, tags: [], hidden: String}}[] things
 @property {String} place - place id of media
 @property {Boolean} isTrash - isTrash of media(true or false)
 @property {Boolean} isHouse - isHouse of media(true or false)
 @property {Boolean} isPortrait - isPortrait of media(true or false)
 @property {Boolean} isApproved - is approved the media
 @property {Boolean} isIcon - isIcon of media(true or false)
 @property {String} show - show of media(show or hide)
 @property {String} type - type image or video
 */
const imagesSchema = new Schema(
  {
    filename: String,
    originFile: String,
    amazonfilename: String,
    src: String,
    rotate: Number,
    size: String,
    things: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'Things' },
        rating: Number,
        tags: [{ text: String }],

        /** hidden: hidden of thing (show or hide) */
        /** todo: rename hidden on isHidden and replace String for Boolean */
        hidden: String
      }
    ],
    place: { type: Schema.Types.ObjectId, ref: 'Places' },
    isTrash: Boolean,
    isHouse: Boolean,
    isPortrait: Boolean,
    isApproved: Boolean,
    isIcon: Boolean,
    show: String,
    type: { type: String, enum: ['image', 'video'] }
  },
  {
    timestamps: true
  }
);

imagesSchema.index({ place: 1, isApproved: 1, isTrash: 1, 'things.isHidden': 1, 'things._id': 1 });
imagesSchema.index({ place: 1, isApproved: 1, isTrash: 1, 'things.hidden': 1, 'things._id': 1 });

mongoose.model('Media', imagesSchema);
// tslint:disable-next-line:no-default-export
export default mongoose.model('Media');
