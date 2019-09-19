angular.module('job')
  .factory('StringsService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    var StringsServiceResource = $resource('', {}, {
      // serverUrl
      getAllStrings: {method: 'GET', url: cmsConfig.serverApi + '/strings'},
      updateString: {method: 'PUT', url: cmsConfig.serverApi + '/strings/update'},
      removeString: {method: 'POST', url: cmsConfig.serverApi + '/strings/remove'},
      createString: {method: 'POST', url: cmsConfig.serverApi + '/strings/new'}
    });

    function StringsService() {
    }

    StringsService.prototype.getAllStrings = function (cb) {
      return StringsServiceResource.getAllStrings(function (res) {
        return cb(res.error, res.data);
      });
    };

    StringsService.prototype.updateString = function (query, cb) {
      return StringsServiceResource.updateString(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    StringsService.prototype.removeString = function (query, cb) {
      return StringsServiceResource.removeString(query, function (res) {
        return cb(res.error, res.data);
      });
    }

    StringsService.prototype.createString = function (query, cb) {
      return StringsServiceResource.createString(query, function (res) {
        return cb(res.err, res.data);
      });
    }

    return new StringsService();
  }]);
