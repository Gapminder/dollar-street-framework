angular.module('job')
  .controller('UsersController', ['_', '$scope', '$modal', 'UsersService',
    function (_, $scope, $modal, UsersService) {
      $scope.loadPage = true;
      $scope.search = {};
      $scope.tableHeader = [{
        name: 'Avatar',
        class: 'col-md-1 background-white'
      }, {
        name: 'Full name',
        class: 'col-md-3 background-white'
      }, {
        name: 'Role',
        class: 'col-md-2 background-white'
      }, {
        name: 'Email',
        class: 'col-md-2 background-white'
      }, {
        name: 'Contentful ID',
        class: 'col-md-2 background-white'
      }, {
        name: '',
        class: 'col-md-2 background-white'
      }];

      UsersService.getUsers(function (err, users) {
        if (err) {
          return console.error(err);
        }

        $scope.users = users;
        $scope.loadPage = false;
      });

      $scope.removeUser = function (user) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/users/remove/remove-user.template.html',
          controller: 'RemoveUserController',
          size: 'lg',
          resolve: {
            user: function () {
              return user;
            }
          }
        });

        modalInstance.result.then(function () {
          UsersService.removeUser(user, function (err) {
            if (err) {
              return console.error(err);
            }

            $scope.users = $scope.users.filter(function (item) {
              return item._id !== user._id;
            });
          });
        });
      };
    }]);
