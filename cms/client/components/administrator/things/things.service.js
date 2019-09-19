angular.module('job')
  .factory('ThingsService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    // serverUrl
    var ThingsResource = $resource(cmsConfig.serverApi + '/things', {}, {
      getPagingThings: {method: 'GET', url: cmsConfig.serverApi + '/things/next'},
      getCategories: {method: 'GET', url: cmsConfig.serverApi + '/categories'},
      getThings: {method: 'GET', url: cmsConfig.serverApi + '/things-for-set-related-things'},
      getConsumerAllImagesVisibility: {method: 'GET', url: cmsConfig.serverApi + '/consumer/all/images'}
    });

    function ThingsService() {
    }

    ThingsService.prototype.nextThings = function (query, cb) {
      ThingsResource.getPagingThings(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    ThingsService.prototype.preparationInitData = function (cb) {
      async.parallel({
        consumerAllImagesVisibility: function (cb) {
          ThingsResource.getConsumerAllImagesVisibility(function (res) {
            return cb(res.error, res.data);
          });
        },
        categories: function (cb) {
          ThingsResource.getCategories(function (res) {
            return cb(res.error, res.data);
          });
        },
        things: function (cb) {
          ThingsResource.getThings(function (res) {
            return cb(res.error, res.data);
          });
        }
      }, cb);
    };

    return new ThingsService();
  }]);
