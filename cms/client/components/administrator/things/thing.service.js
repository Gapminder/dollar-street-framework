angular.module('job')
  .factory('ThingService', ['$resource', 'cmsConfig', function ($resource, cmsConfig) {
    /*eslint-disable */
    // serverUrl
    var ThingResource = $resource(cmsConfig.serverApi + '/thing/edit/:id', {}, {
      edit: {method: 'POST', url: cmsConfig.serverApi + '/thing/edit/:id', headers: {'Content-Type': undefined}},
      editList: {method: 'POST', url: cmsConfig.serverApi + '/thing/:id/list'},
      editIsMainPage: {method: 'POST', url: cmsConfig.serverApi + '/thing/main'},
      new: {method: 'POST', url: cmsConfig.serverApi + '/thing/new', headers: {'Content-Type': undefined}},
      remove: {method: 'POST', url: cmsConfig.serverApi + '/thing/remove/:id', headers: {'Content-Type': undefined}},
      removeIcon: {method: 'GET', url: cmsConfig.serverApi + '/thing/remove/icon/:id'}
    });
    /*eslint-enable */
    function ThingService() {
    }

    ThingService.prototype.remove = function (thing, cb) {
      var formData = new FormData();
      if (thing.icon) {
        formData.append('icon', thing.icon);
      }
      ThingResource.remove({id: thing._id}, formData, cb);
    };
    ThingService.prototype.removeIcon = function (id, cb) {
      ThingResource.removeIcon({id: id}, cb);
    };

    ThingService.prototype.editList = function (options, cb) {
      return ThingResource.editList({id: options._id}, {list: options.list}, function (res) {
        return cb(res.error, res.data);
      });
    };

    ThingService.prototype.editIsMainPage = function (options, cb) {
      return ThingResource.editIsMainPage({}, {id: options._id, isPublic: options.isPublic}, function (res) {
        return cb(res.error, res.data);
      });
    };
    ThingService.prototype.validationForName = function (options, cb) {
      if (options.name) {
        var findThing = _.find(options.things, function (thing) {
          return thing.thingName.toLowerCase() === options.name.toLowerCase();
        });

        if (!findThing) {
          cb(true);
        } else {
          cb(false);
        }
      } else {
        cb(false);
      }
    };

    ThingService.prototype.save = function (options, cb) {
      var formData = this.wrapDataToRequest(options);

      if (options.editThing) {
        ThingResource.edit({id: options.editThing._id}, formData, cb);
      } else {
        ThingResource.new(formData, cb);
      }
    };

    ThingService.prototype.wrapDataToRequest = function (data) {
      var formData = new FormData();

      formData.append('thingName', data.name);
      formData.append('plural', data.plural);
      formData.append('rating', data.rating || 0);
      formData.append('list', data.list);

      if (data.icon) {
        formData.append('icon', data.icon);
      }

      if (data.description) {
        formData.append('thingDescription', data.description);
      }
      if (data.synonymous && data.synonymous.length) {
        formData.append('synonymous', JSON.stringify(data.synonymous));
      }
      if (data.category && data.category.length) {
        formData.append('thingCategory', JSON.stringify(data.category));
      }
      if (data.relatedThings && data.relatedThings.length) {
        formData.append('relatedThings', JSON.stringify(data.relatedThings));
      }
      if (data.tags && data.tags.length) {
        formData.append('tags', JSON.stringify(data.tags));
      }
       return formData;
    };

    return new ThingService();
  }]);
