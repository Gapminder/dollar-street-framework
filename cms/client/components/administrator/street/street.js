angular.module('job')
  .controller('StreetController', ['$scope', '$http', 'cmsConfig', function ($scope, $http, cmsConfig) {
    $scope.loadPage = true;
    $scope.dividerNumber = '';

    $scope.streetBorderTableHeader = [{
      name: 'Poorest',
      class: 'col-md-2 background-white'
    }, {
      name: 'Low',
      class: 'col-md-2 background-white'
    }, {
      name: 'Medium',
      class: 'col-md-2 background-white'
    }, {
      name: 'High',
      class: 'col-md-2 background-white'
    }, {
      name: 'Richest',
      class: 'col-md-2 background-white'
    }, {
      name: '',
      class: 'col-md-2 background-white'
    }];

    $scope.streetDevidersTableHeader = [{
      name: 'First',
      class: 'col-md-3 background-white'
    }, {
      name: 'Second',
      class: 'col-md-4 background-white'
    }, {
      name: 'Third',
      class: 'col-md-3 background-white'
    }, {
      name: '',
      class: 'col-md-2 background-white'
    }];

    $scope.streetLevelsTableHeader = [{
      name: 'First',
      class: 'col-md-3 background-white'
    }, {
      name: 'Second',
      class: 'col-md-3 background-white'
    }, {
      name: 'Third',
      class: 'col-md-3 background-white'
    }, {
      name: 'Fourth',
      class: 'col-md-2 background-white'
    }, {
      name: '',
      class: 'col-md-1 background-white'
    }];

    $http.get(cmsConfig.serverApi + '/street').success(function (data) {
      if (data.error) {
        console.error(data);
        return;
      }
      $scope.streetData = data.data;

      $scope.loadPage = false;
    });

    $scope.isShowDividers = function (data) {
      if (data[0]) {
        data = data[0];
      }

      $http.post(cmsConfig.serverApi + '/show-street-attrs/' + data._id, {showStreetAttrs: data}).success(function (res) {
        if (res.error) {
          console.error(res);
        }
      });
    };

    $scope.saveStreet = function (street, data) {
      if (street[0]) {
        street = street[0];
      } else {
        street.low = 0;
        street.medium = 0;
        street.high = 0;
        street.rich = 0;
        street.poor = 0;
        street.lowDividerCoord = 0;
        street.mediumDividerCoord = 0;
        street.highDividerCoord = 0;
        street.firstLabelName = '';
        street.secondLabelName = '';
        street.thirdLabelName = '';
        street.fourthLabelName = '';
      }

      if (data.low && data.medium && data.high && data.rich && data.poor) {
        if (street.low !== data.low || street.medium !== data.medium || street.high !== data.high || street.poor !== data.poor || street.rich !== data.rich) {
          $http.post(cmsConfig.serverApi + '/street/edit/' + street._id, {
            low: data.low,
            medium: data.medium,
            high: data.high,
            poor: data.poor,
            rich: data.rich
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
            }
          });
        }
      }

      if (data.lowDividerCoord && data.mediumDividerCoord && data.highDividerCoord) {
        if (street.lowDividerCoord !== data.lowDividerCoord || street.mediumDividerCoord !== data.mediumDividerCoord || street.highDividerCoord !== data.highDividerCoord) {
          $http.post(cmsConfig.serverApi + '/street-multi/edit/' + street._id, {
            lowDividerCoord: data.lowDividerCoord,
            mediumDividerCoord: data.mediumDividerCoord,
            highDividerCoord: data.highDividerCoord
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
            }
          });
        }
      }

      if (data.firstLabelName && data.secondLabelName && data.thirdLabelName && data.fourthLabelName) {
        if (
          street.firstLabelName !== data.firstLabelName,
          street.secondLabelName !== data.secondLabelName,
          street.thirdLabelName !== data.thirdLabelName,
          street.fourthLabelName !== data.fourthLabelName
        ) {
          $http.post(cmsConfig.serverApi + '/street-labels/edit/' + street._id, {
            firstLabelName: data.firstLabelName,
            secondLabelName: data.secondLabelName,
            thirdLabelName: data.thirdLabelName,
            fourthLabelName: data.fourthLabelName
          }).success(function (data) {
            if (data.error) {
              console.error(data.error);
            }
          });
        }
      }
    };

    $scope.addDivider = () => {
      const street = $scope.streetData[0];
      const divider = $scope.dividerNumber;
      if (divider) {
        $http.get(`${cmsConfig.serverApi}/street-dividers/add/${street._id}/${divider}`).success( (data) => {

          $scope.streetData = data.data;
          $scope.dividerNumber = '';
        });
      }
    };

    $scope.removeDivider = (divider) => {
      const street = $scope.streetData[0];

      $http.get(`${cmsConfig.serverApi}/street-dividers/remove/${street._id}/${divider}`).success( (data) => {

        $scope.streetData = data.data;
      });
    }

  }]);
