/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

export function Utils() {
    var that = this;

    this.downloadUrl = function (url, callback) {
        var request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                var status = request.status;
                if ((status === 0) || (status === 200)) {
                    console.log('downloaded: %o', url);
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

    this.createControlElement = function (title, text, handler) {
        var a = document.createElement('a');

        a.className = 'control_link';
        a.title = title;
        a.onclick = onClick;
        a.textContent = text;
        a.href = 'javascript:';

        return a;

        function onClick() {
            a.className = 'progress';
            handler();
        }
    };

    this.createHideElement = function (className) {
        var hideElement = document.createElement('span');
        hideElement.className = className;
        hideElement.textContent = '\u274C';
        return hideElement;
    };

    this.getUrlParams = function () {
        var params = {};
        if (document.URL.indexOf('?') !== -1) {
            var addressParams = document.URL.split('?');
            if (addressParams.length === 2) {
                var nameValues = addressParams[1].split('&');
                for (var i = 0; i < nameValues.length; i++) {
                    var nameValue = nameValues[i].split('=');
                    if (nameValue.length === 2) {
                        params[nameValue[0]] = nameValue[1];
                    } else {
                        console.error('unexpected URL parameter: %o', nameValues[i]);
                    }
                }
            } else {
                console.error('unexpected URL parameters: %o', document.URL);
            }
        }
        return params;
    };
}
