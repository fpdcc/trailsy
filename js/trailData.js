"use strict";
var Config = require('./config.js');
var start = new Date().getTime();

var trailData = function() {
    var that = {};
    var fetchingTrailSegments = false;
    var fetchingTrailHeads = false;
    var fetchingTrailNames = false;

    var _fetchData = function (endpoint, callback, fetchingData, page) {
        fetchingData = true;
        if (page === undefined) {
            page = 1
        }

        $.getJSON(endpoint + "/?page=" + page, function (response) {
            var paging = response.paging;
            var geoJson = response.data;

            callback(geoJson);

            if (!paging.last_page) {
                page++;
                _fetchData(endpoint, callback, fetchingData, page);
            }
            else {
                fetchingData = false;
            }
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

    that.isFetchingTrailheads = function () {
        return fetchingTrailHeads == true;
    };

    that.isFetchingTrailSegments = function () {
        return fetchingTrailSegments == true;
    };

    that.isFetchingTrailNames = function () {
        return fetchingTrailNames == true;
    };

    return that;
};

module.exports = trailData;

