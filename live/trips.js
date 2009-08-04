
function showTrips(isTableShown) {
  showTripsTable(gMapConfig, gMap, isTableShown);
}

function showTripsTable(mapConfig, map, isTableShown) {
  var tripsControl = document.getElementById("tripsControl");
  var html;

  if (isTableShown) {
    if (mapConfig.trips.info) {
      html = getTripsTableHtml(mapConfig.trips.info);
    } else {
      setTripsInfo(mapConfig, map);
      html = "Loading...";
    }
  } else {
    html = '<a href="javascript:showTrips(1)">Show trips</a>';
  }

  tripsControl.innerHTML = html;
}

function setTripsInfo(mapConfig, map) {
  var tripsInfo = [];

  GDownloadUrl(mapConfig.filenames.tripsIndex, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trips = xml.documentElement.getElementsByTagName("trip");

    for (var i = 0; i < trips.length; i++) {
      var info = {};
      info.visibility = "hidden";
      info.filename = trips[i].getAttribute("filename");
      info.name = trips[i].getAttribute("name");
      tripsInfo.push(info);
      setTripPolyline(mapConfig, map, info.filename);
    }

    mapConfig.trips.info = tripsInfo;
  });
}

function getTripsTableHtml(tripsInfo) {
  var closeImgUrl = "http://maps.gstatic.com/intl/en_ALL/mapfiles/iw_close.gif";
  var closeHtml = "<a href='javascript:showTrips(0)'>" +
    '<img class="close" src="' + closeImgUrl + '"></a>';
  var tableHtml = closeHtml+'<table id="tripsTable" class="trips">\n' +
    '<tr><th>Vis.</th><th>Name</th><th>Date</th><th>Duration</th></tr>\n';

  for (var i = 0; i < tripsInfo.length; i++) {
    var tripFilename = tripsInfo[i].filename;
    var visibility = (tripsInfo[i].visibility == "hidden") ? "Show": "Hide";
    tableHtml += '<tr>';
    tableHtml += '<td>' +
      "<a href='javascript:showTrip(" + i + ")'>" + visibility + "</a></td>";
    tableHtml += '<td>' + tripsInfo[i].name + '</td>';
    tableHtml += '<td>' + tripsInfo[i].date + '</td>';
    tableHtml += '<td>' + tripsInfo[i].duration + '</td>';
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
  if (mapConfig.trips.info[tripIndex].visibility == "hidden") {
    mapConfig.trips.info[tripIndex].visibility = "visible";
    map.addOverlay(mapConfig.trips.info[tripIndex].polyline);
  } else {
    mapConfig.trips.info[tripIndex].visibility = "hidden";
    map.removeOverlay(mapConfig.trips.info[tripIndex].polyline);
  }
}

function setTripPolyline(mapConfig, map, tripFilename) {
  var polylineEncoder = new PolylineEncoder();

  GDownloadUrl(tripFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trks = xml.documentElement.getElementsByTagName("trk");

    for (var i = 0; i < trks.length; i++) {
      var trkpts = trks[i].getElementsByTagName("trkpt");
      var points = new Array(0);

      for (var j = 0; j < trkpts.length; j++) {
        points[j] = new GLatLng(parseFloat(trkpts[j].getAttribute("lat")),
                                parseFloat(trkpts[j].getAttribute("lon")));
      }

      var polyline =
        polylineEncoder.dpEncodeToGPolyline(points, mapConfig.trips.color);
      var times = trks[i].getElementsByTagName("time");
      var date = times[0].firstChild.nodeValue;
      date = date.substr(0, 10); /* 2009-07-19T10:23:21Z */
      var duration = getDuration(times[0].firstChild.nodeValue,
                                 times[times.length - 1].firstChild.nodeValue);
/*
      GEvent.addListener(polyline, "mouseover", function() {
        polyline.setStrokeStyle({'color':'#FFFFFF'});
      });

      GEvent.addListener(polyline, "mouseout", function() {
        polyline.setStrokeStyle({'color':'#FF0080'});
      });
*/

      for (var i = 0; i < mapConfig.trips.info.length; i++) {
        if (mapConfig.trips.info[i].filename == tripFilename) {
          mapConfig.trips.info[i].polyline = polyline;
          mapConfig.trips.info[i].date = date;
          mapConfig.trips.info[i].duration = duration;
          break;
        }
      }
    }

    mapConfig.trips.readyInfos += 1;

    if (mapConfig.trips.readyInfos == mapConfig.trips.info.length) {
      showTripsTable(mapConfig, map, 1);
    } else {
      var tripsControl = document.getElementById("tripsControl");
      tripsControl.innerHTML += ".";
    }
  });
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
