angular.module('job')
  .controller('CropImageController', ['$scope', '$modalInstance', '$timeout', 'Cropper',
    function ($scope, $modalInstance, $timeout, Cropper) {
      var file;
      var data;

      $scope.cropper = {};
      $scope.cropperProxy = 'cropper.first';
      $scope.showEvent = 'show';
      $scope.hideEvent = 'hide';

      $scope.onFile = function (blob) {
        $scope.imageLoader = true;

        clear();
        file = blob;

        Cropper
          .encode(file)
          .then(function (dataUrl) {
            $scope.dataUrl = dataUrl;
            $timeout(showCropper);
          });
      };

      $scope.save = function () {
        if (!file || !data) {
          return;
        }

        data.file = file;

        $modalInstance.close({data: data});
      };

      $scope.options = {
        maximize: false,
        aspectRatio: 1,
        dragMode: 'none',
        zoomable: false,
        zoomOnTouch: false,
        zoomOnWheel: false,
        doubleClickToggle: false,
        crop: function (dataNew) {
          data = dataNew;
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };

      function showCropper() {
        $scope.$broadcast($scope.showEvent);
        $scope.imageLoader = false;
      }

      function hideCropper() {
        $scope.$broadcast($scope.hideEvent);
      }

      function clear() {
        $scope.dataUrl = '';
        $timeout(hideCropper);

        if (!$scope.cropper.first) {
          return;
        }

        $scope.cropper.first('clear');
      }
    }]);
