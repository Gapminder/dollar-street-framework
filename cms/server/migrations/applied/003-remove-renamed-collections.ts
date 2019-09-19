require('./common');

import * as async from 'async';
import * as mongoose from 'mongoose';

const db = mongoose.connection.db;

exports.up = (next) => {
  async.parallel(
    [renameCollection('aboutdatas', 'commonshortinfoincomes'), renameCollection('placestypes', 'typesplaces')],
    next
  );
};

exports.down = (next) => {
  next();
};

function renameCollection(from, to) {
  return (cb) => {
    db.dropCollection(to, (err) => {
      if (err) {
        console.error(`Drop ${to} collection: `, err);

        return cb(err);
      }

      db.renameCollection(from, to, (error) => {
        if (err) {
          console.error(`Rename collection ${from} to ${to}: `, error);

          return cb(error);
        }

        cb(null);
      });
    });
  };
}
