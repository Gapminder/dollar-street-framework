// tslint:disable:jsdoc-format
// tslint:disable:no-redundant-jsdoc

export function addCurrentPlugin(schema) {
  // schema.add({ currentId: mongoose.Types.ObjectId });

  schema.pre('save', function(next) {
    // tslint:disable-next-line:no-invalid-this
    this.currentId = this._doc._id;

    return next();
  });

  schema.pre('update', function(next) {
    // tslint:disable-next-line:no-invalid-this
    this.currentId = this._doc._id;

    return next();
  });
}
