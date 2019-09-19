angular.module('job')
  .directive('imagesTagging', ['ImagesTaggingService', '_', '$modal', function (ImagesTaggingService, _, $modal) {
    return {
      restrict: 'E',
      scope: {
        placeId: '=',
        isUpdate: '=',
        selectedIcon: '=',
        selectedThing: '=',
        activeIconType: '='
      },
      templateUrl: '/components/administrator/places/place/images-tagging/images-tagging/images-tagging.template.html',
      link: function (scope) {
        scope.isUpdate = false;
        scope.isSkipPopUp = false;
        scope.imagesForThing = [];
        scope.images = [];
        scope.updateImages = {
          update: [],
          remove: []
        };

        getImages();

        var listenerElement = document.querySelector('.images-things-container');

        if (listenerElement.addEventListener) {
          if ('onwheel' in document) {
            listenerElement.addEventListener('wheel', onWheel);
          } else if ('onmousewheel' in document) {
            listenerElement.addEventListener('mousewheel', onWheel);
          } else {
            listenerElement.addEventListener('MozMousePixelScroll', onWheel);
          }
        } else {
          listenerElement.attachEvent('onmousewheel', onWheel);
        }

        scope.$watchCollection('selectedThing', function (value) {
          if (scope.images.length) {
            getImagesForThing(value && value._id);
          }
        });

        scope.$watchCollection(function () {
          return window.innerWidth;
        }, _.debounce(setWidthForImagesThing, 300));

        function setWidthForImagesThing() {
          var numb = 10;
          if (window.innerWidth >= 1400) {
            numb = 12;
          }
          var elm = angular.element('.images-tagging-container');
          var widthImg = (elm.width() - 295) / numb;
          var imagesCount = scope.imagesForThing.length;

          scope.$applyAsync(function () {
            scope.widthImagesContainer = widthImg * imagesCount;
            scope.widthImage = widthImg;
          });
        }

        function getImagesForThing(thingId) {
          var images = _.cloneDeep(scope.images);

          if (!thingId) {
            scope.imagesForThing = [];
            scope.imagesWithoutThing = images;

            return;
          }

          scope.imagesWithoutThing = _.filter(images, function (image) {
            return image.things.indexOf(thingId) === -1;
          });

          scope.imagesForThing = _.filter(images, function (image) {
            return image.things.indexOf(thingId) !== -1;
          });

          scope.updateImages.update.length = 0;
          scope.updateImages.remove.length = 0;
          scope.isSave = false;

          setWidthForImagesThing();
        }

        scope.addThingForImage = function (imageId) {
          if (scope.activeIconType) {
            setIcon(imageId);

            return;
          }

          if (!scope.selectedThing) {
            return;
          }

          var title = 'Do you want to tag this image as <br/><b>"' + scope.selectedThing.thingName + '"</b>?';
          var selectedImage = _.find(scope.imagesWithoutThing, {_id: imageId});

          confirmImage(selectedImage, title, scope.isSkipPopUp, function (data) {
            if (data) {
              scope.isSkipPopUp = data.isSkipPopUp;
            }

            scope.imagesWithoutThing = _.filter(scope.imagesWithoutThing, function (image) {
              if (image._id === imageId) {
                var indexRemoveThings = _.findIndex(scope.updateImages.remove, {
                  _id: image._id,
                  thing: scope.selectedThing._id
                });

                image.things.push(scope.selectedThing._id);

                if (indexRemoveThings === -1) {
                  scope.updateImages.update.push({_id: image._id, thing: scope.selectedThing._id});
                } else {
                  scope.updateImages.remove.splice(indexRemoveThings, 1);
                }

                scope.imagesForThing.unshift(image);
              }

              return image._id !== imageId;
            });

            setWidthForImagesThing();

            scope.isSave = !!(scope.updateImages.update.length || scope.updateImages.remove.length);
          });
        };

        scope.selectIcon = function (imageId) {
          if (scope.activeIconType) {
            setIcon(imageId);
          }
        };

        scope.removeThingFromImage = function (imageId) {
          var title = 'Do you really want to remove this tag <br/><b>"' + scope.selectedThing.thingName + '"</b><br/>from image?';
          var selectedImage = _.find(scope.imagesForThing, {_id: imageId});

          confirmImage(selectedImage, title, scope.isSkipPopUp, function (data) {
            if (data) {
              scope.isSkipPopUp = data.isSkipPopUp;
            }

            scope.imagesForThing = _.filter(scope.imagesForThing, function (image) {
              if (image._id === imageId) {
                var indexRemoveThings = _.findIndex(scope.updateImages.update, {
                  _id: image._id,
                  thing: scope.selectedThing._id
                });

                image.things = _.filter(image.things, function (thing) {
                  return thing !== scope.selectedThing._id;
                });

                if (indexRemoveThings === -1) {
                  scope.updateImages.remove.push({_id: image._id, thing: scope.selectedThing._id});
                } else {
                  scope.updateImages.update.splice(indexRemoveThings, 1);
                }

                scope.imagesWithoutThing.push(image);
              }

              return image._id !== imageId;
            });

            setWidthForImagesThing();

            scope.isSave = !!(scope.updateImages.update.length || scope.updateImages.remove.length);
          });
        };

        scope.save = function () {
          ImagesTaggingService.updateImages(scope.updateImages, function (err) {
            if (err) {
              console.error(err);
              return;
            }

            scope.isUpdate = true;
            getImages();
          });
        };

        function setIcon(imageId) {
          var selectedImage = _.find(scope.images, {_id: imageId});

          var modalInstance = $modal.open({
            templateUrl: '/components/administrator/places/place/images-tagging/images-tagging/confirm-icon/confirm-icon.template.html',
            controller: 'ConfirmIconController',
            size: 'sm',
            resolve: {
              object: function () {
                return {
                  image: selectedImage,
                  type: scope.activeIconType
                };
              }
            }
          });

          modalInstance.result.then(function () {
            scope.selectedIcon.image = selectedImage;
          });
        }

        function getImages() {
          ImagesTaggingService.getImages({placeId: scope.placeId}, function (err, data) {
            if (err) {
              console.error(err);
              return;
            }

            scope.images = data;

            scope.isUpdate = false;

            getImagesForThing(scope.selectedThing && scope.selectedThing._id);
          });
        }

        function onWheel(e) {
          e = e || window.event;

          var delta = e.deltaY || e.detail || e.wheelDelta;

          var scrollContainer = document.querySelector('.images-things-container');

          scrollContainer.scrollLeft += delta;

          if (e.preventDefault) {
            e.preventDefault();
          } else {
            e.returnValue = false;
          }
        }

        function confirmImage(selectedImage, title, isSkipPopUp, cb) {
          if (isSkipPopUp) {
            return cb({isSkipPopUp: true});
          }

          var modalInstance = $modal.open({
            templateUrl: '/components/administrator/places/place/images-tagging/images-tagging/confirm-image/confirm-image.template.html',
            controller: 'ConfirmImageController',
            size: 'sm',
            resolve: {
              object: function () {
                return {
                  image: selectedImage,
                  title: title,
                  isSkipPopUp: isSkipPopUp
                };
              }
            }
          });

          modalInstance.result.then(cb);
        }
      }
    };
  }]);
