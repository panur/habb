/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-07 */

function addTripsControl(mapConfig, map) {
  var tripsControl = document.createElement("div");
  tripsControl.id = "tripsControl";
  tripsControl.className = "tripsControl";
  document.getElementById("dynamic_divs").appendChild(tripsControl);

  var tripsTableHide = document.createElement("div");
  tripsTableHide.id = "tripsTableHide";
  document.getElementById("dynamic_divs").appendChild(tripsTableHide);

  showTripsControl(mapConfig, map);
}

function _showTripsTable() {
  gMapConfig.isTableShown = true;
  showTripsControl(gMapConfig, gMap);
  setTripsTableHideVisibility(gMapConfig, "visible");
}

function _hideTripsTable() {
  gMapConfig.isTableShown = false;
  showTripsControl(gMapConfig, gMap);
  setTripsTableHideVisibility(gMapConfig, "hidden");
}

function _toggleTripVisibility(tripIndex) {
  toggleTripVisibility(gMapConfig, gMap, tripIndex);
  showTripsControl(gMapConfig, gMap);
}

function _setVisibilityOfAllTrips(visibility) {
  if (typeof(gMapConfig.trips.data) == "undefined") {
    return;
  }

  for (var i = gMapConfig.trips.data.length - 1; i >= 0; i--) {
    if (gMapConfig.trips.data[i].visibility != visibility) {
      toggleTripVisibility(gMapConfig, gMap, i);
    }
  }

  showTripsControl(gMapConfig, gMap);
}

function _toggleTripMarkersVisibility() {
  gMapConfig.trips.areMarkersVisible = !(gMapConfig.trips.areMarkersVisible);
  var isVisible = gMapConfig.trips.areMarkersVisible;

  for (var i = 0; i < gMapConfig.trips.data.length; i++) {
    if (gMapConfig.trips.data[i].gpsMaxSpeed.marker) {
      gMapConfig.trips.data[i].gpsMaxSpeed.marker.setVisible(isVisible);
      gMapConfig.trips.data[i].gpsMaxAltitude.marker.setVisible(isVisible);
    }
  }

  showTripsControl(gMapConfig, gMap);
}

function _setVisitedData(tripIndex) {
  var filename = gMapConfig.trips.data[tripIndex].visitedDataFilename;
  var visitedDataDescription =
    "from " + filename.split("/").pop().split(".")[0];

  gMapConfig.trips.visitedDataIndex = tripIndex;

  setVisitedData(filename, visitedDataDescription);
}

function _setVisitedDataToLatest() {
  gMapConfig.trips.visitedDataIndex = -1;
  changeVisitedData("latest");
}

function showTripsControl(mapConfig, map) {
  if (mapConfig.isTableShown) {
    if (mapConfig.filenames.tripsDatas.length == mapConfig.trips.fileIndex) {
      setTripsControlHtml(getTripsSummaryHtml(mapConfig, mapConfig.trips.data) +
                          getTripsTableHtml(mapConfig, mapConfig.trips.data));
    } else {
      setTripsControlHtml("Loading " + (1 + mapConfig.trips.fileIndex) + "/" +
                          mapConfig.filenames.tripsDatas.length);
      setTripsData(mapConfig, map);
    }
  } else {
    setTripsControlHtml('<div class="showTripsTable" title="Show trips" ' +
                        'onclick="javascript:_showTripsTable()">Trips</div>');
  }
}

function setTripsControlHtml(html) {
  var tripsControl = document.getElementById("tripsControl");
  tripsControl.innerHTML = html;

  var tripsTable = document.getElementById("tripsTable");
  if (tripsTable) {
    var mapDiv = document.getElementById("map_canvas");
    var streetViewDiv = document.getElementById("street_view");
    var availableHeight = mapDiv.clientHeight + streetViewDiv.clientHeight;
    tripsTable.style.height = Math.round(availableHeight * 0.64) + "px";
    tripsTable.style.width = Math.round(mapDiv.clientWidth * 0.58) + "px";
  }
}

function setTripsTableHideVisibility(mapConfig, visibility) {
  var tripsTableHide = document.getElementById("tripsTableHide");
  var hideHtml = "";

  if (visibility == "visible") {
    var hideHtml =
      "<a title='Hide trips table' href='javascript:_hideTripsTable()'>" +
      '<img class="hideTripsTable" src="' + mapConfig.closeImgUrl + '"></a>\n';
  }

  tripsTableHide.innerHTML = hideHtml;
}

function setTripsData(mapConfig, map) {
  var file = mapConfig.filenames.tripsDatas[mapConfig.trips.fileIndex++];

  downloadUrl(file, function(data, responseCode) {
    var xml = parseXml(data);
    var rawTripsData = xml.documentElement.getElementsByTagName("data");
    var tripsDataString = "";

    for (var i = 0; i < rawTripsData[0].childNodes.length; i++) {
      tripsDataString += rawTripsData[0].childNodes[i].nodeValue;
    }

    var tripsData = JSON.parse(tripsDataString);

    for (var i = 0; i < tripsData.length; i++) {
      tripsData[i].vertexTimes = runLengthDecode(
        arrayToStringDecode(tripsData[i].encodedVertexTimes));
      tripsData[i].gpsSpeedData =
        arrayToStringDecode(tripsData[i].encodedGpsSpeedData);
      tripsData[i].gpsAltitudeData =
        arrayToStringDecode(tripsData[i].encodedGpsAltitudeData);
      tripsData[i].gpsMaxSpeed.location =
        mapLatLngFromV2ToV3(tripsData[i].gpsMaxSpeed.location);
      tripsData[i].gpsMaxAltitude.location =
        mapLatLngFromV2ToV3(tripsData[i].gpsMaxAltitude.location);
    }

    mapConfig.trips.data = mapConfig.trips.data.concat(tripsData);

    showTripsControl(mapConfig, map);
  });
}

function runLengthDecode(encodedArray) {
  var decodedArray = [];

  for (var i = 0; i < encodedArray.length; i += 2) {
    for (var j = 0; j < encodedArray[i]; j++) {
      decodedArray.push(encodedArray[i + 1]);
    }
  }

  return decodedArray;
}

function arrayToStringDecode(encodedString) {
  var string = decodeURI(encodedString);
  var decodedArray = [];
  var offsetValue = string.charCodeAt(0);
  var scale = string.charCodeAt(1) - offsetValue;

  for (var i = 2; i < string.length; i++) {
    decodedArray.push((string.charCodeAt(i) - offsetValue) * scale);
  }

  return decodedArray;
}

function mapLatLngFromV2ToV3(latLngV2) {
  return new google.maps.LatLng(latLngV2.y, latLngV2.x);
}

function getTripsSummaryHtml(mapConfig, tripsData) {
  var summaryHtml = '<div class="tripsSummary">';

  summaryHtml += 'Loaded ' + tripsData.length + ' trips. ';

  if (mapConfig.trips.numberOfVisibleTrips == tripsData.length) {
    summaryHtml += 'Show All';
  } else {
    summaryHtml +=
      '<a title="Show all trips" ' +
      'href="javascript:_setVisibilityOfAllTrips(\'visible\')">Show All</a>';
  }

  summaryHtml += ' | ';

  if (mapConfig.trips.numberOfVisibleTrips == 0) {
    summaryHtml += 'Hide All';
  } else {
    summaryHtml +=
      '<a title="Hide all trips" ' +
      'href="javascript:_setVisibilityOfAllTrips(\'hidden\')">Hide All</a>';
  }

  if (mapConfig.trips.numberOfVisibleTrips > 0) {
    summaryHtml += ' | ';

    if (mapConfig.trips.areMarkersVisible) {
      summaryHtml +=
        '<a title="Hide all trips markers" ' +
        'href="javascript:_toggleTripMarkersVisibility()">Hide Markers</a>';
    } else {
      summaryHtml +=
        '<a title="Show all trips markers" ' +
        'href="javascript:_toggleTripMarkersVisibility()">Show Markers</a>';
    }
  }

  summaryHtml += '</div>\n';

  return summaryHtml;
}

function getTripsTableHtml(mapConfig, tripsData) {
  var tableHtml = '<div id="tripsTable" class="tripsTable">' +
                  '<table id="tripsTable" class="trips">\n';

  tableHtml += '<tr>' +
    '<th colspan="2" rowspan="3">Commands</th>' +
    '<th rowspan="3">Trip name</th>' +
    '<th rowspan="2">Date</th>' +
    '<th colspan="4">GPS data</th>' +
    '<th colspan="4">Cycle Computer data</th></tr>\n';

  tableHtml += '<tr>' +
    '<th>Duration</th><th>Distance</th><th>Max speed</th>' +
    '<th>Max altitude</th>' +
    '<th>Duration</th><th>Distance</th><th>Max speed</th>' +
    '<th>Avg speed</th></tr>\n';

  tableHtml += '<tr><th>yyyy-mm-dd</th>' +
    '<th>hh:mm:ss</th><th>km</th><th>km/h</th><th>m</th>' +
    '<th>hh:mm:ss</th><th>km</th><th>km/h</th><th>km/h</th></tr>\n';

  for (var i = 0; i < tripsData.length; i++) {
    if (i == mapConfig.trips.selectedTripIndex) {
      tableHtml += '<tr class="selectedTrip">';
    } else {
      tableHtml += '<tr>';
    }
    tableHtml += '<td>' + getVisibilityCommandHtml(tripsData[i], i) + '</td>';
    tableHtml += '<td>' + getVisitedDataCommandHtml(mapConfig, i) + '</td>';
    tableHtml += '<td>' + tripsData[i].name + '</td>';
    tableHtml += '<td>' + tripsData[i].date + '</td>';
    tableHtml += '<td>' + tripsData[i].gpsDuration + '</td>';
    tableHtml += '<td>' + tripsData[i].gpsDistance + '</td>';
    tableHtml += '<td>' + tripsData[i].gpsMaxSpeed.value + '</td>';
    tableHtml += '<td>' + tripsData[i].gpsMaxAltitude.value + '</td>';
    tableHtml += '<td>' + tripsData[i].ccDuration + '</td>';
    tableHtml += '<td>' + tripsData[i].ccDistance + '</td>';
    tableHtml += '<td>' + tripsData[i].ccMaxSpeed + '</td>';
    tableHtml += '<td>' + tripsData[i].ccAvgSpeed + '</td>';
    tableHtml += '</tr>\n';
  }

  tableHtml += '</table></div>';

  return tableHtml;
}

function getVisibilityCommandHtml(tripsData, tripIndex) {
  var linkText = (tripsData.visibility == 'hidden') ? 'Show' : 'Hide';
  var linkTitle = 'Toggle trip visibility';
  var style =
    (linkText == 'Hide') ? 'color:' + tripsData.encodedPolyline.color : '';
  var js = 'javascript:_toggleTripVisibility(' + tripIndex + ')';
  var html = "<a title='" + linkTitle + "' style='" + style + "' href='" + js +
    "'>" + linkText + "</a>";

  return html;
}

function getVisitedDataCommandHtml(mapConfig, tripIndex) {
  var filename = mapConfig.trips.data[tripIndex].visitedDataFilename;

  if (filename.charAt(filename.length - 1) == "-") {
    return "";
  }

  if (mapConfig.trips.visitedDataIndex == tripIndex) {
    var linkText = 'Unset';
    var linkTitle = 'Set visited data to latest';
    var js = 'javascript:_setVisitedDataToLatest()';
  } else {
    var linkText = 'Set';
    var linkTitle = 'Set visited data as before this trip';
    var js = 'javascript:_setVisitedData(' + tripIndex + ')';
  }

  var html =
    "<a title='" + linkTitle + "' href='" + js + "'>" + linkText + "</a>";

  return html;
}

function getTripPolyline(encodedPolyline) {
  var points = decodeLine(encodedPolyline.points);
  var path = [];

  for (var i = 0; i < points.length; i++) {
    path.push(new google.maps.LatLng(points[i][0], points[i][1]));
  }

  return new google.maps.Polyline({
    path: path,
    strokeColor: encodedPolyline.color,
    strokeWeight: encodedPolyline.weight,
    strokeOpacity: encodedPolyline.opacity,
    clickable: true,
    zIndex: 10
  });
}

// http://code.google.com/apis/maps/documentation/utilities/include/polyline.js
// Decode an encoded polyline into a list of lat/lng tuples.
function decodeLine(encoded) {
  var len = encoded.length;
  var index = 0;
  var array = [];
  var lat = 0;
  var lng = 0;

  while (index < len) {
    var b;
    var shift = 0;
    var result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    array.push([lat * 1e-5, lng * 1e-5]);
  }

  return array;
}

function toggleTripVisibility(mapConfig, map, tripIndex) {
  var tripData = mapConfig.trips.data[tripIndex];

  if (typeof(tripData.polyline) == "undefined") {
    tripData.polyline = getTripPolyline(tripData.encodedPolyline);

    google.maps.event.addListener(tripData.polyline, "click",
                                  function(mouseEvent) {
      if (mapConfig.tripGraph.tripData == tripData) {
        addDirectionMarker(mapConfig, map, mouseEvent.latLng,
                           tripData.polyline);
      }
      addTripGraph(mapConfig, map, tripData);
      mapConfig.trips.selectedTripIndex = tripIndex;
      showTripsControl(mapConfig, map);
    });

    tripData.gpsMaxSpeed.marker = getMarker(mapConfig, map,
      tripData.gpsMaxSpeed.location,
      "S", "Max speed: " + tripData.gpsMaxSpeed.value + " km/h");
    tripData.gpsMaxAltitude.marker = getMarker(mapConfig, map,
      tripData.gpsMaxAltitude.location,
      "A", "Max altitude: " + tripData.gpsMaxAltitude.value + " m");
  }

  if (tripData.visibility == "hidden") {
    tripData.visibility = "visible";
    mapConfig.trips.numberOfVisibleTrips += 1;
    mapConfig.areas.setVisitedAreaOpacityToLow();
    tripData.polyline.setMap(map);
    tripData.gpsMaxSpeed.marker.setMap(map);
    tripData.gpsMaxAltitude.marker.setMap(map);
    addTripGraph(mapConfig, map, tripData);
    mapConfig.trips.selectedTripIndex = tripIndex;
  } else {
    tripData.visibility = "hidden";
    mapConfig.trips.numberOfVisibleTrips -= 1;
    if (mapConfig.trips.numberOfVisibleTrips == 0) {
      mapConfig.areas.setVisitedAreaOpacityToHigh();
    }
    tripData.polyline.setMap(null);
    tripData.gpsMaxSpeed.marker.setMap(null);
    tripData.gpsMaxAltitude.marker.setMap(null);
    removeDirectionMarkers(mapConfig, map);
    _hideTripGraph();
    mapConfig.trips.selectedTripIndex = -1;
  }
}

function addDirectionMarker(mapConfig, map, point, polyline) {
  /* modified from: http://econym.org.uk/gmap/arrows.htm */
  var p1;
  var p2;

  for (var i = 0; i < polyline.getPath().length - 1; i++) {
    p1 = polyline.getPath().getAt(i);
    p2 = polyline.getPath().getAt(i + 1);

    if (isPointInLineSegment(map, point, p1, p2) == true) {
      var direction = getLineDirection120(getLineDirection360(p1, p2));
      var marker = getDirectionMarker(point, direction);
      google.maps.event.addListener(marker, "click", function(event) {
        marker.setMap(null);
      });
      marker.setMap(map);
      mapConfig.trips.directionMarkers.push(marker);
      break;
    }
  }
}

function removeDirectionMarkers(mapConfig, map) {
  for (var i = 0; i < mapConfig.trips.directionMarkers.length; i++) {
    mapConfig.trips.directionMarkers[i].setMap(null);
  }
}

function isPointInLineSegment(map, point, p1, p2) {
  var distance = Math.abs(getDistance(point, p1) + getDistance(point, p2) -
                          getDistance(p1, p2));
  var tolerance = 391817 * Math.pow(0.445208, map.getZoom());

  return (distance < tolerance);
}

/* based on http://www.movable-type.co.uk/scripts/latlong.html */
function getDistance(p1, p2) {
  var R = 6378137; /* earth's radius in meters */
  var lat1 = getRadians(p1.lat());
  var lon1 = getRadians(p1.lng());
  var lat2 = getRadians(p2.lat());
  var lon2 = getRadians(p2.lng());
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d; /* distance between p1 and p2 in meters */
}

function getLineDirection120(direction360) {
  var direction = direction360;

  while (direction >= 120) {
    direction -= 120;
  }

  return direction;
}

function getLineDirection360(from, to) {
  var direction = getBearing(from, to);

  direction = Math.round(direction / 3) * 3;

  return direction;
}

function getBearing(from, to) {
  var lat1 = getRadians(from.lat());
  var lng1 = getRadians(from.lng());
  var lat2 = getRadians(to.lat());
  var lng2 = getRadians(to.lng());
  var y = Math.sin(lng1 - lng2) * Math.cos(lat2);
  var x = (Math.cos(lat1) * Math.sin(lat2)) -
    (Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng1 - lng2));
  var angle = - Math.atan2(y ,x);

  if (angle < 0.0) {
    angle += Math.PI * 2.0;
  }

  angle = angle * (180.0 / Math.PI);
  angle = angle.toFixed(1);

  return angle;
}

function getRadians(latOrLng) {
  return latOrLng * Math.PI / 180;
}

function getDirectionMarker(point, direction) {
  var image = new google.maps.MarkerImage(
    "http://www.google.com/mapfiles/dir_" + direction + ".png",
    new google.maps.Size(24, 24), /* size */
    new google.maps.Point(0, 0), /* origin */
    new google.maps.Point(12, 12) /* anchor */
  );

  return new google.maps.Marker({
    position: point,
    icon: image
  });
}

function getMarker(mapConfig, map, point, letter, title) {
  var image = "http://www.google.com/mapfiles/marker" + letter + ".png";
  var marker = new google.maps.Marker({
    position: point, icon: image, title: title
  });

  google.maps.event.addListener(marker, "click", function(event) {
    setCenter(map, marker.getPosition(), mapConfig.zoomToPointZoomLevel);
    updateStreetView(mapConfig, map, marker.getPosition());
  });

  return marker;
}
