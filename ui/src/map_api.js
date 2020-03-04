/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

'use strict';

function MapApi() {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};
        s.maMap = null;
        return s;
    }

    this.init = function (mapDivId) {
        state.maMap = new MapApiImpl();
        state.maMap.init(mapDivId);
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

    this.getMouseEventLatLng = function (mouseEvent) {
        return new MapApiLatLng(state.maMap.getMouseEventLatLng(mouseEvent));
    };

    this.getMouseEventPixel = function (mouseEvent) {
        return state.maMap.getMouseEventPixel(mouseEvent);
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
