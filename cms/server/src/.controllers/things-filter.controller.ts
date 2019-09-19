// tslint:disable:no-floating-promises

import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';

// tslint:disable-next-line:variable-name
const Media = mongoose.model('Media');
// tslint:disable-next-line:variable-name
const Things = mongoose.model('Things');
// tslint:disable-next-line:variable-name
const ThingsFilter = mongoose.model('ThingsFilter');

export const thingsFilter = (app) => {
  const isAdmin = app.get('validate').isAdmin;
  const nconf = app.get('nconf');
  const CMS_SERVER_VERSION = nconf.get('CMS_SERVER_VERSION');

  app.get(`/${CMS_SERVER_VERSION}/things-filter-list`, isAdmin, getAllThingsList);
  app.get(`/${CMS_SERVER_VERSION}/things-filter-data`, isAdmin, getThingsFilterData);
  app.post(`/${CMS_SERVER_VERSION}/filter-things`, isAdmin, editThings);
};

function getAllThingsList(req, res) {
  getAllThings((error, things) => {
    if (error) {
      return res.json({ success: !error, msg: [], data: null, error });
    }

    getImagesCount(things, (err, results) => {
      res.json({ success: !err, msg: [], data: results, error: err });
    });
  });
}

function getAllThings(cb) {
  Things.find({}, { thingName: 1 })
    .sort({ thingName: 1 })
    .lean()
    .exec(cb);
}

function editThings(req, res) {
  const thingsData = req.body;

  thingsData.popular = _.map(thingsData.popular, '_id');
  thingsData.allTopics = _.map(thingsData.allTopics, '_id');

  ThingsFilter.update(
    {},
    {
      $set: {
        popularThings: thingsData.popular,
        allTopics: thingsData.allTopics
      }
    }
  ).exec((err, num) => {
    res.json({ success: !err, msg: [], data: num, error: err });
  });
}

function getThingsFilterData(req, res) {
  ThingsFilter.find({})
    .limit(1)
    .lean()
    .exec((error, things) => {
      if (error) {
        return res.json({ success: !error, msg: [], data: null, error });
      }

      const thingData = things[0];

      if (!thingData) {
        return res.json({ success: !error, msg: [], data: null, error });
      }

      const allTopicsIDs = thingData.allTopics;
      const popularIDs = thingData.popularThings;

      async.parallel(
        {
          selectedAllTopics: getSelectedThings(allTopicsIDs),
          selectedPopular: getSelectedThings(popularIDs)
        },
        (err, result) => {
          res.json({ success: !err, msg: [], data: result, error: err });
        }
      );
    });
}

function getSelectedThings(arr) {
  return (cb) => {
    findThingsByIds(arr, (err, thingsArr) => {
      if (err) {
        return cb(err);
      }

      getImagesCount(thingsArr, cb);
    });
  };
}

function getImagesCount(things, cb) {
  const thingsId = _.map(things, '_id');

  Media.collection
    .aggregate([
      {
        $match: {
          isTrash: false,
          isApproved: true
        }
      },
      {
        $unwind: '$things'
      },
      {
        $match: {
          'things._id': { $in: thingsId },
          'things.hidden': 'show'
        }
      },
      {
        $group: {
          _id: '$things._id',
          imagesCount: { $sum: 1 }
        }
      }
    ])
    .toArray((err, data) => {
      if (err) {
        return cb(err);
      }

      const hashImagesCount = _.reduce(
        data,
        (result, image) => {
          result[image._id.toString()] = image.imagesCount;

          return result;
        },
        {}
      );

      _.forEach(things, (thing) => {
        thing.images = hashImagesCount[thing._id] || 0;
      });

      cb(null, things);
    });
}

function findThingsByIds(thingsIds, cb) {
  Things.find({ _id: { $in: thingsIds } }, { thingName: 1 })
    .sort({ thingName: 1 })
    .lean()
    .exec((err, things) => {
      if (err) {
        return cb(err);
      }

      cb(null, _.flattenDeep(things));
    });
}
