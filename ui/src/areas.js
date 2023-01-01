/* Author: Panu Ranta, panu.ranta@iki.fi, https://14142.net/habb/about.html */

export function Areas(master) {
    var that = this;
    var state = getState('extended');

    function getState(gridType) {
        var s = {};

        s.gridType = gridType;
        s.isShown = true;
        s.isVisitedAreaEditorActive = false;
        s.visitedAreaEditorEventListener = null;

        s.filenames = {
            'points': 'generated_points.json',
            'visitedDatas': {
                '2008': 'visited_datas/2008.json',
                '2009': 'visited_datas/2009.json',
                '2010': 'visited_datas/2010.json',
                '2011': 'visited_datas/2011.json',
                '2012': 'visited_datas/2012.json',
                '2013': 'visited_datas/2013.json',
                '2014': 'visited_datas/2014.json',
                '2015': 'visited_datas/2015.json',
                '2016': 'visited_datas/2016.json',
                '2017': 'visited_datas/2017.json',
                '2018': 'visited_datas/2018.json',
                '2019': 'visited_datas/2019.json',
                '2020': 'visited_datas/2020.json',
                '2021': 'visited_datas/2021.json',
                '2022': 'visited_datas/2022.json',
                'latest': 'visited_datas/latest.json'
            }
        };
        s.filenames.visitedData = s.filenames.visitedDatas['latest'];

        s.area = {
            'opacity': 0.5,
            'opacityLow': 0.2,
            'opacityHigh': 0.5,
            'colors': {'yes': '#00FF00', 'no': '#FF0000', 'np': '#808080'}
        };
        s.grid = {
            'weight': 1,
            'opacity': 0.5,
            'colors': {'page': '#000000', 'km2': '#FFFFFF'},
            'latPolylines': [],
            'lngPolylines': []
        };
        s.cursorParams = {
            'strokeColor': '#000000',
            'strokeWeight': 2,
            'strokeOpacity': 1,
            'maxZoomLevel': 15,
            'kkj': '-'
        };
        s.latKmPerP = 5;
        s.lngKmPerP = 4;
        s.kkjOffset = {'lat': -1, 'lng': -1}; /* will be read from file */

        if (s.gridType === 'original') {
            s.latPages = 7;
            s.lngPages = 9;
            s.kkjStart = {'lat': 65, 'lng': 30};

            s.lats = [{'n': 5,  'lngOffsetKm': 4,  'latOffsetKm': 0,  'lengthP': 2},
                      {'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 5,  'lengthP': 8},
                      {'n': 11, 'lngOffsetKm': 0,  'latOffsetKm': 10, 'lengthP': 9},
                      {'n': 10, 'lngOffsetKm': 4,  'latOffsetKm': 21, 'lengthP': 8},
                      {'n': 5,  'lngOffsetKm': 12, 'latOffsetKm': 31, 'lengthP': 2},
                      {'n': 5,  'lngOffsetKm': 24, 'latOffsetKm': 31, 'lengthP': 2}];

            s.lngs = [{'n': 4, 'lngOffsetKm': 0,  'latOffsetKm': 5,  'lengthP': 3},
                      {'n': 8, 'lngOffsetKm': 4,  'latOffsetKm': 0,  'lengthP': 6},
                      {'n': 1, 'lngOffsetKm': 12, 'latOffsetKm': 0,  'lengthP': 7},
                      {'n': 8, 'lngOffsetKm': 13, 'latOffsetKm': 5,  'lengthP': 6},
                      {'n': 3, 'lngOffsetKm': 21, 'latOffsetKm': 5,  'lengthP': 5},
                      {'n': 9, 'lngOffsetKm': 24, 'latOffsetKm': 5,  'lengthP': 6},
                      {'n': 4, 'lngOffsetKm': 33, 'latOffsetKm': 10, 'lengthP': 4}];

            s.pages = ['0',  '1',  '2',  '0',  '0',  '0',  '0',  '0',  '0',
                       '3',  '4',  '5',  '6',  '7',  '8',  '9', '10',  '0',
                      '11', '12', '13', '14', '15', '16', '17', '18', '19',
                      '20', '21', '22', '23', '24', '25', '26', '27', '28',
                       '0', '29', '30', '31', '32', '33', '34', '35', '36',
                       '0', '37', '38', '39', '40', '41', '42', '43', '44',
                       '0',  '0',  '0', '45', '46',  '0', '47', '48'];
        } else {  // extended or 10k
            s.filenames.points = 'generated_points_ext.json';
            s.latPages = 18;
            s.lngPages = 22;
            s.kkjStart = {'lat': 60, 'lng': 6};

            s.lats = [{'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 0,  'lengthP': 8},
                      {'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 5,  'lengthP': 9},
                      {'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 10, 'lengthP': 14},
                      {'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 15, 'lengthP': 16},
                      {'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 20, 'lengthP': 17},
                      {'n': 5,  'lngOffsetKm': 0,  'latOffsetKm': 25, 'lengthP': 21},
                      {'n': 61, 'lngOffsetKm': 0,  'latOffsetKm': 30, 'lengthP': 22}];

            s.lngs = [{'n': 33, 'lngOffsetKm': 0,  'latOffsetKm': 0,  'lengthP': 18},
                      {'n': 4,  'lngOffsetKm': 33, 'latOffsetKm': 5,  'lengthP': 17},
                      {'n': 20, 'lngOffsetKm': 37, 'latOffsetKm': 10, 'lengthP': 16},
                      {'n': 8,  'lngOffsetKm': 57, 'latOffsetKm': 15, 'lengthP': 15},
                      {'n': 4,  'lngOffsetKm': 65, 'latOffsetKm': 20, 'lengthP': 14},
                      {'n': 16, 'lngOffsetKm': 69, 'latOffsetKm': 25, 'lengthP': 13},
                      {'n': 4,  'lngOffsetKm': 85, 'latOffsetKm': 30, 'lengthP': 12}];

            s.pages = ['181',  '96',  '81',  '57',  '58',  '59',  '60',  '61',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',
                       '182',  '97',  '82',  '49',   'a',   'A',   'B',   '1',   '2',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',
                       '183',  '98',  '83',  '50',   'b',   'C',   '3',   '4',   '5',   '6',   '7',   '8',   '9',  '10',   '0',   '0',   '0',   '0',   '0',   '0',   '0',   '0',
                       '184',  '99',  '84',  '51',   'c',   'D',  '11',  '12',  '13',  '14',  '15',  '16',  '17',  '18',  '19',   'E',   '0',   '0',   '0',   '0',   '0',   '0',
                       '185', '100',  '85',  '52',   'd',   'F',  '20',  '21',  '22',  '23',  '24',  '25',  '26',  '27',  '28',   'G',  '62',   '0',   '0',   '0',   '0',   '0',
                       '186', '101',  '86',  '53',   'e',   'H',   'I',  '29',  '30',  '31',  '32',  '33',  '34',  '35',  '36',   'J',  '63',  '91', '123', '129', '154',   '0',
                       '187', '102',  '87',  '54',   'f',   'K',   'L',  '37',  '38',  '39',  '40',  '41',  '42',  '43',  '44',   'M',  '64',  '92', '124', '130', '155', '222',
                       '188', '103',  '88',  '55',   'g',   'N',   'O',   'P',   'Q',  '45',  '46',   'R',  '47',  '48',   'S',   'T',  '65',  '93', '125', '131', '156', '221',
                       '189', '104',  '89',  '56',   'h',   'i',   'j',   'k',   'l',   'm',   'n',   'o',   'p',   'q',   'r',   's',  '66',  '94', '126', '132', '157', '220',
                       '190', '105',  '90',  '67',  '68',  '69',  '70',  '71',  '72',  '73',  '74',  '75',  '76',  '77',  '78',  '79',  '80',  '95', '127', '133', '158', '219',
                       '191', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '128', '134', '159', '218',
                       '192', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148', '149', '150', '151', '152', '153', '160', '217',
                       '193', '161', '162', '163', '164', '165', '166', '167', '168', '169', '170', '171', '172', '173', '174', '175', '176', '177', '178', '179', '180', '216',
                       '194', '195', '196', '197', '198', '199', '200', '201', '202', '203', '204', '205', '206', '207', '208', '209', '210', '211', '212', '213', '214', '215',
                       '223', '224', '225', '226', '227', '228', '229', '230', '231', '232', '233', '234', '235', '236', '237', '238', '239', '240', '241', '242', '243', '244',
                       '245', '246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257', '258', '259', '260', '261', '262', '263', '264', '265', '266',
                       '267', '268', '269', '270', '271', '272', '273', '274', '275', '276', '277', '278', '279', '280', '281', '282', '283', '284', '285', '286', '287', '288',
                       '289', '290', '291', '292', '293', '294', '295', '296', '297', '298', '299', '300', '301', '302', '303', '304', '305', '306', '307', '308', '309', '310'];

            if (s.gridType === '10k') {
                var extendedPages = getExtendedPages(s);
                s.filenames.points = 'generated_points_10k.json';
                s.latPages = 21;
                s.lngPages = 24;
                s.kkjStart = {'lat': 60, 'lng': 2};
                s.lats = [{'n': 106, 'lngOffsetKm': 0, 'latOffsetKm': 0, 'lengthP': 24}];
                s.lngs = [{'n': 97, 'lngOffsetKm': 0, 'latOffsetKm': 0, 'lengthP': 21}];
                s.pages = get10kPages(s, extendedPages);
            }
        }

        return s;
    }

    function getExtendedPages(state) {
        var extendedPages = new Map();
        for (var lat = 0; lat < state.latPages; lat++) {
            for (var lng = 0; lng < state.lngPages; lng++) {
                var key = getPageMapKey(state, lat, lng);
                extendedPages.set(key, state.pages[(lat * state.lngPages) + lng]);
            }
        }
        return extendedPages;
    }

    function getPageMapKey(state, lat, lng) {
        return (state.kkjStart.lat + (lat * state.latKmPerP)) + '/' +
            (state.kkjStart.lng + (lng * state.lngKmPerP));
    }

    function get10kPages(state, extendedPages) {
        var pages = [];
        for (var lat = 0; lat < state.latPages; lat++) {
            for (var lng = 0; lng < state.lngPages; lng++) {
                var key = getPageMapKey(state, lat, lng);
                if (extendedPages.has(key)) {
                    var pageValue = extendedPages.get(key);
                } else {
                    var pageValue = '?';
                }
                pages.push(pageValue);
            }
        }
        return pages;
    }

    this.init = function () {
        master.mapApi.addListener('pointsAreInState', function () {
            setKm2sToState();
        });

        master.mapApi.addListener('km2sAreInState', function () {
            updateMapGrid();
            state.visitedStatusAreas = getVisitedStatusAreas();
            addOverlaysToMap();
            master.mapApi.triggerEvent('areasInitIsReady');
        });

        setPointsToState();
    };

    function setPointsToState() {
        var points = [];

        for (var y = 0; y <= (state.latPages * state.latKmPerP); y++) {
            points[y] = [];
            for (var x = 0; x < (state.lngPages * state.lngKmPerP); x++) {
                points[y][x] = '-';
            }
        }

        master.utils.downloadUrl(state.filenames.points, function (data, responseCode) {
            var p = JSON.parse(data);
            state.kkjOffset.lat = p[0]['kkj_lat'];
            state.kkjOffset.lng = p[0]['kkj_lng'];

            for (var i = 0; i < p.length; i++) {
                var y = p[i]['kkj_lat'] - state.kkjOffset.lat;
                var x = p[i]['kkj_lng'] - state.kkjOffset.lng;
                var lat = p[i]['lat'];
                var lng = p[i]['lng'];
                points[y][x] = master.mapApi.newLatLng(lat, lng);
            }

            state.points = points;
            master.mapApi.triggerEvent('pointsAreInState');
        });
    }

    function setKm2sToState() {
        var km2s = [];

        for (var y = 0; y < (state.latPages * state.latKmPerP); y++) {
            km2s[y] = [];
            for (var x = 0; x < (state.lngPages * state.lngKmPerP); x++) {
                var points = [state.points[y][x], state.points[y][x + 1],
                              state.points[y + 1][x + 1], state.points[y + 1][x],
                              state.points[y][x]];
                km2s[y][x] = {};
                km2s[y][x].points = points;
                km2s[y][x].visited = '-';
            }
        }

        state.km2s = km2s;

        setVisitedDataToKm2s();
    }

    function setVisitedDataToKm2s() {
        master.utils.downloadUrl(state.filenames.visitedData, function (data, responseCode) {
            var pages = JSON.parse(data);
            var allInPage = [];

            for (var i = 0; i < pages.length; i++) {
                if (pages[i]['visited'] === 'all') {
                    if ((state.gridType !== 'original') || (pages[i]['page'] < 49)) {
                        allInPage.push(pages[i]['page']);
                    }
                }
            }

            for (var i = 0; i < allInPage.length; i++) {
                var page = state.pages.indexOf(allInPage[i]);
                var initY = Math.floor(page / state.lngPages) * state.latKmPerP;
                var initX = (page % state.lngPages) * state.lngKmPerP;

                for (var y = 0; y < state.latKmPerP; y++) {
                    for (var x = 0; x < state.lngKmPerP; x++) {
                        state.km2s[initY + y][initX + x].visited = 'yes';
                    }
                }
            }

            for (var i = 0; i < pages.length; i++) {
                if (pages[i]['visited'] !== 'all') {
                    var y = parseInt(pages[i]['lat']) - state.kkjStart.lat;
                    var x = parseInt(pages[i]['lng']) - state.kkjStart.lng;

                    if ((state.gridType !== 'original') || (pages[i]['page'] < 49)) {
                        state.km2s[y][x].visited = pages[i]['visited'];
                    }
                }
            }

            master.mapApi.triggerEvent('km2sAreInState');
        });
    }

    function updateMapGrid() {
        state.grid.latPolylines = [];
        state.grid.lngPolylines = [];

        for (var i = 0, lines = 0; i < state.lats.length; i++) {
            for (var j = 0; j < state.lats[i].n; j++) {
                var lat = state.lats[i].latOffsetKm + j;
                var points = [];
                for (var k = 0; k <= (state.lats[i].lengthP * state.lngKmPerP); k++) {
                    points.push(state.points[lat][state.lats[i].lngOffsetKm + k]);
                }
                var color = ((lines++ % state.latKmPerP) === 0) ?
                    state.grid.colors.page : state.grid.colors.km2;
                var polylineOptions = {
                    'color': color,
                    'weight': state.grid.weight,
                    'opacity': state.grid.opacity,
                    'clickable': false,
                    'zIndex': 1
                };
                var lat = master.mapApi.newPolyline(points, polylineOptions);
                state.grid.latPolylines.push(lat);
            }
        }

        for (var i = 0, lines = 0; i < state.lngs.length; i++) {
            for (var j = 0; j < state.lngs[i].n; j++) {
                var lng = state.lngs[i].lngOffsetKm + j;
                var points = [];
                for (var k = 0; k <= (state.lngs[i].lengthP * state.latKmPerP); k++) {
                    points.push(state.points[state.lngs[i].latOffsetKm + k][lng]);
                }

                var color = ((lines++ % state.lngKmPerP) === 0) ?
                    state.grid.colors.page : state.grid.colors.km2;
                var polylineOptions = {
                    'color': color,
                    'weight': state.grid.weight,
                    'opacity': state.grid.opacity,
                    'clickable': false,
                    'zIndex': 1
                };
                var lng = master.mapApi.newPolyline(points, polylineOptions);
                state.grid.lngPolylines.push(lng);
            }
        }
    }

    function getVisitedStatusAreas() {
        var polygonGroups = {};
        polygonGroups.np = getPolygonGroup('np');
        polygonGroups.no = getPolygonGroup('no');
        polygonGroups.yes = getPolygonGroup('yes');
        var polygons = [];
        polygons = polygons.concat(polygonGroups.no);
        polygons = polygons.concat(polygonGroups.np);
        var visitedStatusAreas = [];

        for (var i = 0; i < polygons.length; i++) {
            if (isPolygonInPolygons(polygons[i], polygonGroups.yes)) {
                polygonGroups.yes.push(polygons[i]);
            }
        }

        for (var i in polygonGroups) {
            var paths = [];
            for (var j = 0; j < polygonGroups[i].length; j++) {
                paths.push(polygonGroups[i][j]);
            }

            var polygonOptions = {
                'strokeColor': state.area.colors[i],
                'strokeWeight': 1,
                'strokeOpacity': 0.5,
                'fillColor': state.area.colors[i],
                'fillOpacity': state.area.opacity,
                'clickable': false,
                'zIndex': 1
            };
            var polygon = master.mapApi.newPolygon(paths, polygonOptions);
            visitedStatusAreas.push(polygon);
        }

        return visitedStatusAreas;
    }

    function getPolygonGroup(visitedStatus) {
        var polygons = [];
        var params = {
            'visitedStatus': visitedStatus,
            'km2NeedsToBeTested': getKm2sInMap()
        };

        for (var y = 0; y < state.km2s.length; y++) {
            for (var x = 0; x < state.km2s[y].length; x++) {
                if ((state.km2s[y][x].visited === visitedStatus) &&
                    (params.km2NeedsToBeTested[y][x] === true) &&
                    (isPointInPolygons(state.points[y][x], polygons) === false)) {
                    var points = [];

                    params.initXY = {y:y, x:x};

                    getPolylinePoints(y, x, 'right', points, params);

                    var splittedLoops = splitLoops(points);
                    for (var i = 0; i < splittedLoops.length; i++) {
                        polygons.push(splittedLoops[i]);
                    }

                    if (visitedStatus === 'yes') {
                        /* http://econym.org.uk/gmap/chrome.htm#winding */
                        polygons[0].reverse();
                        return polygons;
                    }
                }
            }
        }

        return polygons;
    }

    function splitLoops(points) {
        var splittedLoops = [];

        points.push(points[0]);

        for (var loopEnd = 1; loopEnd < points.length; loopEnd++) {
            var loopStart = points.indexOf(points[loopEnd]);
            if ((loopStart > 0) && (loopStart !== loopEnd)) {
                splittedLoops[0] = points.slice(0);
                splittedLoops[1] = splittedLoops[0].splice(loopStart, (loopEnd - loopStart));
                splittedLoops[1].push(points[loopStart]);
                break;
            }
        }

        if (splittedLoops.length === 0) {
            splittedLoops[0] = points;
        }

        return splittedLoops;
    }

    function getKm2sInMap() {
        var km2s = [];

        for (var y = 0; y < state.km2s.length; y++) {
            km2s[y] = [];

            for (var x = 0; x < state.km2s[y].length; x++) {
                if (state.km2s[y][x].visited === '-') {
                    km2s[y][x] = false;
                } else {
                    km2s[y][x] = true;
                }
            }
        }

        return km2s;
    }

    function isPolygonInPolygons(polygon, polygons) {
        for (var i = 0; i < polygon.length; i++) {
            if (isPointInPolygons(polygon[i], polygons) === false) {
                return false;
            }
        }

        return true;
    }

    function isPointInPolygons(point, polygons) {
        for (var i = 0; i < polygons.length; i++) {
            if (isPointInPolygon(point, polygons[i])) {
                return true;
            }
        }

        return false;
    }

    function isPointInPolygon(point, polygon) {
        var lat = point.lat();
        var lng = point.lng();
        var oddNodes = false;

        for (var i = 0, j = 0; i < polygon.length; i++) {
            if (++j === polygon.length) {
                j = 0;
            }

            if (((polygon[i].lat() < lat) && (polygon[j].lat() >= lat)) ||
                ((polygon[j].lat() < lat) && (polygon[i].lat() >= lat))) {
                if ((polygon[i].lng() + ((lat - polygon[i].lat()) /
                    (polygon[j].lat() - polygon[i].lat()) *
                    (polygon[j].lng() - polygon[i].lng()))) < lng) {
                    oddNodes = !oddNodes;
                }
            }
        }

        return oddNodes;
    }

    function getPolylinePoints(y, x, direction, points, params) {
        var newY = y;
        var newX = x;
        var newDirection = -1;
        var searchOrder;

        if (direction === 'right') {
            searchOrder = ['down', 'right', 'up', 'left'];
        } else if (direction === 'up') {
            searchOrder = ['right', 'up', 'left', 'down'];
        } else if (direction === 'left') {
            searchOrder = ['up', 'left', 'down', 'right'];
        } else if (direction === 'down') {
            searchOrder = ['left', 'down', 'right', 'up'];
        }

        for (var i = 0; i < searchOrder.length; i++) {
            newDirection = searchOrder[i];

            if (newDirection === 'right') {
                if ((y < state.km2s.length) && (x < state.km2s[y].length)) {
                    if (state.km2s[y][x].visited === params.visitedStatus) {
                        newX = x + 1;
                        break;
                    }
                }
            } else if (newDirection === 'up') {
                if ((y < state.km2s.length) && ((x - 1) >= 0)) {
                    if (state.km2s[y][x - 1].visited === params.visitedStatus) {
                        newY = y + 1;
                        break;
                    }
                }
            } else if (newDirection === 'left') {
                if (((y - 1) >= 0) && ((x - 1) >= 0)) {
                    if (state.km2s[y - 1][x - 1].visited === params.visitedStatus) {
                        newX = x - 1;
                        break;
                    }
                }
            } else if (newDirection === 'down') {
                if (((y - 1) >= 0) && (x < state.km2s[y - 1].length)) {
                    if (state.km2s[y - 1][x].visited === params.visitedStatus) {
                        newY = y - 1;
                        break;
                    }
                }
            }
        }

        if ((newY !== y) || (newX !== x)) {
            points.push(state.points[y][x]);

            if (y < state.km2s.length) {
                params.km2NeedsToBeTested[y][x] = false;
            }

            if ((newY >= 0) && (newX >= 0) &&
                ((newY !== params.initXY.y) || (newX !== params.initXY.x))) {
                getPolylinePoints(newY, newX, newDirection, points, params);
            }
        }
    }

    function addOverlaysToMap() {
        addOrRemoveOverlays('add');
    }

    function removeOverlaysFromMap() {
        addOrRemoveOverlays('remove');
    }

    function addOrRemoveOverlays(addOrRemove) {
        for (var i = 0; i < state.visitedStatusAreas.length; i++) {
            if (state.visitedStatusAreas[i].getPathLength()) {
                state.visitedStatusAreas[i].setOpacity(state.area.opacity);
                master.mapApi.addOrRemoveOverlays(state.visitedStatusAreas[i], addOrRemove);
            }
        }

        for (var i = 0; i < state.grid.latPolylines.length; i++) {
            master.mapApi.addOrRemoveOverlays(state.grid.latPolylines[i], addOrRemove);
        }

        for (var i = 0; i < state.grid.lngPolylines.length; i++) {
            master.mapApi.addOrRemoveOverlays(state.grid.lngPolylines[i], addOrRemove);
        }
    }

    // tbd: this is not accurate
    function getKm2XYFromPoint(point) {
        var guessXY = {'y': -1, 'x': -1};

        for (var i = 0; i < state.grid.latPolylines.length; i++) {
            var line = state.grid.latPolylines[i];
            var p1 = line.getLatLng(0);
            var p2 = line.getLatLng(line.getPathLength() - 1);
            var mp = 1 - ((point.lng() - p1.lng()) / (p2.lng() - p1.lng()));
            var lat = p2.lat() + ((p1.lat() - p2.lat()) * mp);

            if (point.lat() < lat) {
                guessXY.y = i - 1;
                break;
            }
        }

        for (var i = 0; i < state.grid.lngPolylines.length; i++) {
            var line = state.grid.lngPolylines[i];
            var p1 = line.getLatLng(0);
            var p2 = line.getLatLng(line.getPathLength() - 1);
            var mp = 1 - ((point.lat() - p2.lat()) / (p1.lat() - p2.lat()));
            var lng = p1.lng() + ((p2.lng() - p1.lng()) * mp);

            if (point.lng() < lng) {
                guessXY.x = i - 1;
                break;
            }
        }

        if ((guessXY.y >= 0) && (guessXY.x >= 0)) {
            return getKm2XYFromGuess(point, guessXY);
        }

        return null;
    }

    function getKm2XYFromGuess(point, guessXY) {
        for (var y = guessXY.y - 1; y < guessXY.y + 2; y++) {
            for (var x = guessXY.x - 1; x < guessXY.x + 2; x++) {
                if ((y >= 0) && (x >= 0) &&
                    (y < (state.points.length - 1) &&
                    (x < (state.points[y].length - 1)))) {

                    if (isPointInPolygon(point, state.km2s[y][x].points)) {
                        return {y:y, x:x};
                    }
                }
            }
        }

        return null;
    }

    this.getKkjOffset = function (point) {
        var km2XY = getKm2XYFromPoint(point);
        var kkj = null;

        if (km2XY !== null) {
            kkj = {'y': km2XY.y, 'x': km2XY.x};
            kkj.y += state.kkjOffset.lat;
            kkj.x += state.kkjOffset.lng;
        }

        return kkj;
    };

    this.getInfo = function (point) {
        var info = {'page': '-', 'km2XY': null, 'kkjText': '-/-', 'visited': '-'};
        var km2XY = getKm2XYFromPoint(point);

        if (km2XY) {
            var pageIndex = Math.floor(km2XY.y / state.latKmPerP) * state.lngPages +
                Math.floor(km2XY.x / state.lngKmPerP);
            if (pageIndex < state.pages.length) {
                if (state.pages[pageIndex] !== '0') {
                    info.page = state.pages[pageIndex];
                    info.visited = state.km2s[km2XY.y][km2XY.x].visited;
                } else {
                    km2XY = null;
                }
            } else {
                km2XY = null;
            }
        }

        info.km2XY = km2XY;

        if (km2XY) {
            var yKKJ = state.kkjStart.lat + km2XY.y;
            var xKKJ = state.kkjStart.lng + km2XY.x;
            info.kkjText = yKKJ + '/' + xKKJ;
        }

        return info;
    };

    this.getVisitedStatistics = function () {
        var s = {'yes': 0, 'no': 0, 'np': 0};

        for (var y = 0; y < state.km2s.length; y++) {
            for (var x = 0; x < state.km2s[y].length; x++) {
                if (state.km2s[y][x].visited !== '-') {
                    s[state.km2s[y][x].visited] += 1;
                }
            }
        }

        return s;
    };

    this.updateCursor = function (info) {
        if (state.cursor) {
            if (state.cursorParams.kkj === info.kkjText) {
                return;
            } else {
                master.mapApi.addOrRemoveOverlays(state.cursor, 'remove');
                state.cursorParams.kkj = '-';
            }
        }

        if ((info.km2XY) && (master.mapApi.getZoom() < state.cursorParams.maxZoomLevel)) {
            var points = state.km2s[info.km2XY.y][info.km2XY.x].points;
            var polylineOptions = {
                'color': state.cursorParams.strokeColor,
                'weight': state.cursorParams.strokeWeight,
                'opacity': state.cursorParams.strokeOpacity,
                'clickable': false,
                'zIndex': 1
            };
            state.cursor = master.mapApi.newPolyline(points, polylineOptions);
            master.mapApi.addOrRemoveOverlays(state.cursor, 'add');
            state.cursorParams.kkj = info.kkjText;
        }
    };

    this.hideCursor = function () {
        if (state.cursor) {
            master.mapApi.addOrRemoveOverlays(state.cursor, 'remove');
        }
    };

    function toggleVisibility() {
        if (state.isShown) {
            removeOverlaysFromMap();
        } else {
            addOverlaysToMap();
        }

        state.isShown = !(state.isShown);
    }

    function toggleOpacity() {
        removeOverlaysFromMap();

        if (state.area.opacity === state.area.opacityHigh) {
            state.area.opacity = state.area.opacityLow;
        } else {
            state.area.opacity = state.area.opacityHigh;
        }

        addOverlaysToMap();
    }

    this.setVisitedAreaOpacityToLow = function () {
        if (state.isShown) {
            if (state.area.opacity === state.area.opacityHigh) {
                toggleOpacity();
            }
        }
    };

    this.setVisitedAreaOpacityToHigh = function () {
        if (state.isShown) {
            if (state.area.opacity === state.area.opacityLow) {
                toggleOpacity();
            }
        }
    };

    function changeGridType(newGridType) {
        var opacity = state.area.opacity;
        var visitedData = state.filenames.visitedData;

        removeOverlaysFromMap();

        state = getState(newGridType);
        state.area.opacity = opacity;
        state.filenames.visitedData = visitedData;

        setPointsToState();
    }

    this.changeVisitedData = function (key) {
        that.setVisitedData(state.filenames.visitedDatas[key]);
    };

    this.setVisitedData = function (filename) {
        removeOverlaysFromMap();

        state.filenames.visitedData = filename;

        setKm2sToState();
    };

    this.getMenuItems = function () {
        var menuItems = [];

        if (state.isShown) {
            menuItems.push('Hide');

            if (state.area.opacity === state.area.opacityHigh) {
                menuItems.push('Decrease opacity');
            } else {
                menuItems.push('Increase opacity');
            }

            menuItems.push('Change grid...');
            menuItems.push('Edit visited...');
            menuItems.push('View...');
        } else {
            menuItems.push('Show');
        }

        return menuItems;
    };

    this.getChangeGridMenuItems = function () {
        var menuItems = [];

        for (var gridType of ['original', 'extended', '10k']) {
            if (state.gridType !== gridType) {
                menuItems.push(gridType);
            }
        }

        return menuItems;
    };

    this.getEditMenuItems = function () {
        var menuItems = [];

        if (state['isVisitedAreaEditorActive']) {
            menuItems.push('stop');
        } else {
            menuItems.push('start');
        }

        return menuItems;
    };

    this.getViewMenuItems = function () {
        var menuItems = [];

        for (var i in state.filenames.visitedDatas) {
            if (state.filenames.visitedData !== state.filenames.visitedDatas[i]) {
                if (i === 'latest') {
                    menuItems.push('latest');
                } else {
                    menuItems.push('end of ' + i);
                }
            }
        }

        return menuItems;
    };

    function startVisitedAreaEditor() {
        function clickHandler(mouseEvent) {
            var info = that.getInfo(master.mapApi.getMouseEventLatLng(mouseEvent));
            if (info['page'] !== '-') {
                var newVisited = {'no': 'yes', 'yes': 'np', 'np': 'no'}[info['visited']];
                state['km2s'][info['km2XY']['y']][info['km2XY']['x']]['visited'] = newVisited;
                removeOverlaysFromMap();
                master.mapApi.triggerEvent('km2sAreInState');
            }
        }
        state['visitedAreaEditorEventListener'] = master.mapApi.addListener('click', clickHandler);
        state['isVisitedAreaEditorActive'] = true;
    }

    function stopVisitedAreaEditor() {
        var visitedAreaDataWindow = window.open('', 'visited area data');
        var preElement = document.createElement('pre');
        preElement.textContent = getVisitedAreaJsonData();
        visitedAreaDataWindow.document.body.appendChild(preElement);

        master.mapApi.removeListener(state['visitedAreaEditorEventListener']);
        state['visitedAreaEditorEventListener'] = null;
        state['isVisitedAreaEditorActive'] = false;
    }

    function getVisitedAreaJsonData() {
        var lines = [];

        for (var lat = 0; lat < state['latPages']; lat++) {
            for (var lng = 0; lng < state['lngPages']; lng++) {
                var pageIndex = (lat * state['lngPages']) + lng;
                if (state['pages'][pageIndex] !== '0') {
                    var pageVisitedInfo = getPageVisitedInfo(pageIndex);
                    if (isPageVisited(pageVisitedInfo) === 'true') {
                        lines.push('{"page": "' + state['pages'][pageIndex] +
                                   '", "visited": "all"}');
                    } else {
                        for (var i = 0; i < pageVisitedInfo.length; i++) {
                            lines.push('{"page": "' + state['pages'][pageIndex] +
                                       '", "lat": "' + pageVisitedInfo[i]['lat'] +
                                       '", "lng": "' + pageVisitedInfo[i]['lng'] +
                                       '", "visited": "' + pageVisitedInfo[i]['visited'] + '"}');
                        }
                    }
                }
            }
        }
        return '[\n' + lines.join(',\n') + '\n]\n';
    }

    function getPageVisitedInfo(page) {
        var initY = Math.floor(page / state['lngPages']) * state['latKmPerP'];
        var initX = (page % state['lngPages']) * state['lngKmPerP'];
        var visitedInfo = [];

        for (var y = 0; y < state['latKmPerP']; y++) {
            for (var x = 0; x < state['lngKmPerP']; x++) {
                var lat = initY + y + state['kkjStart']['lat'];
                var lng = initX + x + state['kkjStart']['lng'];
                var visited = state['km2s'][initY + y][initX + x]['visited'];
                visitedInfo.push({'lat': lat, 'lng': lng, 'visited': visited})
            }
        }

        return visitedInfo;
    }

    function isPageVisited(pageVisitedInfo) {
        for (var i = 0; i < pageVisitedInfo.length; i++) {
            if (pageVisitedInfo[i]['visited'] !== 'yes') {
                return 'false';
            }
        }
        return 'true';
    }

    this.isVisitedAreaEditorActive = function (mouseEvent) {
        if (state['isVisitedAreaEditorActive']) {
            var info = that.getInfo(master.mapApi.getMouseEventLatLng(mouseEvent));
            if (info['page'] !== '-') {
                return true;
            }
        }
        return false;
    };

    this.processMenuCommand = function (command) {
        if ((command === 'Hide') || (command === 'Show')) {
            toggleVisibility();
        } else if ((command === 'Decrease opacity') || (command === 'Increase opacity')) {
            toggleOpacity();
        } else if ((command === 'original') || (command === 'extended') || (command === '10k')) {
            changeGridType(command);
        } else if (command === 'start') {
            startVisitedAreaEditor();
        } else if (command === 'stop') {
            stopVisitedAreaEditor();
        } else if (command === 'latest') {
            that.changeVisitedData('latest');
        } else if (/end of \d\d\d\d/.test(command)) {
            that.changeVisitedData(command.substr(7, 4));
        }
    };
}
