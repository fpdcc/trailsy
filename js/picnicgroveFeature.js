'use strict'
var L = require('leaflet')
var $ = require('jquery')
require('leaflet-boundsawarelayergroup')
var Config = require('./config.js')

var picnicgroveFeature = function (map) {
  var that = {}
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
      var iconName = 'icon-picnic-grove' 
      var picnicgroveIcon = L.divIcon({
        className: 'icon-map picnic-grove-marker selected ' + iconName + ' picnicgrove-' + currentFeature.properties.id + ' poi-' + currentFeature.properties.poi_info_id,
        html: '<svg class="icon icon-map picnic-grove-marker ' + iconName + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconName + '"></use></svg><br />',
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
      marker.bindPopup(marker.popupContent)
      // marker.on('click', (function (activity) {
      // return function () {
      //   events.activityClick(activity)
      // }
      // var picnicgrove = {
      //   properties: currentFeature.properties,
      //   geometry: currentFeature.geometry,
      //   marker: marker,
      //   popupContent: ""
      // };
      // setTrailheadEventHandlers(trailhead);
      that.originalObject[currentFeature.properties.poi_info_id] = that.originalObject[currentFeature.properties.poi_info_id] || new L.FeatureGroup()
      that.originalObject[currentFeature.properties.poi_info_id].addLayer(marker)
    }
    that.originalPicnicgrovesCreated.resolve()
    // console.log("[populateOriginalPicnicgroves] originalPicnicgroves count " + that.originalPicnicgrovesArray.length );
    console.log('populateOriginalPicnicgroves end at: ' + performance.now())
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
