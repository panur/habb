/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-13 */

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

  setVisitedData(filename, visitedDataDescription);
}

function showTripsControl(mapConfig, map) {
  if (mapConfig.isTableShown) {
    if (mapConfig.trips.data) {
      setTripsControlHtml(getTripsTableHtml(mapConfig.trips.data));
    } else {
      setTripsControlHtml("Loading...");
      setTripsData(mapConfig, map);
    }
  } else {
    setTripsControlHtml('<a title="Show trips" ' +
                        ' href="javascript:_showTripsTable()">Trips</a>');
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

function getTripsTableHtml(tripsData) {
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
    var visibility = (tripsData[i].visibility == "hidden") ? "Show": "Hide";
    tableHtml += '<tr>';
    tableHtml += '<td>' + "<a title='Toggle trip visibility' " +
                          "href='javascript:_toggleTripVisibility(" + i +
                          ")'>" + visibility + "</a></td>";
    tableHtml += '<td>' + "<a title='Set visited data as before this trip' " +
                          "href='javascript:_setVisitedData(" + i +
                          ")'>Set</a></td>";
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
