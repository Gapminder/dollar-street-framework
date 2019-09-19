angular.module('job')
  .factory('PlaceIconsService', ['$resource',  'cmsConfig', function ($resource, cmsConfig) {
    var PlaceIconsServiceResource = $resource('', {}, {
      // serverUrl
      getIcons: {method: 'GET', url: cmsConfig.serverApi + '/place-icons/:placeId'},
      updateIcons: {method: 'POST', url: cmsConfig.serverApi + '/place-icons'}
    });

    function PlaceIconsService() {
    }

    PlaceIconsService.prototype.getIcons = function (query, cb) {
      return PlaceIconsServiceResource.getIcons({placeId: query.placeId}, function (res) {
        return cb(res.error, res.data);
      });
    };

    PlaceIconsService.prototype.updateIcons = function (query, cb) {
      return PlaceIconsServiceResource.updateIcons(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new PlaceIconsService();
  }]);
