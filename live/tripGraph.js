/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-10-10 */

function addTripGraph(mapConfig, map, tripData) {
  mapConfig.tripGrap.tripData = tripData;
  mapConfig.tripGrap.visibility = "visible";

  var tripGraph = document.getElementById("trip_graph");
  tripGraph.innerHTML = '<canvas id="tripGraphCanvas" width="' +
    tripGraph.clientWidth + '" height="' + mapConfig.tripGrap.height +
    '"></canvas>';

  var canvas = document.getElementById('tripGraphCanvas');

  if (canvas && canvas.getContext) {
    drawTripGraph(mapConfig, map, tripData);
    resizeMapCanvas();
    addHideTripGraph(mapConfig);
  }
}

function drawTripGraph(mapConfig, map, tripData) {
  var canvas = document.getElementById('tripGraphCanvas');
  var speedData = [];
  resizeArray(tripData.gpsSpeedData, speedData, canvas.width);

  var ctx = canvas.getContext('2d');
  ctx.beginPath();

  for (var x = 0; x < speedData.length; x++) {
    ctx.lineTo(x, 100 - (2 * speedData[x]));
  }

  ctx.stroke();
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
