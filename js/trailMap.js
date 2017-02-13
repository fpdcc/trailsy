"use strict";
var L = require('leaflet');
var Config = require('./config.js');
var trailData = require('./trailData.js');
var trailHeadsFeature = require('./trailHeadsFeature.js');
var trailHeadsLayer = require('./trailHeadsLayer.js');
var trailSegmentsFeature = require('./trailSegmentsFeature.js');
var trailSegmentsLayer = require('./trailSegmentsLayer.js');
var trailSegmentsFilter = require('./trailSegmentsFilter.js');
var activitiesFeature = require('./activitiesFeature.js');
var activitiesLayer = require('./activitiesLayer.js');
var geoJsonFilter = require('./geoJsonFilter.js');

var trailMap = function() {
  var that = {};

  var elementId = 'trailMapLarge';
  var map = L.map(elementId).setView(Config.mapCenter, Config.defaultZoom);
  var thLayer = trailHeadsLayer();
  var tsLayer = trailSegmentsLayer();
  var acLayer = activitiesLayer();
  var tHeads = trailHeadsFeature();
  var tSegments = trailSegmentsFeature();
  var tSegmentsFilter = trailSegmentsFilter();
  var activities = activitiesFeature();
  var tData = trailData();

  var currentTrailheads = null;

  thLayer.setOpenTrailFeature(tHeads);
  acLayer.setOpenTrailFeature(activities);

  tsLayer.setTrailHeads(tHeads);
  tsLayer.setTrailSegments(tSegments);


  map.removeControl(map.zoomControl);
  map.addControl(L.control.zoom({position: 'topright'}));

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoidHJldm9yYWNrZXJtYW4iLCJhIjoiMjM0NWIwNWRkMTBlM2Y0MmMyYmZiNzIwZjk2ZTVhMmYifQ.BhzAYibXfiqRHkRdNKKmGQ'
  }).addTo(map);

  L.control.scale({maxWidth:500}).addTo(map);

  that.fetchTrailheads = function () {
    thLayer.removeFrom(map);
    thLayer.clear();
    var ftr = tData.fetchTrailheads(_buildTrailheads);
    console.log("isfetchingTrailheads = " + tData.trailheadsFetched);
    tData.fetchTrailSegments(_addTrailSegmentsData);
    var trnm = tData.fetchTrailNames(_addTrailNames);
    tData.fetchActivities(_buildActivities);
    console.log("isfetchingTrailheads = " + tData.trailheadsFetched);
    $.when(tData.trailheadsFetched, tData.trailSegmentsFetched).done(function(ftr, trnm) {
      // Handle both XHR objects
      
      console.log("Done getting data for trailheads and trail segments at " + performance.now());
    });
  };

  that.filterTrailheads = function (text) {
    _removeTrails();
    thLayer.removeFrom(map);
    thLayer.clear();
    acLayer.removeFrom(map);
    acLayer.clear();

    var filter = geoJsonFilter();
    filter.setCurrentValue(text);
    thLayer.setFilter(filter.byName);

    tSegmentsFilter.setCurrentTrailName(text);
    tsLayer.setFilter(tSegmentsFilter.filterByTrailName);

    _buildTrailheadLayers();
    _buildActivities();
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
    currentTrailheads = null;
    for (var i in layers) {
      currentTrailheads = layers[i];
      map.addLayer(layers[i]);
    }
    _testLayer();
  }

  function _testLayer () {
    currentTrailheads.eachLayer(function (layer) {
      console.log("layer properties = " + layer.feature.properties.name);
    });
  }

  function _buildTrailheads (geoJson) {
    thLayer.removeFrom(map);
    tHeads.updateGeoJson(geoJson); 
    _buildTrailheadLayers(); // Adds trailheads to map
  }

  function _buildActivityLayers () {
    console.log("[_buildActivityLayers] start");
    var layers = acLayer.build();
    for (var i in layers) {
      map.addLayer(layers[i]);
    }
  }

  function _buildActivities (geoJson) {
    console.log("[_buildActivities] start");
    acLayer.removeFrom(map);
    activities.updateGeoJson(geoJson);
    console.log("[_buildActivities] before _buildActivityLayers");
    _buildActivityLayers();
  }

  return that;
};

module.exports = trailMap;
