'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')
var eL = require('./eventListeners.js')
var analyticsCode = require('./analyticsCode.js')

var alertFeature = function (map) {
  var that = {}
  var events = eL.events()
  that.poiAlerts = {}
  that.trailSubsystemAlerts = {}
  that.globalAlerts = []
  that.alertsCreated = $.Deferred()

  that.fetchAlerts = function () {
    $.getJSON(Config.alertEndpoint, function () {
      console.log('Successfully started fetching Alerts at ' + performance.now())
    })
    .done(function (data) {
      console.log('Successfully finished fetching Alerts at ' + performance.now())
      _makeAlertObject(data)
    })
    .fail(function () {
      console.log('error')
    })
  }

  var _makeAlertObject = function (data) {
    that.poiAlerts = {}
    that.trailSubsystemAlerts = {}
    that.globalAlerts = []
    console.log("Alerts data = " + data.length)
    for (var i = 0; i < data.length; i++) {
      console.log("alert data.id = " + data[i].id)
      if (data[i].alert_type === 'global') {
        that.globalAlerts.push(data[i])
      } else {
        var pois = data[i].pointsofinterests
        console.log("pois for this alert = " + pois)
        for (var poiNum = 0; poiNum < pois.length; poiNum++) {
          that.poiAlerts[pois[poiNum]] = that.poiAlerts[pois[poiNum]] || []
          that.poiAlerts[pois[poiNum]].push(data[i])
        }
        var systems = data[i].trail_systems
        for (var systemNum = 0; systemNum < systems.length; systemNum++) {
          var normalizedSubsystem = systems[systemNum].replace(/[& ]/g, '+')
          that.trailSubsystemAlerts[normalizedSubsystem] = that.trailSubsystemAlerts[normalizedSubsystem] || []
          that.trailSubsystemAlerts[normalizedSubsystem].push(data[i])
        }
      }
    }
    that.alertsCreated.resolve(that.poiAlerts)
  }

  $.each(that.poiAlerts, function (i, el) {
    console.log("poiAlert i = " + i)
    console.log("poiAlert el = " + el)
  })
  return that
}

module.exports = alertFeature
