angular.module('job').controller('LoginController', [
  '$scope',
  '$state',
  '$http',
  'notify',
  'cmsConfig',
  function($scope, $state, $http, notify, cmsConfig) {
    $scope.login = function(email, password) {
      $http
        // serverUrl
        .post(cmsConfig.serverApi + '/login', { email: email, password: password })
        .success(function(data) {
          if (data.error) {
            console.error(data.error);
            return;
          }

          if (!data.success) {
            notify.config({
              position: 'center'
            });
            notify({
              message: 'Email or password are incorrect!',
              classes: 'alert-danger',
              templateUrl: '/components/account/notify.html'
            });

            return;
          }

          notify.closeAll();
          $state.go('admin.app.places');
        });
    };
  }
]);
