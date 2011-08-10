/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-10 */

function load() {
  var gm;
  var master = {};
  var mOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControlOptions:
      {style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR},
    zoomControlOptions:
      {style: google.maps.ZoomControlStyle.DEFAULT},
    panControl: true,
    zoomControl: true,
    scaleControl: true,
    streetViewControl: true
  };

  gm = new google.maps.Map(document.getElementById("map_canvas"), mOptions);

  initMapConfig(master);

  initMap(gm, master);
}

function initMap(gm, master) {
  gm.setOptions({center: master.initialLatLng, zoom: master.initialZL});

  google.maps.event.addListener(gm, "areasInitIsReady", function() {
    updateStatusBar(getInfo(master, master.initialLatLng));
    setStatistics(master);
    addMouseListeners(master);
    addHomeButton(master);
    master.trips = new Trips(master);
    master.trips.init();
    master.tripGraph = new TripGraph(master);
    initStreetView(master);
    window.onresize = function() {resizeMap(master)};
    resizeMap(master);
    initMenu(master);
  });

  master.gm = gm;
  master.utils = new Utils();
  master.areas = new Areas(master);
  master.areas.init();
}

function setCenter(gm, latLng, zoom) {
  /* http://code.google.com/p/gmaps-api-issues/issues/detail?id=2673 */
  if (zoom != gm.getZoom()) {
    gm.setZoom(zoom);
  }
  gm.panTo(latLng);
}

function initMapConfig(mapConfig) {
  mapConfig.initialStatistics = document.getElementById("statistics").innerHTML;

  mapConfig.initialZL = 10;
  mapConfig.initialLatLng = new google.maps.LatLng(60.2558, 24.8275);
  mapConfig.zoomToPointZoomLevel = 14;

  mapConfig.closeImgUrl = "http://maps.google.com/mapfiles/iw_close.gif";
}

function setStatistics(master) {
  var s = master.areas.getVisitedStatistics();
  var total = s.yes + s.no + s.np;
  var p = {yes:Math.round(100 * s.yes / total),
            no:Math.round(100 * s.no / total),
            np:Math.round(100 * s.np / total)};
  var statistics = "Visited: yes="           + s.yes + " ("+ p.yes +
                         "%), no="           + s.no  + " ("+ p.no +
                         "%), not possible=" + s.np  + " ("+ p.np +
                         "%), total=" + total;

  document.getElementById("statistics").innerHTML =
    statistics + ", " + master.initialStatistics;
}

function addMouseListeners(master) {
  google.maps.event.addListener(master.gm, "mousemove", function(mouseEvent) {
    if (master.tripGraph.isPlayerStopped()) {
      var info = getInfo(master, mouseEvent.latLng);
      updateStatusBar(info);
      master.areas.updateCursor(info);
    }
  });

  google.maps.event.addListener(master.gm, "mouseout", function(mouseEvent) {
    master.areas.hideCursor();
  });
}

function getInfo(master, point) {
  var info = {};
  var areasInfo = master.areas.getAreasInfo(point);

  info.page = areasInfo.page;
  info.km2XY = areasInfo.km2XY;
  info.kkjText = areasInfo.kkjText;
  info.visited = areasInfo.visited;
  info.zl = master.gm.getZoom();
  info.latLng = point.lat() + " / " + point.lng();

  return info;
}

function updateStatusBar(info) {
  var statusHtml = "Page=" + info.page + ", KKJ=" + info.kkjText +
                   ", visited=" + info.visited + ", ZL=" + info.zl +
                   ", Lat/Lng=" + info.latLng;

  setStatusBarHtml(statusHtml);
}

function setStatusBarHtml(statusBarHtml) {
  document.getElementById("status_bar").innerHTML = statusBarHtml;
}

function openOtherMap(master, otherMapType, point, zl) {
  var url = "";

  if (otherMapType == "Kansalaisen karttapaikka") {
    var kkjOffset = master.areas.getKkjOffsetOrStart(point, "offset");
    url = "http://kansalaisen.karttapaikka.fi/kartanhaku";

    if (kkjOffset != null) {
      url += "/osoitehaku.html?cy=" +
        kkjOffset.y + "500&cx=" + kkjOffset.x + "500&scale=8000";
    } else {
      url += "/koordinaattihaku.html?y=" + point.lat() + "&x=" + point.lng() +
        "&srsName=EPSG%3A4258&scale=8000";
    }
  } else if (otherMapType == "kartta.hel.fi") {
    var kkjStart = master.areas.getKkjOffsetOrStart(point, "start");
    if (kkjStart != null) {
      url = "http://kartta.hel.fi/opas/main/?n=" +
        kkjStart.y + "500&e=" + kkjStart.x + "500";
    } else {
      url = "http://kartta.hel.fi/";
    }
  } else if (otherMapType == "Google Maps") {
    url = "http://maps.google.com/?ll=" +
      point.lat() +"," + point.lng() + "&z=" + zl;
  } else if (otherMapType == "Nokia Maps") {
    url = "http://maps.nokia.com/#|" +
      point.lat() +"|" + point.lng() + "|" + zl + "|0|0|normal.day?plcsDl=";
  } else if (otherMapType == "Bing Maps") {
    url = "http://www.bing.com/maps/default.aspx?cp=" +
      point.lat() + "~" + point.lng() + "&lvl=" + zl;
  } else if (otherMapType == "OpenStreetMap") {
    url = "http://www.openstreetmap.org/?lat=" +
      point.lat() + "&lon=" + point.lng() + "&zoom=" + zl;
  }

  window.open(url);
}

function zoomToPoint(master, lat, lng) {
  var latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

  setCenter(master.gm, latLng, master.zoomToPointZoomLevel);
}

function addHomeButton(master) {
  var homeButton = document.createElement("div");
  homeButton.id = "homeButton";
  homeButton.className = "homeButton";
  document.getElementById("dynamic_divs").appendChild(homeButton);

  homeButton.title = "Return to initial location";

  homeButton.onclick = function() {
    setCenter(master.gm, master.initialLatLng, master.initialZL);
  };
}

function initStreetView(master) {
  var div = document.getElementById("street_view");
  var panoramaOptions = {
    visible: false,
    enableCloseButton: true,
    addressControl: false
  };
  var panorama = new google.maps.StreetViewPanorama(div, panoramaOptions);

  google.maps.event.addListener(panorama, "visible_changed", function() {
    if (panorama.getVisible()) {
      if (div.clientHeight == 0) {
        showStreetView(master.gm);
      }
    }
  });

  google.maps.event.addListener(panorama, "closeclick", function() {
    hideStreetView(master.gm);
  });

  master.gm.setStreetView(panorama);
}

function showStreetView(gm) {
  document.getElementById("street_view").style.height =
    (document.getElementById("map_canvas").clientHeight * 0.75) + "px";
  google.maps.event.trigger(gm.getStreetView(), "resize");
  resizeMapCanvas(gm);
  gm.setOptions({panControl: false, zoomControlOptions:
                {style: google.maps.ZoomControlStyle.SMALL}});
  setCenter(gm, gm.getStreetView().getPosition(), gm.getZoom());
}

function hideStreetView(gm) {
  document.getElementById("street_view").style.height = "0px";
  google.maps.event.trigger(gm.getStreetView(), "resize");
  resizeMapCanvas(gm);
  gm.setOptions({panControl: true, zoomControlOptions:
                {style: google.maps.ZoomControlStyle.DEFAULT}});
}

function updateStreetView(master, position) {
  if (document.getElementById("street_view").clientHeight != 0) {
    var svs = new google.maps.StreetViewService();
    svs.getPanoramaByLocation(position, 50, function(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var heading = master.tripGraph.getLastDirection();
        master.gm.getStreetView().setPov({heading: heading, zoom: 1, pitch: 0});
        master.gm.getStreetView().setPosition(position);
      }
    });
  }
}

function resizeMap(master) {
  if (master.tripGraph.isVisible()) {
    master.tripGraph.resize();
  } else {
    resizeDivs(master.gm);
  }

  master.trips.showTripsControl();
}

function resizeDivs(gm) {
  var oldStreetViewHeight = document.getElementById("street_view").clientHeight;

  document.getElementById("street_view").style.height = "0px";

  resizeMapCanvas(gm);

  if (oldStreetViewHeight != 0) {
    showStreetView(gm);
  }
}

function resizeMapCanvas(gm) {
  document.getElementById("map_canvas").style.height =
    document.documentElement.clientHeight -
    document.getElementById("street_view").clientHeight -
    document.getElementById("trip_graph").clientHeight -
    document.getElementById("trip_graph_control").clientHeight -
    document.getElementById("status_bar").clientHeight -
    document.getElementById("statistics").clientHeight + "px";

  google.maps.event.trigger(gm, "resize");
}
