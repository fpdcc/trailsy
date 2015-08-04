"use strict";

var openTrailFeature = require('./openTrailFeature.js');

var trailHeadsFeature = function() {
    var trailheadsToTrailsMap = {};
    var that = openTrailFeature();

    var _buildTrailheadsToTrailsMap = function(features) {
        var map = {};
        for (var i in features) {
            var trailHeadId = features[i].properties.id;
            var trailIds = features[i].properties.trail_ids;
            map[trailHeadId] = trailIds;
        }

        return map;
    };

    var superUpdateGeoJson = that.updateGeoJson.bind(that);
    that.updateGeoJson = function(data) {
        var newMap = _buildTrailheadsToTrailsMap(data.features);

        for (var property in newMap) {
            if (newMap.hasOwnProperty(property)) {
                trailheadsToTrailsMap[property] = newMap[property];
            }
        }
        return superUpdateGeoJson(data);
    };

    that.getTrails = function(trailHeadId) {
        return trailheadsToTrailsMap[trailHeadId];
    };

    var superClear = that.clear.bind(that);

    that.clear = function() {
        trailheadsToTrailsMap = {};
        superClear();
    };

    return that;
};


module.exports = trailHeadsFeature;