angular.module('job')
  .factory('ComparisonService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
      // move to separate service if needed
      // serverUrl
      var ImagesResource = $resource(cmsConfig.serverApi + '/images/:id');

      var ComparisonResource = $resource(cmsConfig.serverApi + '/comparisons/:type/:id', {}, {
        // get similarities or differences list
        comparisons: {method: 'GET', url: cmsConfig.serverApi + '/comparisons/:type/next'},
        getThings: {method: 'GET', url: cmsConfig.serverApi + '/things'},
        // similarity or differences crud
        createComparison: {method: 'POST'},
        saveComparison: {method: 'PUT'},
        removeComparison: {method: 'DELETE'},
        // switch similarity or differences status
        switchStatus: {method: 'POST', url: cmsConfig.serverApi + '/comparison/:type/status/:id'}
      });

      function ComparisonService() {
      }

      ComparisonService.prototype.getThings = getThings;

      ComparisonService.prototype.getComparisonsPaging = getComparisonsPaging;

      ComparisonService.prototype.createComparison = createComparison;

      ComparisonService.prototype.removeComparison = removeComparison;

      ComparisonService.prototype.updateStatusComparison = updateStatusComparison;

      ComparisonService.prototype.saveComparison = saveComparison;

      ComparisonService.prototype.addImageUrl = addImageUrl;

      ComparisonService.prototype.removeImageUrl = removeImageUrl;

      return new ComparisonService();

      function getThings(cb) {
        ComparisonResource.getThings(function (res) {
          cb(res.error, res.data);
        });
      }

      function getComparisonsPaging(query, cb) {
        return ComparisonResource.comparisons(query, {}, function success(res) {
          return cb(res.error, res.data);
        }, cb);
      }

      function createComparison(comparison, comparisonType, cb) {
        return ComparisonResource.createComparison({type: comparisonType}, comparison, function success(res) {
          return cb(res.err, res.data);
        }, cb);
      }

      function removeComparison(id, comparisonType, cb) {
        return ComparisonResource.removeComparison({type: comparisonType, id: id}, {}, function success(res) {
          return cb(res.error, res.data);
        }, cb);
      }

      // todo: jsdoc
      function updateStatusComparison(options, comparisonType, cb) {
        return ComparisonResource.switchStatus(
          {type: comparisonType, id: options.id},
          {status: options.status},
          function success(res) {
            return cb(res.error, res.data);
          }, cb);
      }

      // todo: jsdoc
      function addImageUrl(options, cb) {
        var comparison = options.comparison;
        var field = options.field;
        var url = options.url;
        var index = options.index;

        cb = cb || angular.noop;

        var imageId = url && url.indexOf('#id') !== -1 ? _.last(url.split('#id')) : null;

        if (!imageId || imageId.length !== 24) {
          return cb('This id of image invalid');
        }

        var allImagesId = _.pluck(comparison[field], '_id');

        if (allImagesId.indexOf(imageId) !== -1) {
          return cb('This id of image exist');
        }

        return ImagesResource.get({id: imageId}, function success(res) {
          if (res.error) {
            return cb(res.error);
          }

          comparison[field][index] = res.data;
          comparison[field][index].fullUrl = url;

          if (field === 'snippetImages') {
            comparison.countries = comparison.countries || [];
            comparison.countries[index] = {
              place: res.data.place,
              country: res.data.country
            };
          }

          return cb(null, comparison);
        }, cb);
      }

      // todo: jsdoc
      function saveComparison(comparison, comparisonType, cb) {
        return ComparisonResource.saveComparison(
          {type: comparisonType, id: comparison._id},
          comparison,
          function success(res) {
            return cb(res.error, res.data);
          }, cb);
      }

      // todo: jsdoc
      function removeImageUrl(options) {
        var comparison = options.comparison;
        var field = options.field;
        var index = options.index;
        var url = comparison[field][index];
        var image = null;

        var imageId = url.indexOf('#id') !== -1 ? _.last(url.split('#id')) : null;

        comparison[field].splice(index, 1);

        if (!imageId) {
          return comparison;
        }

        if (field === 'snippetImages') {
          image = _.find(comparison[field], {_id: imageId});
        }

        if (image) {
          comparison.countries = _.filter(comparison.countries, function (country) {
            return country.place !== image.place;
          });
        }

        return comparison;
      }
    }]);
