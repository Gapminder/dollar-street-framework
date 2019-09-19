angular.module('job')
  .controller('ArticleController', ['$scope', '$stateParams', 'ArticlesService',
    function ($scope, $stateParams, ArticlesService) {
      var thingId = $stateParams.id;
      $scope.isSave = true;
      $scope.article = {
        shortDescription: '',
        description: ''
      };

      /* eslint-disable */
      $scope.fullDescriptionOptions = {
        plugins: 'link image code autoresize media paste textcolor colorpicker',
        toolbar: 'forecolor, backcolor | fontsizeselect | formatselect | bold, italic, underline, strikethrough | alignleft, aligncenter, alignright, alignjustify | bullist, numlist, outdent, indent',
        fontsize_formats: '8px 10px 12px 14px 18px 24px 36px',
        height: 500
      };
      /* eslint-enable */

      ArticlesService.getArticle(thingId, function (err, data) {
        if (err) {
          console.error(err);
          return;
        }

        $scope.thing = data.thing;

        if (data.article) {
          $scope.article = data.article;
        }

        $scope.originalArticle = angular.copy($scope.article);
      });

      $scope.$watchCollection('article', function (object) {
        if (!$scope.originalArticle || !object) {
          return;
        }

        $scope.isSave = angular.equals($scope.originalArticle, object);
      });

      $scope.save = function (article) {
        if (!article._id) {
          article.thing = thingId;

          ArticlesService.createArticle(article, function (err, newArticle) {
            if (err) {
              console.error(err);
              return;
            }

            $scope.article = newArticle;
            $scope.originalArticle = angular.copy($scope.article);
          });

          return;
        }

        ArticlesService.updateArticle(article, function (err) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.article = article;
          $scope.originalArticle = angular.copy($scope.article);
          $scope.isSave = true;
        });
      };
    }]);
