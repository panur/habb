/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-07 */

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

  initMapConfig(gMapConfig, true);

  initMap(gMap, gMapConfig);
}

function initMap(map, mapConfig) {
  map.setOptions({center: mapConfig.initialLatLng, zoom: mapConfig.initialZL});

  google.maps.event.addListener(map, "pointsAreInMapConfig", function() {
    setKm2sToMapConfig(mapConfig, map);
  });

  google.maps.event.addListener(map, "km2sAreInMapConfig", function() {
    updateMapGrid(mapConfig);
    mapConfig.visitedStatusAreas = getVisitedStatusAreas(mapConfig, map);
    updateStatusBar(getInfo(mapConfig, map, mapConfig.initialLatLng));
    setStatistics(mapConfig);
    addOverlaysToMap(mapConfig, map);
    addMouseListeners(mapConfig, map);
    addHomeButton(mapConfig, map);
    addTripsControl(mapConfig, map);
    initStreetView(mapConfig, map);
    _resizeMap();
    initMenu(map);
  });

  setPointsToMapConfig(mapConfig, map);
}

function setCenter(map, latLng, zoom) {
  /* http://code.google.com/p/gmaps-api-issues/issues/detail?id=2673 */
  if (zoom != map.getZoom()) {
    map.setZoom(zoom);
  }
  map.panTo(latLng);
}

function initMapConfig(mapConfig, showExtensions) {
  mapConfig.showExtensions = showExtensions;
  mapConfig.initialStatistics = document.getElementById("statistics").innerHTML;

  mapConfig.filenames = {points:"generated_points.xml",
    visitedDataLatest:"visited_datas/latest.xml",
    visitedData2008:"visited_datas/2008.xml",
    visitedData2009:"visited_datas/2009.xml",
    tripsDatas:["tripsData2011.xml", "tripsData2010.xml", "tripsData2009.xml"]};
  mapConfig.filenames.visitedData = mapConfig.filenames.visitedDataLatest;

  mapConfig.initialZL = 10;
  mapConfig.initialLatLng = new google.maps.LatLng(60.2558, 24.8275);
  mapConfig.zoomToPointZoomLevel = 14;

  mapConfig.area = {opacity:0.5, opacityLow:0.2, opacityHigh:0.5,
                    colors:{yes:"#00FF00", no:"#FF0000", np:"#808080"}}
  mapConfig.grid = {weight:1, opacity:0.5,
                    colors:{page:"#000000", km2:"#FFFFFF"}};
  mapConfig.cursorParams = {strokeColor:"#000000", strokeWeight:2,
                            strokeOpacity:1, maxZoomLevel:15, kkj:"-"};

  mapConfig.latKmPerP = 5;
  mapConfig.latPages = 7;
  mapConfig.lngKmPerP = 4;
  mapConfig.lngPages = 9;
  mapConfig.kkjStart = {lat:65, lng:30};
  mapConfig.kkjOffset = {lat:-1, lng:-1}; /* will be read from file */

  mapConfig.lats = [{n:5,  lngOffsetKm:4,  latOffsetKm:0,  lengthP:2},
                    {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:8},
                    {n:11, lngOffsetKm:0,  latOffsetKm:10, lengthP:9},
                    {n:10, lngOffsetKm:4,  latOffsetKm:21, lengthP:8},
                    {n:5,  lngOffsetKm:12, latOffsetKm:31, lengthP:2},
                    {n:5,  lngOffsetKm:24, latOffsetKm:31, lengthP:2}];

  mapConfig.lngs = [{n:4, lngOffsetKm:0,  latOffsetKm:5,  lengthP:3},
                    {n:8, lngOffsetKm:4,  latOffsetKm:0,  lengthP:6},
                    {n:1, lngOffsetKm:12, latOffsetKm:0,  lengthP:7},
                    {n:8, lngOffsetKm:13, latOffsetKm:5,  lengthP:6},
                    {n:3, lngOffsetKm:21, latOffsetKm:5,  lengthP:5},
                    {n:9, lngOffsetKm:24, latOffsetKm:5,  lengthP:6},
                    {n:4, lngOffsetKm:33, latOffsetKm:10, lengthP:4}];

  mapConfig.pages = [0,  1,  2,  0,  0,  0,  0,  0,  0,
                     3,  4,  5,  6,  7,  8,  9, 10,  0,
                    11, 12, 13, 14, 15, 16, 17, 18, 19,
                    20, 21, 22, 23, 24, 25, 26, 27, 28,
                     0, 29, 30, 31, 32, 33, 34, 35, 36,
                     0, 37, 38, 39, 40, 41, 42, 43, 44,
                     0,  0,  0, 45, 46,  0, 47, 48];

  if (mapConfig.showExtensions) {
    mapConfig.filenames.points = "generated_points_ext.xml";
    mapConfig.lngPages = 12;
    mapConfig.kkjStart = {lat:65, lng:22};

    mapConfig.lats = [{n:5,  lngOffsetKm:0,  latOffsetKm:0,  lengthP:5},
                      {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:10},
                      {n:26, lngOffsetKm:0,  latOffsetKm:10, lengthP:12}];


    mapConfig.lngs = [{n:21, lngOffsetKm:0,  latOffsetKm:0,  lengthP:7},
                      {n:20, lngOffsetKm:21, latOffsetKm:5,  lengthP:6},
                      {n:8,  lngOffsetKm:41, latOffsetKm:10, lengthP:5}];


    mapConfig.pages = ['a', 'A', 'B',   1,   2,  0,  0,   0,  0,  0,   0,   0,
                       'b', 'C',   3,   4,   5,  6,  7,   8,  9, 10,   0,   0,
                       'c', 'D',  11,  12,  13, 14, 15,  16, 17, 18,  19, 'E',
                       'd', 'F',  20,  21,  22, 23, 24,  25, 26, 27,  28, 'G',
                       'e', 'H', 'I',  29,  30, 31, 32,  33, 34, 35,  36, 'J',
                       'f', 'K', 'L',  37,  38, 39, 40,  41, 42, 43,  44, 'M',
                       'g', 'N', 'O', 'P', 'Q', 45, 46, 'R', 47, 48, 'S', 'T'];
  }

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

function downloadUrl(url, callback) {
  var request = createXmlHttpRequest();

  if (request == null) {
    return false;
  }

  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      try {
        var status = request.status;
        if ((status == 0) || (status == 200)) {
          callback(request.responseText, status);
          request.onreadystatechange = function() {};
        }
      } catch (e) {
        alert(e);
      }
    }
  }

  request.open("GET", url, true);
  request.send(null);
}

function createXmlHttpRequest() {
  try {
    if (typeof ActiveXObject != "undefined") {
      return new ActiveXObject("Microsoft.XMLHTTP");
    } else if (window["XMLHttpRequest"]) {
      return new XMLHttpRequest();
    }
  } catch (e) {
    alert(e);
  }

  alert("Cannot create XmlHttpRequest");

  return null;
}

function parseXml(string) {
  if (window.ActiveXObject) {
    var doc = new ActiveXObject('Microsoft.XMLDOM');
    doc.loadXML(string);
    return doc;
  } else if (window.DOMParser) {
    return (new DOMParser).parseFromString(string, 'text/xml');
  }
}

function getIndexOf(array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] == value) {
      return i;
    }
  }

  return -1;
}

function setStatistics(mapConfig) {
  var s = {yes:0, no:0, np:0};

  for (var y = 0; y < mapConfig.km2s.length; y++) {
    for (var x = 0; x < mapConfig.km2s[y].length; x++) {
      if (mapConfig.km2s[y][x].visited != "-") {
        s[mapConfig.km2s[y][x].visited] += 1;
      }
    }
  }

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
      updateCursor(mapConfig, map, info);
    }
  });

  google.maps.event.addListener(map, "mouseout", function(mouseEvent) {
    if (mapConfig.cursor) {
      mapConfig.cursor.setMap(null);
    }
  });
}

function getInfo(mc, map, point) {
  var info = {};

  info.page = "-";
  info.km2XY = getKm2XYFromPoint(mc, point);
  info.kkjText = "-/-";
  info.visited = "-";
  info.zl = map.getZoom();
  info.latLng = point.lat() + " / " + point.lng();

  if (info.km2XY) {
    var pageIndex = Math.floor(info.km2XY.y / mc.latKmPerP) * mc.lngPages +
                    Math.floor(info.km2XY.x / mc.lngKmPerP);
    if (pageIndex < mc.pages.length) {
      if (mc.pages[pageIndex] != 0) {
        info.page = mc.pages[pageIndex];
        info.visited = mc.km2s[info.km2XY.y][info.km2XY.x].visited;
      } else {
        info.km2XY = null;
      }
    } else {
      info.km2XY = null;
    }
  }

  if (info.km2XY) {
    var yKKJ = mc.kkjStart.lat + info.km2XY.y;
    var xKKJ = mc.kkjStart.lng + info.km2XY.x;
    info.kkjText = yKKJ + "/" + xKKJ;
  }

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
  var km2XY = getKm2XYFromPoint(mapConfig, point);

  if (otherMapType == "Kansalaisen karttapaikka") {
    url = "http://kansalaisen.karttapaikka.fi/kartanhaku";

    if (km2XY != null) {
      var kkpUrlY = mapConfig.kkjOffset.lat + km2XY.y;
      var kkpUrlX = mapConfig.kkjOffset.lng + km2XY.x;
      url += "/osoitehaku.html?cy=" +
        kkpUrlY + "500&cx=" + kkpUrlX + "500&scale=8000";
    } else {
      url += "/koordinaattihaku.html?y=" + point.lat() + "&x=" + point.lng() +
        "&srsName=EPSG%3A4258&scale=8000";
    }
  } else if (otherMapType == "kartta.hel.fi") {
    if (km2XY != null) {
      var khfN = mapConfig.kkjStart.lat + km2XY.y;
      var khfE = mapConfig.kkjStart.lng + km2XY.x;
      url = "http://kartta.hel.fi/opas/main/?n=" +
        khfN + "500&e=" + khfE + "500";
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
    addressControl: false,
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
