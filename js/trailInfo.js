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
    if (filters.current.hasAlerts && ((!Array.isArray(filters.current.search) || !filters.current.search.length))) {
      $.each(that.trailSubsystemMap, function (name, value) {
        var trailAlerts = alertFeat.trailSubsystemAlerts[name] || []
        if (trailAlerts.length > 0) {
          that.filteredSystemNames[name] = 1
        }
      })
    }
    return that.filteredSystemNames
  }

  var _makeTrailInfoObject = function (data) {
    that.originalTrailInfo = {}
    that.trailSubsystemMap = {}
    console.log("[trailInfo _makeTrailInfoObject] Begin")
    for (const key in data) {
      let subtrail = data[key] 
      
      var normalizedSubsystem = subtrail.trail_subsystem.replace(/[& ]/g, '+')
      var segmentName = subtrail.subtrail_name
      // if (subtrail.subtrail_name) {
      //   var segmentName = data.features[i].properties.trail_name
      // } else {
      //   var segmentName = data.features[i].properties.trail_color + ' ' + data.features[i].properties.trail_type
      //   if (data.features[i].properties.segment_type) {
      //     segmentName += ' ' + data.features[i].properties.segment_type
      //   }
      //   if (data.features[i].properties.off_fpdcc === 'y') {
      //     segmentName += ' (Non-FPCC)'
      //   } else if (data.features[i].properties.direction) {
      //     segmentName += ' (' + data.features[i].properties.direction + ') '
      //   }
      // }
      subtrail.segmentName = segmentName
      that.originalTrailInfo[subtrail.subtrail_id] = subtrail
      that.trailSubsystemMap[normalizedSubsystem] = that.trailSubsystemMap[normalizedSubsystem] || []
      that.trailSubsystemMap[normalizedSubsystem].push(subtrail)
    }
    console.log("[trailInfo _makeTrailInfoObject] End")
    that.trailInfoCreated.resolve(that.originalTrailInfo)
  }

  
  return that
}

//module.exports = trailInfo
module.exports = {
  //setup: setup,
  trailInfo: trailInfo
}
