/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-14 */

function generate() {
  var tripsConfig = {
    colors:["#FF0080", "#408080", "#004000", "#804000", "#80FFFF", "#8080FF",
            "#004040", "#0080FF", "#008040", "#808000"],
    indexFilename:"index.xml",
    dataFilename:"D:\\post\\omat\\ohjelmat\\habb\\live\\tripsData.xml",
    visitedDataDirectory:"visited_datas", readyTrips:0
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
      tripData.visitedDataFilename = tripsConfig.visitedDataDirectory + "/" +
                                     trips[i].getAttribute("visited_data");
      tripData.name = trips[i].getAttribute("name");
      tripData.ccDistance = trips[i].getAttribute("distance");
      tripData.ccDuration = trips[i].getAttribute("duration");
      tripData.ccMaxSpeed = trips[i].getAttribute("max_speed");
      tripData.ccAvgSpeed = trips[i].getAttribute("avg_speed");
      tripsData.push(tripData);
      setTripGpsData(tripsConfig, trips[i].getAttribute("gps_data"), i);
    }

    tripsConfig.data = tripsData;
  });
}

function setTripGpsData(tripsConfig, gpsDataFilename, tripIndex) {
  var polylineEncoder = new PolylineEncoder();

  GDownloadUrl(gpsDataFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trks = xml.documentElement.getElementsByTagName("trk");
    var points = getPoints(trks[0].getElementsByTagName("trkpt"));

    var color = tripsConfig.colors[tripIndex % tripsConfig.colors.length];
    var encodedPolyline = polylineEncoder.dpEncodeToJSON(points, color);
    var times = trks[0].getElementsByTagName("time");
    var date = times[0].firstChild.nodeValue;
    date = date.substr(0, 10); /* 2009-07-19T10:23:21Z */
    var duration = getDuration(times[0].firstChild.nodeValue,
                               times[times.length - 1].firstChild.nodeValue);
    var distance = Math.round((new GPolyline(points)).getLength() / 1000);
    var maxSpeed = getMaxSpeed(trks[0].getElementsByTagName("speed"));
    var maxAltitude = getMaxAltitude(trks[0].getElementsByTagName("ele"));

    tripsConfig.data[tripIndex].encodedPolyline = encodedPolyline;
    tripsConfig.data[tripIndex].date = date;
    tripsConfig.data[tripIndex].gpsDuration = duration;
    tripsConfig.data[tripIndex].gpsDistance = distance;
    tripsConfig.data[tripIndex].gpsMaxSpeed = maxSpeed;
    tripsConfig.data[tripIndex].gpsMaxAltitude = maxAltitude;

    tripsConfig.readyTrips += 1;

    setStatus("Generating " + tripsConfig.readyTrips + "/" +
              tripsConfig.data.length);

    if (tripsConfig.readyTrips == tripsConfig.data.length) {
      writeToFile(tripsConfig);
    }
  });
}

function getPoints(trkpts) {
  var points = new Array(0);

  for (var i = 0; i < trkpts.length; i++) {
    points[i] = new GLatLng(parseFloat(trkpts[i].getAttribute("lat")),
                            parseFloat(trkpts[i].getAttribute("lon")));
  }

  return points;
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

function getMaxMeasurement(measurements) {
  var maxMeasurement = 0;

  for (var i = 0; i < measurements.length; i++) {
    maxMeasurement =
      Math.max(maxMeasurement, measurements[i].firstChild.nodeValue);
  }

  return maxMeasurement;
}

function getMaxSpeed(speedMeasurements) {
  var maxSpeed = getMaxMeasurement(speedMeasurements);

  maxSpeed = Math.round(maxSpeed * 10) / 10;

  return maxSpeed;
}

function getMaxAltitude(altitudeMeasurements) {
  var maxAltitude = getMaxMeasurement(altitudeMeasurements);

  maxAltitude = Math.round(maxAltitude);

  return maxAltitude;
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
    var rv = FileIO.write(fileOut, outputText, '', 'UTF-8');

    if (rv == false) {
      statusText = "Failed to write file: " + filename;
    } else {
      statusText =
        "Wrote tripsData (" + tripsConfig.data.length + ") to: " + filename;
    }
  }

  setStatus(statusText);
}
