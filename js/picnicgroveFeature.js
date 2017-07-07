'use strict'
var L = require('leaflet')
var $ = require('jquery')
require('leaflet-boundsawarelayergroup')
var Config = require('./config.js')
var eL = require('./eventListeners.js')
var analyticsCode = require('./analyticsCode.js')

var picnicgroveFeature = function (map) {
  var that = {}
  var events = eL.events()
  that.originalPicnicgrovesArray = []
  that.originalObject = {}
  that.highlightFG = null
  that.originalPicnicgrovesCreated = $.Deferred()

  that.fetchPicnicgroves = function () {
    $.getJSON(Config.picnicgroveEndpoint, function () {
      console.log('Successfully started fetching Picnicgroves at ' + performance.now())
    })
    .done(function (data) {
      console.log('Successfully finished fetching Picnicgroves at ' + performance.now())
      _createOriginalPicnicgroves(data)
      console.log('mData.originalPicnicgrovesArray.length = ' + that.originalPicnicgrovesArray.length)
    })
    .fail(function () {
      console.log('error')
    })
  }

  var _createOriginalPicnicgroves = function (data) {
    console.log('populateOriginalPicnicgroves start at: ' + performance.now())
    that.originalObject = {}
    for (var i = 0; i < data.features.length; i++) {
      var currentFeature = data.features[i]
      var currentGeoOne = currentFeature.geometry.coordinates[1]
      var currentGeoTwo = currentFeature.geometry.coordinates[0]
      var currentFeatureLatLng = new L.LatLng(currentGeoOne, currentGeoTwo)

      var popupContentMainDivHTML = "<div class='picnicgrove-popup'>"
      popupContentMainDivHTML += currentFeature.properties.preserve_name
      popupContentMainDivHTML += ' Grove #' + currentFeature.properties.grove
      popupContentMainDivHTML += '</div>'
      if (currentFeature.properties.capacity) {
        popupContentMainDivHTML += '<div class="picnicgrove-capacity">Capacity: ' +
                                    currentFeature.properties.capacity + '</div>'
      }
      var iconName = 'icon-picnic-grove'
      if (currentFeature.properties.grove_type === 'shelter') {
        iconName = 'icon-picnic-grove-shelter'
      }
      var picnicgroveIcon = L.divIcon({
        className: 'icon-map picnic-grove-marker selected ' + iconName + ' picnicgrove-' + currentFeature.properties.id + ' poi-' + currentFeature.properties.poi_info_id,
        html: '<svg class="icon icon-map picnic-grove-marker ' + iconName + '"><use class="useMapIcon" data-type="picnicgrove" data-poiId="' + currentFeature.properties.poi_info_id + '" data-id="' + currentFeature.properties.id + '" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconName + '"></use></svg><br />',
        iconAnchor: [15, 20],
        popupAnchor: [0, -20],
        iconSize: null
      })

      var marker = new L.Marker(currentFeatureLatLng, {
        icon: picnicgroveIcon,
        alt: popupContentMainDivHTML,
        zIndexOffset: -50
      })
      // = currentFeature.properties.poi_info_id;
      // console.log("signMarker.trailheadID = " + signMarker.trailheadID);
      marker.popupContent = popupContentMainDivHTML
      marker.properties = currentFeature.properties
      marker.on(Config.listenType, (function (picnicgrove) {
        return function () {
          that.pgClickSetup(picnicgrove)
        }
      })(marker))
      that.originalPicnicgrovesArray.push(marker)
      that.originalObject[currentFeature.properties.poi_info_id] = that.originalObject[currentFeature.properties.poi_info_id] || new L.FeatureGroup()
      that.originalObject[currentFeature.properties.poi_info_id].addLayer(marker)
    }
    that.originalPicnicgrovesCreated.resolve()
    // console.log("[populateOriginalPicnicgroves] originalPicnicgroves count " + that.originalPicnicgrovesArray.length );
    console.log('populateOriginalPicnicgroves end at: ' + performance.now())
  }

  that.pgClickSetup = function (picnicgrove) {
    var analyticsName = picnicgrove.properties.preserve_name + '-' + picnicgrove.properties.grove
    analyticsCode.trackClickEventWithGA('Marker', 'picnicgroveClick', analyticsName)
    events.openPopup(picnicgrove.popupContent, picnicgrove.getLatLng())
  }

  that.getById = function (id) {
    console.log('picnicgrove.getById start for id = ' + id)
    var picnicgrove = null
    // console.log('[getPoiById] that.originalPoisArray.length = ' + that.originalPoisArray.length)
    for (var i = 0; i < that.originalPicnicgrovesArray.length; i++) {
      if (that.originalPicnicgrovesArray[i].properties.id == id) {
        picnicgrove = that.originalPicnicgrovesArray[i]
        break
      }
    }
    return picnicgrove
  }

  that.highlight = function (poiId) {
    var t0 = performance.now()
    console.log('[picnicgrove.highlight start] at: ' + t0)
    if (that.highlightFG) {
      map.removeLayer(that.highlightFG)
      that.highlightFG = null
    }
    var selectFG = that.originalObject[poiId]
    if (selectFG) {
      that.highlightFG = selectFG.addTo(map)
    }
    var t1 = performance.now()
    console.log('[picnicgrove.highlight end] time', (t1-t0).toFixed(4), 'milliseconds');
    return that.highlightFG
  }
  return that
}

module.exports = picnicgroveFeature
