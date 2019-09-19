angular.module('photo.area', []);
angular.module('photo.area')
  .directive('photoArea', ['$http', function ($http) {
    return {
      restrict: 'E',
      templateUrl: '/components/administrator/places/place/photo-area-template.html',

      link: function (scope, element, attrs) {
        if (attrs.size) {
          attrs.size = Number(attrs.size);
        }
        scope.progress = element[0].getElementsByClassName('photo-area-progress')[0];
        scope.progress.setAttribute('max', '100');
        var isType;
        var count = 0;
        scope.max = 100;
        scope.fileToUpload = [];
        scope.badFiles = [];
        scope.photoArea = {};
        scope.photoArea.imgBoxs = [];
        scope.cancelUploadMedia = false;
        var span = element[0].getElementsByClassName('photo-area-count')[0];
        scope.photoArea.span = span;
        if (attrs.video) {
          isType = 'video';
        }
        if (attrs.image) {
          isType = 'photos';
        }
        angular.element('.photo-area-box').text('Drag folder or single ' + isType + ' here');
        angular.element('.photo-area-edit').css('display', 'none');
        angular.element('.photo-area-bad').css('display', 'none');
        angular.element('.photo-area-count').css('display', 'none');
        angular.element('.photo-area-submit').addClass('disabled');

        var boxNodes = element[0].childNodes[0].childNodes;

        scope.cancelMediaUpload = function () {
          scope.cancelUploadMedia = true;
        };
        element[0].onmousedown = function (e) {
          if (e.target.childNodes.length === 0) {
            return;
          }
          if (e.target.childNodes[0] && e.target.childNodes[0].nodeName !== '#text' || e.button !== 0) {
            return;
          }
          for (var i = 0; i < boxNodes.length; i++) {
            if (boxNodes[i] === e.target.parentNode && scope.editionState) {
              scope.fileToUpload.splice(i - 1, 1);
              scope.photoArea.imgBoxs.splice(i - 1, 1);
              boxNodes[i].parentNode.removeChild(boxNodes[i]);
              count--;
              scope.photoArea.span.innerHTML = 'Add all ' + scope.fileToUpload.length + ' photos';
              if (scope.fileToUpload.length === 0) {
                angular.element('.photo-area-edit').css('display', 'none');
                angular.element('.photo-area-submit').addClass('disabled');
                scope.photoArea.span.innerHTML = '';
                if (attrs.video) {
                  isType = 'video';
                }
                if (attrs.image) {
                  isType = 'photos';
                }
                angular.element('.photo-area-box')
                  .text('Drag folder or single ' + isType + ' here');
              }
            }
          }
        };

        element[0].ondragover = function () {
          return false;
        };

        element[0].ondragleave = function () {
          return false;
        };

        function returnMIME(file) {
          var fileNames = file.split('.');
          var fileExt = fileNames[fileNames.length - 1];

          if (fileExt) {
            var ext = fileExt.toLowerCase();
            if (ext === 'mp4') {
              return 'video/mp4';
            }
            if (ext === 'mov') {
              return 'video/mp4';
            }
            if (ext === 'jpeg' || ext === 'jpg') {
              return 'image/jpeg';
            }
            if (ext === 'mts') {
              return 'video/mp2t';
            }
            if (ext === 'dng') {
              return 'image/x-adobe-dng';
            }
            if (ext === 'nef') {
              return 'image/x-nikon-nef';
            }
            if (ext === 'cr2') {
              return 'image/x-canon-cr2';
            }
            if (ext === 'tif') {
              return 'image/tiff';
            }
            if (ext === 'png') {
              return 'image/png';
            }
          }
        }

        var myWorker = new Worker('assets/js/worker.js');
        myWorker.onmessage = function (data) {
          var dataURL = data.data.url;
          var elem = element[0].getElementsByClassName('photo-area-box');
          var div = document.createElement('div');
          var type;
          var img;
          angular.element(div).addClass('photo-area-boximg');

          scope.photoArea.imgBoxs.push(div);
          if (returnMIME(data.data.name) && attrs.video && returnMIME(data.data.name) !== 'video/mp2t') {
            type = 'videos';
            var video = document.createElement('video');
            var src = document.createElement('source');
            src.src = dataURL;
            src.type = returnMIME(data.data.name);
            elem[0].appendChild(div);
            video.appendChild(src);
            div.appendChild(video);
          }
          if (returnMIME(data.data.name) === 'video/mp2t') {
            img = document.createElement('img');
            type = 'videos';
            img.src = 'http://images.iskysoft.com/mac-video-converter/mts.png';
            elem[0].appendChild(div);
            div.appendChild(img);
          }
          if (
            attrs.image && attrs.type.split(',').indexOf(returnMIME(data.data.name)) !== -1 &&
            returnMIME(data.data.name) !== 'image/tiff'
          ) {
            img = document.createElement('img');
            type = 'photos';
            img.src = dataURL;
            elem[0].appendChild(div);
            div.appendChild(img);
          }
          if (returnMIME(data.data.name) === 'image/tiff') {
            img = document.createElement('img');
            type = 'photos';
            img.src = 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSOvwmlrTRwmLgh8cYClRBl3wsx1ZhpHY0kA-YKBZS8WPmuM72n';
            elem[0].appendChild(div);
            div.appendChild(img);
          }
          var deleteDiv = document.createElement('div');
          deleteDiv.setAttribute('class', 'photo-area-delete-box');
          deleteDiv.innerHTML = '×';
          div.appendChild(deleteDiv);
          count++;
          scope.photoArea.span.innerHTML = 'Add all ' + count + ' ' + type;
          angular.element('.photo-area-submit').addClass('disabled');
          if (data.data.finish) {
            angular.element('.photo-area-submit').removeClass('disabled');
          }
        };
        element[0].ondrop = function (event) {
          event.preventDefault();
          angular.element('.photo-area-submit').addClass('disabled');
          if (
            !!angular.element('.photo-area-box').text() &&
            /×/.test(angular.element('.photo-area-box').text()) !== true
          ) {
            angular.element('.photo-area-box').css('padding-top', '0').text('');
          }
          if (scope.editionState) {
            scope.goToEdition();
          }
          scope.toggleFile = true;
          var dirEnteries = [];

          if (event.dataTransfer && event.dataTransfer.items) {
            var items = event.dataTransfer.items;
            for (var j = 0; j < items.length; j++) {
              dirEnteries.push(items[j].webkitGetAsEntry());
            }
          } else {
            for (var g = 0; g < event.dataTransfer.files.length; g++) {
              dirEnteries = event.dataTransfer.files;
            }
          }
          readDirsWebcit(dirEnteries);
          function readDirsWebcit(enteries) {
            for (var i = 0; i < enteries.length; i++) {
              if (enteries[i].isDirectory) {
                var directoryReader = enteries[i].createReader();
                createReadBrowsStreame(directoryReader, function (data) {
                  readDirsWebcit(data);
                });
              } else {
                if (enteries[i].file) {
                  enteries[i].file(function (file) {
                    detectBadFile(file, viewBadFile);
                  });
                } else {
                  detectBadFile(enteries[i], viewBadFile);
                }
              }
            }
          }

          function createReadBrowsStreame(dir, cb) {
            var enteries = [];

            function readAllEnteries() {
              dir.readEntries(function (results) {
                if (!results.length) {
                  enteries.sort();
                  cb(enteries);
                } else {
                  enteries = enteries.concat(results);
                  readAllEnteries();
                }
              });
            }

            readAllEnteries();
          }

          function detectBadFile(file, cb) {
            if (
              (attrs.image || attrs.video) &&
              attrs.type.split(',').indexOf(returnMIME(file.name)) !== -1 &&
              file.size <= attrs.size * 1024 * 1024
            ) {
              scope.fileToUpload.push(file);
              if (scope.fileToUpload && scope.fileToUpload.length > 0) {
                angular.element('.photo-area-edit').css('display', 'inline-block');
                angular.element('.photo-area-count').css('display', 'inline');
              }
              readAllFiles(file);
              return;
            }
            scope.badFiles.push(file);
            if (cb) {
              cb(file);
            }
          }

          function viewBadFile(file) {
            angular.element('.photo-area-bad').css('display', 'block');

            var elem = element[0].getElementsByClassName('photo-area-bad');
            var divRow = document.createElement('div');

            angular.element(divRow).addClass('row');

            var divFileName = document.createElement('div');

            angular.element(divFileName).addClass('photo-area-badFileName col-md-6').text(file.name);

            var elemReason = document.createElement('div');

            if (attrs.size * 1024 * 1024 < file.size) {
              angular.element(elemReason)
                .addClass('photo-area-reason col-md-6')
                .text('file size more ' + Math.round(attrs.size) + ' Mb');
            }
            if ((attrs.image || attrs.video) && attrs.type.split(',').indexOf(returnMIME(file.name)) === -1) {
              angular.element(elemReason)
                .addClass('photo-area-reason col-md-6')
                .text('this format is not supported');
            }
            if (file.size === 0) {
              angular.element(elemReason)
                .addClass('photo-area-reason col-md-6')
                .text('this browser is not support folder upload');
            }
            divRow.appendChild(divFileName);
            divRow.appendChild(elemReason);
            elem[0].appendChild(divRow);
          }

          function readAllFiles(data) {
            myWorker.postMessage({file: data});
          }
        };

        scope.goToEdition = function () {
          scope.editionState = !scope.editionState;
          if (scope.editionState) {
            angular.element(boxNodes).addClass('photo-area-edition');
            angular.element('.photo-area-edit').text('Quit edit mode');
            angular.element('.photo-area-submit').addClass('disabled');
          } else {
            angular.element(boxNodes).removeClass('photo-area-edition');
            angular.element('.photo-area-edit').text('Edit');
            angular.element('.photo-area-submit').removeClass('disabled');
          }
        };

        scope.uploaderMedia = function () {
          if (angular.element('.photo-area-submit').hasClass('disabled')) {
            return;
          }
          angular.element('.photo-area-edit').css('display', 'none');
          angular.element('.photo-area-submit').css('display', 'none');
          angular.element('.photo-area-box').scrollTop(0);
          if (scope.fileToUpload) {
            scope.photoArea.countProg = 0;
            scope.photoArea.count = 0;
            scope.progresShow = true;
            scope.photoArea.stop = false;
            scope.uploadFileToUrl(scope.fileToUpload, attrs.uploadUrl, scope.photoArea.count, scope.photoArea);
          }
        };

        function Trigger(scope, file, count, duration) {
          var i = count;
          var int;

          function trigger() {
            if (i === count) {
              i++;
            } else {
              i--;
            }
            if (file.length === 1) {
              scope.progress.setAttribute('style', 'width:' + Math.floor(1 / file.length * 100) + '%');
            }
            if (i <= file.length) {
              scope.progress.setAttribute('style', 'width:' + Math.floor(i / file.length * 100) + '%');
            }
          }

          this.start = function () {
            int = setInterval(trigger, duration);
          };
          this.stop = function () {
            clearInterval(int);
          };
        }

        scope.uploadFileToUrl = function (file, uploadUrl, count, photoArea) {
          if (scope.cancelUploadMedia) {
            return;
          }
          var fd = new FormData();
          fd.append('file', file[count]);
          var trig = new Trigger(scope, file, count, 1400);
          trig.start();
          $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
          }).success(function () {
            trig.stop();
            count++;
            if (photoArea.stop === true) {
              return;
            }
            var percentage;
            if (file.length === 1) {
              scope.progress.setAttribute('style', 'width:' + Math.floor(1 / file.length * 100) + '%');
            }
            if (count <= file.length) {
              percentage = Math.floor(count / file.length * 100);
              scope.progress.setAttribute('style', 'width:' + percentage + '%');
              scope.statusUpload = percentage + '% (' + count + '/' + file.length + ')';
            }
            photoArea.type = 'success';
            if (count <= file.length - 1) {
              scope.uploadFileToUrl(file, uploadUrl, count, photoArea);
              scope.photoArea.span.innerHTML = count + ' of ' + file.length + ' added';
              constructIndicate(count, scope.photoArea.imgBoxs, function () {
                if (count >= 24 && count % 24 === 1) {
                  var scroll = angular.element('.photo-area-box').scrollTop();
                  angular.element('.photo-area-box').scrollTop(scroll + 3 * 102);
                }
              });
            }
            if (count === file.length || file.length === 1) {
              scope.photoArea.span.innerHTML = count + ' of ' + file.length + ' added';
              scope.photoArea.closeProgres = true;
              constructIndicate(count, scope.photoArea.imgBoxs, scope.photoAreaAfterUpload, 1000);
            }
          });
        };
        function constructIndicate(count, parents, cb, time) {
          var div = document.createElement('div');
          div.style.display = 'none';
          var span = document.createElement('span');
          span.setAttribute('class', 'glyphicon glyphicon-ok ');
          div.setAttribute('class', 'photo-area-ok');
          div.appendChild(span);
          parents[count - 1].appendChild(div);
          div.style.display = 'block';
          if (time) {
            setTimeout(function () {
              if (cb) {
                cb();
              }
            }, time);
            return;
          }
          if (cb) {
            cb();
          }
        }
      }
    };
  }]);
