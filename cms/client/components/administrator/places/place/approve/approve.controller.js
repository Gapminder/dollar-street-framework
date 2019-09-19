angular.module('job')
  .controller('ApproveController', ['$scope', '$http', '$modalInstance', 'place', 'cmsConfig',
    function ($scope, $http, $modalInstance, place, cmsConfig) {
      $http.post(cmsConfig.serverApi + '/request-approval/' + place._id).success(function (data) {
        if (data.error) {
          console.error(data.error);
        }
      });

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
