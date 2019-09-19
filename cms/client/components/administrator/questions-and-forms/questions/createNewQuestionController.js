angular.module('job')
  .controller('CreateNewQuestionController', ['$scope', '$http', '$modalInstance', 'object', 'title', 'cmsConfig',
    function ($scope, $http, $modalInstance, object, title, cmsConfig) {
      $scope.ifListSelect = true;
      $scope.questionModel = {};
      $scope.isShow = true;

      function initVariable(data) {
        $scope.title = title;
        $scope.selectForms = {};

        // todo: load this list
        $scope.types = data.types;
        $scope.selectListTypeList = [
          {name: 'Countries'},
          {name: 'Regions'},
          {name: 'Place type'}
        ];

        // remove this
        $scope.questions = data.questions;
      }

      initVariable(object);

      function initEditQuestion() {
        $scope.editQuestion = object.editQuestion;

        if ($scope.editQuestion.type === 'List') {
          if ($scope.editQuestion.list && $scope.editQuestion.list.length) {
            $scope.questionModel.lists = $scope.editQuestion.list;
            $scope.ifListSelect = false;
            $scope.editList = _.map($scope.editQuestion.list, _.clone);
            $scope.isShow = false;
          }

          if ($scope.editQuestion.listSelect) {
            $scope.questionModel.listSelect = _.findWhere($scope.selectListTypeList, {name: $scope.editQuestion.listSelect});
            $scope.ifListSelect = true;
            $scope.isShow = false;
          }

          $scope.listType = true;
        }

        $scope.cloneEditQuestion = _.clone(object.editQuestion);
        $scope.questionModel.questionId = object.editQuestion.id;
        $scope.questionModel.name = object.editQuestion.name;
        $scope.questionModel.description = object.editQuestion.description;
        $scope.questionModel.typeFields = _.find($scope.types, function (type) {
          return type.name === object.editQuestion.type;
        });

        $scope.selectForms.select = object.editQuestion.forms;
      }

      if (object.editQuestion) {
        initEditQuestion();
      } else {
        $scope.selectForms.select = [];
      }

      function validNameFunc(name) {
        if (name) {
          var findQuestion = _.find($scope.cloneQuestions, function (question) {
            return question.name.toLowerCase() === name.toLowerCase();
          });

          if (!findQuestion) {
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

      $scope.checkedName = function (name) {
        validName(name);
      };

      $scope.checkedTypeFields = function (type) {
        $scope.iconTypeFalse = type ? false : true;
        $scope.questionModel.typeFields = type;

        if (type && type.name === 'List') {
          $scope.listType = true;
          $scope.listFields = false;
          $scope.ifListSelect = true;
          $scope.questionModel.lists = [{name: ''}, {name: ''}];
        } else {
          $scope.listType = false;
          $scope.listFields = true;
          $scope.questionModel.lists = null;
        }
      };

      $scope.addNewFieldList = function () {
        $scope.questionModel.lists.push({name: ''});
      };

      $scope.removeFieldsFieldList = function (index) {
        if ($scope.questionModel.lists.length > 2) {
          $scope.questionModel.lists.splice(index, 1);
        }
      };

      $scope.listTypeSelect = function () {
        $scope.ifListSelect = true;
      };

      $scope.listTypeCreate = function () {
        $scope.ifListSelect = false;

        if (!$scope.questionModel.lists || !$scope.questionModel.lists.length) {
          $scope.questionModel.lists = [{name: ''}, {name: ''}];
        }
      };

      $scope.submitQuestion = function (form, questionModel) {
        if (form.$invalid || form.$pending) {
          return;
        }
        // ugly fallback
        var questionId = questionModel.questionId;
        var name = questionModel.name;
        var description = questionModel.description;
        var type = questionModel.typeFields;
        var lists = questionModel.lists;
        var listSelect = questionModel.listSelect;

        var createNewOrEditQuestion = {};
        questionObject();
        if (name && type && !$scope.listFields && !$scope.selectFields) {
          if (object.editQuestion) {
            $http.post(cmsConfig.serverApi + '/questions/edit/' + $scope.editQuestion._id,
              createNewOrEditQuestion).success(function (data) {
                if (data.error) {
                  console.error(data.error);
                  return;
                }

                _.each($scope.questions, function (question) {
                  if (question._id === $scope.editQuestion._id) {
                    question.id = questionId;
                    question.name = name;
                    question.description = description;
                    question.type = type.name;

                    if (type.name === 'List') {
                      if ($scope.ifListSelect) {
                        question.listSelect = listSelect && listSelect.name;
                        question.list = '';
                      } else {
                        question.listSelect = listSelect && listSelect.name;
                        question.list = lists;
                      }
                    }
                  }
                });

                $modalInstance.close({questions: $scope.questions});
              });
          } else {
            $http.post(cmsConfig.serverApi + '/questions/new', createNewOrEditQuestion).success(function (data) {
              if (data.error) {
                console.error(data.error);
              }

              $modalInstance.close({questions: data.data});
            });
          }
        }

        function questionObject() {
          if (type.name === 'List') {
            if ($scope.ifListSelect === false) {
              var listsFilter = [];

              _.each(lists, function (list) {
                if (list.name) {
                  listsFilter.push(list);
                }
              });

              if (listsFilter.length >= 2) {
                $scope.listFields = false;
                $scope.selectFields = false;

                createNewOrEditQuestion = {
                  id: questionId,
                  name: name,
                  description: description,
                  type: type.name,
                  list: listsFilter
                };
              } else {
                $scope.listFields = true;
              }

              return;
            }

            if ($scope.ifListSelect) {
              if (listSelect) {
                $scope.selectFields = false;

                createNewOrEditQuestion = {
                  id: questionId,
                  name: name,
                  description: description,
                  type: type.name,
                  listSelect: listSelect.name
                };
              } else {
                $scope.selectFields = true;
              }
            }
          } else {
            $scope.listFields = false;
            $scope.selectFields = false;

            createNewOrEditQuestion = {
              id: questionId,
              name: name,
              description: description,
              type: type.name
            };
          }
        }
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
