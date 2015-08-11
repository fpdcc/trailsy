"use strict";

var trailSegmentsFilter = function() {
    var that = {};
    var currentTrailHead;
    that.setCurrentTrailHead = function(trailhead) {
        currentTrailHead = trailhead;
    };

    that.filterByTrailhead = function(feature, layer) {
        for (var i in currentTrailHead.properties.trail_ids) {
            var thTrailId = currentTrailHead.properties.trail_ids[i];
            for (var j in feature.properties.trail_ids) {
                var fTrailId = feature.properties.trail_ids[j];
                if (fTrailId == thTrailId) {
                    return true;
                }
            }
        }
        return false;
    };

    var currentTrailName = "";
    that.setCurrentTrailName = function(trailName) {
        currentTrailName = trailName;
    }

    that.filterByTrailName = function(feature, layer) {
        if (feature.properties == null ||
            feature.properties.trails == null ||
            feature.properties.trails.length == 0) {
            return false;
        }

        for (var i in feature.properties.trails) {
            var trailName = feature.properties.trails[i].name;
            if (trailName.toLowerCase().indexOf(currentTrailName.toLowerCase()) != -1) {
                return true;
            }
        }

        return false;
    };

    return that;
};

module.exports = trailSegmentsFilter;