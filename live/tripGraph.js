/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2010-06-06 */

function addTripGraph(mapConfig, map, tripData) {
  var tripGraph = document.getElementById("trip_graph");
  tripGraph.innerHTML = '<canvas id="tripGraphCanvas" width="' +
    tripGraph.clientWidth + '" height="' + mapConfig.tripGraph.height +
    '"></canvas>';

  var canvas = document.getElementById('tripGraphCanvas');

  if (canvas && canvas.getContext) {
    setTripGraphConfig(mapConfig, map, tripData, canvas);
    addTripGraphMouseListeners(mapConfig, map, tripGraph);
    setTripGraphControl(mapConfig, tripData);
    drawTripGraph(mapConfig);
    resizeMapCanvas(map);
    addHideTripGraph(mapConfig);
  }
}

function setTripGraphConfig(mapConfig, map, tripData, canvas) {
  var originalGpsData;

  mapConfig.tripGraph.tripData = tripData;
  mapConfig.tripGraph.visibility = "visible";

  if (typeof(mapConfig.tripGraph.tickInterval) == "undefined") {
    var intervalMs = mapConfig.tripGraph.tickIntervalMs;
    mapConfig.tripGraph.tickInterval =
      window.setInterval(processTripGraphTick, intervalMs, mapConfig, map);
  }

  if (mapConfig.tripGraph.types[0] == "Speed") {
    mapConfig.tripGraph.unit = "km/h";
    originalGpsData = tripData.gpsSpeedData;
    mapConfig.tripGraph.yUnitsPerScaleLine = 10;
    mapConfig.tripGraph.yUnitToPixelRatio = 2;
  } else {
    mapConfig.tripGraph.unit = "m";
    originalGpsData = tripData.gpsAltitudeData;
    mapConfig.tripGraph.yUnitsPerScaleLine = 20;
    var maxAltitude = mapConfig.tripGraph.tripData.gpsMaxAltitude.value;
    var height = mapConfig.tripGraph.origo.y;
    mapConfig.tripGraph.yUnitToPixelRatio =
      1 / (1 + Math.floor(maxAltitude / height));
  }

  tripData.graphData = [];
  resizeArray(originalGpsData, mapConfig.tripGraph.tripData.graphData,
              canvas.width - mapConfig.tripGraph.origo.x);
}

function processTripGraphEvent(mapConfig, map, event) {
  var origo = mapConfig.tripGraph.origo;
  var canvas = document.getElementById('tripGraphCanvas');
  if ((event.clientX > origo.x) && (event.clientX < canvas.width)) {
    mapConfig.tripGraph.lastRatio =
      (event.clientX - origo.x) / (canvas.width - origo.x);
    updateTripCursor(mapConfig, map);
    updateTripCraphStatusBar(mapConfig);
    drawTripGraph(mapConfig);
  }
}

function addTripGraphMouseListeners(mapConfig, map, tripGraph) {
  tripGraph.onmousemove = function(event) {
    if (mapConfig.tripGraph.player.state == "stop") {
      processTripGraphEvent(mapConfig, map, event);
    }
  };

  tripGraph.onmouseover = function() {
    if (mapConfig.cursor)  {
      mapConfig.cursor.setMap(null);
    }
  };

  tripGraph.onmouseout = function() {
    if (mapConfig.tripGraph.player.state == "stop") {
      stopTrip(mapConfig, map);
    }
  };

  tripGraph.onclick = function(event) {
    if (mapConfig.tripGraph.player.state != "stop") {
      processTripGraphEvent(mapConfig, map, event);
    }
    map.setOptions({center: mapConfig.tripGraph.tripCursor[0].getPosition(),
                    zoom: mapConfig.zoomToPointZoomLevel});
  };

  tripGraph.ondblclick = function(event) {
    //map.returnToSavedPosition();
    // tbd
  };
}

function updateTripCursor(mapConfig, map) {
  var tripData = mapConfig.tripGraph.tripData;
  var vertexTime = mapConfig.tripGraph.lastRatio * tripData.gpsDurationSeconds;
  var vertexIndex = getTripGraphVertexIndex(vertexTime, tripData);
  var marker = getTripGraphMarker(tripData.polyline, vertexIndex);

  if (mapConfig.tripGraph.tripCursor.length >
      mapConfig.tripGraph.maxTripCursorLength) {
    mapConfig.tripGraph.tripCursor.pop().setMap(null);
  }

  mapConfig.tripGraph.tripCursor.unshift(marker);

  marker.setMap(map);

  if (mapConfig.tripGraph.player.state == "play") {
    //if (map.getBounds().containsLatLng(marker.getPosition()) == false) {
    //  map.panTo(marker.getPosition());
    //}
    // tbd
  }
}

function removeTripCursor(mapConfig, map) {
  while (mapConfig.tripGraph.tripCursor.length > 0) {
    mapConfig.tripGraph.tripCursor.pop().setMap(null);
  }
}

function getTripGraphVertexIndex(vertexTime, tripData) {
  var timeFromStart = 0;

  for (var i = 0; i < tripData.vertexTimes.length; i++) {
    timeFromStart += new Number(tripData.vertexTimes[i]);
    if (timeFromStart > vertexTime) {
      return i;
    }
  }

  return -1;
}

function getTripGraphMarker(polyline, vertexIndex) {
  var p1 = polyline.getPath().getAt(vertexIndex);
  var p2 = polyline.getPath().getAt(vertexIndex + 1);
  var direction = getLineDirection(p1, p2);
  var marker = getDirectionMarker(p1, direction);

  return marker;
}

function updateTripCraphStatusBar(mapConfig) {
  var type = mapConfig.tripGraph.types[0];
  var tripData = mapConfig.tripGraph.tripData;
  var ratio = mapConfig.tripGraph.lastRatio;
  var value = tripData.graphData[Math.floor(ratio * tripData.graphData.length)];
  var unit = mapConfig.tripGraph.unit;
  var time = getTimeString(ratio * tripData.gpsDurationSeconds);
  var yScale = 1 / mapConfig.tripGraph.yUnitToPixelRatio;
  var xScale =
    Math.round(tripData.gpsDurationSeconds / tripData.graphData.length);
  var latLng = mapConfig.tripGraph.tripCursor[0].getPosition();
  latLng = Math.round(latLng.lat() * 10000)/10000 + " / " +
           Math.round(latLng.lng() * 10000)/10000;

  var statusHtml = type + "=" + value + " " + unit + ", time=" + time +
    " (1 y pixel = " + yScale + " " + unit + ", 1 x pixel = " + xScale +
    " s), Lat/Lng=" + latLng;

  setStatusBarHtml(statusHtml);
}

function getTimeString(seconds) {
  var date = new Date(Math.round(seconds) * 1000);
  var timeString = date.toUTCString();
  timeString = timeString.substr(17, 8); /* Thu, 01 Jan 1970 04:32:54 GMT */

  return timeString; /* 04:32:54 */
}

function _toggleTripGraphType() {
  toggleTripGraphType(gMapConfig, gMap);
}

function toggleTripGraphType(mapConfig, map) {
  mapConfig.tripGraph.types.reverse();
  addTripGraph(mapConfig, map, mapConfig.tripGraph.tripData);
}

function setTripGraphControl(mapConfig) {
  var play = "<a title='Start trip playing' " +
             "href='javascript:_controlTripPlayer(\"play\")'>Play</a>";
  var pause = "<a title='Pause trip playing' " +
              "href='javascript:_controlTripPlayer(\"pause\")'>Pause</a>";
  var stop = "<a title='Stop trip playing' " +
             "href='javascript:_controlTripPlayer(\"stop\")'>Stop</a>";
  var slower1x = "<a title='Slower (-1x)' " +
                 "href='javascript:_controlTripPlayer(\"slower1x\")'><</a>";
  var faster1x = "<a title='Faster (+1x)' " +
                 "href='javascript:_controlTripPlayer(\"faster1x\")'>></a>";
  var slower10x = "<a title='Slower (-10x)' " +
                  "href='javascript:_controlTripPlayer(\"slower10x\")'><</a>";
  var faster10x = "<a title='Faster (+10x)' " +
                  "href='javascript:_controlTripPlayer(\"faster10x\")'>></a>";

  var speed = " " + mapConfig.tripGraph.player.speed + "x ";
  var speedControl = slower10x + slower1x + speed + faster1x + faster10x;
  var html = "";

  if (mapConfig.tripGraph.player.state == "stop") {
    html = play + " | Stop  | <<" + speed + ">>";
  } else if (mapConfig.tripGraph.player.state == "play") {
    html = pause + " | " + stop + " | " + speedControl;
  } else if (mapConfig.tripGraph.player.state == "pause") {
    html = play + " | " + stop + " | " + speedControl;
  }

  html += " / <a title='Toggle type of trip graph' " +
    "href='javascript:_toggleTripGraphType()'>Show " + mapConfig.tripGraph.types[1] + "</a>";

  document.getElementById("trip_graph_control").innerHTML = html;
}

function _controlTripPlayer(controlType) {
  controlTripPlayer(gMapConfig, gMap, controlType);
}

function controlTripPlayer(mapConfig, map, controlType) {
  if (controlType == "play") {
    if (mapConfig.tripGraph.player.state == "stop") {
      mapConfig.tripGraph.lastRatio = 0;
    }
    mapConfig.tripGraph.player.state = "play";
    setTripGraphControl(mapConfig);
  } else if (controlType == "pause") {
    mapConfig.tripGraph.player.state = "pause";
    setTripGraphControl(mapConfig);
  } else if (controlType == "stop") {
    stopTrip(mapConfig, map);
  } else if (controlType == "slower10x") {
    mapConfig.tripGraph.player.speed -= 10;
    setTripGraphControl(mapConfig);
  } else if (controlType == "slower1x") {
    mapConfig.tripGraph.player.speed -= 1;
    setTripGraphControl(mapConfig);
  } else if (controlType == "faster1x") {
    mapConfig.tripGraph.player.speed += 1;
    setTripGraphControl(mapConfig);
  } else if (controlType == "faster10x") {
    mapConfig.tripGraph.player.speed += 10;
    setTripGraphControl(mapConfig);
  }
}

function processTripGraphTick(mapConfig, map) {
  if (mapConfig.tripGraph.player.state == "play") {
    var player = mapConfig.tripGraph.player;
    var tripData = mapConfig.tripGraph.tripData;
    var intervalMs = mapConfig.tripGraph.tickIntervalMs;
    var ratioIncrement =
      ((intervalMs / 1000) * player.speed) / tripData.gpsDurationSeconds;

    mapConfig.tripGraph.lastRatio += ratioIncrement;

    if (mapConfig.tripGraph.lastRatio < 1) {
      updateTripCursor(mapConfig, map);
      updateTripCraphStatusBar(mapConfig);
      drawTripGraph(mapConfig);
    } else {
      stopTrip(mapConfig, map);
    }
  } else {
    if (mapConfig.tripGraph.tripCursor.length > 1) {
      mapConfig.tripGraph.tripCursor.pop().setMap(null);
    }
  }
}

function stopTrip(mapConfig, map) {
  mapConfig.tripGraph.player.state = "stop";
  mapConfig.tripGraph.lastRatio = 0;
  removeTripCursor(mapConfig, map);
  drawTripGraph(mapConfig);
  setTripGraphControl(mapConfig);
}

function drawTripGraph(mapConfig) {
  var canvas = document.getElementById('tripGraphCanvas');

  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

  drawXAxis(mapConfig, canvas);
  drawYAxis(mapConfig, canvas);
  drawGraph(mapConfig, canvas);
  drawGraphCursor(mapConfig, canvas);
}

function drawGraph(mapConfig, canvas) {
  var tripData = mapConfig.tripGraph.tripData;
  var origo = mapConfig.tripGraph.origo;
  var ctx = canvas.getContext('2d');
  var gradient = ctx.createLinearGradient(origo.x, 0, origo.x, origo.y);
  gradient.addColorStop(0, "#000000");
  gradient.addColorStop(1, tripData.color);

  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.moveTo(origo.x, origo.y);

  for (var x = 0; x < tripData.graphData.length; x++) {
    var y = mapConfig.tripGraph.yUnitToPixelRatio * tripData.graphData[x];
    ctx.lineTo(origo.x + x, origo.y - y);
  }

  ctx.lineTo(canvas.width, origo.y);
  ctx.fill();
}

function drawGraphCursor(mapConfig, canvas) {
  var origo = mapConfig.tripGraph.origo;
  var x = origo.x + mapConfig.tripGraph.lastRatio * (canvas.width - origo.x);
  var ctx = canvas.getContext('2d');

  if (mapConfig.tripGraph.lastRatio > 0) {
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(x, origo.y);
    ctx.lineTo(x, origo.y - canvas.height);
    ctx.stroke();
  }
}

function drawXAxis(mapConfig, canvas) {
  var tripData = mapConfig.tripGraph.tripData;
  var origo = mapConfig.tripGraph.origo;
  var ctx = canvas.getContext('2d');

  /* line */
  ctx.beginPath();
  ctx.strokeStyle = "#000000";
  ctx.moveTo(origo.x, origo.y);
  ctx.lineTo(canvas.width, origo.y);
  ctx.stroke();

  /* scale */
  var steps = tripData.gpsDurationSeconds / 3600;
  var xStep = (canvas.width - origo.x) / steps;
  for (var i = 1; i <= Math.floor(steps); i++) {
    var x = origo.x + (xStep * i);
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(x, origo.y - 3);
    ctx.lineTo(x, origo.y + 3);
    ctx.stroke();
  }
}

function drawYAxis(mapConfig, canvas) {
  var tripData = mapConfig.tripGraph.tripData;
  var origo = mapConfig.tripGraph.origo;
  var ctx = canvas.getContext('2d');

  /* line */
  ctx.beginPath();
  ctx.strokeStyle = "#000000";
  ctx.moveTo(origo.x, origo.y);
  ctx.lineTo(origo.x, origo.y - canvas.height);
  ctx.stroke();

  /* scale */
  var steps = origo.y / (mapConfig.tripGraph.yUnitToPixelRatio *
                         mapConfig.tripGraph.yUnitsPerScaleLine);
  var yStep = origo.y / steps
  for (var i = 1; i <= Math.floor(steps); i++) {
    var y = origo.y - (yStep * i);
    ctx.beginPath();
    ctx.strokeStyle = "#C0C0C0";
    ctx.moveTo(origo.x, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function resizeArray(originalArray, newArray, newSize) {
  if (newSize < originalArray.length) {
    downsampleArray(originalArray, newArray, newSize);
  } else {
    for (var x = 0; x < newSize; x++) {
      var newX = Math.floor((x / newSize) * originalArray.length);
      newArray.push(originalArray[newX]);
    }
  }
}

function downsampleArray(originalArray, newArray, newSize) {
  var xRatio = Math.round(originalArray.length / newSize);
  var middleX = 0;
  var lowX = 0;
  var highX = 0;
  var newY = 0;

  for (var x = 0; x < newSize; x++) {
    middleX = Math.round((x / newSize) * originalArray.length);
    lowX = Math.round(middleX - (xRatio / 2));
    highX = Math.round(middleX + (xRatio / 2));
    newY = 0;

    if ((lowX > 0) && (highX < originalArray.length)) {
      for (var i = 0; i < xRatio; i++) {
        newY += originalArray[lowX + i];
      }
      newY = newY / xRatio;
    } else {
      newY = originalArray[middleX];
    }

    newY = Math.round(newY);
    newArray.push(newY);
  }
}

function addHideTripGraph(mapConfig) {
  var tripGraphHide = document.getElementById("tripGraphHide")

  if (tripGraphHide == null) {
    tripGraphHide = document.createElement("div");
    tripGraphHide.id = "tripGraphHide";
    tripGraphHide.className = "tripGraphHide";
    document.getElementById("map_canvas").appendChild(tripGraphHide);
  }

  tripGraphHide.style.top =
    document.getElementById("map_canvas").clientHeight + "px";

  tripGraphHide.innerHTML =
    "<a title='Hide trip graph' href='javascript:_hideTripGraph()'>" +
    '<img class="hideTripGraph" src="' + mapConfig.closeImgUrl + '"></a>';
}

function _hideTripGraph() {
  hideTripGraph(gMapConfig, gMap);
}

function hideTripGraph(mapConfig, map) {
  if (mapConfig.tripGraph.visibility == "visible") {
    mapConfig.tripGraph.visibility = "hidden";
    stopTrip(mapConfig, map);

    document.getElementById("trip_graph").innerHTML = "";
    document.getElementById("trip_graph_control").innerHTML = "";
    document.getElementById("tripGraphHide").innerHTML = "";

    _resizeMap();
  }
}
