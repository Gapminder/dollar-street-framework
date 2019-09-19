angular.module('job')
  .controller('RemoveThingController', ['$scope', '$modalInstance', 'ThingService', 'thing',
    function ($scope, $modalInstance, ThingService, thing) {
      $scope.name = thing.thingName;
      $scope.ok = function () {
        ThingService.remove(thing, function () {
          $modalInstance.close({thing: thing});
        });
      };
      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }]);
