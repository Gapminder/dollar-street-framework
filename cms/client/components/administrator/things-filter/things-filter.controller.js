angular.module('job')
  .controller('ThingsFilterController', ['_', '$scope', 'ThingsFilterService',
    function (_, $scope, ThingsFilterService) {
      $scope.isShow = false;
      $scope.loadPage = true;

      $scope.tableHeaderPopularThings = [{
        name: 'Popular things',
        class: 'col-md-12 background-white'
      }];

      $scope.tableHeaderAllTopics = [{
        name: 'All topics',
        class: 'col-md-12 background-white'
      }];

      ThingsFilterService.preparationInitData(function (err, data) {
        if (err) {
          return console.log(err);
        }

        $scope.popularThings = _.clone(data.thingsList);
        $scope.popularThings.selected = data.thingsFilterData.selectedPopular;
        $scope.allTopics = data.thingsList;
        $scope.allTopics.selected = data.thingsFilterData.selectedAllTopics;

        $scope.loadPage = false;
      });

      $scope.checkValid = function (things, type) {
        $scope.isShow = true;

        if (type === 'popular') {
          $scope.isValidPopular = !!things.length;
        }

        if (type === 'all') {
          $scope.isValidAllTopics = !!things.length;
        }
      };

      $scope.submitThing = function (popular, allTopics) {
        var options = {
          popular: popular,
          allTopics: allTopics
        };

        if (allTopics.length && popular.length) {
          ThingsFilterService.save(options, function (err) {
            if (err) {
              return console.error(err);
            }
          });
        } else {
          $scope.isValidPopular = !!popular.length;
          $scope.isValidAllTopics = !!allTopics.length;
          $scope.errorEnter = true;
        }

        $scope.isShow = false;
      };
    }]);
