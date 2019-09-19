angular.module('job')
  .controller('ConfirmImageController', [
    '$scope', '$modal', '$modalInstance', 'object',
    function ($scope, $modal, $modalInstance, object) {
      $scope.image = object.image;
      $scope.title = object.title;
      $scope.isSkipPopUpShow = object.isSkipPopUp;
      $scope.isSkipPopUp = object.isSkipPopUp;

      $scope.replaceUrl = function (url) {
        return url.replace('url("', '').replace('")', '');
      };

      $scope.ok = function (isSkipPopUp) {
        $modalInstance.close({isSkipPopUp: isSkipPopUp});
      };

      $scope.close = function () {
        $modalInstance.dismiss();
      };
    }]);
