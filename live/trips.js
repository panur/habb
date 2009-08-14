/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-14 */

function addTripsControl(mapConfig, map) {
  var tripsControl = document.createElement("div");
  tripsControl.id = "tripsControl";
  tripsControl.className = "trips";
  document.getElementById("map_canvas").appendChild(tripsControl);

  var position = new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(210, 7));
  position.apply(tripsControl);

  showTripsControl(mapConfig, map);
}

function addTripsOverlaysToMap(mapConfig, map) {
  if (typeof(mapConfig.trips.data) == "undefined") {
    return;
  }

  for (var i = 0; i < mapConfig.trips.data.length; i++) {
    if (mapConfig.trips.data[i].visibility == "visible") {
      map.addOverlay(mapConfig.trips.data[i].polyline);
    }
  }
}

function _showTripsTable() {
  gMapConfig.isTableShown = true;
  showTripsControl(gMapConfig, gMap);
}

function _hideTripsTable() {
  gMapConfig.isTableShown = false;
  showTripsControl(gMapConfig, gMap);
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
    setTripsControlHtml('<div class="tripsButton" title="Show trips" ' +
                        'onclick="javascript:_showTripsTable()">Trips</div>');
  }
}

function setTripsControlHtml(html) {
  var tripsControl = document.getElementById("tripsControl");
  tripsControl.innerHTML = html;
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
  var closeImgUrl = "http://maps.gstatic.com/intl/en_ALL/mapfiles/iw_close.gif";
  var closeHtml = "<a href='javascript:_hideTripsTable()'>" +
    '<img class="close" src="' + closeImgUrl + '"></a>\n';
  var tableHtml = closeHtml + '<table id="tripsTable" class="trips">\n';

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
    tableHtml += '<td>' + tripsData[i].gpsMaxSpeed + '</td>';
    tableHtml += '<td>' + tripsData[i].gpsMaxAltitude + '</td>';
    tableHtml += '<td>' + tripsData[i].ccDuration + '</td>';
    tableHtml += '<td>' + tripsData[i].ccDistance + '</td>';
    tableHtml += '<td>' + tripsData[i].ccMaxSpeed + '</td>';
    tableHtml += '<td>' + tripsData[i].ccAvgSpeed + '</td>';
    tableHtml += '</tr>\n';
  }

  tableHtml += '</table>'

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
  if (typeof(mapConfig.trips.data[tripIndex].polyline) == "undefined") {
    mapConfig.trips.data[tripIndex].polyline =
      GPolyline.fromEncoded(mapConfig.trips.data[tripIndex].encodedPolyline);
  }

  if (mapConfig.trips.data[tripIndex].visibility == "hidden") {
    mapConfig.trips.data[tripIndex].visibility = "visible";
    map.addOverlay(mapConfig.trips.data[tripIndex].polyline);
  } else {
    mapConfig.trips.data[tripIndex].visibility = "hidden";
    map.removeOverlay(mapConfig.trips.data[tripIndex].polyline);
  }
}
