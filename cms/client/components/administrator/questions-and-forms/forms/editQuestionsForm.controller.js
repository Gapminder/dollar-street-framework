angular.module('job')
  .controller('EditQuestionsForm', [
    '$scope', '$http', '$modalInstance', 'form', 'cmsConfig',
    function ($scope, $http, $modalInstance, form, cmsConfig) {
      $scope.form = form;
      $scope.name = form.name;
      $scope.loadPage = true;

      var selectQuestionsForm = [];
      var arrSelectQuestion = [];
      var count = 1;

      $http.get(cmsConfig.serverApi + '/questions').success(function (data) {
        if (data.error) {
          console.error(data.error);
          return;
        }

        _.each(data.data, function (question) {
          question.checkForm = false;

          if (question.forms.length) {
            _.each(question.forms, function (form) {
              if (!question.hidden && $scope.form._id === form._id) {
                question.checkForm = true;
                question.hidden = form.hidden;
                selectQuestionsForm.push(question);

                if (!form.position) {
                  question.position = count;
                  count++;
                } else {
                  question.position = form.position;
                }

                arrSelectQuestion.push(question._id);
              }
            });
          } else {
            question.hidden = false;
          }
        });

        $scope.questions = data.data;
        $scope.loadPage = false;
      });

      $scope.changeCheckbox = function (question) {
        var index = arrSelectQuestion.indexOf(question._id);

        if (index === -1) {
          arrSelectQuestion.push(question._id);
          question.position = arrSelectQuestion.length;
        } else {
          question.position = null;
          arrSelectQuestion.splice(index, 1);
        }
      };

      $scope.putQuestion = function (event, question) {
        event.preventDefault();

        var parent = angular.element(event.target.parentNode);

        if (parent[0].localName === 'tr') {
          var input = parent.find('input');

          if (input[0].checked) {
            parent.addClass('active');
            $scope.dragQuestionParent = parent;
            $scope.dragQuestion = question;
          }
        }
      };

      $scope.over = function (event, question) {
        var inputNext = angular.element(event.target.parentNode).find('input');

        if (
          angular.element(event.target.parentNode)[0].localName === 'tr' &&
          inputNext[0] &&
          inputNext[0].checked
        ) {
          if ($scope.dragQuestionParent && $scope.dragQuestionParent[0] !==
            angular.element(event.target.parentNode)[0] &&
            $scope.dragQuestion && $scope.dragQuestion.position) {
            var position = JSON.parse(JSON.stringify($scope.dragQuestion)).position;
            $scope.dragQuestion.position = question.position;
            question.position = position < question.position ? question.position - 1 : question.position + 1;
          }
        }
      };

      $scope.dropQuestion = function () {
        var hasClassActive = angular.element($scope.dragQuestionParent).hasClass('active');

        if (hasClassActive) {
          $scope.dragQuestionParent.removeClass('active');
        }

        $scope.dragQuestionParent = null;
        $scope.dragQuestion = null;
      };

      $scope.save = function () {
        var checkFormQuestions = _.filter($scope.questions, function (question) {
          return question.checkForm === true;
        });

        var remove = _.difference(selectQuestionsForm, checkFormQuestions);

        $modalInstance.close({
          addQuestions: checkFormQuestions,
          remove: remove,
          countQuestions: checkFormQuestions.length
        });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }])
  .directive('resizeQuestionsInForms', ['$window', function ($window) {
    return function (scope, element, attrs) {
      var window = angular.element($window);

      attrs.$observe('resizeQuestionsInForms', function () {
        resizeHeight();
      });

      scope.getWindowHeight = function () {
        return {height: window.height()};
      };

      function resizeHeight() {
        scope.$watch(scope.getWindowHeight, function (newValue) {
          scope.styleModal = function () {
            return {
              height: newValue.height - 340 + 'px'
            };
          };
        }, true);
      }

      window.bind('resize', function () {
        scope.$apply();
      });
    };
  }]);
