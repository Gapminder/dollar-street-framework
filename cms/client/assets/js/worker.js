var self = this;
self.arrImg = [];
self.process = 0;
onmessage = function (e) {
  self.arrImg.push(e.data.file);
  var fileReadObj = new FileReader();
  fileReadObj.onload = function () {
    var dataURL = fileReadObj.result;
    self.arrImg.splice(0, 1);
    if (self.arrImg.length) {
      self.postMessage({url: dataURL, name: e.data.file.name, finish: false});
      fileReadObj.readAsDataURL(self.arrImg[0]);
      return;
    }
    self.process = 0;
    self.postMessage({url: dataURL, name: e.data.file.name, finish: true});
  };
  self.process++;
  if (self.arrImg.length && process < 2) {
    fileReadObj.readAsDataURL(self.arrImg[0]);
  }
};
