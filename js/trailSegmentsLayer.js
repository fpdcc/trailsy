"use strict";

var L = require('leaflet');
var openTrailLayer = require('./openTrailLayer.js');

var trailSegmentsLayer = function() {
    var spec = {
        layerOptions: {
            filter: function(feature, layer) {
                return false;
            },
            onEachFeature: function (feature, layer) {
                var popupContent = _generatePopupContent(feature);
                layer.bindPopup(popupContent);
                layer.on('mouseover', function(e) {
                    e.target.openPopup();
                });
                layer.on('popupopen', function(e) {
                    var l = e.target;
                    l.setStyle({
                        color: "#FCDF00",
                            weight: 5,
                            opacity: 1,
                            smoothFactor: 1.0
                    });
                });

                layer.on('popupclose', function(e) {
                    var l = e.target;
                    l.setStyle({
                        color: "#678729",
                        weight: 3,
                        opacity: 1,
                        smoothFactor: 1.0
                    });
                });

            },
            style: {
                color: "#678729",
                weight: 3,
                opacity: 1,
                smoothFactor: 1.0
            }
        },
        L: L
    };

    var trailHeads;
    var trailSegments;
    var that = openTrailLayer(spec);

    that.setTrailHeads = function(tHeads) {
        trailHeads = tHeads;
    };

    that.setTrailSegments = function (tSegments) {
        trailSegments = tSegments;
        that.setOpenTrailFeature(trailSegments);
    };

    that.buildForTrailhead = function(trailHeadId) {
        var trailIds = trailHeads.getTrails(trailHeadId);
        trailSegments.setCurrentTrails(trailIds);
        return that.build();
    };

    var accessIconMap = {
        "Motor Vehicles": ["icon_car_green.png", "icon_car_no.png"],
        "Accessible":     ["icon_handicap_green.png", "icon_handicap_no.png"],
        "Skiing":         ["icon_xcountryski_green.png", "icon_xcountryski_no.png"],
        "Horse":          ["icon_horse_green.png", "icon_horse_no.png"],
        "Bicycle":        ["icon_mtnbike_green.png", "icon_mtnbike_no.png"],
        "Hiking":         ["icon_hike_green.png", "icon_hike_no.png"]
    };

    var _generatePopupContent = function (segment) {
        var content = "";

        for (var i in segment.properties.trails) {
            content += "<h5>" + segment.properties.trails[i].name + " trail id " + segment.properties.trails[i].id + "</h5>";
            var distance = 0;
            for (var j in segment.properties.trails[i].distances_in_meters) {
                if (segment.properties.trails[i].distances_in_meters[j].distance_in_meters != null) {
                    distance += segment.properties.trails[i].distances_in_meters[j].distance_in_meters;
                }
            }
            content += "<p>Distance " + (distance * 0.000621371).toFixed(2) + " miles</p>"
        }

        content += "</h5>";

        var access = segment.properties.trail_segment_attributes;
        for (var i = 0; i < access.length; i++) {
            var name = access[i].attribute.name;
            var value = access[i].value;

            if (accessIconMap[name] != null) {
                content += "<img class='popup-icon' src='img/";
                if (value == "yes") {
                    content += accessIconMap[name][0];
                }
                else {
                    content += accessIconMap[name][1];
                }
                content += "'/>";
            }
        }

        return content;
    };

    return that;
};

module.exports = trailSegmentsLayer;
