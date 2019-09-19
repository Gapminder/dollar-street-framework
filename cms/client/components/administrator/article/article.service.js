angular.module('job')
  .factory('ArticlesService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    var ArticlesResource = $resource('', {}, {
      // serverUrl
      getArticle: {method: 'GET', url: cmsConfig.serverApi + '/article/:id'},
      createArticle: {method: 'POST', url: cmsConfig.serverApi + '/article'},
      updateArticle: {method: 'PUT', url: cmsConfig.serverApi + '/article'}
    });

    function ArticlesService() {
    }

    ArticlesService.prototype.getArticle = function (articleId, cb) {
      ArticlesResource.getArticle({id: articleId}, function (res) {
        cb(res.error, res.data);
      });
    };

    ArticlesService.prototype.createArticle = function (query, cb) {
      ArticlesResource.createArticle(query, function (res) {
        cb(res.error, res.data);
      });
    };

    ArticlesService.prototype.updateArticle = function (query, cb) {
      ArticlesResource.updateArticle(query, function (res) {
        cb(res.error, res.data);
      });
    };

    return new ArticlesService();
  }]);
