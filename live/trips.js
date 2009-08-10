/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-10 */

function showTrips(isTableShown) {
  showTripsTable(gMapConfig, gMap, isTableShown);
}

function showTripsTable(mapConfig, map, isTableShown) {
  var tripsControl = document.getElementById("tripsControl");
  var html;

  if (isTableShown) {
    if (mapConfig.trips.data) {
      html = getTripsTableHtml(mapConfig.trips.data);
    } else {
      setTripsData(mapConfig, map);
      html = "Loading...";
    }
  } else {
    html = '<a href="javascript:showTrips(1)">Show trips</a>';
  }

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
    showTripsTable(mapConfig, map, 1);
  });
}

function getTripsTableHtml(tripsData) {
  var closeImgUrl = "http://maps.gstatic.com/intl/en_ALL/mapfiles/iw_close.gif";
  var closeHtml = "<a href='javascript:showTrips(0)'>" +
    '<img class="close" src="' + closeImgUrl + '"></a>';
  var tableHtml = closeHtml+'<table id="tripsTable" class="trips">\n' +
    '<tr><th>Vis.</th><th>Name</th><th>Date</th><th>Duration</th></tr>\n';

  for (var i = 0; i < tripsData.length; i++) {
    var tripFilename = tripsData[i].filename;
    var visibility = (tripsData[i].visibility == "hidden") ? "Show": "Hide";
    tableHtml += '<tr>';
    tableHtml += '<td>' +
      "<a href='javascript:showTrip(" + i + ")'>" + visibility + "</a></td>";
    tableHtml += '<td>' + tripsData[i].name + '</td>';
    tableHtml += '<td>' + tripsData[i].date + '</td>';
    tableHtml += '<td>' + tripsData[i].duration + '</td>';
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
