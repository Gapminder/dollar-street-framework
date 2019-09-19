angular.module('job')
    .controller("RemoveStringController", ['$scope', '$modalInstance', '$http', 'StringsService', 'object',
    function ($scope, $modalInstance, $http, StringsService, object) {
        $scope.id = object._id;
        $scope.name = object.name;

        $scope.ok = function () {
            StringsService.removeString(object, function(err, data) {
                $modalInstance.close('done');
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);