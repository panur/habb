/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-08 */

function Areas(mapConfig, map) {
  var config = getConfig(true);

  google.maps.event.addListener(map, "pointsAreInConfig", function() {
    setKm2sToConfig(config, map);
  });

  google.maps.event.addListener(map, "km2sAreInConfig", function() {
    updateMapGrid(config);
    config.visitedStatusAreas = getVisitedStatusAreas(config, map);
    addOverlaysToMap(config, map);
    google.maps.event.trigger(map, "areasInitIsReady");
  });

  function getConfig(showExtensions) {
    var c = {};

    c.showExtensions = showExtensions;

    c.filenames = {points:"generated_points.xml",
      visitedDataLatest:"visited_datas/latest.xml",
      visitedData2008:"visited_datas/2008.xml",
      visitedData2009:"visited_datas/2009.xml"};
    c.filenames.visitedData = c.filenames.visitedDataLatest;

    c.area = {opacity:0.5, opacityLow:0.2, opacityHigh:0.5,
              colors:{yes:"#00FF00", no:"#FF0000", np:"#808080"}}
    c.grid = {weight:1, opacity:0.5,
              colors:{page:"#000000", km2:"#FFFFFF"}};
    c.cursorParams = {strokeColor:"#000000", strokeWeight:2,
                      strokeOpacity:1, maxZoomLevel:15, kkj:"-"};

    c.latKmPerP = 5;
    c.latPages = 7;
    c.lngKmPerP = 4;
    c.lngPages = 9;
    c.kkjStart = {lat:65, lng:30};
    c.kkjOffset = {lat:-1, lng:-1}; /* will be read from file */

    c.lats = [{n:5,  lngOffsetKm:4,  latOffsetKm:0,  lengthP:2},
              {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:8},
              {n:11, lngOffsetKm:0,  latOffsetKm:10, lengthP:9},
              {n:10, lngOffsetKm:4,  latOffsetKm:21, lengthP:8},
              {n:5,  lngOffsetKm:12, latOffsetKm:31, lengthP:2},
              {n:5,  lngOffsetKm:24, latOffsetKm:31, lengthP:2}];

    c.lngs = [{n:4, lngOffsetKm:0,  latOffsetKm:5,  lengthP:3},
              {n:8, lngOffsetKm:4,  latOffsetKm:0,  lengthP:6},
              {n:1, lngOffsetKm:12, latOffsetKm:0,  lengthP:7},
              {n:8, lngOffsetKm:13, latOffsetKm:5,  lengthP:6},
              {n:3, lngOffsetKm:21, latOffsetKm:5,  lengthP:5},
              {n:9, lngOffsetKm:24, latOffsetKm:5,  lengthP:6},
              {n:4, lngOffsetKm:33, latOffsetKm:10, lengthP:4}];

    c.pages = [0,  1,  2,  0,  0,  0,  0,  0,  0,
               3,  4,  5,  6,  7,  8,  9, 10,  0,
              11, 12, 13, 14, 15, 16, 17, 18, 19,
              20, 21, 22, 23, 24, 25, 26, 27, 28,
               0, 29, 30, 31, 32, 33, 34, 35, 36,
               0, 37, 38, 39, 40, 41, 42, 43, 44,
               0,  0,  0, 45, 46,  0, 47, 48];

    if (c.showExtensions) {
      c.filenames.points = "generated_points_ext.xml";
      c.lngPages = 12;
      c.kkjStart = {lat:65, lng:22};

      c.lats = [{n:5,  lngOffsetKm:0,  latOffsetKm:0,  lengthP:5},
                {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:10},
                {n:26, lngOffsetKm:0,  latOffsetKm:10, lengthP:12}];

      c.lngs = [{n:21, lngOffsetKm:0,  latOffsetKm:0,  lengthP:7},
                {n:20, lngOffsetKm:21, latOffsetKm:5,  lengthP:6},
                {n:8,  lngOffsetKm:41, latOffsetKm:10, lengthP:5}];

      c.pages = ['a', 'A', 'B',   1,   2,  0,  0,   0,  0,  0,   0,   0,
                 'b', 'C',   3,   4,   5,  6,  7,   8,  9, 10,   0,   0,
                 'c', 'D',  11,  12,  13, 14, 15,  16, 17, 18,  19, 'E',
                 'd', 'F',  20,  21,  22, 23, 24,  25, 26, 27,  28, 'G',
                 'e', 'H', 'I',  29,  30, 31, 32,  33, 34, 35,  36, 'J',
                 'f', 'K', 'L',  37,  38, 39, 40,  41, 42, 43,  44, 'M',
                 'g', 'N', 'O', 'P', 'Q', 45, 46, 'R', 47, 48, 'S', 'T'];
    }

    return c;
  }

  function setPointsToConfig(config, map) {
    var points = [];

    for (var y = 0; y <= (config.latPages * config.latKmPerP); y++) {
      points[y] = [];
      for (var x = 0; x < (config.lngPages * config.lngKmPerP); x++) {
        points[y][x] = "-";
      }
    }

    downloadUrl(config.filenames.points, function(data, responseCode) {
      var xml = parseXml(data);
      var p = xml.documentElement.getElementsByTagName("point");
      config.kkjOffset.lat = parseInt(p[0].getAttribute("kkj_lat"));
      config.kkjOffset.lng = parseInt(p[0].getAttribute("kkj_lng"));;

      for (var i = 0; i < p.length; i++) {
        var y = parseInt(p[i].getAttribute("kkj_lat")) - config.kkjOffset.lat;
        var x = parseInt(p[i].getAttribute("kkj_lng")) - config.kkjOffset.lng;
        var lat = parseFloat(p[i].getAttribute("lat"));
        var lng = parseFloat(p[i].getAttribute("lng"));
        points[y][x] = new google.maps.LatLng(lat, lng);
      }

      config.points = points;
      google.maps.event.trigger(map, "pointsAreInConfig");
    });
  }

  function setKm2sToConfig(config, map) {
    var km2s = [];

    for (var y = 0; y < (config.latPages * config.latKmPerP); y++) {
      km2s[y] = [];
      for (var x = 0; x < (config.lngPages * config.lngKmPerP); x++) {
        var points = [config.points[y][x], config.points[y][x + 1],
                      config.points[y + 1][x + 1], config.points[y + 1][x],
                      config.points[y][x]];
        km2s[y][x] = {};
        km2s[y][x].points = points;
        km2s[y][x].visited = "-";
      }
    }

    config.km2s = km2s;

    setVisitedDataToKm2s(config, map);
  }

  function setVisitedDataToKm2s(config, map) {
    downloadUrl(config.filenames.visitedData, function(data, responseCode) {
      var xml = parseXml(data);
      var allInPage = [];
      var pages = xml.documentElement.getElementsByTagName("page");

      for (var i = 0; i < pages.length; i++) {
        if (pages[i].getAttribute("visited_all") == "true") {
          if ((config.showExtensions) ||
              (pages[i].getAttribute("number") < "A")) {
            allInPage.push(pages[i].getAttribute("number"));
          }
        }
      }

      for (var i = 0; i < allInPage.length; i++) {
        var page = getIndexOf(config.pages, allInPage[i]);
        var initY = Math.floor(page / config.lngPages) * config.latKmPerP;
        var initX = (page % config.lngPages) * config.lngKmPerP;

        for (var y = 0; y < config.latKmPerP; y++) {
          for (var x = 0; x < config.lngKmPerP; x++) {
            config.km2s[initY + y][initX + x].visited = "yes";
          }
        }
      }

      var km2s = xml.documentElement.getElementsByTagName("km2");

      for (var i = 0; i < km2s.length; i++) {
        var y = parseInt(km2s[i].getAttribute("kkj_lat")) - config.kkjStart.lat;
        var x = parseInt(km2s[i].getAttribute("kkj_lng")) - config.kkjStart.lng;

        if ((config.showExtensions) || (km2s[i].getAttribute("page") < "A")) {
          config.km2s[y][x].visited = km2s[i].getAttribute("visited");
        }
      }

      google.maps.event.trigger(map, "km2sAreInConfig");
    });
  }

  function updateMapGrid(config) {
    var color;

    config.grid.latPolylines = [];
    config.grid.lngPolylines = [];

    for (var i = 0, lines = 0; i < config.lats.length; i++) {
      for (var j = 0; j < config.lats[i].n; j++) {
        var lat = config.lats[i].latOffsetKm + j;
        var points = [];
        for (var k = 0; k <= (config.lats[i].lengthP * config.lngKmPerP); k++) {
          points.push(config.points[lat][config.lats[i].lngOffsetKm + k]);
        }
        color = ((lines++ % config.latKmPerP) == 0) ?
                config.grid.colors.page : config.grid.colors.km2;
        var lat = new google.maps.Polyline({
          path: points, strokeColor: color, strokeWeight: config.grid.weight,
          strokeOpacity: config.grid.opacity, clickable: false, zIndex: 1
        });
        config.grid.latPolylines.push(lat);
      }
    }

    for (var i = 0, lines = 0; i < config.lngs.length; i++) {
      for (var j = 0; j < config.lngs[i].n; j++) {
        var lng = config.lngs[i].lngOffsetKm + j;
        var points = [];
        for (var k = 0; k <= (config.lngs[i].lengthP * config.latKmPerP); k++) {
          points.push(config.points[config.lngs[i].latOffsetKm + k][lng]);
        }

        color = ((lines++ % config.lngKmPerP) == 0) ?
                config.grid.colors.page : config.grid.colors.km2;
        var lng = new google.maps.Polyline({
          path: points, strokeColor: color, strokeWeight: config.grid.weight,
          strokeOpacity: config.grid.opacity, clickable: false, zIndex: 1
        });
        config.grid.lngPolylines.push(lng);
      }
    }
  }

  function getVisitedStatusAreas(config) {
    var polygonGroups = {};
    polygonGroups.np = getPolygonGroup(config, "np");
    polygonGroups.no = getPolygonGroup(config, "no");
    polygonGroups.yes = getPolygonGroup(config, "yes");
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
        strokeColor: config.area.colors[i],
        strokeWeight: 1,
        strokeOpacity: 0.5,
        fillColor: config.area.colors[i],
        fillOpacity: config.area.opacity,
        clickable: false,
        zIndex: 1
      });

      visitedStatusAreas.push(polygon);
    }

    return visitedStatusAreas;
  }

  function getPolygonGroup(config, visitedStatus) {
    var polygons = [];
    var params =
      {visitedStatus:visitedStatus, km2NeedsToBeTested:getKm2sInMap(config)};

    for (var y = 0; y < config.km2s.length; y++) {
      for (var x = 0; x < config.km2s[y].length; x++) {
        if ((config.km2s[y][x].visited == visitedStatus) &&
            (params.km2NeedsToBeTested[y][x] == true) &&
            (isPointInPolygons(config.points[y][x], polygons) == false)) {
          var points = [];

          params.initXY = {y:y, x:x};

          getPolylinePoints(y, x, "right", config, points, params);

          var splittedLoops = splitLoops(points);
          for (var i = 0; i < splittedLoops.length; i++) {
            polygons.push(splittedLoops[i]);
          }

          if (visitedStatus == "yes") {
            /* http://econym.org.uk/gmap/chrome.htm#winding */
            polygons[0].reverse();
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

  function getKm2sInMap(config) {
    var km2s = [];

    for (var y = 0; y < config.km2s.length; y++) {
      km2s[y] = [];

      for (var x = 0; x < config.km2s[y].length; x++) {
        if (config.km2s[y][x].visited == "-") {
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

  function getPolylinePoints(y, x, direction, config, points, params) {
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
        if ((y < config.km2s.length) && (x < config.km2s[y].length)) {
          if (config.km2s[y][x].visited == params.visitedStatus) {
            newX = x + 1;
            break;
          }
        }
      } else if (newDirection == "up") {
        if ((y < config.km2s.length) && ((x - 1) >= 0)) {
          if (config.km2s[y][x - 1].visited == params.visitedStatus) {
            newY = y + 1;
            break;
          }
        }
      } else if (newDirection == "left") {
        if (((y - 1) >= 0) && ((x - 1) >= 0)) {
          if (config.km2s[y - 1][x - 1].visited == params.visitedStatus) {
            newX = x - 1;
            break;
          }
        }
      } else if (newDirection == "down") {
        if (((y - 1) >= 0) && (x < config.km2s[y - 1].length)) {
          if (config.km2s[y - 1][x].visited == params.visitedStatus) {
            newY = y - 1;
            break;
          }
        }
      }
    }

    if ((newY != y) || (newX != x)) {
      points.push(config.points[y][x]);

      if (y < config.km2s.length) {
        params.km2NeedsToBeTested[y][x] = false;
      }

      if ((newY >= 0) && (newX >= 0) &&
          ((newY != params.initXY.y) || (newX != params.initXY.x))) {
        getPolylinePoints(newY, newX, newDirection, config, points, params);
      }
    }
  }

  function addOverlaysToMap(config, map) {
    addOrRemoveOverlays(config, map, map);
  }

  function removeOverlaysFromMap(config, map) {
    addOrRemoveOverlays(config, map, null);
  }

  function addOrRemoveOverlays(config, map, mapOrNull) {
    for (var i = 0; i < config.visitedStatusAreas.length; i++) {
      if (config.visitedStatusAreas[i].getPath()) {
        config.visitedStatusAreas[i].setOptions({fillOpacity:
                                                 config.area.opacity});
        config.visitedStatusAreas[i].setMap(mapOrNull);
      }
    }

    for (var i = 0; i < config.grid.latPolylines.length; i++) {
      config.grid.latPolylines[i].setMap(mapOrNull);
    }

    for (var i = 0; i < config.grid.lngPolylines.length; i++) {
      config.grid.lngPolylines[i].setMap(mapOrNull);
    }
  }

  // tbd: this is not accurate
  function getKm2XYFromPoint(point) {
    var guessXY = {y : -1, x : -1};

    for (var i = 0; i < config.grid.latPolylines.length; i++) {
      var line = config.grid.latPolylines[i];
      var p1 = line.getPath().getAt(0);
      var p2 = line.getPath().getAt(line.getPath().length - 1);
      var mp = 1 - ((point.lng() - p1.lng()) / (p2.lng() - p1.lng()));
      var lat = p2.lat() + ((p1.lat() - p2.lat()) * mp);

      if (point.lat() < lat) {
        guessXY.y = i - 1;
        break;
      }
    }

    for (var i = 0; i < config.grid.lngPolylines.length; i++) {
      var line = config.grid.lngPolylines[i];
      var p1 = line.getPath().getAt(0);
      var p2 = line.getPath().getAt(line.getPath().length - 1);
      var mp = 1 - ((point.lat() - p2.lat()) / (p1.lat() - p2.lat()));
      var lng = p1.lng() + ((p2.lng() - p1.lng()) * mp);

      if (point.lng() < lng) {
        guessXY.x = i - 1;
        break;
      }
    }

    if ((guessXY.y >= 0) && (guessXY.x >= 0)) {
      return getKm2XYFromGuess(config, point, guessXY);
    }

    return null;
  }

  function getKm2XYFromGuess(config, point, guessXY) {
    for (var y = guessXY.y - 1; y < guessXY.y + 2; y++) {
      for (var x = guessXY.x - 1; x < guessXY.x + 2; x++) {
        if ((y >= 0) && (x >= 0) &&
            (y < (config.points.length - 1) &&
            (x < (config.points[y].length - 1)))) {

          if (isPointInPolygon(point, config.km2s[y][x].points)) {
            return {y:y, x:x};
          }
        }
      }
    }

    return null;
  }

  this.init = function() {
    setPointsToConfig(config, map);
  }

  this.getKkjOffsetOrStart = function(point, offsetOrStart) {
    var km2XY = getKm2XYFromPoint(point);
    var kkj = null;

    if (km2XY != null) {
      kkj = {y: km2XY.y, x: km2XY.x};

      if (offsetOrStart == "offset") {
        kkj.y += config.kkjOffset.lat;
        kkj.x += config.kkjOffset.lng;
      } else {
        kkj.y += config.kkjStart.lat;
        kkj.x += config.kkjStart.lng;
      }
    }

    return kkj;
  }

  this.getAreasInfo = function(point) {
    var info = {page:"-", km2XY:null, kkjText:"-/-", visited:"-"};
    var km2XY = getKm2XYFromPoint(point);

    if (km2XY) {
      var pageIndex = Math.floor(km2XY.y / config.latKmPerP) * config.lngPages +
                      Math.floor(km2XY.x / config.lngKmPerP);
      if (pageIndex < config.pages.length) {
        if (config.pages[pageIndex] != 0) {
          info.page = config.pages[pageIndex];
          info.visited = config.km2s[km2XY.y][km2XY.x].visited;
        } else {
          km2XY = null;
        }
      } else {
        km2XY = null;
      }
    }

    info.km2XY = km2XY;

    if (km2XY) {
      var yKKJ = config.kkjStart.lat + km2XY.y;
      var xKKJ = config.kkjStart.lng + km2XY.x;
      info.kkjText = yKKJ + "/" + xKKJ;
    }

    return info;
  }

  this.getVisitedStatistics = function() {
    var s = {yes:0, no:0, np:0};

    for (var y = 0; y < config.km2s.length; y++) {
      for (var x = 0; x < config.km2s[y].length; x++) {
        if (config.km2s[y][x].visited != "-") {
          s[config.km2s[y][x].visited] += 1;
        }
      }
    }

    return s;
  }

  this.updateCursor = function(map, info) {
    if (config.cursor)  {
      if (config.cursorParams.kkj == info.kkjText) {
        return;
      } else {
        config.cursor.setMap(null);
        config.cursorParams.kkj = "-";
      }
    }

    if ((info.km2XY) && (map.getZoom() < config.cursorParams.maxZoomLevel)) {
      var points = config.km2s[info.km2XY.y][info.km2XY.x].points;
      config.cursor = new google.maps.Polyline({
        path: points,
        strokeColor: config.cursorParams.strokeColor,
        strokeWeight: config.cursorParams.strokeWeight,
        strokeOpacity: config.cursorParams.strokeOpacity,
        clickable: false,
        zIndex: 1
      });
      config.cursor.setMap(map);
      config.cursorParams.kkj = info.kkjText;
    }
  }

  this.hideCursor = function () {
    if (config.cursor) {
      config.cursor.setMap(null);
    }
  }

  this.toggleOpacity = function() {
    removeOverlaysFromMap(config, map);

    if (config.area.opacity == config.area.opacityHigh) {
      config.area.opacity = config.area.opacityLow;
    } else {
      config.area.opacity = config.area.opacityHigh;
    }

    addOverlaysToMap(config, map);
  }

  this.setVisitedAreaOpacityToLow = function() {
    if (config.area.opacity == config.area.opacityHigh) {
      this.toggleOpacity();
    }
  }

  this.setVisitedAreaOpacityToHigh = function() {
    if (config.area.opacity == config.area.opacityLow) {
      this.toggleOpacity();
    }
  }

  this.toggleShowExtensions = function() {
    removeOverlaysFromMap(config, map);

    document.getElementById("statistics").innerHTML =
      mapConfig.initialStatistics;

    config = getConfig(!(config.showExtensions));

    setPointsToConfig(config, map);
  }

  this.changeVisitedData = function(newTarget) {
    if (newTarget == 2008) {
      this.setVisitedData(config.filenames.visitedData2008);
    } else if (newTarget == 2009) {
      this.setVisitedData(config.filenames.visitedData2009);
    } else {
      this.setVisitedData(config.filenames.visitedDataLatest);
    }
  }

  this.setVisitedData = function(filename) {
    removeOverlaysFromMap(config, map);

    config.filenames.visitedData = filename;

    setKm2sToConfig(config, map);
  }
}
