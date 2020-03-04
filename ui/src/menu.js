/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

'use strict';

function Menu(master) {
    var that = this;
    var state = getState();

    function getState() {
        var s = {};

        s.selectedParentMenuItem = "";
        s.selectedMenuItem = "";

        return s;
    }

    this.init = function () {
        var downStartTime;

        master.mapApi.removeListeners("mousedown");
        master.mapApi.removeListeners("mouseup");

        master.mapApi.addListener("mousedown", function () {
            downStartTime = Date.now();
        });

        master.mapApi.addListener("mouseup", function (mouseEvent) {
            if (document.getElementById("menu")) {
                hideMenu();
            } else {
                var downDurationMs = Date.now() - downStartTime;
                if (downDurationMs > 150) {
                    return; // probably drag or drop but not click
                }
                if (master.areas.isVisitedAreaEditorActive(mouseEvent)) {
                    return;
                }
                var menuItems = ["Open...", "Areas...", "Trips...", "Zoom", "Home"];
                var mouseEventPixel = master.mapApi.getMouseEventPixel(mouseEvent);
                var rect = {"top": mouseEventPixel.y, "bottom": mouseEventPixel.y,
                            "left": mouseEventPixel.x, "right": mouseEventPixel.x};
                showMenu(master.mapApi.getMouseEventLatLng(mouseEvent), getMenuLocation(rect),
                         menuItems, "menu");
            }
        });
    };

    function getMenuLocation(rect) {
        var menuLocation = {};

        if (rect.top > (window.innerHeight / 2)) {
            menuLocation.bottom = (window.innerHeight - rect.bottom) + "px";
        } else {
            menuLocation.top = rect.top + "px";
        }
        if (rect.right > (window.innerWidth / 2)) {
            menuLocation.right = (window.innerWidth - rect.left) + "px";
        } else {
            menuLocation.left = rect.right + "px";
        }

        return menuLocation;
    }

    function hideMenu() {
        hideSubMenu("menu");
    }

    function hideSubMenu(baseDivId) {
        var parent = document.getElementById("dynamic_divs");
        if (parent) {
            for (var divId = baseDivId; true; divId = "sub" + divId) {
                if (document.getElementById(divId)) {
                    parent.removeChild(document.getElementById(divId));
                } else {
                    break;
                }
            }
        }
    }

    function showMenu(latLng, menuLocation, menuItems, divId) {
        var menu = document.createElement("div");
        menu.id = divId;
        menu.className = "menu";
        menu.appendChild(createMenuTable(latLng, menuItems, divId));

        if (menuLocation.bottom) {
            menu.style.bottom = menuLocation.bottom;
        }
        if (menuLocation.top) {
            menu.style.top = menuLocation.top;
        }
        if (menuLocation.right) {
            menu.style.right = menuLocation.right;
        }
        if (menuLocation.left) {
            menu.style.left = menuLocation.left;
        }

        document.getElementById("dynamic_divs").appendChild(menu);
    }

    function createMenuTable(latLng, menuItems, divId) {
        var table = document.createElement("table");
        table.className = "menu";

        for (var i = 0; i < menuItems.length; i++) {
            createRow(menuItems[i]);
        }

        function createRow(menuItem) {
            var row = table.insertRow(-1);
            var cell = row.insertCell(-1);
            cell.appendChild(document.createTextNode(menuItem));
            row.className = "menuItem";
            row.onmouseover = function () {processMouseOver(row);};
            row.onclick = function () {processMenuClick(row);};

            function processMouseOver(rowElement) {
                var subMenuItems = getSubMenuItems();
                selectMenuItem();
                hideSubMenu("sub" + divId);

                if (subMenuItems.length > 0) {
                    state.selectedParentMenuItem = rowElement.textContent;
                    state.selectedMenuItem = "";
                    var rect = rowElement.getBoundingClientRect();
                    showMenu(latLng, getMenuLocation(rect), subMenuItems, "sub" + divId);
                } else {
                    state.selectedMenuItem = rowElement.textContent;
                }

                function getSubMenuItems() {
                    var subMenuItems = [];

                    if (rowElement.textContent === "Open...") {
                        subMenuItems = ["MML",
                                        "Google Maps", "HERE Maps", "Bing Maps", "OpenStreetMap"];
                    } else if (rowElement.textContent === "Areas...") {
                        subMenuItems = master.areas.getMenuItems();
                    } else if (rowElement.textContent === "Edit visited...") {
                        subMenuItems = master.areas.getEditMenuItems();
                    } else if (rowElement.textContent === "View...") {
                        subMenuItems = master.areas.getViewMenuItems();
                    } else if (rowElement.textContent === "Trips...") {
                        subMenuItems = master.trips.getMenuItems();
                    } else if (rowElement.textContent === "Show...") {
                        subMenuItems = master.trips.getShowMenuItems();
                    } else if (rowElement.textContent === "Hide...") {
                        subMenuItems = master.trips.getHideMenuItems();
                    }

                    return subMenuItems;
                }

                function selectMenuItem() {
                    var rows = rowElement.parentNode.parentNode.rows;
                    for (var i = 0; i < rows.length; i++) {
                        rows[i].className = "menuItem";
                    }
                    rowElement.className = "selectedMenuItem";
                }
            }

            function processMenuClick(rowElement) {
                if (state.selectedMenuItem === "Zoom") {
                    hideMenu();
                    master.map.zoomToPoint(latLng);
                } else if (state.selectedMenuItem === "Home") {
                    hideMenu();
                    master.map.resetLocationAndZoom();
                } else if (state.selectedMenuItem !== "") {
                    hideMenu();

                    if (state.selectedParentMenuItem === "Open...") {
                        master.map.openOtherMap(rowElement.textContent, latLng);
                    } else if ((state.selectedParentMenuItem === "Areas...") ||
                               (state.selectedParentMenuItem === "Edit visited...") ||
                               (state.selectedParentMenuItem === "View...")) {
                        master.areas.processMenuCommand(rowElement.textContent);
                    } else if ((state.selectedParentMenuItem === "Trips...") ||
                               (state.selectedParentMenuItem === "Show...") ||
                               (state.selectedParentMenuItem === "Hide...")) {
                        master.trips.processMenuCommand(state.selectedParentMenuItem,
                                                        rowElement.textContent);
                    } else {
                        alert("Error: unknown menu item: " + state.selectedParentMenuItem);
                    }
                }
            }
        }

        return table;
    }
}
