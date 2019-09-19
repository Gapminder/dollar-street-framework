angular.module('job')
  .controller('AdminController', ['$scope', '$rootScope', '$sce', '$http', '$state', 'cmsConfig',
    function ($scope, $rootScope, $sce, $http, $state, cmsConfig) {
      $rootScope.isPreview = false;

      $scope.logout = function () {
        $http.get(cmsConfig.serverApi + '/logout').success(function (res) {
          $state.go(res.data.redirect);
        });
      };

      $scope.mobile = device.mobile();
      $scope.tablet = device.tablet();

      if ($scope.mobile) {
        $scope.device = 'devices-';
      } else if ($scope.tablet) {
        $scope.device = 'tablets-';
      } else {
        $scope.device = 'desktops-';
      }

      $scope.goPreview = function () {
        window.location.replace('/cms');
      };

      $http.get(cmsConfig.serverApi + '/authorize').success(function (res) {
        if (res.user === 'admin') {
          $scope.isAdmin = true;
          $scope.removeField = true;
          $scope.csvUpload = true;
          $scope.adminFancyBox = true;
        }
      });
    }])
  .directive('resize', ['$window', '$state', function ($window, $state) {
    return function (scope, element, attrs) {
      var window = angular.element($window);

      attrs.$observe('resize', function () {
        resizeHeight();
      });

      scope.getWindowHeight = function () {
        return {height: window.height()};
      };

      function resizeHeight() {
        var height;

        scope.$watch(scope.getWindowHeight, function (newValue) {
          if ($state.current.name.indexOf('/images/') !== -1) {
            height = 450;
          } else if ($state.current.url === 'place/:id') {
            height = 205;
          } else if ($state.current.url === 'article-thing/:id') {
            height = 275;
          } else if ($state.current.url === 'info') {
            height = 220;
          } else if ($state.current.url === 'strings') {
            height = 220;
          } else if ($state.current.url === 'onboarding') {
            height = 223;
          } else if ($state.current.url === 'street') {
            height = 350;
          } else if ($state.current.url === 'footer') {
            height = 220;
          } else if ($state.current.url === 'things-filter') {
            height = 225;
          } else if ($state.current.url === 'users-types') {
            height = 260;
          } else {
            height = 375;
          }

          scope.style = function () {
            return {
              height: newValue.height - height + 'px'
            };
          };
        }, true);
      }

      window.bind('resize', function () {
        scope.$apply();
      });
    };
  }]);
