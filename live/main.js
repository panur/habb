/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-10 */

function main() {
  /* note: master must not be modified outside of this function */
  var master = {};
  var mOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControlOptions:
      {style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR},
    zoomControlOptions: {style: google.maps.ZoomControlStyle.DEFAULT},
    panControl: true,
    zoomControl: true,
    scaleControl: true,
    streetViewControl: true
  };

  master.gm =
    new google.maps.Map(document.getElementById("map_canvas"), mOptions);
  master.map = new Map(master);
  master.map.init();
  master.utils = new Utils();
  master.areas = new Areas(master);
  master.areas.init();

  master.trips = new Trips(master);
  master.trips.init();
  master.tripGraph = new TripGraph(master);

  initMenu(master);
}
