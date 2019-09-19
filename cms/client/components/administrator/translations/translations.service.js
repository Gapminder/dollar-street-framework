angular.module('job')
  .factory('TranslationsService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    let TranslationsResource = $resource('', {}, {
      // serverUrl
      getLanguages: {method: 'GET', url: cmsConfig.serverApi + '/languages'},
      importTranslations: {method: 'GET', url: cmsConfig.serverApi + '/import-translations/:code'},
      exportTranslations: {method: 'GET', url: cmsConfig.serverApi + '/export-translations'},
      updateLanguagesList: {method: 'GET', url: cmsConfig.serverApi + '/update-languages-list'},
      updateLanguage: {method: 'POST', url: cmsConfig.serverApi + '/update-language/:id'},
      updateLanguagePosition: {method: 'POST', url: cmsConfig.serverApi + '/update-language-position'}
    });

    function TranslationsService() {
    }

    TranslationsService.prototype.getLanguages = function (cb) {
      TranslationsResource.getLanguages(function (res) {
        return cb(res.error, res.data);
      });
    };

    TranslationsService.prototype.importTranslations = function (query, cb) {
      TranslationsResource.importTranslations({code: query.code}, function (res) {
        return cb(res.error, res.data);
      });
    };

    TranslationsService.prototype.exportTranslations = function (cb) {
      TranslationsResource.exportTranslations(function (res) {
        return cb(res.error, res.data);
      });
    };

    TranslationsService.prototype.updateLanguagesList = function (cb) {
      TranslationsResource.updateLanguagesList(function (res) {
        return cb(res.error, res.data);
      });
    };

    TranslationsService.prototype.updateLanguage = function (options, cb) {
      TranslationsResource.updateLanguage(options.query, options.params, function (res) {
        return cb(res.error, res.data);
      });
    };

    TranslationsService.prototype.updateLanguagePosition = function (query, cb) {
      TranslationsResource.updateLanguagePosition(query, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new TranslationsService();
  }]);
