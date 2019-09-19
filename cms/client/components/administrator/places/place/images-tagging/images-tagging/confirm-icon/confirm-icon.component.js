angular.module('job')
  .controller('ConfirmIconController', [
    '$scope', '$modal', '$modalInstance', 'object',
    function ($scope, $modal, $modalInstance, object) {
      $scope.image = object.image;
      $scope.type = object.type;

      $scope.replaceUrl = function (url) {
        return url.replace('url("', '').replace('")', '');
      };

      $scope.ok = function () {
        $modalInstance.close();
      };

      $scope.close = function () {
        $modalInstance.dismiss();
      };
    }]);
