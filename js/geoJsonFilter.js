"use strict";

var geoJsonFilter = function() {
    var that = {};

    var currentValue;
    var currentKey;

    that.setCurrentValue = function(value) {
        currentValue = value;
    };

    that.setCurrentKey = function (key) {
        currentKey = key;
    };

    that.byProperty = function (feature, layer) {
        if (feature.properties == null || feature.properties[currentKey] == null) {
            return false;
        }

        var property = feature.properties[currentKey];

        if (Object.prototype.toString.call(property) === '[object Array]' ) {
            for (var i in property) {
                if (property[i].toLowerCase().indexOf(currentValue.toLowerCase()) != -1) {
                    return true;
                }
            }
        }
        else {
            return property.toLowerCase().indexOf(currentValue.toLowerCase()) != -1;
        }

        return false;
    };

    that.byName = function (feature, layer) {
        currentKey = "name";
        return that.byProperty(feature, layer);
    };

    return that;
};

module.exports = geoJsonFilter;
