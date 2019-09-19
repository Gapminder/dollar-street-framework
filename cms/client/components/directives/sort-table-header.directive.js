angular
  .module('job')
  .directive('sortTableHeader', [sortTableHeader]);

function sortTableHeader() {
  return {
    restrict: 'E',
    scope: {
      sort: '=',
      cells: '=',
      class: '@'
    },
    replace: true,
    template: '<table class="{{::class}}">' +
    '<thead>' +
    '<tr ng-click="changeSortable($event)">' +
    '<th ng-repeat="ceil in ::cells" class="{{::ceil.class}}" alias="{{::ceil.alias}}">{{::ceil.name}}</th>' +
    '</tr>' +
    '</thead>' +
    '</table>',
    link: function (scope) {
      var containerScroll = angular.element('.container-scroll');
      containerScroll.siblings('.table-header').css({
        'padding-right': containerScroll[0].offsetWidth - containerScroll[0].scrollWidth + 'px'
      });

      scope.changeSortable = function (event) {
        var target = angular.element(event.target);

        if (!target.hasClass('sorting')) {
          return;
        }

        scope.sort = {};
        var keyWord = target.text().toLowerCase();

        if (target.attr('alias')) {
          keyWord = target.attr('alias');
        }

        scope.sort[keyWord] = 1;

        if (target.hasClass('up')) {
          target.parent().children().removeClass('up down');
          target.addClass('down');
          scope.sort[keyWord] = -1;
          return;
        }

        if (!target.hasClass('up')) {
          target.parent().children().removeClass('up down');
          target.addClass('up');
        }
      };
    }
  };
}
