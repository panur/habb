/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-08-17 */

var gMap;
var gMapConfig;

function load() {
  if (GBrowserIsCompatible()) {
    if (document.implementation.hasFeature(
        "http://www.w3.org/TR/SVG11/feature#SVG","1.1")) {
      /* needed for Opera */
      _mSvgEnabled = true;
      _mSvgForced  = true;
    }

    gMap = new GMap2(document.getElementById("map_canvas"));
    gMap.enableScrollWheelZoom();
    gMap.addControl(new GLargeMapControl());
    gMap.addControl(new GMapTypeControl());
    gMap.addControl(new GScaleControl());

    gMapConfig = createMapConfig(true);

    initMap(gMap, gMapConfig);
  }
}

function initMap(map, mapConfig) {
  map.setCenter(mapConfig.initialLatLng, mapConfig.initialZL);

  GEvent.addListener(map, "pointsAreInMapConfig", function() {
    setKm2sToMapConfig(mapConfig, map);
  });

  GEvent.addListener(map, "km2sAreInMapConfig", function() {
    updateMapGrid(mapConfig);
    mapConfig.visitedStatusAreas = getVisitedStatusAreas(mapConfig, map);
    setStatistics(mapConfig);
    addOverlaysToMap(mapConfig, map);
    addMouseListeners(mapConfig, map);
    addTripsControl(mapConfig, map);
  });

  setPointsToMapConfig(mapConfig, map);
}

function createMapConfig(showExtensions) {
  var mapConfig = {};

  mapConfig.showExtensions = showExtensions;
  mapConfig.initialStatistics = document.getElementById("statistics").innerHTML;

  mapConfig.filenames = {points:"generated_points.xml",
    visitedDataLatest:"visited_datas/latest.xml",
    visitedData2008:"visited_datas/2008.xml", tripsData:"tripsData.xml"};
  mapConfig.filenames.visitedData = mapConfig.filenames.visitedDataLatest;

  mapConfig.visitedDataDescription = "latest";

  mapConfig.initialZL = 10;
  mapConfig.initialLatLng = new GLatLng(60.250460, 24.862446);
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
    mapConfig.lngPages = 11;
    mapConfig.kkjStart = {lat:65, lng:26};

    mapConfig.lats = [{n:5,  lngOffsetKm:0,  latOffsetKm:0,  lengthP:4},
                      {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:9},
                      {n:26, lngOffsetKm:0,  latOffsetKm:10, lengthP:11}];


    mapConfig.lngs = [{n:17, lngOffsetKm:0,  latOffsetKm:0,  lengthP:7},
                      {n:20, lngOffsetKm:17, latOffsetKm:5,  lengthP:6},
                      {n:8,  lngOffsetKm:37, latOffsetKm:10, lengthP:5}];


    mapConfig.pages = ['A', 'B',   1,   2,  0,  0,   0,  0,  0,   0,   0,
                       'C',   3,   4,   5,  6,  7,   8,  9, 10,   0,   0,
                       'D',  11,  12,  13, 14, 15,  16, 17, 18,  19, 'E',
                       'F',  20,  21,  22, 23, 24,  25, 26, 27,  28, 'G',
                       'H', 'I',  29,  30, 31, 32,  33, 34, 35,  36, 'J',
                       'K', 'L',  37,  38, 39, 40,  41, 42, 43,  44, 'M',
                       'N', 'O', 'P', 'Q', 45, 46, 'R', 47, 48, 'S', 'T'];
  }

  mapConfig.trips = {isTableShown:false, visitedDataIndex:-1,
                     controlPosition:new GSize(214, 7), directionMarker:{}};

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

  GDownloadUrl(mapConfig.filenames.points, function(data, responseCode) {
    var xml = GXml.parse(data);
    var p = xml.documentElement.getElementsByTagName("point");
    mapConfig.kkjOffset.lat = parseInt(p[0].getAttribute("kkj_lat"));
    mapConfig.kkjOffset.lng = parseInt(p[0].getAttribute("kkj_lng"));;

    for (var i = 0; i < p.length; i++) {
      var y = parseInt(p[i].getAttribute("kkj_lat")) - mapConfig.kkjOffset.lat;
      var x = parseInt(p[i].getAttribute("kkj_lng")) - mapConfig.kkjOffset.lng;
      var lat = parseFloat(p[i].getAttribute("lat"));
      var lng = parseFloat(p[i].getAttribute("lng"));
      points[y][x] = new GLatLng(lat, lng);
    }

    mapConfig.points = points;
    GEvent.trigger(map, "pointsAreInMapConfig");
  });
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
  GDownloadUrl(mapConfig.filenames.visitedData, function(data, responseCode) {
    var allInPage = [];
    var xml = GXml.parse(data);
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

    GEvent.trigger(map, "km2sAreInMapConfig");
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
  var polylineEncoder = new PolylineEncoder();
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
      var lat = polylineEncoder.dpEncodeToGPolyline(
        points, color, mc.grid.weight, mc.grid.opacity);
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
      var lng = polylineEncoder.dpEncodeToGPolyline(
        points, color, mc.grid.weight, mc.grid.opacity);
      mc.grid.lngPolylines.push(lng);
    }
  }
}

function getVisitedStatusAreas(mc) {
  var polylineEncoder = new PolylineEncoder();
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
      if (i < polygonGroups.no.length) {
        polygonGroups.yes.push(polygonGroups.no[i]);
      } else {
        polygonGroups.yes.push(polygonGroups.np[i - polygonGroups.no.length]);
      }
    }
  }

  for (var i in polygonGroups) {
    var jsons = [];
    for (var j = 0; j < polygonGroups[i].length; j++) {
      var json = polylineEncoder.dpEncodeToJSON(polygonGroups[i][j]);
      jsons.push(json);
    }

    var polygon = new GPolygon.fromEncoded({
      polylines: jsons,
      fill: true,
      color: mc.area.colors[i],
      opacity: mc.area.opacity,
      outline: false
    });;

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

        points.push(points[0]);
        polygons.push(points);

        if (visitedStatus == "yes") {
          return polygons;
        }
      }
    }
  }

  return polygons;
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
  for (var i = 0; i < mc.visitedStatusAreas.length; i++) {
    mc.visitedStatusAreas[i].opacity = mc.area.opacity;
    map.addOverlay(mc.visitedStatusAreas[i]);
  }

  for (var i = 0; i < mc.grid.latPolylines.length; i++) {
    map.addOverlay(mc.grid.latPolylines[i]);
  }

  for (var i = 0; i < mc.grid.lngPolylines.length; i++) {
    map.addOverlay(mc.grid.lngPolylines[i]);
  }

  addTripsOverlaysToMap(mc, map);
}

function addMouseListeners(mapConfig, map) {
  GEvent.addListener(map, "mousemove", function(point) {
    var info = getInfo(mapConfig, map, point);

    mapConfig.trips.directionMarker.point = point;
    if (typeof(mapConfig.trips.directionMarker.marker) != "undefined") {
      showDirectionMarker(mapConfig, map);
    }

    updateStatusBar(info);
    updateCursor(mapConfig, map, info);
  });

  GEvent.addListener(map, "singlerightclick", function(point, src, overlay) {
    if ((overlay) && (overlay.color)) {
      var latLng = map.fromContainerPixelToLatLng(point);
      var linksHtml = getLinksHtml(mapConfig, latLng, map.getZoom());
      var actionsHtml = getActionsHtml(mapConfig, latLng, map.getZoom());
      var tabs = [new GInfoWindowTab("Links", linksHtml),
                  new GInfoWindowTab("Actions", actionsHtml)]
      map.openInfoWindowTabsHtml(latLng, tabs);
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

function getKm2XYFromPoint(mc, point) {
  var guessXY = {y : -1, x : -1};

  for (var i = 0, lines = 0; i < mc.grid.latPolylines.length; i++) {
    var line = mc.grid.latPolylines[i];
    var p1 = line.getVertex(0);
    var p2 = line.getVertex(line.getVertexCount() - 1);
    var mp = 1 - (point.lng() - p1.lng()) / (p2.lng() - p1.lng());
    var lat = p2.lat() + (p1.lat() - p2.lat()) * mp;

    if (point.lat() < lat) {
      guessXY.y = i - 1;
      break;
    }
  }

  for (var i = 0, lines = 0; i < mc.grid.lngPolylines.length; i++) {
    var line = mc.grid.lngPolylines[i];
    var p1 = line.getVertex(0);
    var p2 = line.getVertex(line.getVertexCount() - 1);
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
  var statusText = "Page=" + info.page + ", KKJ=" + info.kkjText +
                   ", visited=" + info.visited + ", ZL=" + info.zl +
                   ", Lat/Lng=" + info.latLng;

  document.getElementById("status_bar").innerHTML = statusText;
}

function updateCursor(mc, map, info) {
  if (mc.cursor)  {
    if (mc.cursorParams.kkj == info.kkjText) {
      return;
    } else {
      map.removeOverlay(mc.cursor);
      mc.cursorParams.kkj = "-";
    }
  }

  if ((info.km2XY) && (map.getZoom() < mc.cursorParams.maxZoomLevel)) {
    var points = mc.km2s[info.km2XY.y][info.km2XY.x].points;
    mc.cursor = new GPolygon(points, mc.cursorParams.strokeColor,
      mc.cursorParams.strokeWeight, mc.cursorParams.strokeOpacity,
      mc.cursorParams.fillColor, mc.cursorParams.fillOpacity);
    map.addOverlay(mc.cursor);
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
  var latLng = new GLatLng(parseFloat(lat), parseFloat(lng));

  gMap.setCenter(latLng, gMapConfig.zoomToPointZoomLevel);
}

function toggleOpacity() {
  gMap.clearOverlays();

  if (gMapConfig.area.opacity == gMapConfig.area.opacityHigh) {
    gMapConfig.area.opacity = gMapConfig.area.opacityLow;
  } else {
    gMapConfig.area.opacity = gMapConfig.area.opacityHigh;
  }

  addOverlaysToMap(gMapConfig, gMap);
}

function toggleShowExtensions() {
  gMap.clearOverlays();
  GEvent.clearInstanceListeners(gMap);

  document.getElementById("statistics").innerHTML =
    gMapConfig.initialStatistics;

  gMapConfig = createMapConfig(!gMapConfig.showExtensions);

  initMap(gMap, gMapConfig);
}

function changeVisitedData(newTarget) {
  if (newTarget == 2008) {
    setVisitedData(gMapConfig.filenames.visitedData2008, "from end of 2008");
  } else {
    setVisitedData(gMapConfig.filenames.visitedDataLatest, "latest");
  }
}

function setVisitedData(filename, visitedDataDescription) {
  gMap.clearOverlays();

  gMapConfig.filenames.visitedData = filename;
  gMapConfig.visitedDataDescription = visitedDataDescription;

  setKm2sToMapConfig(gMapConfig, gMap);
}
