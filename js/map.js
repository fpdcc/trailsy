'use strict'
var L = require('leaflet')
var $ = require('jquery')
require('./vendor/leaflet.zoomcss.js')
require('leaflet-boundsawarelayergroup')
require('leaflet.markercluster')
require('jquery-address')
// require('svgxuse')
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
  map.locate({
    watch: true,
    enableHighAccuracy: true,
    timeout: 16000,
    maximumAge: 30000
  })

  // map.addControl(L.control.zoom({position: 'topright'}))
  var poiFeat = poiFeature(map)
  var tSegment = trailSegmentFeature(map)
  var activityFeat = activityFeature(map)
  var picnicgroveFeat = picnicgroveFeature(map)
  var tInfo = trailInfo(map)
  var filters = filterFunctions(map)
  // var geoFunctions = geolocationFunctions(map, filters, poiFeat)
  var pSetup = panelFunctions.setup(map, filters, poiFeat, tSegment, activityFeat, picnicgroveFeat, tInfo)
  var panel = panelFunctions.panelFuncs(map)
  var eSetup = eventListeners.setup(map, panel, filters, poiFeat, tSegment, activityFeat, picnicgroveFeat, tInfo)
  var events = eventListeners.events(map)
  var geoFunctions = geolocationFunctions(map, filters, poiFeat, events)

  var onLocationFound = function (e) {
    console.log('onLocationFound at time e.timestamp ' + e.timestamp)
    geoFunctions.handleGeoSuccess(e)
  }
  var onLocationError = function (e) {
    console.log('onLocationError at time e.timestamp ' + e.timestamp)
    geoFunctions.handleGeoError(e)
  }
  map.on('locationfound', onLocationFound)
  map.on('locationerror', onLocationError)
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

  // $('.closeDetail').click(events.closeDetailPanel) // .click(readdSearchURL)
  $('.fpccSearchbox').change(function (e) { that.processSearch(e) })
  $('#fpccSearchButton').on(Config.listenType, that.processSearch)
  // $('.usePoi').on(Config.listenType, that.testClick)

  map.on('zoomend', function (e) {
    console.log('zoomend start ' + map.getZoom())
    // var zoomLevel = map.getZoom()
    // lastZoom = zoomLevel
    console.log('zoomend end ' + map.getZoom())
  })
  map.on('popupopen', function popupOpenHandler (e) {
    $('.trailhead-trailname').on(Config.listenType, events.poiPopupTrailClick) // Open the detail panel!
    $('.popupTrailheadNames').on(Config.listenType, events.poiPopupNameClick)
    $('.trail-popup-line.trail-subsystem').on(Config.listenType, events.trailPopupNameClick)
  })

  L.tileLayer('https://api.mapbox.com/styles/v1/fpdcc/cixjcxjvf000h2sml8k9cr18o/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZnBkY2MiLCJhIjoiY2l4amNtaGxjMDAwMzMzbXVucGYxdGtjbyJ9.u1Ttdy3_4xWYFdBvqKYcZA',
    {
      updateWhenZooming: false
    }).addTo(map)
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
    var searchTerm = filters.addressChange()
    poiSegmentsReady.done(function () {
      if (!searchTerm) {
        console.log('[externalChange] no searchTerm')
        var fitToSearchResults = true
        var openResults = true
        geoFunctions.geoSetupDone.done(function () {
          if (filters.current.poi) {
            events.trailDivWork(null, filters.current.poi)
            fitToSearchResults = false
            openResults = false
          } else if (filters.current.trail) {
            events.trailDivWork(filters.current.trail, null)
            fitToSearchResults = false
            openResults = false
          }
          filterAll(fitToSearchResults, openResults)
        })
      }
    })
  })

  that.testClick = function (e) {
     console.log('edge listen click')
    var $myTarget = $(e.currentTarget)
    var myId = $myTarget.attr('id')
    console.log('isEdge myId = ' + myId)
  }


  var filterAll = function (fitToSearchResults, openResults) {
    console.log('[filterAll] start')
    poiSegmentsReady.done(function () {
      console.log('[$.when readyToFilter] start at: ' + performance.now())
      geoFunctions.geoSetupDone.done(function () {
        console.log('[filterAll] geoSetupDone at ' + performance.now())
        poiFeat.filterPoi(filters)
        events.makeResults(openResults)
        tSegment.filterSegments(poiFeat.filteredTrailSubsystems)
        activitiesReady.done(function () {
          activityFeat.filterActivity(poiFeat.filteredPoisArray)
        })
        // console.log('[filterAll] about to makeresults at ' + performance.now())

        if (poiFeat.filteredPoisFeatureGroup) {
          if (fitToSearchResults) {
            var zoomFeatureGroupBounds = poiFeat.filteredPoisFeatureGroup.getBounds()
            map.fitBounds(zoomFeatureGroupBounds, {
              // padding: allPadding
              // paddingTopLeft: centerOffset
            })
          }
          poiFeat.filteredPoisFeatureGroup.addTo(map)
          //if (Config.isEdge) {
          // $('.usePoi').on(Config.listenType, that.testClick)
          //}
        }
        if (activityFeat.filteredFG) {
          activityFeat.filteredFG.addTo(map)
        }
        if (tSegment.filteredFG && filters.current.trailOnMap) {
          tSegment.filteredFG.addTo(map)
        }
      })
    })
  }

  
  that.processSearch = function (e) {
    // $("#fpccSearchResults").html(loaderDiv)
    var $currentTarget = $(e.currentTarget)
    console.log('[processSearch]')
    var currentUIFilterState
    var searchKeyTimeout
    currentUIFilterState = $('#desktop .fpccSearchbox').val()
    filters.setCurrent(currentUIFilterState)
    var openResults = true
    if (filters.current.fromURL && (filters.current.poi || filters.current.trail)) {
      openResults = false
    } else {
      events.closeDetailPanel()
      // panel.addSearchURL()
    }
    filters.current.fromURL = false
    filterAll(true, openResults)
  }

  that.fetchData = function () {
    tSegment.fetchTrailSegments()
    poiFeat.fetchPois()
    tInfo.fetchTrailInfo()
    activityFeat.fetchActivities()
    picnicgroveFeat.fetchPicnicgroves()
    //geoFunctions.setupGeolocation()
  }

  return that
}

module.exports = trailMap
