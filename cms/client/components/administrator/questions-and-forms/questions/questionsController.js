angular.module('job')
  .controller('QuestionsController', ['$scope', '$http', '$modal', 'QuestionsService', 'cmsConfig',
    function ($scope, $http, $modal, QuestionsService, cmsConfig) {
      initController();
      $scope.$watchGroup(['search.name', 'sort', 'form'], _.debounce(watchFilter, 150));

      QuestionsService.getForms(function (err, forms) {
        if (err) {
          console.error(err);
          return;
        }

        Array.prototype.push.apply($scope.forms, forms);
      });

      $scope.nextQuestions = function (limit) {
        if ($scope.loadPaging) {
          return;
        }

        if (!$scope.loadPage) {
          $scope.loadPaging = true;
        }

        var skip = $scope.questions.length;
        var query = _.assign({skip: skip, limit: limit}, preparationQuery());

        QuestionsService.nextQuestions(query, function (err, list) {
          if (err) {
            return console.error(err);
          }

          Array.prototype.push.apply($scope.questions, list);

          $scope.loadPaging = false;

          if ($scope.loadPage) {
            $scope.loadPage = false;
          }
        });
      };

      $scope.addQuestion = function () {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/questions-and-forms/questions/createNewQuestion.html',
          controller: 'CreateNewQuestionController',
          size: 'lg',
          resolve: {
            object: function () {
              return {
                questions: $scope.questions,
                types: $scope.types
              };
            },
            title: function () {
              return '<b>Create new Question</b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.questions.push(data.questions);
        }, function () {
        });
      };

      $scope.editQuestion = function (question) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/questions-and-forms/questions/createNewQuestion.html',
          controller: 'CreateNewQuestionController',
          size: 'lg',
          resolve: {
            object: function () {
              return {
                questions: $scope.questions,
                editQuestion: question,
                types: $scope.types
              };
            },
            title: function () {
              return 'Edit question: <b>' + question.name + '<b>';
            }
          }
        });

        modalInstance.result.then(function (data) {
          $scope.questions = data.questions;
        }, function () {
        });
      };

      $scope.removeQuestions = function (question) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/questions-and-forms/questions/removeQuestion.html',
          controller: ['$scope', '$modalInstance', 'question', removeQuestionModalController],
          size: 'sm',
          resolve: {
            question: function () {
              return question;
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.questions = _.filter($scope.questions, function (questions) {
            return questions._id !== question._id;
          });
        }, function () {
        });
      };

      function preparationQuery() {
        var query = {};

        if ($scope.search) {
          query.name = $scope.search.name;
        }

        if ($scope.sort) {
          query.sort = $scope.sort;
        }

        if ($scope.form) {
          query.formId = $scope.form._id;
        }

        return query;
      }

      function removeQuestionModalController($scope, $modalInstance, question) {
        $scope.name = question.name;

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };

        $scope.ok = function () {
          // serverUrl
          $http
            .post(cmsConfig.serverApi + '/questions/remove/' + question._id + '/' + question.id, {question: question})
            .success(function (data) {
              if (data.error) {
                console.error(data.error);
              }

              $modalInstance.close('done');
            });
        };
      }

      function initController() {
        $scope.loadPage = true;
        $scope.questions = [];
        $scope.types = [
          {name: 'Date'},
          {name: 'GeoMark'},
          {name: 'Map'},
          {name: 'List'},
          {name: 'Text'},
          {name: 'Image'},
          {name: 'Textarea'}
        ];

        $scope.forms = [{name: 'All'}];
        $scope.form = $scope.forms[0];

        $scope.tableHeader = [{
          name: 'Q id',
          alias: 'id',
          class: 'col-md-1 sorting'
        }, {
          name: 'Question',
          alias: 'name',
          class: 'col-md-3 sorting'
        }, {
          name: 'Description',
          class: 'col-md-4 background-white'
        }, {
          name: 'Forms',
          class: 'col-md-2 background-white'
        }, {
          name: 'Type',
          class: 'col-md-1 sorting'
        }, {
          name: '',
          class: 'col-md-1 background-white'
        }];

        $scope.sort = {name: 1};
      }

      function watchFilter(n, o) {
        if (!_.isEqual(n, o)) {
          $scope.questions.length = 0;
          $scope.loadPage = true;
          $scope.nextQuestions(18);
        }
      }
    }]);
