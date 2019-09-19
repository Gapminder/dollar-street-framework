angular.module('job')
  .factory('PlacesService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    // serverUrl
    var PlacesServiceResource = $resource(cmsConfig.serverApi + '/places/next', {}, {
      getNextPlaces: {method: 'GET', url: cmsConfig.serverApi + '/admin_places/next'},
      setPublic: {method: 'POST', url: cmsConfig.serverApi + '/places/edit/list/:id'},
      getPlacesStats: {method: 'GET', url: cmsConfig.serverApi + '/admin_places'},
      getPlacesCount: {method: 'GET', url: cmsConfig.serverApi + '/admin_places/count'},
      setPublicMain: {method: 'POST', url: cmsConfig.serverApi + '/place/:id/public'}
    });

    function PlaceService() {

    }

    PlaceService.prototype.getPlacesCount = function (query, cb) {
       return PlacesServiceResource.getPlacesCount(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    PlaceService.prototype.preparationInitData = function (query, cb) {
      return PlacesServiceResource.getPlacesStats(function (res) {
        return cb(res.error, res.data);
      });
    };

    PlaceService.prototype.nextPlaces = function (query, cb) {
      return PlacesServiceResource.getNextPlaces(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    PlaceService.prototype.setPublic = function (query, cb) {
      return PlacesServiceResource.setPublic({id: query._id}, {list: query.list}, function (res) {
        return cb(res.error, res.data);
      });
    };

    PlaceService.prototype.setPublicMain = function (query, cb) {
      return PlacesServiceResource.setPublicMain({id: query._id}, {isPublic: query.isPublic}, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new PlaceService();
  }]);
