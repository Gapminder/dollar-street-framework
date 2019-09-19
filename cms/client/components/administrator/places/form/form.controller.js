angular.module('job')
  .controller('FormController', ['$scope', '$modalInstance', '$http', 'cmsConfig',
    function ($scope, $modalInstance, $http, cmsConfig) {
      $scope.isValid = true;

      $scope.confirm = function (option, option1, option2, name, email, work) {
        $http.post(cmsConfig.serverApi + '/place/confirm', {
          option: option,
          option1: option1,
          option2: option2,
          name: name,
          email: email,
          work: work
        }).success(function (data) {
          if (data.err) {
            console.error(data.err);
            return;
          }

          if (!option || !option1 || !option2) {
            $scope.isValid = false;
            return;
          }

          $modalInstance.close();
        });
      };

      $scope.tryAgain = function () {
        $scope.isValid = true;
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
