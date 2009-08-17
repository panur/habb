/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-17 */

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
  setTripsTableHideVisibility("visible");
}

function _hideTripsTable() {
  gMapConfig.isTableShown = false;
  showTripsControl(gMapConfig, gMap);
  setTripsTableHideVisibility("hidden");
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

function setTripsTableHideVisibility(visibility) {
  var tripsTableHide = document.getElementById("tripsTableHide");
  var hideHtml = "";

  if (visibility == "visible") {
    var hideImgUrl = "http://maps.google.com/mapfiles/iw_close.gif";
    var hideHtml = "<a href='javascript:_hideTripsTable()'>" +
      '<img class="hideTripsTable" src="' + hideImgUrl + '"></a>\n';
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
    tripData.gpsMaxSpeed.marker = getMarker(mapConfig, map,
      tripData.gpsMaxSpeed.location,
      "S", "Max speed: " + tripData.gpsMaxSpeed.value + " km/h");
    tripData.gpsMaxAltitude.marker = getMarker(mapConfig, map,
      tripData.gpsMaxAltitude.location,
      "A", "Max altitude: " + tripData.gpsMaxAltitude.value + " m");
  }

  if (tripData.visibility == "hidden") {
    tripData.visibility = "visible";
    map.addOverlay(tripData.polyline);
    map.addOverlay(tripData.gpsMaxSpeed.marker);
    map.addOverlay(tripData.gpsMaxAltitude.marker);
  } else {
    tripData.visibility = "hidden";
    map.removeOverlay(tripData.polyline);
    map.removeOverlay(tripData.gpsMaxSpeed.marker);
    map.removeOverlay(tripData.gpsMaxAltitude.marker);
  }
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
