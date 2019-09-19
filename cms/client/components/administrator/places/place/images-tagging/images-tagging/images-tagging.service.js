angular.module('job')
  .factory('ImagesTaggingService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    var ImagesTaggingServiceResource = $resource('', {}, {
      // serverUrl
      getImages: {method: 'GET', url: cmsConfig.serverApi + '/images-tagging/:placeId'},
      updateImages: {method: 'POST', url: cmsConfig.serverApi + '/images-tagging'}
    });

    function ImagesTaggingService() {
    }

    ImagesTaggingService.prototype.getImages = function (query, cb) {
      return ImagesTaggingServiceResource.getImages({placeId: query.placeId}, function (res) {
        return cb(res.error, res.data);
      });
    };

    ImagesTaggingService.prototype.updateImages = function (query, cb) {
      return ImagesTaggingServiceResource.updateImages(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new ImagesTaggingService();
  }]);
