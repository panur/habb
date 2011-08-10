/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-10 */

function Map(master) {
  var that = this; /* http://javascript.crockford.com/private.html */
  var config = getConfig();

  function getConfig() {
    var c = {};

    c.initialStatistics = document.getElementById("statistics").innerHTML;

    c.initialZL = 10;
    c.initialLatLng = new google.maps.LatLng(60.2558, 24.8275);
    c.zoomToPointZoomLevel = 14;

    return c;
  }

  function setCenter(latLng, zoom) {
    /* http://code.google.com/p/gmaps-api-issues/issues/detail?id=2673 */
    if (zoom != master.gm.getZoom()) {
      master.gm.setZoom(zoom);
    }
    master.gm.panTo(latLng);
  }

  function setStatistics() {
    var s = master.areas.getVisitedStatistics();
    var total = s.yes + s.no + s.np;
    var p = {yes:Math.round(100 * s.yes / total),
              no:Math.round(100 * s.no / total),
              np:Math.round(100 * s.np / total)};
    var statistics = "Visited: yes="           + s.yes + " ("+ p.yes +
                           "%), no="           + s.no  + " ("+ p.no +
                           "%), not possible=" + s.np  + " ("+ p.np +
                           "%), total=" + total;

    document.getElementById("statistics").innerHTML =
      statistics + ", " + config.initialStatistics;
  }

  function addMouseListeners() {
    google.maps.event.addListener(master.gm, "mousemove", function(mouseEvent) {
      if (master.tripGraph.isPlayerStopped()) {
        var info = getInfo(mouseEvent.latLng);
        updateStatusBar(info);
        master.areas.updateCursor(info);
      }
    });

    google.maps.event.addListener(master.gm, "mouseout", function(mouseEvent) {
      master.areas.hideCursor();
    });
  }

  function getInfo(point) {
    var info = {};
    var areasInfo = master.areas.getAreasInfo(point);

    info.page = areasInfo.page;
    info.km2XY = areasInfo.km2XY;
    info.kkjText = areasInfo.kkjText;
    info.visited = areasInfo.visited;
    info.zl = master.gm.getZoom();
    info.latLng = point.lat() + " / " + point.lng();

    return info;
  }

  function updateStatusBar(info) {
    var statusHtml = "Page=" + info.page + ", KKJ=" + info.kkjText +
                     ", visited=" + info.visited + ", ZL=" + info.zl +
                     ", Lat/Lng=" + info.latLng;

    that.setStatusBarHtml(statusHtml);
  }

  this.setStatusBarHtml = function(statusBarHtml) {
    document.getElementById("status_bar").innerHTML = statusBarHtml;
  }

  this.openOtherMap = function(otherMapType, point) {
    var zl = master.gm.getZoom();
    var url = "";

    if (otherMapType == "Kansalaisen karttapaikka") {
      var kkjOffset = master.areas.getKkjOffsetOrStart(point, "offset");
      url = "http://kansalaisen.karttapaikka.fi/kartanhaku";

      if (kkjOffset != null) {
        url += "/osoitehaku.html?cy=" +
          kkjOffset.y + "500&cx=" + kkjOffset.x + "500&scale=8000";
      } else {
        url += "/koordinaattihaku.html?y=" + point.lat() + "&x=" + point.lng() +
          "&srsName=EPSG%3A4258&scale=8000";
      }
    } else if (otherMapType == "kartta.hel.fi") {
      var kkjStart = master.areas.getKkjOffsetOrStart(point, "start");
      if (kkjStart != null) {
        url = "http://kartta.hel.fi/opas/main/?n=" +
          kkjStart.y + "500&e=" + kkjStart.x + "500";
      } else {
        url = "http://kartta.hel.fi/";
      }
    } else if (otherMapType == "Google Maps") {
      url = "http://maps.google.com/?ll=" +
        point.lat() +"," + point.lng() + "&z=" + zl;
    } else if (otherMapType == "Nokia Maps") {
      url = "http://maps.nokia.com/#|" +
        point.lat() +"|" + point.lng() + "|" + zl + "|0|0|normal.day?plcsDl=";
    } else if (otherMapType == "Bing Maps") {
      url = "http://www.bing.com/maps/default.aspx?cp=" +
        point.lat() + "~" + point.lng() + "&lvl=" + zl;
    } else if (otherMapType == "OpenStreetMap") {
      url = "http://www.openstreetmap.org/?lat=" +
        point.lat() + "&lon=" + point.lng() + "&zoom=" + zl;
    }

    window.open(url);
  }

  this.zoomToPoint = function(latLng) {
    setCenter(latLng, config.zoomToPointZoomLevel);
  }

  function addHomeButton() {
    var homeButton = document.createElement("div");
    homeButton.id = "homeButton";
    homeButton.className = "homeButton";
    document.getElementById("dynamic_divs").appendChild(homeButton);

    homeButton.title = "Return to initial location";

    homeButton.onclick = function() {
      that.resetLocationAndZoom();
    };
  }

  function initStreetView() {
    var div = document.getElementById("street_view");
    var panoramaOptions = {
      visible: false,
      enableCloseButton: true,
      addressControl: false
    };
    var panorama = new google.maps.StreetViewPanorama(div, panoramaOptions);

    google.maps.event.addListener(panorama, "visible_changed", function() {
      if (panorama.getVisible()) {
        if (div.clientHeight == 0) {
          showStreetView(master.gm);
        }
      }
    });

    google.maps.event.addListener(panorama, "closeclick", function() {
      hideStreetView(master.gm);
    });

    master.gm.setStreetView(panorama);
  }

  function showStreetView(gm) {
    document.getElementById("street_view").style.height =
      (document.getElementById("map_canvas").clientHeight * 0.75) + "px";
    google.maps.event.trigger(gm.getStreetView(), "resize");
    resizeMapCanvas(gm);
    gm.setOptions({panControl: false, zoomControlOptions:
                  {style: google.maps.ZoomControlStyle.SMALL}});
    setCenter(gm.getStreetView().getPosition(), master.gm.getZoom());
  }

  function hideStreetView(gm) {
    document.getElementById("street_view").style.height = "0px";
    google.maps.event.trigger(gm.getStreetView(), "resize");
    resizeMapCanvas(gm);
    gm.setOptions({panControl: true, zoomControlOptions:
                  {style: google.maps.ZoomControlStyle.DEFAULT}});
  }

  this.updateStreetView = function (position) {
    if (document.getElementById("street_view").clientHeight != 0) {
      var svs = new google.maps.StreetViewService();
      svs.getPanoramaByLocation(position, 50, function(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
          var heading = master.tripGraph.getLastDirection();
          master.gm.getStreetView().setPov({heading: heading, zoom: 1, pitch: 0});
          master.gm.getStreetView().setPosition(position);
        }
      });
    }
  }

  this.resizeMap = function () {
    if (master.tripGraph.isVisible()) {
      master.tripGraph.resize();
    } else {
      that.resizeDivs();
    }

    master.trips.showTripsControl();
  }

  this.resizeDivs = function() {
    var oldStreetViewHeight =
      document.getElementById("street_view").clientHeight;

    document.getElementById("street_view").style.height = "0px";

    resizeMapCanvas();

    if (oldStreetViewHeight != 0) {
      showStreetView(master.gm);
    }
  }

  function resizeMapCanvas() {
    document.getElementById("map_canvas").style.height =
      document.documentElement.clientHeight -
      document.getElementById("street_view").clientHeight -
      document.getElementById("trip_graph").clientHeight -
      document.getElementById("trip_graph_control").clientHeight -
      document.getElementById("status_bar").clientHeight -
      document.getElementById("statistics").clientHeight + "px";

    google.maps.event.trigger(master.gm, "resize");
  }

  this.resetLocationAndZoom = function() {
    setCenter(config.initialLatLng, config.initialZL);
  }

  this.init = function() {
    master.gm.setOptions({center: config.initialLatLng,
                          zoom: config.initialZL});
    addMouseListeners();
    addHomeButton();
    initStreetView();

    google.maps.event.addListener(master.gm, "areasInitIsReady", function() {
      updateStatusBar(getInfo(config.initialLatLng));
      setStatistics();
      window.onresize = function() {that.resizeMap()};
      that.resizeMap();
    });
  }
}
