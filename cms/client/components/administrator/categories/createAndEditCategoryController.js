angular.module('job')
  .controller('CreateAndEditCategoryController', [
    '$scope', '$modalInstance', '$http', 'object', 'things', '$modal', 'title', 'cmsConfig',
    function ($scope, $modalInstance, $http, object, things, $modal, title, cmsConfig) {
      var categories = object.categories;
      var editCategory;
      var postThings = [];
      $scope.title = title;
      var categoryOther = null;

      $http.get(cmsConfig.serverApi + '/category/other').success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        categoryOther = data.data;

        if (!categoryOther) {
          $http.post(cmsConfig.serverApi + '/category/new', {
            name: 'Other',
            description: '',
            list: 'white',
            rating: 3
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            categoryOther = _.findWhere(data.data, {name: 'Other'});
          });
        }
      });

      function editsCategory() {
        if (object.editCategory) {
          $scope.ifTingsCategory = true;
          editCategory = object.editCategory;
          categories = _.without(categories, editCategory);
          $scope.things = things;

          $scope.selectThings = _.filter($scope.things, function (thing) {
            return thing.thingCategory.indexOf(editCategory._id) !== -1;
          });

          $scope.name = editCategory.name;
          $scope.description = editCategory.description;
          $scope.list = editCategory.list;
          $scope.rating = editCategory.rating;
        } else {
          $scope.list = 'white';
          $scope.rating = 3;
        }
      }

      editsCategory();

      function validNameFunc(name) {
        if (name) {
          var findCategory = _.find(categories, function (category) {
            return category.name.toLowerCase() === name.toLowerCase();
          });
          if (!findCategory) {
            $scope.iconNameTrue = true;
            $scope.iconNameFalse = false;
          } else {
            $scope.iconNameFalse = true;
            $scope.iconNameTrue = false;
          }
        } else {
          $scope.iconNameFalse = true;
          $scope.iconNameTrue = false;
        }
        if (!arguments[1]) {
          $scope.$apply();
        }
      }

      var validName = _.debounce(validNameFunc, 500);
      $scope.checkedName = function (name) {
        validName(name);
      };
      $scope.submitCategory = function (name, description, list, rating) {
        var noDebounce = true;
        if (object.editCategory) {
          validNameFunc(name, noDebounce);
        }
        if (name && $scope.iconNameTrue) {
          if (object.editCategory) {
            editCategory.name = name;
            editCategory.description = description;
            editCategory.list = list;
            editCategory.rating = rating;

            $http.post(cmsConfig.serverApi + '/category/edit/' + editCategory._id, {
              name: name,
              description: description,
              list: list,
              rating: rating
            }).success(function (res) {
              if (res.error) {
                console.error(res.error);
                return;
              }

              $http.post(cmsConfig.serverApi + '/things/updateCategory', postThings).success(function (data) {
                if (data.error) {
                  console.error(data.error);
                  return;
                }

                $modalInstance.close();
              });
            });
          } else {
            $http.post(cmsConfig.serverApi + '/category/new', {
              name: name,
              description: description,
              list: list,
              rating: rating
            }).success(function (res) {
              $modalInstance.close({category: res.data});
            });
          }
        } else {
          if (!name) {
            $scope.iconNameFalse = true;
          }
          $scope.errorEnter = true;
        }
      };

      $scope.editThingsToCategory = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/categories/editThingsToCategory.html',
          controller: 'EditThingsToCategoryController',
          size: 'md',
          resolve: {
            object: function () {
              return {category: object.editCategory, things: $scope.things};
            },
            otherCategory: function () {
              return categoryOther;
            },
            title: function () {
              return 'Edit things in category: ' + object.editCategory.name;
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.things = data.things;
          $scope.selectThings = data.selectedThings;
          postThings = _.union(postThings, data.postThings);
        }, function () {
        });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
