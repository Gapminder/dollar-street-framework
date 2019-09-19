angular.module('job')
  .controller('OnboardController', ['_', '$scope', 'OnboardingService', function (_, $scope, OnboardingService) {
    $scope.loadPage = true;
    $scope.isHideWelcomeHeaderButtom = true;

    $scope.tableHeader = [{
      name: 'Baloon name',
      class: 'col-md-2 background-white'
    }, {
      name: 'Header',
      class: 'col-md-3 background-white'
    }, {
      name: 'Baloon text',
      class: 'col-md-6 background-white'
    }, {
      name: '',
      class: 'col-md-1 background-white'
    }];

    $scope.tableHeaderForOnboardingHeader = [{
      name: 'Welcome header',
      class: 'col-md-12 background-white'
    }];

    /* eslint-disable */
    $scope.tinymceOptions = {
      plugins: 'link image code autoresize media paste',
      toolbar: 'formatselect | bold, italic, underline, strikethrough | alignleft, aligncenter, alignright, alignjustify | bullist, numlist, outdent, indent',
      height: 300
    };
    /* eslint-enable */

    OnboardingService.getTips(function (err, data) {
      if (err) {
        console.error(err);
        return;
      }

      $scope.welcomeHeader = _.find(data, {name: 'welcomeHeader'});
      $scope.baloons = _.difference(data, [$scope.welcomeHeader]);
      $scope.originalWelcomeHeader = angular.copy($scope.welcomeHeader);

      $scope.loadPage = false;
    });

    $scope.saveOnboarding = function (baloon, data) {
      if (!baloon._id) {
        return;
      }

      var query = data;

      if (!query) {
        query = {
          description: baloon.description,
          name: baloon.name,
          link: baloon.link
        };
      }

      var options = {
        params: {id: baloon._id},
        body: {
          header: query.header || '',
          description: query.description,
          link: {text: query.linkText, href: query.linkHref}
        }
      };

      OnboardingService.editTips(options, function (err) {
        if (err) {
          console.log(err);
        }

        if ($scope.originalWelcomeHeader._id === baloon._id) {
          $scope.welcomeHeader = baloon;
          $scope.originalWelcomeHeader = angular.copy($scope.welcomeHeader);
          $scope.isHideWelcomeHeaderButtom = true;
        }
      });
    };

    $scope.$watch('welcomeHeader', function (object) {
      if (!$scope.originalWelcomeHeader || !object) {
        return;
      }

      $scope.isHideWelcomeHeaderButtom = angular.equals($scope.originalWelcomeHeader, object);
    }, true);
  }]);
