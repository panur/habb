/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-09 */

function Utils() {
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

  this.createControlElement = function (title, text, handler) {
    var a = document.createElement("a");

    a.title = title;
    a.onclick = handler;
    a.textContent = text;
    a.href = "javascript:";

    return a;
  }
}
