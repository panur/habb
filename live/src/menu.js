/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-14 */

function Menu(master) {
  var that = this; /* http://javascript.crockford.com/private.html */
  var state = getState();

  function getState() {
    var s = {};

    s.selectedMenuItem = "";

    return s;
  }

  this.init = function () {
    google.maps.event.clearListeners(master.gm, "click");

    google.maps.event.addListener(master.gm, "click", function (mouseEvent) {
      if (document.getElementById("menu")) {
        hideMenu();
      } else {
        var menuItems = ["Open...", "Areas...", "Trips...", "Zoom"];
        showMenu(mouseEvent.latLng, getMenuLocation(mouseEvent.pixel),
                 menuItems, "menu");
      }

      function getMenuLocation(pixel) {
        var menuLocation = {};

        if (pixel.y > (window.innerHeight / 2)) {
          menuLocation.bottom = (window.innerHeight - pixel.y) + "px";
        } else {
          menuLocation.top = pixel.y + "px";
        }
        if (pixel.x > (window.innerWidth / 2)) {
          menuLocation.right = (window.innerWidth - pixel.x) + "px";
        } else {
          menuLocation.left = pixel.x + "px";
        }

        return menuLocation;
      }
    });
  }

  function hideMenu() {
    var parent = document.getElementById("dynamic_divs");
    parent.removeChild(document.getElementById("menu"));
    hideSubMenu();
  }

  function hideSubMenu() {
    var parent = document.getElementById("dynamic_divs");
    if (parent) {
      if (document.getElementById("subMenu")) {
        parent.removeChild(document.getElementById("subMenu"));
      }
    }
  }

  function showMenu(latLng, menuLocation, menuItems, divId) {
    var menu = document.createElement("div");
    menu.id = divId;
    menu.className = "menu";
    menu.appendChild(createMenuTable(latLng, menuItems));

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

  function createMenuTable(latLng, menuItems) {
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
        selectMenuItem(rowElement);

        if (isMenuItem(rowElement)) {
          state.selectedMenuItem = rowElement.textContent;
          hideSubMenu();
          var subMenuItems = [];

          if (rowElement.textContent == "Open...") {
            subMenuItems = ["Kansalaisen karttapaikka", "kartta.hel.fi",
                            "Google Maps", "Nokia Maps", "Bing Maps",
                            "OpenStreetMap"];
          } else if (rowElement.textContent == "Areas...") {
            subMenuItems = master.areas.getMenuItems();
          } else if (rowElement.textContent == "Trips...") {
            subMenuItems = master.trips.getMenuItems();
          }

          if (subMenuItems.length > 0) {
            showMenu(latLng, getSubMenuLocation(rowElement), subMenuItems,
                     "subMenu");
          }
        }

        function getSubMenuLocation(rowElement) {
          var rect = rowElement.getBoundingClientRect();
          var subMenuLocation = {};

          if (rect.top > (window.innerHeight / 2)) {
            subMenuLocation.bottom = (window.innerHeight - rect.bottom) + "px";
          } else {
            subMenuLocation.top = rect.top + "px";
          }
          if (rect.right > (window.innerWidth / 2)) {
            subMenuLocation.right = (window.innerWidth - rect.left) + "px";
          } else {
            subMenuLocation.left = rect.right + "px";
          }

          return subMenuLocation;
        }

        function selectMenuItem(rowElement) {
          var rows = rowElement.parentNode.parentNode.rows;
          for (var i = 0; i < rows.length; i++) {
            rows[i].className = "menuItem";
          }
          rowElement.className = "selectedMenuItem";
        }

      }

      function isMenuItem(rowElement) {
        var node = rowElement;
        while (node = node.parentNode) {
          if (node.nodeName == "DIV") {
            return node.id == "menu";
          }
        }
      }

      function processMenuClick(rowElement) {
        if (isMenuItem(rowElement)) {
          if (rowElement.textContent == "Zoom") {
            hideMenu();
            master.map.zoomToPoint(latLng);
          }
        } else {
          hideMenu();

          if (state.selectedMenuItem == "Open...") {
            master.map.openOtherMap(rowElement.textContent, latLng);
          } else if (state.selectedMenuItem == "Areas...") {
            master.areas.processMenuCommand(rowElement.textContent);
          } else if (state.selectedMenuItem == "Trips...") {
            master.trips.processMenuCommand(rowElement.textContent);
          } else {
            alert("Error: unknown menu item: " + state.selectedMenuItem);
          }
        }
      }
    }

    return table;
  }
}