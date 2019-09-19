angular.module('job')
  .factory('PlaceTypesService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    // serverUrl
    var PlaceTypesResource = $resource(cmsConfig.serverApi + '/categories', {}, {
      nextPlaceTypes: {method: 'GET', url: cmsConfig.serverApi + '/placesType/next'},
      getPlaceTypesName: {method: 'GET', url: cmsConfig.serverApi + '/placesType/names'}
    });

    function PlaceTypesService() {
    }

    PlaceTypesService.prototype.getPlaceTypesNames = function (cb) {
      PlaceTypesResource.getPlaceTypesName(function (res) {
        cb(res.error, res.data);
      });
    };

    PlaceTypesService.prototype.nextPlaceTypes = function (query, cb) {
      PlaceTypesResource.nextPlaceTypes(query, function (res) {
        cb(res.error, res.data);
      });
    };

    return new PlaceTypesService();
  }]);
