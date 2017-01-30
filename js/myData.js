"use strict";
var L = require('leaflet');
var Config = require('./config.js');
var poiFeature = require('./poiFeature.js');
var trailSegmentFeature = require('./trailSegmentFeature.js');
var trailMap = require('./map.js');

var myData = function() {
	var that = {};
	var poiFeat = poiFeature();
	//var trailMap = trailMap();

	
	that.originalActivitiesObject = {};
	that.originalPicnicgrovesObject = {};

	that.originalTrailDataObject = {};
	that.trailSubsystemMap = {};
	

	that.originalPoisCreated = $.Deferred();

	var originalActivitiesCreated = $.Deferred();
	var originalPicnicgrovesCreated = $.Deferred();

	var _fetchData = function (endpoint, callback) {
        console.log("[_fetchData] endpoint: " + endpoint);
        //console.log("callback = " + callback);
        $.getJSON(endpoint, function (response) {
          console.log("response for " + endpoint + " done at: " + performance.now());
          var geoJson = response;
          //console.log("callback = " + callback);
          callback(geoJson);
        }).fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request for '" + endpoint + "' Failed: " + err);
        });
  };

  // Fetch and Create Trail Segments
  that.segmentTrailSubsystemObject = {};
  var originalTrailSegmentsCreated = $.Deferred();
  
  // var fetchTrailSegments = _fetchData(Config.trailSegmentEndpoint, );


  // Fetch and Create Trailheads/POIs
 
	// var fetchTrailSegments = $.getJSON(Config.trailSegmentEndpoint, function() {
	// 			console.log( "Successfully started fetching trailSegments at " + performance.now() );
	// 	  })
	// 		.done(function() {
	// 			console.log( "Successfully finished fetching trailSegments at " + performance.now() );
	// 		})
	// 		.fail(function() {
	// 		  console.log( "error" );
	// 		});

	// var fetchTrailheads = $.getJSON(Config.trailheadEndpoint, function() {
	// 			console.log( "Successfully started fetching Trailheads at " + performance.now() );
	// 	  })
	// 		.done(function(data) {
	// 			console.log( "Successfully finished fetching Trailheads at " + performance.now() );
	// 			_createOriginalTrailheads(data);
	// 			console.log("mData.originalTrailheads.length = " + that.originalTrailheadsArray.length);
	// 		})
	// 		.fail(function() {
	// 		  console.log( "error" );
	// 		});

	// var fetchTrailData = $.getJSON(Config.trailDataEndpoint, function() {
	// 			console.log( "Successfully started fetching trailData at " + performance.now() );
	// 	  })
	// 		.done(function() {
	// 			console.log( "Successfully finished fetching trailData at " + performance.now() );
	// 		})
	// 		.fail(function() {
	// 		  console.log( "error" );
	// 		});
	// var fetchActivities = $.getJSON(Config.activityEndpoint, function() {
	// 			console.log( "Successfully started fetching activity at " + performance.now() );
	// 	  })
	// 		.done(function() {
	// 			console.log( "Successfully finished fetching activity at " + performance.now() );
	// 		})
	// 		.fail(function() {
	// 		  console.log( "error" );
	// 		});
	// var fetchPicnicgroves = $.getJSON(Config.picnicgroveEndpoint, function() {
	// 		console.log( "Successfully started fetching picnicgrove at " + performance.now() );
	// 	}).done(function() {
	// 		console.log( "Successfully finished fetching picnicgrove at " + performance.now() );
	// 	}).fail(function() {
	// 	  console.log( "error" );
	// });

	
	




	that.aVariable = "Hello!";

	return that;
};

module.exports = myData;