angular.module('job')
  .controller('RemoveUserController', ['$scope', '$modalInstance', 'user',
    function ($scope, $modalInstance, user) {
      $scope.user = user;

      $scope.ok = function () {
        $modalInstance.close();
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
