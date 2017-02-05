'use strict'
var L = require('leaflet')
var $ = require('jquery')
require('leaflet-boundsawarelayergroup')
var Config = require('./config.js')
var eL = require('./eventListeners.js')

var activityFeature = function (map) {
  var that = {}
  var events = eL.events()
  that.originalActivitiesObject = {}
  that.originalActivitiesCreated = $.Deferred()
  // that.filteredActivitiesArray = [];
  that.filteredFG = null
  that.selectedFG = null
  that.fetchActivities = function () {
    $.getJSON(Config.activityEndpoint, function () {
      console.log('Successfully started fetching Activities at ' + performance.now())
    })
    .done(function (data) {
      console.log('Successfully finished fetching Activities at ' + performance.now())
      _createOriginalActivities(data)
    })
    .fail(function () {
      console.log('error')
    })
  }

  var _createOriginalActivities = function (data) {
    console.log('populateOriginalActivities start at: ' + performance.now())
    that.originalActivitiesObject = {}
    for (var i = 0; i < data.features.length; i++) {
      var currentFeature = data.features[i]
      var currentGeoOne = currentFeature.geometry.coordinates[1]
      var currentGeoTwo = currentFeature.geometry.coordinates[0]
      var currentFeatureLatLng = new L.LatLng(currentGeoOne, currentGeoTwo)
      var iconType = getIconName(currentFeature.properties.atype)
      var activityType = currentFeature.properties.atype
      var activityName = currentFeature.properties.name || currentFeature.properties.aname
      var mainIcon = L.divIcon({
        className: 'icon-map icon-activity activity-' + currentFeature.properties.id + ' ' + iconType + ' poi-' + currentFeature.properties.poi_info_id,
        html: '<svg class="icon icon-map icon-activity ' + iconType + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconType + '"></use></svg><br />',
        iconAnchor: [15, 20],
        popupAnchor: [0, -20],
        iconSize: null
      })
      var selectedIcon = L.divIcon({
        className: 'icon-map icon-activity selected activity-' + currentFeature.properties.id + ' ' + iconType + ' poi-' + currentFeature.properties.poi_info_id,
        html: '<svg class="icon icon-map icon-activity ' + iconType + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconType + '"></use></svg><br />',
        iconAnchor: [15, 20],
        popupAnchor: [0, -20],
        iconSize: null
      })
      var marker = new L.Marker(currentFeatureLatLng, {
        icon: mainIcon,
        zIndexOffset: 50
      })
      marker.mainIcon = mainIcon
      marker.selectedIcon = selectedIcon
      var popupContentMainDivHTML = "<div class='activity-popup'>"
      popupContentMainDivHTML += activityName
      if (activityType === 'trailhead') {
        popupContentMainDivHTML += ' Trail Access'
      }
      popupContentMainDivHTML += '</div>'
      marker.trailheadID = currentFeature.properties.poi_info_id
      marker.properties = currentFeature.properties
      marker.geometry = currentFeature.geometry
      marker.popupContent = popupContentMainDivHTML
      // console.log('activity marker.icon= ' + marker.icon)
      marker.bindPopup(marker.popupContent)
      marker.on(Config.listenType, (function (activity) {
        return function () {
          events.activityClick(activity)
        }
      })(marker))
      that.originalActivitiesObject[marker.properties.poi_info_id] = that.originalActivitiesObject[marker.properties.poi_info_id] || new L.FeatureGroup()
      that.originalActivitiesObject[marker.properties.poi_info_id].addLayer(marker)
    }
    that.originalActivitiesCreated.resolve()
    console.log('populateOriginalActivities end at: ' + performance.now())
  }

  var getIconName = function (activityType) {
    return activityType === 'Fishing Lake' ? 'icon-fishing'
          : activityType === 'aquatic center' ? 'icon-aquatic-center'
          : activityType === 'bicycle rental' ? 'icon-bike-rental'
          : activityType === 'boating center' ? 'icon-boat-rental'
          : activityType === 'boat launch' ? 'icon-boat-launch'
          : activityType === 'boat rental' ? 'icon-boat-rental'
          : activityType === 'canoe landing' ? 'icon-canoe-landing'
          : activityType === 'dog park' ? 'icon-off-leash-dog-area'
          : activityType === 'drone' ? 'icon-drone'
          : activityType === 'equestrian center' ? 'icon-facility'
          : activityType === 'frisbee golf' ? 'icon-disc-golf'
          : activityType === 'golf course' ? 'icon-golf-course-driving-range'
          : activityType === 'golf driving range' ? 'icon-golf-course-driving-range'
          : activityType === 'headquarters' ? 'icon-facility'
          : activityType === 'model airplane flying field' ? 'icon-model-airplane'
          : activityType === 'nature center' ? 'icon-nature-center'
          : activityType === 'pavilion' ? 'icon-facility'
          : activityType === 'recreation center' ? 'icon-rec-center'
          : activityType === 'recreational waterbody' ? 'icon-waterbody'
          : activityType === 'sledding' ? 'icon-sledding'
          : activityType === 'snowmobiling' ? 'icon-snowmobiling'
          : activityType === 'special activity' ? 'icon-facility'
          : activityType === 'trailhead' ? 'icon-trail-marker'
          : activityType === 'volunteer center' ? 'icon-facility'
          : activityType === 'warming shelter' ? 'icon-facility'
          : activityType === 'welcome center' ? 'icon-facility'
          : activityType === 'zipline' ? 'icon-zip-line'
          : 'icon-sign'
  }

  that.filterActivity = function (poiArray) {
    console.log('[filterActivity] start at: ' + performance.now())
    if (that.filteredFG) {
      map.removeLayer(that.filteredFG)
      that.filteredFG = null
    }
    var filteredFGArray = []
    $.each(poiArray, function (i, el) {
      var selectFG = that.originalActivitiesObject[el.properties.poi_info_id]
      if (selectFG) {
        filteredFGArray.push(selectFG)
      }
    })
    that.filteredFG = new L.FeatureGroup(filteredFGArray, {
      makeBoundsAware: true,
      minZoom: 13
    }) // .addTo(map)
    console.log('[filterActivity] end at: ' + performance.now())
  }

  that.setSelected = function (poiId) {
    var t0 = performance.now()
    console.log('[act.setSelected] poiId= ' + poiId + ' at ' + t0)
    if (that.selectedFG) {
      that.selectedFG.eachLayer(function (layer) {
        console.log('[act.setSelected] layer.mainIcon= ' + layer.mainIcon)
        layer.setIcon(layer.mainIcon)
      })
      that.selectedFG = null
    }
    var poiActivityFG = that.originalActivitiesObject[poiId]
    if (poiActivityFG) {
      that.selectedFG = poiActivityFG
      that.selectedFG.eachLayer(function (layer) {
        console.log('[act.setSelected] layer.selectedIcon= ' + layer.selectedIcon)
        layer.setIcon(layer.selectedIcon)
      })
    }
    var t1 = performance.now()
    console.log('[[act.setSelected end] time', (t1-t0).toFixed(4), 'milliseconds')
    return that.selectedFG
  }
  return that
}

module.exports = activityFeature
