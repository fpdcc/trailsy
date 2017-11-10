'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')
var analyticsCode = require('./analyticsCode.js')

var my = {
  map: null,
  panel: null,
  poiFeat: null,
  tsFeat: null,
  actFeat: null,
  pgFeat: null,
  trailInfo: null,
  alertFeat: null
}

var setup = function (map, panel, filters, poiFeature, trailSegmentFeature, activityFeature, picnicgroveFeature, trailInfo, alertFeature) {
  my.map = map
  my.panel = panel
  my.filters = filters
  my.poiFeat = poiFeature
  my.tsFeat = trailSegmentFeature
  my.actFeat = activityFeature
  my.pgFeat = picnicgroveFeature
  my.trailInfo = trailInfo
  my.alertFeat = alertFeature
}

var events = function (map) {
  var that = {}
  var panel = my.panel

  window.onload = function () {
    // that.setHeights()
    $('#fpccSearchBack').on(Config.listenType, that.closeDetailPanel) // .click(readdSearchURL)
    $('#fpccMobileSearchButton').on(Config.listenType, that.closeDetailPanel)
    $('#fpccMobileCheckbox').on('click', panel.showfpccMainContainer)
    $('.offsetZoomControl').click(offsetZoomIn)
    $('.aboutLink').click(panel.openAboutPage)
    $('.fpccMenu').on(Config.listenType, panel.changeMenuDisplay)
    $('.fpccMenuList li').on(Config.listenType, panel.changeMenuDisplay)
    $('.fpccMobileMenuList li').on(Config.listenType, panel.changeMobileMenuDisplay)
    // $('.fpccMenuList a').on(Config.listenType, panel.changeMenuDisplay)
    $('.fpccMobileHamburger').on(Config.listenType, panel.changeMobileMenuDisplay)
    // $('.usePoi').on(Config.listenType, that.testClick)
    $('body').on(Config.listenType, '.fpccAlertHead', panel.toggleAlerts)
  }

  var offsetZoomIn = function (e) {
    // get map center lat/lng
    // convert to pixels
    // add offset
    // convert to lat/lng
    // setZoomAround to there with currentzoom + 1
    var centerLatLng = map.getCenter()
    // var centerPoint = map.latLngToContainerPoint(centerLatLng);
    // var offset = centerOffset;
    // var offsetCenterPoint = centerPoint.add(offset.divideBy(2));
    // var offsetLatLng = map.containerPointToLatLng(offsetCenterPoint);
    if ($(e.target).hasClass('offsetZoomIn')) {
      map.setZoomAround(centerLatLng, map.getZoom() + 1)
    } else if ($(e.target).hasClass('offsetZoomOut')) {
      map.setZoomAround(centerLatLng, map.getZoom() - 1)
    }
    // else if ($(e.target).hasClass("offsetGeolocate")) {
    //   // console.log('Centering on geolocaton');
    //   var userPoint = map.latLngToContainerPoint(currentUserLocation);
    //   var offsetUserLocation = userPoint.subtract(offset.divideBy(2));
    //   var offsetUserLatLng = map.containerPointToLatLng(offsetUserLocation);
    //   map.setView(offsetUserLatLng, map.getZoom());
    // }
  }

  that.testClick = function (e) {
    console.log('edge test in event"')
  }

  that.poiPopupNameClick = function () {
    my.panel.slideDetailPanel(true)
  }

  that.poiPopupTrailClick = function (e) {
    var $myTarget = $(e.currentTarget)
    var trailSubsystemName = $myTarget.attr('data-trailname')
    var trailSubsystemNormalizedName = trailSubsystemName.replace(/[& ]/g, '+')
    console.log('[poiPopupTrailClick] trailSubsystemNormalizedName = ' + trailSubsystemNormalizedName)
    that.segmentClick(trailSubsystemNormalizedName)
    my.panel.slideDetailPanel(true)
  }

  that.trailPopupNameClick = function () {
    my.panel.slideDetailPanel(true)
  }

  that.closeDetailPanel = function () {
    console.log('events.closeDetailPanel')
    console.log('events.closeDetailPanel Config.listenType = ' + Config.listenType)
    my.panel.toggleDetailPanel('close')
    setTimeout(function () {
      map.closePopup()
      that.highlightPoi(null)
      that.highlightSegmentsForSubsystem(null)
    }, 0)
  }

  that.makeResults = function (poiFeat, trailInfo, filters, open) {
    panel.makeTrailDivs(poiFeat, trailInfo, filters, open)
    $('.fpccEntry').on(Config.listenType, that.trailDivClickHandler)
  }

  that.trailDivClickHandler = function (e) {
    console.log('trailDivClickHandler start')
    // document.getElementById('fpccContainer').innerHTML = loaderDiv
    panel.toggleDetailPanel('open')
    var $myTarget = $(e.currentTarget)
    var divTrailID = $myTarget.attr('data-trailid')
    var divTrailName = $myTarget.attr('data-trailname')
    var divPoiName = $myTarget.attr('data-trailheadName')
    console.log(divTrailID)
    var trailSubsystem = null
    var divPoiId = $myTarget.attr('data-trailheadid')
    console.log('trailDivClickHandler divPoiId = ' + divPoiId)
    if (divTrailName) {
      trailSubsystem = divTrailName
      that.trailDivWork(trailSubsystem, null)
    } else {
      console.log('trailDivClickHandler else divPoiId = ' + divPoiId)
      that.trailDivWork(null, divPoiId)
    }
  }

  that.trailDivWork = function (trailSubsystemName, poiId) {
    if (trailSubsystemName) {
      panel.showDetails(my, trailSubsystemName, null)
    } else {
      var divPoi = my.poiFeat.getPoiById(poiId)
      console.log('trailDivWork divPoi = ' + divPoi)
      console.log('[trailDivWork] about to showTrailDetails(divTrail, divTrailhead)')
      panel.showDetails(my, null, divPoi)
      if (divPoi.properties.direct_trail_id) {
        trailSubsystemName = my.trailInfo.originalTrailInfo[divPoi.properties.direct_trail_id].trail_subsystem.replace(/[& ]/g, '+')
      }
    }
    setTimeout(function () {
      console.log('trailDivWork setTimeout')
      var trailsGroupBounds = that.highlightSegmentsForSubsystem(trailSubsystemName)
      var trailheadGroupBounds = that.highlightPoi(divPoi)
      var zoomFeatureGroupBounds = null

      if (divPoi) {
        zoomFeatureGroupBounds = trailheadGroupBounds
      } else {
        zoomFeatureGroupBounds = trailsGroupBounds
      }
      console.log('[trailDivWork] before fitbounds')
      console.log('[trailDivWork] my.panel.padding = ' + my.panel.padding)
      map.fitBounds(zoomFeatureGroupBounds, {
        paddingTopLeft: my.panel.padding,
        paddingBottomRight: my.panel.paddingRight
      })
    }, 0)
    console.log('trailDivWork end')
  }

  that.testFunction = function (trailSubsystem) {
    console.log('[eventListeners testFunction] trailSubsystem = ' + trailSubsystem)
    console.log('[eventListeners testFunction] my.poiFeat = ' + my.poiFeat)
  }

  that.poiClick = function (poi) {
    console.log('[events poiClick] start')
    analyticsCode.trackClickEventWithGA('Marker', 'poiClick', poi.properties.name)
    var zoomFeatureGroupBounds = that.highlightPoi(poi)
    var trailSubsystem = poi.properties.trail_subsystem || null
    that.highlightSegmentsForSubsystem(trailSubsystem)
    if (my.map.getBoundsZoom(zoomFeatureGroupBounds) >= my.map.getZoom()) {
      my.map.fitBounds(zoomFeatureGroupBounds,
        {
          paddingTopLeft: my.panel.padding,
          paddingBottomRight: my.panel.paddingRight
        })
    } else {
      my.map.fitBounds(zoomFeatureGroupBounds, {
        maxZoom: my.map.getZoom(),
        paddingTopLeft: my.panel.padding,
        paddingBottomRight: my.panel.paddingRight
      })
    }
    my.panel.showDetails(my, null, poi)
    console.log('[events poiClick] end')
  }

  that.activityClick = function (poiId) {
    var lastPoi = ''
    var lastPoiId = ''
    if (my.poiFeat.current) {
      lastPoi = my.poiFeat.current
      lastPoiId = lastPoi.properties.id
    }
    var poi = my.poiFeat.getPoiById(poiId)
    if (poi) {
      my.panel.showDetails(my, null, poi)
      if (lastPoiId != poiId) {
        var zoomFeatureGroupBounds = that.highlightPoi(poi, false)
        var trailSubsystem = null
        if (poi.properties.direct_trail_id) {
          trailSubsystem = my.trailInfo.originalTrailInfo[poi.properties.direct_trail_id].trail_subsystem
          trailSubsystem = trailSubsystem.replace(/[& ]/g, '+')
        }
        that.highlightSegmentsForSubsystem(trailSubsystem)
        my.map.fitBounds(zoomFeatureGroupBounds, {
          maxZoom: my.map.getZoom(),
          paddingTopLeft: my.panel.padding,
          paddingBottomRight: my.panel.paddingRight
        })
      }
    }
  }

  that.addEdgeEventHandlers = function () {
    if (Config.isEdge) {
      // console.log('isEdge')
      $('.useMapIcon').on(Config.listenType, that.edgeClick)
    }
  }

  that.edgeClick = function (e) {
    console.log('edge listen click')
    var $myTarget = $(e.currentTarget)
    var iconType = $myTarget.attr('data-type')
    var poiId = $myTarget.attr('data-poiid')
    var id = $myTarget.attr('data-id')
    console.log('edgeClick poiId = ' + poiId + ' iconType = ' + iconType)
    if (iconType === 'activity') {
      var activity = my.actFeat.getById(id)
      that.openPopup(activity.popupContent, activity.getLatLng())
      that.activityClick(poiId)
    } else if (iconType === 'poi') {
      var poi = my.poiFeat.getPoiById(poiId)
      that.poiClick(poi)
    } else if (iconType === 'picnicgrove') {
      var picnicgrove = my.pgFeat.getById(id)
      that.openPopup(picnicgrove.popupContent, picnicgrove.getLatLng())
    }
  }

  that.highlightPoi = function (poi, openPopup) {
    console.log('[events highlightPoi] start')
    if (openPopup === undefined) {
      openPopup = true
    }
    var zoomArray = []
    my.actFeat.setSelected(null)
    my.pgFeat.highlight(null)
    my.poiFeat.setSelected(poi)
    if (poi) {
      zoomArray.push(my.poiFeat.current)
      var myEntranceID = 'poi-' + my.poiFeat.current.properties.id
      console.log('[poiFeature highlight] new my.poiFeat.current = ' + myEntranceID)
      // $('.leaflet-marker-icon.' + myEntranceID).addClass('selected')
      if (openPopup) {
        my.map.closePopup()
        console.log('[poiFeature highlight] create + open popup')
        var popup = new L.Popup({
          offset: [0, -12],
          autoPan: true,
          autoPanPadding: [5, 5],
          closeButton: false
          // autoPan: SMALL ? false : true
        })
        .setContent(my.poiFeat.current.popupContent)
        .setLatLng(my.poiFeat.current.getLatLng())
        .openOn(my.map)
      }
      var activitySelectedFG = my.actFeat.setSelected(poi.properties.id)
      if (activitySelectedFG) {
        zoomArray = zoomArray.concat(activitySelectedFG)
      }
      var picnicgroveSelectedFG = my.pgFeat.highlight(poi.properties.id)
      if (picnicgroveSelectedFG) {
        zoomArray = zoomArray.concat(picnicgroveSelectedFG)
      }
    } else {
      my.map.closePopup()
    }
    that.addEdgeEventHandlers()
    var zoomFeatureGroup = new L.FeatureGroup(zoomArray)
    var zoomBounds = zoomFeatureGroup.getBounds()
    return zoomBounds
  }

  that.openPopup = function (popupContent, location) {
    my.map.closePopup()
    console.log('[open Popup] create + open popup')
    if (popupContent && location) {
      var popup = new L.Popup({
        offset: [0, -12],
        autoPanPadding: [10, 10],
        closeButton: false
        // autoPan: SMALL ? false : true
      })
      .setContent(popupContent)
      .setLatLng(location)
      .openOn(my.map)
    }
  }

  that.segmentClick = function (trailSubsystemNormalizedName) {
    console.log('[events segmentClick] start')
    my.panel.showDetails(my, trailSubsystemNormalizedName, null)
    that.highlightSegmentsForSubsystem(trailSubsystemNormalizedName)
    that.highlightPoi(null)
  }

  that.highlightSegmentsForSubsystem = function (trailSubsystem) {
    var t0 = performance.now()
    console.log('[events highlightSegmentsForSubsystem] start trailSubsystem = ' + trailSubsystem)
    var zoomBounds = null
    if (my.tsFeat.currentHighlightedSubsystem) {
      console.log('[events highlightSegmentsForSubsystem] there is a current currentHighlightedSubsystem')
      var oldSegments = my.tsFeat.segmentTrailSubsystemObject[my.tsFeat.currentHighlightedSubsystem]
      $.each(oldSegments, function (i, el) {
        el.eachLayer(function (layer) {
          if (layer.type === 'visible') {
            layer.setStyle({
              weight: 3,
              dashArray: my.tsFeat.getDashArray(layer.feature.properties.trail_type, false)
            })
          }
        })
      })
      my.tsFeat.currentHighlightedSubsystem = null
    }
    if (trailSubsystem) {
      trailSubsystem = trailSubsystem.replace(/[& ]/g, '+')
      var segments = my.tsFeat.segmentTrailSubsystemObject[trailSubsystem]
      $.each(segments, function (i, el) {
        el.eachLayer(function (layer) {
          if (layer.type === 'visible') {
            layer.setStyle({
              weight: 7,
              dashArray: my.tsFeat.getDashArray(layer.feature.properties.trail_type, true)
            })
          }
        })
      })
      if (segments) {
        var currentHighlightedSegmentLayer = new L.FeatureGroup(segments)
        zoomBounds = currentHighlightedSegmentLayer.getBounds()
      }
      my.tsFeat.currentHighlightedSubsystem = trailSubsystem
    }
    var t1 = performance.now()
    console.log('[events highlightSegmentsForSubsystem end] time', (t1-t0).toFixed(4), 'milliseconds');
    return zoomBounds
  }

  return that
}

module.exports = {
  setup: setup,
  events: events
}
