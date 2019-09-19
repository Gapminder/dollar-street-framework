import * as _ from 'lodash';
import * as async from 'async';
import * as mongoose from 'mongoose';

const Regions = mongoose.model('Regions');
const Locations = mongoose.model('Locations');

const dbIdKey = '_id';

exports.up = function(next) {
  Locations.find({}, { region: 1 })
    .lean()
    .exec(function(err, locations) {
      if (err) {
        console.error('Get locations error', err);

        return next(err);
      }

      const regions = _.chain(locations)
        .map(function(location) {
          return { name: location.region };
        })
        .uniqBy('name')
        .value();

      return Regions.collection.insert(regions, { ordered: true }, function(error, response) {
        if (error) {
          console.error('Get locations error', error);

          return next(error);
        }

        const hashRegionName = _.reduce(
          response.ops,
          function(result, region) {
            result[region.name] = region[dbIdKey];

            return result;
          },
          {}
        );

        const updateLocations = [];

        _.forEach(locations, function(location) {
          updateLocations.push({
            find: { _id: location[dbIdKey] },
            update: {
              $set: { region: hashRegionName[location.region] }
            }
          });
        });

        async.each(
          updateLocations,
          function(location, cb) {
            Locations.update(location.find, location.update).exec(cb);
          },
          next
        );
      });
    });
};

exports.down = function(next) {
  next();
};
