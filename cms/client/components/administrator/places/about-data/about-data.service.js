angular.module('job')
  .factory('AboutDataService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    var AboutDataServiceResource = $resource('', {}, {
      // serverUrl
      getAboutData: {method: 'GET', url: cmsConfig.serverApi + '/about-data'},
      updateAboutData: {method: 'POST', url: cmsConfig.serverApi + '/about-data'}
    });

    function AboutDataService() {
    }

    AboutDataService.prototype.getAboutData = function (cb) {
      return AboutDataServiceResource.getAboutData(function (res) {
        return cb(res.error, res.data);
      });
    };

    AboutDataService.prototype.updateAboutData = function (query, cb) {
      return AboutDataServiceResource.updateAboutData(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new AboutDataService();
  }]);
