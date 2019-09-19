angular.module('job')
  .factory('ProfileService', ['async', '$resource', '$http', 'cmsConfig', function (async, $resource, $http, cmsConfig) {
    var ProfileResource = $resource('', {}, {
      // serverUrl
      getProfile: {method: 'GET', url: cmsConfig.serverApi + '/profile'},
      updateProfile: {method: 'POST', url: cmsConfig.serverApi + '/profile/info'},
      getCountries: {method: 'GET', url: cmsConfig.serverApi + '/countries'},
      checkUsername: {method: 'GET', url: cmsConfig.serverApi + '/check-username'},
      getUserTypes: {method: 'GET', url: cmsConfig.serverApi + '/users/types'}
    });

    function ProfileService() {
    }

    ProfileService.prototype.preparationInitData = function (callback) {
      async.parallel({
        profile: function (cb) {
          ProfileResource.getProfile(function (res) {
            return cb(res.error, res.data);
          });
        },
        countries: function (cb) {
          ProfileResource.getCountries(function (res) {
            return cb(res.error, res.data);
          });
        },
        userTypes: function (cb) {
          ProfileResource.getUserTypes(function (res) {
            return cb(res.error, res.data);
          });
        }
      }, callback);
    };

    ProfileService.prototype.updateProfile = function (query, cb) {
      ProfileResource.updateProfile(query, function (res) {
        cb(res.error, res.data);
      });
    };

    ProfileService.prototype.updateAvatar = function (query, cb) {
      var formData = this.wrapDataToRequest(query);

      $http.post(cmsConfig.serverApi + '/profile/avatar', formData, {
        /*eslint-disable*/
        withCredentials: true,
        headers: {'Content-Type': undefined},
        transformRequest: angular.identity
        /*eslint-enable*/
      }).success(function (res) {
        cb(res.error, res.data);
      });
    };

    ProfileService.prototype.wrapDataToRequest = function (data) {
      var formData = new FormData();

      formData.append('x', data.x);
      formData.append('y', data.y);
      formData.append('width', data.width);
      formData.append('height', data.height);
      formData.append('file', data.file);

      return formData;
    };

    ProfileService.prototype.checkUsername = function (query, cb) {
      ProfileResource.checkUsername(query, function (res) {
        cb(res.error, res.data);
      });
    };

    return new ProfileService();
  }]);
