angular.module('job')
  .controller('CreateAndEditStringController', [
    '$scope', '$modalInstance', '$http', '$modal', 'StringsService', 'title', 'mode', 'object',
    function ($scope, $modalInstance, $http, $modal, StringsService, title, mode, object) {
      $scope.mode = mode;      
      $scope.title = title;
      $scope.object = object;

      $scope.save = function () {
        if (!$scope.object.name) {
          $scope.nameIsIncorrect = true;
          return;
        }

        if (!$scope.object.key) {
          $scope.keyIsIncorrect = true;
          return;
        }

        if($scope.mode === 'create') {
          StringsService.createString($scope.object, (err, data) => {
            if (err) {
              console.log(err);
              return;
            }

            $modalInstance.close(data);
          });
        }

        if($scope.mode === 'edit') {
          StringsService.updateString($scope.object, (err, data) => {
            if (err) {
              console.log(err);
              return;
            }

            $modalInstance.close($scope.object);
          });
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
