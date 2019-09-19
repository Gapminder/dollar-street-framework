angular.module('job')
  .directive('file', ['AmazonPath', function (AmazonPath) {
    return {
      restrict: 'E',
      scope: {
        fileToUpload: '=',
        startImage: '=',
        validation: '=',
        removeIcon: '='
      },
      template: '<img ng-hide="!isShow&&!badFormat" />' +
      '<span class="remove-icon" ng-hide="!isShow&&!badFormat" ng-click="[removeIcon(),hideIcon()]">x</span>' +
      '<span class="bad-icon-message" ng-show="badFormat">format must be svg</span><input class="form-control m-b" type="file"/>',
      link: function (scope, element) {
        scope.badFormat = false;
        var img = element.find('img');
        if (scope.startImage) {
          scope.isShow = true;
          img.attr('src', AmazonPath.createPath.bind(AmazonPath, 'thing/' +
            scope.startImage.split('.')[0] + '/FCB42D-' + scope.startImage));
        }
        scope.hideIcon = function () {
          scope.isShow = false;
        };
        var fileField = element.find('input');
        fileField.bind('change', previewIcon);
        function previewIcon() {
          scope.badFormat = false;
          var file = this.files[0];
          if (file.type !== 'image/svg+xml') {
            scope.badFormat = true;
            scope.validation = false;
            fileField.replaceWith(fileField = fileField.clone(true));
            scope.$apply();
            return;
          }
          var reader = new FileReader();
          reader.onload = function (readData) {
            scope.isShow = true;
            scope.fileToUpload = {};
            scope.fileToUpload = readData.target.result;
            img.attr('src', 'data:image/svg+xml;charset=utf-8,' + scope.fileToUpload);
            scope.validation = true;
            scope.$apply();
          };
          reader.readAsText(file);
        }

        scope.$on('$destroy', function () {
          fileField.unbind('change', previewIcon);
        });
      }
    };
  }]);
