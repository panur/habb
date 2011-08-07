/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-07 */

function setPointsToMapConfig(mapConfig, map) {
  var points = [];

  for (var y = 0; y <= (mapConfig.latPages * mapConfig.latKmPerP); y++) {
    points[y] = [];
    for (var x = 0; x < (mapConfig.lngPages * mapConfig.lngKmPerP); x++) {
      points[y][x] = "-";
    }
  }

  downloadUrl(mapConfig.filenames.points, function(data, responseCode) {
    var xml = parseXml(data);
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
  downloadUrl(mapConfig.filenames.visitedData, function(data, responseCode) {
    var xml = parseXml(data);
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

function addOverlaysToMap(mc, map) {
  addOrRemoveOverlays(mc, map, map);
}

function removeOverlaysFromMap(mc, map) {
  addOrRemoveOverlays(mc, map, null);
}

function addOrRemoveOverlays(mc, map, mapOrNull) {
  for (var i = 0; i < mc.visitedStatusAreas.length; i++) {
    if (mc.visitedStatusAreas[i].getPath()) {
      mc.visitedStatusAreas[i].setOptions({fillOpacity: mc.area.opacity});
      mc.visitedStatusAreas[i].setMap(mapOrNull);
    }
  }

  for (var i = 0; i < mc.grid.latPolylines.length; i++) {
    mc.grid.latPolylines[i].setMap(mapOrNull);
  }

  for (var i = 0; i < mc.grid.lngPolylines.length; i++) {
    mc.grid.lngPolylines[i].setMap(mapOrNull);
  }

  addTripsOverlaysToMap(mc, map);
}

// tbd: this is not accurate
function getKm2XYFromPoint(mc, point) {
  var guessXY = {y : -1, x : -1};

  for (var i = 0; i < mc.grid.latPolylines.length; i++) {
    var line = mc.grid.latPolylines[i];
    var p1 = line.getPath().getAt(0);
    var p2 = line.getPath().getAt(line.getPath().length - 1);
    var mp = 1 - ((point.lng() - p1.lng()) / (p2.lng() - p1.lng()));
    var lat = p2.lat() + ((p1.lat() - p2.lat()) * mp);

    if (point.lat() < lat) {
      guessXY.y = i - 1;
      break;
    }
  }

  for (var i = 0; i < mc.grid.lngPolylines.length; i++) {
    var line = mc.grid.lngPolylines[i];
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
    mc.cursor = new google.maps.Polyline({
      path: points,
      strokeColor: mc.cursorParams.strokeColor,
      strokeWeight: mc.cursorParams.strokeWeight,
      strokeOpacity: mc.cursorParams.strokeOpacity,
      clickable: false,
      zIndex: 1
    });
    mc.cursor.setMap(map);
    mc.cursorParams.kkj = info.kkjText;
  }
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
  _setVisibilityOfAllTrips("hidden");

  removeOverlaysFromMap(gMapConfig, gMap);

  // http://code.google.com/p/gmaps-api-issues/issues/detail?id=2517
  //google.maps.event.clearInstanceListeners(gMap);
  google.maps.event.clearListeners(gMap, "pointsAreInMapConfig");
  google.maps.event.clearListeners(gMap, "km2sAreInMapConfig");

  document.getElementById("statistics").innerHTML =
    gMapConfig.initialStatistics;

  initMapConfig(gMapConfig, !gMapConfig.showExtensions);

  initMap(gMap, gMapConfig);
}

function changeVisitedData(newTarget) {
  if (newTarget == 2008) {
    setVisitedData(gMapConfig.filenames.visitedData2008);
  } else if (newTarget == 2009) {
    setVisitedData(gMapConfig.filenames.visitedData2009);
  } else {
    setVisitedData(gMapConfig.filenames.visitedDataLatest);
  }
}

function setVisitedData(filename) {
  removeOverlaysFromMap(gMapConfig, gMap);

  gMapConfig.filenames.visitedData = filename;

  setKm2sToMapConfig(gMapConfig, gMap);
}
