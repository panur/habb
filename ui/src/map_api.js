/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

export function MapApi() {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};
        s.maMap = null;
        return s;
    }

    this.init = async function (mapDivId) {
        var module = await import(getMapSourceFile());
        state.maMap = new module.MapApiImpl();
        state.maMap.init(mapDivId);

        if ('geolocation' in navigator) {
            createOwnLocationControl();
        }
    };

    function getMapSourceFile() {
        if (typeof L !== 'undefined') {
            return './map_leaflet.js';
        } else {
            return './map_google.js';
        }
    }

    function createOwnLocationControl() {
        var ownLocationElement = createOwnLocationElement();
        var wrapperElement = document.createElement('div');
        wrapperElement.appendChild(ownLocationElement);
        var watchPositionId = null;

        state.maMap.addControlElement(wrapperElement, 'bottomleft');

        function createOwnLocationElement(statusClassName) {
            var newControlElement = document.createElement('div');
            newControlElement.className = 'findOwnLocation';
            if (statusClassName !== undefined) {
                newControlElement.className += ' ' + statusClassName;
            }
            newControlElement.title = 'show own location';
            newControlElement.textContent = '(\u25C9)';
            newControlElement.addEventListener('click', onClick, false);
            return newControlElement;

            function onClick() {
                if (watchPositionId === null) {
                    newControlElement.removeEventListener('click', onClick, false);
                    newControlElement.className = 'findingOwnLocation';
                    newControlElement.title = 'finding own location';
                    newControlElement.textContent = '(\u25CE)';
                    watchPositionId = navigator.geolocation.watchPosition(onPositionSuccess,
                                                                          onPositionError,
                                                                          {'timeout': 60000});
                } else {
                    navigator.geolocation.clearWatch(watchPositionId);
                    watchPositionId = null;
                    state.maMap.clearOwnLocation();
                    updateOwnLocationElement();
                }
            }
        }

        function onPositionSuccess(position) {
            updateOwnLocationElement('locatingSuccess');
            var radius = Math.max(10, position.coords.accuracy);
            var circleOptions = {'strokeColor': 'blue', 'strokeOpacity': 0.4, 'strokeWeight': 2,
                                 'fillColor': 'black', 'fillOpacity': 0.05};
            state.maMap.clearOwnLocation();
            state.maMap.updateOwnLocation(position.coords.latitude, position.coords.longitude,
                                          radius, circleOptions);
        }

        function onPositionError(err) {
            updateOwnLocationElement('locatingError');
            ownLocationElement.textContent = '(\u25EC)';
            console.log('failed to find own position: %o', err);
        }

        function updateOwnLocationElement(statusClassName) {
            var oldElement = ownLocationElement;
            var newElement = createOwnLocationElement(statusClassName);
            oldElement.parentNode.replaceChild(newElement, oldElement);
            ownLocationElement = newElement;
        }
    }

    this.addControlElement = function (controlElement, position) {
        state.maMap.addControlElement(controlElement, position);
    };

    this.resize = function () {
        state.maMap.resize();
    };

    this.initStreetView = function (streetViewDivId, resizeHandler) {
        return state.maMap.initStreetView(streetViewDivId, resizeHandler);
    };

    this.showStreetView = function (resizeHandler) {
        return state.maMap.showStreetView(resizeHandler);
    };

    this.updateStreetView = function (position, heading) {
        return state.maMap.updateStreetView(position, heading);
    };

    this.getZoom = function () {
        return state.maMap.getZoom();
    };

    this.setZoom = function (zoomLevel) {
        state.maMap.setZoom(zoomLevel);
    };

    this.panTo = function (latLng) {
        state.maMap.panTo(latLng);
    };

    this.setCenter = function (latLng, zoom) {
        state.maMap.setCenter(latLng, zoom);
    };

    this.contains = function (latLng) {
        return state.maMap.contains(latLng);
    };

    this.fitBounds = function (bounds) {
        state.maMap.fitBounds(bounds);
    };

    this.newLatLng = function (lat, lng) {
        return new MapApiLatLng(state.maMap.newLatLng(lat, lng));
    };

    this.addListener = function (eventName, handler) {
        return state.maMap.addListener(eventName, handler);
    };

    this.addMoveListener = function (handler) {
        state.maMap.addMoveListener(handler);
    };

    // added as returned by addListener()
    this.removeListener = function (added) {
        state.maMap.removeListener(added);
    };

    this.removeListeners = function (eventName) {
        state.maMap.removeListeners(eventName);
    };

    this.triggerEvent = function (eventName) {
        state.maMap.triggerEvent(eventName);
    };

    this.newPolylineFromEncoded = function (encodedPath, polylineOptions) {
        return new MapApiPolyline(state.maMap.newPolylineFromEncoded(encodedPath, polylineOptions));
    };

    this.newPolyline = function (path, polylineOptions) {
        return new MapApiPolyline(state.maMap.newPolyline(path, polylineOptions));
    };

    this.newPolygon = function (paths, polygonOptions) {
        return new MapApiPolygon(state.maMap.newPolygon(paths, polygonOptions));
    };

    this.newMarker = function (position, markerOptions) {
        return new MapApiMarker(state.maMap.newMarker(position, markerOptions));
    };

    this.addOrRemoveOverlays = function (overlays, addOrRemove) {
        if (overlays) {
            state.maMap.addOrRemoveOverlays(overlays, addOrRemove);
        }
    };

    this.addGeoJson = function (geoJson, styleOptions) {
        state.maMap.addGeoJson(geoJson, styleOptions);
    };

    this.getMouseEventLatLng = function (mouseEvent) {
        return new MapApiLatLng(state.maMap.getMouseEventLatLng(mouseEvent));
    };

    this.getMouseEventPixel = function (mouseEvent) {
        return state.maMap.getMouseEventPixel(mouseEvent);
    };

    this.isMouseEventOnMap = function (mouseEvent) {
        return state.maMap.isMouseEventOnMap(mouseEvent);
    };
}

function MapApiLatLng(impl) {
    this.getImpl = function () {
        return impl.getImpl();
    };

    this.lat = function () {
        return impl.lat();
    };

    this.lng = function () {
        return impl.lng();
    };

    this.toStr = function (decimals) {
        if (decimals === undefined) {
            decimals = 6;
        }
        return impl.toStr(decimals);
    };
}

function MapApiPolyline(impl) {
    var that = this;

    this.getImpl = function () {
        return impl.getImpl();
    };

    this.addListener = function (eventName, handler) {
        impl.addListener(eventName, handler);
    };

    this.getPathLength = function () {
        return impl.getPathLength();
    };

    this.computeLength = function () {
        return impl.computeLength();
    };

    this.getLatLng = function (index) {
        return impl.getLatLng(index);
    };

    this.getBounds = function () {
        return impl.getBounds();
    };

    this.getHeading = function (point, zoom) {
        var tolerances = [0.0001, 391817 * Math.pow(0.445208, zoom)];

        for (var t = 0; t < tolerances.length; t++) {
            for (var i = 0; i < that.getPathLength() - 1; i++) {
                var p1 = that.getLatLng(i);
                var p2 = that.getLatLng(i + 1);

                if (isPointInLineSegment(point, p1, p2, tolerances[t]) === true) {
                    return computeHeading(p1, p2);
                }
            }
        }

        return -1;

        function isPointInLineSegment(point, p1, p2, tolerance) {
            var distance = Math.abs(impl.computeDistance(point, p1) +
                impl.computeDistance(point, p2) - impl.computeDistance(p1, p2));
            return (distance < tolerance);
        }

        function computeHeading(from, to) {
            var heading = impl.computeHeading(from, to);

            if (heading < 0) {
                heading += 360;
            }

            heading = Math.round(heading / 3) * 3;

            return heading;
        }
    };
}

function MapApiPolygon(impl) {
    this.getImpl = function () {
        return impl.getImpl();
    };

    this.getPathLength = function () {
        return impl.getPathLength();
    };

    this.setOpacity = function (opacity) {
        impl.setOpacity(opacity);
    };
}

function MapApiMarker(impl) {
    this.getImpl = function () {
        return impl.getImpl();
    };

    this.addListener = function (eventName, handler) {
        impl.addListener(eventName, handler);
    };

    this.setVisible = function (isVisible) {
        impl.setVisible(isVisible);
    };

    this.getPosition = function () {
        return impl.getPosition();
    };
}
