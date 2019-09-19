angular.module('job').controller('CountriesController', [
  '_',
  '$scope',
  'CountriesService',
  function(_, $scope, CountriesService) {
    $scope.sort = { country: 1 };
    $scope.searchCountries = {};
    $scope.countries = [];

    $scope.getPagingCountries = function(limit) {
      if ($scope.loadPaging) {
        return;
      }

      if (!$scope.loadPage) {
        $scope.loadPaging = true;
      }

      const skip = $scope.countries.length;
      const query = _.assign({ skip: skip, limit: limit }, preparationQuery());

      CountriesService.getPagingCountries(query, function(err, countries) {
        if (err) {
          return console.error(err);
        }

        Array.prototype.push.apply($scope.countries, countries);

        $scope.loadPaging = false;

        if ($scope.loadPage) {
          $scope.loadPage = false;
        }
      });
    };

    $scope.saveCountryFields = function(data, location) {
      CountriesService.saveCountryDescription(location, function(err) {
        if (err) {
          return console.error(err);
        }
      });
    };

    $scope.checkAliasField = function(data) {
      if (!data) {
        return 'This field must not be empty!';
      } else if (/[^a-zA-Z., ]/.test(data)) {
        return 'Fill characters Aa-Zz';
      }
    };

    $scope.checkLatLngFields = function(data) {
      if (!data && data !== 0) {
        return 'This field must not be empty!';
      } else if (/[^0-9.,]/.test(data)) {
        return 'Fill numbers 0-9';
      }
    };

    const filterWatch = _.debounce(watchFilter, 300);

    $scope.$watchGroup(['searchCountries.country', 'sort'], filterWatch);

    function watchFilter(n, o) {
      if (!_.isEqual(n, o)) {
        $scope.countries.length = 0;
        $scope.loadPage = true;
        $scope.getPagingCountries(18);
      }
    }

    $scope.tableHeader = [
      {
        name: 'Country',
        class: 'col-md-2 sorting up'
      },
      {
        name: 'Alias',
        class: 'col-md-2 sorting'
      },
      {
        name: 'lat',
        class: 'col-md-1 sorting'
      },
      {
        name: 'lng',
        class: 'col-md-1 sorting'
      },
      {
        name: 'Description',
        class: 'col-md-6 background-white'
      }
    ];

    function preparationQuery() {
      const query = {};

      if ($scope.searchCountries.country) {
        query.search = $scope.searchCountries.country;
      }

      if ($scope.sort) {
        query.sort = $scope.sort;
      }

      return query;
    }
  }
]);
