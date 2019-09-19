angular.module('job')
    .controller("RemoveUserTypeController", ['$scope', '$modalInstance', '$http', 'type', 'cmsConfig',
    function ($scope, $modalInstance, $http, type, cmsConfig) {
        $scope.name = type.name;

        $scope.ok = function () {
            $http.post(cmsConfig.serverApi + '/users/types/remove/' + type._id).success(function (data) {
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
    }]);