angular.module('job')
  .directive('uniqueQuestionId', [
    '$q', 'QuestionsService',
    function ($q, QuestionsService) {
      return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
          var initialValue;
          ctrl.$asyncValidators.uniqueId = function (modelValue) {
            if (ctrl.$pristine && modelValue) {
              initialValue = modelValue;
              return $q.when();
            }

            if (ctrl.$isEmpty(modelValue)) {
              // consider empty model valid
              return $q.when();
            }

            if (initialValue === modelValue) {
              return $q.when();
            }

            var def = $q.defer();
            QuestionsService.isUniqueValidation('id', modelValue, function (err, isUnique) {
              if (err) {
                return console.log(err);
              }
              if (isUnique) {
                def.resolve();
              } else {
                def.reject();
              }
            });

            return def.promise;
          };
        }
      };
    }
  ]);

angular.module('job')
  .directive('uniqueQuestionName', [
    '$q', 'QuestionsService',
    function ($q, QuestionsService) {
      return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
          var initialValue;
          ctrl.$asyncValidators.uniqueName = function (modelValue) {
            if (ctrl.$pristine && modelValue) {
              initialValue = modelValue;
              return $q.when();
            }

            if (initialValue === modelValue) {
              return $q.when();
            }

            if (ctrl.$isEmpty(modelValue) || ctrl.$pristine) {
              // consider empty model valid
              return $q.when();
            }

            var def = $q.defer();
            QuestionsService.isUniqueValidation('name', modelValue, function (err, isUnique) {
              if (err) {
                return console.log(err);
              }
              if (isUnique) {
                def.resolve();
              } else {
                def.reject();
              }
            });

            return def.promise;
          };
        }
      };
    }
  ]);
