angular.module('job')
  .factory('InfoService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    var InfoServiceResource = $resource('', {}, {
      // serverUrl
      getInfo: {method: 'GET', url: cmsConfig.serverApi + '/info'},
      updateInfo: {method: 'POST', url: cmsConfig.serverApi + '/info'}
    });

    function InfoService() {
    }

    InfoService.prototype.getInfo = function (cb) {
      return InfoServiceResource.getInfo(function (res) {
        return cb(res.error, res.data);
      });
    };

    InfoService.prototype.updateInfo = function (query, cb) {
      return InfoServiceResource.updateInfo(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new InfoService();
  }]);
