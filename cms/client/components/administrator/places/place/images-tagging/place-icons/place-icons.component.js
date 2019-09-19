angular.module('job')
  .directive('placeIcons', ['PlaceIconsService', function (PlaceIconsService) {
    return {
      restrict: 'E',
      scope: {
        placeId: '=',
        activeIconType: '=',
        selectedIcon: '='
      },
      templateUrl: 'components/administrator/places/place/images-tagging/place-icons/place-icons.template.html',
      link: function (scope) {
        scope.activeIconType = null;

        PlaceIconsService.getIcons({placeId: scope.placeId}, function (err, data) {
          if (err) {
            console.error(err);
            return;
          }

          scope.icons = data;
        });

        scope.selectIcon = function (image) {
          scope.activeIcon = image;
          scope.activeIconType = scope.activeIconType === image.type ? null : image.type;
        };

        scope.$watchCollection('selectedIcon', function (value) {
          if (!value || !value.image || !scope.activeIconType) {
            return;
          }

          var newImage = value.image;

          var updateImages = {
            old: scope.activeIcon,
            newIcon: newImage
          };

          PlaceIconsService.updateIcons(updateImages, function (err) {
            if (err) {
              console.error(err);
              return;
            }

            _.forEach(scope.icons, function (icon) {
              if (icon._id === scope.activeIcon._id && icon.type === scope.activeIcon.type) {
                icon._id = newImage._id;
                icon.image = newImage.image;
              }
            });

            scope.activeIconType = null;
          });
        });
      }
    };
  }]);
