import * as mongoose from 'mongoose';
import * as async from 'async';

const Languages = mongoose.model('Languages');

exports.up = function(next) {
  Languages.find({}).exec((err, data) => {
    if (err) {
      console.error(err);

      return next(err);
    }

    const enLang = data.find((el) => el.code === 'en');

    if (enLang) {
      const el = data.splice(data.indexOf(enLang), 1);
      data.unshift(el[0]);
    }

    async.eachOf(
      data,
      (language, index, cb) => {
        const code = language.code;

        Languages.update({ code }, { $set: { position: index } }).exec(cb);
      },
      next
    );
  });
};

exports.down = function(next) {
  next();
};
