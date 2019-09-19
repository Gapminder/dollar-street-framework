angular.module('job')
  .factory('ExcelService', ['$http', '$resource', 'cmsConfig', function ($http, $resource, cmsConfig) {
    var ExcelServiceResource = $resource('', {}, {
      // serverUrl
      createTemplate: {method: 'POST', url: cmsConfig.serverApi + '/places/create-template'}
    });

    function ExcelService() {

    }

    ExcelService.prototype.createTemplate = function (cb) {
      return ExcelServiceResource.createTemplate(function (res) {
        return cb(res.error, res.data);
      });
    };

    ExcelService.prototype.updatePlaces = function (query, cb) {
      var fd = new FormData();
      fd.append('file', query);

      $http.post(cmsConfig.serverApi + '/places/template/update', fd, {
        /*eslint-disable*/
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
        /*eslint-enable*/
      }).success(function (res) {
        cb(res.error, res.data);
      });
    };

    return new ExcelService();
  }]);
