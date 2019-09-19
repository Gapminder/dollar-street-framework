angular.module('job')
  .controller('StringsController', ['$scope', '$timeout', 'StringsService', '$http', '$modal',
    function ($scope, $timeout, StringsService, $http, $modal) {
      $scope.loadPage = true;

      StringsService.getAllStrings(function (err, data) {
        if (err) {
          console.error(err);
          return;
        }
        
        $scope.stringsData = data;

        $scope.stringsList = $scope.stringsData;

        updateLabels();

        $scope.selectedLabel = $scope.labelsList[0];

        $scope.loadPage = false;
      });

      function getLabelsList(data) {
        let labelsList = _.chain(data).flatten().pluck('label').unique().value();
        labelsList.unshift('All');
        
        return labelsList;
      }

      function updateLabels() {
        $scope.labelsList = getLabelsList($scope.stringsData);
      }

      function filterStringsList(label) {
        if (!label || label === 'All') {
          $scope.stringsList = $scope.stringsData;
          return;
        }

        $scope.stringsList = _.filter($scope.stringsData, (string) => {
          return string.label === label;
        });
      }

      $scope.labelChanged = function () {
        filterStringsList($scope.selectedLabel);
      };

      $scope.createNewString = function() {
          var modalInstance = $modal.open({
            templateUrl: '/components/administrator/strings/actions/createAndEditStringTemplate.html',
            controller: 'CreateAndEditStringController',
            size: 'lg',
            resolve: {              
              mode: function () {
                return 'create';
              },
              title: function () {
                return '<b>Create new String</b>';
              },
              object: function () {
                return {};
              }
            }
          });

          modalInstance.result.then(function (data) {
            $scope.stringsData.push(data);
            
            updateLabels();
          }, function () {});
      };

      $scope.editString = function (object) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/strings/actions/createAndEditStringTemplate.html',
          controller: 'CreateAndEditStringController',
          size: 'lg',
          resolve: {
            mode: function () {
              return 'edit';
            },
            title: function () {
              return '<b>Edit string</b>';
            },
            object: function () {
              return object;
            }
          }
        });

        modalInstance.result.then(function (data) {
          let index = $scope.stringsData.indexOf($scope.selectedString);
          $scope.stringsData.splice(index, 1);

          $scope.stringsData.splice(index, 0, data);
        }, function () {});
      }

      $scope.removeString = function (object) {
        var modalInstance = $modal.open({
          templateUrl: '/components/administrator/strings/actions/removeStringTemplate.html',
          controller: 'RemoveStringController',
          size: 'sm',
          resolve: {
            object: function () {
              return object;
            }
          }
        });

        modalInstance.result.then(function () {
          let index = $scope.stringsData.indexOf($scope.selectedString);
          $scope.stringsData.splice(index, 1);

          $scope.selectedString = null;

          updateLabels();
        }, function () {
        });
      };

      $scope.selectString = function (stringObject) {
        $scope.selectedString = stringObject;
      }

      $scope.updateString = function () {
        if (!$scope.selectedString) return;

        StringsService.updateString($scope.selectedString, (err, data) => {
          if (err) {
            console.log(err);
            return;
          }

          $scope.savedShow = true;

          $timeout(() => {
            $scope.savedShow = false;
          }, 2000);
        });
      }

      $scope.tinymceOptions = {
        plugins: 'link image code autoresize media paste',
        toolbar: 'formatselect | bold, italic, underline, strikethrough | alignleft, aligncenter, alignright, alignjustify | bullist, numlist, outdent, indent',
        height: 600
      };
  }]);
