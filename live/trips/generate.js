/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-10-10 */

function generate() {
  var tripsConfig = {
    indexFilename:"index.xml",
    dataFilename:"D:\\post\\omat\\ohjelmat\\habb\\live\\tripsData.xml",
    visitedDataDirectory:"visited_datas", readyTrips:0, polylineWeight:3,
    polylineOpacity:0.9
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
      tripData.color = trips[i].getAttribute("color");
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
  var polylineEncoder = new PolylineEncoder(18, 2, 0.000005);

  GDownloadUrl(gpsDataFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trks = xml.documentElement.getElementsByTagName("trk");
    var points = getPoints(trks[0].getElementsByTagName("trkpt"));
    var times = trks[0].getElementsByTagName("time");
    var color = tripsConfig.data[tripIndex].color;

    tripsConfig.data[tripIndex].encodedPolyline =
      polylineEncoder.dpEncodeToJSON(points, color, tripsConfig.polylineWeight,
                                     tripsConfig.polylineOpacity);

    tripsConfig.data[tripIndex].date =
      times[0].firstChild.nodeValue.substr(0, 10); /* 2009-07-19T10:23:21Z */

    tripsConfig.data[tripIndex].gpsDuration = getDuration(times);

    tripsConfig.data[tripIndex].gpsDistance =
      Math.round((new GPolyline(points)).getLength() / 1000);

    tripsConfig.data[tripIndex].gpsMaxSpeed =
      getMaxSpeed(trks[0].getElementsByTagName("speed"), points);

    tripsConfig.data[tripIndex].gpsMaxAltitude =
      getMaxAltitude(trks[0].getElementsByTagName("ele"), points);

    tripsConfig.data[tripIndex].gpsSpeedData =
      getSpeedData(trks[0].getElementsByTagName("speed"), points);

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

function getDuration(times) {
  var start = times[0].firstChild.nodeValue;
  var end = times[times.length - 1].firstChild.nodeValue;
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
  var maxMeasurement = {value:0, index:0};

  for (var i = 0; i < measurements.length; i++) {
    var value = new Number(measurements[i].firstChild.nodeValue);
    if (value > maxMeasurement.value) {
      maxMeasurement.value = value;
      maxMeasurement.index = i;
    }
  }

  return maxMeasurement;
}

function getMaxSpeed(speedMeasurements, points) {
  var maxMeasurement = getMaxMeasurement(speedMeasurements);
  var maxSpeed = {};

  maxSpeed.value = Math.round(maxMeasurement.value * 10) / 10;
  maxSpeed.location = points[maxMeasurement.index];

  return maxSpeed;
}

function getMaxAltitude(altitudeMeasurements, points) {
  var maxMeasurement = getMaxMeasurement(altitudeMeasurements);
  var maxAltitude = {};

  maxAltitude.value = Math.round(maxMeasurement.value);
  maxAltitude.location = points[maxMeasurement.index];

  return maxAltitude;
}

function getSpeedData(measurements) {
  var speedData = [];
  var maxLength = 2000;

  if (measurements.length < maxLength) {
    for (var i = 0; i < measurements.length; i++) {
      var value = Math.round(new Number(measurements[i].firstChild.nodeValue));
      speedData.push(value);
    }
  } else {
    var tmpArray = [];
    for (var i = 0; i < measurements.length; i++) {
      tmpArray.push(new Number(measurements[i].firstChild.nodeValue));
    }
    resizeArray(tmpArray, speedData, maxLength);
  }

  return speedData;
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
