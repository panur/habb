/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2009-10-04 */

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
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  var width = canvas.width;
  var xRatio = Math.round(tripData.gpsSpeedData.length / width);

  for (var x = 0; x < width; x++) {
    var dX = Math.round((x / width) * tripData.gpsSpeedData.length);
    var y = 0;
    if (((dX - xRatio / 2) > 0) && ((dX + xRatio / 2) < tripData.gpsSpeedData.length)) {
    //if (0) {
      for (var i = Math.round(0 - xRatio / 2); i < xRatio / 2; i++) {
        y += tripData.gpsSpeedData[dX + i];
      }
      y = Math.round(y / xRatio);
    } else {
      y = tripData.gpsSpeedData[dX];
    }
    ctx.lineTo(x, 100 - (2 * y));
    //ctx.lineTo(x, 100 - (2 * tripData.gpsSpeedData[dX]));
  }
  ctx.stroke();
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
