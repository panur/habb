/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-10-11 */

function addTripGraph(mapConfig, map, tripData) {
  mapConfig.tripGrap.tripData = tripData;
  mapConfig.tripGrap.visibility = "visible";

  var tripGraph = document.getElementById("trip_graph");
  tripGraph.innerHTML = '<canvas id="tripGraphCanvas" width="' +
    tripGraph.clientWidth + '" height="' + mapConfig.tripGrap.height +
    '"></canvas>';

  var canvas = document.getElementById('tripGraphCanvas');

  if (canvas && canvas.getContext) {
    drawTripGraph(mapConfig, tripData);
    resizeMapCanvas();
    addHideTripGraph(mapConfig);
  }
}

function drawTripGraph(mapConfig, tripData) {
  var canvas = document.getElementById('tripGraphCanvas');

  drawSpeedGraph(mapConfig, tripData, canvas);
  drawXAxis(mapConfig, tripData, canvas);
  drawYAxis(mapConfig, tripData, canvas);
}

function drawSpeedGraph(mapConfig, tripData, canvas) {
  var origo = mapConfig.tripGrap.origo;
  var ctx = canvas.getContext('2d');

  var speedData = [];
  resizeArray(tripData.gpsSpeedData, speedData, canvas.width - origo.x);

  var gradient = ctx.createLinearGradient(origo.x, 0, origo.x, origo.y);
  gradient.addColorStop(0, "#000000");
  gradient.addColorStop(1, tripData.color);

  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.moveTo(origo.x, origo.y);

  for (var x = 0; x < speedData.length; x++) {
    ctx.lineTo(origo.x + x,
               origo.y - (mapConfig.tripGrap.speedToPixelRadio * speedData[x]));
  }

  ctx.lineTo(canvas.width, origo.y);
  ctx.fill();
}

function drawXAxis(mapConfig, tripData, canvas) {
  var origo = mapConfig.tripGrap.origo;
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
  for (var i = 1; i <= Math.floor(steps); i++) {
    var x = ((canvas.width - origo.x) / steps) * i;
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(x, origo.y - 3);
    ctx.lineTo(x, origo.y + 3);
    ctx.stroke();
  }
}

function drawYAxis(mapConfig, tripData, canvas) {
  var origo = mapConfig.tripGrap.origo;
  var ctx = canvas.getContext('2d');

  /* line */
  ctx.beginPath();
  ctx.strokeStyle = "#000000";
  ctx.moveTo(origo.x, origo.y);
  ctx.lineTo(origo.x, origo.y - canvas.height);
  ctx.stroke();

  /* scale */
  var steps = origo.y / (mapConfig.tripGrap.speedToPixelRadio * 10);
  for (var i = 1; i <= Math.floor(steps); i++) {
    var y = (origo.y / steps) * i;
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(origo.x - 3, y);
    ctx.lineTo(origo.x + 3, y);
    ctx.stroke();
  }
}

function resizeArray(originalArray, newArray, newSize) {
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
  mapConfig.tripGrap.visibility = "hidden";

  document.getElementById("trip_graph").innerHTML = "";
  document.getElementById("tripGraphHide").innerHTML = "";

  _resizeMap();
}
