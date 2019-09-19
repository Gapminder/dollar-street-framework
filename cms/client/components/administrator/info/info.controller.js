angular.module('job')
  .controller('InfoController', ['$scope', 'InfoService', function ($scope, InfoService) {
    $scope.loadPage = true;

    InfoService.getInfo(function (err, data) {
      if (err) {
        console.error(err);
        return;
      }

      $scope.tinymceModel = data;
      $scope.loadPage = false;
    });

    $scope.getContent = function (tinymceModel) {
      InfoService.updateInfo(tinymceModel, function (err) {
        if (err) {
          console.error(err);
        }
      });
    };

    $scope.tinymceOptions = {
      plugins: 'link image code autoresize media paste',
      toolbar: 'formatselect | bold, italic, underline, strikethrough | alignleft, aligncenter, alignright, alignjustify | bullist, numlist, outdent, indent',
      height: 300
    };
  }]);
