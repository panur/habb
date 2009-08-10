/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-10 */

function generate() {
  var tripsConfig = {
    readyTrips:0, color:"#FF0080", indexFilename:"index.xml",
    dataFilename:"D:\\post\\omat\\ohjelmat\\habb\\live\\tripsData.xml"
  };

  setStatus("Please wait...");
  setTripsData(tripsConfig);
}

function setStatus(statusText) {
  var statusBar = document.getElementById("status_bar");
  statusBar.innerHTML = statusText;
}

function setTripsData(tripsConfig) {
  var tripsData = [];

  GDownloadUrl(tripsConfig.indexFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trips = xml.documentElement.getElementsByTagName("trip");

    for (var i = 0; i < trips.length; i++) {
      var tripData = {};
      tripData.visibility = "hidden";
      tripData.filename = trips[i].getAttribute("filename");
      tripData.name = trips[i].getAttribute("name");
      tripsData.push(tripData);
      setTripGpsData(tripsConfig, tripData.filename);
    }

    tripsConfig.data = tripsData;
  });
}

function setTripGpsData(tripsConfig, tripFilename) {
  var polylineEncoder = new PolylineEncoder();

  GDownloadUrl(tripFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trks = xml.documentElement.getElementsByTagName("trk");

    for (var i = 0; i < trks.length; i++) {
      var trkpts = trks[i].getElementsByTagName("trkpt");
      var points = new Array(0);

      for (var j = 0; j < trkpts.length; j++) {
        points[j] = new GLatLng(parseFloat(trkpts[j].getAttribute("lat")),
                                parseFloat(trkpts[j].getAttribute("lon")));
      }

      var encodedPolyline =
        polylineEncoder.dpEncodeToJSON(points, tripsConfig.color);
      var times = trks[i].getElementsByTagName("time");
      var date = times[0].firstChild.nodeValue;
      date = date.substr(0, 10); /* 2009-07-19T10:23:21Z */
      var duration = getDuration(times[0].firstChild.nodeValue,
                                 times[times.length - 1].firstChild.nodeValue);
/*
      GEvent.addListener(polyline, "mouseover", function() {
        polyline.setStrokeStyle({'color':'#FFFFFF'});
      });

      GEvent.addListener(polyline, "mouseout", function() {
        polyline.setStrokeStyle({'color':'#FF0080'});
      });
*/

      for (var i = 0; i < tripsConfig.data.length; i++) {
        if (tripsConfig.data[i].filename == tripFilename) {
          tripsConfig.data[i].encodedPolyline = encodedPolyline;
          tripsConfig.data[i].date = date;
          tripsConfig.data[i].duration = duration;
          break;
        }
      }
    }

    tripsConfig.readyTrips += 1;

    setStatus("Generating " + tripsConfig.readyTrips + "/" +
              tripsConfig.data.length);

    if (tripsConfig.readyTrips == tripsConfig.data.length) {
      writeToFile(tripsConfig);
    }
  });
}

function getDuration(start, end) {
  var durationInSeconds =
    secondsSinceMidnight(end) - secondsSinceMidnight(start);
  var date = new Date(durationInSeconds * 1000)
  var duration = date.toUTCString();
  duration = duration.substr(17, 8); /* Thu, 01 Jan 1970 04:32:54 GMT */

  return duration;
}

function secondsSinceMidnight(date) {
  /* 2009-07-19T10:23:21Z */
  var hours = date.substr(11, 2);
  var minutes = date.substr(14, 2);
  var seconds = date.substr(17, 2);
  var secondsSinceMidnight = (hours * 3600) + (minutes * 60) + (seconds * 1);

  return secondsSinceMidnight;
}

function writeToFile(tripsConfig) {
  var filename = tripsConfig.dataFilename;
  netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
  var fileOut = FileIO.open(filename);
  var statusText;

  if (fileOut == false) {
    statusText = "Failed to open file: " + filename;
  } else {
    var myJSONText = JSON.stringify(tripsConfig.data);
    var outputText =
      "<trips>\n<data>\n" + myJSONText + "\n</data>\n</trips>\n";
    var rv = FileIO.write(fileOut, outputText);

    if (rv == false) {
      statusText = "Failed to write file: " + filename;
    } else {
      statusText =
        "Wrote tripsData (" + tripsConfig.data.length + ") to: " + filename;
    }
  }

  setStatus(statusText);
}
