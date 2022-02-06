/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

import { MapApi } from './map_api.js';
import { Utils } from './utils.js';
import { TripGraph } from './tripGraph.js';
import { Trips } from './trips.js';
import { UiMap } from './ui_map.js';
import { Areas } from './areas.js';
import { Menu } from './menu.js';

async function main() {
    var master = {};

    master.mapApi = new MapApi();
    await master.mapApi.init('map_canvas');

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

document.addEventListener('DOMContentLoaded', main);
