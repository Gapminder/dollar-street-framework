angular
  .module('job')
  .directive('iboxTools', [iboxTools]);

/**
 * iboxTools - Directive for iBox tools elements in right corner of ibox
 */
function iboxTools() {
  return {
    restrict: 'A',
    scope: true,
    templateUrl: '/components/directives/ibox-tools/ibox-tools.template.html',
    controller: ['$scope', '$element', function ($scope, $element) {
      $scope.showhide = function () {
        var ibox = $element.parent();
        var icon = $element.find('i:first');

        // Toggle icon from up to down
        icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
        ibox.toggleClass('open');
      };
    }]
  };
}
