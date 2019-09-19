angular
  .module('cms.globals', [
    '_',
    'async'
  ]);

angular.module('job', [
  'ui.router',
  'ui.bootstrap',
  'infinite-scroll',
  'angularUtils.directives.uiBreadcrumbs',
  'xeditable',
  'ngTagsInput',
  'ngSanitize',
  'angularFileUpload',
  'ui.select',
  'photo.area',
  'infinite-scroll',
  'uiGmapgoogle-maps',
  'cms.globals',
  'ngResource',
  'dndLists',
  'cgNotify',
  'ui.tinymce',
  'ngCropper'
])
.run(['$rootScope', '$http', '$window', 'cmsConfig', function ($rootScope, $http, $window, cmsConfig) {
  $rootScope.safeApply = function () {
    if (!$rootScope.$$phase) {
      $rootScope.$apply();
    }
  };

  angular.element(document).ready(function () {
    $http.get(cmsConfig.serverApi + '/sockets').success(function (res) {
      window.io = window.io({port: +res.port});
    });
  });
}]);

angular.module('job')
  .config(['$stateProvider', '$httpProvider', '$urlRouterProvider', '$locationProvider', '$provide', 'cmsConfig',
    function ($stateProvider, $httpProvider, $urlRouterProvider, $locationProvider, $provide, cmsConfig) {
      'use strict';

      $httpProvider.defaults.withCredentials = true;

      $provide.value('amazonUrl', S3_SERVER);

      $locationProvider.html5Mode(true);

      $urlRouterProvider.otherwise('/');

      $stateProvider
        .state('login', {
          url: '/login',
          templateUrl: '/components/account/login.html',
          controller: 'LoginController',
          onEnter: function () {
            angular.element('body').addClass('gray-bg');
          },
          onExit: function () {
            angular.element('body').removeClass('gray-bg');
          }
        })
        .state('registration', {
          url: '/registration',
          templateUrl: '/components/account/registration.html',
          controller: 'RegistrationController',
          onEnter: function () {
            angular.element('body').addClass('gray-bg');
          },
          onExit: function () {
            angular.element('body').removeClass('gray-bg');
          }
        })
        .state('slideshow', {
          url: '/admin/slideshow/?row?amount?country?place?category?thing?rating?income?photographer?date?oneThing?onePlace',
          templateUrl: '/components/slideshow/slideshow.html',
          resolve: {
            authentication: ['$http', '$state', function ($http, $state) {
              $http.get(cmsConfig.serverApi + '/authorize').success(function (res) {
                if (!res.hasUser) {
                  $state.go('login');
                }
              });
            }]
          },
          controller: 'SlideshowController',
          onEnter: function () {
            angular.element('body').addClass('gray-bg slideshow');
          },
          onExit: function () {
            angular.element('body').removeClass('gray-bg slideshow');
          }
        });
    }]);
