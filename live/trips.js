/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-10-17 */

function addTripsControl(mapConfig, map) {
  var position =
    new GControlPosition(G_ANCHOR_TOP_RIGHT, mapConfig.trips.controlPosition);

  var tripsControl = document.createElement("div");
  tripsControl.id = "tripsControl";
  tripsControl.className = "trips";
  document.getElementById("map_canvas").appendChild(tripsControl);
  position.apply(tripsControl);

  var tripsTableHide = document.createElement("div");
  tripsTableHide.id = "tripsTableHide";
  document.getElementById("map_canvas").appendChild(tripsTableHide);
  position.apply(tripsTableHide);

  showTripsControl(mapConfig, map);
}

function addTripsOverlaysToMap(mapConfig, map) {
  if (typeof(mapConfig.trips.data) == "undefined") {
    return;
  }

  for (var i = 0; i < mapConfig.trips.data.length; i++) {
    if (mapConfig.trips.data[i].visibility == "visible") {
      map.addOverlay(mapConfig.trips.data[i].polyline);
      map.addOverlay(mapConfig.trips.data[i].gpsMaxSpeed.marker);
      map.addOverlay(mapConfig.trips.data[i].gpsMaxAltitude.marker);
    }
  }
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
    if (mapConfig.trips.data) {
      setTripsControlHtml(getTripsTableHtml(mapConfig, mapConfig.trips.data));
    } else {
      setTripsControlHtml("Loading...");
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
}

function setTripsTableHideVisibility(mapConfig, visibility) {
  var tripsTableHide = document.getElementById("tripsTableHide");
  var hideHtml = "";

  if (visibility == "visible") {
    var hideHtml = "<a href='javascript:_hideTripsTable()'>" +
      '<img class="hideTripsTable" src="' + mapConfig.closeImgUrl + '"></a>\n';
  }

  tripsTableHide.innerHTML = hideHtml;
}

function setTripsData(mapConfig, map) {
  GDownloadUrl(mapConfig.filenames.tripsData, function(data, responseCode) {
    var xml = GXml.parse(data);
    var tripsData = xml.documentElement.getElementsByTagName("data");
    var tripsDataString = "";

    for (var i = 0; i < tripsData[0].childNodes.length; i++) {
      tripsDataString += tripsData[0].childNodes[i].nodeValue;
    }

    mapConfig.trips.data = JSON.parse(tripsDataString);
    showTripsControl(mapConfig, map);
  });
}

function getTripsTableHtml(mapConfig, tripsData) {
  var tableHtml = '<table id="tripsTable" class="trips">\n';

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
    tableHtml += '<tr>';
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

  tableHtml += '</table>';

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

function toggleTripVisibility(mapConfig, map, tripIndex) {
  var tripData = mapConfig.trips.data[tripIndex];

  if (typeof(tripData.polyline) == "undefined") {
    tripData.polyline = GPolyline.fromEncoded(tripData.encodedPolyline);

    GEvent.addListener(tripData.polyline, "click", function(latlng) {
      if (mapConfig.tripGraph.tripData == tripData) {
        addDirectionMarker(mapConfig, map, latlng, tripData.polyline);
      }
      addTripGraph(mapConfig, map, tripData);
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
    setVisitedAreaOpacityToLow(mapConfig);
    map.addOverlay(tripData.polyline);
    map.addOverlay(tripData.gpsMaxSpeed.marker);
    map.addOverlay(tripData.gpsMaxAltitude.marker);
    addTripGraph(mapConfig, map, tripData);
  } else {
    tripData.visibility = "hidden";
    mapConfig.trips.numberOfVisibleTrips -= 1;
    if (mapConfig.trips.numberOfVisibleTrips == 0) {
      setVisitedAreaOpacityToHigh(mapConfig);
    }
    map.removeOverlay(tripData.polyline);
    map.removeOverlay(tripData.gpsMaxSpeed.marker);
    map.removeOverlay(tripData.gpsMaxAltitude.marker);
    removeDirectionMarkers(mapConfig, map);
    _hideTripGraph();
  }
}

function addDirectionMarker(mapConfig, map, point, polyline) {
  /* modified from: http://econym.org.uk/gmap/arrows.htm */
  var p1;
  var p2;

  for (var i = 0; i < polyline.getVertexCount() - 1; i++) {
    p1 = polyline.getVertex(i);
    p2 = polyline.getVertex(i + 1);

    if (isPointInLineSegment(map, point, p1, p2) == true) {
      var direction = getLineDirection(p1, p2);
      var marker = new GMarker(point, getDirectionIcon(direction));
      GEvent.addListener(marker, "click", function(latlng) {
        map.removeOverlay(marker);
      });
      map.addOverlay(marker);
      mapConfig.trips.directionMarkers.push(marker);
      break;
    }
  }
}

function removeDirectionMarkers(mapConfig, map) {
  for (var i = 0; i < mapConfig.trips.directionMarkers.length; i++) {
    map.removeOverlay(mapConfig.trips.directionMarkers[i]);
  }
}

function isPointInLineSegment(map, point, p1, p2) {
  var distance = Math.abs(point.distanceFrom(p1) + point.distanceFrom(p2) -
                          p1.distanceFrom(p2));
  var tolerance = 391817 * Math.pow(0.445208, map.getZoom());

  return (distance < tolerance);
}

function getLineDirection(from, to) {
  var direction = getBearing(from, to);

  direction = Math.round(direction / 3) * 3;

  while (direction >= 120) {
    direction -= 120;
  }

  return direction;
}

function getBearing(from, to) {
  var lat1 = from.latRadians();
  var lng1 = from.lngRadians();
  var lat2 = to.latRadians();
  var lng2 = to.lngRadians();
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

function getDirectionIcon(direction) {
  var arrowIcon = new GIcon();
  arrowIcon.iconSize = new GSize(24, 24);
  arrowIcon.shadowSize = new GSize(1, 1);
  arrowIcon.iconAnchor = new GPoint(12, 12);
  arrowIcon.infoWindowAnchor = new GPoint(0, 0);
  arrowIcon.image = "http://www.google.com/mapfiles/dir_" + direction + ".png";

  return arrowIcon;
}

function getMarker(mapConfig, map, point, letter, title) {
  var icon = new GIcon(G_DEFAULT_ICON);
  icon.image = "http://www.google.com/mapfiles/marker" + letter + ".png";
  var markerOptions = {icon:icon, title:title};
  var marker = new GMarker(point, markerOptions);

  GEvent.addListener(marker, "click", function(latlng) {
    map.setCenter(latlng, mapConfig.zoomToPointZoomLevel);
  });

  return marker;
}

function setVisitedAreaOpacityToLow(mapConfig) {
  if (mapConfig.area.opacity == mapConfig.area.opacityHigh) {
    toggleOpacity();
  }
}

function setVisitedAreaOpacityToHigh(mapConfig) {
  if (mapConfig.area.opacity == mapConfig.area.opacityLow) {
    toggleOpacity();
  }
}
