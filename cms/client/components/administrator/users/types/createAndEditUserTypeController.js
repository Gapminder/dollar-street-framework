angular.module('job')
  .controller('CreateAndEditUserTypeController', [
    '$scope', '$modalInstance', '$http', '$modal', 'title', 'position', 'mode', 'id', 'name', 'cmsConfig',
    function ($scope, $modalInstance, $http, $modal, title, position, mode, id, name, cmsConfig) {
      $scope.title = title;
      $scope.position = position;
      $scope.mode = mode;
      $scope.id = id;
      $scope.name = name;

      $scope.save = function () {
        if (!$scope.name) {
          $scope.nameIsIncorrect = true;
          return;
        }

        if($scope.mode === 'create') {
          $http.post(cmsConfig.serverApi + '/users/types/new', {
              name: $scope.name,
              position: $scope.position
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            $modalInstance.close(data);
          });
        }

        if($scope.mode === 'edit') {
          $http.put(cmsConfig.serverApi + '/users/types/edit/' + $scope.id, {
              name: $scope.name,
              position: $scope.position
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            $modalInstance.close({id: $scope.id, name: $scope.name});
          });
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
