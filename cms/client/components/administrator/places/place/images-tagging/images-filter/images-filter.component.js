angular.module('job')
  .directive('imagesFilter', ['ImagesFilterService', function (ImagesFilterService) {
    return {
      restrict: 'E',
      scope: {
        placeId: '=',
        isUpdate: '=',
        selectedThing: '='
      },
      templateUrl: '/components/administrator/places/place/images-tagging/images-filter/images-filter.template.html',
      link: function (scope) {
        scope.activeSort = 'thingName';

        scope.$watchCollection('isUpdate', function (value) {
          if (value) {
            getThings();
          }
        });

        getThings();

        scope.selectThing = function (thing) {
          if (scope.selectedThing && scope.selectedThing._id === thing._id) {
            scope.selectedThing = null;

            return;
          }

          scope.selectedThing = thing;
        };

        scope.sortBy = function (field) {
          if (scope.activeSort === field) {
            scope.activeSort = '-' + field;
            return;
          }

          scope.activeSort = field;
        };

        scope.selectCategory = function (category) {
          scope.selectedCategory = category;

          if (category.name === 'All') {
            scope.thingsByCategory = _.clone(scope.things);
            return;
          }

          scope.thingsByCategory = _.filter(_.clone(scope.things), function (thing) {
            return thing.categories.indexOf(category._id) !== -1;
          });
        };

        scope.toggled = function (isOpen) {
          if (isOpen) {
            var dropdownList = document.querySelector('#images-filter .dropdown-menu');

            scope.$applyAsync(function () {
              dropdownList.scrollTop = 0;
            });
          }
        };

        function getThings() {
          ImagesFilterService.getThings({place: scope.placeId}, function (err, data) {
            if (err) {
              console.error(err);
              return;
            }

            scope.things = data.things;
            scope.thingsByCategory = _.clone(scope.things);
            scope.categories = data.categories;
            scope.categories.unshift({name: 'All'});

            scope.selectedCategory = scope.categories[0];
          });
        }
      }
    };
  }]);
