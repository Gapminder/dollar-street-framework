angular.module('job')
  .controller('AboutDataController', [
    '$scope', 'AboutDataService', '$modal', '$modalInstance',
    function ($scope, AboutDataService, $modal, $modalInstance) {
      AboutDataService.getAboutData(function (err, data) {
        if (err) {
          $modalInstance.dismiss();
          return;
        }

        $scope.aboutData = data;
        $scope.showContent = true;
      });

      $scope.save = function (aboutData) {
        AboutDataService.updateAboutData(aboutData, function (err) {
          if (err) {
            $modalInstance.dismiss();
            return;
          }

          $modalInstance.close();
        });
      };

      $scope.close = function () {
        $modalInstance.dismiss();
      };
    }]);
