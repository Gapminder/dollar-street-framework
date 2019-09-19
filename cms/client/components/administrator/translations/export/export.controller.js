angular.module('job')
  .controller('ExportController', ['$scope', 'TranslationsService', '$modalInstance',
    function ($scope, TranslationsService, $modalInstance) {
      $scope.isExport = false;

      $scope.export = function () {
        $scope.isExport = true;

        TranslationsService.exportTranslations(function (err) {
          if (err) {
            console.error(err);
          }

          $modalInstance.close();
        });
      };

      $scope.close = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
