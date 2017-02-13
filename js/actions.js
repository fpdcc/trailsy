'use strict'
var L = require('leaflet')
var Config = require('./config.js')
var poiFeature = require('./poiFeature.js')
var trailSegmentFeature = require('./trailSegmentFeature.js')
var trailInfo = require('./trailInfo.js')
var activityFeature = require('./activityFeature.js')
var picnicgroveFeature = require('./picnicgroveFeature.js')

var actions = function (map) {
  var that = {}
  that.helloWorld = function () {
    console.log('actions.js hello world!')
  }

  return that
}

module.exports = actions
