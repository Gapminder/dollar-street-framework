$(window).load(function () {
  $('.fancybox').fancybox({
    openEffect: 'none',
    closeEffect: 'none',
    helpers: {
      overlay: {
        locked: false
      }
    },
    beforeLoad: function () {
      var el = null;
      var id = $(this.element).data('title-id');

      if (id) {
        el = $('.' + id);

        if (el.length) {
          this.title = el.html();
        }
      }
    },
    beforeShow: function () {
      var el = null;
      var id = $(this.element).data('media-title-id');
      var image = $(this.element).data('image');

      if (image) {
        if (history.pushState) {
          var urlPage = location.pathname + location.search + '#id' + (image.id || image._id);
          history.pushState(null, document.title, urlPage);
        } else {
          location.hash = '#id' + (image.id || image._id);
        }
      }

      var frontend = $(this.element).data('frontend');
      var things = window.things;
      var categories = window.categories;
      var places = window.places;
      var currentPlace;

      if (places && image) {
        places.forEach(function (place) {
          if (place._id !== image.place) {
            return;
          }

          currentPlace = place;
        });
      }

      if (currentPlace) {
        var urlThing = 'none_thing';
        var header = '<div class="row"><div class="col-md-6">' + currentPlace.name + '</div>';

        if (image.things.length > 0) {
          var currentThing = things.filter(function (thing) {
            var truthy = false;

            image.things.forEach(function (imgThing) {
              if (thing._id === imgThing._id && imgThing.hidden === 'show') {
                truthy = true;
              }
            });

            return truthy;
          });

          var currentCategories = currentThing.map(function (thing) {
            var categoriesName = [];

            categories.forEach(function (category) {
              if (thing.thingCategory.indexOf(category._id) !== -1 && category.list !== 'black') {
                categoriesName.push(category.name);
              }
            });

            return categoriesName;
          });

          header += '<div class="col-md-6" style="text-align: right">' + Math.round(currentPlace.income) + '$</div></div>';

          currentThing.forEach(function (thing, i) {
            header += '<div class="row"><div class="col-md-6">' + currentThing[i].thingName + '</div>';
            header += '<div class="col-md-6" style="text-align: right">' + currentCategories[i].join() + '</div></div>';

            urlThing = currentThing.length && currentThing[0].thingName;
          });
        } else {
          header += '</div>';
        }

        $(this.skin[0].childNodes[0]).before(header);
        // serverUrl
        /*var url = '/download_image?path=' + image.src +
                  'origin-file-format-' + image.amazonfilename +
                  ';nameFile=' + image.filename +
                  ';thing=' + urlThing +
                  ';place=' + currentPlace.name +
                  ';income=' + Math.round(currentPlace.income);*/

        window.imageDownloadUrl = S3_SERVER + image.src + 'original-' + image.amazonfilename;

        var footer;

        var photographerName = currentPlace.author;

        /*eslint-disable */

        window.saveFile = function(url) {
          var filename = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
          var xhr = new XMLHttpRequest();
          xhr.responseType = 'blob';
          xhr.onload = function() {
            var a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhr.response);
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
          };
          xhr.open('GET', 'http:' + url);
          xhr.send();
        }

        /*eslint-enable */

        if (frontend) {
          footer = '<div class="row" style="padding-top: 10px"><div class="col-md-4"></div>' +
            '<div class="col-md-1" style="text-align: left"></div>' +
            '<div class="col-md-3" style="text-align: center"><a>' +
            '<i class="glyphicon glyphicon-save download_arrow" onclick="window.saveFile(window.imageDownloadUrl)"></i></a></div>' +
            '<div class="col-md-4" style="text-align: right">' + photographerName + '</div>' +
            '</div>';
        } else {
          footer = '<div class="row" style="padding-top:10px"><div class="col-md-4">' + image.filename + '</div>' +
            '<div class="col-md-1" style="text-align: left">' + image.size + '</div>' +
            '<div class="col-md-3" style="text-align: center"><a>' +
            '<i class="glyphicon glyphicon-save download_arrow"  onclick="window.saveFile(window.imageDownloadUrl)"></i></a></div>' +
            '<div class="col-md-4" style="text-align: right">' + photographerName + '</div>' +
            '</div>';
        }

        $(this.skin[0].childNodes[this.skin[0].childNodes.length - 1]).append(footer);
      }

      if (id) {
        el = $('.' + id);

        if (el.length) {
          el.css('width', this.width + 'px');

          $(this.skin[0]).height($(this.skin[0]).height() + 50);
          $(this.skin[0]).append(el.html());
        }
      }
    },
    afterClose: function () {
      window.imageUrl = null;
      window.downloadImage = null;
      window.location.hash = '_';
    }
  });
  fancyboxClose = function () {
    $('.fancybox-close').click();
  };
});
