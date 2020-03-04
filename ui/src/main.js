/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

'use strict';

function main() {
    var master = {};

    master.mapApi = new MapApi();
    master.mapApi.init('map_canvas');

    master.utils = new Utils();
    master.tripGraph = new TripGraph(master);

    master.trips = new Trips(master);
    master.trips.init();

    master.uiMap = new UiMap(master);
    master.uiMap.init();

    master.areas = new Areas(master);
    master.areas.init();

    var menu = new Menu(master);
    menu.init();
}
