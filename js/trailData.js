"use strict";
var Config = require('./config.js');
var start = new Date().getTime();

var trailData = function() {
    var that = {};
    var fetchingTrailSegments = false;
    var fetchingTrailHeads = false;
    var fetchingTrailNames = false;
    var fetchingActivities = false;

    var _fetchData = function (endpoint, callback, fetchingData, page) {
        console.log("[_fetchData] endpoint: " + endpoint);
        fetchingData = true;
        var thisEndpoint = endpoint + "/?page=" + page;
        if (page === undefined) {
            page = 1
            thisEndpoint = endpoint;
        }
        console.log("thisEndpoint = " + thisEndpoint);

        $.getJSON(thisEndpoint, function (response) {
            console.log("response for " + thisEndpoint + " = " + response);
            //var paging = response.paging;
            var geoJson = response;

            callback(geoJson);

            // if (!paging.last_page) {
            //     page++;
            //     _fetchData(endpoint, callback, fetchingData, page);
            // }
            // else {
            fetchingData = false;
            console.log("Done getting data from " + thisEndpoint + " at time " + performance.now());
            // }
        })
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request for '" + endpoint + "' Failed: " + err);
            });
    };

    that.fetchTrailSegments = function (callback, page) {
        _fetchData(Config.trailSegmentsEndpoint, callback, fetchingTrailSegments);
    };

    that.fetchTrailheads = function (callback, page) {
        _fetchData(Config.trailheadEndpoint, callback, fetchingTrailHeads);
    };

    that.fetchTrailNames = function (callback, page) {
        _fetchData(Config.trailsEndpoint, callback, fetchingTrailNames);
    };

    that.fetchActivities = function (callback, page) {
        _fetchData(Config.activityEndpoint, callback, fetchingActivities);
    };

    that.isFetchingTrailheads = function () {
        return fetchingTrailHeads == true;
    };

    that.isFetchingTrailSegments = function () {
        return fetchingTrailSegments == true;
    };

    that.isFetchingTrailNames = function () {
        return fetchingTrailNames == true;
    };

    that.isFetchingActivities = function () {
        return fetchingActivities == true;
    };

    return that;
};

module.exports = trailData;

