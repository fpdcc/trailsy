'use strict'
var L = require('leaflet')
var $ = require('jquery')
require('./vendor/leaflet.zoomcss.js')
require('leaflet-boundsawarelayergroup')
require('jquery-address')
var Config = require('./config.js')
var poiFeature = require('./poiFeature.js')
var trailSegmentFeature = require('./trailSegmentFeature.js')
var trailInfo = require('./trailInfo.js')
var activityFeature = require('./activityFeature.js')
var picnicgroveFeature = require('./picnicgroveFeature.js')
var geolocationFunctions = require('./geolocationFunctions.js')
var filterFunctions = require('./filterFunctions.js')
var eventListeners = require('./eventListeners.js')
var panelFunctions = require('./panelFunctions.js')


var trailMap = function () {
  var that = {}
  var elementId = 'trailMapLarge'
  var map = L.map(elementId, {
    renderer: L.canvas()
  }).setView(Config.mapCenter, Config.defaultZoom)
  map.removeControl(map.zoomControl)
  //map.addControl(L.control.zoom({position: 'topright'}))
  var poiFeat = poiFeature(map)
  var tSegment = trailSegmentFeature(map)
  var activityFeat = activityFeature(map)
  var picnicgroveFeat = picnicgroveFeature(map)
  var tInfo = trailInfo(map)
  var filters = filterFunctions(map)
  var geoFunctions = geolocationFunctions(map, filters)
  var pSetup = panelFunctions.setup(map, filters, poiFeat, tSegment, activityFeat, picnicgroveFeat, tInfo)
  var panel = panelFunctions.panelFuncs(map)
  var eSetup = eventListeners.setup(map, panel, filters, poiFeat, tSegment, activityFeat, picnicgroveFeat, tInfo)
  var events = eventListeners.events(map)
  // var lastZoom = null

  var $select = $('.js-example-basic-multiple').selectize({
    placeholder: 'Search by Location or Activity',
    create: true,
    createOnBlur: true,
    persist: false,
    tokenSeparators: [','],
    allowClear: true,
    closeAfterSelect: true,
    allowEmptyOption: true,
    highlight: true,
    plugins: ['remove_button'],
    // onItemAdd: function() {
    //   setTimeout(function() {
    //     console.log("[selectize] onItemAdd trigger");
    //     this.blur();
    //     this.close();
    //   }.bind(this), 200)
    // },
    onChange: function () {
      setTimeout(function () {
        console.log('[selectize] onItemRemove trigger')
        this.blur()
        this.close()
      }.bind(this), 200)
    }
  })

  $('.closeDetail').click(events.closeDetailPanel) // .click(readdSearchURL)
  $('#fpccSearchBack').click(events.closeDetailPanel) // .click(readdSearchURL)

  map.on('zoomend', function (e) {
    console.log('zoomend start ' + map.getZoom())
    // var zoomLevel = map.getZoom()
    // lastZoom = zoomLevel
    console.log('zoomend end ' + map.getZoom())
  })

  L.tileLayer('https://api.mapbox.com/styles/v1/fpdcc/cixjcxjvf000h2sml8k9cr18o/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZnBkY2MiLCJhIjoiY2l4amNtaGxjMDAwMzMzbXVucGYxdGtjbyJ9.u1Ttdy3_4xWYFdBvqKYcZA').addTo(map)
  L.control.scale({maxWidth: 500}).addTo(map)

  var poiAndTrailInfoCreated = $.when(poiFeat.originalPoisCreated, tInfo.trailInfoCreated)
  var poiSegmentsReady = $.when(poiFeat.originalPoiInfoAdded, tSegment.segmentsCreated)
  var activitiesReady = $.when(activityFeat.originalActivitiesCreated)
  var picnicgrovesReady = $.when(picnicgroveFeat.originalPicnicgrovesCreated)
  poiAndTrailInfoCreated.done(function () {
    poiFeat.addTrailInfo(tInfo.originalTrailInfo)
    console.log('filters.current = ' + filters.current)
  })

  $.address.autoUpdate(0)
  $.address.externalChange(function (event) {
    console.log('[address] externalChange event = ' + event.parameters)
    filterAll()
  })

  var filterAll = function () {
    console.log('[filterAll] start')
    poiSegmentsReady.done(function () {
      console.log('[$.when readyToFilter] start at: ' + performance.now())
      poiFeat.filterPoi(filters)
      tSegment.filterSegments(poiFeat.filteredTrailSubsystems)
      activitiesReady.done(function () {
        activityFeat.filterActivity(poiFeat.filteredPoisArray)
      })
      events.makeResults()
      // panel.makeTrailDivs(poiFeat, filters)
    })
  }

  that.fetchData = function () {
    tSegment.fetchTrailSegments()
    poiFeat.fetchPois()
    tInfo.fetchTrailInfo()
    activityFeat.fetchActivities()
    picnicgroveFeat.fetchPicnicgroves()
    geoFunctions.setupGeolocation()
  }



  return that
}

module.exports = trailMap
