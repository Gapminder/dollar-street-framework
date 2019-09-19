angular.module('job')
  .controller('AdminThingsController', [
    '_', '$scope', '$http', '$modal', 'ThingsService', 'ThingService', 'AmazonPath', 'cmsConfig',
    function (_, $scope, $http, $modal, ThingsService, ThingService, AmazonPath, cmsConfig) {
      initController();
      $scope.nextThings = function (limit) {
        if ($scope.loadPaging) {
          return;
        }

        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }

        var skip = $scope.things.length;
        var query = _.assign({skip: skip, limit: limit}, preparationQuery());

        ThingsService.nextThings(query, function (err, list) {
          if (err) {
            console.log(err);
            return;
          }
          Array.prototype.push.apply($scope.things, list);

          $scope.loadPaging = false;

          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      $scope.editThing = function (thing) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/things/create-thing.template.html',
          controller: 'CreateThingController',
          size: 'lg',
          resolve: {
            object: function () {
              return {
                things: $scope.things,
                editThing: thing,
                categories: $scope.categories,
                thingsListForRelatedThings: $scope.thingsListForRelatedThings
              };
            },
            title: function () {
              return thing ? 'Edit: <b>' + thing.thingName + '</b>' : '<b>Create new thing</b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.things = data.things;
        });
      };

      $scope.removeThing = function (thing) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/things/remove-thing.template.html',
          controller: 'RemoveThingController',
          size: 'sm',
          resolve: {
            thing: function () {
              return thing;
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.things = _.without($scope.things, data.thing);
        });
      };

      $scope.consumerPageAllImages = function () {
        $http.post(cmsConfig.serverApi + '/consumer/all/images', $scope.consumer).success(function (data) {
          if (data.error) {
            console.error(data);
          }
        });
      };

      var filterWatch = _.debounce(watchFilter, 300);

      $scope.$watchGroup(['predicate', 'filterList', 'searchThings.thingName', 'sort'], filterWatch);

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.things.length = 0;
          $scope.loadPage = true;
          $scope.nextThings(18);
        }
      }

      function preparationQuery() {
        var query = {};

        if ($scope.filterList !== 'all') {
          query.list = $scope.filterList;
        }

        if ($scope.predicate) {
          query.sort = $scope.predicate;
        }

        if ($scope.searchThings) {
          query.thingName = $scope.searchThings.thingName;
        }

        if ($scope.sort) {
          query.sort = $scope.sort;
        }

        return query;
      }

      function initController() {
        $scope.showContent = false;
        $scope.amazonPath = AmazonPath.createPath.bind(AmazonPath);
        $scope.things = [];
        $scope.loadPage = true;
        $scope.predicate = 'thingName';
        $scope.reverse = true;
        $scope.filterList = 'all';
        $scope.sort = {thingName: 1};

        ThingsService.preparationInitData(function (err, data) {
          if (err) {
            return console.log(err);
          }

          if ($scope.isAdmin) {
            $scope.tableHeader = [{
              name: 'Icon',
              class: 'col-md-1 background-white'
            }, {
              name: 'Name',
              alias: 'thingName',
              class: 'col-md-1 sorting up'
            }, {
              name: 'Plural',
              class: 'col-md-1 background-white'
            }, {
              name: 'Description',
              class: 'col-md-2 background-white'
            }, {
              name: 'Rating',
              class: 'col-md-1 sorting'
            }, {
              name: 'Show on main page',
              alias: 'isPublic',
              class: 'col-md-1 sorting'
            }, {
              name: 'Public',
              alias: 'list',
              class: 'col-md-1 sorting'
            }, {
              name: 'Id',
              class: 'col-md-2  background-white'
            }, {
              name: 'Article',
              class: 'col-md-1  background-white'
            }, {
              name: '',
              class: 'col-md-1 background-white'
            }];
          } else {
            $scope.tableHeader = [{
              name: 'Icon',
              class: 'col-md-1 background-white'
            }, {
              name: 'Name',
              alias: 'thingName',
              class: 'col-md-1 sorting up'
            }, {
              name: 'Plural',
              class: 'col-md-1 background-white'
            }, {
              name: 'Description',
              class: 'col-md-3 background-white'
            }, {
              name: 'Rating',
              class: 'col-md-2 sorting'
            }, {
              name: 'Show on main page',
              alias: 'isPublic',
              class: 'col-md-1 sorting'
            }, {
              name: 'Public',
              alias: 'list',
              class: 'col-md-1 sorting'
            }, {
              name: 'Id',
              class: 'col-md-2  background-white'
            }];
          }
          $scope.categories = data.categories;
          $scope.thingsListForRelatedThings = data.things;
          $scope.consumer = data.consumerAllImagesVisibility[0];
          $scope.showContent = true;
        });

        $scope.checkList = _.debounce(editTypeListThing, 500);

        function editTypeListThing(thingId, typeList) {
          var options = {
            _id: thingId,
            list: typeList
          };

          ThingService.editList(options, function (err) {
            if (err) {
              return console.error(err);
            }
          });
        }

        $scope.checkIsMainPage = _.debounce(checkIsMainPage, 500);

        function checkIsMainPage(thingId, isPublic) {
          var options = {
            _id: thingId,
            isPublic: isPublic
          };

          ThingService.editIsMainPage(options, function (err) {
            if (err) {
              return console.error(err);
            }
          });
        }
      }
    }]);
