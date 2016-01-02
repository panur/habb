/* Author: Panu Ranta, panu.ranta@iki.fi, http://14142.net/habb/about.html */

'use strict';

function Utils() {
    var that = this;

    this.downloadUrl = function (url, callback) {
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                var status = request.status;
                if ((status === 0) || (status === 200)) {
                    callback(request.responseText, status);
                    request.onreadystatechange = function () {};
                }
            }
        };

        request.open('GET', url, true);
        if (url.indexOf('.json') !== -1) {
            request.overrideMimeType('application/json');
        }
        request.send();
    };

    this.parseXml = function (string) {
        if (window.ActiveXObject) {
            var doc = new ActiveXObject('Microsoft.XMLDOM');
            doc.loadXML(string);
            return doc;
        } else if (window.DOMParser) {
            return (new DOMParser).parseFromString(string, 'text/xml');
        }
    };

    // For '#$%1~!$2!~!!$3' return [0, 1, 2, 14, 91, 92, 15, 182, 183, 16].
    this.stringToIntegerList = function (string) {
        var integerList = [];
        var integerValue = 0;
        var multChr = 33; // 33='!'
        var minChr = 35;  // 35='#', not 34='"' because it takes three characters in JSON
        var maxChr = 126; // 126='~'
        var maxValue = maxChr - minChr;
        for (var i = 0; i < string.length; i++) {
            var charCode = string.charCodeAt(i);
            if (charCode === multChr) {
                integerValue += maxValue;
            } else {
                integerValue += charCode - minChr;
                integerList.push(integerValue);
                integerValue = 0;
            }
        }
        return integerList;
    };

    this.resizeArray = function (originalArray, newArray, newSize) {
        if (newSize < originalArray.length) {
            downsampleArray(originalArray, newArray, newSize);
        } else {
            for (var x = 0; x < newSize; x++) {
                var newX = Math.floor((x / newSize) * originalArray.length);
                newArray.push(originalArray[newX]);
            }
        }
    };

    function downsampleArray(originalArray, newArray, newSize) {
        var xRatio = Math.round(originalArray.length / newSize);
        var middleX = 0;
        var lowX = 0;
        var highX = 0;
        var newY = 0;

        for (var x = 0; x < newSize; x++) {
            middleX = Math.round((x / newSize) * originalArray.length);
            lowX = Math.round(middleX - (xRatio / 2));
            highX = Math.round(middleX + (xRatio / 2));
            newY = 0;

            if ((lowX > 0) && (highX < originalArray.length)) {
                for (var i = 0; i < xRatio; i++) {
                    newY += originalArray[lowX + i];
                }
                newY = newY / xRatio;
            } else {
                newY = originalArray[middleX];
            }

            newY = Math.round(newY);
            newArray.push(newY);
        }
    }

    this.getTimeString = function (seconds) {
        var date = new Date(Math.round(seconds) * 1000);
        var timeString = date.toISOString(); // YYYY-MM-DDTHH:mm:ss.sssZ
        return timeString.substr(11, 8); // HH:mm:ss
    };

    this.getHeading = function (point, polyline, zoom) {
        var tolerances = [0.0001, 391817 * Math.pow(0.445208, zoom)];

        for (var t = 0; t < tolerances.length; t++) {
            for (var i = 0; i < polyline.getPath().length - 1; i++) {
                var p1 = polyline.getPath().getAt(i);
                var p2 = polyline.getPath().getAt(i + 1);

                if (isPointInLineSegment(point, p1, p2, tolerances[t]) === true) {
                    return computeHeading(p1, p2);
                }
            }
        }

        return -1;

        function isPointInLineSegment(point, p1, p2, tolerance) {
            var distance =
                Math.abs(getDistance(point, p1) + getDistance(point, p2) - getDistance(p1, p2));
            return (distance < tolerance);

            function getDistance(from, to) {
                return google.maps.geometry.spherical.computeDistanceBetween(from, to);
            }
        }

        function computeHeading(from, to) {
            var heading = google.maps.geometry.spherical.computeHeading(from, to);

            if (heading < 0) {
                heading += 360;
            }

            heading = Math.round(heading / 3) * 3;

            return heading;
        }
    };

    this.createDirectionMarker = function (point, heading) {
        var direction = getLineDirection(heading);
        var image = {
            url: "http://www.google.com/mapfiles/dir_" + direction + ".png",
            size: new google.maps.Size(24, 24),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(12, 12)
        };

        return new google.maps.Marker({
            position: point,
            icon: image
        });

        function getLineDirection(heading) {
            var direction = heading;

            while (direction >= 120) {
                direction -= 120;
            }

            return direction;
        }
    };

    this.createControlElement = function (title, text, handler) {
        var a = document.createElement("a");

        a.title = title;
        a.onclick = handler;
        a.textContent = text;
        a.href = "javascript:";

        return a;
    };

    this.createHideElement = function (className) {
        var img = document.createElement("img");

        img.className = className;
        img.src = "http://maps.google.com/mapfiles/iw_close.gif";

        return img;
    };
}
