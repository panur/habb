/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2012-04-09 */

function Areas(master) {
  var that = this; /* http://javascript.crockford.com/private.html */
  var state = getState(true);

  function getState(isExtensionsShown) {
    var s = {};

    s.isExtensionsShown = isExtensionsShown;
    s.isShown = true;

    s.filenames = {points:"generated_points.xml",
      visitedDatas:{
        "2008":"visited_datas/2008.xml",
        "2009":"visited_datas/2009.xml",
        "2010":"visited_datas/2010.xml",
        "2011":"visited_datas/2011.xml",
        "latest":"visited_datas/latest.xml"}};
    s.filenames.visitedData = s.filenames.visitedDatas["latest"];

    s.area = {opacity:0.5, opacityLow:0.2, opacityHigh:0.5,
              colors:{yes:"#00FF00", no:"#FF0000", np:"#808080"}}
    s.grid = {weight:1, opacity:0.5,
              colors:{page:"#000000", km2:"#FFFFFF"}};
    s.cursorParams = {strokeColor:"#000000", strokeWeight:2,
                      strokeOpacity:1, maxZoomLevel:15, kkj:"-"};

    s.latKmPerP = 5;
    s.latPages = 7;
    s.lngKmPerP = 4;
    s.lngPages = 9;
    s.kkjStart = {lat:65, lng:30};
    s.kkjOffset = {lat:-1, lng:-1}; /* will be read from file */

    s.lats = [{n:5,  lngOffsetKm:4,  latOffsetKm:0,  lengthP:2},
              {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:8},
              {n:11, lngOffsetKm:0,  latOffsetKm:10, lengthP:9},
              {n:10, lngOffsetKm:4,  latOffsetKm:21, lengthP:8},
              {n:5,  lngOffsetKm:12, latOffsetKm:31, lengthP:2},
              {n:5,  lngOffsetKm:24, latOffsetKm:31, lengthP:2}];

    s.lngs = [{n:4, lngOffsetKm:0,  latOffsetKm:5,  lengthP:3},
              {n:8, lngOffsetKm:4,  latOffsetKm:0,  lengthP:6},
              {n:1, lngOffsetKm:12, latOffsetKm:0,  lengthP:7},
              {n:8, lngOffsetKm:13, latOffsetKm:5,  lengthP:6},
              {n:3, lngOffsetKm:21, latOffsetKm:5,  lengthP:5},
              {n:9, lngOffsetKm:24, latOffsetKm:5,  lengthP:6},
              {n:4, lngOffsetKm:33, latOffsetKm:10, lengthP:4}];

    s.pages = [0,  1,  2,  0,  0,  0,  0,  0,  0,
               3,  4,  5,  6,  7,  8,  9, 10,  0,
              11, 12, 13, 14, 15, 16, 17, 18, 19,
              20, 21, 22, 23, 24, 25, 26, 27, 28,
               0, 29, 30, 31, 32, 33, 34, 35, 36,
               0, 37, 38, 39, 40, 41, 42, 43, 44,
               0,  0,  0, 45, 46,  0, 47, 48];

    if (s.isExtensionsShown) {
      s.filenames.points = "generated_points_ext.xml";
      s.latPages = 8;
      s.lngPages = 13;
      s.kkjStart = {lat:65, lng:18};

      s.lats = [{n:5,  lngOffsetKm:0,  latOffsetKm:0,  lengthP:6},
                {n:5,  lngOffsetKm:0,  latOffsetKm:5,  lengthP:11},
                {n:31, lngOffsetKm:0,  latOffsetKm:10, lengthP:13}];

      s.lngs = [{n:25, lngOffsetKm:0,  latOffsetKm:0,  lengthP:8},
                {n:20, lngOffsetKm:25, latOffsetKm:5,  lengthP:7},
                {n:8,  lngOffsetKm:45, latOffsetKm:10, lengthP:6}];

      s.pages = [49, 'a', 'A', 'B',   1,   2,   0,   0,   0,   0,   0,   0,   0,
                 50, 'b', 'C',   3,   4,   5,   6,   7,   8,   9,  10,   0,   0,
                 51, 'c', 'D',  11,  12,  13,  14,  15,  16,  17,  18,  19, 'E',
                 52, 'd', 'F',  20,  21,  22,  23,  24,  25,  26,  27,  28, 'G',
                 53, 'e', 'H', 'I',  29,  30,  31,  32,  33,  34,  35,  36, 'J',
                 54, 'f', 'K', 'L',  37,  38,  39,  40,  41,  42,  43,  44, 'M',
                 55, 'g', 'N', 'O', 'P', 'Q',  45,  46, 'R',  47,  48, 'S', 'T',
                 56, 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's'];
    }

    return s;
  }

  this.init = function () {
    google.maps.event.addListener(master.gm, "pointsAreInState", function () {
      setKm2sToState();
    });

    google.maps.event.addListener(master.gm, "km2sAreInState", function () {
      updateMapGrid();
      state.visitedStatusAreas = getVisitedStatusAreas();
      addOverlaysToMap();
      google.maps.event.trigger(master.gm, "areasInitIsReady");
    });

    setPointsToState();
  }

  function setPointsToState() {
    var points = [];

    for (var y = 0; y <= (state.latPages * state.latKmPerP); y++) {
      points[y] = [];
      for (var x = 0; x < (state.lngPages * state.lngKmPerP); x++) {
        points[y][x] = "-";
      }
    }

    master.utils.downloadUrl(state.filenames.points,
                             function (data, responseCode) {
      var xml = master.utils.parseXml(data);
      var p = xml.documentElement.getElementsByTagName("point");
      state.kkjOffset.lat = parseInt(p[0].getAttribute("kkj_lat"));
      state.kkjOffset.lng = parseInt(p[0].getAttribute("kkj_lng"));;

      for (var i = 0; i < p.length; i++) {
        var y = parseInt(p[i].getAttribute("kkj_lat")) - state.kkjOffset.lat;
        var x = parseInt(p[i].getAttribute("kkj_lng")) - state.kkjOffset.lng;
        var lat = parseFloat(p[i].getAttribute("lat"));
        var lng = parseFloat(p[i].getAttribute("lng"));
        points[y][x] = new google.maps.LatLng(lat, lng);
      }

      state.points = points;
      google.maps.event.trigger(master.gm, "pointsAreInState");
    });
  }

  function setKm2sToState() {
    var km2s = [];

    for (var y = 0; y < (state.latPages * state.latKmPerP); y++) {
      km2s[y] = [];
      for (var x = 0; x < (state.lngPages * state.lngKmPerP); x++) {
        var points = [state.points[y][x], state.points[y][x + 1],
                      state.points[y + 1][x + 1], state.points[y + 1][x],
                      state.points[y][x]];
        km2s[y][x] = {};
        km2s[y][x].points = points;
        km2s[y][x].visited = "-";
      }
    }

    state.km2s = km2s;

    setVisitedDataToKm2s();
  }

  function setVisitedDataToKm2s() {
    master.utils.downloadUrl(state.filenames.visitedData,
                             function (data, responseCode) {
      var xml = master.utils.parseXml(data);
      var allInPage = [];
      var pages = xml.documentElement.getElementsByTagName("page");

      for (var i = 0; i < pages.length; i++) {
        if (pages[i].getAttribute("visited_all") == "true") {
          if ((state.isExtensionsShown) ||
              (pages[i].getAttribute("number") < "A")) {
            allInPage.push(pages[i].getAttribute("number"));
          }
        }
      }

      for (var i = 0; i < allInPage.length; i++) {
        var page = master.utils.getIndexOf(state.pages, allInPage[i]);
        var initY = Math.floor(page / state.lngPages) * state.latKmPerP;
        var initX = (page % state.lngPages) * state.lngKmPerP;

        for (var y = 0; y < state.latKmPerP; y++) {
          for (var x = 0; x < state.lngKmPerP; x++) {
            state.km2s[initY + y][initX + x].visited = "yes";
          }
        }
      }

      var km2s = xml.documentElement.getElementsByTagName("km2");

      for (var i = 0; i < km2s.length; i++) {
        var y = parseInt(km2s[i].getAttribute("kkj_lat")) - state.kkjStart.lat;
        var x = parseInt(km2s[i].getAttribute("kkj_lng")) - state.kkjStart.lng;

        if ((state.isExtensionsShown) ||
            (km2s[i].getAttribute("page") < 49)) {
          state.km2s[y][x].visited = km2s[i].getAttribute("visited");
        }
      }

      google.maps.event.trigger(master.gm, "km2sAreInState");
    });
  }

  function updateMapGrid() {
    var color;

    state.grid.latPolylines = [];
    state.grid.lngPolylines = [];

    for (var i = 0, lines = 0; i < state.lats.length; i++) {
      for (var j = 0; j < state.lats[i].n; j++) {
        var lat = state.lats[i].latOffsetKm + j;
        var points = [];
        for (var k = 0; k <= (state.lats[i].lengthP * state.lngKmPerP); k++) {
          points.push(state.points[lat][state.lats[i].lngOffsetKm + k]);
        }
        color = ((lines++ % state.latKmPerP) == 0) ?
                state.grid.colors.page : state.grid.colors.km2;
        var lat = new google.maps.Polyline({
          path: points, strokeColor: color, strokeWeight: state.grid.weight,
          strokeOpacity: state.grid.opacity, clickable: false, zIndex: 1
        });
        state.grid.latPolylines.push(lat);
      }
    }

    for (var i = 0, lines = 0; i < state.lngs.length; i++) {
      for (var j = 0; j < state.lngs[i].n; j++) {
        var lng = state.lngs[i].lngOffsetKm + j;
        var points = [];
        for (var k = 0; k <= (state.lngs[i].lengthP * state.latKmPerP); k++) {
          points.push(state.points[state.lngs[i].latOffsetKm + k][lng]);
        }

        color = ((lines++ % state.lngKmPerP) == 0) ?
                state.grid.colors.page : state.grid.colors.km2;
        var lng = new google.maps.Polyline({
          path: points, strokeColor: color, strokeWeight: state.grid.weight,
          strokeOpacity: state.grid.opacity, clickable: false, zIndex: 1
        });
        state.grid.lngPolylines.push(lng);
      }
    }
  }

  function getVisitedStatusAreas() {
    var polygonGroups = {};
    polygonGroups.np = getPolygonGroup("np");
    polygonGroups.no = getPolygonGroup("no");
    polygonGroups.yes = getPolygonGroup("yes");
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
        strokeColor: state.area.colors[i],
        strokeWeight: 1,
        strokeOpacity: 0.5,
        fillColor: state.area.colors[i],
        fillOpacity: state.area.opacity,
        clickable: false,
        zIndex: 1
      });

      visitedStatusAreas.push(polygon);
    }

    return visitedStatusAreas;
  }

  function getPolygonGroup(visitedStatus) {
    var polygons = [];
    var params =
      {visitedStatus:visitedStatus, km2NeedsToBeTested:getKm2sInMap()};

    for (var y = 0; y < state.km2s.length; y++) {
      for (var x = 0; x < state.km2s[y].length; x++) {
        if ((state.km2s[y][x].visited == visitedStatus) &&
            (params.km2NeedsToBeTested[y][x] == true) &&
            (isPointInPolygons(state.points[y][x], polygons) == false)) {
          var points = [];

          params.initXY = {y:y, x:x};

          getPolylinePoints(y, x, "right", points, params);

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
      var loopStart = master.utils.getIndexOf(points, points[loopEnd]);
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

  function getKm2sInMap() {
    var km2s = [];

    for (var y = 0; y < state.km2s.length; y++) {
      km2s[y] = [];

      for (var x = 0; x < state.km2s[y].length; x++) {
        if (state.km2s[y][x].visited == "-") {
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
          oddNodes = !oddNodes;
        }
      }
    }

    return oddNodes;
  }

  function getPolylinePoints(y, x, direction, points, params) {
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
        if ((y < state.km2s.length) && (x < state.km2s[y].length)) {
          if (state.km2s[y][x].visited == params.visitedStatus) {
            newX = x + 1;
            break;
          }
        }
      } else if (newDirection == "up") {
        if ((y < state.km2s.length) && ((x - 1) >= 0)) {
          if (state.km2s[y][x - 1].visited == params.visitedStatus) {
            newY = y + 1;
            break;
          }
        }
      } else if (newDirection == "left") {
        if (((y - 1) >= 0) && ((x - 1) >= 0)) {
          if (state.km2s[y - 1][x - 1].visited == params.visitedStatus) {
            newX = x - 1;
            break;
          }
        }
      } else if (newDirection == "down") {
        if (((y - 1) >= 0) && (x < state.km2s[y - 1].length)) {
          if (state.km2s[y - 1][x].visited == params.visitedStatus) {
            newY = y - 1;
            break;
          }
        }
      }
    }

    if ((newY != y) || (newX != x)) {
      points.push(state.points[y][x]);

      if (y < state.km2s.length) {
        params.km2NeedsToBeTested[y][x] = false;
      }

      if ((newY >= 0) && (newX >= 0) &&
          ((newY != params.initXY.y) || (newX != params.initXY.x))) {
        getPolylinePoints(newY, newX, newDirection, points, params);
      }
    }
  }

  function addOverlaysToMap() {
    addOrRemoveOverlays(master.gm);
  }

  function removeOverlaysFromMap() {
    addOrRemoveOverlays(null);
  }

  function addOrRemoveOverlays(gmOrNull) {
    for (var i = 0; i < state.visitedStatusAreas.length; i++) {
      if (state.visitedStatusAreas[i].getPath()) {
        state.visitedStatusAreas[i].setOptions({fillOpacity:
                                                 state.area.opacity});
        state.visitedStatusAreas[i].setMap(gmOrNull);
      }
    }

    for (var i = 0; i < state.grid.latPolylines.length; i++) {
      state.grid.latPolylines[i].setMap(gmOrNull);
    }

    for (var i = 0; i < state.grid.lngPolylines.length; i++) {
      state.grid.lngPolylines[i].setMap(gmOrNull);
    }
  }

  // tbd: this is not accurate
  function getKm2XYFromPoint(point) {
    var guessXY = {y : -1, x : -1};

    for (var i = 0; i < state.grid.latPolylines.length; i++) {
      var line = state.grid.latPolylines[i];
      var p1 = line.getPath().getAt(0);
      var p2 = line.getPath().getAt(line.getPath().length - 1);
      var mp = 1 - ((point.lng() - p1.lng()) / (p2.lng() - p1.lng()));
      var lat = p2.lat() + ((p1.lat() - p2.lat()) * mp);

      if (point.lat() < lat) {
        guessXY.y = i - 1;
        break;
      }
    }

    for (var i = 0; i < state.grid.lngPolylines.length; i++) {
      var line = state.grid.lngPolylines[i];
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
      return getKm2XYFromGuess(point, guessXY);
    }

    return null;
  }

  function getKm2XYFromGuess(point, guessXY) {
    for (var y = guessXY.y - 1; y < guessXY.y + 2; y++) {
      for (var x = guessXY.x - 1; x < guessXY.x + 2; x++) {
        if ((y >= 0) && (x >= 0) &&
            (y < (state.points.length - 1) &&
            (x < (state.points[y].length - 1)))) {

          if (isPointInPolygon(point, state.km2s[y][x].points)) {
            return {y:y, x:x};
          }
        }
      }
    }

    return null;
  }

  this.getKkjOffsetOrStart = function (point, offsetOrStart) {
    var km2XY = getKm2XYFromPoint(point);
    var kkj = null;

    if (km2XY != null) {
      kkj = {y: km2XY.y, x: km2XY.x};

      if (offsetOrStart == "offset") {
        kkj.y += state.kkjOffset.lat;
        kkj.x += state.kkjOffset.lng;
      } else {
        kkj.y += state.kkjStart.lat;
        kkj.x += state.kkjStart.lng;
      }
    }

    return kkj;
  }

  this.getInfo = function (point) {
    var info = {page:"-", km2XY:null, kkjText:"-/-", visited:"-"};
    var km2XY = getKm2XYFromPoint(point);

    if (km2XY) {
      var pageIndex = Math.floor(km2XY.y / state.latKmPerP) * state.lngPages +
                      Math.floor(km2XY.x / state.lngKmPerP);
      if (pageIndex < state.pages.length) {
        if (state.pages[pageIndex] != 0) {
          info.page = state.pages[pageIndex];
          info.visited = state.km2s[km2XY.y][km2XY.x].visited;
        } else {
          km2XY = null;
        }
      } else {
        km2XY = null;
      }
    }

    info.km2XY = km2XY;

    if (km2XY) {
      var yKKJ = state.kkjStart.lat + km2XY.y;
      var xKKJ = state.kkjStart.lng + km2XY.x;
      info.kkjText = yKKJ + "/" + xKKJ;
    }

    return info;
  }

  this.getVisitedStatistics = function () {
    var s = {yes:0, no:0, np:0};

    for (var y = 0; y < state.km2s.length; y++) {
      for (var x = 0; x < state.km2s[y].length; x++) {
        if (state.km2s[y][x].visited != "-") {
          s[state.km2s[y][x].visited] += 1;
        }
      }
    }

    return s;
  }

  this.updateCursor = function (info) {
    if (state.cursor)  {
      if (state.cursorParams.kkj == info.kkjText) {
        return;
      } else {
        state.cursor.setMap(null);
        state.cursorParams.kkj = "-";
      }
    }

    if ((info.km2XY) &&
        (master.gm.getZoom() < state.cursorParams.maxZoomLevel)) {
      var points = state.km2s[info.km2XY.y][info.km2XY.x].points;
      state.cursor = new google.maps.Polyline({
        path: points,
        strokeColor: state.cursorParams.strokeColor,
        strokeWeight: state.cursorParams.strokeWeight,
        strokeOpacity: state.cursorParams.strokeOpacity,
        clickable: false,
        zIndex: 1
      });
      state.cursor.setMap(master.gm);
      state.cursorParams.kkj = info.kkjText;
    }
  }

  this.hideCursor = function () {
    if (state.cursor) {
      state.cursor.setMap(null);
    }
  }

  function toggleVisibility() {
    if (state.isShown) {
      removeOverlaysFromMap();
    } else {
      addOverlaysToMap();
    }

    state.isShown = !(state.isShown);
  }

  function toggleOpacity() {
    removeOverlaysFromMap();

    if (state.area.opacity == state.area.opacityHigh) {
      state.area.opacity = state.area.opacityLow;
    } else {
      state.area.opacity = state.area.opacityHigh;
    }

    addOverlaysToMap();
  }

  this.setVisitedAreaOpacityToLow = function () {
    if (state.isShown) {
      if (state.area.opacity == state.area.opacityHigh) {
        toggleOpacity();
      }
    }
  }

  this.setVisitedAreaOpacityToHigh = function () {
    if (state.isShown) {
      if (state.area.opacity == state.area.opacityLow) {
        toggleOpacity();
      }
    }
  }

  function toggleExtensionsVisibility() {
    var opacity = state.area.opacity;
    var visitedData = state.filenames.visitedData;

    removeOverlaysFromMap();

    state = getState(!(state.isExtensionsShown));
    state.area.opacity = opacity;
    state.filenames.visitedData = visitedData;

    setPointsToState();
  }

  this.changeVisitedData = function (key) {
    that.setVisitedData(state.filenames.visitedDatas[key]);
  }

  this.setVisitedData = function (filename) {
    removeOverlaysFromMap();

    state.filenames.visitedData = filename;

    setKm2sToState();
  }

  this.getMenuItems = function () {
    var menuItems = [];

    if (state.isShown) {
      menuItems.push("Hide");

      if (state.area.opacity == state.area.opacityHigh) {
        menuItems.push("Decrease opacity");
      } else {
        menuItems.push("Increase opacity");
      }

      if (state.isExtensionsShown) {
        menuItems.push("Hide extensions");
      } else {
        menuItems.push("Show extensions");
      }

      for (var i in state.filenames.visitedDatas) {
        if (state.filenames.visitedData != state.filenames.visitedDatas[i]) {
          if (i == "latest") {
            menuItems.push("View latest");
          } else {
            menuItems.push("View end of " + i);
          }
        }
      }
    } else {
      menuItems.push("Show");
    }

    return menuItems;
  }

  this.processMenuCommand = function (command) {
    if ((command == "Hide") || (command == "Show")) {
      toggleVisibility();
    } else if ((command == "Decrease opacity") ||
        (command == "Increase opacity")) {
      toggleOpacity();
    } else if ((command == "Hide extensions") ||
               (command == "Show extensions")) {
      toggleExtensionsVisibility();
    } else if (command == "View latest") {
      that.changeVisitedData("latest");
    } else if (/View end of \d\d\d\d/.test(command)) {
      that.changeVisitedData(command.substr(12, 4));
    }
  }
}
