angular.module('job')
  .controller('PlaceTypeController', ['_', '$scope', '$http', '$modal', 'PlaceTypesService', 'cmsConfig',
    function (_, $scope, $http, $modal, PlaceTypesService, cmsConfig) {
      initController();
      $scope.nextPlaceTypes = function (limit) {
        if ($scope.loadPaging) {
          return;
        }
        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }
        var skip = $scope.placeType.length;
        var query = _.assign({skip: skip, limit: limit}, preparationQuery());
        PlaceTypesService.nextPlaceTypes(query, function (err, list) {
          if (err) {
            console.log(err);
          }
          Array.prototype.push.apply($scope.placeType, list);
          $scope.loadPaging = false;
          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      var filterWatch = _.debounce(watchFilter, 300);

      $scope.$watchGroup(['searchPlaceType.name', 'sort'], filterWatch);

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.placeType.length = 0;
          $scope.loadPage = true;
          $scope.nextPlaceTypes(18);
        }
      }

      function preparationQuery() {
        var query = {};
        if ($scope.searchPlaceType) {
          query.name = $scope.searchPlaceType.name;
        }
        if ($scope.sort) {
          query.sort = $scope.sort;
        }
        return query;
      }

      $scope.editPlaceType = function (type) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/placeType/createNewPlaceType.html',
          controller: 'CreateNewPlaceTypeController',
          size: 'lg',
          resolve: {
            object: function () {
              return {placeType: $scope.placeType, editType: type};
            },
            title: function () {
              return 'Edit place type: <b>' + type.name + '</b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.placeType = data.placeType;
        }, function () {
        });
      };

      $scope.removePlaceType = function (type) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/placeType/remove-placeType.template.html',
          controller: ['$scope', '$modalInstance', 'name', removePlaceTypeModalController],
          size: 'sm',
          resolve: {
            name: function () {
              return type.name;
            }
          }
        });

        modalInstance.result.then(function () {
          $http.post(cmsConfig.serverApi + '/placesType/remove/' + type._id).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            $scope.placeType = _.filter($scope.placeType, function (placeType) {
              return placeType._id !== type._id;
            });
          });
        }, function () {
        });
      };

      function removePlaceTypeModalController($scope, $modalInstance, name) {
        $scope.name = name;

        $scope.ok = function () {
          $modalInstance.close({success: true});
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
      }

      $scope.createNewPlaceType = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/placeType/createNewPlaceType.html',
          controller: 'CreateNewPlaceTypeController',
          size: 'lg',
          resolve: {
            object: function () {
              return {placeType: $scope.placeType};
            },
            title: function () {
              return '<b>Create new Place Type</b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.placeType = data.placeType;
        }, function () {
        });
      };

      function initController() {
        $scope.predicate = 'name';
        $scope.reverse = true;
        $scope.loadPage = true;
        $scope.placeType = [];
        $scope.tableHeader = [
          {
            name: 'Name',
            class: 'col-md-11 sorting up'
          },
          {
            name: '',
            class: 'col-md-1 background-white'
          }
        ];
        $scope.sort = {name: 1};
      }
    }]);
