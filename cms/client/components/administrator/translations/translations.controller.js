angular.module('job')
  .controller('TranslationsController', ['_', '$scope', 'TranslationsService', '$modal',
    function (_, $scope, TranslationsService, $modal) {
      $scope.loadPage = true;
      $scope.disabledExport = false;
      $scope.disabledUpdateLanguagesList = false;

      $scope.tableHeader = [{
        name: 'Name',
        class: 'col-md-4 background-white'
      }, {
        name: 'Alias',
        class: 'col-md-4 background-white'
      }, {
        name: 'Public',
        class: 'col-md-2 background-white'
      }, {
        name: 'Import Translations',
        class: 'col-md-2 background-white'
      }];

      TranslationsService.getLanguages(function (err, languages) {
        if (err) {
          return console.error(err);
        }

        $scope.languages = languages;
        $scope.loadPage = false;
      });

      $scope.exportLanguagesFile = function () {
        $scope.disabledExport = true;

        let modalInstance = $modal.open({
          templateUrl: '/components/administrator/translations/export/export.template.html',
          controller: 'ExportController',
          size: 'sm'
        });

        modalInstance.result.then(function () {
          $scope.disabledExport = false;
        }, function () {
          $scope.disabledExport = false;
        });
      };

      $scope.updateLanguagesList = function () {
        TranslationsService.updateLanguagesList(function (err, languages) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.languages = languages;
          $scope.originalLanguages = angular.copy(languages);
          $scope.disabledUpdateLanguagesList = false;
        });
      };

      $scope.updateLanguageStatus = function (languageId, status) {
        let options = {
          query: {id: languageId},
          params: {isPublic: status}
        };

        TranslationsService.updateLanguage(options, function (err) {
          if (err) {
            console.error(err);
          }
        });
      };

      $scope.importTranslations = function (language) {
        let modalInstance = $modal.open({
          templateUrl: '/components/administrator/translations/import/import.template.html',
          controller: 'ImportController',
          size: 'sm',
          resolve: {
            params: function () {
              return {
                language: language
              };
            }
          }
        });

        modalInstance.result.then(function () {
        });
      };

      $scope.updateLanguageAlias = function (languageId, alias) {
        let options = {
          query: {id: languageId},
          params: {alias: alias}
        };

        TranslationsService.updateLanguage(options, function (err) {
          if (err) {
            console.error(err);
          }
        });
      };

      $scope.dropType = function () {
        let elmTbodyTr = angular.element('tbody tr');
        let hasClassActive = elmTbodyTr.hasClass('active');

        if (hasClassActive) {
          elmTbodyTr.removeClass('active');
        }

        if (angular.equals($scope.originalLanguages, $scope.languages)) {
          $scope.language = null;
          return;
        }

        let query = _.map(this.languages, (data) => {
          let queryData = {};
          queryData.id = data._id;
          queryData.position = data.position;
          return queryData;
        });

        TranslationsService.updateLanguagePosition({languages: query}, function (err) {
          if (err) {
            console.error(err);
            return;
          }

          $scope.language = null;
          $scope.originalLanguages = angular.copy($scope.languages);
        });
      };

      $scope.overType = function (language) {
        if ($scope.language && $scope.language !== language) {
          let position = $scope.language.position;

          _.forEach($scope.languages, function (originLanguage) {
            if (originLanguage.code !== $scope.language.code) {
              return;
            }

            if (language.position > 0) {
              $scope.language.position = language.position;

              language.position = position;
            }
          });
        }
      };

      $scope.putType = function (event, language) {
        if ($scope.language) {
          return;
        }

        let elm = angular.element(event.target);
        let className = _.head(elm).className;

        if (className.indexOf('not-dragging') !== -1) {
          return;
        }

        if (language.code !== 'en') {
          event.preventDefault();

          elm.parent('tr').addClass('active');

          $scope.language = language;
        }        
      };
    }]);
