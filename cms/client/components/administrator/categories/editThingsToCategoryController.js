angular.module('job')
  .controller('EditThingsToCategoryController', [
    '$scope', '$modalInstance', '$http', '$modal', 'object', 'otherCategory',
    function ($scope, $modalInstance, $http, $modal, object, otherCategory) {
      $scope.categoryName = object.category.name;

      $scope.things = _.filter(object.things, function (thing) {
        return thing.thingCategory.indexOf(object.category._id) === -1;
      });

      $scope.selectThings = _.filter(object.things, function (thing) {
        return thing.thingCategory.indexOf(object.category._id) !== -1;
      });

      var initialStateCategoryThings = _.compact($scope.selectThings);

      $scope.addThingToCategory = function (thing) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/categories/remove-add-things-to-category.template.html',
          controller: ['$scope', '$modalInstance', 'object', function ($scope, $modalInstance, object) {
            $scope.thingName = object.thingName;
            $scope.categoryName = object.categoryName;
            $scope.title = 'Add thing';
            $scope.ok = function () {
              $modalInstance.close({done: true});
            };

            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };
          }],
          size: 'sm',
          resolve: {
            object: function () {
              return {thingName: thing.thingName, categoryName: $scope.categoryName};
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.things = _.without($scope.things, thing);
          $scope.selectThings.push(thing);
        }, function () {
        });
      };

      $scope.removeThingCategory = function (thing) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/categories/remove-add-things-to-category.template.html',
          controller: ['$scope', '$modalInstance', 'object', function ($scope, $modalInstance, object) {
            $scope.thingName = object.thingName;
            $scope.categoryName = object.categoryName;
            $scope.title = 'Remove thing';
            $scope.ok = function () {
              $modalInstance.close({done: true});
            };

            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };
          }],
          size: 'sm',
          resolve: {
            object: function () {
              return {thingName: thing.thingName, categoryName: $scope.categoryName};
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.selectThings = _.without($scope.selectThings, thing);
          $scope.things.push(thing);
        }, function () {
        });
      };

      $scope.ok = function () {
        var newSelectedThings = _.filter($scope.selectThings, function (selectedThing) {
          if (selectedThing.thingCategory.indexOf(object.category._id) === -1) {
            return selectedThing;
          }
        });

        var deleteThings = _.difference(initialStateCategoryThings, $scope.selectThings);
        _.each(deleteThings, function (thing) {
          _.each(thing.thingCategory, function (thingCategory, index) {
            if (thingCategory === object.category._id) {
              if (thing.thingCategory.length > 1) {
                thing.thingCategory.splice(index, 1);
              } else {
                thing.thingCategory[index] = otherCategory._id;
              }
            }
          });
        });
        _.each(newSelectedThings, function (thing) {
          thing.thingCategory.push(object.category._id);
        });

        var postThings = _.union(deleteThings, newSelectedThings);

        $modalInstance.close({
          things: object.things,
          selectedThings: $scope.selectThings,
          postThings: postThings
        });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
