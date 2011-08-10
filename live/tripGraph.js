/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-10 */

function TripGraph(master) {
  var that = this; /* http://javascript.crockford.com/private.html */
  var config = getConfig();

  function getConfig() {
    var c = {};

    c.visibility = "hidden";
    c.height = 100;
    c.origo = {x:5, y:95};
    c.types = ["Speed", "Altitude"];
    c.lastRatio = 0;
    c.tripCursor = [];
    c.maxTripCursorLength = 10;
    c.tickIntervalMs = 200;
    c.player = {state:"stop", speed:50};
    c.lastDirection = 0;
    c.unit = "";
    c.yUnitsPerScaleLine = 0;
    c.yUnitToPixelRatio = 0;
    c.tripData = null;

    return c;
  }

  this.addTripGraph = function(tripData) {
    var tripGraph = document.getElementById("trip_graph");
    tripGraph.innerHTML = '<canvas id="tripGraphCanvas" width="' +
      tripGraph.clientWidth + '" height="' + config.height + '"></canvas>';

    var canvas = document.getElementById('tripGraphCanvas');

    if (canvas && canvas.getContext) {
      setTripGraphConfig(tripData, canvas);
      addTripGraphMouseListeners(tripGraph);
      setTripGraphControl();
      drawTripGraph();
      resizeDivs(master.gm);
      addHideTripGraph();
    }
  }

  function setTripGraphConfig(tripData, canvas) {
    var originalGpsData;

    config.tripData = tripData;
    config.visibility = "visible";

    if (typeof(config.tickInterval) == "undefined") {
      var intervalMs = config.tickIntervalMs;
      config.tickInterval =
        window.setInterval(function() {processTripGraphTick();}, intervalMs);
    }

    if (config.types[0] == "Speed") {
      config.unit = "km/h";
      originalGpsData = tripData.gpsSpeedData;
      config.yUnitsPerScaleLine = 10;
      config.yUnitToPixelRatio = 2;
    } else {
      config.unit = "m";
      originalGpsData = tripData.gpsAltitudeData;
      config.yUnitsPerScaleLine = 20;
      var maxAltitude = config.tripData.gpsMaxAltitude.value;
      var height = config.origo.y;
      config.yUnitToPixelRatio = 1 / (1 + Math.floor(maxAltitude / height));
    }

    tripData.graphData = [];
    resizeArray(originalGpsData, config.tripData.graphData,
                canvas.width - config.origo.x);
  }

  function processTripGraphEvent(event) {
    var origo = config.origo;
    var canvas = document.getElementById('tripGraphCanvas');
    if ((event.clientX > origo.x) && (event.clientX < canvas.width)) {
      config.lastRatio = (event.clientX - origo.x) / (canvas.width - origo.x);
      updateTripCursor();
      updateTripCraphStatusBar();
      drawTripGraph();
    }
  }

  function addTripGraphMouseListeners(tripGraph) {
    tripGraph.onmousemove = function(event) {
      if (config.player.state == "stop") {
        processTripGraphEvent(event);
      }
    };

    tripGraph.onmouseout = function() {
      if (config.player.state == "stop") {
        stopTrip();
      }
    };

    tripGraph.onclick = function(event) {
      var position = config.tripCursor[0].getPosition();
      if (config.player.state != "stop") {
        processTripGraphEvent(event);
      }
      setCenter(master.gm, position, master.zoomToPointZoomLevel);
      updateStreetView(master, master.gm, position);
    };

    tripGraph.ondblclick = function(event) {
      setCenter(master.gm, master.initialLatLng, master.initialZL);
    };
  }

  function updateTripCursor() {
    var tripData = config.tripData;
    var vertexTime = config.lastRatio * tripData.gpsDurationSeconds;
    var vertexIndex = getTripGraphVertexIndex(vertexTime, tripData);
    var marker = getTripGraphMarker(tripData.polyline, vertexIndex);

    if (config.tripCursor.length > config.maxTripCursorLength) {
      config.tripCursor.pop().setMap(null);
    }

    config.tripCursor.unshift(marker);

    marker.setMap(master.gm);

    if (config.player.state == "play") {
      updateStreetView(master, master.gm, marker.getPosition());

      if (master.gm.getBounds().contains(marker.getPosition()) == false) {
        master.gm.panTo(marker.getPosition());
      }
    }
  }

  function removeTripCursor() {
    while (config.tripCursor.length > 0) {
      config.tripCursor.pop().setMap(null);
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

    config.lastDirection = master.trips.getLineDirection360(p1, p2);

    var direction = master.trips.getLineDirection120(config.lastDirection);
    var marker = master.trips.getDirectionMarker(p1, direction);

    return marker;
  }

  function updateTripCraphStatusBar() {
    var type = config.types[0];
    var tripData = config.tripData;
    var ratio = config.lastRatio;
    var value = tripData.graphData[Math.floor(ratio * tripData.graphData.length)];
    var unit = config.unit;
    var time = getTimeString(ratio * tripData.gpsDurationSeconds);
    var yScale = 1 / config.yUnitToPixelRatio;
    var xScale =
      Math.round(tripData.gpsDurationSeconds / tripData.graphData.length);
    var latLng = config.tripCursor[0].getPosition();
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

  function toggleTripGraphType() {
    config.types.reverse();
    that.addTripGraph(config.tripData);
  }

  function setTripGraphControl() {
    var play = createControl("Start trip playing", "Play", getHandler("play"));
    var pause = createControl("Pause trip playing", "Pause", getHandler("pause"));
    var stop = createControl("Stop trip playing", "Stop", getHandler("stop"));
    var slower1x = createControl("Slower (-1x)", "<", getHandler("slower1x"));
    var faster1x = createControl("Faster (-1x)", ">", getHandler("faster1x"));
    var slower10x = createControl("Slower (-10x)", "<", getHandler("slower10x"));
    var faster10x = createControl("Faster (+10x)", ">", getHandler("faster10x"));

    var speed = " " + config.player.speed + "x ";
    var speedElements =
      [slower10x, slower1x, createTN(speed), faster1x, faster10x];
    var allElements;

    if (config.player.state == "stop") {
      allElements = [play, createTN(" | Stop  | <<" + speed + ">>")];
    } else if (config.player.state == "play") {
      allElements = [pause, createTN(" | "), stop, createTN(" | ")];
      allElements = allElements.concat(speedElements);
    } else if (config.player.state == "pause") {
      allElements = [play, createTN(" | "), stop, createTN(" | ")];
      allElements = allElements.concat(speedElements);
    }

    allElements.push(createTN(" / "));
    allElements.push(createControl("Toggle type of trip graph",
                       "Show " + config.types[1],
                       function () {toggleTripGraphType()}));

    document.getElementById("trip_graph_control").innerHTML = "";

    for (var i = 0; i < allElements.length; i++) {
      document.getElementById("trip_graph_control").appendChild(allElements[i]);
    }

    function getHandler(controlType) {
      return function() {controlTripPlayer(controlType)};
    }

    function createTN(text) {
      return document.createTextNode(text);
    }

    function createControl(title, text, handler) {
      return master.utils.createControlElement(title, text, handler);
    }
  }

  function controlTripPlayer(controlType) {
    if (controlType == "play") {
      if (config.player.state == "stop") {
        config.lastRatio = 0;
      }
      config.player.state = "play";
      setTripGraphControl();
    } else if (controlType == "pause") {
      config.player.state = "pause";
      setTripGraphControl();
    } else if (controlType == "stop") {
      stopTrip();
    } else if (controlType == "slower10x") {
      config.player.speed -= 10;
      setTripGraphControl();
    } else if (controlType == "slower1x") {
      config.player.speed -= 1;
      setTripGraphControl();
    } else if (controlType == "faster1x") {
      config.player.speed += 1;
      setTripGraphControl();
    } else if (controlType == "faster10x") {
      config.player.speed += 10;
      setTripGraphControl();
    }
  }

  function processTripGraphTick() {
    if (config.player.state == "play") {
      var player = config.player;
      var tripData = config.tripData;
      var intervalMs = config.tickIntervalMs;
      var ratioIncrement =
        ((intervalMs / 1000) * player.speed) / tripData.gpsDurationSeconds;

      config.lastRatio += ratioIncrement;

      if (config.lastRatio < 1) {
        updateTripCursor();
        updateTripCraphStatusBar();
        drawTripGraph();
      } else {
        stopTrip();
      }
    } else {
      if (config.tripCursor.length > 1) {
        config.tripCursor.pop().setMap(null);
      }
    }
  }

  function stopTrip() {
    config.player.state = "stop";
    config.lastRatio = 0;
    removeTripCursor();
    drawTripGraph();
    setTripGraphControl();
  }

  function drawTripGraph() {
    var canvas = document.getElementById('tripGraphCanvas');

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    drawXAxis(canvas);
    drawYAxis(canvas);
    drawGraph(canvas);
    drawGraphCursor(canvas);
  }

  function drawGraph(canvas) {
    var tripData = config.tripData;
    var origo = config.origo;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createLinearGradient(origo.x, 0, origo.x, origo.y);
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(1, tripData.color);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.moveTo(origo.x, origo.y);

    for (var x = 0; x < tripData.graphData.length; x++) {
      var y = config.yUnitToPixelRatio * tripData.graphData[x];
      ctx.lineTo(origo.x + x, origo.y - y);
    }

    ctx.lineTo(canvas.width, origo.y);
    ctx.fill();
  }

  function drawGraphCursor(canvas) {
    var origo = config.origo;
    var x = origo.x + config.lastRatio * (canvas.width - origo.x);
    var ctx = canvas.getContext('2d');

    if (config.lastRatio > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#000000";
      ctx.moveTo(x, origo.y);
      ctx.lineTo(x, origo.y - canvas.height);
      ctx.stroke();
    }
  }

  function drawXAxis(canvas) {
    var tripData = config.tripData;
    var origo = config.origo;
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

  function drawYAxis(canvas) {
    var tripData = config.tripData;
    var origo = config.origo;
    var ctx = canvas.getContext('2d');

    /* line */
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(origo.x, origo.y);
    ctx.lineTo(origo.x, origo.y - canvas.height);
    ctx.stroke();

    /* scale */
    var steps =
      origo.y / (config.yUnitToPixelRatio * config.yUnitsPerScaleLine);
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

  function addHideTripGraph() {
    var tripGraphHide = document.getElementById("tripGraphHide");

    if (tripGraphHide == null) {
      tripGraphHide = document.createElement("div");
      tripGraphHide.id = "tripGraphHide";
      tripGraphHide.className = "tripGraphHide";
      tripGraphHide.title = "Hide trip graph";
      tripGraphHide.onclick = function () {that.hideTripGraph()};
      document.getElementById("dynamic_divs").appendChild(tripGraphHide);
    }

    tripGraphHide.style.top = document.getElementById("trip_graph").style.top;
    tripGraphHide.innerHTML =
      '<img class="hideTripGraph" src="' + master.closeImgUrl + '">';
  }

  this.hideTripGraph = function() {
    if (config.visibility == "visible") {
      config.visibility = "hidden";
      stopTrip();

      document.getElementById("trip_graph").innerHTML = "";
      document.getElementById("trip_graph_control").innerHTML = "";
      document.getElementById("tripGraphHide").innerHTML = "";

      resizeMap(master);
    }
  }

  this.isVisible = function() {
    return (config.visibility == "visible");
  }

  this.isPlayerStopped = function() {
    return (config.player.state == "stop");
  }

  this.isCurrentData = function(tripData) {
    return (config.tripData == tripData);
  }

  this.getLastDirection = function() {
    return config.lastDirection;
  }

  this.resize = function() {
    that.addTripGraph(config.tripData);
  }
}
