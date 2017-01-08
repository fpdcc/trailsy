"use strict";

var trailHeadsFilter = function() {
    var that = {};
    var currentTrailHead;
    that.setCurrentTrailHead = function(trailhead) {
        currentTrailHead = trailhead;
    };

    that.filterByTrailhead = function(feature, layer) {
        if (currentTrailHead.id == feature.properties.poi_info_id) {
          return true;   
        }
        return false;
    };

    var currentTrailName = "";
    that.setCurrentTrailName = function(trailName) {
        currentTrailName = trailName;
    };

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

    that.filterByMulti = function(feature, layer) {


        return false;
    }

    return that;
};

module.exports = trailHeadsFilter;