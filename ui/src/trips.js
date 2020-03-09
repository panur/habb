/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

'use strict';

function Trips(master) {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};
        s.isTableShown = false;
        s.visitedDataIndex = -1;
        s.numberOfVisibleTrips = 0;
        s.directionMarkers = [];
        s.areMarkersVisible = false;
        s.dataStore = null;
        s.selectedTripIndex = -1;
        s.isUiMapInitReady = false;
        return s;
    }

    this.init = function () {
        state.dataStore = new TripDataStore(master);

        var tripsControl = document.createElement('div');
        tripsControl.id = 'tripsControl';
        tripsControl.className = 'tripsControl';
        master.mapApi.addControlElement(tripsControl, 'topright');

        that.showControl();

        initDragAndDrop();

        master.mapApi.addListener('uiMapInitIsReady', function () {
            state.isUiMapInitReady = true;
            showUrlParamsTrips();
        });
    };

    function initDragAndDrop() {
        var dropArea = document.getElementById('map_canvas');
        dropArea.addEventListener('dragenter', dragenter, false);
        dropArea.addEventListener('dragover', dragover, false);
        dropArea.addEventListener('drop', drop, false);

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

            if (e.dataTransfer.files.length === 1) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    addDroppedTrip(e.target.result);
                };
                reader.readAsText(e.dataTransfer.files[0]);
            } else {
                alert('Please drop only one file at a time.');
            }
        }

        function addDroppedTrip(gpxFile) {
            var xml = master.utils.parseXml(gpxFile);
            var points = xml.documentElement.getElementsByTagName('trkpt');
            var tripPath = [];

            for (var i = 0; i < points.length; i++) {
                var lat = points[i].getAttribute('lat');
                var lng = points[i].getAttribute('lon');
                tripPath.push(master.mapApi.newLatLng(lat, lng));
            }

            var polylineOptions = {
                'color': '#000000',
                'opacity': 0.9,
                'weight': 3
            };
            var tripPolyline = master.mapApi.newPolyline(tripPath, polylineOptions);
            console.info('trip length (m): ' + Math.round(tripPolyline.computeLength()));
            master.areas.setVisitedAreaOpacityToLow();
            master.mapApi.addOrRemoveOverlays(tripPolyline, 'add');
        }
    }

    function showUrlParamsTrips() {
        if (state.isUiMapInitReady && state.dataStore.isIndexLoaded()) {
            var tripsToShowPattern = master.utils.getUrlParams()['t'];
            if (tripsToShowPattern !== undefined) {
                var tripsToShow = [];
                for (var i = 0; i < state.dataStore.getNumberOfTrips(); i++) {
                    var tripData = state.dataStore.getTrip(i);
                    if (tripData.filename.indexOf(tripsToShowPattern) !== -1) {
                        tripsToShow.push(i);
                    }
                }
                showOneUrlParamsTrip(tripsToShow);
            }
        }
    }

    function showOneUrlParamsTrip(tripsToShow) {
        if (tripsToShow.length > 0) {
            var readyEventName = 'singleTripLoaded';
            master.mapApi.addListener(readyEventName, function () {
                master.mapApi.removeListeners(readyEventName);
                toggleTripVisibility(tripsToShow[tripsToShow.length - 1], tripsToShow.length === 1);
                tripsToShow.pop();
                showOneUrlParamsTrip(tripsToShow);
            });
            state.dataStore.loadSingleTrip(tripsToShow[tripsToShow.length - 1], readyEventName);
        }
    }

    function setVisibilityOfAllTrips(visibility) {
        var readyEventName = 'allTripsLoaded';
        master.mapApi.addListener(readyEventName, function () {
            master.mapApi.removeListeners(readyEventName);
            setVisibilityOfTripsByYear(visibility, 'all');
        });
        if (visibility === 'visible') {
            state.dataStore.loadAllTripFiles(readyEventName);
        } else {
            master.mapApi.triggerEvent(readyEventName);
        }
    }

    function setVisibilityOfTripsByYear(visibility, year) {
        var readyEventName = 'yearTripsLoaded';
        master.mapApi.addListener(readyEventName, function () {
            master.mapApi.removeListeners(readyEventName);
            for (var i = state.dataStore.getNumberOfTrips() - 1; i >= 0; i--) {
                var tripData = state.dataStore.getTrip(i);
                if (tripData.visibility !== visibility) {
                    if ((year === 'all') || (year === tripData.date.substr(0, 4))) {
                        toggleTripVisibility(i, false);
                    }
                }
            }

            that.showControl();
        });
        if (visibility === 'visible') {
            state.dataStore.loadYearTripFiles(year, readyEventName);
        } else {
            master.mapApi.triggerEvent(readyEventName);
        }
    }

    function toggleMaxMarkersVisibility() {
        state.areMarkersVisible = !(state.areMarkersVisible);
        var isVisible = state.areMarkersVisible;

        for (var i = 0; i < state.dataStore.getNumberOfTrips(); i++) {
            var tripData = state.dataStore.getTrip(i);
            if (tripData.visibility === "visible") {
                if (tripData.gpsMaxSpeed.marker) {
                    tripData.gpsMaxSpeed.marker.setVisible(isVisible);
                }
                if (tripData.gpsMaxAltitude.marker) {
                    tripData.gpsMaxAltitude.marker.setVisible(isVisible);
                }
            }
        }

        that.showControl();
    }

    this.showControl = function () {
        var elementID = 'tripsControl';
        if (state.dataStore.isIndexLoaded()) {
            var tripsControlElement = document.getElementById(elementID);
            if (tripsControlElement !== null) {
                updateTripsControlElement(tripsControlElement);
            }
        } else {
            var readyEventName = 'indexLoaded';
            master.mapApi.addListener(readyEventName, function () {
                master.mapApi.removeListeners(readyEventName);
                waitForElement(elementID, function () {
                    that.showControl();
                    showUrlParamsTrips();
                });
            });
            state.dataStore.loadIndex(readyEventName);
        }
    };

    function updateTripsControlElement(tripsControlElement) {
        if (state.isTableShown) {
            if (document.getElementById('tripsTable')) {
                tripsControlElement.replaceChild(getTableHeaderElement(),
                                        document.getElementById('tripsSummary'));
                updateTable();
            } else {
                tripsControlElement.innerHTML = '';
                tripsControlElement.appendChild(getTableHideElement());
                tripsControlElement.appendChild(getTableHeaderElement());
                tripsControlElement.appendChild(getTableElement());
            }
            resizeTable();
        } else {
            var e = document.createElement('div');
            e.className = 'showTripsTable';
            e.title = 'Show trips';
            e.onclick = function () {
                state.isTableShown = true;
                that.showControl();
            };
            e.textContent = 'Trips';
            tripsControlElement.innerHTML = '';
            tripsControlElement.appendChild(e);
        }
    }

    function waitForElement(elementId, delayedFunc) {
        if (document.getElementById(elementId) === null) {
            setTimeout(function () {
                waitForElement(elementId, delayedFunc);
            }, 100);
        } else {
            delayedFunc();
        }
    }

    function resizeTable() {
        var tripsTable = document.getElementById('tripsTableDiv');
        var mapDiv = document.getElementById('map_canvas');
        var streetViewDiv = document.getElementById('street_view');
        var availableHeight = mapDiv.clientHeight + streetViewDiv.clientHeight;
        tripsTable.style.height = Math.round(availableHeight * 0.64) + 'px';
        tripsTable.style.width = getWidth(Math.round(mapDiv.clientWidth * 0.78));

        function getWidth(width) {
            if (tripsTable.scrollWidth > width) {
                return width + 'px';
            } else {
                return 'auto';
            }
        }
    }

    function getTableHideElement() {
        var tripsTableHide = document.createElement('div');
        tripsTableHide.id = 'tripsTableHide';
        tripsTableHide.title = 'Hide trips table';
        tripsTableHide.onclick = function () {
            state.isTableShown = false;
            that.showControl();
        };
        tripsTableHide.appendChild(master.utils.createHideElement('hideTripsTable'));
        return tripsTableHide;
    }

    function getTableHeaderElement() {
        var allElements = [];
        var headerElement = document.createElement('div');
        headerElement.id = 'tripsSummary';
        headerElement.className = 'tripsSummary';

        allElements.push(createTN('Loaded ' + state.dataStore.getNumberOfTrips() + ' trips. '));

        if (state.numberOfVisibleTrips === state.dataStore.getNumberOfTrips()) {
            allElements.push(createTN('Show All'));
        } else {
            allElements.push(createControl('Show all trips', 'Show All',
                                           function () {setVisibilityOfAllTrips('visible')}));
        }

        allElements.push(createTN(' | '));

        if (state.numberOfVisibleTrips === 0) {
            allElements.push(createTN('Hide All'));
        } else {
            allElements.push(createControl('Hide all trips', 'Hide All',
                                           function () {setVisibilityOfAllTrips('hidden')}));
        }

        if (state.numberOfVisibleTrips > 0) {
            allElements.push(createTN(' | '));

            if (state.areMarkersVisible) {
                allElements.push(createControl('Hide all trips markers', 'Hide Markers',
                                               function () {toggleMaxMarkersVisibility()}));
            } else {
                allElements.push(createControl('Show all trips markers', 'Show Markers',
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

    function getTableElement() {
        var tableDiv = document.createElement('div');
        tableDiv.id = 'tripsTableDiv';
        tableDiv.className = 'tripsTable';
        var tableElement = document.createElement('table');
        tableElement.id = 'tripsTable';
        tableElement.className = 'trips';

        var row = tableElement.insertRow(-1);

        addCellWithSpansToRow('Commands', 2, 3, row);
        addCellWithSpansToRow('Trip name', 1, 3, row);
        addCellWithSpansToRow('Date', 1, 2, row);
        addCellWithSpansToRow('GPS data', 4, 1, row);
        addCellWithSpansToRow('Cycle Computer data', 4, 1, row);

        row = tableElement.insertRow(-1);

        addCellsToRow(['Duration', 'Distance', 'Max speed', 'Max altitude', 'Duration', 'Distance',
                       'Max speed', 'Avg speed'], row, 'th');

        row = tableElement.insertRow(-1);

        addCellsToRow(['yyyy-mm-dd', 'hh:mm:ss', 'km', 'km/h', 'm', 'hh:mm:ss', 'km', 'km/h',
                       'km/h'], row, 'th');

        for (var i = 0; i < state.dataStore.getNumberOfTrips(); i++) {
            row = tableElement.insertRow(-1);
            createTripRow(state.dataStore.getTrip(i), i, row);
        }

        tableDiv.appendChild(tableElement);

        return tableDiv;

        function addCellWithSpansToRow(t, colSpan, rowSpan, r) {
            var c = document.createElement('th');
            c.colSpan = colSpan;
            c.rowSpan = rowSpan;
            c.appendChild(document.createTextNode(t));
            r.appendChild(c);
        }
    }

    function addCellsToRow(cells, r, thOrTd) {
        for (var i = 0; i < cells.length; i++) {
            var c = document.createElement(thOrTd);
            if (typeof cells[i] === 'object') {
                c.appendChild(cells[i]);
            } else {
                c.appendChild(document.createTextNode(cells[i]));
            }
            r.appendChild(c);
        }
    }

    function createTripRow(tripData, i, row) {
        addCellsToRow([
            getVisibilityCommandElement(tripData, i),
            getVisitedDataCommandElement(i),
            tripData.name,
            tripData.date,
            tripData.gpsDuration,
            tripData.gpsDistance,
            tripData.gpsMaxSpeed.value,
            tripData.gpsMaxAltitude.value,
            tripData.ccDuration,
            tripData.ccDistance,
            tripData.ccMaxSpeed,
            tripData.ccAvgSpeed], row, 'td');

        if ((master.tripGraph.isVisible()) && (i === state.selectedTripIndex)) {
            row.className = 'selectedTrip';
        } else {
            row.className = '';
        }
    }

    function updateTable() {
        var tripsTable = document.getElementById('tripsTable');
        var rows = tripsTable.rows;

        for (var i = 0, tripI = 0; i < rows.length; i++) {
            if (rows[i].firstChild.nodeName === 'TD') {
                tripsTable.deleteRow(i);
                var newRow = tripsTable.insertRow(i);
                createTripRow(state.dataStore.getTrip(tripI), tripI, newRow);
                tripI += 1;
            }
        }
    }

    function getVisibilityCommandElement(tripData, tripIndex) {
        var title = 'Toggle trip visibility';
        var text = (tripData.visibility === 'hidden') ? 'Show' : 'Hide';
        var handler = function () {
            var readyEventName = 'singleTripLoaded';
            master.mapApi.addListener(readyEventName, function () {
                master.mapApi.removeListeners(readyEventName);
                toggleTripVisibility(tripIndex, true);
                that.showControl();
            });
            state.dataStore.loadSingleTrip(tripIndex, readyEventName);
        };
        var e = master.utils.createControlElement(title, text, handler);
        e.style.color = ((text === 'Hide') ? tripData.color : '');

        return e;
    }

    function getVisitedDataCommandElement(tripIndex) {
        var tripData = state.dataStore.getTrip(tripIndex);
        var filename = tripData.visitedDataFilename;

        if (filename.charAt(filename.length - 1) === '-') {
            return document.createTextNode('');
        }

        if (state.visitedDataIndex === tripIndex) {
            var text = 'Unset';
            var title = 'Set visited data to latest';
            var handler = function () {
                state.visitedDataIndex = -1;
                master.areas.changeVisitedData('latest');
            };
        } else {
            var text = 'Set';
            var title = 'Set visited data as before this trip';
            var handler = function () {
                state.visitedDataIndex = tripIndex;
                master.areas.setVisitedData(filename);
            };
        }

        return master.utils.createControlElement(title, text, handler);
    }

    function createPolyline(tripData) {
        var polylineOptions = {
            'color': tripData.color,
            'weight': 3,
            'opacity': 0.9,
            'clickable': true,
            'zIndex': 10
        };
        return master.mapApi.newPolylineFromEncoded(tripData.encodedPolyline, polylineOptions);
    }

    function toggleTripVisibility(tripIndex, zoomToBounds) {
        var tripData = state.dataStore.getTrip(tripIndex);

        if (typeof(tripData.polyline) === 'undefined') {
            tripData.polyline = createPolyline(tripData);

            tripData.polyline.addListener('click', function (mouseEvent) {
                if (master.tripGraph.isCurrentData(tripData)) {
                    addDirectionMarker(master.mapApi.getMouseEventLatLng(mouseEvent),
                                       tripData.polyline);
                }
                master.tripGraph.show(tripData);
                state.selectedTripIndex = tripIndex;
                that.showControl();
            });

            tripData.gpsMaxSpeed.marker = getMaxMarker(tripData.polyline,
                tripData.gpsMaxSpeed.location, state.areMarkersVisible,
                'S', 'Max speed: ' + tripData.gpsMaxSpeed.value + ' km/h');
            tripData.gpsMaxAltitude.marker = getMaxMarker(tripData.polyline,
                tripData.gpsMaxAltitude.location, state.areMarkersVisible,
                'A', 'Max altitude: ' + tripData.gpsMaxAltitude.value + ' m');
        }

        if (tripData.visibility === 'hidden') {
            tripData.visibility = 'visible';
            state.numberOfVisibleTrips += 1;
            master.areas.setVisitedAreaOpacityToLow();
            master.mapApi.addOrRemoveOverlays(tripData.polyline, 'add');
            if (zoomToBounds) {
                master.mapApi.fitBounds(tripData.polyline.getBounds());
            }
            master.mapApi.addOrRemoveOverlays(tripData.gpsMaxSpeed.marker, 'add');
            master.mapApi.addOrRemoveOverlays(tripData.gpsMaxAltitude.marker, 'add');
            master.tripGraph.show(tripData);
            state.selectedTripIndex = tripIndex;
        } else {
            tripData.visibility = 'hidden';
            state.numberOfVisibleTrips -= 1;
            if (state.numberOfVisibleTrips === 0) {
                master.areas.setVisitedAreaOpacityToHigh();
            }
            master.mapApi.addOrRemoveOverlays(tripData.polyline, 'remove');
            master.mapApi.addOrRemoveOverlays(tripData.gpsMaxSpeed.marker, 'remove');
            master.mapApi.addOrRemoveOverlays(tripData.gpsMaxAltitude.marker, 'remove');
            removeDirectionMarkers();
            master.tripGraph.hide();
            state.selectedTripIndex = -1;
        }
    }

    function addDirectionMarker(point, polyline) {
        /* modified from: http://econym.org.uk/gmap/arrows.htm */
        var heading = polyline.getHeading(point, master.mapApi.getZoom());

        if (heading !== -1) {
            var markerOptions = {
                'visible': true,
                'heading': heading
            };
            var marker = master.mapApi.newMarker(point, markerOptions);
            marker.addListener('click', function (event) {
                master.mapApi.addOrRemoveOverlays(marker, 'remove');
            });
            master.mapApi.addOrRemoveOverlays(marker, 'add');
            state.directionMarkers.push(marker);
        }
    }

    function removeDirectionMarkers() {
        for (var i = 0; i < state.directionMarkers.length; i++) {
            master.mapApi.addOrRemoveOverlays(state.directionMarkers[i], 'remove');
        }
    }

    function getMaxMarker(polyline, point, isVisible, letter, title) {
        var marker = undefined;
        if ((point.lat() !== null) && (point.lng() !== null)) {
            var markerOptions = {
                'visible': isVisible,
                'label': letter,
                'title': title
            };
            marker = master.mapApi.newMarker(point, markerOptions);
            marker.addListener('click', function (event) {
                master.uiMap.zoomToPoint(marker.getPosition());
                var heading = polyline.getHeading(marker.getPosition(), master.mapApi.getZoom());
                master.mapApi.updateStreetView(marker.getPosition(), heading);
            });
        }
        return marker;
    }

    this.getMenuItems = function () {
        var menuItems = [];

        if (state.isTableShown === false) {
            if (state.dataStore.isIndexLoaded()) {
                menuItems.push('Open table');
            }
        }

        if (state.dataStore.getNumberOfTrips() > 0) {
            if (state.numberOfVisibleTrips !== state.dataStore.getNumberOfTrips()) {
                menuItems.push('Show...');
            }
            if (state.numberOfVisibleTrips > 0) {
                menuItems.push('Hide...');
                if (state.areMarkersVisible) {
                    menuItems.push('Hide markers');
                } else {
                    menuItems.push('Show markers');
                }
            }
        }

        return menuItems;
    };

    this.getShowMenuItems = function () {
        var menuItems = [];

        addYearMenuItems(menuItems, 'visible')

        if (state.numberOfVisibleTrips !== state.dataStore.getNumberOfTrips()) {
            menuItems.push('all');
        }

        return menuItems;
    };

    this.getHideMenuItems = function () {
        var menuItems = [];

        addYearMenuItems(menuItems, 'hidden')

        if (state.numberOfVisibleTrips > 0) {
            menuItems.push('all');
        }

        return menuItems;
    };

    function addYearMenuItems(menuItems, visibility) {
        var years = []

        for (var i = 0; i < state.dataStore.getNumberOfTrips(); i++) {
            var tripData = state.dataStore.getTrip(i);
            if (tripData.visibility !== visibility) {
                var year = tripData.date.substr(0, 4)
                if (years.indexOf(year) === -1) {
                    years.push(year)
                }
            }
        }

        years.reverse()

        for (var i = 0; i < years.length; i++) {
            menuItems.push('year ' + years[i]);
        }
    };

    this.processMenuCommand = function (menuItem, command) {
        var visibility = {'Show...': 'visible', 'Hide...': 'hidden'}[menuItem]

        if (command === 'Open table') {
            state.isTableShown = true;
            that.showControl();
        } else if (/year \d\d\d\d/.test(command)) {
            setVisibilityOfTripsByYear(visibility, command.substr(5, 4))
        } else if (command === 'all') {
            setVisibilityOfAllTrips(visibility);
        } else if ((command === 'Hide markers') || (command === 'Show markers')) {
            toggleMaxMarkersVisibility();
        }
    };
}

function TripDataStore(master) {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};
        s['filenames'] = {
            'index': 'trips/index.json',
            'tripsDatas': [
                'trips/tripsData2019.json', 'trips/tripsData2018.json',
                'trips/tripsData2017.json', 'trips/tripsData2016.json', 'trips/tripsData2015.json',
                'trips/tripsData2014.json', 'trips/tripsData2013.json', 'trips/tripsData2012.json',
                'trips/tripsData2011.json', 'trips/tripsData2010.json', 'trips/tripsData2009.json'
            ]
        };
        s['fileIndex'] = 0;
        s['data'] = [];
        return s;
    }

    this.isIndexLoaded = function () {
        return state['data'].length !== 0;
    };

    this.loadIndex = function (readyEventName) {
        var file = state['filenames']['index'];
        master.utils.downloadUrl(file, function (data, responseCode) {
            state['data'] = JSON.parse(data);
            master.mapApi.triggerEvent(readyEventName);
        });
    };

    this.loadAllTripFiles = function (allReadyEventName) {
        if (state['filenames']['tripsDatas'].length === state['fileIndex']) {
            master.mapApi.triggerEvent(allReadyEventName);
        } else {
            var oneReadyEventName = 'tripFileLoaded';
            master.mapApi.addListener(oneReadyEventName, function () {
                master.mapApi.removeListeners(oneReadyEventName);
                that.loadAllTripFiles(allReadyEventName);
            });
            loadTripsFile(state['filenames']['tripsDatas'][state['fileIndex']++],
                          oneReadyEventName);
        }
    };

    function loadTripsFile(file, readyEventName) {
        master.utils.downloadUrl(file, function (data, responseCode) {
            var tripsData = JSON.parse(data);

            for (var i = 0; i < tripsData.length; i++) {
                decodeGpsTripData(tripsData[i]);
                var tripIndex = getTripIndex(tripsData[i]);
                if (isTripLoaded(tripIndex) === false) {
                    state['data'][tripIndex] = tripsData[i];
                }
            }

            master.mapApi.triggerEvent(readyEventName);
        });
    }

    function getTripIndex(tripData) {
        for (var i = 0; i < state['data'].length; i++) {
            if ((state['data'][i]['color'] === tripData['color']) &&
                (state['data'][i]['name'] === tripData['name'])) {
                return i;
            }
        }
    }

    this.loadYearTripFiles = function (year, readyEventName) {
        if ((year === 'all') || isAllLoaded(year)) {
            master.mapApi.triggerEvent(readyEventName);
        } else {
            var file = getYearFilename(year);
            loadTripsFile(file, readyEventName);
        }
    };

    function isAllLoaded(year) {
        for (var i = 0; i < state['data'].length; i++) {
            if ((year === state['data'][i]['date'].substr(0, 4)) &&
                (isTripLoaded(i) === false)) {
                return false;
            }
        }
        return true;
    }

    function getYearFilename(year) {
        for (var i = 0; i < state['filenames']['tripsDatas'].length; i++) {
            if (state['filenames']['tripsDatas'][i].indexOf(year) !== -1) {
                return state['filenames']['tripsDatas'][i];
            }
        }
    }

    function decodeGpsTripData(tripData) {
        tripData['vertexTimes'] =
            master.utils.stringToIntegerList(tripData['encodedVertexTimes']);
        tripData['gpsSpeedData'] =
            master.utils.stringToIntegerList(tripData['encodedGpsSpeedData']);
        tripData['gpsAltitudeData'] =
            decodeGpsAltitudeData(tripData['encodedGpsAltitudeData']);
        tripData['gpsMaxSpeed']['location'] =
            master.mapApi.newLatLng(tripData['gpsMaxSpeed']['lat'],
                                    tripData['gpsMaxSpeed']['lon']);
        tripData['gpsMaxAltitude']['location'] =
            master.mapApi.newLatLng(tripData['gpsMaxAltitude']['lat'],
                                    tripData['gpsMaxAltitude']['lon']);
    }

    function decodeGpsAltitudeData(encodedString) {
        var decodedArray = master.utils.stringToIntegerList(encodedString);
        for (var i = 0; i < decodedArray.length; i++) {
            decodedArray[i] *= 2;
        }
        return decodedArray;
    }

    function isTripLoaded(tripIndex) {
        return state['data'][tripIndex]['encodedGpsSpeedData'] !== undefined;
    };

    this.loadSingleTrip = function (tripIndex, readyEventName) {
        if (isTripLoaded(tripIndex)) {
            master.mapApi.triggerEvent(readyEventName);
        } else {
            var file = 'trips/years/' + state['data'][tripIndex]['filename'] + '.json';
            master.utils.downloadUrl(file, function (data, responseCode) {
                var tripData = JSON.parse(data);
                decodeGpsTripData(tripData);
                state['data'][tripIndex] = tripData;

                master.mapApi.triggerEvent(readyEventName);
            });
        }
    };

    this.getNumberOfTrips = function () {
        return state['data'].length;
    };

    this.getTrip = function (tripIndex) {
        return state['data'][tripIndex];
    };
}
