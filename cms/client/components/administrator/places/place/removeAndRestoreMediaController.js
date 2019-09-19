angular.module('job')
  .controller('RemoveAndRestoreMediaController', [
    '$scope', '$http', '$modal', '$modalInstance', 'object', 'AmazonPath', 'cmsConfig',
    function ($scope, $http, $modal, $modalInstance, object, AmazonPath, cmsConfig) {
      $scope.amazonPath = AmazonPath.createPath.bind(AmazonPath);
      if (object.removeMedia) {
        $scope.action = 'to delete';
        $scope.media = object.removeMedia;
      }

      if (object.restoreMedia) {
        $scope.action = 'restore';
        $scope.media = object.restoreMedia;
      }

      $scope.ok = function () {
        if (object.removeMedia) {
          if (!$scope.media.isTrash) {
            $http.post(cmsConfig.serverApi + '/mediaIsTrash/' + $scope.media._id, {isTrash: true}).success(function () {
              $modalInstance.close({success: 'done', remove: false, image: $scope.media});
            });
          } else {
            $http.post(cmsConfig.serverApi + '/removeMedia', $scope.media).success(function () {
              $modalInstance.close({success: 'done', remove: true, image: $scope.media});
            });
          }
        }

        if (object.restoreMedia) {
          $http.post(cmsConfig.serverApi + '/mediaIsTrash/' + $scope.media._id, {isTrash: false}).success(function () {
            $modalInstance.close({success: 'done', image: $scope.media});
          });
        }
      };
      $scope.close = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
