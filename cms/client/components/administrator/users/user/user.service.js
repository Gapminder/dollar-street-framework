angular.module('job')
  .factory('UserService', ['async', '$resource', '$http', 'cmsConfig', function (async, $resource, $http, cmsConfig) {
    var UserResource = $resource('', {}, {
      // serverUrl
      getUser: {method: 'GET', url: cmsConfig.serverApi + '/user/:id'},
      updateUser: {method: 'PUT', url: cmsConfig.serverApi + '/user/:id'},
      getCountries: {method: 'GET', url: cmsConfig.serverApi + '/countries'},
      getUserTypes: {method: 'GET', url: cmsConfig.serverApi + '/users/types'}
    });

    function UserService() {
    }

    UserService.prototype.preparationInitData = function (query, cb) {
      async.parallel({
        profile: getProfile(query),
        countries: function (cb) {
          UserResource.getCountries(function (res) {
            return cb(res.error, res.data);
          });
        },
        userTypes: function (cb) {
          UserResource.getUserTypes(function (res) {
            return cb(res.error, res.data);
          });
        }
      }, cb);
    };

    UserService.prototype.updateUser = function (query, cb) {
      UserResource.updateUser({id: query._id}, query, function (res) {
        cb(res.error, res.data);
      });
    };

    UserService.prototype.updateAvatar = function (query, cb) {
      var formData = this.wrapDataToRequest(query);

      $http.post(cmsConfig.serverApi + '/user/avatar', formData, {
        /*eslint-disable*/
        withCredentials: true,
        headers: {'Content-Type': undefined},
        transformRequest: angular.identity
        /*eslint-enable*/
      }).success(function (res) {
        cb(res.error, res.data);
      });
    };

    UserService.prototype.wrapDataToRequest = function (data) {
      var formData = new FormData();

      formData.append('userId', data.userId);
      formData.append('x', data.x);
      formData.append('y', data.y);
      formData.append('width', data.width);
      formData.append('height', data.height);
      formData.append('file', data.file);

      return formData;
    };

    function getProfile(query) {
      return function (cb) {
        UserResource.getUser(query, function (res) {
          return cb(res.error, res.data);
        });
      };
    }

    return new UserService();
  }]);
