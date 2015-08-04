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

        if (properties.trailNames == null) {
            properties.trailNames = [];
        }

        var trailNames = properties.trailNames;

        var index = -1;
        for (var i in trailNames) {
            if (trailNames[i] == trailName) {
                index = i;
            }
        }

        if (index == -1) {
            trailNames.push(trailName);
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