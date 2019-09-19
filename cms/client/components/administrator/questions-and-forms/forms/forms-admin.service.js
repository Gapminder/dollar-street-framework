angular.module('job')
  .factory('FormsService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    // serverUrl
    var FormsResource = $resource(cmsConfig.serverApi + '/forms/next', {}, {
      getPagingForms: {method: 'GET', url: cmsConfig.serverApi + '/forms/next'}
    });

    function FormsService() {
    }

    FormsService.prototype.nextForms = function (query, cb) {
      FormsResource.getPagingForms(query, function (res) {
        cb(res.error, res.data);
      });
    };
    return new FormsService();
  }]);
