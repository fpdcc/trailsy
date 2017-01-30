'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')
require('leaflet-usermarker')

var geolocationFunctions = function (map, filters) {
  var that = {}

  that.currentUserLocation = null
  that.useGeo = false
  var geoWatchId = null
  var userMarker = null
  that.setupGeolocation = function (callback) {
    var geoSetupDone = false
    console.log('setupGeolocation')
    if (navigator.geolocation) {
      console.log('[setupGeolocation] yes navigator.geolocation')
      // setup location monitoring
      var options = {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      }
      var latlng
      geoWatchId = navigator.geolocation.watchPosition(
        function (position) {
          console.log('[setupGeolocation] function position')
          handleGeoSuccess(position)
          geoSetupDone = true
          console.log('[setupGeolocation] function position geoSetupDone= ' + geoSetupDone)
        },
        function (error) {
          console.log('[setupGeolocation] error -> currentUserLocation = ' + that.currentUserLocation)
          console.log('[setupGeolocation] function error.code = ' + error.code)
          console.log('[setupGeolocation] function error.message = ' + error.message)
          handleGeoError(error)
          geoSetupDone = true
          console.log('[setupGeolocation] function error geoSetupDone= ' + geoSetupDone)
        },
      options)
      setTimeout(function () {
        if (!geoSetupDone) {
          console.log('[setupGeolocation] No confirmation from user, using fallback')
          geoSetupDone = true
          handleGeoError()
        } else {
          console.log('[setupGeolocation] Location was set')
        }
      }, options.timeout + 1000) // Wait extra second
    } else {
      // for now, just returns MAPCENTERPOINT
      // should use browser geolocation,
      // and only return MAPCENTERPOINT if we're far from home base
      console.log('[setupGeolocation] no navigator.geolocation')
      that.currentUserLocation = Config.mapCenter
      showGeoOverlay()
      handleGeoError('no geolocation', callback)
      geoSetupDone = true
      console.log('[setupGeolocation] no geolocation geoSetupDone= ' + geoSetupDone)
    }
  }

  var handleGeoSuccess = function (position, callback) {
    console.log('handleGeoSuccess')
    console.log('[handleGeoSuccess] position lat long= ' + position.coords.latitude + ' ' + position.coords.longitude)
    that.useGeo = true
    filters.current.userLocation = new L.LatLng(position.coords.latitude, position.coords.longitude)
    console.log('[handleGeoSuccess] that.currentUserLocation = ' + filters.current.userLocation)
    var distanceToMapCenterPoint = filters.current.userLocation.distanceTo(Config.mapCenter) / 1000
    // if no map, set it up
    // always update the user marker, create if needed
    if (!userMarker) {
      userMarker = L.userMarker(filters.current.userLocation, {
        smallIcon: true,
        pulsing: true,
        accuracy: 0
      }).addTo(map)
    }
    // If user location exists, turn on geolocation button
    if (that.useGeo) {
      $('.offsetGeolocate').show()
    }
    // console.log(currentUserLocation);
    userMarker.setLatLng(filters.current.userLocation)
    if (typeof callback === 'function') {
      callback()
    }
    console.log('[setupGeolocation handleGeoSuccess] DONE')
  }

  function handleGeoError (error, callback) {
    console.log('handleGeoError')
    console.log('[handleGeoError] ' + error)
    if (!filters.current.userLocation) {
      console.log('[setupGeolocation handleGeoError] currentUserLocation does not exist')
      filters.current.userLocation = Config.mapCenter
      showGeoOverlay()
    }
    if (map && userMarker && error.code === 3) {
      console.log('[setupGeolocation handleGeoError] in If map+userMarker+error.code')
      map.removeLayer(userMarker)
      userMarker = null
    }
    if (typeof callback === 'function') {
      console.log('[setupGeolocation handleGeoError] in If callback = function statement')
      callback()
    }
    console.log('setupGeolocation handleGeoError DONE')
  }

  function showGeoOverlay () {
    var noGeolocationOverlayHTML = "<span class='closeOverlay'>x</span><p>We weren't able to get your current location, so we'll give you trailhead distances from the center of Cook County."
    $('.overlay-panel').html(noGeolocationOverlayHTML)
    $('.overlay').show()
    $('.overlay-panel').click(function () {
      $('.overlay').hide()
    })
  }

  return that
}

module.exports = geolocationFunctions
