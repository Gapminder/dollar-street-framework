angular.module('job')
  .factory('UsersService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    // serverUrl
    var UsersResource = $resource(cmsConfig.serverApi + '/users/:id', {}, {
      getUsers: {method: 'GET', url: cmsConfig.serverApi + '/users'},
      removeUser: {method: 'DELETE'}
    });

    function UsersService() {
    }

    UsersService.prototype.getUsers = function (cb) {
      UsersResource.getUsers(function (res) {
        return cb(res.error, res.data);
      });
    };

    UsersService.prototype.removeUser = function (query, cb) {
      UsersResource.removeUser({id: query._id}, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new UsersService();
  }]);
