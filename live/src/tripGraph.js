/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-14 */

function TripGraph(master) {
    var that = this; /* http://javascript.crockford.com/private.html */
    var state = getState();

    function getState() {
        var s = {};

        s.visibility = "hidden";
        s.height = 100;
        s.origo = {x:5, y:95};
        s.types = ["Speed", "Altitude"];
        s.lastRatio = 0;
        s.tripCursor = [];
        s.maxTripCursorLength = 10;
        s.tickIntervalMs = 200;
        s.player = {state:"stop", speed:50};
        s.unit = "";
        s.yUnitsPerScaleLine = 0;
        s.yUnitToPixelRatio = 0;
        s.tripData = null;

        return s;
    }

    this.show = function (tripData) {
        var tripGraph = document.getElementById("trip_graph");
        tripGraph.innerHTML = '<canvas id="tripGraphCanvas" width="' +
            tripGraph.clientWidth + '" height="' + state.height + '"></canvas>';

        var canvas = document.getElementById('tripGraphCanvas');

        if (canvas && canvas.getContext) {
            setTripGraphState(tripData, canvas);
            addMouseListeners(tripGraph);
            setTripGraphControl();
            drawTripGraph();
            master.map.resizeDivs();
            showHideElement();
        }
    }

    function setTripGraphState(tripData, canvas) {
        var originalGpsData;

        state.tripData = tripData;
        state.visibility = "visible";

        if (typeof(state.tickInterval) == "undefined") {
            var intervalMs = state.tickIntervalMs;
            state.tickInterval =
                window.setInterval(function () {processTripGraphTick();}, intervalMs);
        }

        if (state.types[0] == "Speed") {
            state.unit = "km/h";
            originalGpsData = tripData.gpsSpeedData;
            state.yUnitsPerScaleLine = 10;
            state.yUnitToPixelRatio = 2;
        } else {
            state.unit = "m";
            originalGpsData = tripData.gpsAltitudeData;
            state.yUnitsPerScaleLine = 20;
            var maxAltitude = state.tripData.gpsMaxAltitude.value;
            var height = state.origo.y;
            state.yUnitToPixelRatio = 1 / (1 + Math.floor(maxAltitude / height));
        }

        tripData.graphData = [];
        master.utils.resizeArray(originalGpsData, state.tripData.graphData,
                                                         canvas.width - state.origo.x);
    }

    function processTripGraphEvent(event) {
        var origo = state.origo;
        var canvas = document.getElementById('tripGraphCanvas');
        if ((event.clientX > origo.x) && (event.clientX < canvas.width)) {
            state.lastRatio = (event.clientX - origo.x) / (canvas.width - origo.x);
            updateTripCursor();
            updateTripCraphStatusBar();
            drawTripGraph();
        }
    }

    function addMouseListeners(tripGraph) {
        tripGraph.onmousemove = function (event) {
            if (state.player.state == "stop") {
                processTripGraphEvent(event);
            }
        };

        tripGraph.onmouseout = function () {
            if (state.player.state == "stop") {
                stopTrip();
            }
        };

        tripGraph.onclick = function (event) {
            var position = state.tripCursor[0].getPosition();
            if (state.player.state != "stop") {
                processTripGraphEvent(event);
            }
            master.map.zoomToPoint(position);
            var heading = master.utils.getHeading(position, state.tripData.polyline,
                                                                                        master.gm.getZoom());
            master.map.updateStreetView(position, heading);
        };

        tripGraph.ondblclick = function (event) {
            master.map.resetLocationAndZoom();
        };
    }

    function updateTripCursor() {
        var tripData = state.tripData;
        var vertexTime = state.lastRatio * tripData.gpsDurationSeconds;
        var vertexIndex = getTripGraphVertexIndex(vertexTime, tripData);
        var point = tripData.polyline.getPath().getAt(vertexIndex);
        var heading = master.utils.getHeading(point, tripData.polyline,
                                                                                    master.gm.getZoom());
        var marker = master.utils.createDirectionMarker(point, heading);

        if (state.tripCursor.length > state.maxTripCursorLength) {
            state.tripCursor.pop().setMap(null);
        }

        state.tripCursor.unshift(marker);

        marker.setMap(master.gm);

        if (state.player.state == "play") {
            master.map.updateStreetView(marker.getPosition(), heading);

            if (master.gm.getBounds().contains(marker.getPosition()) == false) {
                master.gm.panTo(marker.getPosition());
            }
        }
    }

    function removeTripCursor() {
        while (state.tripCursor.length > 0) {
            state.tripCursor.pop().setMap(null);
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

    function updateTripCraphStatusBar() {
        var type = state.types[0];
        var tripData = state.tripData;
        var ratio = state.lastRatio;
        var value =
            tripData.graphData[Math.floor(ratio * tripData.graphData.length)];
        var unit = state.unit;
        var time = master.utils.getTimeString(ratio * tripData.gpsDurationSeconds);
        var yScale = 1 / state.yUnitToPixelRatio;
        var xScale =
            Math.round(tripData.gpsDurationSeconds / tripData.graphData.length);
        var latLng =
            state.tripCursor[0].getPosition().toUrlValue(4).replace(",", " / ");

        var statusHtml = type + "=" + value + " " + unit + ", time=" + time +
            " (1 y pixel = " + yScale + " " + unit + ", 1 x pixel = " + xScale +
            " s), Lat/Lng=" + latLng;

        master.map.setStatusBarHtml(statusHtml);
    }

    function toggleTripGraphType() {
        state.types.reverse();
        that.show(state.tripData);
    }

    function setTripGraphControl() {
        var play = getControl("Start trip playing", "Play", getHandler("play"));
        var pause = getControl("Pause trip playing", "Pause", getHandler("pause"));
        var stop = getControl("Stop trip playing", "Stop", getHandler("stop"));
        var slower1x = getControl("Slower (-1x)", "<", getHandler("slower1x"));
        var faster1x = getControl("Faster (+1x)", ">", getHandler("faster1x"));
        var slower10x = getControl("Slower (-10x)", "<", getHandler("slower10x"));
        var faster10x = getControl("Faster (+10x)", ">", getHandler("faster10x"));

        var speed = " " + state.player.speed + "x ";
        var speedElements =
            [slower10x, slower1x, createTN(speed), faster1x, faster10x];
        var allElements;

        if (state.player.state == "stop") {
            allElements = [play, createTN(" | Stop  | <<" + speed + ">>")];
        } else if (state.player.state == "play") {
            allElements = [pause, createTN(" | "), stop, createTN(" | ")];
            allElements = allElements.concat(speedElements);
        } else if (state.player.state == "pause") {
            allElements = [play, createTN(" | "), stop, createTN(" | ")];
            allElements = allElements.concat(speedElements);
        }

        allElements.push(createTN(" / "));
        allElements.push(getControl("Toggle type of trip graph",
                                             "Show " + state.types[1],
                                             function () {toggleTripGraphType()}));

        document.getElementById("trip_graph_control").innerHTML = "";

        for (var i = 0; i < allElements.length; i++) {
            document.getElementById("trip_graph_control").appendChild(allElements[i]);
        }

        function getHandler(controlType) {
            return function () {controlTripPlayer(controlType)};
        }

        function createTN(text) {
            return document.createTextNode(text);
        }

        function getControl(title, text, handler) {
            return master.utils.createControlElement(title, text, handler);
        }
    }

    function controlTripPlayer(controlType) {
        if (controlType == "play") {
            if (state.player.state == "stop") {
                state.lastRatio = 0;
            }
            state.player.state = "play";
            setTripGraphControl();
        } else if (controlType == "pause") {
            state.player.state = "pause";
            setTripGraphControl();
        } else if (controlType == "stop") {
            stopTrip();
        } else if (controlType == "slower10x") {
            state.player.speed -= 10;
            setTripGraphControl();
        } else if (controlType == "slower1x") {
            state.player.speed -= 1;
            setTripGraphControl();
        } else if (controlType == "faster1x") {
            state.player.speed += 1;
            setTripGraphControl();
        } else if (controlType == "faster10x") {
            state.player.speed += 10;
            setTripGraphControl();
        }
    }

    function processTripGraphTick() {
        if (state.player.state == "play") {
            var player = state.player;
            var tripData = state.tripData;
            var intervalMs = state.tickIntervalMs;
            var ratioIncrement =
                ((intervalMs / 1000) * player.speed) / tripData.gpsDurationSeconds;

            state.lastRatio += ratioIncrement;

            if (state.lastRatio < 1) {
                updateTripCursor();
                updateTripCraphStatusBar();
                drawTripGraph();
            } else {
                stopTrip();
            }
        } else {
            if (state.tripCursor.length > 1) {
                state.tripCursor.pop().setMap(null);
            }
        }
    }

    function stopTrip() {
        state.player.state = "stop";
        state.lastRatio = 0;
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
        var tripData = state.tripData;
        var origo = state.origo;
        var ctx = canvas.getContext('2d');
        var gradient = ctx.createLinearGradient(origo.x, 0, origo.x, origo.y);
        gradient.addColorStop(0, "#000000");
        gradient.addColorStop(1, tripData.color);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.moveTo(origo.x, origo.y);

        for (var x = 0; x < tripData.graphData.length; x++) {
            var y = state.yUnitToPixelRatio * tripData.graphData[x];
            ctx.lineTo(origo.x + x, origo.y - y);
        }

        ctx.lineTo(canvas.width, origo.y);
        ctx.fill();
    }

    function drawGraphCursor(canvas) {
        var origo = state.origo;
        var x = origo.x + state.lastRatio * (canvas.width - origo.x);
        var ctx = canvas.getContext('2d');

        if (state.lastRatio > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#000000";
            ctx.moveTo(x, origo.y);
            ctx.lineTo(x, origo.y - canvas.height);
            ctx.stroke();
        }
    }

    function drawXAxis(canvas) {
        var tripData = state.tripData;
        var origo = state.origo;
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
        var tripData = state.tripData;
        var origo = state.origo;
        var ctx = canvas.getContext('2d');

        /* line */
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        ctx.moveTo(origo.x, origo.y);
        ctx.lineTo(origo.x, origo.y - canvas.height);
        ctx.stroke();

        /* scale */
        var steps =
            origo.y / (state.yUnitToPixelRatio * state.yUnitsPerScaleLine);
        var yStep = origo.y / steps;
        for (var i = 1; i <= Math.floor(steps); i++) {
            var y = origo.y - (yStep * i);
            ctx.beginPath();
            ctx.strokeStyle = "#C0C0C0";
            ctx.moveTo(origo.x, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function showHideElement() {
        var tripGraphHide = document.getElementById("tripGraphHide");

        if (tripGraphHide == null) {
            tripGraphHide = document.createElement("div");
            tripGraphHide.id = "tripGraphHide";
            tripGraphHide.className = "tripGraphHide";
            tripGraphHide.title = "Hide trip graph";
            tripGraphHide.onclick = function () {that.hide()};
            document.getElementById("dynamic_divs").appendChild(tripGraphHide);
        }

        tripGraphHide.style.top = document.getElementById("trip_graph").style.top;
        tripGraphHide.appendChild(master.utils.createHideElement("hideTripGraph"));
    }

    this.hide = function () {
        if (state.visibility == "visible") {
            state.visibility = "hidden";
            stopTrip();

            document.getElementById("trip_graph").innerHTML = "";
            document.getElementById("trip_graph_control").innerHTML = "";
            document.getElementById("tripGraphHide").innerHTML = "";

            master.map.resizeMap();
        }
    }

    this.isVisible = function () {
        return (state.visibility == "visible");
    }

    this.isPlayerStopped = function () {
        return (state.player.state == "stop");
    }

    this.isCurrentData = function (tripData) {
        return (state.tripData == tripData);
    }

    this.resize = function () {
        that.show(state.tripData);
    }
}
