angular.module('job')
  .controller('UserController', ['$scope', '$modal', '$stateParams', 'UserService',
    function ($scope, $modal, $stateParams, UserService) {
      $scope.loadPage = true;
      $scope.isSave = true;

      UserService.preparationInitData({id: $stateParams.id}, function (err, data) {
        if (err) {
          console.error(err);
          return;
        }

        if (data.profile.country) {
          data.profile.country = data.profile.country._id;
        }

        $scope.user = data.profile;
        $scope.profile = _.cloneDeep($scope.user);
        $scope.isAmbassador = $scope.profile.role === 'ambassador';
        $scope.allCountries = data.countries;
        $scope.userTypes = data.userTypes;

        if ($scope.user.avatar) {
          $scope.user.avatar = $scope.user.avatar + '?_ds=' + Date.now();
        }

        $scope.loadPage = false;
      });

      $scope.$watch('profile', function (value) {
        if (value) {
          $scope.isSave = angular.equals(value, $scope.user);
        }
      }, true);

      $scope.saveProfile = function (profile) {
        UserService.updateUser(profile, function (err) {
          if (err) {
            console.error(err);
            return;
          }

          var avatar = $scope.user.avatar;

          $scope.user = $scope.profile;
          $scope.user.avatar = avatar;
          $scope.profile = _.cloneDeep($scope.user);
          $scope.isSave = true;
        });
      };

      $scope.updateAvatar = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/profile/crop-image/crop-image.template.html',
          controller: 'CropImageController',
          size: 'lg'
        });

        modalInstance.result.then(function (response) {
          response.data.userId = $scope.user._id;

          UserService.updateAvatar(response.data, function (err, data) {
            if (err) {
              console.error(err);
              return;
            }

            $scope.user.avatar = data + '?_ds=' + Date.now();
          });
        }, function () {
        });
      };
    }]);
