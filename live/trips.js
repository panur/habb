/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-12 */

function showTrips(isTableShown) {
  showTripsControl(gMapConfig, gMap, isTableShown);
}

function showTripsControl(mapConfig, map, isTableShown) {
  if (isTableShown) {
    if (mapConfig.trips.data) {
      setTripsControlHtml(getTripsTableHtml(mapConfig.trips.data));
    } else {
      setTripsControlHtml("Loading...");
      setTripsData(mapConfig, map);
    }
  } else {
    setTripsControlHtml('<a href="javascript:showTrips(1)">Show trips</a>');
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
    showTripsControl(mapConfig, map, 1);
  });
}

function getTripsTableHtml(tripsData) {
  var closeImgUrl = "http://maps.gstatic.com/intl/en_ALL/mapfiles/iw_close.gif";
  var closeHtml = "<a href='javascript:showTrips(0)'>" +
    '<img class="close" src="' + closeImgUrl + '"></a>\n';
  var tableHtml = closeHtml + '<table id="tripsTable" class="trips">\n';

  tableHtml += '<tr>' +
    '<th rowspan="3">Vis.</th>' +
    '<th rowspan="3">Name</th>' +
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
    var tripFilename = tripsData[i].filename;
    var visibility = (tripsData[i].visibility == "hidden") ? "Show": "Hide";
    tableHtml += '<tr>';
    tableHtml += '<td>' +
      "<a href='javascript:showTrip(" + i + ")'>" + visibility + "</a></td>";
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

function showTrip(tripIndex) {
  toggleTripVisibility(gMapConfig, gMap, tripIndex);
  showTrips(1);
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
