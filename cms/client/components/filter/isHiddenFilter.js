angular
  .module('job')
  .filter('isHiddenString', [function () {
    return function (isHidden, reverse) {
      var text = null;

      if (reverse) {
        text = isHidden ? 'Visible' : 'Hidden';
      } else {
        text = isHidden ? 'Hidden' : 'Visible';
      }

      return text;
    };
  }]);
