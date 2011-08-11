/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-11 */

function Trips(master) {
  var that = this; /* http://javascript.crockford.com/private.html */
  var config = getConfig();

  function getConfig() {
    var c = {};

    c.filenames = {tripsDatas:["tripsData2011.xml", "tripsData2010.xml",
                               "tripsData2009.xml"]};
    c.isTableShown = false;
    c.visitedDataIndex = -1;
    c.numberOfVisibleTrips = 0;
    c.directionMarkers = [];
    c.areMarkersVisible = true;
    c.fileIndex = 0;
    c.data = [];
    c.selectedTripIndex = -1;

    return c;
  }

  function addTripsControl() {
    var tripsControl = document.createElement("div");
    tripsControl.id = "tripsControl";
    tripsControl.className = "tripsControl";
    document.getElementById("dynamic_divs").appendChild(tripsControl);

    var tripsTableHide = document.createElement("div");
    tripsTableHide.id = "tripsTableHide";
    tripsTableHide.title = "Hide trips table";
    tripsTableHide.onclick = function () {
      config.isTableShown = false;
      that.showTripsControl();
      setTripsTableHideVisibility("hidden");
    };
    document.getElementById("dynamic_divs").appendChild(tripsTableHide);

    that.showTripsControl();
  }

  function setVisibilityOfAllTrips(visibility) {
    if (typeof(config.data) == "undefined") {
      return;
    }

    for (var i = config.data.length - 1; i >= 0; i--) {
      if (config.data[i].visibility != visibility) {
        toggleTripVisibility(i);
      }
    }

    that.showTripsControl();
  }

  function toggleTripMarkersVisibility() {
    config.areMarkersVisible = !(config.areMarkersVisible);
    var isVisible = config.areMarkersVisible;

    for (var i = 0; i < config.data.length; i++) {
      if (config.data[i].gpsMaxSpeed.marker) {
        config.data[i].gpsMaxSpeed.marker.setVisible(isVisible);
        config.data[i].gpsMaxAltitude.marker.setVisible(isVisible);
      }
    }

    that.showTripsControl();
  }

  this.showTripsControl = function() {
    var tripsControl = document.getElementById("tripsControl");
    tripsControl.innerHTML = "";

    if (config.isTableShown) {
      if (config.filenames.tripsDatas.length == config.fileIndex) {
        setTripsTableHideVisibility("visible");
        tripsControl.appendChild(getTripsSummaryElement(config.data));
        tripsControl.appendChild(getTripsTableElement(config.data));
        resizeTripsTable();
      } else {
        var text = "Loading " + (1 + config.fileIndex) + "/" +
                   config.filenames.tripsDatas.length;
        tripsControl.appendChild(document.createTextNode(text));
        setTripsData();
      }
    } else {
      var e = document.createElement("div");
      e.className = "showTripsTable";
      e.title = "Show trips";
      e.onclick = function() {
        config.isTableShown = true;
        that.showTripsControl();
      };
      e.textContent = "Trips";
      tripsControl.appendChild(e);
    }
  }

  function resizeTripsTable() {
    var tripsTable = document.getElementById("tripsTable");
    var mapDiv = document.getElementById("map_canvas");
    var streetViewDiv = document.getElementById("street_view");
    var availableHeight = mapDiv.clientHeight + streetViewDiv.clientHeight;
    tripsTable.style.height = Math.round(availableHeight * 0.64) + "px";
    tripsTable.style.width = Math.round(mapDiv.clientWidth * 0.68) + "px";
  }

  function setTripsTableHideVisibility(visibility) {
    var tripsTableHide = document.getElementById("tripsTableHide");

    if (visibility == "visible") {
      var hideElement = master.utils.createHideElement("hideTripsTable");
      tripsTableHide.appendChild(hideElement);
    } else {
      tripsTableHide.innerHTML = "";
    }
  }

  function setTripsData() {
    var file = config.filenames.tripsDatas[config.fileIndex++];

    master.utils.downloadUrl(file, function(data, responseCode) {
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
          mapLatLngFromV2ToV3(tripsData[i].gpsMaxSpeed.location);
        tripsData[i].gpsMaxAltitude.location =
          mapLatLngFromV2ToV3(tripsData[i].gpsMaxAltitude.location);
      }

      config.data = config.data.concat(tripsData);

      that.showTripsControl();
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

  function mapLatLngFromV2ToV3(latLngV2) {
    return new google.maps.LatLng(latLngV2.y, latLngV2.x);
  }

  function getTripsSummaryElement(tripsData) {
    var allElements = [];
    var summaryElement = document.createElement("div");
    summaryElement.className = "tripsSummary";

    allElements.push(createTN("Loaded " + tripsData.length + " trips. "));

    if (config.numberOfVisibleTrips == tripsData.length) {
      allElements.push(createTN("Show All"));
    } else {
      allElements.push(createControl("Show all trips", "Show All",
                         function() {setVisibilityOfAllTrips("visible")}));
    }

    allElements.push(createTN(" | "));

    if (config.numberOfVisibleTrips == 0) {
      allElements.push(createTN("Hide All"));
    } else {
      allElements.push(createControl("Hide all trips", "Hide All",
                         function() {setVisibilityOfAllTrips("hidden")}));
    }

    if (config.numberOfVisibleTrips > 0) {
      allElements.push(createTN(" | "));

      if (config.areMarkersVisible) {
        allElements.push(createControl("Hide all trips markers", "Hide Markers",
                           function() {toggleTripMarkersVisibility()}));
      } else {
        allElements.push(createControl("Show all trips markers", "Show Markers",
                           function() {toggleTripMarkersVisibility()}));
      }
    }

    for (var i = 0; i < allElements.length; i++) {
      summaryElement.appendChild(allElements[i]);
    }

    return summaryElement;

    function createTN(text) {
      return document.createTextNode(text);
    }

    function createControl(title, text, handler) {
      return master.utils.createControlElement(title, text, handler);
    }
  }

  function getTripsTableElement(tripsData) {
    var tableDiv = document.createElement("div");
    tableDiv.id = "tripsTable";
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
                   "Duration", "Distance", "Max speed", "Avg speed"], row, "th");

    row = tableElement.insertRow(-1);

    addCellsToRow(["yyyy-mm-dd", "hh:mm:ss", "km", "km/h", "m", "hh:mm:ss", "km",
                   "km/h", "km/h"], row, "th");

    for (var i = 0; i < tripsData.length; i++) {
      row = tableElement.insertRow(-1);
      if (i == config.selectedTripIndex) {
        row.className = "selectedTrip";
      } else {
        row.className = "";
      }
      addCellsToRow([
        getVisibilityCommandElement(tripsData[i], i),
        getVisitedDataCommandElement(i),
        tripsData[i].name,
        tripsData[i].date,
        tripsData[i].gpsDuration,
        tripsData[i].gpsDistance,
        tripsData[i].gpsMaxSpeed.value,
        tripsData[i].gpsMaxAltitude.value,
        tripsData[i].ccDuration,
        tripsData[i].ccDistance,
        tripsData[i].ccMaxSpeed,
        tripsData[i].ccAvgSpeed], row, "td");
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
  }

  function getVisibilityCommandElement(tripsData, tripIndex) {
    var title = "Toggle trip visibility";
    var text = (tripsData.visibility == "hidden") ? "Show" : "Hide";
    var handler = function() {
      toggleTripVisibility(tripIndex);
      that.showTripsControl();
    };
    var e = master.utils.createControlElement(title, text, handler);
    e.style.color = ((text == "Hide") ? tripsData.encodedPolyline.color : "");

    return e;
  }

  function getVisitedDataCommandElement(tripIndex) {
    var filename = config.data[tripIndex].visitedDataFilename;

    if (filename.charAt(filename.length - 1) == "-") {
      return document.createTextNode("");
    }

    if (config.visitedDataIndex == tripIndex) {
      var text = "Unset";
      var title = "Set visited data to latest";
      var handler = function() {
        config.visitedDataIndex = -1;
        master.areas.changeVisitedData("latest");
      };
    } else {
      var text = "Set";
      var title = "Set visited data as before this trip";
      var handler = function() {
        config.visitedDataIndex = tripIndex;
        master.areas.setVisitedData(config.data[tripIndex].visitedDataFilename);
      };
    }

    return master.utils.createControlElement(title, text, handler);
  }

  function getTripPolyline(encodedPolyline) {
    var points = decodeLine(encodedPolyline.points);
    var path = [];

    for (var i = 0; i < points.length; i++) {
      path.push(new google.maps.LatLng(points[i][0], points[i][1]));
    }

    return new google.maps.Polyline({
      path: path,
      strokeColor: encodedPolyline.color,
      strokeWeight: encodedPolyline.weight,
      strokeOpacity: encodedPolyline.opacity,
      clickable: true,
      zIndex: 10
    });
  }

  // http://code.google.com/apis/maps/documentation/utilities/include/polyline.js
  // Decode an encoded polyline into a list of lat/lng tuples.
  function decodeLine(encoded) {
    var len = encoded.length;
    var index = 0;
    var array = [];
    var lat = 0;
    var lng = 0;

    while (index < len) {
      var b;
      var shift = 0;
      var result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      array.push([lat * 1e-5, lng * 1e-5]);
    }

    return array;
  }

  function toggleTripVisibility(tripIndex) {
    var tripData = config.data[tripIndex];

    if (typeof(tripData.polyline) == "undefined") {
      tripData.polyline = getTripPolyline(tripData.encodedPolyline);

      google.maps.event.addListener(tripData.polyline, "click",
                                    function(mouseEvent) {
        if (master.tripGraph.isCurrentData(tripData)) {
          addDirectionMarker(mouseEvent.latLng, tripData.polyline);
        }
        master.tripGraph.addTripGraph(tripData);
        config.selectedTripIndex = tripIndex;
        that.showTripsControl();
      });

      tripData.gpsMaxSpeed.marker = getMarker(
        tripData.gpsMaxSpeed.location,
        "S", "Max speed: " + tripData.gpsMaxSpeed.value + " km/h");
      tripData.gpsMaxAltitude.marker = getMarker(
        tripData.gpsMaxAltitude.location,
        "A", "Max altitude: " + tripData.gpsMaxAltitude.value + " m");
    }

    if (tripData.visibility == "hidden") {
      tripData.visibility = "visible";
      config.numberOfVisibleTrips += 1;
      master.areas.setVisitedAreaOpacityToLow();
      tripData.polyline.setMap(master.gm);
      tripData.gpsMaxSpeed.marker.setMap(master.gm);
      tripData.gpsMaxAltitude.marker.setMap(master.gm);
      master.tripGraph.addTripGraph(tripData);
      config.selectedTripIndex = tripIndex;
    } else {
      tripData.visibility = "hidden";
      config.numberOfVisibleTrips -= 1;
      if (config.numberOfVisibleTrips == 0) {
        master.areas.setVisitedAreaOpacityToHigh();
      }
      tripData.polyline.setMap(null);
      tripData.gpsMaxSpeed.marker.setMap(null);
      tripData.gpsMaxAltitude.marker.setMap(null);
      removeDirectionMarkers();
      master.tripGraph.hideTripGraph();
      config.selectedTripIndex = -1;
    }
  }

  function addDirectionMarker(point, polyline) {
    /* modified from: http://econym.org.uk/gmap/arrows.htm */
    var p1;
    var p2;

    for (var i = 0; i < polyline.getPath().length - 1; i++) {
      p1 = polyline.getPath().getAt(i);
      p2 = polyline.getPath().getAt(i + 1);

      if (isPointInLineSegment(point, p1, p2) == true) {
        var direction =
          that.getLineDirection120(that.getLineDirection360(p1, p2));
        var marker = that.getDirectionMarker(point, direction);
        google.maps.event.addListener(marker, "click", function(event) {
          marker.setMap(null);
        });
        marker.setMap(master.gm);
        config.directionMarkers.push(marker);
        break;
      }
    }
  }

  function removeDirectionMarkers() {
    for (var i = 0; i < config.directionMarkers.length; i++) {
      config.directionMarkers[i].setMap(null);
    }
  }

  function isPointInLineSegment(point, p1, p2) {
    var distance = Math.abs(getDistance(point, p1) + getDistance(point, p2) -
                            getDistance(p1, p2));
    var tolerance = 391817 * Math.pow(0.445208, master.gm.getZoom());

    return (distance < tolerance);
  }

  /* based on http://www.movable-type.co.uk/scripts/latlong.html */
  function getDistance(p1, p2) {
    var R = 6378137; /* earth's radius in meters */
    var lat1 = getRadians(p1.lat());
    var lon1 = getRadians(p1.lng());
    var lat2 = getRadians(p2.lat());
    var lon2 = getRadians(p2.lng());
    var dLat = lat2 - lat1;
    var dLon = lon2 - lon1;

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d; /* distance between p1 and p2 in meters */
  }

  this.getLineDirection120 = function(direction360) {
    var direction = direction360;

    while (direction >= 120) {
      direction -= 120;
    }

    return direction;
  }

  this.getLineDirection360 = function(from, to) {
    var direction = getBearing(from, to);

    direction = Math.round(direction / 3) * 3;

    return direction;
  }

  function getBearing(from, to) {
    var lat1 = getRadians(from.lat());
    var lng1 = getRadians(from.lng());
    var lat2 = getRadians(to.lat());
    var lng2 = getRadians(to.lng());
    var y = Math.sin(lng1 - lng2) * Math.cos(lat2);
    var x = (Math.cos(lat1) * Math.sin(lat2)) -
      (Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng1 - lng2));
    var angle = - Math.atan2(y ,x);

    if (angle < 0.0) {
      angle += Math.PI * 2.0;
    }

    angle = angle * (180.0 / Math.PI);
    angle = angle.toFixed(1);

    return angle;
  }

  function getRadians(latOrLng) {
    return latOrLng * Math.PI / 180;
  }

  this.getDirectionMarker = function(point, direction) {
    var image = new google.maps.MarkerImage(
      "http://www.google.com/mapfiles/dir_" + direction + ".png",
      new google.maps.Size(24, 24), /* size */
      new google.maps.Point(0, 0), /* origin */
      new google.maps.Point(12, 12) /* anchor */
    );

    return new google.maps.Marker({
      position: point,
      icon: image
    });
  }

  function getMarker(point, letter, title) {
    var image = "http://www.google.com/mapfiles/marker" + letter + ".png";
    var marker = new google.maps.Marker({
      position: point, icon: image, title: title
    });

    google.maps.event.addListener(marker, "click", function(event) {
      master.map.zoomToPoint(marker.getPosition());
      master.map.updateStreetView(master, marker.getPosition());
    });

    return marker;
  }

  this.init = function() {
    addTripsControl();
  }
}
