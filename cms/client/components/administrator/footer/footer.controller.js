angular.module('job')
  .controller('FooterController', ['$scope', 'FooterService', function ($scope, FooterService) {
    $scope.loadPage = true;
    $scope.isHidden = true;

    FooterService.getText(function (err, data) {
      if (err) {
        console.error(err);
        return;
      }

      $scope.footer = data || {};
      $scope.originalFooter = angular.copy($scope.footer);
      $scope.loadPage = false;
    });

    $scope.saveFooter = function (footer) {
      FooterService.editText(footer, function (err) {
        if (err) {
          console.log(err);
        }

        $scope.footer = footer;
        $scope.isHidden = true;
        $scope.originalFooter = angular.copy($scope.footer);
      });
    };

    $scope.$watch('footer', function (object) {
      if (!$scope.originalFooter || !object) {
        return;
      }

      $scope.isHidden = angular.equals($scope.originalFooter, object);
    }, true);

    $scope.tinymceOptions = {
      plugins: 'link image code autoresize media paste',
      toolbar: 'formatselect | bold, italic, underline, strikethrough | alignleft, aligncenter, alignright, alignjustify | bullist, numlist, outdent, indent',
      height: 300
    };
  }]);
