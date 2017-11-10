'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')
var eL = require('./eventListeners.js')
var analyticsCode = require('./analyticsCode.js')

var trailSegmentFeature = function (map) {
  var that = {}
  var events = eL.events()
  that.segmentTrailSubsystemObject = {}
  that.filteredFG = null
  that.currentHighlightedSubsystem = null
  that.segmentsCreated = $.Deferred()
  that.fetchTrailSegments = function () {
    $.getJSON(Config.trailSegmentEndpoint, function () {
      console.log('Successfully started fetching trailSegments at ' + performance.now())
    })
    .done(function (data) {
      console.log('Successfully finished fetching trailSegments at ' + performance.now())
      _makeSegmentTrailSubsystemObject(data)
      // console.log("that.segmentTrailSubsystemObject.length = " + that.originalPoisArray.length);
    })
    .fail(function () {
      console.log('error')
    })
  }

  that.filterSegments = function (trailSubsystems) {
    console.log('[filterSegments] start')
    if (that.filteredFG) {
      map.removeLayer(that.filteredFG)
      that.filteredFG = null
    }
    var segmentArray = []
    $.each(trailSubsystems, function (index, value) {
      console.log('[filterSegments] index = ' + index)
      var segmentFGs = that.segmentTrailSubsystemObject[index]
      if (segmentFGs) {
        // segmentArray.push(segmentFGs)
        segmentArray.push(new L.FeatureGroup(segmentFGs)) // .addTo(map)
      }
    })
    if (segmentArray.length > 0) {
      console.log('[filterSegments] segmentArray.length = ' + segmentArray.length)
      that.filteredFG = new L.FeatureGroup(segmentArray)
    }
    console.log('[filterSegments] end')
  }

  var _makeSegmentTrailSubsystemObject = function (response) {
    console.log('makeAllSegmentLayer')
    // make visible layers
    var allVisibleSegmentsArray = []
    var allInvisibleSegmentsArray = []
    // allSegmentLayer = new L.FeatureGroup();
    // allVisibleSegmentLayer = new L.FeatureGroup();
    console.log('visibleAllTrailLayer start')

    // make a normal visible layer for the segments, and add each of those layers to the allVisibleSegmentsArray
    var visibleAllTrailLayer = L.geoJson(response, {
      style: segmentStyle,
      onEachFeature: function visibleOnEachFeature (feature, layer) {
        // console.log("visibleAllTrailLayer onEachFeature");
        allVisibleSegmentsArray.push(layer)
        // console.log("[visibleAllTrailLayer onEachFeature] feature.id = " + feature.id);
        // allVisibleSegmentLayer.addLayer(layer);
        // segmentObject[feature.properties.trail_subsystem.replace(/ /g, "_")] = segmentObject[feature.properties.trail_subsystem.replace(/ /g, "_")] || [];
        // segmentObject[feature.properties.trail_subsystem.replace(/ /g, "_")].push(layer);
      }
    })

    // make invisible layers

    // make the special invisible layer for mouse/touch events. much wider paths.
    // make popup html for each segment
    var invisibleAllTrailLayer = L.geoJson(response, {
      style: function (feature) {
        var thisClassName = 'invisible trail segment-' + feature.id + ' system-' + feature.properties.trail_subsystem.replace(/ /g, "_");
        return { className: thisClassName,
          opacity: 0,
          weight: 20,
          clickable: true,
          smoothFactor: 10 }
      },
      onEachFeature: function invisibleOnEachFeature (feature, layer) {
        // console.log("invisibleAllTrailLayer onEachFeature");
        allInvisibleSegmentsArray.push(layer)
      }
    })
    console.log('invisibleAllTrailLayer end')

    var numSegments = allInvisibleSegmentsArray.length
    console.log('numSegments = ' + numSegments)
    for (var i = 0; i < numSegments; i++) {
      // console.log("numSegments loop");
      var invisLayer = allInvisibleSegmentsArray[i]
      var visLayer = allVisibleSegmentsArray[i]
      visLayer.type = 'visible'
      // make a FeatureGroup including both visible and invisible components
      // var newTrailFeatureGroup = new L.FeatureGroup([allVisibleSegmentsArray[i]]);

      var newTrailFeatureGroup = new L.FeatureGroup([allInvisibleSegmentsArray[i], allVisibleSegmentsArray[i]])

      // var $popupHTML = $("<div class='trail-popup'>");

      var popupHTML = "<div class='trail-popup'>"
      var atLeastOne = false
      // console.log("[makeAllSegmentLayer] invisLayer ID = " + invisLayer.feature.properties.id);
      var segmentTrailSubsystem = invisLayer.feature.properties.trail_subsystem || null
      var segmentColor = invisLayer.feature.properties.trail_color || null
      var segmentType = invisLayer.feature.properties.trail_type || null
      var segmentNameType = invisLayer.feature.properties.segment_type || null
      var segmentDirection = invisLayer.feature.properties.direction || null
      var segmentOffFpcc = invisLayer.feature.properties.off_fpdcc || null
      var segmentName = segmentColor + ' ' + segmentType
      if (segmentNameType) {
        segmentName += ' ' + segmentNameType
      }
      if (segmentOffFpcc === 'y') {
        segmentName += ' (Non-FPCC)'
      } else if (segmentDirection) {
        segmentName += ' (' + segmentDirection + ') '
      }
      invisLayer.feature.properties.segmentName = segmentName
      if (segmentTrailSubsystem) {
        var trailPopupLineDiv = '<svg class="icon icon-arrow-right"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-arrow-right"></use></svg>'
        trailPopupLineDiv += "<div class='trail-popup-line trail-popup-line-named trail-subsystem' " +
          "data-trailsubsystem='" + segmentTrailSubsystem + "' " +
          "data-trailid='" + segmentTrailSubsystem + "' " +
          "data-trailname='" + segmentTrailSubsystem + "'> " +
          segmentTrailSubsystem + // " Trail System" +
          '</div>'
        atLeastOne = true
        trailPopupLineDiv += "<div class='trail-popup-line trail-popup-line-named trail-segment' " +
          "data-trailsubsystem='" + segmentTrailSubsystem + "'>" +
          invisLayer.feature.properties.segmentName
        trailPopupLineDiv += '</div>'
        popupHTML = popupHTML + trailPopupLineDiv
      }
      popupHTML = popupHTML + '</div>'

      invisLayer.feature.properties.popupHTML = popupHTML
      var eventType = 'click'

      newTrailFeatureGroup.addEventListener(Config.listenType, function featureGroupEventListener(invisLayer) {
        return function newMouseover (e) {
          setTimeout(function openTimeoutFunction (originalEvent, target) {
            return function () {
              var trailSubsystem = invisLayer.feature.properties.trail_subsystem;
              console.log("[trail click] " + trailSubsystem)
              var trailSubsystemNormalizedName = trailSubsystem.replace(/[& ]/g, '+')
              var analyticsName = trailSubsystem + ' ' + invisLayer.feature.properties.segmentName
              analyticsCode.trackClickEventWithGA('Segment', 'Click', analyticsName)
              events.segmentClick(trailSubsystemNormalizedName)
              //var trail = originalTrailData[trailIDs];

              var popupHTML = invisLayer.feature.properties.popupHTML
              new L.Popup({ 
                closeButton: false
              }).setContent(popupHTML).setLatLng(originalEvent.latlng).openOn(map);
              // currentWeightedSegment = target;
            }
          }(e, e.target), 250)
        }
      }(invisLayer))
      var normalizedSubsystem = segmentTrailSubsystem.replace(/[& ]/g, '+')
      that.segmentTrailSubsystemObject[normalizedSubsystem] = that.segmentTrailSubsystemObject[normalizedSubsystem] || []
      that.segmentTrailSubsystemObject[normalizedSubsystem].push(newTrailFeatureGroup)
      // allSegmentLayer.addLayer(newTrailFeatureGroup);
    }

    // use this to just show the network
    // allSegmentLayer = visibleAllTrailLayer;
    // allVisibleSegmentsArray = null;
    // allInvisibleSegmentsArray = null;
    console.log('allSegmentLayer about to add to map')
    // $.each(that.segmentTrailSubsystemObject, function(key, value) {
    //   var newFG = new L.FeatureGroup(value).addTo(map)
    // })
    that.segmentsCreated.resolve(that.segmentTrailSubsystemObject)
  }

  var segmentStyle = function (feature) {
    var thisColor = getColor(feature.properties.trail_color, feature.properties.off_fpdcc)
    var thisWeight = 3
    var thisOpacity = 1
    var thisClickable = false
    var thisSmoothFactor = 2.0
    var thisDash = that.getDashArray(feature.properties.trail_type.replace(/ /g, '_'), false)
    var thisTrailType = feature.properties.trail_type
    return {color: thisColor, weight: thisWeight, dashArray: thisDash, clickable: thisClickable, smoothFactor: thisSmoothFactor}
  }

  var getColor = function (color, offFpdcc) {
    if (color) {
      color = color.toLowerCase()
    }
    if (offFpdcc === 'y') {
      return color === 'red' ? '#F8AD96'
          : color === 'orange' ? '#FDD09E'
          : color === 'purple' ? '#BFAFD5'
          : color === 'grey' ? '#D2DAE3'
          : color === 'yellow' ? '#FFF9BD'
          : color === 'green' ? '#85AF90'
          : color === 'tan' ? '#D3D0B5'
          : color === 'olive' ? '#D3D0B5'
          : color === 'brown' ? '#C0ADA1'
          : color === 'blue' ? '#B4DDF5'
          : color === 'black' ? '#ABADAF'
          : color === 'future' ? '#D2DAE3'
          : '#C4D0DB'
    } else {
      return color === 'red' ? '#EE2D2F'
          : color === 'orange' ? '#F7941E'
          : color === 'purple' ? '#7F58A5'
          : color === 'grey' ? '#9BB0C1'
          : color === 'yellow' ? '#FFF450'
          : color === 'green' ? '#006129'
          : color === 'tan' ? '#969161'
          : color === 'olive' ? '#969161'
          : color === 'brown' ? '#6C503F'
          : color === 'blue' ? '#26B8EB'
          : color === 'black' ? '#333132'
          : color === 'future' ? '#9BB0C1'
          : '#C4D0DB'
    }
  }

  that.getDashArray = function (trailType, highlighted) {
    return trailType === 'single_track' && !highlighted ? '0,8'
        : trailType === 'primitive' && !highlighted ? '0,8'
        : trailType === 'natural_surface' && !highlighted ? '0,8'
        : trailType === 'unpaved' && !highlighted ? '7,9'
        : trailType === 'stone' && !highlighted ? '7,9'
        : trailType === 'single_track' && highlighted ? '0,10'
        : trailType === 'primitive' && highlighted ? '0,10'
        : trailType === 'natural_surface' && highlighted ? '0,10'
        : trailType === 'unpaved' && highlighted ? '7,11'
        : trailType === 'stone' && highlighted ? '7,11'
        : ''
  }

  return that
}

module.exports = trailSegmentFeature
