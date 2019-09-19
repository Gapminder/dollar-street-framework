angular.module('_', [])
  .factory('_', ['$window', function ($window) {
    var lodash = $window._;
    return lodash;
  }]);
