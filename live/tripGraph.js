/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-10-17 */

function addTripGraph(mapConfig, map, tripData) {
  var tripGraph = document.getElementById("trip_graph");
  tripGraph.innerHTML = '<canvas id="tripGraphCanvas" width="' +
    tripGraph.clientWidth + '" height="' + mapConfig.tripGraph.height +
    '"></canvas>';

  var canvas = document.getElementById('tripGraphCanvas');

  if (canvas && canvas.getContext) {
    mapConfig.tripGraph.tripData = tripData;
    mapConfig.tripGraph.visibility = "visible";

    addTripGraphMouseListeners(mapConfig, map, tripGraph);
    drawTripGraph(mapConfig, tripData);
    resizeMapCanvas(map);
    addHideTripGraph(mapConfig);
  }
}

function addTripGraphMouseListeners(mapConfig, map, tripGraph) {
  tripGraph.onmousemove = function(event) {
    var origo = mapConfig.tripGraph.origo;
    var canvas = document.getElementById('tripGraphCanvas');
    if ((event.clientX > origo.x) && (event.clientX < canvas.width)) {
      var ratio = (event.clientX - origo.x) / (canvas.width - origo.x);
      addTripGraphMarker(mapConfig, map, ratio);
      updateTripCraphStatusBar(mapConfig, ratio);
    }
  };

  tripGraph.onmouseover = function() {
    if (mapConfig.cursor)  {
      map.removeOverlay(mapConfig.cursor);
    }
  };

  tripGraph.onmouseout = function() {
    if (mapConfig.tripGraph.marker) {
      map.removeOverlay(mapConfig.tripGraph.marker);
    }
  };

  tripGraph.onclick = function(event) {
    map.setCenter(mapConfig.tripGraph.marker.getLatLng(),
                  mapConfig.zoomToPointZoomLevel);
  };
}

function addTripGraphMarker(mapConfig, map, ratio) {
  var tripData = mapConfig.tripGraph.tripData;
  var markerTime = ratio * tripData.gpsDurationSeconds;
  var vertexIndex = getTripGraphMarkerVertexIndex(markerTime, tripData);
  var marker = getTripGraphMarker(tripData.polyline, vertexIndex);

  if (mapConfig.tripGraph.marker) {
    map.removeOverlay(mapConfig.tripGraph.marker);
  }

  mapConfig.tripGraph.marker = marker;

  map.addOverlay(marker);
}

function getTripGraphMarkerVertexIndex(markerTime, tripData) {
  var timeFromStart = 0;

  for (var i = 0; i < tripData.vertexTimes.length - 1; i++) {
    timeFromStart += new Number(tripData.vertexTimes[i]);
    if (timeFromStart > markerTime) {
      return i;
    }
  }

  return -1;
}

function getTripGraphMarker(polyline, vertexIndex) {
  var p1 = polyline.getVertex(vertexIndex);
  var p2 = polyline.getVertex(vertexIndex + 1);
  var direction = getLineDirection(p1, p2);
  var marker = new GMarker(p1, getDirectionIcon(direction));

  return marker;
}

function updateTripCraphStatusBar(mapConfig, ratio) {
  var tripData = mapConfig.tripGraph.tripData;
  var speed = tripData.speedData[Math.round(ratio * tripData.speedData.length)];
  var time = getTimeString(ratio * tripData.gpsDurationSeconds);
  var yScale = 1 / mapConfig.tripGraph.speedToPixelRadio;
  var xScale =
    Math.round(tripData.gpsDurationSeconds / tripData.speedData.length);
  var latLng = mapConfig.tripGraph.marker.getLatLng();
  latLng = Math.round(latLng.lat() * 10000)/10000 + " / " +
           Math.round(latLng.lng() * 10000)/10000;

  var statusText = "Speed=" + speed + " km/h, time=" + time +
    " (1 y pixel = " + yScale + " km/h, 1 x pixel = " + xScale +
    " s), Lat/Lng=" + latLng;

  setStatusBarText(statusText);
}

function getTimeString(seconds) {
  var date = new Date(Math.round(seconds) * 1000);
  var timeString = date.toUTCString();
  timeString = timeString.substr(17, 8); /* Thu, 01 Jan 1970 04:32:54 GMT */

  return timeString; /* 04:32:54 */
}

function drawTripGraph(mapConfig, tripData) {
  var canvas = document.getElementById('tripGraphCanvas');

  drawXAxis(mapConfig, tripData, canvas);
  drawYAxis(mapConfig, tripData, canvas);
  drawSpeedGraph(mapConfig, tripData, canvas);
}

function drawSpeedGraph(mapConfig, tripData, canvas) {
  var origo = mapConfig.tripGraph.origo;
  var ctx = canvas.getContext('2d');

  tripData.speedData = [];
  resizeArray(tripData.gpsSpeedData, tripData.speedData,
              canvas.width - origo.x);

  var gradient = ctx.createLinearGradient(origo.x, 0, origo.x, origo.y);
  gradient.addColorStop(0, "#000000");
  gradient.addColorStop(1, tripData.color);

  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.moveTo(origo.x, origo.y);

  for (var x = 0; x < tripData.speedData.length; x++) {
    var y = mapConfig.tripGraph.speedToPixelRadio * tripData.speedData[x];
    ctx.lineTo(origo.x + x, origo.y - y);
  }

  ctx.lineTo(canvas.width, origo.y);
  ctx.fill();
}

function drawXAxis(mapConfig, tripData, canvas) {
  var origo = mapConfig.tripGraph.origo;
  var ctx = canvas.getContext('2d');

  /* line */
  ctx.beginPath();
  ctx.strokeStyle = "#000000";
  ctx.moveTo(origo.x, origo.y);
  ctx.lineTo(canvas.width, origo.y);
  ctx.stroke();

  /* scale */
  var steps = new Number(tripData.gpsDuration.substr(0, 2)) +
              (new Number(tripData.gpsDuration.substr(3, 2)) / 60);
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

function drawYAxis(mapConfig, tripData, canvas) {
  var origo = mapConfig.tripGraph.origo;
  var ctx = canvas.getContext('2d');

  /* line */
  ctx.beginPath();
  ctx.strokeStyle = "#000000";
  ctx.moveTo(origo.x, origo.y);
  ctx.lineTo(origo.x, origo.y - canvas.height);
  ctx.stroke();

  /* scale */
  var steps = origo.y / (mapConfig.tripGraph.speedToPixelRadio * 10);
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

  tripGraphHide.innerHTML = "<a href='javascript:_hideTripGraph()'>" +
    '<img class="hideTripGraph" src="' + mapConfig.closeImgUrl + '"></a>';
}

function _hideTripGraph() {
  hideTripGraph(gMapConfig);
}

function hideTripGraph(mapConfig) {
  if (mapConfig.tripGraph.visibility == "visible") {
    mapConfig.tripGraph.visibility = "hidden";

    document.getElementById("trip_graph").innerHTML = "";
    document.getElementById("tripGraphHide").innerHTML = "";

    _resizeMap();
  }
}
