"use strict";
var L = require('leaflet');
var openTrailLayer = require('./openTrailLayer.js');

var trailHeadsLayer = function() {
    var trailheadIcon = L.icon({
        iconUrl: 'img/icon_trailhead_active.png',
        iconSize:     [40, 41], // size of the icon
        iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
        shadowUrl: 'img/icon_trailhead_shadow.png',
        shadowSize: [90, 30],
        shadowAnchor: [0,27],
        popupAnchor:  [0, -30] // point from which the popup should open relative to the iconAnchor
    });

    var amenityIconMap = {
        "Drinking Water": ["icon_drinking_water_green.png", "icon_drinking_water_no.png"],
        "Kiosk":          ["icon_kiosk_green.png", "icon_kiosk_no.png"],
        "Parking":        ["icon_parking_green.png", "icon_parking_no.png"],
        "Restrooms":      ["icon_restroom_green.png", "icon_restroom_no.png"]
    };

    var spec = {
        layerOptions : {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: trailheadIcon});
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(_generatePopupContent(feature));
                layer.on({
                    click: that.clickHandler
                });
            }
        }
    };

    var that = openTrailLayer(spec);
    that.clickHandler = null;

    that.setClickHandler = function(handler) {
        that.clickHandler = handler;
    };

    var _getTrailheadAmenities = function(trailhead) {
        var amenityContent = "";
        var amenities = trailhead.properties.trailhead_attributes;
        for (var i = 0; i < amenities.length; i++) {
            var name = amenities[i].attribute.name;
            var value = amenities[i].value;

            if (amenityIconMap[name] != null) {
                amenityContent += "<img class='popup-icon' src='img/";
                if (value == "yes") {
                    amenityContent += amenityIconMap[name][0];
                }
                else {
                    amenityContent += amenityIconMap[name][1];
                }
                amenityContent += "'/>";
            }
        }
        return amenityContent;
    };

    var _generatePopupContent = function(trailhead) {
        return "<h5>" + trailhead.properties.name + "</h5>" + _getTrailheadAmenities(trailhead);
    };

    return that;
};

module.exports = trailHeadsLayer;