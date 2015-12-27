/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2015-05-03 */

function Trips(master) {
    var that = this; /* http://javascript.crockford.com/private.html */
    var state = getState();

    function getState() {
        var s = {};

        s.filenames = {tripsDatas:["tripsData2015.xml",
                                                             "tripsData2014.xml", "tripsData2013.xml",
                                                             "tripsData2012.xml", "tripsData2011.xml",
                                                             "tripsData2010.xml", "tripsData2009.xml"]};
        s.isTableShown = false;
        s.visitedDataIndex = -1;
        s.numberOfVisibleTrips = 0;
        s.directionMarkers = [];
        s.areMarkersVisible = false;
        s.fileIndex = 0;
        s.data = [];
        s.selectedTripIndex = -1;

        return s;
    }

    this.init = function () {
        var tripsControl = document.createElement("div");
        tripsControl.id = "tripsControl";
        tripsControl.className = "tripsControl";
        document.getElementById("dynamic_divs").appendChild(tripsControl);

        var tripsTableHide = document.createElement("div");
        tripsTableHide.id = "tripsTableHide";
        tripsTableHide.title = "Hide trips table";
        tripsTableHide.onclick = function () {
            state.isTableShown = false;
            that.showControl();
            setTableHideVisibility("hidden");
        };
        document.getElementById("dynamic_divs").appendChild(tripsTableHide);

        that.showControl();

        initDragAndDrop();
    }

    function initDragAndDrop() {
        var dropArea = document.getElementById("map_canvas");
        dropArea.addEventListener("dragenter", dragenter, false);
        dropArea.addEventListener("dragover", dragover, false);
        dropArea.addEventListener("drop", drop, false);

        function dragenter(e) {
            e.stopPropagation();
            e.preventDefault();
        }

        function dragover(e) {
            e.stopPropagation();
            e.preventDefault();
        }

        function drop(e) {
            e.stopPropagation();
            e.preventDefault();

            if (e.dataTransfer.files.length == 1) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    addDroppedTrip(e.target.result);
                };
                reader.readAsText(e.dataTransfer.files[0]);
            } else {
                alert("Please drop only one file at a time.");
            }
        }

        function addDroppedTrip(gpxFile) {
            var xml = master.utils.parseXml(gpxFile);
            var points = xml.documentElement.getElementsByTagName("trkpt");
            var tripPath = [];

            for (var i = 0; i < points.length; i++) {
                var lat = points[i].getAttribute("lat");
                var lng = points[i].getAttribute("lon");
                tripPath.push(new google.maps.LatLng(lat, lng));
            }

            var tripLength = google.maps.geometry.spherical.computeLength(tripPath);
            console.info("trip length (m): " + Math.round(tripLength));

            var tripPolyline = new google.maps.Polyline({
                path: tripPath,
                strokeColor: "#000000",
                strokeOpacity: 0.9,
                strokeWeight: 3
            });

            master.areas.setVisitedAreaOpacityToLow();
            tripPolyline.setMap(master.gm);
        }
    }

    function setVisibilityOfAllTrips(visibility) {
        setVisibilityOfTripsByYear(visibility, "all");
    }

    function setVisibilityOfTripsByYear(visibility, year) {
        if (typeof(state.data) == "undefined") {
            return;
        }

        for (var i = state.data.length - 1; i >= 0; i--) {
            if (state.data[i].visibility != visibility) {
                if ((year == "all") || (year == state.data[i].date.substr(0, 4))) {
                    toggleTripVisibility(i);
                }
            }
        }

        that.showControl();
    }

    function toggleMaxMarkersVisibility() {
        state.areMarkersVisible = !(state.areMarkersVisible);
        var isVisible = state.areMarkersVisible;

        for (var i = 0; i < state.data.length; i++) {
            if (state.data[i].gpsMaxSpeed.marker) {
                state.data[i].gpsMaxSpeed.marker.setVisible(isVisible);
                state.data[i].gpsMaxAltitude.marker.setVisible(isVisible);
            }
        }

        that.showControl();
    }

    this.showControl = function () {
        var tripsControl = document.getElementById("tripsControl");

        if (state.isTableShown) {
            if (state.filenames.tripsDatas.length == state.fileIndex) {
                setTableHideVisibility("visible");
                if (document.getElementById("tripsTable")) {
                    tripsControl.replaceChild(getTableHeaderElement(state.data),
                                                                        document.getElementById("tripsSummary"));
                    updateTable(state.data);
                } else {
                    tripsControl.innerHTML = "";
                    tripsControl.appendChild(getTableHeaderElement(state.data));
                    tripsControl.appendChild(getTableElement(state.data));
                }
                resizeTable();
            } else {
                var text = "Loading " + (1 + state.fileIndex) + "/" +
                                     state.filenames.tripsDatas.length;
                tripsControl.innerHTML = "";
                var e = document.createElement("div");
                e.className = "tripsTable";
                e.appendChild(document.createTextNode(text));
                tripsControl.appendChild(e);
                setDataToState();
            }
        } else {
            var e = document.createElement("div");
            e.className = "showTripsTable";
            e.title = "Show trips";
            e.onclick = function () {
                state.isTableShown = true;
                that.showControl();
            };
            e.textContent = "Trips";
            tripsControl.innerHTML = "";
            tripsControl.appendChild(e);
        }
    }

    function resizeTable() {
        var tripsTable = document.getElementById("tripsTableDiv");
        var mapDiv = document.getElementById("map_canvas");
        var streetViewDiv = document.getElementById("street_view");
        var availableHeight = mapDiv.clientHeight + streetViewDiv.clientHeight;
        tripsTable.style.height = Math.round(availableHeight * 0.64) + "px";
        tripsTable.style.width = getWidth(Math.round(mapDiv.clientWidth * 0.68));

        function getWidth(width) {
            if (tripsTable.scrollWidth > width) {
                return width + "px";
            } else {
                return "auto";
            }
        }
    }

    function setTableHideVisibility(visibility) {
        var tripsTableHide = document.getElementById("tripsTableHide");

        if (visibility == "visible") {
            var hideElement = master.utils.createHideElement("hideTripsTable");
            tripsTableHide.appendChild(hideElement);
        } else {
            tripsTableHide.innerHTML = "";
        }
    }

    function setDataToState() {
        var file = state.filenames.tripsDatas[state.fileIndex++];

        master.utils.downloadUrl(file, function (data, responseCode) {
            var xml = master.utils.parseXml(data);
            var rawTripsData = xml.documentElement.getElementsByTagName("data");
            var tripsDataString = "";

            for (var i = 0; i < rawTripsData[0].childNodes.length; i++) {
                tripsDataString += rawTripsData[0].childNodes[i].nodeValue;
            }

            var tripsData = JSON.parse(tripsDataString);

            for (var i = 0; i < tripsData.length; i++) {
                tripsData[i].vertexTimes = runLengthDecode(
                    arrayToStringDecode(tripsData[i].encodedVertexTimes));
                tripsData[i].gpsSpeedData =
                    arrayToStringDecode(tripsData[i].encodedGpsSpeedData);
                tripsData[i].gpsAltitudeData =
                    arrayToStringDecode(tripsData[i].encodedGpsAltitudeData);
                tripsData[i].gpsMaxSpeed.location =
                    new google.maps.LatLng(tripsData[i].gpsMaxSpeed.location.y,
                                                                 tripsData[i].gpsMaxSpeed.location.x)
                tripsData[i].gpsMaxAltitude.location =
                    new google.maps.LatLng(tripsData[i].gpsMaxAltitude.location.y,
                                                                 tripsData[i].gpsMaxAltitude.location.x)
            }

            state.data = state.data.concat(tripsData);

            that.showControl();
        });
    }

    function runLengthDecode(encodedArray) {
        var decodedArray = [];

        for (var i = 0; i < encodedArray.length; i += 2) {
            for (var j = 0; j < encodedArray[i]; j++) {
                decodedArray.push(encodedArray[i + 1]);
            }
        }

        return decodedArray;
    }

    function arrayToStringDecode(encodedString) {
        var string = decodeURI(encodedString);
        var decodedArray = [];
        var offsetValue = string.charCodeAt(0);
        var scale = string.charCodeAt(1) - offsetValue;

        for (var i = 2; i < string.length; i++) {
            decodedArray.push((string.charCodeAt(i) - offsetValue) * scale);
        }

        return decodedArray;
    }

    function getTableHeaderElement(tripsData) {
        var allElements = [];
        var headerElement = document.createElement("div");
        headerElement.id = "tripsSummary";
        headerElement.className = "tripsSummary";

        allElements.push(createTN("Loaded " + tripsData.length + " trips. "));

        if (state.numberOfVisibleTrips == tripsData.length) {
            allElements.push(createTN("Show All"));
        } else {
            allElements.push(createControl("Show all trips", "Show All",
                                                 function () {setVisibilityOfAllTrips("visible")}));
        }

        allElements.push(createTN(" | "));

        if (state.numberOfVisibleTrips == 0) {
            allElements.push(createTN("Hide All"));
        } else {
            allElements.push(createControl("Hide all trips", "Hide All",
                                                 function () {setVisibilityOfAllTrips("hidden")}));
        }

        if (state.numberOfVisibleTrips > 0) {
            allElements.push(createTN(" | "));

            if (state.areMarkersVisible) {
                allElements.push(createControl("Hide all trips markers", "Hide Markers",
                                                     function () {toggleMaxMarkersVisibility()}));
            } else {
                allElements.push(createControl("Show all trips markers", "Show Markers",
                                                     function () {toggleMaxMarkersVisibility()}));
            }
        }

        for (var i = 0; i < allElements.length; i++) {
            headerElement.appendChild(allElements[i]);
        }

        return headerElement;

        function createTN(text) {
            return document.createTextNode(text);
        }

        function createControl(title, text, handler) {
            return master.utils.createControlElement(title, text, handler);
        }
    }

    function getTableElement(tripsData) {
        var tableDiv = document.createElement("div");
        tableDiv.id = "tripsTableDiv";
        tableDiv.className = "tripsTable";
        var tableElement = document.createElement("table");
        tableElement.id = "tripsTable";
        tableElement.className = "trips";

        var row = tableElement.insertRow(-1);

        addCellWithSpansToRow("Commands", 2, 3, row);
        addCellWithSpansToRow("Trip name", 1, 3, row);
        addCellWithSpansToRow("Date", 1, 2, row);
        addCellWithSpansToRow("GPS data", 4, 1, row);
        addCellWithSpansToRow("Cycle Computer data", 4, 1, row);

        row = tableElement.insertRow(-1);

        addCellsToRow(["Duration", "Distance", "Max speed", "Max altitude",
                                     "Duration", "Distance", "Max speed", "Avg speed"],
                                     row, "th");

        row = tableElement.insertRow(-1);

        addCellsToRow(["yyyy-mm-dd", "hh:mm:ss", "km", "km/h", "m", "hh:mm:ss",
                                     "km", "km/h", "km/h"], row, "th");

        for (var i = 0; i < tripsData.length; i++) {
            row = tableElement.insertRow(-1);
            createTripRow(tripsData[i], i, row);
        }

        tableDiv.appendChild(tableElement);

        return tableDiv;

        function addCellWithSpansToRow(t, colSpan, rowSpan, r) {
            var c = document.createElement("th");
            c.colSpan = colSpan;
            c.rowSpan = rowSpan;
            c.appendChild(document.createTextNode(t));
            r.appendChild(c);
        }
    }

    function addCellsToRow(cells, r, thOrTd) {
        for (var i = 0; i < cells.length; i++) {
            var c = document.createElement(thOrTd);
            if (typeof cells[i] == "object") {
                c.appendChild(cells[i]);
            } else {
                c.appendChild(document.createTextNode(cells[i]));
            }
            r.appendChild(c);
        }
    }

    function createTripRow(tripsData, i, row) {
        addCellsToRow([
            getVisibilityCommandElement(tripsData, i),
            getVisitedDataCommandElement(i),
            tripsData.name,
            tripsData.date,
            tripsData.gpsDuration,
            tripsData.gpsDistance,
            formatSpeed(tripsData.gpsMaxSpeed.value),
            tripsData.gpsMaxAltitude.value,
            tripsData.ccDuration,
            tripsData.ccDistance,
            tripsData.ccMaxSpeed,
            tripsData.ccAvgSpeed], row, "td");

        if ((master.tripGraph.isVisible()) && (i == state.selectedTripIndex)) {
            row.className = "selectedTrip";
        } else {
            row.className = "";
        }

        function formatSpeed(v) {
            return (v + ".0").substr(0, 4); /* returns 45.0 for 45 */
        }
    }

    function updateTable(tripsData) {
        var tripsTable = document.getElementById("tripsTable");
        var rows = tripsTable.rows;

        for (var i = 0, tripI = 0; i < rows.length; i++) {
            if (rows[i].firstChild.nodeName == "TD") {
                tripsTable.deleteRow(i);
                var newRow = tripsTable.insertRow(i);
                createTripRow(tripsData[tripI], tripI, newRow);
                tripI += 1;
            }
        }
    }

    function getVisibilityCommandElement(tripsData, tripIndex) {
        var title = "Toggle trip visibility";
        var text = (tripsData.visibility == "hidden") ? "Show" : "Hide";
        var handler = function () {
            toggleTripVisibility(tripIndex);
            that.showControl();
        };
        var e = master.utils.createControlElement(title, text, handler);
        e.style.color = ((text == "Hide") ? tripsData.encodedPolyline.color : "");

        return e;
    }

    function getVisitedDataCommandElement(tripIndex) {
        var filename = state.data[tripIndex].visitedDataFilename;

        if (filename.charAt(filename.length - 1) == "-") {
            return document.createTextNode("");
        }

        if (state.visitedDataIndex == tripIndex) {
            var text = "Unset";
            var title = "Set visited data to latest";
            var handler = function () {
                state.visitedDataIndex = -1;
                master.areas.changeVisitedData("latest");
            };
        } else {
            var text = "Set";
            var title = "Set visited data as before this trip";
            var handler = function () {
                state.visitedDataIndex = tripIndex;
                master.areas.setVisitedData(state.data[tripIndex].visitedDataFilename);
            };
        }

        return master.utils.createControlElement(title, text, handler);
    }

    function createPolyline(encodedPolyline) {
        var path = google.maps.geometry.encoding.decodePath(encodedPolyline.points);

        return new google.maps.Polyline({
            path: path,
            strokeColor: encodedPolyline.color,
            strokeWeight: encodedPolyline.weight,
            strokeOpacity: encodedPolyline.opacity,
            clickable: true,
            zIndex: 10
        });
    }

    function toggleTripVisibility(tripIndex) {
        var tripData = state.data[tripIndex];

        if (typeof(tripData.polyline) == "undefined") {
            tripData.polyline = createPolyline(tripData.encodedPolyline);

            google.maps.event.addListener(tripData.polyline, "click",
                                                                        function (mouseEvent) {
                if (master.tripGraph.isCurrentData(tripData)) {
                    addDirectionMarker(mouseEvent.latLng, tripData.polyline);
                }
                master.tripGraph.show(tripData);
                state.selectedTripIndex = tripIndex;
                that.showControl();
            });

            tripData.gpsMaxSpeed.marker = getMaxMarker(tripData.polyline,
                tripData.gpsMaxSpeed.location, state.areMarkersVisible,
                "S", "Max speed: " + tripData.gpsMaxSpeed.value + " km/h");
            tripData.gpsMaxAltitude.marker = getMaxMarker(tripData.polyline,
                tripData.gpsMaxAltitude.location, state.areMarkersVisible,
                "A", "Max altitude: " + tripData.gpsMaxAltitude.value + " m");
        }

        if (tripData.visibility == "hidden") {
            tripData.visibility = "visible";
            state.numberOfVisibleTrips += 1;
            master.areas.setVisitedAreaOpacityToLow();
            tripData.polyline.setMap(master.gm);
            tripData.gpsMaxSpeed.marker.setMap(master.gm);
            tripData.gpsMaxAltitude.marker.setMap(master.gm);
            master.tripGraph.show(tripData);
            state.selectedTripIndex = tripIndex;
        } else {
            tripData.visibility = "hidden";
            state.numberOfVisibleTrips -= 1;
            if (state.numberOfVisibleTrips == 0) {
                master.areas.setVisitedAreaOpacityToHigh();
            }
            tripData.polyline.setMap(null);
            tripData.gpsMaxSpeed.marker.setMap(null);
            tripData.gpsMaxAltitude.marker.setMap(null);
            removeDirectionMarkers();
            master.tripGraph.hide();
            state.selectedTripIndex = -1;
        }
    }

    function addDirectionMarker(point, polyline) {
        /* modified from: http://econym.org.uk/gmap/arrows.htm */
        var heading = master.utils.getHeading(point, polyline, master.gm.getZoom());

        if (heading != -1) {
            var marker = master.utils.createDirectionMarker(point, heading);
            google.maps.event.addListener(marker, "click", function (event) {
                marker.setMap(null);
            });
            marker.setMap(master.gm);
            state.directionMarkers.push(marker);
        }
    }

    function removeDirectionMarkers() {
        for (var i = 0; i < state.directionMarkers.length; i++) {
            state.directionMarkers[i].setMap(null);
        }
    }

    function getMaxMarker(polyline, point, isVisible, letter, title) {
        var image = "http://www.google.com/mapfiles/marker" + letter + ".png";
        var marker = new google.maps.Marker({
            visible: isVisible, position: point, icon: image, title: title
        });
        google.maps.event.addListener(marker, "click", function (event) {
            master.map.zoomToPoint(marker.getPosition());
            var heading = master.utils.getHeading(marker.getPosition(), polyline,
                                                                                        master.gm.getZoom());
            master.map.updateStreetView(marker.getPosition(), heading);
        });

        return marker;
    }

    this.getMenuItems = function () {
        var menuItems = [];

        if (state.isTableShown == false) {
            menuItems.push("Open table");
        }

        if (state.data.length > 0) {
            if (state.numberOfVisibleTrips != state.data.length) {
                menuItems.push("Show...");
            }
            if (state.numberOfVisibleTrips > 0) {
                menuItems.push("Hide...");
                if (state.areMarkersVisible) {
                    menuItems.push("Hide markers");
                } else {
                    menuItems.push("Show markers");
                }
            }
        }

        return menuItems;
    }

    this.getShowMenuItems = function () {
        var menuItems = [];

        addYearMenuItems(menuItems, "visible")

        if (state.numberOfVisibleTrips != state.data.length) {
            menuItems.push("all");
        }

        return menuItems;
    }

    this.getHideMenuItems = function () {
        var menuItems = [];

        addYearMenuItems(menuItems, "hidden")

        if (state.numberOfVisibleTrips > 0) {
            menuItems.push("all");
        }

        return menuItems;
    }

    function addYearMenuItems(menuItems, visibility) {
        var years = []

        for (var i = 0; i < state.data.length; i++) {
            if (state.data[i].visibility != visibility) {
                var year = state.data[i].date.substr(0, 4)
                if (years.indexOf(year) == -1) {
                    years.push(year)
                }
            }
        }

        years.reverse()

        for (var i = 0; i < years.length; i++) {
            menuItems.push("year " + years[i]);
        }
    }

    this.processMenuCommand = function (menuItem, command) {
        var visibility = {"Show...":"visible", "Hide...":"hidden"}[menuItem]

        if (command == "Open table") {
            state.isTableShown = true;
            that.showControl();
        } else if (/year \d\d\d\d/.test(command)) {
            setVisibilityOfTripsByYear(visibility, command.substr(5, 4))
        } else if (command == "all") {
            setVisibilityOfAllTrips(visibility);
        } else if ((command == "Hide markers") || (command == "Show markers")) {
            toggleMaxMarkersVisibility();
        }
    }
}
