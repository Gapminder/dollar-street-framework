/**
 *
 * Pass all functions into module
 */
angular
  .module('job')
  .directive('sideNavigation', ['$timeout', sideNavigation])
  .directive('responsiveMenu', ['$window', responsiveMenu])
  .directive('minimalizaSidebar', [minimalizaSidebar]);

/**
 * sideNavigation - Directive for run metsiMenu on sidebar navigation
 */
function sideNavigation($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element) {
      // Call the metsiMenu plugin and plug it to sidebar navigation
      $timeout(function () {
        element.metisMenu();
      });
    }
  };
}

function responsiveMenu($window) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var window = angular.element($window);

      attrs.$observe('responsiveMenu', function () {
        resizeWidth();
      });

      scope.getWindowWidth = function () {
        return {width: window.width()};
      };

      function resizeWidth() {
        scope.$watch(scope.getWindowWidth, function (newValue) {
          if (newValue.width < 769) {
            scope.responsiveClass = 'body-small';
          } else {
            scope.responsiveClass = null;
          }
        }, true);
      }

      window.bind('resize', function () {
        scope.$apply();
      });
    }
  };
}

function minimalizaSidebar() {
  return {
    restrict: 'A',
    template: '<a class="navbar-minimalize minimalize-styl-2 btn btn-primary " href="" ng-click="minimalize()">' +
    '<i class="fa fa-bars"></i></a>',
    controller: ['$scope', function ($scope) {
      $scope.minimalize = function () {
        var body = $('body');
        body.toggleClass('mini-navbar');
        if (!body.hasClass('mini-navbar') || body.hasClass('body-small')) {
          $('#side-menu').hide();
          setTimeout(
            function () {
              $('#side-menu').fadeIn(500);
            }, 100);
        } else if (body.hasClass('fixed-sidebar')) {
          $('#side-menu').hide();
          setTimeout(
            function () {
              $('#side-menu').fadeIn(500);
            }, 300);
        } else {
          $('#side-menu').removeAttr('style');
        }
      };
    }]
  };
}
