angular.module('job')
  .factory('OnboardingService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    // serverUrl
    var OnboardingResource = $resource(cmsConfig.serverApi + '/onboarding', {}, {
      getOnboardingTips: {method: 'GET', url: cmsConfig.serverApi + '/onboarding'},
      editOnboardingTips: {method: 'POST', url: cmsConfig.serverApi + '/onboarding/edit/:id'}
    });

    function OnboardingService() {
    }

    OnboardingService.prototype.getTips = function (cb) {
      return OnboardingResource.getOnboardingTips({}, function (res) {
        return cb(res.error, res.data);
      });
    };

    OnboardingService.prototype.editTips = function (options, cb) {
      return OnboardingResource.editOnboardingTips(options.params, options.body, function (res) {
        return cb(res.error, res.data);
      });
    };

    return new OnboardingService();
  }]);

