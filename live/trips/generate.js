/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2012-08-21 */

var utils = new Utils();

function generateAll() {
  generate(2009);
  generate(2010);
  generate(2011);
  generate(2012);
}

function generate(year) {
  var tripsConfig = {
    indexFilename:"index.xml",
    dataFilename:
      "D:\\post\\omat\\ohjelmat\\habb\\live\\tripsData" + year + ".xml",
    visitedDataDirectory:"visited_datas", readyTrips:0, polylineWeight:3,
    polylineOpacity:0.9, data:[]
  };

  setStatus("Please wait...");
  setTripsData(tripsConfig, year);
}

function setStatus(statusText) {
  var statusBar = document.getElementById("status_bar");
  statusBar.innerHTML = statusText;
}

function setTripsData(tripsConfig, filenameFilter) {
  GDownloadUrl(tripsConfig.indexFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trips = xml.documentElement.getElementsByTagName("trip");

    for (var i = 0; i < trips.length; i++) {
      if ((filenameFilter == "") ||
          (trips[i].getAttribute("gps_data").indexOf(filenameFilter) == 0)) {
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
        tripData.gpsData = trips[i].getAttribute("gps_data");

        tripsConfig.data.push(tripData);
      }
    }

    setTripGpsData(tripsConfig, 0);
  });
}

function getTrk(xml) {
  var trks = xml.documentElement.getElementsByTagName("trk");
  var trkpt = trks[0].getElementsByTagName("trkpt");
  var time = trks[0].getElementsByTagName("time");
  var speed = trks[0].getElementsByTagName("speed");
  var ele = trks[0].getElementsByTagName("ele");
  var trk = [];

  for (var i = 0; i < trkpt.length; i++) {
    var trkElement = {};
    trkElement["trkpt"] = trkpt[i];
    trkElement["time"] = time[i];
    trkElement["speed"] = speed[i];
    trkElement["ele"] = ele[i];
    trk.push(trkElement);

    if (i < trkpt.length - 1) {
      fillGap();
    }
  }

  return trk;

  function fillGap() {
    var gapStart = time[i].firstChild.nodeValue;
    var gapEnd = time[i + 1].firstChild.nodeValue;
    var gapInSeconds =
      secondsSinceMidnight(gapEnd) - secondsSinceMidnight(gapStart);

    if (gapInSeconds > 10) {
      console.info("Gap: i=" + i + ", seconds=" + gapInSeconds +
                   ", start=" + gapStart);
      var fillElement = trkElement;
      fillElement["speed"].firstChild.nodeValue = 0;
      for (var j = 0; j < Math.floor(gapInSeconds / 4); j++) {
        trk.push(fillElement);
      }
    }
  }
}

function getTrkArray(trk, name) {
  var trkArray = [];

  for (var i = 0; i < trk.length; i++) {
    trkArray.push(trk[i][name]);
  }

  return trkArray;
}

function setTripGpsData(tripsConfig, tripIndex) {
  var gpsDataFilename = tripsConfig.data[tripIndex].gpsData;
  delete tripsConfig.data[tripIndex].gpsData;
  var polylineEncoder = new PolylineEncoder(18, 2, 0.000005);

  GDownloadUrl(gpsDataFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trk = getTrk(xml);
    var points = getPoints(getTrkArray(trk, "trkpt"));
    var times = getTrkArray(trk, "time");
    var color = tripsConfig.data[tripIndex].color;

    tripsConfig.data[tripIndex].encodedPolyline =
      polylineEncoder.dpEncodeToJSON(points, color, tripsConfig.polylineWeight,
                                     tripsConfig.polylineOpacity);

    tripsConfig.data[tripIndex].encodedVertexTimes =
      getEncodedVertexTimes(tripsConfig.data[tripIndex].encodedPolyline, points,
                            times);

    tripsConfig.data[tripIndex].date =
      times[0].firstChild.nodeValue.substr(0, 10); /* 2009-07-19T10:23:21Z */

    tripsConfig.data[tripIndex].gpsDuration = getDuration(times);

    tripsConfig.data[tripIndex].gpsDurationSeconds = getDurationSeconds(times);

    tripsConfig.data[tripIndex].gpsDistance =
      getDistance(points, gpsDataFilename);

    tripsConfig.data[tripIndex].gpsMaxSpeed =
      getMaxSpeed(getTrkArray(trk, "speed"), points);

    tripsConfig.data[tripIndex].gpsMaxAltitude =
      getMaxAltitude(getTrkArray(trk, "ele"), points);

    tripsConfig.data[tripIndex].encodedGpsSpeedData =
      getEncodedGpsData(getTrkArray(trk, "speed"), 1);

    tripsConfig.data[tripIndex].encodedGpsAltitudeData =
      getEncodedGpsData(getTrkArray(trk, "ele"), 2);

    tripsConfig.readyTrips += 1;

    setStatus("Generating " + tripsConfig.readyTrips + "/" +
              tripsConfig.data.length);

    if (tripsConfig.readyTrips == tripsConfig.data.length) {
      writeToFile(tripsConfig);
    } else {
      setTripGpsData(tripsConfig, tripIndex + 1);
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

function getEncodedVertexTimes(encodedPolyline, points, times) {
  var vertexTimes = new Array(0);
  var polyline = GPolyline.fromEncoded(encodedPolyline);
  var pointIndex = 0;
  var previousPointIndex = 0;

  for (var i = 0; i < polyline.getVertexCount(); i++) {
    pointIndex =
      getPointIndex(points, polyline.getVertex(i), previousPointIndex);

    if (pointIndex != -1) {
      vertexTimes[i] = getPointTime(times, pointIndex);
      previousPointIndex = pointIndex + 1;
    } else {
      vertexTimes[i] = 0;
      GLog.write("Failed to find point index for vertex index: " + i);
    }
  }

  for (var i = vertexTimes.length - 1; i > 0; i--) {
    vertexTimes[i] = vertexTimes[i] - vertexTimes[i - 1];
    if (vertexTimes[i] < 0) {
      GLog.write("Negative time at index: " + i);
    }
  }

  vertexTimes[0] = 0;

  var encodedVertexTimes = runLengthEncode(vertexTimes);

  encodedVertexTimes = arrayToStringEncode(encodedVertexTimes, 1);

  return encodedVertexTimes;
}

function runLengthEncode(sourceArray) {
  var encodedArray = [];
  var runLength = 0;
  var elementValue = sourceArray[0];

  for (var i = 0; i < sourceArray.length; i++) {
    if (sourceArray[i] == elementValue) {
      runLength += 1;
    } else {
      encodedArray.push(runLength);
      encodedArray.push(elementValue);
      runLength = 1;
      elementValue = sourceArray[i];
    }
  }

  encodedArray.push(runLength);
  encodedArray.push(elementValue);

  return encodedArray;
}

function getPointIndex(points, point, previousIndex) {
  for (var i = previousIndex ; i < points.length; i++) {
    if ((Math.abs(point.lat() -  points[i].lat()) < 0.0001) &&
        (Math.abs(point.lng() -  points[i].lng()) < 0.0001)) {
      return i;
    }
  }

  return -1;
}

function getPointTime(times, index) {
  var start = times[0].firstChild.nodeValue;
  var end = times[index].firstChild.nodeValue;
  var pointTime = secondsSinceMidnight(end) - secondsSinceMidnight(start);

  return pointTime;
}

function getDuration(times) {
  var durationInSeconds = getDurationSeconds(times);
  var duration = utils.getTimeString(durationInSeconds);

  return duration;
}

function getDurationSeconds(times) {
  var start = times[0].firstChild.nodeValue;
  var end = times[times.length - 1].firstChild.nodeValue;
  var durationInSeconds =
    secondsSinceMidnight(end) - secondsSinceMidnight(start);

  return durationInSeconds;
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

function getDistance(points, gpsDataFilename) {
  var distance = (new GPolyline(points)).getLength();

  for (var i = 0; i < points.length - 1; i++) {
    var d = Math.round((new GPolyline([points[i], points[i + 1]])).getLength());
    if (d > 1000) {
      console.info("Gap in " + gpsDataFilename + ": i=" + i + ", meters=" + d +
                   ", point=" + points[i]);
      distance -= d;
    }
  }

  return Math.round(distance / 1000);
}

function getMaxSpeed(speedMeasurements, points) {
  var maxMeasurement = getMaxMeasurement(speedMeasurements);
  var maxSpeed = {};

  maxSpeed.value = Math.round(maxMeasurement.value * 10) / 10;
  maxSpeed.location = {x:points[maxMeasurement.index].lng(),
                       y:points[maxMeasurement.index].lat()};

  return maxSpeed;
}

function getMaxAltitude(altitudeMeasurements, points) {
  var maxMeasurement = getMaxMeasurement(altitudeMeasurements);
  var maxAltitude = {};

  maxAltitude.value = Math.round(maxMeasurement.value);
  maxAltitude.location = {x:points[maxMeasurement.index].lng(),
                          y:points[maxMeasurement.index].lat()};

  return maxAltitude;
}

function getEncodedGpsData(measurements, scale) {
  var gpsData = [];
  var maxLength = 2000;
  var tmpArray = [];

  for (var i = 0; i < measurements.length; i++) {
    var value = (new Number(measurements[i].firstChild.nodeValue)) / scale;
    value = Math.max(value, 0);
    tmpArray.push(value);
  }

  if (measurements.length < maxLength) {
    for (var i = 0; i < measurements.length; i++) {
      gpsData[i] = Math.round(tmpArray[i]);
    }
  } else {
    utils.resizeArray(tmpArray, gpsData, maxLength);
  }

  var encodedGpsData = arrayToStringEncode(gpsData, scale);

  return encodedGpsData;
}

function arrayToStringEncode(sourceArray, scale) {
  var string = "0" + scale;
  var offsetValue = string.charCodeAt(0);

  for (var i = 0; i < sourceArray.length; i++) {
    string += String.fromCharCode(offsetValue + sourceArray[i]);
  }

  return encodeURI(string);
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
