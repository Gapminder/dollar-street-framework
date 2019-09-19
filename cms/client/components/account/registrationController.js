angular.module('job')
  .controller('RegistrationController', ['$scope', '$state', '$rootScope', '$http', 'cmsConfig',
  function ($scope, $state, $rootScope, $http, cmsConfig) {
    $rootScope.isPreview = true;
    $scope.isCheckPassword = false;
    $scope.isExistEmail = true;
    $scope.isExistUsername = true;

    $scope.checkEmail = _.debounce(validEmailFunc, 500);
    $scope.checkUsername = _.debounce(validUserNameFunc, 500);
    $scope.checkPassword = _.debounce(validPasswordFunc, 500);

    $scope.signup = function(firstName, lastName, email, password, username, country) {
      $http.post(cmsConfig.serverApi + '/signup', {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        username: username,
        country: country
      }).success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        $state.go('admin.app.profile');
      });
    };

    $http.get(cmsConfig.serverApi + '/countries').success(function (data) {
      if (data.error) {
        console.error(data.error);
        return;
      }

      $scope.countries = data.data;
    });

    function validEmailFunc(email) {
      $http.get(cmsConfig.serverApi + '/check-email', {params: {email: email}}).success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        $scope.isExistEmail = data.data;
      });
    }

    function validUserNameFunc(username) {
      $http.get(cmsConfig.serverApi + '/check-username', {params: {username: username}}).success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        $scope.isExistUsername = data.data;
      });
    }

    function validPasswordFunc(password, confirmPassword) {
      $scope.$applyAsync(function () {
        if (password && confirmPassword) {
          $scope.isCheckPassword = password === confirmPassword;
        } else {
          $scope.isCheckPassword = false;
        }
      });
    }
  }]);
