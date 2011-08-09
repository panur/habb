/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-09 */

var gMap;
var gMapConfig = {};

function load() {
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

  gMap = new google.maps.Map(document.getElementById("map_canvas"), mOptions);

  initMapConfig(gMapConfig);

  initMap(gMap, gMapConfig);
}

function initMap(map, mapConfig) {
  map.setOptions({center: mapConfig.initialLatLng, zoom: mapConfig.initialZL});

  google.maps.event.addListener(map, "areasInitIsReady", function() {
    updateStatusBar(getInfo(mapConfig, map, mapConfig.initialLatLng));
    setStatistics(mapConfig);
    addMouseListeners(mapConfig, map);
    addHomeButton(mapConfig, map);
    addTripsControl(mapConfig, map);
    initStreetView(mapConfig, map);
    _resizeMap();
    initMenu(mapConfig, map);
  });

  mapConfig.utils = new Utils();
  mapConfig.areas = new Areas(mapConfig, map);
  mapConfig.areas.init();
}

function setCenter(map, latLng, zoom) {
  /* http://code.google.com/p/gmaps-api-issues/issues/detail?id=2673 */
  if (zoom != map.getZoom()) {
    map.setZoom(zoom);
  }
  map.panTo(latLng);
}

function initMapConfig(mapConfig) {
  mapConfig.initialStatistics = document.getElementById("statistics").innerHTML;

  mapConfig.filenames = {
    tripsDatas:["tripsData2011.xml", "tripsData2010.xml", "tripsData2009.xml"]};

  mapConfig.initialZL = 10;
  mapConfig.initialLatLng = new google.maps.LatLng(60.2558, 24.8275);
  mapConfig.zoomToPointZoomLevel = 14;

  mapConfig.trips = {isTableShown:false, visitedDataIndex:-1,
                     numberOfVisibleTrips:0, directionMarkers:[],
                     areMarkersVisible:true, fileIndex:0, data:[],
                     selectedTripIndex:-1};
  mapConfig.closeImgUrl = "http://maps.google.com/mapfiles/iw_close.gif";
  mapConfig.tripGraph = {visibility:"hidden", height:100, origo:{x:5, y:95},
                         types:["Speed", "Altitude"], lastRatio:0,
                         tripCursor:[], maxTripCursorLength:10,
                         tickIntervalMs:200, player:{state:"stop", speed:50},
                         lastDirection:0};
}

function setStatistics(mapConfig) {
  var s = mapConfig.areas.getVisitedStatistics();
  var total = s.yes + s.no + s.np;
  var p = {yes:Math.round(100 * s.yes / total),
            no:Math.round(100 * s.no / total),
            np:Math.round(100 * s.np / total)};
  var statistics = "Visited: yes="           + s.yes + " ("+ p.yes +
                         "%), no="           + s.no  + " ("+ p.no +
                         "%), not possible=" + s.np  + " ("+ p.np +
                         "%), total=" + total;

  document.getElementById("statistics").innerHTML =
    statistics + ", " + mapConfig.initialStatistics;
}

function addMouseListeners(mapConfig, map) {
  google.maps.event.addListener(map, "mousemove", function(mouseEvent) {
    if (mapConfig.tripGraph.player.state == "stop") {
      var info = getInfo(mapConfig, map, mouseEvent.latLng);
      updateStatusBar(info);
      mapConfig.areas.updateCursor(map, info);
    }
  });

  google.maps.event.addListener(map, "mouseout", function(mouseEvent) {
    mapConfig.areas.hideCursor();
  });
}

function getInfo(mc, map, point) {
  var info = {};
  var areasInfo = mc.areas.getAreasInfo(point);

  info.page = areasInfo.page;
  info.km2XY = areasInfo.km2XY;
  info.kkjText = areasInfo.kkjText;
  info.visited = areasInfo.visited;
  info.zl = map.getZoom();
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

function openOtherMap(mapConfig, otherMapType, point, zl) {
  var url = "";

  if (otherMapType == "Kansalaisen karttapaikka") {
    var kkjOffset = mapConfig.areas.getKkjOffsetOrStart(point, "offset");
    url = "http://kansalaisen.karttapaikka.fi/kartanhaku";

    if (kkjOffset != null) {
      url += "/osoitehaku.html?cy=" +
        kkjOffset.y + "500&cx=" + kkjOffset.x + "500&scale=8000";
    } else {
      url += "/koordinaattihaku.html?y=" + point.lat() + "&x=" + point.lng() +
        "&srsName=EPSG%3A4258&scale=8000";
    }
  } else if (otherMapType == "kartta.hel.fi") {
    var kkjStart = mapConfig.areas.getKkjOffsetOrStart(point, "start");
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

function zoomToPoint(lat, lng) {
  var latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

  setCenter(gMap, latLng, gMapConfig.zoomToPointZoomLevel);
}

function addHomeButton(mapConfig, map) {
  var homeButton = document.createElement("div");
  homeButton.id = "homeButton";
  homeButton.className = "homeButton";
  document.getElementById("dynamic_divs").appendChild(homeButton);

  homeButton.title = "Return to initial location";

  homeButton.onclick = function() {
    setCenter(map, mapConfig.initialLatLng, mapConfig.initialZL);
  };
}

function initStreetView(mapConfig, map) {
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
        showStreetView(map);
      }
    }
  });

  google.maps.event.addListener(panorama, "closeclick", function() {
    hideStreetView(map);
  });

  map.setStreetView(panorama);
}

function showStreetView(map) {
  document.getElementById("street_view").style.height =
    (document.getElementById("map_canvas").clientHeight * 0.75) + "px";
  google.maps.event.trigger(map.getStreetView(), "resize");
  resizeMapCanvas(map);
  map.setOptions({panControl: false, zoomControlOptions:
                  {style: google.maps.ZoomControlStyle.SMALL}});
  setCenter(map, map.getStreetView().getPosition(), map.getZoom());
}

function hideStreetView(map) {
  document.getElementById("street_view").style.height = "0px";
  google.maps.event.trigger(map.getStreetView(), "resize");
  resizeMapCanvas(map);
  map.setOptions({panControl: true, zoomControlOptions:
                  {style: google.maps.ZoomControlStyle.DEFAULT}});
}

function updateStreetView(mapConfig, map, position) {
  if (document.getElementById("street_view").clientHeight != 0) {
    var svs = new google.maps.StreetViewService();
    svs.getPanoramaByLocation(position, 50, function(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var heading = mapConfig.tripGraph.lastDirection;
        map.getStreetView().setPov({heading: heading, zoom: 1, pitch: 0});
        map.getStreetView().setPosition(position);
      }
    });
  }
}

function _resizeMap() {
  if (window.onresize != _resizeMap) {
    window.onresize = _resizeMap;
  }

  if (gMapConfig.tripGraph.visibility == "visible") {
    addTripGraph(gMapConfig, gMap, gMapConfig.tripGraph.tripData);
  } else {
    resizeDivs(gMap);
  }

  showTripsControl(gMapConfig, gMap);
}

function resizeDivs(map) {
  var oldStreetViewHeight = document.getElementById("street_view").clientHeight;

  document.getElementById("street_view").style.height = "0px";

  resizeMapCanvas(map);

  if (oldStreetViewHeight != 0) {
    showStreetView(map);
  }
}

function resizeMapCanvas(map) {
  document.getElementById("map_canvas").style.height =
    document.documentElement.clientHeight -
    document.getElementById("street_view").clientHeight -
    document.getElementById("trip_graph").clientHeight -
    document.getElementById("trip_graph_control").clientHeight -
    document.getElementById("status_bar").clientHeight -
    document.getElementById("statistics").clientHeight + "px";

  google.maps.event.trigger(map, "resize");
}
