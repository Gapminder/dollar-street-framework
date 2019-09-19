angular.module('job')
  .controller('ImportController', ['$scope', 'TranslationsService', '$modalInstance', 'params',
    function ($scope, TranslationsService, $modalInstance, params) {
      $scope.isImport = false;
      $scope.language = params.language;

      $scope.export = function () {
        $scope.isImport = true;

        TranslationsService.importTranslations({code: $scope.language.code}, function (err) {
          if (err) {
            console.error(err);
          }

          $modalInstance.close();
        });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
