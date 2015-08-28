"use strict";

var openTrailLayer = function(spec) {
    var that = {};

    var layers = [];
    var openTrailFeature;
    var L = spec.L;

    that.build = function () {
        var geoJsonArray = openTrailFeature.getGeoJson();
        for (var i in geoJsonArray) {
            var geoJson = geoJsonArray[i];
            if (spec.layerOptions != null) {
                layers.push(L.geoJson(geoJson.features, spec.layerOptions));
            }
            else {
                layers.push(L.geoJson(geoJson.features))
            }
        }

        return layers;
    };

    that.removeFrom = function(that) {
        for (var i in layers) {
            that.removeLayer(layers[i]);
        }
    };

    that.clear = function() {
        layers.length = 0;
    };

    that.setOpenTrailFeature = function(feature) {
        openTrailFeature = feature;
    };

    that.setFilter = function(filter) {
        spec.layerOptions.filter = filter;
    };

    return that;
};


module.exports = openTrailLayer;