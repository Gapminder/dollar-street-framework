angular.module('job')
  .controller('FormsController', ['$scope', '$http', '$modal', 'FormsService', 'cmsConfig',
    function ($scope, $http, $modal, FormsService, cmsConfig) {
      initController();
      $scope.nextForms = function (limit) {
        if ($scope.loadPaging) {
          return;
        }
        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }
        var skip = $scope.forms.length;
        var query = _.assign({skip: skip, limit: limit}, preparationQuery());
        FormsService.nextForms(query, function (err, list) {
          if (err) {
            console.log(err);
          }
          Array.prototype.push.apply($scope.forms, list);
          $scope.loadPaging = false;
          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      var filterWatch = _.debounce(watchFilter, 300);

      $scope.$watchGroup(['search.name', 'sort'], filterWatch);

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.forms.length = 0;
          $scope.loadPage = true;
          $scope.nextForms(18);
        }
      }

      function preparationQuery() {
        var query = {};
        if ($scope.search) {
          query.name = $scope.search.name;
        }
        if ($scope.sort) {
          query.sort = $scope.sort;
        }
        return query;
      }

      $scope.editQuestionsForm = function (editForm) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/questions-and-forms/forms/editQuestionsForm.html',
          controller: 'EditQuestionsForm',
          size: 'lg',
          resolve: {
            form: function () {
              return editForm;
            }
          }
        });

        modalInstance.result.then(function (data) {
          var questions = data.addQuestions;
          var removeQuestions = data.remove;
          var countQuestions = data.countQuestions;

          _.each(questions, function (question) {
            var isPush = true;

            if (question.forms.length) {
              _.each(question.forms, function (qForm, index) {
                if (!qForm.hidden) {
                  qForm.hidden = false;
                }

                if (qForm._id === editForm._id) {
                  isPush = false;
                  qForm.hidden = question.hidden;
                  qForm.position = question.position;
                }

                if (question.forms.length - 1 === index && isPush) {
                  question.forms.push({_id: editForm._id, hidden: question.hidden, position: question.position});
                }
              });
            } else {
              question.forms.push({_id: editForm._id, hidden: question.hidden, position: question.position});
            }
          });

          _.each(removeQuestions, function (question) {
            _.each(question.forms, function (qForm, index) {
              if (qForm && qForm._id === editForm._id) {
                question.forms.splice(index, 1);
              }
            });
          });

          var updateQuestion = questions.concat(removeQuestions);
          $http.post(cmsConfig.serverApi + '/form/questions/' + editForm._id, {
            question: updateQuestion
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            editForm.questionsCount = countQuestions;
          });
        }, function () {
        });
      };

      $scope.removeForm = function (removeForm) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/questions-and-forms/forms/removeForm.html',
          controller: ['$scope', '$modalInstance', 'removeForm', function ($scope, $modalInstance, removeForm) {
            $scope.name = removeForm.name;
            $scope.ok = function () {
              $http.post(cmsConfig.serverApi + '/forms/remove/' + removeForm._id).success(function (data) {
                if (data.error) {
                  console.error(data.error);
                  return;
                }

                $modalInstance.close('done');
              });
            };
            $scope.cancel = function () {
              $modalInstance.dismiss('cancel');
            };
          }],
          size: 'sm',
          resolve: {
            removeForm: function () {
              return removeForm;
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.forms = _.filter($scope.forms, function (form) {
            return form._id !== removeForm._id;
          });
        }, function () {
        });
      };

      function initController() {
        $scope.loadPage = true;
        $scope.forms = [];
        $scope.tableHeader = [
          {
            name: 'Name',
            class: 'col-md-3 sorting up'
          },
          {
            name: 'Description',
            class: 'col-md-4 background-white'
          },
          {
            name: 'Questions',
            class: 'col-md-2 background-white'
          },
          {
            name: '',
            class: 'col-md-1 background-white'
          }
        ];
        $scope.sort = {name: 1};
        $scope.checkName = function (data, index) {
          if (data) {
            var checkName = _.filter($scope.forms, function (form) {
              if ($scope.forms[index] !== form) {
                return form.name === data;
              }
            });

            if (checkName.length) {
              return 'Form name "' + data + '" already exists.';
            }
          } else {
            return 'Please enter name form.';
          }
        };
        $scope.saveForm = function (data, form) {
          if (form.name !== data.name || form.description !== data.description) {
            $http.post(cmsConfig.serverApi + '/forms/edit/' + form._id, data).success(function (data) {
              if (data.error) {
                console.error(data.error);
              }
            });
          }
        };
        $scope.addForms = function () {
          $http.post(cmsConfig.serverApi + '/forms/new', {
            name: 'new Form ' + Date.now(),
            description: ''
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
              return;
            }

            $scope.forms.unshift(data.data);
          });
        };
      }
    }]);
