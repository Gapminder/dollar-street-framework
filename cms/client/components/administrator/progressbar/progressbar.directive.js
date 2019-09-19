angular.module('job')
  .directive('convertPanel', ['$window', function ($window) {
    return {
      restrict: 'E',
      templateUrl: '/components/administrator/progressbar/progressbar.template.html',
      link: function (scope) {
        scope.isQueue = false;
        scope.listOfQueueImages = [];
        scope.listOfConvertImages = [];

        window.io.on('add_image_to_convert', function (data) {
          if (!scope.isQueue) {
            window.onbeforeunload = function () {
              var message = 'File converting are in progress. If you continue,you not be able to watch the process' +
                'in panel processing files';
              return message;
            };

            scope.isQueue = true;
          }

          scope.listOfQueueImages.push(data);

          scope.$apply();
        });

        window.io.on('start_convert', function (data) {
          scope.listOfQueueImages = scope.listOfQueueImages.filter(function (image) {
            if (data.originFile !== image.originFile) {
              return true;
            }

            scope.listOfConvertImages.push(image);
            scope.$apply();
            return false;
          });
        });

        window.io.on('convert_progress', function (data) {
          scope.listOfConvertImages.forEach(function (image, i) {
            if (data.originFile !== image.originFile) {
              return;
            }

            image.queue = data.queue;
            image.progress = data.progress;

            if (data.queue === 'remove') {
              scope.listOfConvertImages.splice(i, 1);
            }

            if (!scope.listOfQueueImages.length) {
              scope.isQueue = false;
              window.onbeforeunload = null;
            }

            scope.$apply();
          });
        });
      }
    };
  }]);
