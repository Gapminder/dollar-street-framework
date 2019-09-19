angular
  .module('job')
  .filter('imageUrl', ['AmazonPath', function (AmazonPath) {
    return function (image) {
      if (image && image.src) {
        return AmazonPath.createPath(image, 'thumb-');
      }
    };
  }]);
