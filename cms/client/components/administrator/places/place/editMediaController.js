angular.module('job')
  .controller('EditMediaController', [
    '$scope', '$http', '$modal', '$modalInstance', '$stateParams', 'object', 'AmazonPath', 'cmsConfig',
    function ($scope, $http, $modal, $modalInstance, $stateParams, object, AmazonPath, cmsConfig) {
      $scope.addNowThing = true;
      $scope.editMedia = object.editMedia;
      $scope.medias = _.where(object.medias, {type: $scope.editMedia.type, isTrash: false});
      $scope.categories = object.categories;
      $scope.amazonPath = AmazonPath.createPath.bind(AmazonPath);
      $scope.url = window.location.pathname;

      $scope.imgUrl = $scope.amazonPath($scope.editMedia, '480x480-');

      function mediaThingsSelect(index) {
        $scope.mediaThings = [];

        _.each($scope.editMedia.things, function (mediaThing) {
          _.each(object.things, function (thing) {
            if (mediaThing.thingId === thing._id) {
              $scope.mediaThings.push(thing);
            }
          });
        });

        $scope.cloneMediaThings = _.clone($scope.mediaThings);
        $scope.mediaThings.splice(index, 1);
        $scope.things = _.difference(_.clone(object.things), $scope.mediaThings);
      }

      function cloneEditMedia(media) {
        $scope.originEditMedia = {};
        _.extend($scope.originEditMedia, media);

        var mediaThings = [];

        _.each($scope.originEditMedia.things, function (thing) {
          var thingsExtend = {};
          var tagsThing = [];

          _.each(thing.tags, function (tag) {
            var tagExtend = {};
            _.extend(tagExtend, tag);
            tagsThing.push(tagExtend);
          });

          _.extend(thingsExtend, thing);
          thingsExtend.tags = tagsThing;
          mediaThings.push(thingsExtend);
        });

        $scope.originEditMedia.things = mediaThings;
      }

      function funcSelectThing(media, index, thingOptionsNext) {
        if ($scope.editMedia.things.length) {
          _.each($scope.editMedia.things, function (thing) {
            thing.thingId = thing._id;
          });

          $scope.thingOptions = $scope.editMedia.things[index];
          $scope.thing = {};
          $scope.thing.select = $scope.thingOptions._id;
        } else {
          if (thingOptionsNext) {
            $scope.thingOptions = {
              _id: thingOptionsNext.selectThings,
              hidden: thingOptionsNext.hidden,
              rating: thingOptionsNext.rating,
              tags: thingOptionsNext.tags
            };
          } else {
            $scope.thingOptions = {_id: '', hidden: 'show', rating: 0, tags: []};
          }
        }

        mediaThingsSelect(index);
        var placeId = $stateParams.id;

        $http.get(cmsConfig.serverApi + '/place/isPortraitAndIsHouse/' + placeId).success(function (data) {
          if (data.error) {
            console.error(data.error);
            return;
          }

          $scope.mediasIsHouse = _.where(data.data, {isHouse: true});
          $scope.mediasIsPortrait = _.where(data.data, {isPortrait: true});

          showHidePortraitHouse();

          function showHidePortraitHouse() {
            if (!$scope.mediasIsPortrait.length && !$scope.mediasIsHouse.length) {
              $scope.hidePortrait = false;
              $scope.hideHouse = false;
            } else {
              $scope.hideHouse = $scope.mediasIsHouse.length ? media.isHouse === false : media.isPortrait === true;

              if ($scope.mediasIsPortrait.length) {
                if (!media.isPortrait || media.isHouse) {
                  $scope.hidePortrait = true;
                }

                if (media.isPortrait) {
                  $scope.hidePortrait = false;
                }
              } else {
                $scope.hidePortrait = media.isHouse ? true : false;
              }
            }
          }
        });
      }

      funcSelectThing($scope.editMedia, 0);
      cloneEditMedia($scope.editMedia);

      $scope.editMediaThing = function (thing, index) {
        var indexThing;
        var mediaThing = _.findWhere($scope.editMedia.things, {thingId: thing._id});

        if (index) {
          indexThing = index;
        } else {
          indexThing = $scope.editMedia.things.indexOf(mediaThing);
        }

        funcSelectThing($scope.editMedia, indexThing);
      };

      $scope.removeThings = [];

      $scope.removeThingMedia = function (thing) {
        $scope.removeThings.push(thing._id);

        $scope.editMedia.things = _.filter($scope.editMedia.things, function (mediaThing) {
          return mediaThing.thingId !== thing._id;
        });

        if ($scope.mediaThings.length) {
          mediaThingsSelect(0);
        } else {
          $scope.thingOptions = {
            tags: [],
            rating: 0,
            hidden: 'show',
            _id: ''
          };
        }
      };

      $scope.next = function (rating, hidden, selectThings, tags, isHouse, isPortrait) {
        var nextMedia = true;
        $scope.save(rating, hidden, selectThings, tags, isHouse, isPortrait, nextMedia, function () {
          var thingOptions = {
            hidden: hidden,
            rating: rating,
            selectThings: selectThings,
            tags: tags
          };

          var index = $scope.medias.indexOf($scope.editMedia);

          if ($scope.medias[index + 1]) {
            $scope.editMedia = $scope.medias[index + 1];
          } else {
            $scope.editMedia = $scope.medias[0];
          }

          $scope.removeThings = [];

          $scope.imgUrl = $scope.amazonPath($scope.editMedia, '480x480-');

          funcSelectThing($scope.editMedia, 0, thingOptions);
          cloneEditMedia($scope.editMedia);
        });
      };

      $scope.addThing = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/place/editMedia.html',
          controller: ['$scope', '$modalInstance', 'object', addNewThing],
          size: 'mediaEditContainer',
          resolve: {
            object: function () {
              return {
                editMedia: $scope.editMedia,
                things: object.things,
                selectThing: $scope.cloneMediaThings,
                amazonPath: $scope.amazonPath
              };
            }
          }
        });

        modalInstance.result.then(function (data) {
          data.thingId = data._id;

          if (!$scope.editMedia.things.length && $scope.thingOptions._id) {
            $scope.thingOptions.thingId = $scope.thingOptions._id;
            $scope.editMedia.things.push($scope.thingOptions);

            if ($scope.editMedia.things[0].thingId === data.thingId) {
              $scope.editMedia.things[0] = data;
            } else {
              $scope.editMedia.things.push(data);
            }
          } else {
            $scope.editMedia.things.push(data);
          }

          mediaThingsSelect(0);
          if ($scope.editMedia.things.length === 1) {
            $scope.thingOptions = data;
          }
        }, function () {
        });
      };

      function addNewThing($scope, $modalInstance, object) {
        $scope.addNowThing = false;
        $scope.editMedia = object.editMedia;
        $scope.amazonPath = object.amazonPath;
        $scope.things = _.difference(object.things, object.selectThing);
        $scope.thingOptions = {
          tags: [],
          rating: 0,
          hidden: 'show',
          _id: ''
        };

        $scope.save = function () {
          $modalInstance.close($scope.thingOptions);
        };

        $scope.close = function () {
          $modalInstance.dismiss('cancel');
        };
      }

      $scope.save = function (rating, hidden, selectThings, tags, isHouse, isPortrait, nextMedia, cb) {
        hidden = hidden ? 'show' : 'hide';

        if (selectThings) {
          $scope.errorSelectThing = false;

          var countImagesInThings = [];
          var deleteRatingThings = [];

          _.each($scope.editMedia.things, function (mediaThing) {
            if (mediaThing.thingId !== mediaThing._id) {
              countImagesInThings.push({id: mediaThing.thingId, count: 0});
            }
          });

          _.each(countImagesInThings, function (countImagesInThing, index) {
            _.each($scope.medias, function (media) {
              _.each(media.things, function (thing) {
                if (thing) {
                  if (countImagesInThing.id === thing._id || countImagesInThing.id === thing.thingId) {
                    countImagesInThings[index].count++;
                  }
                }
              });
            });

            if (!countImagesInThings[index].count - 1) {
              deleteRatingThings.push(countImagesInThings[index].id);
            }
          });

          if ($scope.editMedia.things.length) {
            if (_.isEqual($scope.originEditMedia, $scope.editMedia)) {
              if (nextMedia) {
                cb(null, {success: 'done'});
              } else {
                $modalInstance.close({success: 'done'});
              }
            } else {
              $http.post(cmsConfig.serverApi + '/editMediaInfo/' + $scope.editMedia._id, {
                things: $scope.editMedia.things,
                isHouse: isHouse,
                isPortrait: isPortrait,
                deleteRatingThings: _.union($scope.removeThings, deleteRatingThings)
              }).success(function (data) {
                if (data) {
                  if (nextMedia) {
                    cb(null, {success: 'done'});
                  } else {
                    $modalInstance.close({success: 'done'});
                  }
                }
              });
            }
          } else {
            var thingMedia = {
              _id: selectThings,
              rating: rating,
              hidden: hidden,
              tags: tags
            };

            $http.post(cmsConfig.serverApi + '/mediaInfo/' + $scope.editMedia._id, {
              thing: thingMedia,
              isHouse: isHouse,
              isPortrait: isPortrait
            }).success(function (data) {
              if (data.error) {
                console.error(data.error);
                return;
              }

              if (!nextMedia) {
                funcSelectThing($scope.editMedia);
                $modalInstance.close({success: 'done'});
              }

              var index = $scope.medias.indexOf($scope.editMedia);
              $scope.medias[index].things.push(thingMedia);

              if (nextMedia) {
                cb(null, {success: 'done'});
              }
            });
          }
        } else {
          $scope.errorSelectThing = true;
        }
      };

      $scope.close = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
