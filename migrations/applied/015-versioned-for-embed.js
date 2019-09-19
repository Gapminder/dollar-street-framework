// process.env.MODE_ENV='ci';
// process.env.NODE_ENV='ds';

/*
- MODE_ENV=ci NODE_ENV=ds migrate
- MODE_ENV=dev NODE_ENV=crazy migrate
- MODE_ENV=dev NODE_ENV=ds migrate
- MODE_ENV=dev NODE_ENV=warehouses migrate

- MODE_ENV=pre-prod NODE_ENV=ds migrate

- MODE_ENV=prod NODE_ENV=lectures migrate
- MODE_ENV=prod NODE_ENV=clinics migrate
- MODE_ENV=prod NODE_ENV=schools migrate

- MODE_ENV=prod NODE_ENV=ds migrate `CAREFULL!!!!`
*/
'use strict';

require('../common');

const mongoose = require('mongoose');
const Media = mongoose.model('Media');
const Places = mongoose.model('Places');
const Locations = mongoose.model('Locations');
const Things = mongoose.model('Things');

exports.up = function up(next) {
  const currentDate = new Date();

  Promise.all([
    new Promise((resolve, reject) => {
      Places.collection.update(
        {},
        { $set: { createdAt: currentDate, updatedAt: currentDate } },
        { multi: true },
        (error) => {
          return error ? reject(error) : resolve();
        }
      );
    }),
    new Promise((resolve, reject) => {
      Locations.collection.update(
        {},
        { $set: { createdAt: currentDate, updatedAt: currentDate } },
        { multi: true },
        (error) => {
          return error ? reject(error) : resolve();
        }
      );
    }),
    new Promise((resolve, reject) => {
      Things.collection.update(
        {},
        { $set: { createdAt: currentDate, updatedAt: currentDate } },
        { multi: true },
        (error) => {
          return error ? reject(error) : resolve();
        }
      );
    }),
    new Promise((resolve, reject) => {
      Media.collection.update(
        {},
        { $set: { createdAt: currentDate, updatedAt: currentDate } },
        { multi: true },
        (error) => {
          return error ? reject(error) : resolve();
        }
      );
    })
  ])
    .then(() => {
      return next();
    })
    .catch((error) => {
      console.error(error);
      return next(error);
    });

  // .exec()
  // .then(() => {
  //   Locations.updateMany({}, { $set: { createdAt: Date.now(), updatedAt: Date.now() } }).exec();
  // })
  // .then(() => {
  //   Things.updateMany({}, { $set: { createdAt: Date.now(), updatedAt: Date.now() } }).exec();
  // })
  // .then(() => {
  //   Media.updateMany({}, { $set: { createdAt: Date.now(), updatedAt: Date.now() } }).exec(next);
  // })
  // .catch((error) => {
  //   console.error(error);
  // });
};

exports.down = function(next) {};

function wrapper(fn) {
  return new Promise((resolve, reject) => {
    fn({}, { $set: { createdAt: currentDate, updatedAt: currentDate } }, { multi: true }, (error) => {
      return error ? reject(error) : resolve();
    });
  });
}
