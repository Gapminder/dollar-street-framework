angular.module('job')
  .factory('ImagesFilterService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    var ImagesFilterServiceResource = $resource('', {}, {
      // serverUrl
      getThings: {method: 'GET', url: cmsConfig.serverApi + '/things-for-images-filter'}
    });

    function ImagesFilterService() {
    }

    ImagesFilterService.prototype.getThings = function (query, cb) {
      return ImagesFilterServiceResource.getThings(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new ImagesFilterService();
  }]);
