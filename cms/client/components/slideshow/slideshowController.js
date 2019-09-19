angular.module('job')
  .controller('SlideshowController', ['$scope', '$modal', '$http', '$state', '$stateParams', 'AmazonPath', 'cmsConfig',
    function ($scope, $modal, $http, $state, $stateParams, AmazonPath, cmsConfig) {
      function imageDeviceType() {
        var type = null;

        if (device.mobile()) {
          type = 'devices-';
        } else if (device.tablet()) {
          type = 'tablets-';
        } else {
          type = 'desktops-';
        }

        return type;
      }

      function renderSlide(_id, url) {
        var slide = '<div class="slide" onclick="choseImg(event)" data-id="' + _id +
          '" style="background-image: ' + url + '"></div>';

        angular.element('.slideshowContainer .slider_container').append(slide);
      }

      function getEditParams(params) {
        params.mobile = device.mobile();
        params.tablet = device.tablet();
        params.country = params.country === 'All' ? null : params.country;
        params.place = params.place === 'All' ? null : params.place;
        params.category = params.category === 'All' ? null : params.category;
        params.thing = params.thing === 'All' ? null : params.thing;
        params.rating = params.rating === 'All' ? null : params.rating;
        params.income = params.income === 'All' ? null : params.income;
        params.photographer = params.photographer === 'All' ? null : params.photographer;
        params.date = params.date === 'All' ? null : params.date;
        return params;
      }

      $scope.index = 0;
      $scope.data = {
        loadRash: true,
        typeSlideshow: 'slide',
        disableArrow: true,
        slideOptions: {
          resolutions: [
            {name: '16:9'},
            {name: '16:10'},
            {name: '4:3'}
          ],
          transitions: [
            {value: 0, name: 'off'},
            {value: 1, name: 'fade'}
          ],
          durations: [
            {value: 0.1}, {value: 0.2}, {value: 0.3}, {value: 0.4}, {value: 0.5},
            {value: 0.6}, {value: 0.7}, {value: 0.8}, {value: 0.9}, {value: 1},
            {value: 1.1}, {value: 1.2}, {value: 1.3}, {value: 1.4}, {value: 1.5},
            {value: 1.6}, {value: 1.7}, {value: 1.8}, {value: 1.9}, {value: 2}
          ]
        },
        cloneParams: _.clone($stateParams),
        device: imageDeviceType(),
        getParams: getEditParams($stateParams),
        activeResolution: '16:9',
        activeTransition: 0,
        activeDuration: 0.5
      };

      $http.get(cmsConfig.serverApi + '/admin/filters/images', {
        params: $scope.data.getParams
      }).success(function (data) {
        $scope.data.loadRash = false;

        $scope.images = _.map(data.data.images, function (image) {
          return {
            _id: image._id,
            url: 'url(\'' + AmazonPath.createPath(image, $scope.data.device) + '\')',
            amazonfilename: image.amazonfilename,
            device: $scope.data.device,
            src: image.src,
            rotate: false
          };
        });

        if ($scope.images.length < 2) {
          angular.element('.slideshowContainer .slider').addClass('hide-arrows');
        }
        _.each($scope.images, function (image, i) {
          if (i > 5) {
            return;
          }

          renderSlide(image._id, image.url);
        });

        $scope.slideshowResolution($scope.data.activeResolution);
      });

      $scope.slideshowResolution = function (value) {
        var resolutionWidth = +value.split(':')[0];
        var resolutionHeight = +value.split(':')[1];

        var height = angular.element('.slideshowContainer').height();

        angular.element('.slideshowContainer .slider').css({
          width: height * resolutionWidth / resolutionHeight,
          height: height
        });
        if ($scope.data.typeSlideshow === 'slide') {
          angular.element('.slideshowContainer .slider_container').css({
            width: height * resolutionWidth / resolutionHeight * 10
          });
        }
      };

      $scope.slideshowTransition = function (value) {
        if (value) {
          $scope.data.typeSlideshow = 'fade';
          angular.element('.slideshowContainer .slider').addClass('fadeEfect');
          angular.element('.slideshowContainer .slider_container').css({
            width: 'inherit',
            left: 'inherit'
          });

          $scope.slideshowResolution($scope.data.activeResolution);
          $('.slideshowContainer .slider_container div').eq(0).css({display: 'block'});
        } else {
          $scope.data.typeSlideshow = 'slide';
          angular.element('.slideshowContainer .slider').removeClass('fadeEfect');
          angular.element('.slideshowContainer .slider_container div').css({display: ''});

          $scope.slideshowResolution($scope.data.activeResolution);
        }
      };

      $scope.prev = function () {
        var elem;
        var height = angular.element('.slideshowContainer .slider').height();

        var resolutionWidth = +$scope.data.activeResolution.split(':')[0];
        var resolutionHeight = +$scope.data.activeResolution.split(':')[1];

        if ($scope.data.disableArrow) {
          $scope.data.disableArrow = false;

          $scope.index = $scope.index - 1;

          if ($scope.index < 0) {
            $scope.index = $scope.images.length - 1;
          }
          $scope.image = $scope.images[$scope.index];
          if ($scope.data.typeSlideshow === 'slide') {
            height = height * resolutionWidth / resolutionHeight;

            elem = $('.slideshowContainer .slider_container .slide').last().detach();
            $(elem).attr('data-id', $scope.image._id);
            $(elem).css('background-image', $scope.image.url);
            $('.slideshowContainer .slider_container').prepend(elem);

            $(elem)
              .css({left: -height})
              .animate({
                //easing: 'ease',
                left: 0
              }, {
                duration: $scope.data.activeDuration * 1000

              }, 'ease');

            $('.slideshowContainer .slider_container .slide:nth-child(2)')
              .css({left: -height})
              .animate({left: 0}, {
                //easing: 'ease',
                duration: $scope.data.activeDuration * 1000,
                complete: function () {
                  $scope.data.disableArrow = true;
                }
              }, 'ease');
          }

          if ($scope.data.typeSlideshow === 'fade') {
            elem = $('.slideshowContainer .slider_container .slide').last().detach();
            $(elem).attr('data-id', $scope.image._id);
            $(elem).css('background-image', $scope.image.url);
            $('.slideshowContainer .slider_container').prepend(elem);

            $(elem)
              .fadeIn({
                duration: $scope.data.activeDuration * 1000
              });

            $('.slideshowContainer .slider_container .slide:nth-child(2)')
              .fadeOut({
                duration: $scope.data.activeDuration * 1000,
                complete: function () {
                  $scope.data.disableArrow = true;
                }
              });
          }
        }
      };

      $scope.next = function () {
        var elem, value;
        var height = angular.element('.slideshowContainer .slider').height();
        var resolutionWidth = +$scope.data.activeResolution.split(':')[0];
        var resolutionHeight = +$scope.data.activeResolution.split(':')[1];

        if ($scope.data.disableArrow) {
          $scope.data.disableArrow = false;

          $scope.index++;

          if ($scope.index > $scope.images.length - 1) {
            $scope.index = 0;
          }
          value = $scope.index;
          if ($scope.images.length > 5) {
            value = $scope.index + 5;
          }

          if (value > $scope.images.length - 1) {
            value -= $scope.images.length;
          }
          $scope.image = $scope.images[value];

          if ($scope.data.typeSlideshow === 'slide') {
            height = height * resolutionWidth / resolutionHeight;

            $('.slideshowContainer .slider_container')
              .css({left: 0})
              .animate({left: -height}, {
                duration: $scope.data.activeDuration * 1000,
                complete: function () {
                  elem = $('.slideshowContainer .slider_container .slide').first().detach();
                  $(this).css({left: 0});
                  $(elem).attr('data-id', $scope.image._id);
                  $(elem).css('background-image', $scope.image.url);
                  $('.slideshowContainer .slider_container').append(elem);
                  $scope.data.disableArrow = true;
                }
              });
          }
          // fade animation
          if ($scope.data.typeSlideshow === 'fade') {
            elem = $('.slideshowContainer .slider_container .slide').first().detach();
            $('.slideshowContainer .slider_container').append(elem);
            $(elem)
              .fadeOut({
                duration: $scope.data.activeDuration * 1000,
                complete: function () {
                  $(elem).attr('data-id', $scope.image._id);
                  $(elem).css('background-image', $scope.image.url);
                  $scope.data.disableArrow = true;
                }
              });
            $('.slideshowContainer .slider_container .slide:nth-child(1)')
              .fadeIn({
                duration: $scope.data.activeDuration * 1000
              });
          }
        }
      };

      $(document).keyup(function (e) {
        if (e.keyCode === 37 && !$scope.data.loadRash) {
          $scope.prev();
        }

        if (e.keyCode === 39 && !$scope.data.loadRash) {
          $scope.next();
        }
      });

      $scope.choseImgArr = [];

      window.choseImg = function (event) {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();

          var id = event.target.attributes['data-id'].value;

          if ($scope.choseImgArr.indexOf(id) === -1) {
            $scope.choseImgArr.push(id);
            angular.element(event.target).append('<span class="glyphicon glyphicon-ok-sign select_img"></span>');
            $scope.$apply();
            return;
          }

          angular.element(event.target.firstChild).remove();
          $scope.choseImgArr.splice($scope.choseImgArr.indexOf(id), 1);
          $scope.$apply();
        }
      };

      $scope.removeChosenImage = function (rotate) {
        var childrenImg = $('.slider_container .slide span');
        if (rotate && childrenImg[0]) {
          _.each(childrenImg.parent(), function (slide) {
            var idImage = angular.element(slide).attr('data-id');
            _.each($scope.images, function (image) {
              if (image._id === idImage) {
                image.rotate = true;
              }
            });
          });
          childrenImg.parent().append('<div class="rotateLoad" style="display:block">' +
            '<img src="../../../assets/images/loading.gif" alt="loading"></div>');
        }
        childrenImg.remove();
        $scope.choseImgArr = [];
      };

      $scope.openAllEdit = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/media/editMediaModal.html',
          controller: 'EditMediaModalController',
          size: 'mediaEditContainerFilters',
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
        }, function () {
        });
      };

      $scope.startRotate = function (images, rotateDegrees) {
        var forRotateImages = $scope.images.filter(function (image) {
          return images.indexOf(image._id) !== -1;
        });

        var num = 0;

        forRotateImages.forEach(function (media) {
          $http.post(cmsConfig.serverApi + '/rotate/' + media._id, {
            media: media,
            rotate: rotateDegrees
          }).success(function () {
            var slideRotate = angular.element('.slideshowContainer .slide .rotateLoad');
            if (slideRotate[0]) {
              var slides = slideRotate.parent();
              _.each(slides, function (slide) {
                slide = angular.element(slide);
                if (slide.attr('data-id') === media._id) {
                  var url = AmazonPath.createPath(media, media.device) + '?' + Date.now();
                  slide.css({'background-image': "url('" + url + "')"});
                  slide.children().remove();
                }
              });

              _.each($scope.images, function (image) {
                if (image._id === media._id) {
                  image.rotate = false;
                }
              });
            }

            if (num === $scope.rotateArr.length - 1) {
              $scope.rotateArr = [];
            }
            num++;
          });
        });
      };

      $scope.formRotateArr = function (arr) {
        $scope.rotateArr = arr.map(function (e) {
          return e;
        });
      };

      $scope.displayImage = function (images, display) {
        images.forEach(function (image) {
          $http.post(cmsConfig.serverApi + '/image/display', {id: image, show: display.display}).success(function () {
          });
        });
      };

      $scope.close = function () {
        $state.go('admin.app.filter', $scope.data.cloneParams);
      };
    }]);

