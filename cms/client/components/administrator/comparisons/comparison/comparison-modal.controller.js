angular.module('job')
  .controller('ComparisonModalController', [
    '$scope', '$modalInstance', 'ComparisonService', 'comparisonType', 'comparison', 'things', 'title',
    function ($scope, $modalInstance, ComparisonService, comparisonType, comparison, things, title) {
      $scope.comparison = _.cloneDeep(comparison);

      for (var i = 0; i < 2; i++) {
        if ($scope.comparison.snippetImages.length < 2) {
          $scope.comparison.snippetImages.push({});
        }

        if ($scope.comparison.comparisonImages.length < 2) {
          $scope.comparison.comparisonImages.push({});
        }
      }

      $scope.things = things;
      $scope.title = title;

      $scope.reverse = true;
      $scope.messageError = {};

      $scope.findThingName = function (comparison) {
        var thing = _.findWhere($scope.things, {_id: comparison.thing});
        comparison.thingName = thing.thingName;
      };

      $scope.addUrl = function (comparison, field, url, index) {
        var options = {
          comparison: comparison,
          field: field,
          url: url,
          index: index
        };

        ComparisonService.addImageUrl(options, function (err, data) {
          if (err) {
            console.error(err);
            $scope.messageError[field + index] = true;
            return;
          }

          _.merge($scope.comparison, data);
          delete $scope.messageError[field + index];
        });
      };

      $scope.removeFieldComparison = function (comparison, field, url, index) {
        var options = {
          comparison: comparison,
          field: field,
          url: url,
          index: index
        };

        _.merge($scope.comparison, ComparisonService.removeImageUrl(options));
      };

      $scope.addField = function (field) {
        field.push({});
      };

      $scope.submitComparison = function (comparison) {
        if (!_.isEmpty($scope.messageError)) {
          return;
        }

        var saveOrCreate = !comparison._id ?
          ComparisonService.createComparison :
          ComparisonService.saveComparison;

        saveOrCreate(comparison, comparisonType, function (err, data) {
          if (err) {
            console.error(err);

            if (data && data.field) {
              $scope.messageError.blankFields = true;
            }
            return;
          }

          $scope.messageError = null;
          $scope.comparison._id = $scope.comparison._id || data.comparison._id;
          $modalInstance.close({comparison: $scope.comparison});
        });
      };

      $scope.close = function () {
        $scope.messageError = null;
        $modalInstance.dismiss();
      };
    }]);
