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

    return that;
};

module.exports = trailSegmentsFilter;