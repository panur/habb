#!/usr/bin/env python

"""Convert GPX files into JSON files.

GPX: http://www.topografix.com/gpx.asp
JSON: http://www.json.org/

Author: Panu Ranta, panu.ranta@iki.fi, http://14142.net/habb/about.html
"""

import argparse
import datetime
import json
import logging
import os
import math
import resource
import sys
import time
import xml.dom.minidom
import xml.etree.cElementTree

import polyline


def _main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_dir', help='GPX input directory')
    parser.add_argument('output_dir', help='JSON output directory')
    parser.add_argument('--trip-filter', help='Filter processed trips by gps_data (start)')
    args = parser.parse_args()

    _init_logging()

    start_time = time.time()
    logging.debug('started {}'.format(sys.argv))

    trips = _parse_index(os.path.join(args.input_dir, 'index.xml'))
    _create_output_files(args.input_dir, args.output_dir, trips, args.trip_filter)

    logging.debug('took {} seconds, max mem: {} megabytes'.format(
        int(time.time() - start_time), resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024))


def _init_logging():
    log_format = '%(asctime)s %(levelname)s %(filename)s:%(lineno)d %(funcName)s: %(message)s'
    logging.basicConfig(filename='gpx2json.log', format=log_format, level=logging.DEBUG)


def _parse_index(index_xml):
    trips = []
    dom_root = xml.dom.minidom.parse(index_xml)
    for dom_trip in dom_root.getElementsByTagName('trip'):
        trip = {}
        for attribute in dom_trip.attributes.keys():
            trip[attribute] = dom_trip.getAttribute(attribute)
        trips.append(trip)
    return trips


def _create_output_files(input_dir, output_dir, trips, trip_filter):
    output_trips = {}  # by year

    for trip in trips:
        if (trip_filter is None) or trip['gps_data'].startswith(trip_filter):
            gpx = _parse_gpx_file(os.path.join(input_dir, trip['gps_data']))
            output_trip = _create_output_trip(trip, gpx)
            year = output_trip['date'][0:4]
            if year not in output_trips:
                output_trips[year] = []
            output_trips[year].append(output_trip)

    for year in output_trips:
        output_filename = os.path.join(output_dir, 'tripsData{}.json'.format(year))
        with open(output_filename, 'w') as output_file:
            output_file.write(json.dumps(output_trips[year], separators=(',', ':')))


def _parse_gpx_file(gpx_filename):
    points = []
    et_root = xml.etree.cElementTree.parse(gpx_filename).getroot()
    is_creator_version_1_1 = et_root.attrib['creator'].endswith('1.1')
    xmlns = '{http://www.topografix.com/GPX/1/0}'

    for et_trkpt in et_root.iter(xmlns + 'trkpt'):
        point = {}
        point['lat'] = et_trkpt.attrib['lat']
        point['lon'] = et_trkpt.attrib['lon']
        point['ele'] = float(et_trkpt.find(xmlns + 'ele').text)
        point['time'] = et_trkpt.find(xmlns + 'time').text
        point['speed'] = float(et_trkpt.find(xmlns + 'speed').text)
        if is_creator_version_1_1:
            point['speed'] = point['speed'] * 3.6
        if len(points) > 0:
            _fill_gap(points, point)
        points.append(point)

    return points


def _fill_gap(points, point):
    gap_in_seconds = _get_duration_seconds(points[-1], point)
    if gap_in_seconds > 10:
        print 'gap of {} seconds before {}'.format(gap_in_seconds, point['time'])
    if gap_in_seconds > 100:
        fill_point = points[-1]
        fill_point['speed'] = 0
        for _ in range(gap_in_seconds / 4):
            points.append(fill_point)


def _create_output_trip(trip, gpx_points):
    output_trip = {}

    encoded_polyline = _get_encoded_polyline(gpx_points, trip['visited_data'] != '-')

    output_trip['encodedPolyline'] = encoded_polyline['points']
    output_trip['encodedVertexTimes'] = _get_encoded_vertex_times(
        gpx_points, encoded_polyline['kept_indexes'])
    output_trip['date'] = gpx_points[0]['time'][0:10]  # 2009-07-19T10:23:21Z
    output_trip['gpsDurationSeconds'] = _get_gps_duration_seconds(gpx_points)
    output_trip['gpsDuration'] = _get_gps_duration(output_trip['gpsDurationSeconds'])
    output_trip['gpsDistance'] = _get_gps_distance(gpx_points)
    output_trip['gpsMaxSpeed'] = _get_max_speed(gpx_points)
    output_trip['gpsMaxAltitude'] = _get_max_altitude(gpx_points)
    output_trip['encodedGpsSpeedData'] = _get_encoded_gps_data(gpx_points, 'speed', scale=1)
    output_trip['encodedGpsAltitudeData'] = _get_encoded_gps_data(gpx_points, 'ele', scale=2)

    output_trip['visibility'] = 'hidden'
    output_trip['visitedDataFilename'] = 'visited_datas/' + trip['visited_data']
    output_trip['name'] = trip['name']
    output_trip['color'] = trip['color']
    output_trip['ccDistance'] = trip['distance']
    output_trip['ccDuration'] = trip['duration']
    output_trip['ccMaxSpeed'] = trip['max_speed']
    output_trip['ccAvgSpeed'] = trip['avg_speed']

    _log_stats(trip, output_trip, gpx_points, encoded_polyline)

    return output_trip


def _get_encoded_polyline(gpx_points, is_hq):
    very_small = {True: 0.000005, False: 0.00002}[is_hq]
    points = []
    for point in gpx_points:
        points.append((float(point['lat']), float(point['lon'])))
    return polyline.encode(points, very_small=very_small)


def _get_encoded_vertex_times(gpx_points, kept_indexes):
    vertex_times = [0]  # seconds since start

    for i in range(len(kept_indexes)):
        vertex_times.append(_get_duration_seconds(gpx_points[0], gpx_points[kept_indexes[i]]))

    return _integer_list_to_string(_get_delta_list(vertex_times))


def _get_delta_list(integer_list):
    """For [0, 10, 11, 22, 25] return [10, 1, 11, 3]."""
    if (len(integer_list) > 0) and (integer_list[0] != 0):
        raise SystemExit('integer_list[0] = {} != 0'.format(integer_list[0]))
    if integer_list != sorted(integer_list):
        raise SystemExit('integer_list not sorted: {}'.format(integer_list))
    return [(integer_list[i] - integer_list[i - 1]) for i in range(1, len(integer_list))]


def _integer_list_to_string(integer_list):
    """For [0, 1, 2, 14, 91, 92, 15, 182, 183, 16] return '#$%1~!$2!~!!$3'."""
    if (len(integer_list) > 0) and (min(integer_list) < 0):
        raise SystemExit('negative value in integer_list: {}'.format(integer_list))
    mult_chr = 33  # 33='!'
    min_chr = 35  # 35='#', not 34='"' because it takes three characters in JSON
    max_chr = 126  # 126='~'
    max_value = max_chr - min_chr
    output_string = ''
    for integer in integer_list:
        num_mult_chr = max(0, integer - 1) / max_value
        last_output_chr = chr(min_chr + (integer - (num_mult_chr * max_value)))
        output_string += (chr(mult_chr) * num_mult_chr) + last_output_chr
    return output_string


def _get_gps_duration_seconds(gpx_points):
    return _get_duration_seconds(gpx_points[0], gpx_points[-1])


def _get_duration_seconds(gpx_point_start, gpx_point_end):
    date_format = '%Y-%m-%dT%H:%M:%SZ'
    start = datetime.datetime.strptime(gpx_point_start['time'], date_format)
    end = datetime.datetime.strptime(gpx_point_end['time'], date_format)
    return (end - start).seconds


def _get_gps_duration(gps_duration_seconds):
    return time.strftime('%H:%M:%S', time.gmtime(gps_duration_seconds))


def _get_gps_distance(gpx_points):
    total_distance = 0
    for i in range(len(gpx_points) - 1):
        distance = _get_distance(gpx_points[i], gpx_points[i + 1])
        if distance > 1000:
            print 'gap of {} meters before {}'.format(int(distance), gpx_points[i + 1]['time'])
        else:
            total_distance += distance
    return int(round((total_distance / 1000)))


def _get_distance(point1, point2):
    """Based on http://www.movable-type.co.uk/scripts/latlong.html."""
    radius = 6378137  # earth's radius in meters
    lat1 = _get_radians(point1['lat'])
    lon1 = _get_radians(point1['lon'])
    lat2 = _get_radians(point2['lat'])
    lon2 = _get_radians(point2['lon'])
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1

    aaa = ((math.sin(d_lat / 2.0) * math.sin(d_lat / 2.0)) +
           (math.cos(lat1) * math.cos(lat2) * math.sin(d_lon / 2.0) * math.sin(d_lon / 2.0)))
    ccc = 2.0 * math.atan2(math.sqrt(aaa), math.sqrt(1 - aaa))
    distance = radius * ccc

    return distance  # distance between point1 and point2 in meters


def _get_radians(lat_or_lng):
    return (float(lat_or_lng) * math.pi) / 180


def _get_max_speed(gpx_points):
    max_speed = _get_max_gpx_point(gpx_points, 'speed')
    max_speed['value'] = str(round(max_speed['value'] * 10) / 10)
    return max_speed


def _get_max_altitude(gpx_points):
    max_altitude = _get_max_gpx_point(gpx_points, 'ele')
    max_altitude['value'] = int(round(max_altitude['value']))
    return max_altitude


def _get_max_gpx_point(gpx_points, element):
    max_element = {'value': 0, 'lat': None, 'lon': None}

    for point in gpx_points:
        if point[element] > max_element['value']:
            max_element['value'] = point[element]
            max_element['lat'] = point['lat']
            max_element['lon'] = point['lon']

    return max_element


def _get_encoded_gps_data(gpx_points, element, scale):
    gps_data = []
    max_length = 2000
    tmp_array = []

    for point in gpx_points:
        tmp_array.append(max(point[element] / scale, 0))

    if len(gpx_points) <= max_length:
        for i in range(len(gpx_points)):
            gps_data.append(int(round(tmp_array[i])))
    else:
        _downsample_array(tmp_array, gps_data, max_length)

    return _integer_list_to_string(gps_data)


def _downsample_array(original_array, new_array, new_size):
    x_ratio = _round((len(original_array) / float(new_size)))
    middle_x = 0
    low_x = 0
    high_x = 0
    new_y = 0

    for new_x in range(new_size):
        middle_x = _round(((float(new_x) / new_size) * len(original_array)))
        low_x = _round(middle_x - (x_ratio / 2.0))
        high_x = _round(middle_x + (x_ratio / 2.0))
        new_y = 0

        if (low_x > 0) and (high_x < len(original_array)):
            for i in range(x_ratio):
                new_y += original_array[low_x + i]
            new_y = float(new_y) / x_ratio
        else:
            new_y = original_array[middle_x]

        new_y = _round(new_y)
        new_array.append(new_y)


def _round(number):
    return int(round(number))


def _log_stats(trip, output_trip, gpx_points, encoded_polyline):
    format_str = (u'{} ({}) - points: [total={}, kept={}, dropped={} ({} %)]; '
                  'bytes: [polyline={} ({}/point), speed={}, ele={}, times={}]')

    drop_ratio = int((encoded_polyline['num_dropped_points'] / float(len(gpx_points))) * 100)
    kept_points = len(gpx_points) - encoded_polyline['num_dropped_points']
    polyline_ratio = round(len(encoded_polyline['points']) / float(kept_points), 2)

    logging.debug(format_str.format(
        trip['name'], trip['gps_data'], len(gpx_points), kept_points,
        encoded_polyline['num_dropped_points'], drop_ratio, len(encoded_polyline['points']),
        polyline_ratio, len(output_trip['encodedGpsSpeedData']),
        len(output_trip['encodedGpsAltitudeData']), len(output_trip['encodedVertexTimes'])))


if __name__ == '__main__':
    _main()