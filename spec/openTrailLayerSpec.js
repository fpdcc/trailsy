'use strict';

var openTrailLayer =  require('../js/openTrailLayer.js');
var openTrailFeature = require('../js/openTrailFeature.js');

describe('openTrailLayer', function () {
    var spec = {
        L: {
            geoJson: function(ignored1, ignored2) {  }
        }
    };

    var testGeoJson = [{features: "a mountain"}];
    var ourTrailLayer = openTrailLayer(spec);
    var ourTrailFeature = openTrailFeature();

    beforeEach(function () {
        spyOn(spec.L, 'geoJson').and.returnValue("A Lake");
        ourTrailLayer.setOpenTrailFeature(ourTrailFeature);
    });

    it('should do nothing when there is no geoJsondata', function () {
        spyOn(ourTrailFeature, 'getGeoJson').and.returnValue(null);
        var layers = ourTrailLayer.build();
        expect(layers.length).toBe(0);
        expect(ourTrailFeature.getGeoJson).toHaveBeenCalled();
        expect(spec.L.geoJson.calls.count()).toEqual(0);
    });

    it('should build layers from the openTrailFeature geoJson data', function () {
        spyOn(ourTrailFeature, 'getGeoJson').and.returnValue(testGeoJson);
        var layers = ourTrailLayer.build();
        expect(ourTrailFeature.getGeoJson).toHaveBeenCalled();
        expect(spec.L.geoJson).toHaveBeenCalledWith("a mountain");
        expect(layers.length).toBe(1);

        var testLayerHolder = {
            removeLayer: function (layer) {
                console.log('woo-hoo');
            }
        };

        spyOn(testLayerHolder, 'removeLayer');

        ourTrailLayer.removeFrom(testLayerHolder);
        expect(testLayerHolder.removeLayer).toHaveBeenCalledWith("A Lake");
    });
});