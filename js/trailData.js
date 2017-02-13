"use strict";
var Config = require('./config.js');
var start = new Date().getTime();

var trailData = function() {
    var that = {};
    var fetchingTrailSegments = false;
    var fetchingTrailHeads = false;
    var fetchingTrailNames = false;
    var fetchingActivities = false;

    that.trailheadsFetched = $.Deferred();
    that.trailSegmentsFetched = $.Deferred();
    that.trailNamesFetched = $.Deferred();
    that.activitiesFetched = $.Deferred();
    //that.trailheadsFetched = $.Deferred();

    var _fetchData = function (endpoint, callback, fetchingData, page) {
        console.log("[_fetchData] endpoint: " + endpoint);
        //fetchingData = true;
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
            
            console.log("Done getting data from " + thisEndpoint + " at time " + performance.now());
            // }
        }).done(function () {fetchingData.resolve();})
            .fail(function (jqxhr, textStatus, error) {
                var err = textStatus + ", " + error;
                console.log("Request for '" + endpoint + "' Failed: " + err);
            });
    };

    that.fetchTrailSegments = function (callback, page) {
        _fetchData(Config.trailSegmentEndpoint, callback, that.trailSegmentsFetched);
    };

    that.fetchTrailheads = function (callback, page) {
        _fetchData(Config.trailheadEndpoint, callback, that.trailheadsFetched);
    };

    that.fetchTrailNames = function (callback, page) {
        _fetchData(Config.trailDataEndpoint, callback, that.trailNamesFetched);
    };

    that.fetchActivities = function (callback, page) {
        _fetchData(Config.activityEndpoint, callback, that.activitiesFetched);
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

