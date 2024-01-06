/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

export function UiMap(master) {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};

        s.initialStatistics = getInitialStatistics();

        s.initialZL = 9;
        s.initialLatLng = master.mapApi.newLatLng(60.497629, 24.906533);
        s.zoomToPointZoomLevel = 14;

        return s;
    }

    function getInitialStatistics() {
        var element = document.getElementById('statistics');
        var aElement = document.getElementById('map_link');
        aElement.href += (new URL(document.URL)).search;
        return element.innerHTML;
    }

    this.init = function () {
        master.mapApi.setCenter(state.initialLatLng, state.initialZL);
        addListeners();
        master.mapApi.initStreetView('street_view', resizeMapCanvas);

        master.mapApi.addListener('areasInitIsReady', function () {
            updateStatusBar(getInfo(state.initialLatLng));
            setStatistics();
            window.onresize = function () {that.resizeMap()};
            that.resizeMap();
            master.mapApi.triggerEvent('uiMapInitIsReady');
        });
    };

    function setStatistics() {
        var s = master.areas.getVisitedStatistics();
        var total = s.yes + s.no + s.np;
        var p = {'yes': Math.round(100 * s.yes / total),
                  'no': Math.round(100 * s.no / total),
                  'np': Math.round(100 * s.np / total)};
        var statistics = 'Visited: yes='           + s.yes + ' ('+ p.yes +
                               '%), no='           + s.no  + ' ('+ p.no +
                               '%), not possible=' + s.np  + ' ('+ p.np +
                               '%), total=' + total;

        document.getElementById('statistics').innerHTML =
            statistics + ', ' + state.initialStatistics;
    }

    function addListeners() {
        master.mapApi.addListener('mousemove', function (mouseEvent) {
            if (master.tripGraph.isPlayerStopped()) {
                updateLocation(master.mapApi.getMouseEventLatLng(mouseEvent));
            }
        });

        master.mapApi.addMoveListener(function (point) {
            if ('ontouchstart' in window) {
                updateLocation(point);
            }
        });

        master.mapApi.addListener('mouseout', function (mouseEvent) {
            master.areas.hideCursor();
        });
    }

    function updateLocation(point) {
        var info = getInfo(point);
        updateStatusBar(info);
        master.areas.updateCursor(info);
    }

    function getInfo(point) {
        var info = {};
        var areasInfo = master.areas.getInfo(point);

        info.page = areasInfo.page;
        info.km2XY = areasInfo.km2XY;
        info.kkjText = areasInfo.kkjText;
        info.visited = areasInfo.visited;
        info.zl = master.mapApi.getZoom();
        info.latLng = point.toStr();

        return info;
    }

    function updateStatusBar(info) {
        var statusBarText = 'Page=' + info.page + ', KKJ=' + info.kkjText + ', visited=' +
            info.visited + ', ZL=' + info.zl + ', Lat/Lng=' + info.latLng;

        that.setStatusBarText(statusBarText);
    }

    this.setStatusBarText = function (statusBarText) {
        document.getElementById('status_bar').textContent = statusBarText;
    };

    this.openOtherMap = function (otherMapType, point) {
        var zl = master.mapApi.getZoom();
        var url = '';

        if (otherMapType === 'MML') {
            url = 'https://14142.net/mml/?lat=' +
                point.lat() + '&lng=' + point.lng() + '&z=' + zl;
        } else if (otherMapType === 'Google Maps') {
            url = 'http://maps.google.com/?output=classic&dg=opt&ll=' +
                point.lat() + ',' + point.lng() + '&z=' + zl;
        } else if (otherMapType === 'HERE Maps') {
            url = 'http://wego.here.com/?map=' +
                point.lat() + ',' + point.lng() + ',' + zl;
        } else if (otherMapType === 'Bing Maps') {
            url = 'http://www.bing.com/maps/default.aspx?cp=' +
                point.lat() + '~' + point.lng() + '&lvl=' + zl;
        } else if (otherMapType === 'OpenStreetMap') {
            url = 'http://www.openstreetmap.org/#map=' +
                zl + '/' + point.lat() + '/' + point.lng();
        }

        window.open(url);
    };

    this.zoomToPoint = function (latLng) {
        master.mapApi.setCenter(latLng, state.zoomToPointZoomLevel);
    };

    this.resizeMap = function () {
        if (master.tripGraph.isVisible()) {
            master.tripGraph.resize();
        } else {
            that.resizeDivs();
        }

        master.trips.showControl();
    };

    this.resizeDivs = function () {
        var oldStreetViewHeight = document.getElementById('street_view').clientHeight;

        document.getElementById('street_view').style.height = '0px';

        resizeMapCanvas();

        if (oldStreetViewHeight !== 0) {
            master.mapApi.showStreetView(resizeMapCanvas);
        }
    };

    function resizeMapCanvas() {
        document.getElementById('map_canvas').style.height =
            document.documentElement.clientHeight -
            document.getElementById('street_view').clientHeight -
            document.getElementById('trip_graph').clientHeight -
            document.getElementById('trip_graph_control').clientHeight -
            document.getElementById('status_bar').clientHeight -
            document.getElementById('statistics').clientHeight + 'px';

        master.mapApi.resize();
    }

    this.resetLocationAndZoom = function () {
        master.mapApi.setCenter(state.initialLatLng, state.initialZL);
    };
}
