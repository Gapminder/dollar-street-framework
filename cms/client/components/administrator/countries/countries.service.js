angular.module('job')
  .factory('CountriesService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    CountriesResource = {};
    // srverUrl
    CountriesResource.getPagingCountries = $resource(cmsConfig.serverApi + '/countries/next', {});
    CountriesResource.saveCountryDescription = $resource(cmsConfig.serverApi + '/countries/description/save');

    function CountriesService() {

    }

    CountriesService.prototype.getPagingCountries = function (query, cb) {
      return CountriesResource.getPagingCountries.get(query, function (res) {
        return cb(res.error, res.data);
      });
    };
    CountriesService.prototype.saveCountryDescription = function (query, cb) {
      return CountriesResource.saveCountryDescription.save({}, query, function (res) {
        return cb(res.error, res.data);
      });
    };
    return new CountriesService();
  }]);
