angular.module('job')
  .controller('EditMediaModalController', ['$scope', '$http', '$modalInstance', 'choseImgArr', 'removeChosenImage', 'cmsConfig',
    'startRotate', 'formRotateArr', 'displayImage',
    function ($scope, $http, $modalInstance, choseImgArr, removeChosenImage, startRotate, formRotateArr, displayImage, cmsConfig) {
      $scope.displayImage = displayImage;
      $scope.rotate = 0;
      $scope.count = choseImgArr.length;
      $scope.thingOptions = {};
      $scope.thingOptions.hidden = 'show';
      $scope.thingOptions.rating = 0;
      $scope.removeChosenImage = removeChosenImage;
      $scope.startRotate = startRotate;
      $scope.formRotateArr = formRotateArr;
      $scope.imagesDisplay = {};

      $scope.imageRotate = function () {
        $scope.rotate += 90;
        if ($scope.rotate === 360) {
          $scope.rotate = 0;
        }
      };

      $scope.deleteTogetherThings = function (index) {
        var deleteThing = $scope.togetherThings.splice(index, 1);

        $http.post(cmsConfig.serverApi + '/delete/together_thing', {
          images: choseImgArr,
          thing: deleteThing
        }).success(function (data) {
          if (data.error) {
            console.error(data.error);
          }

          $scope.isDeleteThing = true;
        });
      };

      $http.post(cmsConfig.serverApi + '/images/common/things', choseImgArr).success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        $scope.togetherThings = data.data;
      });

      $http.get(cmsConfig.serverApi + '/things').success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        $scope.things = data.data;
      });

      $scope.canSave = function () {
        return $scope.rotate > 0 || $scope.thingOptions._id ? true : false;
      };

      $scope.save = function () {
        var options = {
          imagesIs: choseImgArr,
          thingOptions: $scope.thingOptions
        };

        if ($scope.rotate > 0 || $scope.thingOptions._id || $scope.imagesDisplay.display) {
          $scope.errorSelectThing = false;

          if ($scope.rotate > 0) {
            $scope.formRotateArr(choseImgArr);
            $scope.startRotate(choseImgArr, $scope.rotate);
          }

          if ($scope.imagesDisplay.display) {
            $scope.displayImage(choseImgArr, $scope.imagesDisplay);
          }

          if ($scope.thingOptions._id) {
            $http.post(cmsConfig.serverApi + '/edit/all_images', options).success(function (data) {
              if (data.error) {
                console.error(data.error);
                return;
              }

              $modalInstance.close();
              $scope.removeChosenImage($scope.rotate);
            });
          } else {
            $scope.removeChosenImage($scope.rotate);
            $modalInstance.close();
          }
        } else if ($scope.isDeleteThing) {
          $modalInstance.dismiss('cancel');
        } else {
          $scope.errorSelectThing = true;
        }
      };

      $scope.close = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
