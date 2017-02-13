"use strict";

var openTrailFeature = function(spec) {
    var geoJson = [];
    var that = {};

    that.updateGeoJson = function(data) {
        geoJson = geoJson.concat(data);
    };

    that.getGeoJson = function() {
        return geoJson;
    };

    that.clear = function() {
        geoJson.length = 0;
    };

    return that;
};

module.exports = openTrailFeature;