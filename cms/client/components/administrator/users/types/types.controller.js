angular.module('job')
  .controller('UsersTypesController', ['$scope', '$modal', '$http', 'UsersTypesService',
    function ($scope, $modal, $http, UsersTypesService) {
      $scope.loadPage = true;

      $scope.tableHeader = [{
        name: 'Type',
        class: 'col-md-10 background-white'
      }, {
        name: 'Public',
        class: 'col-md-2 background-white'
      }];

      var getUserTypes = function () {
        UsersTypesService.getTypes(function (err, types) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.types = types;
          $scope.originalTypes = angular.copy(types);
          $scope.loadPage = false;
        });
      };

      getUserTypes();

      $scope.createNewUserType = function() {
        let maxUserTypePosition = _.max($scope.types, function (obj) {
          return obj.position;
        });

        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/users/types/createAndEditUserType.html',
          controller: 'CreateAndEditUserTypeController',
          size: 'lg',
          resolve: {
            id: function () {
              return null;
            },
            mode: function () {
              return 'create';
            },
            title: function () {
              return '<b>Create new user type</b>';
            },
            name: function () {
              return null;
            },
            position: function () {
              return maxUserTypePosition.position + 1;
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.types.push(data.data);
        }, function () {});
      };

      $scope.editUserType = function (type) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/users/types/createAndEditUserType.html',
          controller: 'CreateAndEditUserTypeController',
          size: 'lg',
          resolve: {
            id: function () {
              return type._id;
            },
            mode: function () {
              return 'edit';
            },
            title: function () {
              return '<b>Edit user type</b>';
            },
            name: function () {
              return type.name;
            },
            position: function () {
              return null;
            }
          }
        });

        modalInstance.result.then(function (data) {
          const id = data.id;
          const name = data.name;      
          
          let userType = _.find($scope.types, '_id', id);
          userType.name = name;
        }, function () {});
      }

      $scope.removeUserType = function (type) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/users/types/removeUserType.html',
          controller: 'RemoveUserTypeController',
          size: 'sm',
          resolve: {
            type: function () {
              return type;
            }
          }
        });

        modalInstance.result.then(function () {
          var index = $scope.types.indexOf(type);
          $scope.types.splice(index, 1);
        }, function () {
        });
      };

      $scope.editTypePublic = function (type) {
        UsersTypesService.editPublic(type, function (err) {
          if (err) {
            console.error(err);
          }
        });
      };

      $scope.putType = function (event, type) {
        if ($scope.type) {
          return;
        }

        var elm = angular.element(event.target);
        var className = elm[0].className;

        if (className.indexOf('not-dragging') === -1) {
          elm.parent('tr').addClass('active');
          event.preventDefault();
          $scope.type = type;
        }
      };

      $scope.overType = function (event, type) {
        if ($scope.type && $scope.type !== type) {
          var position = $scope.type.position;

          _.forEach($scope.types, function (originType) {
            if (originType._id === $scope.type._id) {
              $scope.type.position = type.position;
            }
          });

          type.position = position;
        }
      };

      $scope.dropType = function () {
        var hasClassActive = angular.element('tbody tr').hasClass('active');

        if (hasClassActive) {
          angular.element('tbody tr').removeClass('active');
        }

        if (angular.equals($scope.originalTypes, $scope.types)) {
          $scope.type = null;

          return;
        }

        UsersTypesService.editPosition({types: $scope.types}, function (err) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.type = null;
          $scope.originalTypes = angular.copy($scope.types);
        });
      };
    }]);
