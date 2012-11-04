var XULHabbChrome = {};

XULHabbChrome.main = function() {
  var processFile = function (event) {
    var file = event.detail;

    alert("Received file: " + file.name);

    var fileOut = FileIO.open(file.name);

    if (fileOut == false) {
      alert("Failed to create file!");
    } else {
      var rv = FileIO.write(fileOut, file.data, '', 'UTF-8');
      if (rv == false) {
        alert("Failed to write file!");
      }
    }
  };
  var url = "file:///D:/post/omat/ohjelmat/habb/live/trips/generate.html";
  var generatorWindow = window.open(url, "habbGenerator");
  if (generatorWindow && generatorWindow.addEventListener) {
    alert("Launched generator");
    generatorWindow.addEventListener("habbGeneratedFile", processFile, false);
  }
};
