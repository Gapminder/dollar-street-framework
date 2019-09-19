angular.module('job')
  .factory('FooterService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    // serverUrl
    var FooterResource = $resource(cmsConfig.serverApi + '/footer', {}, {
      getFooterText: {method: 'GET', url: cmsConfig.serverApi + '/footer'},
      editFooterText: {method: 'POST', url: cmsConfig.serverApi + '/footer/edit'}
    });

    function FooterService() {
    }

    FooterService.prototype.getText = function (cb) {
      return FooterResource.getFooterText(function (res) {
        return cb(res.error, res.data);
      });
    };

    FooterService.prototype.editText = function (options, cb) {
      return FooterResource.editFooterText({}, options, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new FooterService();
  }]);
