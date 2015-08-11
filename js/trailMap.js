"use strict";
var L = require('leaflet');
var Config = require('./config.js');
var trailData = require('./trailData.js');
var trailHeadsFeature = require('./trailHeadsFeature.js');
var trailHeadsLayer = require('./trailHeadsLayer.js');
var trailSegmentsFeature = require('./trailSegmentsFeature.js');
var trailSegmentsLayer = require('./trailSegmentsLayer.js');
var trailSegmentsFilter = require('./trailSegmentsFilter.js');
var geoJsonFilter = require('./geoJsonFilter.js');

var trailMap = function() {
  var that = {};

  var elementId = 'trailMapLarge';
  var map = L.map(elementId).setView(Config.mapCenter, Config.defaultZoom);
  var thLayer = trailHeadsLayer();
  var tsLayer = trailSegmentsLayer();
  var tHeads = trailHeadsFeature();
  var tSegments = trailSegmentsFeature();
  var tSegmentsFilter = trailSegmentsFilter();
  var tData = trailData();

  thLayer.setOpenTrailFeature(tHeads);

  tsLayer.setTrailHeads(tHeads);
  tsLayer.setTrailSegments(tSegments);

  map.removeControl(map.zoomControl);
  map.addControl(L.control.zoom({position: 'topright'}));

  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'examples.map-i875mjb7'
  }).addTo(map);

  that.fetchTrailheads = function () {
    thLayer.removeFrom(map);
    thLayer.clear();
    tData.fetchTrailheads(_buildTrailheads);
    tData.fetchTrailSegments(_addTrailSegmentsData);
    tData.fetchTrailNames(_addTrailNames);
  };

  that.filterTrailheads = function (text) {
    _removeTrails();
    thLayer.removeFrom(map);
    thLayer.clear();

    var filter = geoJsonFilter();
    filter.setCurrentValue(text);
    thLayer.setFilter(filter.byName);

    tSegmentsFilter.setCurrentTrailName(text);
    tsLayer.setFilter(tSegmentsFilter.filterByTrailName);

    _buildTrailheadLayers();
    _buildTrailSegments();
  };

  that.clearFilters = function () {
    _removeTrails();
    thLayer.removeFrom(map);
    thLayer.setFilter(_unfilter);
    thLayer.clear();

    _buildTrailheadLayers();
  };

  that.showTrails = function (e) {
    _removeTrails();
    var markerLayer = e.target;
    tSegmentsFilter.setCurrentTrailHead(markerLayer.feature);
    tsLayer.setFilter(tSegmentsFilter.filterByTrailhead);
    _buildTrailSegments();
  };

  thLayer.setClickHandler(that.showTrails);

  function _removeTrails() {
    tsLayer.removeFrom(map);
    tsLayer.clear();
  }

  function _buildTrailSegments() {
    var layers = tsLayer.build();
    for (var i in layers) {
      map.addLayer(layers[i]);
    }
  }

  function _unfilter (feature, layer) {
    return true;
  }

  function _addTrailSegmentsData (geoJson) {
    tSegments.updateGeoJson(geoJson.features);
  }

  function _addTrailNames (geoJson) {
    tSegments.addTrailNames(geoJson.features);
  }


  function _buildTrailheadLayers () {
    var layers = thLayer.build();
    for (var i in layers) {
      map.addLayer(layers[i]);
    }
  }

  function _buildTrailheads (geoJson) {
    thLayer.removeFrom(map);
    tHeads.updateGeoJson(geoJson);
    _buildTrailheadLayers();
  }

  return that;
};

module.exports = trailMap;