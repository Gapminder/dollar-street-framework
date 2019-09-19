angular.module('job').controller('CreateAndEditPlaceController', [
  '$scope',
  '$modalInstance',
  '$http',
  'object',
  'title',
  'isAdmin',
  'cmsConfig',
  function($scope, $modalInstance, $http, object, title, isAdmin, cmsConfig) {
    function initVariable(object) {
      $scope.places = object.places;
      $scope.isAdmin = isAdmin;
      $scope.editPlaces = null;
      $scope.allPlacesName = object.allPlacesName;
      $scope.allPhotographers = object.photographers;

      $scope.photographerFind = [];

      $scope.countries = object.countries;
      $scope.placesType = object.placesType;
      $scope.title = title;
      $scope.country = {};
      $scope.type = {};

      $scope.errorEnter = false;
      $scope.iconNameFalse = false;
      $scope.iconCountryFalse = false;
      $scope.iconPhotographerFalse = false;
      $scope.photographer = {};
      $scope.incomeQualityRating = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
        { value: 5 },
        { value: 6 },
        { value: 7 },
        { value: 8 },
        { value: 9 },
        { value: 10 }
      ];
      $scope.incomeQuality = $scope.incomeQualityRating[$scope.incomeQualityRating.length - 1].value;
    }

    initVariable(object);

    function initEditPlace(object) {
      $scope.editPlaces = object.editPlaces;
      $scope.places = _.without($scope.places, $scope.editPlaces);

      var placeInfoCountry = ($scope.placeInfoCountry = $scope.editPlaces.country.name);

      var placeInfoPhotographer = $scope.editPlaces.photographer;

      var country = _.findWhere($scope.countries, { name: placeInfoCountry });

      var type = _.findWhere($scope.placesType, { _id: $scope.editPlaces.type });

      if (!country) {
        $scope.checkedFalse = true;
      }

      $scope.name = $scope.editPlaces.name;
      $scope.initEditName = $scope.editPlaces.name;
      $scope.description = $scope.editPlaces.description;
      $scope.income = $scope.editPlaces.income;
      $scope.photographer = { selected: _.find($scope.allPhotographers, { name: placeInfoPhotographer }) };
      $scope.country.selected = country;
      $scope.type.select = type;
      $scope.rating = $scope.editPlaces.rating;
      $scope.list = $scope.editPlaces.list;
      $scope.incomeQuality = $scope.editPlaces.incomeQuality;
      $scope.aboutData = $scope.editPlaces.aboutData;
    }

    if (object.editPlaces) {
      initEditPlace(object);
    } else {
      $scope.list = 'black';
      $scope.rating = 3;
    }

    function validNameFunc(name) {
      if ($scope.initEditName && $scope.initEditName === name) {
        $scope.iconNameTrue = true;
        $scope.iconNameFalse = false;
        return;
      }
      if (name) {
        var findPlace = _.find($scope.allPlacesName, function(placeName) {
          return placeName.toLowerCase() === name.toLowerCase();
        });
        if (!findPlace) {
          $scope.iconNameTrue = true;
          $scope.iconNameFalse = false;
        } else {
          $scope.iconNameFalse = true;
          $scope.iconNameTrue = false;
        }
      } else {
        $scope.iconNameFalse = true;
        $scope.iconNameTrue = false;
      }
      if (!arguments[1]) {
        $scope.$apply();
      }
    }

    var validName = _.debounce(validNameFunc, 500);
    $scope.checkedName = function(name) {
      validName(name);
    };

    function isNumeric(num) {
      return num >= 0 || num < 0;
    }

    $scope.checkedCountry = function(country) {
      $scope.iconCountryFalse = country ? false : true;
    };

    $scope.checkedType = function(type) {
      $scope.iconTypeFalse = type ? false : true;
    };

    $scope.checkedPhotographer = function(photographer) {
      $scope.iconPhotographerFalse = photographer ? false : true;
    };

    $scope.submitPlace = function(
      name,
      description,
      country,
      type,
      photographer,
      income,
      incomeQuality,
      rating,
      list,
      aboutData
    ) {
      function assignments(name, description, type, income, incomeQuality, rating, list, aboutData) {
        $scope.editPlaces.name = name;
        $scope.editPlaces.description = description;
        $scope.editPlaces.income = Number(income);
        $scope.editPlaces.incomeQuality = Number(incomeQuality);
        $scope.editPlaces.rating = rating;
        $scope.editPlaces.list = list;
        $scope.editPlaces.type = type._id;
        $scope.editPlaces.aboutData = aboutData;
      }

      var noDebounce = true;

      if (object.editPlaces) {
        validNameFunc(name, noDebounce);
      }

      if (!$scope.isAdmin) {
        photographer = true;
      }

      if (name && country && type && photographer && isNumeric(income) && incomeQuality && $scope.iconNameTrue) {
        if (!object.editPlaces) {
          $http
            .post(cmsConfig.serverApi + '/places/new', {
              name: name,
              description: description,
              country: country._id,
              type: type,
              photographer: photographer,
              income: Number(income),
              incomeQuality: Number(incomeQuality),
              rating: rating,
              list: list,
              aboutData: aboutData
            })
            .success(function(data) {
              if (data.error) {
                console.error(data.error);
                return;
              }

              $modalInstance.close({ place: data.data, create: true });
            });
        } else {
          assignments(name, description, type, income, incomeQuality, rating, list, aboutData);

          var updatePlace = {
            author: $scope.editPlaces.author,
            name: name,
            description: description,
            rating: rating,
            list: list,
            type: type._id,
            incomeQuality: Number(incomeQuality),
            aboutData: aboutData,
            income: Number(income),
            country: country._id
          };

          if ($scope.isAdmin) {
            updatePlace.author = photographer._id;
          }

          $http
            .post(cmsConfig.serverApi + '/places/edit/' + $scope.editPlaces._id, updatePlace)
            .success(function(data) {
              if (data.error) {
                console.error(data.error);
                return;
              }

              $scope.places.push($scope.editPlaces);
              $modalInstance.close({ places: $scope.places, name: name });
            });
        }
      } else {
        validNameFunc(name, noDebounce);
        $scope.checkedCountry(country);
        $scope.checkedType(type);
        $scope.checkedPhotographer(photographer);
        $scope.errorEnter = true;
      }
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }
]);
