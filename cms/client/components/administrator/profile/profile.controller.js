angular.module('job')
  .controller('ProfileController', ['$scope', '$modal', 'ProfileService', function ($scope, $modal, ProfileService) {
    $scope.loadPage = true;
    $scope.isSave = true;
    $scope.checkUsername = _.debounce(validUsernameFunc, 500);

    ProfileService.preparationInitData(function (err, data) {
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

    $scope.$watchCollection('profile', function (value) {
      if (value) {
        $scope.isSave = angular.equals(value, $scope.user);
      }
    });

    $scope.saveProfile = function (profile) {
      ProfileService.updateProfile(profile, function (err) {
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

    function validUsernameFunc(username) {
      ProfileService.checkUsername({username: username}, function (err, data) {
        if (err) {
          console.error(err);
          return;
        }

        $scope.isExistUsername = data;
      });
    }

    $scope.updateAvatar = function () {
      var modalInstance = $modal.open({
        templateUrl: '/components/administrator/profile/crop-image/crop-image.template.html',
        controller: 'CropImageController',
        size: 'lg'
      });

      modalInstance.result.then(function (response) {
        ProfileService.updateAvatar(response.data, function (err, data) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.user.avatar = data + '?_ds=' + Date.now();
        });
      });
    };
  }]);
