angular.module('async', [])
  .factory('async', ['$window', function ($window) {
    var async = $window.async;
    //delete $window.async
    return async;
  }]);
