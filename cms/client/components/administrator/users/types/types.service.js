angular.module('job')
  .factory('UsersTypesService', ['async', '$resource', 'cmsConfig', function (async, $resource, cmsConfig) {
    // serverUrl
    var UsersTypesResource = $resource(cmsConfig.serverApi + '/users/types', {}, {
      getTypes: {method: 'GET'},
      editPublic: {method: 'PUT', url: cmsConfig.serverApi + '/users/types/public'},
      editPosition: {method: 'PUT', url: cmsConfig.serverApi + '/users/types/position'}
    });

    function UsersTypesService() {
    }

    UsersTypesService.prototype.getTypes = function (cb) {
      UsersTypesResource.getTypes(function (res) {
        return cb(res.error, res.data);
      });
    };

    UsersTypesService.prototype.editPublic = function (query, cb) {
      UsersTypesResource.editPublic(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    UsersTypesService.prototype.editPosition = function (query, cb) {
      UsersTypesResource.editPosition(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new UsersTypesService();
  }]);
