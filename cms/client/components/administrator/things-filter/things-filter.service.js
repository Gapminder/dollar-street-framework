angular.module('job')
  .factory('ThingsFilterService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    var ThingsFilterResource = $resource('', {}, {
      // serverUrl
      getThingsFilter: {method: 'GET', url: cmsConfig.serverApi + '/things-filter-data'},
      getThingsList: {method: 'GET', url: cmsConfig.serverApi + '/things-filter-list'},
      saveThings: {method: 'POST', url: cmsConfig.serverApi + '/filter-things'}
    });

    function ThingsFilterService() {
    }

    ThingsFilterService.prototype.preparationInitData = function (cb) {
      async.parallel({
        thingsList: function (cb) {
          ThingsFilterResource.getThingsList(function (res) {
            return cb(res.error, res.data);
          });
        },
        thingsFilterData: function (cb) {
          ThingsFilterResource.getThingsFilter(function (res) {
            return cb(res.error, res.data);
          });
        }
      }, cb);
    };

    ThingsFilterService.prototype.save = function (options, cb) {
      ThingsFilterResource.saveThings(options, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new ThingsFilterService();
  }]);
