angular.module('job')
  .controller('AdminPlacesController', [
    '_', '$scope', '$http', '$location', '$modal', '$timeout', 'PlacesService', 'AmazonPath', 'cmsConfig',
    function (_, $scope, $http, $location, $modal, $timeout, PlacesService, AmazonPath, cmsConfig) {
      initController();

      $scope.nextPlaces = function (limit) {
        if ($scope.loadPaging) {
          return;
        }

        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }

        var skip = $scope.places.length;
        var query = _.assign({skip: skip, limit: limit}, preparationQuery());

        if (!query.skip) {
          $scope.places.length = 0;
        }

        PlacesService.nextPlaces(query, function (err, list) {
          if (err) {
            console.log(err);
            return;
          }

          Array.prototype.push.apply($scope.places, list);
          $scope.loadPaging = false;

          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      $scope.confirmForm = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/form/form.template.html',
          controller: 'FormController',
          size: 'lg'
        });

        modalInstance.result.then(function () {
          $scope.editPlace();
        });
      };

      $scope.editPlace = function (place) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/createAndEditPlace.html',
          controller: 'CreateAndEditPlaceController',
          size: 'lg',
          resolve: {
            object: function () {
              return {
                places: $scope.places,
                editPlaces: place,
                placesType: $scope.placesTypeClone,
                allPlacesName: $scope.allPlacesName,
                photographers: $scope.photographers,
                countries: $scope.countries
              };
            },
            title: function () {
              return place ? 'Edit place: <b>' + place.name + '</b>' : '<b>Create new place</b>';
            },
            isAdmin: function () {
              return $scope.isAdmin;
            }
          }
        });

        modalInstance.result.then(function (data) {
          if (data.create) {
            $location.path('/place/' + data.place._id);
          }
        });
      };

      $scope.changePublic = function (place) {
        PlacesService.setPublic({
          _id: place._id,
          list: place.list
        }, function (err) {
          if (err) {
            console.error(err);
          }
        });
      };

      $scope.isPublicMainPage = function (place) {
        PlacesService.setPublicMain({
          _id: place._id,
          isPublic: place.isPublic
        }, function (err) {
          if (err) {
            console.error(err);
          }
        });
      };

      $scope.removePlace = function (place) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/removePlace.html',
          controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
            $scope.title = 'Delete place';
            $scope.placeName = place.name;

            $scope.ok = function () {
              $modalInstance.close('ok');
            };

            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };
          }],
          size: 'sm'
        });

        modalInstance.result.then(function () {
          if (place.isTrash === true) {
            $http.post(cmsConfig.serverApi + '/places/remove/' + place._id).success(function (data) {
              if (data.error) {
                console.error(data.error);
                return;
              }

              var index = $scope.places.indexOf(place);
              $scope.places.splice(index, 1);
              $scope.placesCount--;
            });
          } else {
            $http.post(cmsConfig.serverApi + '/places/isTrash/' + place._id, {isTrash: true}).success(function (data) {
              if (data.err) {
                console.error(data.err);
                return;
              }

              var index = $scope.places.indexOf(place);
              $scope.places.splice(index, 1);
              $scope.placesCount--;
            });
          }
        });
      };

      $scope.excelPopUp = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/excel/excel-popup.html',
          controller: 'ExcelPopUpController',
          size: 'sm'
        });

        modalInstance.result.then(function (data) {
          if (data) {
            location.reload();
          }
        });
      };

      $scope.reestablish = function (place) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/removePlace.html',
          controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
            $scope.title = 'Reestablish place';
            $scope.placeName = place.name;

            $scope.ok = function () {
              $modalInstance.close('ok');
            };

            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };
          }],
          size: 'sm'
        });

        modalInstance.result.then(function () {
          $http.post(cmsConfig.serverApi + '/places/isTrash/' + place._id, {isTrash: false}).success(function (data) {
            if (data.err) {
              console.error(data.err);
              return;
            }

            var index = $scope.places.indexOf(place);
            $scope.places.splice(index, 1);
            $scope.placesCount--;
          });
        });
      };

      var filterWatch = _.debounce(watchFilter, 500);

      $scope.$watchGroup(['type.obj._id', 'filterList', 'searchPlace.name', 'sort'], filterWatch);

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.places.length = 0;
          $scope.loadPage = true;
          $scope.nextPlaces(12);

          PlacesService.getPlacesCount(preparationQuery(), function (err, count) {
            if (err) {
              console.error(err);
              return;
            }
            $scope.placesCount = count.placesCount;
            $scope.countriesCount = count.countriesCount;
          });
        }
      }

      function preparationQuery() {
        var query = {isTrash: false};

        if ($scope.filterList === 'trash') {
          query.isTrash = true;
        } else if ($scope.filterList !== 'all') {
          query.list = $scope.filterList;
        }

        if ($scope.type.obj && $scope.type.obj._id) {
          query.placeTypeId = $scope.type.obj._id;
        }

        if ($scope.searchPlace.name) {
          query.name = $scope.searchPlace.name;
        }
        if ($scope.sort) {
          query.sort = $scope.sort;
        }

        return query;
      }

      function initController() {
        $scope.places = [];
        $scope.loadPage = true;
        $scope.amazonPath = AmazonPath.createPath.bind(AmazonPath);
        $scope.searchPlace = {};
        $scope.filterList = 'all';
        $scope.type = {};

        $scope.tableHeader = [{
          name: 'Portrait',
          class: 'col-md-1 background-white'
        }, {
          name: 'Name',
          class: 'col-md-1 sorting up'
        }, {
          name: 'Country',
          class: 'col-md-1 sorting'
        }, {
          name: 'Income',
          class: 'col-md-1 sorting'
        }, {
          name: 'Images',
          class: 'col-md-1 sorting'
        }, {
          name: 'Thinged',
          class: 'col-md-1 sorting'
        }, {
          name: 'Photographer',
          class: 'col-md-1 sorting'
        }, {
          name: 'Date',
          class: 'col-md-1 sorting'
        }, {
          name: 'Show on main page',
          class: 'col-md-1 sorting',
          alias: 'isPublic'
        }, {
          name: 'Public',
          class: 'col-md-1 sorting',
          alias: 'list'
        }, {
          name: 'Questions',
          class: 'col-md-1 sorting'
        }, {
          name: 'Rating',
          class: 'col-md-1 sorting'
        }, {
          name: '',
          class: 'col-md-1 background-white'
        }];

        $scope.sort = {name: 1};

        PlacesService.getPlacesCount(preparationQuery(), function (err, count) {
          if (err) {
            console.log(err);
            return;
          }
          $scope.placesCount = count.placesCount;
          $scope.countriesCount = count.countriesCount;
        });

        PlacesService.preparationInitData(preparationQuery(), function (err, data) {
          if (err) {
            console.log(err);
            return;
          }

          $scope.placesTypeClone = _.map(data.placesType, _.clone);
          $scope.placesType = data.placesType;
          $scope.placesType.unshift({name: 'All'});
          $scope.allPlacesName = data.allPlacesName;
          $scope.photographers = data.photographers;
          $scope.countries = data.countries;
        });
      }

      $scope.editAboutData = function () {
        $modal.open({
          templateUrl: '/components/administrator/places/about-data/about-data.template.html',
          controller: 'AboutDataController'
        });
      };
    }]);
