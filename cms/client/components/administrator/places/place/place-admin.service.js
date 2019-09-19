angular.module('job')
  .factory('PlaceAdminService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    // serverUrl
    var PlaceAdminServiceResource = $resource(cmsConfig.serverApi + '/admin_places/next', {}, {
      getNextPlaceImages: {method: 'GET', url: cmsConfig.serverApi + '/images/per_place/:placeId'},
      getThings: {method: 'GET', url: cmsConfig.serverApi + '/things'},
      getCategories: {method: 'GET', url: cmsConfig.serverApi + '/categories'},
      getPlaces: {method: 'GET', url: cmsConfig.serverApi + '/places'},
      getPlace: {method: 'GET', url: cmsConfig.serverApi + '/place/:id'},
      getPlacesType: {method: 'GET', url: cmsConfig.serverApi + '/placesType'},
      getInfo: {method: 'GET', url: cmsConfig.serverApi + '/questionsAndForms'},
      getNamesPlaces: {method: 'GET', url: cmsConfig.serverApi + '/places/names'},
      getRegionsAndCountries: {method: 'GET', url: cmsConfig.serverApi + '/places/regions-and-countries'},
      getPhotographers: {method: 'GET', url: cmsConfig.serverApi + '/photographers'},
      approveImages: {method: 'POST', url: cmsConfig.serverApi + '/approve-images'}
    });

    function PlaceAdminService() {

    }

    PlaceAdminService.prototype.preparationInitData = function (id, cb) {
      async.parallel({
        places: function (cb) {
          PlaceAdminServiceResource.getPlaces(function (res) {
            cb(res.error, res.data);
          });
        },
        place: function (cb) {
          PlaceAdminServiceResource.getPlace({id: id}, function (res) {
            cb(res.error, res.data);
          });
        },
        categories: function (cb) {
          PlaceAdminServiceResource.getCategories(function (res) {
            cb(res.error, res.data);
          });
        },
        things: function (cb) {
          PlaceAdminServiceResource.getThings(function (res) {
            cb(res.error, res.data);
          });
        },
        placesType: function (cb) {
          PlaceAdminServiceResource.getPlacesType(function (res) {
            cb(res.error, res.data);
          });
        },
        infos: function (cb) {
          PlaceAdminServiceResource.getInfo(function (res) {
            cb(res.error, res.data);
          });
        },
        photographers: function (cb) {
          PlaceAdminServiceResource.getPhotographers(function (res) {
            cb(res.error, res.data);
          });
        },
        namesPlaces: function (cb) {
          PlaceAdminServiceResource.getNamesPlaces(function (res) {
            cb(res.error, res.data);
          });
        },
        locations: function (cb) {
          PlaceAdminServiceResource.getRegionsAndCountries(function (res) {
            cb(res.error, res.data);
          });
        }
      }, cb);
    };

    PlaceAdminService.prototype.getNextPlaceImages = function (query, cb) {
      return PlaceAdminServiceResource.getNextPlaceImages(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    PlaceAdminService.prototype.approveImages = function (query, cb) {
      return PlaceAdminServiceResource.approveImages(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new PlaceAdminService();
  }]);
