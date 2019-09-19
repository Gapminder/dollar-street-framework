angular
  .module('job')
  .controller('ComparisonController', [
    '$scope', '$stateParams', '$modal', 'ComparisonService',
    function ($scope, $stateParams, $modal, ComparisonService) {
      $scope.comparisonType = $stateParams.comparisonType;
      $scope.loadPage = true;
      $scope.comparisons = [];

      $scope.nextComparisons = function (limit) {
        if ($scope.loadPaging) {
          return;
        }

        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }

        var skip = $scope.comparisons.length;
        var query = _.assign({
          skip: skip,
          limit: limit,
          type: $scope.comparisonType
        }, preparationQuery());

        ComparisonService.getComparisonsPaging(query, function (err, list) {
          if (err) {
            console.error(err);
            return;
          }

          Array.prototype.push.apply($scope.comparisons, list);
          $scope.loadPaging = false;

          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      $scope.tableHeader = [{
        name: 'Images',
        class: 'col-md-3 background-white'
      }, {
        name: 'Name',
        alias: 'title',
        class: 'col-md-4 sorting up'
      }, {
        name: 'Thing',
        class: 'col-md-2 background-white'
      }, {
        name: 'Status',
        class: 'col-md-1 background-white'
      }, {
        name: '',
        class: 'col-md-2 background-white'
      }];

      $scope.sort = {title: 1};
      var filterWatch = _.debounce(watchFilter, 300);

      $scope.$watchGroup(['search.name', 'sort'], filterWatch);

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.comparisons.length = 0;
          $scope.loadPage = true;
          $scope.nextComparisons(18);
        }
      }

      function preparationQuery() {
        var query = {};

        if ($scope.search) {
          query.title = $scope.search.name;
        }

        if ($scope.sort) {
          query.sort = $scope.sort;
        }

        return query;
      }

      ComparisonService.getThings(function (err, things) {
        if (err) {
          console.error(err);
          return;
        }

        $scope.things = things;
      });

      $scope.addComparison = function () {
        var newItem = {
          title: '',
          thingId: '',
          snippetImages: [{}, {}],
          comparisonImages: [{}, {}],
          imageText: '',
          imageLinkText: '',
          image: '',
          heading: '',
          subHeading: '',
          isHidden: true
        };

        $scope.editComparison(newItem);
      };

      $scope.removeComparison = function (comparison) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/comparisons/comparison/remove-comparison.tempate.html',
          controller: ['$scope', '$modalInstance', 'comparisonType', 'comparisonName', removeComparison],
          size: 'sm',
          resolve: {
            comparisonType: function () {
              return $scope.comparisonType;
            },
            comparisonName: function () {
              return comparison.title;
            }
          }
        });

        modalInstance.result.then(function () {
          ComparisonService.removeComparison(comparison._id, $scope.comparisonType, function (err) {
            if (err) {
              console.error(err);
              return;
            }

            var index = _.findIndex($scope.comparisons, {_id: comparison._id});

            if (index !== -1) {
              $scope.comparisons.splice(index, 1);
            }
          });
        });
      };

      function removeComparison($scope, $modalInstance, comparisonType, comparisonName) {
        var type = null;

        if (comparisonType === 'similarities') {
          type = 'similarity';
        } else {
          type = 'difference';
        }

        $scope.title = 'Delete ' + type;
        $scope.name = comparisonName;

        $scope.ok = function () {
          $modalInstance.close('ok');
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
      }

      var saveShowOrHideComparison = _.debounce(function (comparison, status) {
        ComparisonService.updateStatusComparison(
          {id: comparison._id, status: status},
          $scope.comparisonType,
          function (err) {
            if (err) {
              console.error(err);
            }
          });
      }, 300);

      $scope.displayStatus = function (comparison, status) {
        comparison.isHidden = status;

        saveShowOrHideComparison(comparison, status);
      };

      $scope.editComparison = function (comparison) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/comparisons/comparison/comparison.modal.template.html',
          controller: 'ComparisonModalController',
          size: 'lg',
          resolve: {
            comparisonType: function () {
              return $scope.comparisonType;
            },
            comparison: function () {
              return comparison;
            },
            things: function () {
              return $scope.things;
            },
            title: function () {
              return !comparison._id ?
              'Create ' + $scope.comparisonType :
              'Edit comparison: <b>' + comparison.title + '</b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          var isUpdated = false;

          _.each($scope.comparisons, function (comparison) {
            if (comparison._id === data.comparison._id) {
              isUpdated = true;
              return _.merge(comparison, data.comparison);
            }
          });

          if (!isUpdated) {
            $scope.comparisons.unshift(data.comparison);
          }
        }, _.noop);
      };
    }]);
