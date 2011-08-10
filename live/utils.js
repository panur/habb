/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-10 */

function Utils() {
  var that = this; /* http://javascript.crockford.com/private.html */

  this.downloadUrl = function(url, callback) {
    var request = createXmlHttpRequest();

    if (request == null) {
      return false;
    }

    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        try {
          var status = request.status;
          if ((status == 0) || (status == 200)) {
            callback(request.responseText, status);
            request.onreadystatechange = function() {};
          }
        } catch (e) {
          alert(e);
        }
      }
    }

    request.open("GET", url, true);
    request.send(null);
  }

  function createXmlHttpRequest() {
    try {
      if (typeof ActiveXObject != "undefined") {
        return new ActiveXObject("Microsoft.XMLHTTP");
      } else if (window["XMLHttpRequest"]) {
        return new XMLHttpRequest();
      }
    } catch (e) {
      alert(e);
    }

    alert("Cannot create XmlHttpRequest");

    return null;
  }

  this.parseXml = function(string) {
    if (window.ActiveXObject) {
      var doc = new ActiveXObject('Microsoft.XMLDOM');
      doc.loadXML(string);
      return doc;
    } else if (window.DOMParser) {
      return (new DOMParser).parseFromString(string, 'text/xml');
    }
  }

  this.getIndexOf = function(array, value) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] == value) {
        return i;
      }
    }

    return -1;
  }

  this.resizeArray = function (originalArray, newArray, newSize) {
    if (newSize < originalArray.length) {
      downsampleArray(originalArray, newArray, newSize);
    } else {
      for (var x = 0; x < newSize; x++) {
        var newX = Math.floor((x / newSize) * originalArray.length);
        newArray.push(originalArray[newX]);
      }
    }
  }

  function downsampleArray(originalArray, newArray, newSize) {
    var xRatio = Math.round(originalArray.length / newSize);
    var middleX = 0;
    var lowX = 0;
    var highX = 0;
    var newY = 0;

    for (var x = 0; x < newSize; x++) {
      middleX = Math.round((x / newSize) * originalArray.length);
      lowX = Math.round(middleX - (xRatio / 2));
      highX = Math.round(middleX + (xRatio / 2));
      newY = 0;

      if ((lowX > 0) && (highX < originalArray.length)) {
        for (var i = 0; i < xRatio; i++) {
          newY += originalArray[lowX + i];
        }
        newY = newY / xRatio;
      } else {
        newY = originalArray[middleX];
      }

      newY = Math.round(newY);
      newArray.push(newY);
    }
  }

  this.getTimeString = function(seconds) {
    var date = new Date(Math.round(seconds) * 1000);
    var timeString = date.toUTCString();
    timeString = timeString.substr(17, 8); /* Thu, 01 Jan 1970 04:32:54 GMT */

    return timeString; /* 04:32:54 */
  }

  this.createControlElement = function (title, text, handler) {
    var a = document.createElement("a");

    a.title = title;
    a.onclick = handler;
    a.textContent = text;
    a.href = "javascript:";

    return a;
  }

  this.createHideElement = function (className) {
    var img = document.createElement("img");

    img.className = className;
    img.src = "http://maps.google.com/mapfiles/iw_close.gif";

    return img;
  }
}
