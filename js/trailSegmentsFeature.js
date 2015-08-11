"use strict";

var openTrailFeature = require('./openTrailFeature.js');

var trailSegmentsFeature = function() {
    var geoJsonMap = {};
    var segmentCollections = [];
    var currentTrailIds = [];

    var that = openTrailFeature();

    that.updateGeoJson = function(data) {
        segmentCollections.push({features: data});
        _updateGeoJsonMap(segmentCollections);
    };

    that.getGeoJson = function() {
        return segmentCollections;
    };

    that.clear = function () {
        geoJsonMap = {};
        segmentCollections.length = 0;
    };

    var getMapEntry = function(trailId) {
        if (geoJsonMap[trailId] == null) {
            geoJsonMap[trailId] = {
                type: "FeatureCollection",
                features: []
            }
        }

        return geoJsonMap[trailId];
    };

    var _addTrailName = function(segment, trailName) {
        var properties = segment.properties;

        if (properties.trails == null) {
            properties.trails = [];
        }

        var trails = properties.trails;

        var index = -1;
        for (var i in trails) {
            if (trails[i].name == trailName) {
                index = i;
                var found = false;
                for (var j in trails[i].distances_in_meters) {
                    if (trails[i].distances_in_meters[j].segmentId == segment.properties.id) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    trails[i].distances_in_meters.push(
                        {segmentId: segment.properties.id, distance_in_meters: segment.properties.distance_in_meters}
                    );
                }
            }
        }

        if (index == -1) {
            trails.push({
                name: trailName,
                distances_in_meters: [{segmentId: segment.properties.id, distance_in_meters: segment.properties.distance_in_meters }]
            });
        }

        return segment;
    };

    that.addTrailNames = function (trails) {
        for (var i in trails) {
            var trailId = trails[i].properties.id;
            var trailName = trails[i].properties.name;

            var mapEntry = getMapEntry(trailId);

            mapEntry.name = trailName;

            for (var j in mapEntry.features) {
                var segment = mapEntry.features[j];
                _addTrailName(segment, trailName);
            }
        }
    };

    var _updateGeoJsonMap = function(segmentCollections) {
        for (var i in segmentCollections) {
            var segments = segmentCollections[i].features;

            for (var j in segments) {
                var segment = segments[j];
                var trailIds = segment.properties.trail_ids;

                for (var k in trailIds) {
                    var trailId = trailIds[k];
                    var mapEntry = getMapEntry(trailId);

                    if (mapEntry.name != null) {
                        _addTrailName(segment, mapEntry.name);
                    }

                    mapEntry.features.push(segment);
                }
            }

        }
    };

    return that;
};

module.exports = trailSegmentsFeature;