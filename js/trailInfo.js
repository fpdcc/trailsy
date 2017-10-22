'use strict'
require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')

// var alertFeat

// var setup = function (alertFeature) {
//   alertFeat = alertFeature
// }

var trailInfo = function () {
  var that = {}
  that.originalTrailInfo = {}
  that.trailSubsystemMap = {}
  that.filteredSystemNames = {}
  that.hasAlerts = []
  that.trailInfoCreated = $.Deferred()

  that.fetchTrailInfo = function () {
    $.getJSON(Config.trailInfoEndpoint, function () {
      console.log('Successfully started fetching trailInfo at ' + performance.now())
    })
    .done(function (data) {
      console.log('Successfully finished fetching trailInfo at ' + performance.now())
      _makeTrailInfoObject(data)
      // console.log("that.segmentTrailSubsystemObject.length = " + that.originalPoisArray.length);
    })
    .fail(function () {
      console.log('error')
    })
  }

  that.addFilterAlerts = function (filters, alertFeat) {
    that.hasAlerts = []
    if (filters.current.hasAlerts) {
      $.each(that.trailSubsystemMap, function (name, value) {
        var trailAlerts = alertFeat.trailSubsystemAlerts[name] || []
        console.log('trailAlerts = ' + trailAlerts)
        if (trailAlerts.length > 0) {
          console.log('filterPoi trailAlerts.length > 0 ' + name)
          console.log('filterPoi trailAlerts= ' + trailAlerts)
          that.filteredSystemNames[name] = 1
        }
      })
    }
    return that.filteredSystemNames
  }

  var _makeTrailInfoObject = function (data) {
    that.originalTrailInfo = {}
    that.trailSubsystemMap = {}
    for (var i = 0; i < data.features.length; i++) {
      that.originalTrailInfo[data.features[i].properties.direct_trail_id] = data.features[i].properties
      var normalizedSubsystem = data.features[i].properties.trail_subsystem.replace(/[& ]/g, '+')
      var segmentName = data.features[i].properties.trail_color + ' ' + data.features[i].properties.trail_type
      if (data.features[i].properties.segment_type) {
        segmentName += ' ' + data.features[i].properties.segment_type
      }
      if (data.features[i].properties.off_fpdcc === 'y') {
        segmentName += ' (Non-FPCC)'
      } else if (data.features[i].properties.direction) {
        segmentName += ' (' + data.features[i].properties.direction + ') '
      }
      data.features[i].properties.segmentName = segmentName
      that.trailSubsystemMap[normalizedSubsystem] = that.trailSubsystemMap[normalizedSubsystem] || []
      that.trailSubsystemMap[normalizedSubsystem].push(data.features[i].properties)
    }
    that.trailInfoCreated.resolve(that.originalTrailInfo)
  }

  
  return that
}

//module.exports = trailInfo
module.exports = {
  //setup: setup,
  trailInfo: trailInfo
}
