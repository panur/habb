/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

/* Google Maps,
API Reference: https://developers.google.com/maps/documentation/javascript/reference
*/

export function MapApiImpl() {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};
        s.map = null;
        s.mapDivId = null;
        s.streetViewDivId = null;
        s.ownLocation = null;
        return s;
    }

    this.init = function (mapDivId) {
        state.mapDivId = mapDivId;
        var mapElement = document.getElementById(mapDivId);
        var mapOptions = {
            'fullscreenControl': false,
            'tilt': 0,
            'styles': [{
                'featureType': 'road.arterial',
                'elementType': 'geometry.fill',
                'stylers': [{'color': '#FBF8A5'}]
            }]
        };

        state.map = new google.maps.Map(mapElement, mapOptions);
    };

    this.addControlElement = function (controlElement, position) {
        var googlePosition = {
            'topleft': google.maps.ControlPosition.LEFT_TOP,
            'topright': google.maps.ControlPosition.RIGHT_TOP,
            'bottomleft': google.maps.ControlPosition.LEFT_BOTTOM,
            'bottomright': google.maps.ControlPosition.RIGHT_BOTTOM
        }[position];
        state.map.controls[googlePosition].push(controlElement);
    };

    this.resize = function () {
        google.maps.event.trigger(state.map, 'resize');
    };

    this.initStreetView = function (streetViewDivId, resizeHandler) {
        state.streetViewDivId = streetViewDivId;
        var div = document.getElementById(streetViewDivId);
        var panoramaOptions = {
            'visible': false,
            'enableCloseButton': true,
            'addressControl': false,
            'imageDateControl': true
        };
        var panorama = new google.maps.StreetViewPanorama(div, panoramaOptions);

        google.maps.event.addListener(panorama, 'visible_changed', function () {
            if (panorama.getVisible()) {
                if (div.clientHeight === 0) {
                    that.showStreetView(resizeHandler);
                }
            }
        });

        google.maps.event.addListener(panorama, 'closeclick', function () {
            hideStreetView(resizeHandler);
        });

        google.maps.event.addListener(panorama, 'position_changed', function () {
            var centerLatLng = newLatLngFromImpl(state.map.getStreetView().getPosition());
            that.setCenter(centerLatLng, state.map.getZoom());
        });

        state.map.setStreetView(panorama);
    };

    this.showStreetView = function (resizeHandler) {
        document.getElementById(state.streetViewDivId).style.height =
            (document.getElementById(state.mapDivId).clientHeight * 0.75) + 'px';
        google.maps.event.trigger(state.map.getStreetView(), 'resize');
        resizeHandler();
        state.map.setOptions({
            'panControl': false,
            'zoomControlOptions': {'style': google.maps.ZoomControlStyle.SMALL}
        });
    };

    function hideStreetView(resizeHandler) {
        document.getElementById(state.streetViewDivId).style.height = '0px';
        google.maps.event.trigger(state.map.getStreetView(), 'resize');
        resizeHandler();
        state.map.setOptions({
            'panControl': true,
            'zoomControlOptions': {'style': google.maps.ZoomControlStyle.DEFAULT}
        });
    }

    this.updateStreetView = function (position, heading) {
        if (document.getElementById(state.streetViewDivId).clientHeight !== 0) {
            var svs = new google.maps.StreetViewService();
            var request = {'location': position.getImpl(), 'radius': 50};
            svs.getPanorama(request, function (data, status) {
                if (status === google.maps.StreetViewStatus.OK) {
                    var pov = {'heading': heading, 'zoom': 1, 'pitch': 0};
                    state.map.getStreetView().setPov(pov);
                    state.map.getStreetView().setPosition(position.getImpl());
                }
            });
        }
    };

    this.getZoom = function () {
        return state.map.getZoom();
    };

    this.setZoom = function (zoomLevel) {
        state.map.setZoom(zoomLevel);
    };

    this.panTo = function (latLng) {
        state.map.panTo(latLng.getImpl());
    };

    this.setCenter = function (latLng, zoom) {
        /* http://code.google.com/p/gmaps-api-issues/issues/detail?id=2673 */
        if (zoom !== that.getZoom()) {
            that.setZoom(zoom);
        }
        that.panTo(latLng);
    };

    this.contains = function (latLng) {
        return state.map.getBounds().contains(latLng.getImpl());
    };

    this.fitBounds = function (bounds) {
        state.map.fitBounds(bounds);
    };

    this.newLatLng = function (lat, lng) {
        return new MapApiLatLngImpl(lat, lng);
    };

    function newLatLngFromImpl(latLngImpl) {
        return that.newLatLng(latLngImpl.lat(), latLngImpl.lng());
    }

    this.addListener = function (eventName, handler) {
        return google.maps.event.addListener(state.map, eventName, handler);
    };

    this.addMoveListener = function (handler) {
        google.maps.event.addListener(state.map, 'center_changed', function () {
            var center = state.map.getCenter();
            handler(that.newLatLng(center.lat(), center.lng()));
        });
    };

    // added as returned by addListener()
    this.removeListener = function (added) {
        google.maps.event.removeListener(added);
    };

    this.removeListeners = function (eventName) {
        google.maps.event.clearListeners(state.map, eventName);
    };

    this.triggerEvent = function (eventName) {
        google.maps.event.trigger(state.map, eventName);
    };

    this.clearOwnLocation = function () {
        if (state.ownLocation !== null) {
            state.ownLocation.setMap(null);
        }
    };

    this.updateOwnLocation = function (lat, lng, radius, circleOptions) {
        state.ownLocation = new google.maps.Circle({
            'strokeColor': circleOptions['strokeColor'],
            'strokeOpacity': circleOptions['strokeOpacity'],
            'strokeWeight': circleOptions['strokeWeight'],
            'fillColor': circleOptions['fillColor'],
            'fillOpacity': circleOptions['fillOpacity'],
            'map': state.map,
            'center': {'lat': lat, 'lng': lng},
            'radius': radius,
            'clickable': false
        });
        if (!that.contains(that.newLatLng(lat, lng))) {
            state.map.fitBounds(state.ownLocation.getBounds());
            if (that.getZoom() > 16) {
                that.setZoom(16);
            }
        }
    };

    this.newPolylineFromEncoded = function (encodedPath, polylineOptions) {
        var path = google.maps.geometry.encoding.decodePath(encodedPath);
        return new MapApiPolylineImpl(path, polylineOptions);
    };

    this.newPolyline = function (latLngs, polylineOptions) {
        var path = [];
        for (var i = 0; i < latLngs.length; i++) {
            path.push(latLngs[i].getImpl());
        }
        return new MapApiPolylineImpl(path, polylineOptions);
    };

    this.newPolygon = function (latLngs, polygonOptions) {
        return new MapApiPolygonImpl(latLngs, polygonOptions);
    };

    this.newMarker = function (position, markerOptions) {
        return new MapApiMarkerImpl(position, markerOptions);
    };

    this.addOrRemoveOverlays = function (overlays, addOrRemove) {
        if (addOrRemove === 'add') {
            overlays.getImpl().setMap(state.map);
        } else {
            overlays.getImpl().setMap(null);
        }
    };

    this.addGeoJson = function (geoJson, styleOptions) {
        state.map.data.addGeoJson(geoJson);
        state.map.data.setStyle({
            strokeColor: styleOptions['strokeColor'],
            strokeOpacity: styleOptions['strokeOpacity'],
            strokeWeight: styleOptions['strokeWeight'],
        });
    };

    this.getMouseEventLatLng = function (mouseEvent) {
        return that.newLatLng(mouseEvent.latLng.lat(), mouseEvent.latLng.lng());
    };

    this.getMouseEventPixel = function (mouseEvent) {
        return mouseEvent.pixel;
    };

    this.isMouseEventOnMap = function (mouseEvent) {
        return true;
    };
}

function MapApiLatLngImpl(lat, lng) {
    var impl = new google.maps.LatLng(lat, lng);

    this.getImpl = function () {
        return impl;
    };

    this.lat = function () {
        return lat;
    };

    this.lng = function () {
        return lng;
    };

    this.toStr = function (decimals) {
        return impl.toUrlValue(decimals).replace(',', ' / ');
    };
}

function MapApiPolylineImpl(path, polylineOptions) {
    var impl = newImpl();

    function newImpl() {
        return new google.maps.Polyline({
            'path': path,
            'strokeColor': polylineOptions.color,
            'strokeOpacity': polylineOptions.opacity,
            'strokeWeight': polylineOptions.weight,
            'clickable': polylineOptions.clickable,
            'zIndex': polylineOptions.zIndex
        });
    }

    this.getImpl = function () {
        return impl;
    };

    this.addListener = function (eventName, handler) {
        google.maps.event.addListener(impl, eventName, handler);
    };

    this.getPathLength = function () {
        return impl.getPath().length;
    };

    this.computeLength = function () {
        return google.maps.geometry.spherical.computeLength(impl.getPath());
    };

    this.getLatLng = function (index) {
        var implLatLng = path[index];
        return new MapApiLatLngImpl(implLatLng.lat(), implLatLng.lng());
    };

    this.getBounds = function () {
        var polylinePath = impl.getPath();
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < polylinePath.getLength(); i++) {
            bounds.extend(polylinePath.getAt(i));
        }
        return bounds;
    };

    this.computeDistance = function (p1, p2) {
        return google.maps.geometry.spherical.computeDistanceBetween(p1.getImpl(), p2.getImpl());
    };

    this.computeHeading = function (p1, p2) {
        return google.maps.geometry.spherical.computeHeading(p1.getImpl(), p2.getImpl());
    };
}

function MapApiPolygonImpl(latLngs, polygonOptions) {
    var impl = newImpl();

    function newImpl() {
        var paths = [];
        for (var i = 0; i < latLngs.length; i++) {
            paths[i] = [];
            for (var j = 0; j < latLngs[i].length; j++) {
                paths[i].push(latLngs[i][j].getImpl());
            }
        }
        var polygon = new google.maps.Polygon({
            'paths': paths,
            'strokeColor': polygonOptions.strokeColor,
            'strokeWeight': polygonOptions.strokeWeight,
            'strokeOpacity': polygonOptions.strokeOpacity,
            'fillColor': polygonOptions.fillColor,
            'fillOpacity': polygonOptions.fillOpacity,
            'clickable': polygonOptions.clickable,
            'zIndex': polygonOptions.zIndex
        });
        return polygon;
    }

    this.getImpl = function () {
        return impl;
    };

    this.getPathLength = function () {
        var path = impl.getPath();
        if (path) {
            return path.length;
        }
        return 0;
    };

    this.setOpacity = function (opacity) {
        impl.setOptions({'fillOpacity': opacity});
    };
}

function MapApiMarkerImpl(position, markerOptions) {
    var impl = newImpl();

    function newImpl() {
        if (markerOptions.heading === undefined) {
            return newLabelMarker();
        } else {
            return newDirectionMarker();
        }
    }

    function newLabelMarker() {
        return new google.maps.Marker({
            'visible': markerOptions.visible,
            'position': position.getImpl(),
            'label': markerOptions.label,
            'title': markerOptions.title
        });
    }

    function newDirectionMarker() {
        var icon = {
            'fillColor': 'blue',
            'fillOpacity': 0.6,
            'path': google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            'rotation': markerOptions.heading,
            'scale': 5,
            'strokeWeight': 0
        };

        return new google.maps.Marker({
            'position': position.getImpl(),
            'icon': icon
        });
    };

    this.getImpl = function () {
        return impl;
    };

    this.addListener = function (eventName, handler) {
        google.maps.event.addListener(impl, eventName, handler);
    };

    this.setVisible = function (isVisible) {
        impl.setVisible(isVisible);
    };

    this.getPosition = function () {
        return position;
    };
}
