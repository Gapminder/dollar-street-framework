angular.module('job')
  .controller('RotateMediaController', [
    '$scope', '$http', '$modal', '$modalInstance', 'media', 'AmazonPath', 'cmsConfig',
    function ($scope, $http, $modal, $modalInstance, media, AmazonPath, cmsConfig) {
      $scope.imageUrl = AmazonPath.createPath(media, 'thumb-');
      $scope.imgReload = '?_ds=' + Date.now();
      var rotateDegrees = 0;

      $scope.rotate = function () {
        if (rotateDegrees === 270) {
          rotateDegrees = 0;
        } else {
          rotateDegrees += 90;
        }

        switch (rotateDegrees) {
          case 90:
            $scope.retateClass = 'rotateLeft';
            break;
          case 180:
            $scope.retateClass = 'rotateTop';
            break;
          case 270:
            $scope.retateClass = 'rotateRight';
            break;
          default:
            $scope.retateClass = null;
            break;
        }
      };

      $scope.ok = function () {
        if (rotateDegrees) {
          $scope.rotateImage = true;

          $http.post(cmsConfig.serverApi + '/rotate/' + media._id, {
            media: media,
            rotate: rotateDegrees
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            $scope.rotateImage = false;
            $modalInstance.close({done: true});
          });
        }
      };

      $scope.close = function () {
        $modalInstance.dismiss();
      };
    }]);
