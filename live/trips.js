
function showTrips(isTableShown) {
  showTripsTable(gMapConfig, gMap, isTableShown);
}

function showTripsTable(mapConfig, map, isTableShown) {
  var tripsControl = document.getElementById("tripsControl");
  var html;

  if (isTableShown) {
    if (mapConfig.tripsInfo) {
      html = getTripsTableHtml(mapConfig.tripsInfo);
    } else {
      setTripsInfo(mapConfig, map, isTableShown);
      html = "Loading...";
    }
  } else {
    html = '<a href="javascript:showTrips(1)">Show trips</a>';
  }

  tripsControl.innerHTML = html;
}

function setTripsInfo(mapConfig, map, isTableShown) {
  var tripsFilename = "trips/index.xml";
  var tripsInfo = [];

  GDownloadUrl(tripsFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trips = xml.documentElement.getElementsByTagName("trip");

    for (var i = 0; i < trips.length; i++) {
      var info = {};
      info.visibility = "hidden";
      info.filename = trips[i].getAttribute("filename");
      tripsInfo.push(info);
      setTripPolyline(mapConfig, info.filename);
    }

    mapConfig.tripsInfo = tripsInfo;
    showTripsTable(mapConfig, map, isTableShown);
  });
}

function getTripsTableHtml(tripsInfo) {
  var closeImgUrl = "http://maps.gstatic.com/intl/en_ALL/mapfiles/iw_close.gif";
  var closeHtml = "<a href='javascript:showTrips(0)'>" +
    '<img class="close" src="' + closeImgUrl + '"></a>';
  var tableHtml = closeHtml+'<table class="trips">\n' +
    '<tr><th>Name</th><th>Date</th></tr>\n';

  for (var i = 0; i < tripsInfo.length; i++) {
    var tripFilename = tripsInfo[i].filename;
    tableHtml += '<tr>';
    tableHtml += '<td>' + tripFilename + '</td>';
    tableHtml += '<td>' +
      "<a href='javascript:showTrip(\"" + tripFilename + "\")'>Show</a></td>";
    tableHtml += '</tr>\n';
  }

  tableHtml += '</table>'

  return tableHtml;
}

function showTrip(filename) {
  toggleTripVisibility(gMapConfig, gMap, filename)
}

function toggleTripVisibility(mapConfig, map, tripFilename) {
  for (var i = 0; i < mapConfig.tripsInfo.length; i++) {
    if (mapConfig.tripsInfo[i].filename == tripFilename) {
      if (mapConfig.tripsInfo[i].visibility == "hidden") {
        mapConfig.tripsInfo[i].visibility = "visible";
        map.addOverlay(mapConfig.tripsInfo[i].polyline);
      } else {
        mapConfig.tripsInfo[i].visibility = "hidden";
        map.removeOverlay(mapConfig.tripsInfo[i].polyline);
      }
      break;
    }
  }
}

function setTripPolyline(mapConfig, tripFilename) {
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

      var polyline = polylineEncoder.dpEncodeToGPolyline(points, "#FF0080");
/*
      GEvent.addListener(polyline, "mouseover", function() {
        polyline.setStrokeStyle({'color':'#FFFFFF'});
      });

      GEvent.addListener(polyline, "mouseout", function() {
        polyline.setStrokeStyle({'color':'#FF0080'});
      });
*/

      for (var i = 0; i < mapConfig.tripsInfo.length; i++) {
        if (mapConfig.tripsInfo[i].filename == tripFilename) {
          mapConfig.tripsInfo[i].polyline = polyline;
          break;
        }
      }
    }
  });
}
