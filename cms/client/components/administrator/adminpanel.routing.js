angular.module('job')
  .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', 'cmsConfig',
    function ($stateProvider, $urlRouterProvider, $locationProvider, cmsConfig) {
      'use strict';

      $urlRouterProvider.when('/', '/places');

      $stateProvider
        .state('admin', {
          abstract: true,
          template: '<ui-view/>',
          resolve: {
            authentication: ['$http', '$state', function ($http, $state) {
              // serverUrl
              $http.get(cmsConfig.serverApi + '/authorize').then(function (res) {
                if (!res.data.hasUser) {
                  $state.go('login');
                }
              });
            }]
          },
          controller: 'AdminController'
        })
        .state('admin.app', {
          url: '/',
          templateUrl: '/components/administrator/admin.html'
        })
        .state('admin.app.onboarding', {
          url: 'onboarding',
          templateUrl: '/components/administrator/onboarding/onboarding.html',
          controller: 'OnboardController'
        })
        .state('admin.app.street', {
          url: 'street',
          templateUrl: '/components/administrator/street/street.html',
          controller: 'StreetController'
        })
        .state('admin.app.places', {
          url: 'places',
          templateUrl: '/components/administrator/places/places.html',
          controller: 'AdminPlacesController'
        })
        .state('admin.app.profile', {
          url: 'profile',
          templateUrl: '/components/administrator/profile/profile.html',
          controller: 'ProfileController'
        })
        .state('admin.app.place', {
          url: 'place/:id',
          templateUrl: '/components/administrator/places/place/place.html',
          controller: 'AdminPlaceController'
        })
        .state('admin.app.placeType', {
          url: 'place-type',
          templateUrl: '/components/administrator/placeType/placeType.html',
          controller: 'PlaceTypeController'
        })
        .state('admin.app.questions', {
          url: 'questions',
          templateUrl: '/components/administrator/questions-and-forms/questions/questions.html',
          controller: 'QuestionsController'
        })
        .state('admin.app.form', {
          url: 'forms',
          templateUrl: '/components/administrator/questions-and-forms/forms/forms.html',
          controller: 'FormsController'
        })
        .state('admin.app.things', {
          url: 'things',
          templateUrl: '/components/administrator/things/things.html',
          controller: 'AdminThingsController'
        })
        .state('admin.app.thingsFilter', {
          url: 'things-filter',
          templateUrl: '/components/administrator/things-filter/things-filter.template.html',
          controller: 'ThingsFilterController'
        })
        .state('admin.app.footer', {
          url: 'footer',
          templateUrl: '/components/administrator/footer/footer.template.html',
          controller: 'FooterController'
        })
        .state('admin.app.users', {
          url: 'users',
          templateUrl: '/components/administrator/users/users.template.html',
          controller: 'UsersController'
        })
        .state('admin.app.user', {
          url: 'users/:id',
          templateUrl: '/components/administrator/users/user/user.template.html',
          controller: 'UserController'
        })
        .state('admin.app.usersTypes', {
          url: 'users-types',
          templateUrl: '/components/administrator/users/types/types.template.html',
          controller: 'UsersTypesController'
        })
        .state('admin.app.categories', {
          url: 'categories',
          templateUrl: '/components/administrator/categories/categories.html',
          controller: 'CategoriesController'
        })
        .state('admin.app.comparison', {
          url: 'comparisons/:comparisonType',
          templateUrl: '/components/administrator/comparisons/comparison/comparison.html',
          controller: 'ComparisonController'
        })
        .state('admin.app.csv', {
          url: 'csv',
          templateUrl: '/components/administrator/csv/csv.html'
        })
        .state('admin.app.countries', {
          url: 'countries',
          templateUrl: '/components/administrator/countries/countries.template.html',
          controller: 'CountriesController'
        })
        .state('admin.app.info', {
          url: 'info',
          templateUrl: '/components/administrator/info/info.template.html',
          controller: 'InfoController'
        })
        .state('admin.app.strings', {
          url: 'strings',
          templateUrl: '/components/administrator/strings/strings.template.html',
          controller: 'StringsController'
        })
        .state('admin.app.media', {
          url: 'images',
          templateUrl: '/components/administrator/media/media.html',
          controller: 'AllMediaAdminController'
        })
        .state('admin.app.article', {
          url: 'article-thing/:id',
          templateUrl: '/components/administrator/article/article.template.html',
          controller: 'ArticleController'
        })
        .state('admin.app.languages', {
          url: 'languages',
          templateUrl: '/components/administrator/translations/translations.template.html',
          controller: 'TranslationsController'
        })
        .state('admin.app.filter', {
          url: 'images/?row?amount?country?place?category?thing?rating?income?photographer?date?oneThing?onePlace',
          templateUrl: '/components/administrator/media/media.html',
          onEnter: ['$stateParams', function ($stateParams) {
            var param = $stateParams;
            var storage = {
              country: param.country === 'All' ? {name: 'All'} : {name: param.country},
              place: param.place === 'All' ? {name: 'All'} : {name: param.place},
              category: param.category === 'All' ? {name: 'All'} : {name: param.category},
              thing: param.thing === 'All' ? {thingName: 'All'} : {thingName: param.thing},
              rating: param.rating === 'All' ? {star: 'All'} : {
                star: getRating(param.rating),
                value: param.rating
              },
              income: param.income === 'All' ? {range: 'All'} : {
                range: getIncome(param.income),
                value: param.income
              },
              photographer: param.photographer === 'All' ? {name: 'All'} : {name: param.photographer},
              date: param.date === 'All' ? null : param.date
            };
            window.localStorage.imagesFiltres = JSON.stringify(storage);
            function getIncome(value) {
              var range;
              switch (value) {
                case '1':
                  range = '< 5';
                  break;
                case '2':
                  range = '5 - 9';
                  break;
                case '3':
                  range = '10 - 24';
                  break;
                case '4':
                  range = '25 - 49';
                  break;
                case '5':
                  range = '50 - 100';
                  break;
                case '6':
                  range = '> 100';
                  break;
                default :
                  break;
              }
              return range;
            }

            function getRating(value) {
              var star;
              switch (value) {
                case '1':
                  star = '= 1';
                  break;
                case '2':
                  star = '= 2';
                  break;
                case '3':
                  star = '= 3';
                  break;
                case '4':
                  star = '= 4';
                  break;
                case '5':
                  star = '= 5';
                  break;
                case '6':
                  star = '> 1';
                  break;
                case '7':
                  star = '> 2';
                  break;
                case '8':
                  star = '> 3';
                  break;
                case '9':
                  star = '> 4';
                  break;
                case '10':
                  star = '< 2';
                  break;
                case '11':
                  star = '< 3';
                  break;
                case '12':
                  star = '< 4';
                  break;
                case '13':
                  star = '< 5';
                  break;
                default :
                  break;
              }
              return star;
            }
          }],
          onExit: function () {
            window.localStorage.removeItem('imagesFiltres');
          },
          controller: 'AllMediaAdminController'
        });
    }]);
