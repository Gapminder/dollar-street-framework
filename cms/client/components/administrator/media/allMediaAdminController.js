angular.module('job')
  .controller('AllMediaAdminController', [
    '$scope', '$http', '$state', '$stateParams', '$modal', '$timeout', '$window', 'AmazonPath', 'cmsConfig',
    function ($scope, $http, $state, $stateParams, $modal, $timeout, $window, AmazonPath, cmsConfig) {
      $scope.selectImages = {
        isActive: false
      };
      var isEmpty = _.isEmpty($stateParams);
      var cloneParams = _.clone($stateParams);
      var getParams = $stateParams;
      initVariable();
      init();
      selectField();
      getParamsChecked(getParams);
      viewLayout();
      editImages();

      function initVariable() {
        $scope.country = {};
        $scope.place = {};
        $scope.category = {};
        $scope.thing = {};
        $scope.rating = {};
        $scope.income = {};
        $scope.photographer = {};
        $scope.onePlace = {oneThing: true};
        $scope.oneThing = {};
        $scope.amazonPath = AmazonPath.createPath.bind(AmazonPath);
        $scope.imgReload = '?_ds=' + Date.now();

        $scope.allImages = getParams.amount === 'All';

        $scope.boxed = true;
        $scope.row = {};
        $scope.loadRash = true;
        $scope.typeImageView = 'thumb-';
        if (window.localStorage.imagesFiltres) {
          $scope.filtres = JSON.parse(window.localStorage.imagesFiltres);
        }
      }

      function init() {
        $scope.amount = getParams.amount || '100';
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = +$scope.amount;

        $scope.ratings = [
          {star: 'All', value: null},
          {star: '= 1', value: 1},
          {star: '= 2', value: 2},
          {star: '= 3', value: 3},
          {star: '= 4', value: 4},
          {star: '= 5', value: 5},
          {star: '> 1', value: 6},
          {star: '> 2', value: 7},
          {star: '> 3', value: 8},
          {star: '> 4', value: 9},
          {star: '< 2', value: 10},
          {star: '< 3', value: 11},
          {star: '< 4', value: 12},
          {star: '< 5', value: 13}
        ];

        $scope.incomes = [
          {range: 'All', value: null},
          {range: '< 5', value: 1},
          {range: '5 - 9', value: 2},
          {range: '10 - 24', value: 3},
          {range: '25 - 49', value: 4},
          {range: '50 - 100', value: 5},
          {range: '> 100', value: 6}
        ];

        $scope.rows = [
          {row: 1}, {row: 2}, {row: 3}, {row: 4}, {row: 5},
          {row: 6}, {row: 7}, {row: 8}, {row: 9}, {row: 10},
          {row: 11}, {row: 12}, {row: 13}, {row: 14}, {row: 15},
          {row: 16}, {row: 17}, {row: 18}, {row: 19}, {row: 20}
        ];

        $scope.dateOptions = {
          formatYear: 'yy',
          startingDay: 1
        };

        $scope.choseImgArr = [];
        $scope.rotateArr = [];
      }

      function selectField() {
        if (window.localStorage.imagesFiltres) {
          noEmptyQuery();
          formFilterPath();
        }

        if (_.isEmpty(getParams)) {
          emptyQuery();
        }

        function noEmptyQuery() {
          $scope.country.select = $scope.filtres.country;
          $scope.place.select = $scope.filtres.place;
          $scope.category.select = $scope.filtres.category;
          $scope.thing.select = $scope.filtres.thing;
          $scope.rating.select = $scope.filtres.rating;
          $scope.income.select = $scope.filtres.income;
          $scope.photographer.select = $scope.filtres.photographer;
          var dateForParams = $scope.filtres.date && new Date($scope.filtres.date);
          $scope.date = dateForParams && dateForParams.getFullYear() + '-' + (dateForParams.getMonth() + 1) +
            '-' + dateForParams.getDate();
          var oneThing = cloneParams.oneThing || false;
          oneThing = oneThing === 'true';
          var onePlace = cloneParams.onePlace || false;
          onePlace = onePlace === 'true';
          $scope.waitingPhrase = 'Please wait searches by filter .....';
          $scope.oneThing = {
            oneThing: oneThing
          };
          $scope.onePlace = {
            oneThing: onePlace
          };
        }

        function emptyQuery() {
          $scope.country.select = {name: 'All'};
          $scope.place.select = {name: 'All'};
          $scope.category.select = {name: 'All'};
          $scope.thing.select = {thingName: 'All'};
          $scope.rating.select = {star: 'All', value: null};
          $scope.income.select = {range: 'All', value: null};
          $scope.photographer.select = {name: 'All'};
          $scope.waitingPhrase = 'Please select the filter';
        }

        function formFilterPath() {
          var message = [];
          message.push($scope.country.select.name === 'All' ? '' : $scope.country.select.name);
          message.push($scope.place.select.name === 'All' ? '' : $scope.place.select.name);
          message.push($scope.category.select.name === 'All' ? '' : $scope.category.select.name);
          message.push($scope.thing.select.thingName === 'All' ? '' : $scope.thing.select.thingName);
          message.push($scope.rating.select.star === 'All' ? '' : $scope.rating.select.star);
          message.push($scope.income.select.range === 'All' ? '' : $scope.income.select.range);
          message.push($scope.photographer.select.name === 'All' ? '' : $scope.photographer.select.name);
          $scope.filterPath = _.compact(message).join();
        }
      }

      function viewLayout() {
        $scope.selectRow = function (index) {
          cloneParams.row = index;
          $state.go('admin.app.filter', cloneParams);
        };

        $scope.closeBoxed = function () {
          cloneParams.row = null;
          $state.go('admin.app.filter', cloneParams);
        };

        $scope.selectLayout = function (layout) {
          if (!$scope.images || !$scope.images.length || !layout) {
            return;
          }

          if (layout === 'wide') {
            cloneParams.row = 3;
            cloneParams.oneThing = $scope.oneThing.oneThing;
            cloneParams.onePlace = $scope.onePlace.oneThing;
            $state.go('admin.app.filter', cloneParams);
          } else {
            cloneParams.oneThing = $scope.oneThing.oneThing;
            cloneParams.onePlace = $scope.onePlace.oneThing;
            $state.go('slideshow', cloneParams);
          }
        };

        $scope.nextImages = function (num, amountPages) {
          $scope.images = $scope.imagesOriginal.slice((num - 1) * +$scope.amount, num * +$scope.amount);
          if (num === amountPages) {
            $scope.numberDisplayedImages = +$scope.amount * (num - 1) + $scope.images.length;
          } else {
            $scope.numberDisplayedImages = $scope.images.length * num;
          }
          window.scrollTo(0, 0);
        };
      }

      function editImages() {
        $scope.removeChosenImage = function () {
          $scope.choseImgArr = [];
        };

        $scope.choseImg = function (event, id) {
          event.preventDefault();
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if ($scope.choseImgArr.indexOf(id) === -1) {
              $scope.choseImgArr.push(id);
              return;
            }
            $scope.choseImgArr.splice($scope.choseImgArr.indexOf(id), 1);
          }
        };

        $scope.watchImgChosen = function (id) {
          return $scope.choseImgArr.indexOf(id) !== -1;
        };

        $scope.selectAmount = function (amount) {
          if (amount === 'All') {
            $scope.allImages = true;
          } else {
            $scope.allImages = false;
            $scope.itemsPerPage = +amount;

            if ($scope.imagesOriginal) {
              $scope.images = $scope.imagesOriginal.slice(0, +amount);
            }
          }

          $scope.numberDisplayedImages = $scope.images && $scope.images.length;
        };

        $scope.selectAllImages = function (isSelect) {
          if (isSelect) {
            _.each($scope.images, function (image) {
              if ($scope.choseImgArr.indexOf(image._id) === -1) {
                $scope.choseImgArr.push(image._id);
              }
            });
          } else {
            $scope.choseImgArr = [];
          }

          $scope.selectImages.isActive = isSelect;
        };

        $scope.openAllEdit = function () {
          var modalInstance = $modal.open({
            templateUrl: '/components/administrator/media/editMediaModal.html',
            controller: 'EditMediaModalController',
            size: 'lg',
            resolve: {
              choseImgArr: function () {
                return $scope.choseImgArr;
              },
              removeChosenImage: function () {
                return $scope.removeChosenImage;
              },
              startRotate: function () {
                return $scope.startRotate;
              },
              formRotateArr: function () {
                return $scope.formRotateArr;
              },
              displayImage: function () {
                return $scope.displayImage;
              }
            }
          });

          modalInstance.result.then(function () {
            $scope.selectImages.isActive = false;
          });
        };

        $scope.displayImage = function (images, display) {
          images.forEach(function (image) {
            $http.post(cmsConfig.serverApi + '/image/display', {id: image, show: display.display}).success(function () {
            });
          });
        };

        $scope.startRotate = function (images, rotateDegrees) {
          var forRotateImages = [];
          if (cloneParams.row) {
            $scope.images.forEach(function (column) {
              column.image.forEach(function (image) {
                if (images.indexOf(image._id) !== -1) {
                  forRotateImages.push(image);
                }
              });
            });
          } else {
            forRotateImages = $scope.images.filter(function (image) {
              return images.indexOf(image._id) !== -1;
            });
          }

          var num = 0;

          forRotateImages.forEach(function (media) {
            $http.post(cmsConfig.serverApi + '/rotate/' + media._id, {
              media: media,
              rotate: rotateDegrees
            }).success(function () {
              if (num === $scope.rotateArr.length - 1) {
                $scope.rotateArr = [];
                $scope.imgReload = '?_ds=' + Date.now();
              }
              num++;
            });
          });
        };

        $scope.imageIsRotate = function (id) {
          return $scope.rotateArr.indexOf(id) !== -1;
        };

        $scope.formRotateArr = function (arr) {
          $scope.rotateArr = arr.map(function (e) {
            return e;
          });
        };
      }

      function getParamsChecked(getParams) {
        if (!_.isEmpty(getParams)) {
          getParams.mobile = $scope.mobile;
          getParams.tablet = $scope.tablet;
          getParams.country = getParams.country === 'All' ? null : getParams.country;
          getParams.place = getParams.place === 'All' ? null : getParams.place;
          getParams.category = getParams.category === 'All' ? null : getParams.category;
          getParams.thing = getParams.thing === 'All' ? null : getParams.thing;
          getParams.rating = getParams.rating === 'All' ? null : getParams.rating;
          getParams.income = getParams.income === 'All' ? null : getParams.income;
          getParams.photographer = getParams.photographer === 'All' ? null : getParams.photographer;
          getParams.date = getParams.date === 'All' ? null : getParams.date;

          if (getParams.row) {
            $scope.boxed = false;
            $scope.wide = true;
            if (!$scope.mobile && !$scope.tablet && +getParams.row <= 2) {
              $scope.typeImageView = 'tablets-';
            }
          }
        }
      }

      window.io.on('media_update_error', function (err) {
        console.log(err);
      });

      window.io.on('media_update', function (data) {
        if (getParams.row) {
          $scope.images.forEach(function (column) {
            column.image.forEach(function (e) {
              if (e._id !== data._id) {
                return;
              }
              e.things = data.things;
            });
          });
        } else {
          $scope.images.forEach(function (e) {
            if (e._id !== data._id) {
              return;
            }
            e.things = data.things;
          });
        }

        $scope.$apply();
      });

      $http.get(cmsConfig.serverApi + '/admin/filters/images', {
        params: getParams
      }).success(function (res) {
        if (res.data.images && !res.data.images.length) {
          $scope.notFoundImages = true;
        }

        $scope.onePlaceThingChange = function () {
          var place = [];
          var thing = [];
          $scope.images = [];

          if (!$scope.imagesOriginalAll) {
            return;
          }

          $scope.imagesOriginal = $scope.imagesOriginalAll;

          if ($scope.oneThing.oneThing) {
            $scope.imagesOriginal = $scope.imagesOriginal.filter(function (image) {
              var truthy = true;
              image.things.forEach(function (imageThing) {
                if (thing.indexOf(imageThing._id) !== -1) {
                  truthy = false;
                  return;
                }
                thing.push(imageThing._id);
              });
              return truthy;
            });
          }

          if ($scope.onePlace.oneThing) {
            $scope.imagesOriginal = $scope.imagesOriginal.filter(function (image) {
              if (place.indexOf(image.place) === -1) {
                place.push(image.place);
                return true;
              }
              return false;
            });
          }

          $scope.imagesLength = $scope.imagesOriginal.length;

          if (cloneParams.row) {
            var mediaLength = $scope.imagesLength;
            var imagesBox = [];
            var columns = Math.ceil(mediaLength / +cloneParams.row);
            for (var i = 0; i < columns; i++) {
              imagesBox.push({image: []});
            }
            imagesBox.forEach(function (e) {
              e.image = $scope.imagesOriginal.splice(0, +cloneParams.row);
            });
            $scope.imagesOriginal = imagesBox;
            $scope.loadMoreWideLoyout();
          } else {
            $scope.loadMore();
          }
        };

        function addFilterFieldAll() {
          $scope.loadRash = false;
          res.data.places.unshift({name: 'All'});
          res.data.categories.unshift({name: 'All'});
          res.data.things.unshift({thingName: 'All'});
          res.data.photographers.unshift({name: 'All'});
          $scope.countries = res.data.countries;
          $scope.countries.unshift({name: 'All'});
          window.things = $scope.things = res.data.things;
          window.places = $scope.places = res.data.places;
          window.categories = $scope.categories = res.data.categories;
          $scope.photographers = res.data.photographers;
        }

        addFilterFieldAll();

        if (res.data.images) {
          res.data.images.forEach(function (image) {
            res.data.placeIncome.forEach(function (place) {
              if (image.place !== place._id) {
                return;
              }
              image.income = place.income;
            });
          });

          res.data.images.sort($scope.sortByIncome);
          $scope.imagesOriginal = res.data.images;
          $scope.imagesOriginalAll = res.data.images;
        }
        function selectFilterFieldAll() {
          $scope.country.select = {name: 'All'};
          $scope.place.select = {name: 'All'};
          $scope.category.select = {name: 'All'};
          $scope.thing.select = {thingName: 'All'};
          $scope.rating.select = $scope.ratings[0];
          $scope.income.select = $scope.incomes[0];
          $scope.photographer.select = {name: 'All'};
        }

        if (isEmpty) {
          selectFilterFieldAll();
        } else {
          $scope.loadMoreWideLoyout = function (images) {
            var height = window.innerHeight - 40;
            var width = window.innerWidth;
            var heightImage = height / +cloneParams.row;
            var numberImagesRow = Math.round(width / heightImage);

            if (images) {
              if (+cloneParams.row > 5) {
                numberImagesRow *= 2;
              } else {
                numberImagesRow *= 3;
              }
              var imgCount = images.length;
              _.each($scope.imagesOriginal, function (image) {
                if ($scope.images.length <= imgCount + numberImagesRow && images.indexOf(image) === -1) {
                  $scope.images.push(image);
                }
              });
            } else {
              if (+cloneParams.row > 5) {
                numberImagesRow = numberImagesRow *= 2;
              } else {
                numberImagesRow = numberImagesRow *= 3;
              }

              _.each($scope.imagesOriginal, function (image) {
                if ($scope.images.length < numberImagesRow) {
                  $scope.images.push(image);
                }
              });
            }

            $scope.row = {row: cloneParams.row, images: $scope.images.length};
          };

          $scope.loadMore = function (images) {
            if (images) {
              var imgCount = images.length;
              _.each($scope.imagesOriginal, function (image) {
                if ($scope.images.length <= imgCount + 99 && images.indexOf(image) === -1) {
                  $scope.images.push(image);
                }
              });
            } else {
              if ($scope.amount !== 'All') {
                _.each($scope.imagesOriginal, function (image) {
                  if ($scope.images.length < +$scope.amount) {
                    $scope.images.push(image);
                  }
                });
              } else if ($scope.amount === 'All') {
                _.each($scope.imagesOriginal, function (image) {
                  if ($scope.images.length < 2000) {
                    $scope.images.push(image);
                  }
                });
              } else {
                $scope.images = $scope.imagesOriginal;
              }
            }

            $scope.numberDisplayedImages = $scope.images.length;
          };

          $timeout(function () {
            angular.element(window.location.hash).trigger('click');
          });

          if (!$scope.allImages && !getParams.row) {
            $scope.imagesLength = res.data.images.length;
            $scope.images = res.data.images.slice(0, +$scope.amount);
            $scope.numberDisplayedImages = $scope.images.length;
          }

          $scope.onePlaceThingChange();
        }
      });

      $scope.clear = function () {
        $scope.date = null;
      };

      $scope.open = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
      };

      $scope.filter = function (amount, country, place, category, thing, rating, income, photographer, date) {
        var result = {
          amount: amount,
          country: country.name,
          place: place.name === 'All' ? 'All' : place.name,
          category: category.name === 'All' ? 'All' : category.name,
          thing: thing.thingName === 'All' ? 'All' : thing.thingName,
          rating: rating.star === 'All' ? 'All' : rating.value,
          income: income.range === 'All' ? 'All' : income.value,
          photographer: photographer.name,
          date: date || 'All',
          oneThing: $scope.oneThing.oneThing,
          onePlace: $scope.onePlace.oneThing
        };
        if (
          result.country !== 'All' ||
          result.place !== 'All' ||
          result.category !== 'All' ||
          result.thing !== 'All' ||
          result.rating !== 'All' ||
          result.income !== 'All' ||
          result.photographer !== 'All' ||
          result.date !== 'All'
        ) {
          $state.go('admin.app.filter', result);
        } else {
          $scope.checked = true;
        }
      };
    }])
  .directive('mediaWhiteLayout', ['$window', function ($window) {
    return function (scope, element, attrs) {
      scope.attrs = attrs;
      var row = null;
      var imagesLength = null;
      var windowInnerHeight = $window.innerHeight;

      scope.$watchCollection('attrs', function (value) {
        if (!value) {
          return;
        }

        var options = angular.fromJson(value.mediaWhiteLayout);

        if (_.isEmpty(options)) {
          return;
        }

        row = +options.row;
        imagesLength = +options.images;

        resizeHeight();
      });

      function resizeHeight(event) {
        var windowHeight = event ? event.currentTarget.innerHeight : $window.innerHeight;

        if (event && windowInnerHeight === windowHeight) {
          return;
        }

        windowInnerHeight = windowHeight;

        var imageHeight = (windowInnerHeight - 60) / row;
        var containerWidth = imagesLength * imageHeight;
        var windowWidth = $window.innerWidth;

        if (windowWidth > containerWidth) {
          containerWidth = windowWidth;
        }

        scope.$applyAsync(function () {
          scope.mediaPageStyleImage = function () {
            return {
              height: imageHeight + 'px',
              width: imageHeight + 'px'
            };
          };

          scope.mediaPageStyleContainer = function () {
            return {
              width: containerWidth + 'px'
            };
          };
        });
      }

      var debounceRender = _.debounce(resizeHeight, 300);

      window.addEventListener('resize', debounceRender);

      scope.$on('$destroy', function () {
        window.removeEventListener('resize', debounceRender);
      });
    };
  }])
  .directive('whenScrolled', [function () {
    return function (scope, elm, attr) {
      var raw = elm[0];
      elm.bind('scroll', function () {
        if (raw.scrollLeft + raw.offsetWidth + 200 >= raw.scrollWidth) {
          scope.$apply(attr.whenScrolled);
        }
      });
    };
  }])
  .directive('dsImagesContainer', [function () {
    return {
      templateUrl: '/components/administrator/media/imagesContainer.html'
    };
  }]);
