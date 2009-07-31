
function addTrips(mapConfig, map) {
  var tripsFilename = "trips/index.xml";

  GDownloadUrl(tripsFilename, function(data, responseCode) {
    var xml = GXml.parse(data);
    var trips = xml.documentElement.getElementsByTagName("trip");

    for (var i = 0; i < trips.length; i++) {
      var tripFilename = trips[i].getAttribute("filename");
      addTrip(mapConfig, map, tripFilename);
    }
  });
}

function addTrip(mapConfig, map, tripFilename) {
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
      map.addOverlay(polyline);
    }
  });
}
