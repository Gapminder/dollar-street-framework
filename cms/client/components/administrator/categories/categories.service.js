angular.module('job')
  .factory('CategoriesService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    var CategoriesResource = $resource('', {}, {
      // serverUrl
      getThings: {method: 'GET', url: cmsConfig.serverApi + '/things'},
      getPagingCategories: {method: 'GET', url: cmsConfig.serverApi + '/categories/next'},
      getPlacesType: {method: 'GET', url: cmsConfig.serverApi + '/placesType'}
    });

    function CategoriesService() {
    }

    CategoriesService.prototype.nextCategories = function (query, cb) {
      CategoriesResource.getPagingCategories(query, function (res) {
        cb(res.error, res.data);
      });
    };

    CategoriesService.prototype.getThings = function (cb) {
      CategoriesResource.getThings(function (res) {
        cb(res.error, res.data);
      });
    };

    CategoriesService.prototype.getPlacesType = function (cb) {
      CategoriesResource.getPlacesType(function (res) {
        cb(res.error, res.data);
      });
    };

    return new CategoriesService();
  }]);
