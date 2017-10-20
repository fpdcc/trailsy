'use strict'
var L = require('leaflet')
var $ = require('jquery')
require('leaflet-boundsawarelayergroup')
require('leaflet.markercluster')
var Config = require('./config.js')
var eL = require('./eventListeners.js')

var alertFeat

var setup = function (alertFeature) {
  alertFeat = alertFeature
}

var poiFeature = function (map) {
  var that = {}
  var events = eL.events()
  that.originalPoisArray = []
  that.originalPoisCreated = $.Deferred()
  that.originalPoiInfoAdded = $.Deferred()
  that.filteredPoisArray = []
  that.filteredPoisFeatureGroup = null
  that.filteredTrailSubsystems = {}
  that.current = null

  that.fetchPois = function () {
    $.getJSON(Config.trailheadEndpoint, function () {
      console.log('Successfully started fetching Trailheads at ' + performance.now())
    })
    .done(function (data) {
      console.log('Successfully finished fetching Trailheads at ' + performance.now())
      _createOriginalTrailheads(data)
      console.log('mData.originalTrailheads.length = ' + that.originalPoisArray.length)
    })
    .fail(function () {
      console.log('error')
    })
  }

  var _createOriginalTrailheads = function (data) {
    console.log('populateOriginalTrailheads start at: ' + performance.now())
    var originalTrailheads = []
    for (var i = 0; i < data.features.length; i++) {
      var currentFeature = data.features[i]
      var otLength = originalTrailheads.length
      var currentGeoOne = currentFeature.geometry.coordinates[1]
      var currentGeoTwo = currentFeature.geometry.coordinates[0]
      for (var otnum = 0; otnum < otLength; otnum++) {
        var otGeoOne = originalTrailheads[otnum].geometry.coordinates[1]
        var otGeoTwo = originalTrailheads[otnum].geometry.coordinates[0]
        if ((currentGeoOne === otGeoOne) && (currentGeoTwo === otGeoTwo)) {
          currentGeoOne += 0.0003
          currentGeoTwo += 0.0003
          otGeoOne -= 0.0003
          otGeoTwo -= 0.0003
          var newOtLatLng = new L.LatLng(otGeoOne, otGeoTwo)
          originalTrailheads[otnum].setLatLng(newOtLatLng)
          // originalTrailheads[otnum].signMarker.setLatLng(newOtLatLng);
          originalTrailheads[otnum].geometry.coordinates[0] = otGeoTwo
          break
        }
      }
      var currentFeatureLatLng = new L.LatLng(currentGeoOne, currentGeoTwo)
      var mainIcon = L.divIcon({
        className: 'icon-sign icon-map poi-' + currentFeature.properties.id,
        html: '<svg class="icon icon-map icon-sign" id="poi-' + currentFeature.properties.id + '" ><use class="useMapIcon" data-type="poi" data-poiid="' + currentFeature.properties.id + '" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>',
        // iconAnchor: [13 * 0.60, 33 * 0.60],
        iconAnchor: [15, 20],
        popupAnchor: [15, 0],
        iconSize: null
        // iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
      })

      var selectedIcon = L.divIcon({
        className: 'icon-sign icon-map selected poi-' + currentFeature.properties.id,
        html: '<svg class="icon icon-map icon-sign" id="poi-' + currentFeature.properties.id + '" ><use class="useMapIcon" data-type="poi" data-poiid="' + currentFeature.properties.id + '" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>',
        // iconAnchor: [13 * 0.60, 33 * 0.60],
        iconAnchor: [15, 20],
        popupAnchor: [15, 0],
        iconSize: null
        // iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
      })

      var marker = new L.Marker(currentFeatureLatLng, {
        icon: mainIcon,
        zIndexOffset: 50
      })
      marker.mainIcon = mainIcon
      marker.selectedIcon = selectedIcon
      marker.properties = currentFeature.properties
      marker.geometry = currentFeature.geometry
      marker.trailheadID = currentFeature.properties.id
      var poiLink = encodeURIComponent(currentFeature.properties.id + '-' + currentFeature.properties.name)
      marker.link = poiLink.replace(/%20/g, '+')
      var popupContentMainDivHTML = "<div class='trailhead-popup'>"
      var popupTrailheadDivHTML = "<div class='trailhead-box'><div class='popupTrailheadNames'>" + marker.properties.name + '</div>'
      popupTrailheadDivHTML += '<svg class="icon icon-arrow-right"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-arrow-right"></use></svg>'
      popupContentMainDivHTML = popupContentMainDivHTML + popupTrailheadDivHTML
      if (marker.properties.trail_subsystem) {
        var popupTrailDivHTMLStart = "<div class='trailhead-trailname trail" + 1 + "' " +
        "data-trailname='" + marker.properties.trail_subsystem + "' " +
        "data-trailid='" + marker.properties.trail_subsystem + "' " +
        "data-trailheadname='" + marker.properties.trail_subsystem + "' " +
        "data-trailheadid='" + marker.properties.trail_subsystem + "' " +
        "data-index='" + 1 + "'>"
        var statusHTML = ''
        var trailNameHTML = "<div class='popupTrailNames'>" + marker.properties.trail_subsystem + '</div>'
        trailNameHTML += '<svg class="icon icon-arrow-right"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-arrow-right"></use></svg>'
        var popupTrailDivHTML = popupTrailDivHTMLStart + statusHTML + trailNameHTML + '</div>'
        popupContentMainDivHTML = popupContentMainDivHTML + popupTrailDivHTML
      }
      popupContentMainDivHTML = popupContentMainDivHTML + '</div>'
      marker.popupContent = popupContentMainDivHTML
      marker.on(Config.listenType, (function (poi) {
        return function () {
          console.log('poi marker listenType = ' + Config.listenType)
          events.poiClick(poi)
        }
      })(marker))
      // setTrailheadEventHandlers(trailhead);
      originalTrailheads.push(marker)
    }
    that.originalPoisArray = originalTrailheads
    $.each(that.originalPoisArray, function (i, el) {
      if (el.properties.parking_connection_poi) {
        var closeParkingPoi = that.getPoiById(el.properties.parking_connection_poi)
        el.closeParkingLink = closeParkingPoi.link
      }
    })
    that.originalPoisCreated.resolve(originalTrailheads)
    console.log('[populateOriginalTrailheads] originalTrailheads count ' + originalTrailheads.length)
    console.log('populateOriginalTrailheads end at: ' + performance.now())
  }

  that.addTrailInfo = function (trailInfo) {
    console.log('[poiFeature.addTrailInfo] start at: ' + performance.now())
    var poiArrayLength = that.originalPoisArray.length
    for (var i = 0; i < poiArrayLength; i++) {
      var poi = that.originalPoisArray[i]
      var normalizedNames = []
      var normalizedDescriptions = []
      if (poi.properties.direct_trail_id) {
        var poiTrail = trailInfo[poi.properties.direct_trail_id]
        if (poiTrail) {
          normalizedNames.push(poiTrail.trail_subsystem.toLowerCase())
          if (poiTrail.alt_name) {
            normalizedNames.push(poiTrail.alt_name.toLowerCase())
          }
          if (poiTrail.trail_desc) {
            normalizedDescriptions.push(poiTrail.trail_desc.toLowerCase())
          }
        }
      }
      if (poi.properties.name) {
        normalizedNames.push(poi.properties.name.toLowerCase())
      }
      if (poi.properties.alt_names) {
        poi.properties.alt_names.forEach(function (value, index) {
          normalizedNames.push(value.toLowerCase())
        })
      }
      if (poi.properties.description) {
        normalizedDescriptions.push(poi.properties.description.toLowerCase())
      }
      var normalizedAddress = ''
      if (poi.properties.web_street_addr) {
        normalizedAddress = poi.properties.web_street_addr.toLowerCase()
      }
      poi.properties.normalizedNames = normalizedNames
      poi.properties.normalizedDescriptions = normalizedDescriptions
      poi.properties.normalizedAddress = normalizedAddress
    }
    that.originalPoiInfoAdded.resolve()
    console.log('[poiFeature.addTrailInfo] end at: ' + performance.now())
  }

  that.filterPoi = function (filters) {
    console.log('[filterPoi start] at: ' + performance.now())
    var poiArrayLength = that.originalPoisArray.length
    that.filteredPoisArray = []
    that.filteredTrailSubsystems = {}
    if (that.filteredPoisFeatureGroup) {
      map.removeLayer(that.filteredPoisFeatureGroup)
      that.filteredPoisFeatureGroup = null
    }
    // filters.current.search = filters.current.search.filter(Boolean)

    for (var poiNum = 0; poiNum < poiArrayLength; poiNum++) {
      var poi = that.originalPoisArray[poiNum]
      var filterScore = filterResult(poi, filters)
      if (filterScore > 0) {
        that.filteredPoisArray.push(that.originalPoisArray[poiNum])
        var thisTrailSubsystem = that.originalPoisArray[poiNum].properties.trail_subsystem
        if (thisTrailSubsystem) {
          thisTrailSubsystem = thisTrailSubsystem.replace(/[& ]/g, '+')
          that.filteredTrailSubsystems[thisTrailSubsystem] = 1
        }
      }
    }
    that.reorderPois(filters)
    if (that.filteredPoisArray.length !== 0) {
      that.filteredPoisFeatureGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        disableClusteringAtZoom: 13,
        spiderfyOnMaxZoom: false,
        maxClusterRadius: 60,
        iconCreateFunction: function (cluster) {
          if (Config.isEdge) {
            return new L.Icon({
              iconUrl: 'icons/sign-01.png',
              iconAnchor: [15, 20],
              popupAnchor: [15, 0],
              iconSize: [30, 30] // size of the icon
            })
          } else {
            return L.divIcon({
              className: 'icon-sign icon-map icon-cluster cluster-count' + cluster.getChildCount(),
              html: '<svg class="icon icon-map icon-sign icon-cluster" ><use class="usePoi" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>',
              // iconAnchor: [13 * 0.60, 33 * 0.60],
              iconAnchor: [15, 20],
              popupAnchor: [15, 0],
              iconSize: null
              // iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
            })
          }
        }
      })
      that.filteredPoisFeatureGroup.addLayers(that.filteredPoisArray)
      that.filteredPoisFeatureGroup.addTo(map)
    }
    return that.filteredPoisFeatureGroup
  }

  that.reorderPois = function (filters) {
    console.log('[poiFeature.reorderPois] start')
    $.each(that.filteredPoisArray, function (i, el) {
      var distance = null
      var currentFeatureLatLng = el.getLatLng()
      var useDistance = true
      if (filters.current.searchLocation) {
        distance = currentFeatureLatLng.distanceTo(filters.current.searchLocation)
        el.sortVar = distance
      } else if (filters.current.userLocation) {
        distance = currentFeatureLatLng.distanceTo(filters.current.userLocation)
        el.sortVar = distance
      } else {
        useDistance = false
        //distance = currentFeatureLatLng.distanceTo(Config.mapCenter)
        el.sortVar = el.properties.name
      }
      el.properties.distance = distance
    })

    that.filteredPoisArray.sort(function (a, b) {
      // console.log("a and b.properties.filterResult = " + a.properties.filterScore + " vs " + b.properties.filterScore);
      if (a.properties.filterScore > b.properties.filterScore) return -1
      if (a.properties.filterScore < b.properties.filterScore) return 1
      if (a.sortVar < b.sortVar) return -1
      if (a.sortVar > b.sortVar) return 1
      return 0
    })
    console.log('[poiFeature.reorderPois] DONE')
  }

  that.setSelected = function (poi) {
    if (that.current) {
      that.current.setIcon(that.current.mainIcon)
    }
    that.current = null
    if (poi) {
      that.current = poi
      that.current.setIcon(that.current.selectedIcon)
    }
  }

  var filterResult = function (poi, filters) {
    var filterScore = 1
    var term = 1
    var equivalentWords = [
      [' and ', ' & '],
      ['tow path', 'towpath']
    ]
    for (var i = 0; i < filters.current.search.length; i++) {
      var activity = filters.current.search[i]
      // console.log('[filterResult] activityFilter = ' + activity)
      term = 0
      var normalizedSearchFilter = filters.current.search[i].toLowerCase()
      var normalizedSearchArray = normalizedSearchFilter.split(' ')
      $.each(equivalentWords, function (i, el) {
        var regexToken = '(' + el[0] + '|' + el[1] + ')'
        normalizedSearchFilter = normalizedSearchFilter.replace(el[0], regexToken)
        normalizedSearchFilter = normalizedSearchFilter.replace(el[1], regexToken)
      })
      var searchRegex = new RegExp(normalizedSearchFilter)
      var addressMatched = !!poi.properties.normalizedAddress.match(searchRegex)
      var descriptionMatched = false
      $.each(poi.properties.normalizedDescriptions, function (index, value) {
        var matchResult = !!value.match(searchRegex)
        if (matchResult) {
          descriptionMatched = true
        }
      })

      var nameMatched = false
      $.each(poi.properties.normalizedNames, function (index, value) {
        var matchResult = !!value.match(searchRegex)
        if (matchResult) {
          nameMatched = true
          return false
        } else {
          var subMatched = true
          $.each(normalizedSearchArray, function (searchIndex, searchValue) {
            var elementSearch = value.search(searchValue)
            if (elementSearch === -1) {
              // console.log("[filterResults2] In elementSearch = -1");
              subMatched = false
              return false
            }
          })
          if (subMatched) {
            nameMatched = true
          }
        }
      })

      if (nameMatched) {
        term = 10
      } else if (descriptionMatched) {
        term = 1
      } else if ((poi.properties.tags) && (poi.properties.tags[':panel']) && (poi.properties.tags[':panel'].indexOf(normalizedSearchFilter) > -1)) {
        term = 1
      } else if ((poi.properties.tags) && (poi.properties.tags[':search']) && (poi.properties.tags[':search'].indexOf(normalizedSearchFilter) > -1)) {
        term = 1
      } else if (addressMatched) {
        term = 1
      }
      filterScore = filterScore * term
    }
    if (filters.current.hasAlerts) {
      var poiAlerts = alertFeat.poiAlerts[poi.properties.id] || []
      console.log('poiAlerts = ' + poiAlerts)
      if (poiAlerts.length == 0) {
        filterScore = 0
      }
    }
    poi.properties.filterScore = filterScore
    return filterScore
  }

  that.getPoiById = function (poiID) {
    console.log('getPoiById start for poiID = ' + poiID)
    var trailhead = null
    // console.log('[getPoiById] that.originalPoisArray.length = ' + that.originalPoisArray.length)
    for (var i = 0; i < that.originalPoisArray.length; i++) {
      if (that.originalPoisArray[i].properties.id == poiID) {
        trailhead = that.originalPoisArray[i]
        break
      }
    }
    return trailhead
  }

  return that
}

//module.exports = poiFeature


module.exports = {
  setup: setup,
  poiFeature: poiFeature
}