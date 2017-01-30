'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')

var filterFunctions = function (map) {
  var that = {}
  var currentUserLocation = null
  that.current = {
    lengthFilter: [],
    activityFilter: [],
    searchFilter: '',
    userLocation: null,
    searchLocation: null,
    zipMuniFilter: '',
    trailInList: true,
    trailOnMap: true
  }

  that.setCurrentUserLocation = function (userLocation) {
    currentUserLocation = userLocation
  }

  return that
}

module.exports = filterFunctions
