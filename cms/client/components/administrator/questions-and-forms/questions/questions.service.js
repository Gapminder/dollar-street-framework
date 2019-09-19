angular.module('job')
  .factory('QuestionsService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    // serverUrl
    var QuestionsResource = $resource('', {}, {
      getPagingQuestions: {method: 'GET', url: cmsConfig.serverApi + '/questions/next'},
      getForms: {method: 'GET', url: cmsConfig.serverApi + '/forms'},
      isUniqueValidation: {method: 'GET', url: cmsConfig.serverApi + '/questions/validate/:fieldName/isUnique'}
    });

    function QuestionsService() {
    }

    QuestionsService.prototype.nextQuestions = function (query, cb) {
      QuestionsResource.getPagingQuestions(query, function (res) {
        return cb(res.error, res.data);
      }, cb);
    };

    QuestionsService.prototype.getForms = function (cb) {
      QuestionsResource.getForms(function (res) {
        return cb(res.error, res.data);
      }, cb);
    };

    QuestionsService.prototype.isUniqueValidation = function (fieldName, value, cb) {
      QuestionsResource.isUniqueValidation({fieldName: fieldName, value: value}, function (res) {
        return cb(res.error, res.data);
      }, cb);
    };
    return new QuestionsService();
  }]);
