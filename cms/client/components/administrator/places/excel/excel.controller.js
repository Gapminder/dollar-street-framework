angular.module('job')
  .controller('ExcelPopUpController', ['$scope', 'ExcelService', '$modalInstance',
    function ($scope, ExcelService, $modalInstance) {
      ExcelService.createTemplate(function (err, data) {
        if (err) {
          console.log(err);
          $modalInstance.dismiss('cancel');
          return;
        }

        $scope.showContent = data;
        $scope.isUploaded = true;

        var fileField = angular.element('input#upload');

        fileField.bind('change', uploadExcel);
      });

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };

      function uploadExcel() {
        $scope.isUploaded = false;

        var file = this.files[0];

        if (file.type.indexOf('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') === -1) {
          $scope.$applyAsync(function () {
            $scope.incorrectType = true;
          });

          return;
        }

        ExcelService.updatePlaces(file, function (err) {
          if (err) {
            console.error(err);
            $modalInstance.dismiss('cancel');
            return;
          }

          $modalInstance.close({isUpdated: true});
        });
      }
    }]);
