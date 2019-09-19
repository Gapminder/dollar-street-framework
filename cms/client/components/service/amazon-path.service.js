angular.module('job')
  .factory('AmazonPath', ['amazonUrl', function (amazonUrl) {
    function AmazonPath() {
      this.amazonUrl = amazonUrl;
    }

    AmazonPath.prototype.createPath = function (image, format) {
      var path;
      if (!format) {
        path = this.amazonUrl + image;
      } else {
        path = this.amazonUrl + image.src + format + image.amazonfilename;
      }
      return path;
    };
    return new AmazonPath();
  }]);
