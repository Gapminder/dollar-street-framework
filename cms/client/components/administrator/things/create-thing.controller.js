angular.module('job')
  .controller('CreateThingController', ['_',
    '$scope', '$modalInstance', 'ThingService', 'object', 'title',
    function (_, $scope, $modalInstance, ThingService, object, title) {
      $scope.validName = true;
      $scope.validIcon = true;
      var checkObj = {};
      $scope.categories = object.categories;
      $scope.title = title;
      $scope.category = {};
      $scope.relatedThings = {};
      $scope.showRating = false;

      if (object.editThing) {
        $scope.thingsListForRelatedThings = _.filter(object.thingsListForRelatedThings, function (thing) {
          return thing._id !== object.editThing._id;
        });
        object.things = _.without(object.things, object.editThing);
        $scope.name = object.editThing.thingName;
        $scope.plural = object.editThing.plural;
        $scope.description = object.editThing.thingDescription;
        $scope.list = object.editThing.list;
        $scope.synonymous = object.editThing.synonymous;
        $scope.tags = object.editThing.tags;
        $scope.relatedThings.selected = object.editThing.relatedThings;
        $scope.category.selected = object.editThing.thingCategory;
        $scope.iconImage = object.editThing.icon;

        if (object.editThing.rating > 0) {
          $scope.showRating = true;
          $scope.rating = object.editThing.rating;
        }
      } else {
        $scope.list = 'white';
        $scope.thingsListForRelatedThings = object.thingsListForRelatedThings;
      }

      var validationForName = _.debounce(ThingService.validationForName, 500);

      $scope.checkedName = function (name) {
        checkObj.name = name;
        checkObj.things = $scope.thingsListForRelatedThings;

        validationForName(checkObj, function (valid) {
          $scope.isValidName = valid;
          $scope.$apply();
        });
      };

      $scope.checkedCategory = function (category) {
        if (!category.length) {
          $scope.isValidCategory = false;
          return;
        }

        $scope.isValidCategory = true;
      };

      $scope.checkedRelatedThings = function (things) {
        if (!things.length) {
          $scope.isValidRelatedThing = false;
          return;
        }

        $scope.isValidRelatedThing = true;
      };

      $scope.checkedPlural = function (plural) {
        if (!plural) {
          $scope.isValidPlural = false;
          return;
        }

        $scope.isValidPlural = true;
      };

      $scope.submitThing = function (name, plural, description, synonymous, category, relatedThings, tags, rating, list) {
        var options = {
          name: name,
          plural: plural,
          description: description,
          synonymous: synonymous,
          category: category,
          relatedThings: relatedThings,
          tags: tags,
          rating: rating,
          list: list,
          editThing: object.editThing,
          things: $scope.thingsListForRelatedThings,
          icon: $scope.fileToUpload
        };

        ThingService.validationForName(options, function (isValidName) {
          if (isValidName && relatedThings && plural && category && $scope.validIcon) {
            ThingService.save(options, function (res) {
              if (res.data.icon) {
                res.data.icon += '?ds=' + Date.now();
              }

              if (!options.icon && options.editThing && !options.editThing.icon) {
                res.data.icon = '';
              }
              object.things.push(res.data);
              $modalInstance.close({things: _.sortBy(object.things, 'thingName')});
            });
          } else {
            if (!isValidName) {
              $scope.isValidName = false;
            }

            if (!category) {
              $scope.isValidCategory = false;
            }

            if (!relatedThings) {
              $scope.isValidRelatedThing = false;
            }

            if (!plural) {
              $scope.isValidPlural = false;
            }

            $scope.errorEnter = true;
          }
        });
      };

      $scope.removeIcon = function () {
        ThingService.removeIcon(object.editThing._id, function (res) {
          if (res.error) {
            return console.log(res.error);
          }
          $scope.iconImage = object.editThing.icon = null;
        });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
