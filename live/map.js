/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2010-06-13 */

var gMap;
var gMapConfig;

function load() {
  var mOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControlOptions:
      {style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR},
    navigationControlOptions:
      {style: google.maps.NavigationControlStyle.ZOOM_PAN},
    streetViewControl: true
  };

  gMap = new google.maps.Map(document.getElementById("map_canvas"), mOptions);

  gMapConfig = createMapConfig(true);

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
    _resizeMap();
  });

  setPointsToMapConfig(mapConfig, map);
}

function createMapConfig(showExtensions) {
  var mapConfig = {};

  mapConfig.showExtensions = showExtensions;
  mapConfig.initialStatistics = document.getElementById("statistics").innerHTML;

  mapConfig.filenames = {points:"generated_points.xml",
    visitedDataLatest:"visited_datas/latest.xml",
    visitedData2008:"visited_datas/2008.xml",
    visitedData2009:"visited_datas/2009.xml", tripsData:"tripsData.xml"};
  mapConfig.filenames.visitedData = mapConfig.filenames.visitedDataLatest;

  mapConfig.visitedDataDescription = "latest";

  mapConfig.infowindow = new google.maps.InfoWindow();

  mapConfig.initialZL = 10;
  mapConfig.initialLatLng = new google.maps.LatLng(60.2558, 24.8275);
  mapConfig.zoomToPointZoomLevel = 14;

  mapConfig.area = {opacity:0.5, opacityLow:0.2, opacityHigh:0.5,
                    colors:{yes:"#00FF00", no:"#FF0000", np:"#808080"}}
  mapConfig.grid = {weight:1, opacity:0.5,
                    colors:{page:"#000000", km2:"#FFFFFF"}};
  mapConfig.cursorParams = {strokeColor:"#000000", strokeWeight:2,
                            strokeOpacity:1, fillColor:"#120000",
                            fillOpacity:0, maxZoomLevel:15, kkj:"-"};

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
                     numberOfVisibleTrips:0, directionMarkers:[]};
  mapConfig.closeImgUrl = "http://maps.google.com/mapfiles/iw_close.gif";
  mapConfig.tripGraph = {visibility:"hidden", height:100, origo:{x:5, y:95},
                         types:["Speed", "Altitude"], lastRatio:0,
                         tripCursor:[], maxTripCursorLength:10,
                         tickIntervalMs:200, player:{state:"stop", speed:50}};

  return mapConfig;
}

function setPointsToMapConfig(mapConfig, map) {
  var points = [];

  for (var y = 0; y <= (mapConfig.latPages * mapConfig.latKmPerP); y++) {
    points[y] = [];
    for (var x = 0; x < (mapConfig.lngPages * mapConfig.lngKmPerP); x++) {
      points[y][x] = "-";
    }
  }

  downloadUrl(mapConfig.filenames.points, function(xml, responseCode) {
    var p = xml.documentElement.getElementsByTagName("point");
    mapConfig.kkjOffset.lat = parseInt(p[0].getAttribute("kkj_lat"));
    mapConfig.kkjOffset.lng = parseInt(p[0].getAttribute("kkj_lng"));;

    for (var i = 0; i < p.length; i++) {
      var y = parseInt(p[i].getAttribute("kkj_lat")) - mapConfig.kkjOffset.lat;
      var x = parseInt(p[i].getAttribute("kkj_lng")) - mapConfig.kkjOffset.lng;
      var lat = parseFloat(p[i].getAttribute("lat"));
      var lng = parseFloat(p[i].getAttribute("lng"));
      points[y][x] = new google.maps.LatLng(lat, lng);
    }

    mapConfig.points = points;
    google.maps.event.trigger(map, "pointsAreInMapConfig");
  });
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
          callback(request.responseXML, status);
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

function setKm2sToMapConfig(mc, map) {
  var km2s = [];

  for (var y = 0; y < (mc.latPages * mc.latKmPerP); y++) {
    km2s[y] = [];
    for (var x = 0; x < (mc.lngPages * mc.lngKmPerP); x++) {
      var points = [mc.points[y][x], mc.points[y][x + 1],
                    mc.points[y + 1][x + 1], mc.points[y + 1][x],
                    mc.points[y][x]];
      km2s[y][x] = {};
      km2s[y][x].points = points;
      km2s[y][x].visited = "-";
    }
  }

  mc.km2s = km2s;

  setVisitedDataToKm2s(mc, map);
}

function setVisitedDataToKm2s(mapConfig, map) {
  downloadUrl(mapConfig.filenames.visitedData, function(xml, responseCode) {
    var allInPage = [];
    var pages = xml.documentElement.getElementsByTagName("page");

    for (var i = 0; i < pages.length; i++) {
      if (pages[i].getAttribute("visited_all") == "true") {
        if ((mapConfig.showExtensions) ||
            (pages[i].getAttribute("number") < "A")) {
          allInPage.push(pages[i].getAttribute("number"));
        }
      }
    }

    for (var i = 0; i < allInPage.length; i++) {
      var page = getIndexOf(mapConfig.pages, allInPage[i]);
      var initY = Math.floor(page / mapConfig.lngPages) * mapConfig.latKmPerP;
      var initX = (page % mapConfig.lngPages) * mapConfig.lngKmPerP;

      for (var y = 0; y < mapConfig.latKmPerP; y++) {
        for (var x = 0; x < mapConfig.lngKmPerP; x++) {
          mapConfig.km2s[initY + y][initX + x].visited = "yes";
        }
      }
    }

    var km2s = xml.documentElement.getElementsByTagName("km2");

    for (var i = 0; i < km2s.length; i++) {
      var y =
        parseInt(km2s[i].getAttribute("kkj_lat")) - mapConfig.kkjStart.lat;
      var x =
        parseInt(km2s[i].getAttribute("kkj_lng")) - mapConfig.kkjStart.lng;

      if ((mapConfig.showExtensions) || (km2s[i].getAttribute("page") < "A")) {
        mapConfig.km2s[y][x].visited = km2s[i].getAttribute("visited");
      }
    }

    google.maps.event.trigger(map, "km2sAreInMapConfig");
  });
}

function getIndexOf(array, value) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] == value) {
      return i;
    }
  }

  return -1;
}

function updateMapGrid(mc) {
  var color;

  mc.grid.latPolylines = [];
  mc.grid.lngPolylines = [];

  for (var i = 0, lines = 0; i < mc.lats.length; i++) {
    for (var j = 0; j < mc.lats[i].n; j++) {
      var lat = mc.lats[i].latOffsetKm + j;
      var points = [];
      for (var k = 0; k <= (mc.lats[i].lengthP * mc.lngKmPerP); k++) {
        points.push(mc.points[lat][mc.lats[i].lngOffsetKm + k]);
      }
      color = ((lines++ % mc.latKmPerP) == 0) ?
              mc.grid.colors.page : mc.grid.colors.km2;
      var lat = new google.maps.Polyline({
        path: points, strokeColor: color, strokeWeight: mc.grid.weight,
        strokeOpacity: mc.grid.opacity, clickable: false, zIndex: 1
      });
      mc.grid.latPolylines.push(lat);
    }
  }

  for (var i = 0, lines = 0; i < mc.lngs.length; i++) {
    for (var j = 0; j < mc.lngs[i].n; j++) {
      var lng = mc.lngs[i].lngOffsetKm + j;
      var points = [];
      for (var k = 0; k <= (mc.lngs[i].lengthP * mc.latKmPerP); k++) {
        points.push(mc.points[mc.lngs[i].latOffsetKm + k][lng]);
      }

      color = ((lines++ % mc.lngKmPerP) == 0) ?
              mc.grid.colors.page : mc.grid.colors.km2;
      var lng = new google.maps.Polyline({
        path: points, strokeColor: color, strokeWeight: mc.grid.weight,
        strokeOpacity: mc.grid.opacity, clickable: false, zIndex: 1
      });
      mc.grid.lngPolylines.push(lng);
    }
  }
}

function getVisitedStatusAreas(mc) {
  var polygonGroups = {};
  polygonGroups.np = getPolygonGroup(mc, "np");
  polygonGroups.no = getPolygonGroup(mc, "no");
  polygonGroups.yes = getPolygonGroup(mc, "yes");
  var polygons = [];
  polygons = polygons.concat(polygonGroups.no);
  polygons = polygons.concat(polygonGroups.np);
  var visitedStatusAreas = [];

  for (var i = 0; i < polygons.length; i++) {
    if (isPolygonInPolygons(polygons[i], polygonGroups.yes)) {
      polygonGroups.yes.push(polygons[i]);
    }
  }

  for (var i in polygonGroups) {
    var paths = [];
    for (var j = 0; j < polygonGroups[i].length; j++) {
      paths.push(polygonGroups[i][j]);
    }

    var polygon = new google.maps.Polygon({
      paths: paths,
      strokeColor: mc.area.colors[i],
      strokeWeight: 1,
      strokeOpacity: 0.5,
      fillColor: mc.area.colors[i],
      fillOpacity: mc.area.opacity,
      clickable: false,
      zIndex: 1
    });

    visitedStatusAreas.push(polygon);
  }

  return visitedStatusAreas;
}

function getPolygonGroup(mc, visitedStatus) {
  var polygons = [];
  var params =
    {visitedStatus:visitedStatus, km2NeedsToBeTested:getKm2sInMap(mc)};

  for (var y = 0; y < mc.km2s.length; y++) {
    for (var x = 0; x < mc.km2s[y].length; x++) {
      if ((mc.km2s[y][x].visited == visitedStatus) &&
          (params.km2NeedsToBeTested[y][x] == true) &&
          (isPointInPolygons(mc.points[y][x], polygons) == false)) {
        var points = [];

        params.initXY = {y:y, x:x};

        getPolylinePoints(y, x, "right", mc, points, params);

        var splittedLoops = splitLoops(points);
        for (var i = 0; i < splittedLoops.length; i++) {
          polygons.push(splittedLoops[i]);
        }

        if (visitedStatus == "yes") {
          polygons[0].reverse(); // http://econym.org.uk/gmap/chrome.htm#winding
          return polygons;
        }
      }
    }
  }

  return polygons;
}

function splitLoops(points) {
  var splittedLoops = [];

  points.push(points[0]);

  for (var loopEnd = 1; loopEnd < points.length; loopEnd++) {
    var loopStart = getIndexOf(points, points[loopEnd]);
    if ((loopStart > 0) && (loopStart != loopEnd)) {
      splittedLoops[0] = points.slice(0);
      splittedLoops[1] =
        splittedLoops[0].splice(loopStart, (loopEnd - loopStart));
      splittedLoops[1].push(points[loopStart]);
      break;
    }
  }

  if (splittedLoops.length == 0) {
    splittedLoops[0] = points;
  }

  return splittedLoops;
}

function getKm2sInMap(mc) {
  var km2s = [];

  for (var y = 0; y < mc.km2s.length; y++) {
    km2s[y] = [];

    for (var x = 0; x < mc.km2s[y].length; x++) {
      if (mc.km2s[y][x].visited == "-") {
        km2s[y][x] = false;
      } else {
        km2s[y][x] = true;
      }
    }
  }

  return km2s;
}

function isPolygonInPolygons(polygon, polygons) {
  for (var i = 0; i < polygon.length; i++) {
    if (isPointInPolygons(polygon[i], polygons) == false) {
      return false;
    }
  }

  return true;
}

function isPointInPolygons(point, polygons) {
  for (var i = 0; i < polygons.length; i++) {
    if (isPointInPolygon(point, polygons[i])) {
      return true;
    }
  }

  return false;
}

function isPointInPolygon(point, polygon) {
  var lat = point.lat();
  var lng = point.lng();
  var oddNodes = false;

  for (var i = 0, j = 0; i < polygon.length; i++) {
    if (++j == polygon.length) {
      j = 0;
    }

    if (((polygon[i].lat() < lat) && (polygon[j].lat() >= lat)) ||
        ((polygon[j].lat() < lat) && (polygon[i].lat() >= lat))) {
      if ((polygon[i].lng() + ((lat - polygon[i].lat()) /
          (polygon[j].lat() - polygon[i].lat()) *
          (polygon[j].lng() - polygon[i].lng()))) < lng) {
        oddNodes = !oddNodes
      }
    }
  }

  return oddNodes;
}

function getPolylinePoints(y, x, direction, mc, points, params) {
  var newY = y;
  var newX = x;
  var newDirection = -1;
  var searchOrder;

  if (direction == "right") {
    searchOrder = ["down", "right", "up", "left"];
  } else if (direction == "up") {
    searchOrder = ["right", "up", "left", "down"];
  } else if (direction == "left") {
    searchOrder = ["up", "left", "down", "right"];
  } else if (direction == "down") {
    searchOrder = ["left", "down", "right", "up"];
  }

  for (var i = 0; i < searchOrder.length; i++) {
    newDirection = searchOrder[i];

    if (newDirection == "right") {
      if ((y < mc.km2s.length) && (x < mc.km2s[y].length)) {
        if (mc.km2s[y][x].visited == params.visitedStatus) {
          newX = x + 1;
          break;
        }
      }
    } else if (newDirection == "up") {
      if ((y < mc.km2s.length) && ((x - 1) >= 0)) {
        if (mc.km2s[y][x - 1].visited == params.visitedStatus) {
          newY = y + 1;
          break;
        }
      }
    } else if (newDirection == "left") {
      if (((y - 1) >= 0) && ((x - 1) >= 0)) {
        if (mc.km2s[y - 1][x - 1].visited == params.visitedStatus) {
          newX = x - 1;
          break;
        }
      }
    } else if (newDirection == "down") {
      if (((y - 1) >= 0) && (x < mc.km2s[y - 1].length)) {
        if (mc.km2s[y - 1][x].visited == params.visitedStatus) {
          newY = y - 1;
          break;
        }
      }
    }
  }

  if ((newY != y) || (newX != x)) {
    points.push(mc.points[y][x]);

    if (y < mc.km2s.length) {
      params.km2NeedsToBeTested[y][x] = false;
    }

    if ((newY >= 0) && (newX >= 0) &&
        ((newY != params.initXY.y) || (newX != params.initXY.x))) {
      getPolylinePoints(newY, newX, newDirection, mc, points, params);
    }
  }
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

function addOverlaysToMap(mc, map) {
  addOrRemoveOverlays(mc, map, map);
}

function removeOverlaysFromMap(mc, map) {
  addOrRemoveOverlays(mc, map, null);
}

function addOrRemoveOverlays(mc, map, mapOrNull) {
  for (var i = 0; i < mc.visitedStatusAreas.length; i++) {
    mc.visitedStatusAreas[i].setOptions({fillOpacity: mc.area.opacity});
    mc.visitedStatusAreas[i].setMap(mapOrNull);
  }

  for (var i = 0; i < mc.grid.latPolylines.length; i++) {
    mc.grid.latPolylines[i].setMap(mapOrNull);
  }

  for (var i = 0; i < mc.grid.lngPolylines.length; i++) {
    mc.grid.lngPolylines[i].setMap(mapOrNull);
  }

  addTripsOverlaysToMap(mc, map);
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

  google.maps.event.addListener(map, "rightclick", function(mouseEvent) {
    var latLng = mouseEvent.latLng;
    var linksHtml = getLinksHtml(mapConfig, latLng, map.getZoom());
    var actionsHtml = getActionsHtml(mapConfig, latLng, map.getZoom());

    mapConfig.infowindow.setPosition(latLng);
    mapConfig.infowindow.setContent(linksHtml); // tbd actionsHtml

    mapConfig.infowindow.open(map);
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

function getKm2XYFromPoint(mc, point) {
  var guessXY = {y : -1, x : -1};

  for (var i = 0, lines = 0; i < mc.grid.latPolylines.length; i++) {
    var line = mc.grid.latPolylines[i];
    var p1 = line.getPath().getAt(0);
    var p2 = line.getPath().getAt(line.getPath().length - 1);
    var mp = 1 - (point.lng() - p1.lng()) / (p2.lng() - p1.lng());
    var lat = p2.lat() + (p1.lat() - p2.lat()) * mp;

    if (point.lat() < lat) {
      guessXY.y = i - 1;
      break;
    }
  }

  for (var i = 0, lines = 0; i < mc.grid.lngPolylines.length; i++) {
    var line = mc.grid.lngPolylines[i];
    var p1 = line.getPath().getAt(0);
    var p2 = line.getPath().getAt(line.getPath().length - 1);
    var mp = 1 - (point.lat() - p2.lat()) / (p1.lat() - p2.lat());
    var lng = p1.lng() + (p2.lng() - p1.lng()) * mp;

    if (point.lng() < lng) {
      guessXY.x = i - 1;
      break;
    }
  }

  if ((guessXY.y >= 0) && (guessXY.x >= 0)) {
    return getKm2XYFromGuess(mc, point, guessXY);
  }

  return null;
}

function getKm2XYFromGuess(mc, point, guessXY) {
  for (var y = guessXY.y - 1; y < guessXY.y + 2; y++) {
    for (var x = guessXY.x - 1; x < guessXY.x + 2; x++) {
      if ((y >= 0) && (x >= 0) &&
          (y < (mc.points.length - 1) && (x < (mc.points[y].length - 1)))) {

        if (isPointInPolygon(point, mc.km2s[y][x].points)) {
          return {y:y, x:x};
        }
      }
    }
  }

  return null;
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

function updateCursor(mc, map, info) {
  if (mc.cursor)  {
    if (mc.cursorParams.kkj == info.kkjText) {
      return;
    } else {
      mc.cursor.setMap(null);
      mc.cursorParams.kkj = "-";
    }
  }

  if ((info.km2XY) && (map.getZoom() < mc.cursorParams.maxZoomLevel)) {
    var points = mc.km2s[info.km2XY.y][info.km2XY.x].points;
    mc.cursor = new google.maps.Polygon({
      paths: points,
      strokeColor: mc.cursorParams.strokeColor,
      strokeWeight: mc.cursorParams.strokeWeight,
      strokeOpacity: mc.cursorParams.strokeOpacity,
      fillColor: mc.cursorParams.fillColor,
      fillOpacity: mc.cursorParams.fillOpacity,
      clickable: false,
      zIndex: 1
    });
    mc.cursor.setMap(map);
    mc.cursorParams.kkj = info.kkjText;
  }
}

function getLinksHtml(mapConfig, point, zl) {
  var km2XY = getKm2XYFromPoint(mapConfig, point)
  var kkpUrlY = mapConfig.kkjOffset.lat + km2XY.y;
  var kkpUrlX = mapConfig.kkjOffset.lng + km2XY.x;
  var kkpUrl = "http://kansalaisen.karttapaikka.fi/kartanhaku/osoitehaku.html" +
    "?cy=" + kkpUrlY + "500&amp;cx=" + kkpUrlX + "500&scale=8000";
  var khfN = mapConfig.kkjStart.lat + km2XY.y;
  var khfE = mapConfig.kkjStart.lng + km2XY.x;
  var khfUrl = "http://kartta.hel.fi/opas/main/?n=" +
    khfN + "500&amp;e=" + khfE + "500";
  var googleUrl = "http://maps.google.com/?ll=" +
    point.lat() +"," + point.lng() + "&amp;z=" + zl;
  var msUrl = "http://www.bing.com/maps/default.aspx?cp=" +
    point.lat() + "~" + point.lng() + "&amp;lvl=" + zl;
  var osmUrl = "http://www.openstreetmap.org/?lat=" +
    point.lat() + "&lon=" + point.lng() + "&zoom=" + zl;

  var html = "Open location " + point + " to:<ul>"+
    "<li><a href='" + kkpUrl + "'>Kansalaisen karttapaikka</a></li>" +
    "<li><a href='" + khfUrl + "'>kartta.hel.fi</a></li>" +
    "<li><a href='" + googleUrl + "'>Google Maps</a></li>" +
    "<li><a href='" + msUrl + "'>Bing Maps</a></li>" +
    "<li><a href='" + osmUrl + "'>OpenStreetMap</a></li>" +
    "</ul>";

  return html;
}

function getActionsHtml(mapConfig, point, zl) {
  var visitedDataList = "";
  var showExtensionsTexts = {"true":"Hide", "false":"Show"};

  if (gMapConfig.filenames.visitedData !=
      gMapConfig.filenames.visitedData2008) {
    visitedDataList +=
        "<li><a href='javascript:changeVisitedData(2008)'>end of 2008</a></li>";
  }
  if (gMapConfig.filenames.visitedData !=
      gMapConfig.filenames.visitedData2009) {
    visitedDataList +=
        "<li><a href='javascript:changeVisitedData(2009)'>end of 2009</a></li>";
  }
  if (gMapConfig.filenames.visitedData !=
      gMapConfig.filenames.visitedDataLatest) {
    visitedDataList +=
      "<li><a href='javascript:changeVisitedData(\"latest\")'>latest</a></li>";
  }

  var html = "<ul>" +
    "<li><a href='javascript:zoomToPoint(" + point.lat() + ", " + point.lng() +
      ")'>Zoom to selected location</a></li>" +
    "<li><a href='javascript:toggleOpacity()'>" +
      "Change opacity of visited areas</a></li>" +
    "<li><a href='javascript:toggleShowExtensions()'>" +
      showExtensionsTexts[gMapConfig.showExtensions] + " extensions</a></li>" +
    "</ul>" +
    "Current visited data is " + gMapConfig.visitedDataDescription +
    ". Change visited data to: <ul>" + visitedDataList + "</ul>";

  return html;
}

function zoomToPoint(lat, lng) {
  var latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

  gMap.setOptions({center: latLng, zoom: gMapConfig.zoomToPointZoomLevel});
}

function toggleOpacity() {
  removeOverlaysFromMap(gMapConfig, gMap);

  if (gMapConfig.area.opacity == gMapConfig.area.opacityHigh) {
    gMapConfig.area.opacity = gMapConfig.area.opacityLow;
  } else {
    gMapConfig.area.opacity = gMapConfig.area.opacityHigh;
  }

  addOverlaysToMap(gMapConfig, gMap);
}

function toggleShowExtensions() {
  removeOverlaysFromMap(gMapConfig, gMap);
  //GEvent.clearInstanceListeners(gMap); // tbd

  document.getElementById("statistics").innerHTML =
    gMapConfig.initialStatistics;

  gMapConfig = createMapConfig(!gMapConfig.showExtensions);

  initMap(gMap, gMapConfig);
}

function changeVisitedData(newTarget) {
  if (newTarget == 2008) {
    setVisitedData(gMapConfig.filenames.visitedData2008, "from end of 2008");
  } else if (newTarget == 2009) {
    setVisitedData(gMapConfig.filenames.visitedData2009, "from end of 2009");
  } else {
    setVisitedData(gMapConfig.filenames.visitedDataLatest, "latest");
  }
}

function setVisitedData(filename, visitedDataDescription) {
  removeOverlaysFromMap(gMapConfig, gMap);

  gMapConfig.filenames.visitedData = filename;
  gMapConfig.visitedDataDescription = visitedDataDescription;

  setKm2sToMapConfig(gMapConfig, gMap);
}

function addHomeButton(mapConfig, map) {
  var homeButton = document.createElement("div");
  homeButton.id = "homeButton";
  homeButton.className = "homeButton";
  document.getElementById("map_canvas").appendChild(homeButton);

  homeButton.title = "Return to initial location";

  homeButton.onclick = function() {
    map.setOptions({center: mapConfig.initialLatLng,
                    zoom: mapConfig.initialZL});
  };
}

function _resizeMap() {
  if (window.onresize != _resizeMap) {
    window.onresize = _resizeMap;
  }

  if (gMapConfig.tripGraph.visibility == "visible") {
    addTripGraph(gMapConfig, gMap, gMapConfig.tripGraph.tripData);
  } else {
    resizeMapCanvas(gMap);
  }
}

function resizeMapCanvas(map) {
  document.getElementById("map_canvas").style.height =
    document.documentElement.clientHeight -
    document.getElementById("trip_graph").clientHeight -
    document.getElementById("trip_graph_control").clientHeight -
    document.getElementById("status_bar").clientHeight -
    document.getElementById("statistics").clientHeight + "px";

  google.maps.event.trigger(map, "resize");
}
