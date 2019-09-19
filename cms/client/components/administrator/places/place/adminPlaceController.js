angular
  .module('job')
  .controller('AdminPlaceController', [
    'async',
    '_',
    '$scope',
    '$http',
    '$stateParams',
    '$sce',
    '$window',
    'mediaObj',
    '$state',
    '$modal',
    'addNewThing',
    'PlaceAdminService',
    'AmazonPath',
    'cmsConfig',
    function(
      async,
      _,
      $scope,
      $http,
      $stateParams,
      $sce,
      $window,
      mediaObj,
      $state,
      $modal,
      addNewThing,
      PlaceAdminService,
      AmazonPath,
      cmsConfig
    ) {
      $scope.loadPage = true;
      $scope.choseImgArr = [];
      $scope.selectedIcon = {};

      initController();

      if (typeof window.io.on === 'function') {
        socetMessages();
      } else {
        var watcher = $scope.$watch(
          function() {
            return window.io.on;
          },
          function(n, o) {
            if (n) {
              socetMessages();
              watcher();
            }
          }
        );
      }

      $scope.nextPlaceImages = function(limit, isApproved) {
        if ($scope.loadPaging) {
          return;
        }

        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }

        var skip = $scope.images.length;

        if (!isApproved) {
          skip = $scope.noApproveImages.length;
        }

        var query = _.assign(
          {
            skip: skip,
            limit: limit,
            isApproved: isApproved,
            placeId: $scope.placeId
          },
          preparationQuery()
        );

        PlaceAdminService.getNextPlaceImages(query, function(err, list) {
          if (err) {
            console.log(err);
          }

          /* todo change each logic*/
          _.each(list, function(image) {
            image.tags = [];

            _.each(image.things, function(thing) {
              if (!image.rating || image.rating < thing.rating) {
                image.rating = thing.rating;
              }

              _.each(thing.tags, function(tag) {
                image.tags.push(tag);
              });
            });
          });

          if (isApproved) {
            Array.prototype.push.apply($scope.images, list);
          } else {
            Array.prototype.push.apply($scope.noApproveImages, list);
          }

          $scope.$applyAsync(function() {
            if (location.hash) {
              var elm = $(location.hash);

              elm.trigger('click');
            }
          });

          $scope.loadPaging = false;

          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      $scope.openModalMedia = function() {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/place/upload-media.template.html',
          controller: [
            '$scope',
            '$modalInstance',
            'placeId',
            function($scope, $modalInstance, placeId) {
              $scope.placeId = placeId;
              // serverUrl
              $scope.videoUrl = cmsConfig.serverApi + '/upload/v2/' + $scope.placeId + '/video';
              $scope.imageUrl = cmsConfig.serverApi + '/upload/v2/' + $scope.placeId + '/image';

              $scope.photoAreaAfterUpload = function() {
                $modalInstance.close();
              };
            }
          ],
          size: 'bootstrapPlaceUpload',
          resolve: {
            placeId: function() {
              return $scope.placeId;
            }
          }
        });

        modalInstance.result.then(function() {
          $scope.$applyAsync(function() {
            $scope.activeTabPhoto = 'photo';
            $scope.activeNoApprovedTab = 'noApproved';
          });
        });
      };

      $scope.editMedia = function(media) {
        $scope.addNewThing.initModalCreateThing($scope, $modal, media);
      };

      $scope.editPlace = function() {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/createAndEditPlace.html',
          controller: 'CreateAndEditPlaceController',
          size: 'lg',
          resolve: {
            object: function() {
              return {
                places: window.places,
                editPlaces: $scope.place,
                placesType: $scope.placesType,
                photographers: $scope.photographer,
                allPlacesName: $scope.allPlacesName,
                countries: $scope.countries
              };
            },
            title: function() {
              return 'Edit Place';
            },
            isAdmin: function() {
              return $scope.isAdmin;
            }
          }
        });

        modalInstance.result.then(function(data) {
          $scope.places = data.places;
          $scope.placeName = data.name;
        });
      };

      $scope.approveImages = function(place) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/place/approve/approve.template.html',
          controller: 'ApproveController',
          size: 'lg',
          resolve: {
            place: function() {
              return place;
            }
          }
        });

        modalInstance.result.then(function() {});
      };

      $scope.imageRotate = function(image) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/place/rotateMedia.html',
          controller: 'RotateMediaController',
          size: 'sm',
          resolve: {
            media: function() {
              return image;
            }
          }
        });

        modalInstance.result.then(function() {
          $scope.imgReload = '?_ds=' + Date.now();
        });
      };

      $scope.restore = function(media) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/place/removeAndRestoreMedia.html',
          controller: 'RemoveAndRestoreMediaController',
          size: 'sm',
          resolve: {
            object: function() {
              return { restoreMedia: media };
            }
          }
        });

        modalInstance.result.then(
          function(response) {
            var index = $scope.images.indexOf(response.image);
            $scope.images.splice(index, 1);
          },
          function() {}
        );
      };

      $scope.approveImage = function(e, id) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();

          if ($scope.choseImgArr.indexOf(id) === -1) {
            $scope.choseImgArr.push(id);
            return;
          }

          $scope.choseImgArr.splice($scope.choseImgArr.indexOf(id), 1);
        }
      };

      $scope.watchImgChosen = function(id) {
        return $scope.choseImgArr.indexOf(id) !== -1;
      };

      $scope.approveImagesForPublic = function(imagesId) {
        PlaceAdminService.approveImages({ imagesId: imagesId, placeId: $scope.place._id }, function(err) {
          if (err) {
            console.log(err);
          }

          $state.go($state.current, {}, { reload: true });
        });
      };

      $scope.removeMedia = function(media) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/places/place/removeAndRestoreMedia.html',
          controller: 'RemoveAndRestoreMediaController',
          size: 'sm',
          resolve: {
            object: function() {
              return { removeMedia: media };
            }
          }
        });

        modalInstance.result.then(function(response) {
          var index;
          if (!response.image.isApproved) {
            index = $scope.noApproveImages.indexOf(response.image);
            $scope.noApproveImages.splice(index, 1);

            return;
          }

          index = $scope.images.indexOf(response.image);
          $scope.images.splice(index, 1);
        });
      };

      $scope.fancyboxStar = function(num) {
        return new Array(num);
      };

      $scope.addLoadedImages = function() {
        $scope.noApproveImages = $scope.noApproveImages.concat($scope.imagesLoaded);
        $scope.imagesLoaded.splice(0, $scope.imagesLoaded.length);
        $scope.imagesCount = $scope.noApproveImages.length;
      };

      $scope.infoType = function(question) {
        if (question.list && question.list.length) {
          $scope.lists = question.list;
          return $scope.lists;
        }

        if (question.listSelect) {
          if (question.listSelect === 'Regions') {
            return $scope.regions;
          }

          if (question.listSelect === 'Countries') {
            return $scope.countries;
          }

          if (question.listSelect === 'Place type') {
            return $scope.placesType;
          }
        }
      };

      $scope.saveTable2 = function(form) {
        var el = document.getElementById('imageInfo');

        if (el) {
          $scope.uploadInfoImage = el.files[0];
        }

        var infos = _.map($scope.questions, function(question) {
          if (question.type === 'Map') {
            if (question.answers.link) {
              var arrAnswersSplit = question.answers.link.split('@');
              $scope.arrCoordinates = arrAnswersSplit[1].split(',');
              $scope.map.center = $scope.marker.coords = {
                latitude: $scope.arrCoordinates[0],
                longitude: $scope.arrCoordinates[1]
              };
            }

            return {
              _id: question._id,
              id: question.id,
              forms: [
                {
                  formId: form._id,
                  answers: {
                    link: question.answers.link,
                    latitude: $scope.arrCoordinates ? $scope.arrCoordinates[0] : question.answers.latitude,
                    longitude: $scope.arrCoordinates ? $scope.arrCoordinates[1] : question.answers.longitude
                  }
                }
              ]
            };
          } else if (question.type === 'Image') {
            if (el && el.files[0]) {
              var type = el.files[0].type.split('/');

              if (type[0] === 'image') {
                var nameSplit = el.files[0].name.split('.');
                nameSplit[nameSplit.length - 1] = 'jpg';
                var fileName = nameSplit.join('.');

                return {
                  _id: question._id,
                  id: question.id,
                  forms: [
                    {
                      formId: form._id,
                      answers: 'media/' + $scope.place.name + '/info-' + fileName
                    }
                  ]
                };
              }
            } else {
              return {
                _id: question._id,
                id: question.id,
                forms: [
                  {
                    formId: form._id,
                    answers: question.answers
                  }
                ]
              };
            }
          } else {
            return {
              _id: question._id,
              id: question.id,
              forms: [
                {
                  formId: form._id,
                  answers: question.answers
                }
              ]
            };
          }
        });

        _.each(infos, function(info) {
          _.each($scope.place.info, function(placeInfo) {
            if (info.id === placeInfo.id) {
              _.each(info.forms, function(form) {
                _.each(placeInfo.forms, function(placeInfoForm) {
                  if (form.formId === placeInfoForm.formId) {
                    placeInfoForm.answers = form.answers;
                  } else {
                    var indexF = placeInfo.forms
                      .map(function(e) {
                        return e.formId;
                      })
                      .indexOf(form.formId);

                    if (indexF === -1) {
                      placeInfo.forms.push(form);
                    }
                  }
                });
              });
            } else {
              var indexQ = $scope.place.info
                .map(function(e) {
                  return e.id;
                })
                .indexOf(info.id);

              if (indexQ === -1) {
                $scope.place.info.push(info);
              }
            }
          });
        });

        $http
          .post(cmsConfig.serverApi + '/places/editInfo/' + $scope.place._id, { info: infos })
          .success(function(data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            if (el) {
              var image = el.files[0];

              if (image) {
                var fd = new FormData();
                fd.append('file', image);

                $http
                  .post(cmsConfig.serverApi + '/placeInfoImageUpload/' + $scope.placeId, fd, {
                    transformRequest: angular.identity,
                    headers: { 'Content-Type': 'undefined' }
                  })
                  .success(function(data) {
                    if (data.error) {
                      console.error(data.error);
                    }
                  });
              }
            }

            _.each($scope.originalQuestions, function(question) {
              _.each(question.forms, function(form) {
                _.each($scope.place.info, function(info) {
                  if (question.id === info.id) {
                    _.each(info.forms, function(infoForm) {
                      if (form._id === infoForm.formId) {
                        form.answers = infoForm.answers;
                      }
                    });
                  }
                });
              });
            });

            $scope.cloneQuestions = _.map($scope.originalQuestions, _.clone);
          });
      };

      $scope.checkedSelectForm = function(form) {
        if (form) {
          $scope.activeForm = $scope.selectForm = form;
          $scope.questions = _.filter($scope.cloneQuestions, function(question) {
            var pos = question.forms
              .map(function(e) {
                return e._id;
              })
              .indexOf(form._id);

            if (pos !== -1) {
              _.each(question.forms, function(qForm) {
                if (qForm._id === form._id) {
                  question.position = qForm.position;

                  if (question.type === 'GeoMark' && typeof qForm.answers !== 'object') {
                    question.answers = {};
                  } else {
                    question.answers = qForm.answers;
                  }

                  if (question.type === 'Map') {
                    $scope.map = {
                      center: {
                        latitude: question.answers ? question.answers.latitude : 0,
                        longitude: question.answers ? question.answers.longitude : 0
                      },
                      zoom: 16
                    };

                    $scope.options = {
                      draggable: true,
                      mapTypeControl: true,
                      keyboardShortcuts: true,
                      scrollwheel: true,
                      streetViewControl: true,
                      zoomControl: true
                    };

                    $scope.marker = {
                      id: 0,
                      coords: {
                        latitude: question.answers ? question.answers.latitude : 0,
                        longitude: question.answers ? question.answers.longitude : 0
                      },
                      icon: '/assets/images/magenta.png',
                      options: { draggable: false }
                    };
                  }
                }
              });

              return question;
            }
          });
        } else {
          $scope.questions = [];
        }
      };

      function socetMessages() {
        window.io.on('update_info', function(data) {
          if ($scope.placeId === data && $scope.uploadInfoImage && $scope.uploadInfoImage.name) {
            $scope.progres = true;
          }
        });

        window.io.on('update_info_image', function(data) {
          if ($scope.placeId === data && $scope.selectForm._id) {
            $scope.checkedSelectForm($scope.selectForm);
            $scope.uploadInfoImage = null;
            $scope.progres = false;
          }
        });

        $scope.imagesLoaded = [];

        window.io.on('add_loaded_image_' + $scope.placeId, function(data) {
          let picture = $scope.imagesLoaded.find((pic) => pic.amazonfilename === data.amazonfilename);

          if (!picture) {
            $scope.imagesLoaded.push(data);

            $scope.$apply();
          }
        });
      }

      function showTrashMedia(isTrash) {
        $scope.isTrashMedia = isTrash;
        $scope.images.length = 0;
        $scope.noApproveImages.length = 0;
        $scope.loadPage = true;
        $scope.nextPlaceImages(30, $scope.activeApprovedTab ? true : false);
      }

      function initController() {
        $scope.amazonPath = AmazonPath.createPath.bind(AmazonPath);
        $scope.placeId = $stateParams.id;

        PlaceAdminService.preparationInitData($scope.placeId, function(err, data) {
          if (err) {
            console.error(err);
            return;
          }

          if (!data.place) {
            $state.go('admin.app.places');
            return;
          }

          $scope.placesType = data.placesType;
          window.places = $scope.places = data.places;

          $scope.regions = data.locations.regions;
          $scope.countries = data.locations.countries;
          $scope.curentPlaces = $scope.place = data.place;

          if (!$scope.place.familyInfoSummary) {
            $scope.place.familyInfoSummary = '';
          }

          if (!$scope.place.familyInfo) {
            $scope.place.familyInfo = '';
          }

          $scope.placeName = $scope.place.name;
          $scope.allPlacesName = data.namesPlaces;
          $scope.photographer = data.photographers;
          window.categories = $scope.categories = data.categories;
          window.things = $scope.things = data.things;
          var formsQuestions = [];

          _.each(data.infos.questions, function(question) {
            _.each(data.infos.forms, function(forms) {
              var pos = question.forms
                .map(function(e) {
                  return e._id;
                })
                .indexOf(forms._id);

              if (pos !== -1 && formsQuestions.indexOf(forms) === -1) {
                formsQuestions.push(forms);
              }
            });
          });

          var allAnswersForms = [];

          _.forEach($scope.place.info, function(info) {
            if (info.forms && info.forms.length) {
              _.forEach(info.forms, function(form) {
                if (form.answers) {
                  allAnswersForms.push(form);
                }
              });
            }
          });

          $scope.forms = data.infos.forms;

          // var groupAnswersForms = _.groupBy(allAnswersForms, function (n) {
          //   return n.formId;
          // });
          //
          // $scope.startActivFormId = {};
          //
          // _.forEach(groupAnswersForms, function (v, k) {
          //   if (!$scope.startActivFormId._id) {
          //     $scope.startActivFormId._id = k;
          //     $scope.startActivFormId.count = v.length;
          //     return;
          //   }
          //
          //   if (v.length > $scope.startActivFormId.count) {
          //     $scope.startActivFormId._id = k;
          //     $scope.startActivFormId.count = v.length;
          //   }
          // });
          //
          // if (_.isEmpty($scope.startActivFormId)) {
          //   $scope.selectForm = $scope.forms[0];
          // } else {
          //   $scope.selectForm = _.findWhere($scope.forms, {_id: $scope.startActivFormId._id});
          // }

          $scope.selectForm = _.findWhere($scope.forms, { _id: '54d894b4870d9aac01482e6e' });

          _.each(data.infos.questions, function(question) {
            _.each(question.forms, function(form) {
              _.each($scope.place.info, function(info) {
                if (question.id === info.id) {
                  _.each(info.forms, function(infoForm) {
                    if (form._id === infoForm.formId) {
                      form.answers = infoForm.answers;

                      if (question.type === 'Date') {
                        form.answers = new Date(infoForm.answers);
                      }
                    }
                  });
                }
              });
            });
          });

          $scope.imgReload = '?_ds=' + Date.now();
          $scope.originalQuestions = data.infos.questions;
          $scope.cloneQuestions = _.map(data.infos.questions, _.clone);

          if (!_.isEmpty($scope.selectForm)) {
            $scope.checkedSelectForm($scope.selectForm);
          }
        });

        $scope.isTrashMedia = false;
        $scope.showTrashMedia = showTrashMedia;

        if (device.mobile()) {
          $scope.device = 'devices-';
        } else if (device.tablet()) {
          $scope.device = 'tablets-';
        } else {
          $scope.device = 'desktops-';
        }

        $scope.images = [];
        $scope.noApproveImages = [];
        $scope.addNewThing = addNewThing;
        $scope.selectForm = {};
        $scope.uploadInfoImage = {};

        $scope.filterView = 'all';

        $scope.reloadTrigger = false;
        $scope.imageInfo = [];

        $scope.getMapUrl = function(url) {
          return $sce.trustAsResourceUrl(url);
        };
      }

      function preparationQuery() {
        var query = { isTrash: $scope.isTrashMedia };

        if ($scope.filterList !== 'all') {
          query.list = $scope.filterList;
        }

        return query;
      }

      $scope.activeTab = function(tab) {
        $scope.activeTabPhoto = tab === 'photo';
        $scope.activeTabQuestionnaire = tab === 'questionnaire';
        $scope.activeTabFamilyInfo = tab === 'familyInfo';
        $scope.activeImageTagging = tab === 'imageTagging';
        $scope.activeNoApprovedTab = false;

        if (tab === 'imageTagging') {
          angular.element('body').addClass('mini-navbar');
        } else {
          angular.element('body').removeClass('mini-navbar');
        }
      };

      $scope.activeSubTab = function(tab) {
        $scope.activeApprovedTab = tab === 'approved';
        $scope.activeNoApprovedTab = tab === 'noApproved';
      };

      $scope.saveFamilyInfo = function() {
        $http
          .post(cmsConfig.serverApi + '/place/editFamilyInfo/' + $scope.place._id, {
            familyInfo: $scope.place.familyInfo,
            familyInfoSummary: $scope.place.familyInfoSummary
          })
          .success(function(data) {
            if (data.error) {
              console.error(data.error);
            }
          });
      };
    }
  ])
  .directive('fileModel', [
    '$parse',
    function($parse) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;

          element.bind('change', function() {
            scope.$apply(function() {
              modelSetter(scope, element[0].files);
            });
          });
        }
      };
    }
  ])
  .run([
    'editableOptions',
    function(editableOptions) {
      editableOptions.theme = 'bs3';
    }
  ])
  .service('mediaObj', [
    function() {
      return { countProg: 0, type: 'warning', closeProgres: false };
    }
  ])
  .service('addNewThing', [
    '$http',
    function($http) {
      return {
        initModalCreateThing: function(scope, modal, media) {
          var modalInstance = modal.open({
            templateUrl: '/components/administrator/places/place/editMedia.html',
            controller: 'EditMediaController',
            size: 'mediaEditContainer',
            resolve: {
              object: function() {
                return {
                  medias: scope.images,
                  editMedia: media,
                  things: scope.things,
                  categories: scope.categories
                };
              }
            }
          });

          modalInstance.result.then(function() {
            $http.get(cmsConfig.serverApi + '/things').success(function(res) {
              if (res.error) {
                console.error(res.error);
                return;
              }

              scope.things = res.data;
            });
          });
        }
      };
    }
  ]);
