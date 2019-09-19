angular.module('job')
  .controller('CreateNewPlaceTypeController', ['_', 'PlaceTypesService',
    '$scope', '$http', '$modalInstance', 'object', 'title', 'cmsConfig',
    function (_, PlaceTypesService, $scope, $http, $modalInstance, object, title, cmsConfig) {
      var placeType = object.placeType;
      $scope.title = title;

      if (object.editType) {
        $scope.index = _.findIndex(object.placeType, {_id: object.editType._id});
        placeType = _.filter(object.placeType, function (type) {
          return type._id !== object.editType._id;
        });
        $scope.name = object.editType.name;
      }

      function validNameFunc(name) {
        if (name) {
          if (object.editType && name === object.editType.name) {
            $scope.iconNameTrue = true;
            $scope.iconNameFalse = false;
            return;
          }

          PlaceTypesService.getPlaceTypesNames(function (err, placeType) {
            if (err) {
              console.log(err);
            }

            var findType = _.find(placeType, function (type) {
              return type.name.toLowerCase() === name.toLowerCase();
            });

            if (!findType) {
              $scope.iconNameTrue = true;
              $scope.iconNameFalse = false;
            } else {
              $scope.iconNameFalse = true;
              $scope.iconNameTrue = false;
            }
          });
        } else {
          $scope.iconNameFalse = true;
          $scope.iconNameTrue = false;
        }

        if (!arguments[1]) {
          $scope.$apply();
        }
      }

      var validName = _.debounce(validNameFunc, 300);
      $scope.checkedName = function (name) {
        validName(name);
      };

      $scope.submit = function (name) {
        if (!$scope.iconNameTrue) {
          var noDebounce = true;
          validNameFunc(name, noDebounce);
        }

        if (!object.editType && name && $scope.iconNameTrue) {
          $http.post(cmsConfig.serverApi + '/placesType/new', {name: name}).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            placeType.push(data.data);

            $modalInstance.close({placeType: _.sortBy(placeType, 'name')});
          });
        }

        if (object.editType && name && $scope.iconNameTrue) {
          if (object.editType.name !== name) {
            $http.post(cmsConfig.serverApi + '/placesType/edit/' + object.editType._id, {name: name}).success(function (data) {
              if (data.error) {
                console.error(data.error);
                return;
              }

              object.editType.name = name;
              placeType.push(object.editType);
              $modalInstance.close({placeType: _.sortBy(placeType, 'name')});
            });
          }

          if (object.editType.name === name) {
            placeType.splice($scope.index, 0, object.editType);
            $modalInstance.close({placeType: placeType});
          }
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
