"use strict";

var openTrailFeature = require('./openTrailFeature.js');
var gis = require('./gis.js');

var trailSegmentsFeature = function() {
    var segmentIdSet = new Set();
    var geoJsonMap = {};
    var segmentCollections = [];
    var currentTrailIds = [];

    var that = openTrailFeature();
    var g = gis();

    that.updateGeoJson = function(data) {
        var featuresArray = [];
        for (var i in data) {
            var feature = data[i];
            var id = feature.properties.id;
            if (segmentIdSet.has(id)) {
                continue;
            }

            segmentIdSet.add(id);
            featuresArray.push(feature);
        }

        segmentCollections.push({features: featuresArray});
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

    var _addTrailName = function(segment, trailName, trailId) {
        var properties = segment.properties;

        if (properties.trails == null) {
            properties.trails = [];
        }

        var trails = properties.trails;

        var calculatedLength = 0;
        for (var i in segment.geometry.coordinates) {
            var lineString = segment.geometry.coordinates[i];
            calculatedLength += g.pathDistance(lineString);
        }

        if (segment.properties.length == null) {
            segment.properties.length = calculatedLength;
        }
        else if (segment.properties.length != calculatedLength && segment.properties.id == 79415) {
            console.log("recorded length " + segment.properties.length + " calculated length " + calculatedLength);
            for (var i in segment.geometry.coordinates) {
                g.pathDistance(segment.geometry.coordinates[i], segment.properties.id == 79415);
            }
            console.log("");
        }

        var index = -1;
        for (var i in trails) {
            if (trails[i].name == trailName) {
                index = i;
                var found = false;
                for (var j in trails[i].lengths) {
                    if (trails[i].lengths[j].segmentId == segment.properties.id) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    trails[i].lengths.push(
                        {segmentId: segment.properties.id, length: segment.properties.length}
                    );
                }
            }
        }

        if (index == -1) {
            trails.push({
                name: trailName,
                id: trailId,
                lengths: [{segmentId: segment.properties.id, length: segment.properties.length }]
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
                _addTrailName(segment, trailName, trailId);
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
                        _addTrailName(segment, mapEntry.name, trailId);
                    }

                    mapEntry.features.push(segment);
                }
            }

        }
    };

    return that;
};

module.exports = trailSegmentsFeature;
