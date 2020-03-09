/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

/* Leaflet,
API Reference: https://leafletjs.com/reference.html
*/

'use strict';

function MapApiImpl() {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};
        s.map = null;
        s.baseLayers = null;
        s.baseLayerName = 'OpenStreetMap';
        return s;
    }

    this.init = function (mapDivId) {
        state.baseLayers = {
            'OpenStreetMap': getOsmBaseLayer(),
            'NLS Topographic': getNlsBaseLayer('maastokartta'),
            'NLS Background': getNlsBaseLayer('taustakartta'),
            'NLS Orthophotos': getNlsBaseLayer('ortokuva'),
            'Mapbox Streets': getMapboxBaseLayer('streets-v11'),
            'Mapbox Outdoors': getMapboxBaseLayer('outdoors-v11'),
            'Mapbox Satellite': getMapboxBaseLayer('satellite-streets-v11'),
            'HSL': getHslBaseLayer()
        };
        state.map = L.map(mapDivId, {
            'zoomControl': false,
            'layers': [state.baseLayers[state.baseLayerName]]
        });
        state.map.on('baselayerchange', function(event) {
            // https://github.com/Leaflet/Leaflet/issues/2553
            var oldCenter = state.map.getCenter();
            var oldZoom = state.map.getZoom() + getZoomOffset(state.baseLayerName);
            if (event.name.indexOf('NLS') !== -1) {
                if (state.map.options.crs === L.CRS.EPSG3857) {
                    state.map.options.crs = getNlsCrs();
                }
            } else {
                state.map.options.crs = L.CRS.EPSG3857;
            }
            state.baseLayerName = event.name;
            var maxZoom = getMaxZoom(state.baseLayerName) - getZoomOffset(state.baseLayerName);
            state.map.setMaxZoom(maxZoom);
            var newZoom = limitZoom(oldZoom, state.baseLayerName) -
            getZoomOffset(state.baseLayerName);
            state.map.setView(oldCenter, newZoom, {'animate': false});
        });
        state.map.addControl(L.control.zoom({'position': 'bottomright'}));

        L.control.layers(state.baseLayers, null, {'position': 'topleft'}).addTo(state.map);
    };

    function getOsmBaseLayer() {
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            'customOptions': {'zoomOffset': 0},
            'maxZoom': 19,
            'attribution':
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });
    }

    function getNlsBaseLayer(layerType) {
        var licenceUrl = 'https://www.maanmittauslaitos.fi/avoindata-lisenssi-cc40';
        var urlTemplate = 'https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/' +
            '{layerType}/default/ETRS-TM35FIN/{z}/{y}/{x}.png';
        return L.tileLayer(urlTemplate, {
            'customOptions': {'zoomOffset': 3},
            'layerType': layerType,
            'maxZoom': 16,
            'attribution': '&copy; <a href="' + licenceUrl + '">NLS</a>'
        });
    }

    function getMapboxBaseLayer(styleId) {
        var url = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
        return L.tileLayer(url, {
            'customOptions': {'zoomOffset': 0},
            'maxZoom': 19,
            'attribution': 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> ' +
                'contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery &copy; <a href="https://mapbox.com">Mapbox</a>',
            'id': 'mapbox/' + styleId,
            'accessToken': 'pk.eyJ1IjoicGFudXIiLCJhIjoiY2s2YXdhdDJ0MDM1' +
                'ZDNscGF3ZXcydGYxYSJ9.sKE9SIx-t212_DRGOekJFA'
        });
    }

    function getHslBaseLayer() {
        return L.tileLayer('https://api.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}.png', {
            'customOptions': {'zoomOffset': 0},
            'maxZoom': 19,
            'attribution': 'Map data &copy; ' +
                '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, ' +
                'Tiles &copy; <a href="https://digitransit.fi/">Digitransit</a>'
        });
    }

    function getMaxZoom(baseLayerName) {
        return state.baseLayers[baseLayerName]['options']['maxZoom'];
    }

    function getZoomOffset(baseLayerName) {
        return state.baseLayers[baseLayerName]['options']['customOptions']['zoomOffset'];
    }

    function getNlsCrs() {
        // https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/WMTSCapabilities.xml
        var origin = [-548576, 8388608];
        // https://epsg.io/3067
        var proj4 = '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
        return new L.Proj.CRS('EPSG:3067', proj4, {
            'resolutions': [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1],
            'origin': origin,
            'bounds': L.bounds(origin, [1548576, 6291456])
        });
    }

    function limitZoom(zoom, baseLayerName) {
        var zoomOffset = getZoomOffset(baseLayerName);
        var maxZoom = getMaxZoom(baseLayerName);
        return Math.max(zoomOffset, Math.min(zoom, maxZoom + zoomOffset));
    }

    this.addControlElement = function (controlElement, position) {
        var CustomControl = L.Control.extend({
            options: {
                position: position
            },
            onAdd: function (map) {
                L.DomEvent.disableScrollPropagation(controlElement);
                L.DomEvent.disableClickPropagation(controlElement);
                return controlElement;
            }
        });
        state.map.addControl(new CustomControl());
    };

    this.resize = function () {
        state.map.invalidateSize();
    };

    this.initStreetView = function (streetViewDivId, resizeHandler) {
        // nothing to do
    };

    this.showStreetView = function (resizeHandler) {
        // nothing to do
    };

    this.updateStreetView = function (position, heading) {
        // nothing to do
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
        state.map.setView(latLng.getImpl(), zoom);
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

    this.addListener = function (eventName, handler) {
        state.map.on(eventName, handler);
        return {'eventName': eventName, 'handler': handler};
    };

    // added as returned by addListener()
    this.removeListener = function (added) {
        state.map.off(added.eventName, added.handler);
    };

    this.removeListeners = function (eventName) {
        state.map.off(eventName);
    };

    this.triggerEvent = function (eventName) {
        state.map.fire(eventName);
    };

    this.newPolylineFromEncoded = function (encodedPath, polylineOptions) {
        var path = decodeLine(encodedPath);
        return new MapApiPolylineImpl(path, polylineOptions);
    };

    // http://code.google.com/apis/maps/documentation/utilities/include/polyline.js
    // Decode an encoded polyline into a list of latLng.
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

            array.push(L.latLng(lat * 1e-5, lng * 1e-5));
        }

        return array;
    }

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
            overlays.getImpl().addTo(state.map);
        } else {
            overlays.getImpl().remove();
        }
    };

    this.getMouseEventLatLng = function (mouseEvent) {
        return that.newLatLng(mouseEvent.latlng.lat, mouseEvent.latlng.lng);
    };

    this.getMouseEventPixel = function (mouseEvent) {
        return mouseEvent.containerPoint;
    };
}

function MapApiLatLngImpl(lat, lng) {
    var impl = L.latLng(lat, lng);

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
        return L.Util.formatNum(lat, decimals) + '/' + L.Util.formatNum(lng, decimals);
    };
}

function MapApiPolylineImpl(path, polylineOptions) {
    var impl = newImpl();

    function newImpl() {
        return L.polyline(path, {
            'color': polylineOptions.color,
            'opacity': polylineOptions.opacity,
            'weight': polylineOptions.weight,
            'interactive': polylineOptions.clickable,
            'bubblingMouseEvents': false
        });
    }

    this.getImpl = function () {
        return impl;
    };

    this.addListener = function (eventName, handler) {
        impl.on(eventName, handler);
        if (eventName === 'click') {
            impl.on('mouseup', L.DomEvent.stopPropagation);
        }
    };

    this.getPathLength = function () {
        return impl.getLatLngs().length;
    };

    this.computeLength = function () {
        var length = 0;
        var latLngs = impl.getLatLngs();
        for (var i = 1; i < latLngs.length; i++) {
            length += latLngs[i].distanceTo(latLngs[i - 1]);
        }
        return length;
    };

    this.getLatLng = function (index) {
        var implLatLng = path[index];
        return new MapApiLatLngImpl(implLatLng.lat, implLatLng.lng);
    };

    this.getBounds = function () {
        return impl.getBounds();
    };

    this.computeDistance = function(p1, p2) {
        return p1.getImpl().distanceTo(p2.getImpl());
    };

    this.computeHeading = function (p1, p2) {
        var p1Impl = p1.getImpl();
        var p2Impl = p2.getImpl();
        var p1LatLon = new LatLon(p1Impl.lat, p1Impl.lng);
        var p2LatLon = new LatLon(p2Impl.lat, p2Impl.lng);
        return p1LatLon.bearingTo(p2LatLon);
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
        var polygon = L.polygon(paths, {
            'color': polygonOptions.strokeColor,
            'weight': polygonOptions.strokeWeight,
            'opacity': polygonOptions.strokeOpacity,
            'fillColor': polygonOptions.fillColor,
            'fillOpacity': polygonOptions.fillOpacity,
            'interactive': polygonOptions.clickable
        });
        return polygon;
    }

    this.getImpl = function () {
        return impl;
    };

    this.getPathLength = function () {
        return impl.getLatLngs().length;
    };

    this.setOpacity = function (opacity) {
        impl.setStyle({'fillOpacity': opacity});
    };
}

function MapApiMarkerImpl(position, markerOptions) {
    var state = getState();

    function getState() {
        var s = {};
        s.map = undefined;
        s.isVisible = markerOptions.visible;
        s.isAddedInternal = false;
        s.symbolElement = createSymbolElement(markerOptions.title);
        s.impl = newImpl(s.symbolElement);
        return s;
    }

    function newImpl(symbolElement) {
        if (markerOptions.heading === undefined) {
            var iconSize = new L.Point(100, 100);
            symbolElement.appendChild(newLabelIcon(markerOptions.label));
        } else {
            var iconSize = new L.Point(50, 50);
            symbolElement.appendChild(newDirectionIcon(markerOptions.heading));
        }
        var iconElement = createSymbolRootElement(symbolElement);
        var markerIcon = L.divIcon({
            'html': iconElement,
            'className': '',
            'iconSize': iconSize
        });
        var HideableMarker = L.Marker.extend({
            onAdd: function(map) {
                state.map = map;
                if (state.isVisible) {
                    L.Marker.prototype.onAdd.call(this, map);
                    state.isAddedInternal = true;
                }
            },
            onRemove: function(map) {
                if (state.isAddedInternal) {
                    L.Marker.prototype.onRemove.call(this, map);
                    state.isAddedInternal = false;
                }
            }
        });
        return new HideableMarker(position.getImpl(), {
            'icon': markerIcon
        });
    }

    function newLabelIcon(label) {
        var svgElement = createSvgElement('g');
        svgElement.setAttribute('fill', 'rgb(234,67,53)');
        var pathElement = createSvgElement('path');
        // path is created from (original size 27*43):
        // https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi-dotless2.png
        // with (size 270*430):
        // https://image.online-convert.com/convert-to-svg
        pathElement.setAttribute('d',
            'M 103 413 ' +
            'c -33 -6 -79 -57 -87 -93 -7 -36 5 -67 63 -165 23 -38 44 -88 48 -109 ' +
            'l 6 -40 12 45 ' +
            'c 6 25 33 83 60 129 52 88 60 128 35 174 -23 45 -83 70 -137 59 z');
        // 3.65 = 10/2 - 2.7/2
        pathElement.setAttribute('transform', 'translate(3.65, 5) scale(0.01, -0.01)');
        pathElement.setAttribute('stroke', 'white');
        pathElement.setAttribute('stroke-width', '10');
        svgElement.appendChild(pathElement);
        var textElement = createSvgElement('text');
        textElement.textContent = label;
        textElement.setAttribute('fill', 'black');
        textElement.setAttribute('font-size', 1.3);
        textElement.setAttribute('text-anchor', 'middle');
        // MSIE doesn't support dominant-baseline, let's hack vertical position with dy
        textElement.setAttribute('dy', '0.5em');
        textElement.setAttribute('x', '5');
        textElement.setAttribute('y', '2');
        svgElement.appendChild(textElement);
        return svgElement;
    }

    function newDirectionIcon(heading) {
        var svgElement = createSvgElement('path');
        svgElement.setAttribute('d', 'M 0,3 5,5 0,7 1.2,5 z');
        svgElement.setAttribute('opacity', '0.6');
        svgElement.setAttribute('fill', 'blue');
        svgElement.setAttribute('transform', 'rotate(' + (heading - 90) + ', 5, 5)');
        return svgElement;
    }

    function createSymbolElement(title) {
        var symbolElement = createSvgElement('g');
        var titleElement = createSvgElement('title');
        titleElement.textContent = title;
        symbolElement.appendChild(titleElement);
        return symbolElement;
    }

    function createSymbolRootElement(symbolElement) {
        var wrapperElement = document.createElement('div');
        var svgRootElement = createSvgElement('svg');
        svgRootElement.setAttribute('viewBox', '0 0 10 10');
        svgRootElement.appendChild(symbolElement);
        wrapperElement.appendChild(svgRootElement);
        return wrapperElement;
    }

    function createSvgElement(elementType) {
        return document.createElementNS('http://www.w3.org/2000/svg', elementType);
    }

    this.getImpl = function () {
        return state.impl;
    };

    this.addListener = function (eventName, handler) {
        L.DomEvent.on(state.symbolElement, eventName, handler);
        if (eventName === 'click') {
            L.DomEvent.on(state.symbolElement, 'mouseup', function (mouseEvent) {
                L.DomEvent.stopPropagation(mouseEvent);
            });
        }
    };

    this.setVisible = function (isVisible) {
        state.isVisible = isVisible;
        if (state.map !== undefined) {
            if (isVisible) {
                state.impl.remove();
                state.impl.addTo(state.map);
            } else {
                state.impl.remove();
            }
        }
    };

    this.getPosition = function () {
        return position;
    };
}
