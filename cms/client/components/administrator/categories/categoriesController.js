angular.module('job')
  .controller('CategoriesController', ['_', '$scope', '$modal', '$state', '$http', 'CategoriesService', 'cmsConfig',
    function (_, $scope, $modal, $state, $http, CategoriesService, cmsConfig) {
      initController();

      CategoriesService.getPlacesType(function (err, list) {
        if (err) {
          console.log(err);
          return;
        }

        list.unshift({name: 'All'});
        $scope.placesType = list;
        $scope.placeType = $scope.placesType[0];
      });

      $scope.nextCategories = function (limit) {
        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }

        var skip = $scope.categories.length;
        var query = _.assign({skip: skip, limit: limit}, preparationQuery());

        CategoriesService.nextCategories(query, function (err, list) {
          if (err) {
            console.log(err);
            return;
          }

          Array.prototype.push.apply($scope.categories, list);

          $scope.loadPaging = false;

          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      $scope.createCategory = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/categories/createAndEditCategory.html',
          controller: 'CreateAndEditCategoryController',
          size: 'lg',
          resolve: {
            object: function () {
              return {categories: $scope.categories};
            },
            things: function () {
              return $scope.things;
            },
            title: function () {
              return '<b>Create category</b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.categories.push(data.category);
          $scope.categories = _.sortBy($scope.categories, 'name');
        }, function () {
        });
      };

      $scope.editCategory = function (category) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/categories/createAndEditCategory.html',
          controller: 'CreateAndEditCategoryController',
          size: 'lg',
          resolve: {
            object: function () {
              return {categories: $scope.categories, editCategory: category};
            },
            things: function () {
              return $scope.things;
            },
            title: function () {
              return 'Edit category: <b>' + category.name + '</b>';
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.categories = _.sortBy($scope.categories, 'name');
        }, function () {
        });
      };

      $scope.removeCategory = function (category) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/categories/remove-category.template.html',
          controller: [
            '$scope', '$modalInstance', 'category',
            function ($scope, $modalInstance, category) {
              $scope.name = category.name;
              $scope.ok = function () {
                $modalInstance.close('done');
              };
              $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
              };
            }],
          size: 'sm',
          resolve: {
            category: function () {
              return category;
            }
          }
        });

        modalInstance.result.then(function () {
          $http.post(cmsConfig.serverApi + '/category/remove/' + category._id).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            var index = $scope.categories.indexOf(category);
            $scope.categories.splice(index, 1);
          });
        }, function () {
        });
      };

      var filterWatch = _.debounce(watchFilter, 300);

      $scope.$watchGroup(['filterList', 'searchCategory.name', 'sort'], filterWatch);

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.categories.length = 0;
          $scope.loadPage = true;
          $scope.nextCategories(18);
        }
      }

      function preparationQuery() {
        var query = {};

        if ($scope.filterList !== 'all') {
          query.list = $scope.filterList;
        }

        if ($scope.searchCategory) {
          query.name = $scope.searchCategory.name;
        }

        if ($scope.sort) {
          query.sort = $scope.sort;
        }

        return query;
      }

      function initController() {
        $scope.loadPage = true;
        $scope.categories = [];
        $scope.filterList = 'all';
        $scope.sort = {name: 1};

        $scope.tableHeader = [{
          name: 'Name',
          class: 'col-md-3 sorting up'
        }, {
          name: 'Description',
          class: 'col-md-3 background-white'
        }, {
          name: 'Rating',
          class: 'col-md-2 sorting'
        }, {
          name: 'Places type',
          class: 'col-md-3 background-white'
        }, {
          name: '',
          class: 'col-md-1 background-white'
        }];

        CategoriesService.getThings(function (err, things) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.things = things;
        });
      }
    }]);
