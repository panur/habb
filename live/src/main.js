/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2013-10-18 */

function main() {
  /* note: master must not be modified outside of this function */
  var master = {};
  var gmElement = document.getElementById("map_canvas");
  var gmOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControlOptions:
      {style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR},
    zoomControlOptions: {style: google.maps.ZoomControlStyle.DEFAULT},
    panControl: true,
    zoomControl: true,
    scaleControl: true,
    streetViewControl: true,
    styles: [{
      featureType: "road.arterial",
      elementType: "geometry.fill",
      stylers: [{color: "#FBF8A5" }]
    }]
  };

  master.gm = new google.maps.Map(gmElement, gmOptions);

  master.utils = new Utils();
  master.tripGraph = new TripGraph(master);

  master.trips = new Trips(master);
  master.trips.init();

  master.map = new Map(master);
  master.map.init();

  master.areas = new Areas(master);
  master.areas.init();

  var menu = new Menu(master);
  menu.init();
}
