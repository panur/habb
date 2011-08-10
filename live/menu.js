/* Author: Panu Ranta, panu.ranta@iki.fi, last updated 2011-08-10 */

function Menu(master) {
  var that = this; /* http://javascript.crockford.com/private.html */
  var config = getConfig();

  function getConfig() {
    var c = {};

    c.selectedMenuItem = "";

    return c;
  }

  this.init = function() {
    google.maps.event.clearListeners(master.gm, "click");

    google.maps.event.addListener(master.gm, "click", function(mouseEvent) {
      if (document.getElementById("menu")) {
        hideMenu();
      } else {
        var menuItems = ["Open...", "Areas...", "Zoom"];
        showMenu(mouseEvent.latLng, getMenuLocation(mouseEvent.pixel), menuItems,
                 "menu");
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
      row.onmouseover = function() {processMouseOver(row);};
      row.onclick = function () {processMenuClick(row);};

      function processMouseOver(rowElement) {
        selectMenuItem(rowElement);

        if (isMenuItem(rowElement)) {
          config.selectedMenuItem = rowElement.textContent;

          if (rowElement.textContent == "Open...") {
            var subMenuItems = ["Kansalaisen karttapaikka", "kartta.hel.fi",
                                "Google Maps", "Nokia Maps", "Bing Maps",
                                "OpenStreetMap"];
            hideSubMenu();
            showMenu(latLng, getSubMenuLocation(rowElement), subMenuItems,
                     "subMenu");
          } else if (rowElement.textContent == "Areas...") {
            var subMenuItems = ["Toggle opacity", "Toggle extensions",
                                "Set end of 2008", "Set end of 2009",
                                "Set latest"];
            hideSubMenu();
            showMenu(latLng, getSubMenuLocation(rowElement), subMenuItems,
                     "subMenu");
          } else {
            hideSubMenu();
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

          if (config.selectedMenuItem == "Open...") {
            master.map.openOtherMap(rowElement.textContent, latLng);
          } else if (config.selectedMenuItem == "Areas...") {
            if (rowElement.textContent == "Toggle opacity") {
              master.areas.toggleOpacity();
            } else if (rowElement.textContent == "Toggle extensions") {
              master.areas.toggleShowExtensions();
            } else if (rowElement.textContent == "Set end of 2008") {
              master.areas.changeVisitedData(2008);
            } else if (rowElement.textContent == "Set end of 2009") {
              master.areas.changeVisitedData(2009);
            } else if (rowElement.textContent == "Set latest") {
              master.areas.changeVisitedData("latest");
            } else {
              alert("Error: unknown area command: " + rowElement.textContent);
            }
          } else {
            alert("Error: unknown menu item: " + config.selectedMenuItem);
          }
        }
      }
    }

    return table;
  }
}
