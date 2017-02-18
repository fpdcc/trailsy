'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')
var eL = require('./eventListeners.js')
var map
var filters
var panel
var poiFeat
var tsFeat
var actFeat
var pgFeat
var trailInfo
var events

var setup = function (myMap, myFilters, myPoiFeature, myTrailSegmentFeature, myActivityFeature, myPicnicgroveFeature, myTrailInfo) {
  map = myMap
  filters = myFilters
  poiFeat = myPoiFeature
  tsFeat = myTrailSegmentFeature
  actFeat = myActivityFeature
  pgFeat = myPicnicgroveFeature
  trailInfo = myTrailInfo
}

var panelFuncs = function (map) {
  var that = {}
  that.SMALL = false
  var loaderDiv = '<div class="loader"></div>'
  var events = eL.events(map)

  that.currentDetailPanelHTML = ''

  var aboutHTML = '<div id="fpccPreserveName" class="detailPanelBanner"><span id="fpccTrailName" class="trailName">About</span><svg id="closeAbout" class="icon icon-x closeDetail"><use xlink:href="icons/defs.svg#icon-x"></use></svg></div><div id="fpccPreserveInfo" class="detailPanelBody"><div id="fpccContainer" class="fpccContainer">' +
                  '<p>Welcome to the <a href="http://fpdcc.com/">Forest Preserves  of Cook County</a>. This web map is designed to help current and future  visitors:</p>' +
                  '<ul><li>Plan trips </li>' +
                  '<li>Physically navigate preserves, trails and other  amenities</li>' +
                  '<li>Discover new opportunities within the preserves</li></ul>' +
                  '<p>Please consider <a href="https://script.google.com/macros/s/AKfycby6fEFxi92eh152A7x4iPy6tRjevGbpRgCUTTaKNMBfwqdDHVvZ/exec">leaving  us feedback</a> so we can continue to improve this map. Learn more about the  Forest Preserves of Cook County at <a href="http://fpdcc.com/">fpdcc.com</a>.</p>' +
                  '<h2 class="fpccSegmentName">Development</h2>' +
                  '<p>This project is a partnership between the Forest Preserves of Cook County and <a href="http://www.smartchicagocollaborative.org/">Smart  Chicago</a>. The resulting web application is built on two pieces of source  code: <a href="https://github.com/codeforamerica/trailsy">Trailsy</a> and <a href="https://github.com/codeforamerica/trailsyserver">Trailsy Server</a>, both  pioneered by <a href="https://www.codeforamerica.org/">Code for America</a>.  All of the data used to power the site is open for all and conforms to the <a href="http://archive.codeforamerica.org/specifications/trails/">OpenTrails  specification</a>, modified for data types not in the existing specification.</p>' +
                  '<p>Smart Chicago consultant <a href="http://www.smartchicagocollaborative.org/people/consultants/current-consultants/josh-kalov/">Josh  Kalov</a> is the main developer of this project. <a href="https://github.com/smartchicago/trailsy/">View the project&rsquo;s GitHub page  here</a>.</p>' +
                  '<h2 class="class="fpccSegmentName">Funding</h2>' +
                  '<p>Made possible with funding from the Centers for Disease  Control and Prevention through the Healthy Hotspot initiative led by the Cook  County Department of Public Health. Learn more at <a href="http://healthyhotspot.org/">healthyhotspot.org</a>. Smart Chicago  provided in-kind services for this project.</p>' +
                  '</div></div>'

  // Open/close fpccMenu list
  that.changeMenuDisplay = function () {
    console.log("changeMenuDisplay")
    if ($('.fpccMenuList').hasClass('hide')) {
      $('.fpccMenuList').removeClass('hide')
      $('.fpccMenuList').addClass('show')
    } else {
      $('.fpccMenuList').removeClass('show')
      $('.fpccMenuList').addClass('hide')
    }
  }

  that.openAboutPage = function () {
    console.log('openAboutPage')
    that.populateDetailPanel(aboutHTML)
    that.toggleDetailPanel('open')
  }

  that.closeAboutPage = function () {
    console.log('closeAboutPage')
    if (that.currentDetailPanelHTML) {
      that.populateDetailPanel(that.currentDetailPanelHTML)
    } else {
      that.toggleDetailPanel('close')
    }
  }

  window.onload = function () {
    that.setHeights()
    
  }

  var testCloseDetail = function () {
    console.log('closure clicked!')
  }
  window.onresize = function () {
    that.setHeights()
  }

  that.setHeights = function () {
    if (window.innerWidth <= 768) {
      that.SMALL = true
    } else {
      that.SMALL = false
    }
    var h = window.innerHeight
    var k = document.getElementById('fpccBrand').offsetHeight
    var l = document.getElementById('fpccBrandMobile').offsetHeight
    var m = document.getElementById('fpccPreserveName').offsetHeight
    var o = document.getElementById('fpccSearchBack').offsetHeight
    var p = document.getElementById('fpccSearchStatus').offsetHeight
    var q = document.getElementById('fpccSearchContainer').offsetHeight
    console.log('[setHeights] h = ' + h)
    console.log('[setHeights] k + l + m + o + p + q = ' + k + ' + ' + l + ' + ' + m + ' + ' + o + ' + ' + p + ' + ' + q)
    var fpccSearchResultsHeight = (h - (k + l + o + p + q))
    fpccSearchResultsHeight = fpccSearchResultsHeight.toString() + 'px'
    console.log('[setHeights] fpccSearchResultsHeight= ' + fpccSearchResultsHeight)
    document.getElementById('fpccSearchResults').style.maxHeight = fpccSearchResultsHeight
    var fpccPreserveInfoHeight = 0
    if (that.SMALL) {
      console.log('[setHeights] yes small')
      fpccPreserveInfoHeight = (h - (l + m + o)).toString() + 'px'
      document.getElementById('fpccPreserveInfo').style.minHeight = fpccPreserveInfoHeight
      document.getElementById('fpccSearchResults').style.minHeight = fpccSearchResultsHeight
    } else {
      fpccPreserveInfoHeight = (h - (k + m + o + q)).toString() + 'px'
      console.log('[setHeights] no small')
    }
    document.getElementById('fpccPreserveInfo').style.maxHeight = fpccPreserveInfoHeight
    console.log('[setHeights] #fpccPreserveInfoHeight= ' + fpccPreserveInfoHeight)
  }

  that.makeTrailDivs = function (poiFeat, filters, open) {
    console.log('makeTrailDivs start')
    var trailList = {} // used to see if trail div has been built yet.
    var divCount = 0
    var topLevelID = 'desktop'
    if (open) {
      map.closePopup()
      that.toggleResultsList('open')
    }
    // var trailListElementList = document.getElementById(topLevelID).getElementsByClassName('fpccResults')
    // trailListElementList[0].innerHTML = ""
    var trailListContents = ''
    $.each(poiFeat.filteredPoisArray, function (i, el) {
      var poiTrailSubsystem = el.properties.trail_subsystem
      if (poiTrailSubsystem) {
        var trailSubsystemName = poiTrailSubsystem
        var trailSubsystemNormalizedName = poiTrailSubsystem.replace(/[& ]/g, '+')
        var trailName = poiTrailSubsystem
        var trailLength = null //Number(Math.round(originalTrailData[trailID].properties.length +'e2')+'e-2')
      } else {
        var trailSubsystemName = null
        var trailSubsystemNormalizedName = null
        var trailID = null
        var trail = null
        var trailName = null
        var trailLength = null
      }

      var poiName = el.properties.name
      var poiId = el.properties.id

      var trailDivText = "<a class='fpccEntry clearfix' " +
        "data-source='list' " +
        "data-trailid='" + "' " +
        "data-trailname='" + "' " +
        "data-trail-length='" + "' " +
        "data-trailheadName='" + poiName + "' " +
        "data-trailheadid='" + poiId + "' " +
        "data-index='" + 0 + "'>"

      var trailheadInfoText = "<span class='fpccEntryName'>" +
        '<svg class="icon icon-sign"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>' +
        '<span class="fpccEntryNameText">' + poiName + '</span></span>'
      if (el.properties.distance) {
        if (filters.current.userLocation || filters.current.searchLocation) {
          var poiDistance = metersToMiles(el.properties.distance)
          trailheadInfoText += '<span class="fpccEntryDis">' + poiDistance + ' mi away</span></a>'
        }
      }
      trailheadInfoText += '</div>'
      var trailDivComplete = trailDivText + trailheadInfoText
      trailListContents = trailListContents + trailDivComplete
      divCount++
      if ((!trailList[trailSubsystemNormalizedName]) && trailSubsystemNormalizedName && filters.current.trailInList) {
        trailDivText = "<a class='fpccEntry clearfix' " +
          "data-source='list' " +
          "data-trailid='" + trailSubsystemNormalizedName + "' " +
          "data-trailname='" + trailSubsystemNormalizedName + "' " +
          "data-trail-length='" + trailLength + "' " +
          "data-trailheadName='" + null + "' " +
          "data-trailheadid='" + null + "' " +
          "data-index='" + 0 + "'>"
        trailheadInfoText = "<span class='fpccEntryName'>" +
          '<svg class="icon icon-trail-marker"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>' +
          '<span class="fpccEntryNameText">' + trailSubsystemName + ' </span></span>' +
          '</div>'
        trailList[trailSubsystemNormalizedName] = 1
        trailDivComplete = trailDivText + trailheadInfoText
        trailListContents = trailListContents + trailDivComplete
        divCount++
      }
    })
    $('#fpccSearchResults').html(trailListContents)
    
    $('#fpccSearchStatus').html(divCount + ' Results Found')
    //that.closeDetailPanel()
    //   $('.fpccEntry').click(trailDivClickHandler)
    that.setHeights()
    console.log('[makeTrailDivs] end at:' + performance.now())
  }

  that.showDetails = function (myReferences, trailSubsystemNormalizedName, poi) {
    console.log('[panelFunctions showDetails start')
    var trailSubsystemTrails = null
    var descriptionTrail = null
    var trailSubsystemName = null
    if (trailSubsystemNormalizedName) {
      trailSubsystemTrails = myReferences.trailInfo.trailSubsystemMap[trailSubsystemNormalizedName] || null
      descriptionTrail = trailSubsystemTrails[0] || null
      if (descriptionTrail) {
        trailSubsystemName = descriptionTrail.trail_subsystem
      }
    }
    that.toggleDetailPanel('open')
    var poiLink = null
    var trailLink = null
    if (trailSubsystemName) {
      changePageTitle(trailSubsystemName)
      trailLink = encodeURIComponent(trailSubsystemNormalizedName)
      trailLink = trailLink.replace(/%2B/g, '+')
    } else if (poi) {
      changePageTitle(poi.properties.name)
      poiLink = poi.link
    }
    $.address.parameter('trail', trailLink)
    $.address.parameter('poi', poiLink)
    $.address.parameter('search', null)
    $.address.update()

    if (document.getElementById('fpccMobileCheckbox').checked) {
      that.slideDetailPanel(false)
    } else {
      console.log('showTrailDetails checked is false')
      that.slideDetailPanel(true)
    }
    that.buildDetailPanelHTML(myReferences, trailSubsystemNormalizedName, poi)
    that.populateDetailPanel(that.currentDetailPanelHTML)
    that.setHeights()
    console.log('[panelFunctions showDetails end')
  }

  that.buildDetailPanelHTML = function (myReferences, trailSubsystemNormalizedName, poi) {
    var directTrail = null
    var descriptionTrail = null
    var trailSubsystemTrails = null
    var displayName = ''
    var fpccNameHTML = '<div id="fpccPreserveName" class="detailPanelBanner"><span id="fpccTrailName" class="trailName">'
    var fpccContainerHTML = '<div id="fpccPreserveInfo" class="detailPanelBody"><div id="fpccContainer" class="fpccContainer">'
    // console.log('[decorateDetailPanelForTrailhead2]')
    if (trailSubsystemNormalizedName) {
      trailSubsystemTrails = myReferences.trailInfo.trailSubsystemMap[trailSubsystemNormalizedName] || null
      descriptionTrail = trailSubsystemTrails[0] || null
      displayName = descriptionTrail.trail_subsystem
      fpccNameHTML += displayName
      // document.getElementById('fpccTrailName').innerHTML = displayName
      // $('#fpccPreserveName .trailName').html(trailSubsystemName)
    }

    if (poi) {
      if (poi.properties.name) {
        displayName = poi.properties.name
        fpccNameHTML += displayName
        // document.getElementById('fpccTrailName').innerHTML = poi.properties.name
        // $('#fpccPreserveName .trailName').html(poi.properties.name)
      }
      directTrail = myReferences.trailInfo.originalTrailInfo[poi.properties.direct_trail_id] || null
      if (directTrail) {
        trailSubsystemNormalizedName = directTrail.trail_subsystem.replace(/[& ]/g, '+')
        trailSubsystemTrails = myReferences.trailInfo.trailSubsystemMap[trailSubsystemNormalizedName] || null
        descriptionTrail = directTrail
      }
      fpccContainerHTML += '<div class="fpccTop">'
      if (poi.properties.photo_link) {
        fpccContainerHTML += '<div class="fpccPhoto">' +
                           '<img src="images/poi-photos/' + poi.properties.photo_link + '">' +
                           '</div>'
      }
      // ADD ALERTS INFO HERE
      fpccContainerHTML += '<div class="fpccEntrance fpccUnit clearfix">' +
                         '<div class="fpccSign clearfix">' +
                         '<svg class="icon icon-sign"><use xlink:href="icons/defs.svg#icon-sign"></use></svg>' +
                         '<div class="fpccAddress">' +
                         '<span class="fpccLabel fpccBlock">'
      if (poi.properties.web_street_addr) {
        fpccContainerHTML += 'Entrance</span><span class="fpccEntranceAddress">' +
                           poi.properties.web_street_addr + '</span>'
      } else {
        fpccContainerHTML += 'Location</span>'
      }
      if (poi.properties.web_muni_addr) {
        fpccContainerHTML += '<span class="fpccEntranceZip">' + poi.properties.web_muni_addr + '</span>'
      }
      if (poi.closeParkingLink && !poi.properties.web_street_addr) {
        fpccContainerHTML += '<span class="fpccCloseParking"><a class="fpccMore" href="#/?poi=' + poi.closeParkingLink + '">View closest parking area</a></span>'
      }
      if (poi.properties.phone) {
        fpccContainerHTML += '<span class="fpccPhone">' + poi.properties.phone + '</span>'
      }
      var directionsUrl = 'http://maps.google.com?saddr='
      if (myReferences.filters.current.userLocation) {
        directionsUrl += myReferences.filters.current.userLocation.lat + ',' + myReferences.filters.current.userLocation.lng
      }
      directionsUrl += '&daddr=' + poi.geometry.coordinates[1] + ',' + poi.geometry.coordinates[0]
      fpccContainerHTML += '</div></div>' +
                         '<a href="' + directionsUrl + '" target="_blank" id="entranceDirections" class="fpccButton fpccDirections">Directions</a></div>'
      if (poi.properties.description) {
        fpccContainerHTML += '<div class="fpccDescription fpccUnit">' + poi.properties.description + '</div>'
      }

      var fpccAmenitiesString = ''
      var naturePreserveString = ''
      var tagLinks = ''
      if ((poi.properties.tags) && (poi.properties.tags[':panel'])) {
        console.log('tags.panel = ' + poi.properties.tags[':panel'])
        // want Parking and Trail Access at top
        // parking = Parking
        if (poi.properties.tags[':panel'].indexOf('parking') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-parking'><use xlink:href='icons/defs.svg#icon-parking'></use></svg><span class='fpccAmenityTitle'>Parking Lot</span></div>"
        }

        // no_parking = No Parking
        if (poi.properties.tags[':panel'].indexOf('no_parking') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-parking'><use xlink:href='icons/defs.svg#icon-no-parking'></use></svg> <span class='fpccAmenityTitle'>No Parking Lot</span></div>"
        }

        // trailacces = Trail System Access
        if (poi.properties.tags[':panel'].indexOf('trailhead') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-trail-marker'><use xlink:href='icons/defs.svg#icon-trail-marker'></use></svg><span class='fpccAmenityTitle'>Trail Access</span></div>"
        }
        
        // Activities/Amenities on map
         // bike_rental = Bike Rental
        if (poi.properties.tags[':panel'].indexOf('bike_rental') > -1 ) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bike-rental'><use xlink:href='icons/defs.svg#icon-bike-rental'></use></svg><span class='fpccAmenityTitle'>Bike Rental</span></div>"
        }
          // boat_ramp = Boat Launch
        if (poi.properties.tags[':panel'].indexOf('boat_ramp') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-launch'><use xlink:href='icons/defs.svg#icon-boat-launch'></use></svg><span class='fpccAmenityTitle'>Boat Launch</span></div>"
        }

        // boat_rental = Boat Rental
        if (poi.properties.tags[':panel'].indexOf('boat_rental') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-rental'><use xlink:href='icons/defs.svg#icon-boat-rental'></use></svg><span class='fpccAmenityTitle'>Boat Rental</span></div>"
        }
          // camping = Campground
        if (poi.properties.tags[':panel'].indexOf('camping') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp'><use xlink:href='icons/defs.svg#icon-camp'></use></svg><span class='fpccAmenityTitle'>Campground</span></div>"
        }

        // canoe = Canoe Landing
        if (poi.properties.tags[':panel'].indexOf('canoe') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-canoe-landing'><use xlink:href='icons/defs.svg#icon-canoe-landing'></use></svg><span class='fpccAmenityTitle'>Canoe Landing</span></div>"
        }
        // disc_golf = Disc Golf
        if (poi.properties.tags[':panel'].indexOf('disc_golf') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-disc-golf'><use xlink:href='icons/defs.svg#icon-disc-golf'></use></svg><span class='fpccAmenityTitle'>Disc Golf</span></div>"
        }

        //  dog_friendly = Off-Leash Dog Area
        if (poi.properties.tags[':panel'].indexOf('dog_friendly') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-off-leash-dog-area'><use xlink:href='icons/defs.svg#icon-off-leash-dog-area'></use></svg><span class='fpccAmenityTitle'>Off-Leash Dog Area</span></div>"
        }
        // golf = Golf
        if (poi.properties.tags[':panel'].indexOf('golf') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'>Golf</span></div>"
        }
        //  driving_range = Driving Range
        if (poi.properties.tags[':panel'].indexOf('driving_range') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'>Driving Range</span></div>"
        }
        // m_airplane = Model Airplane Flying Field
        if (poi.properties.tags[':panel'].indexOf('m_airplane') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-model-airplane'><use xlink:href='icons/defs.svg#icon-model-airplane'></use></svg><span class='fpccAmenityTitle'>Model Airplane Flying Field</span></div>"
        }

        // m_boat = Model Sailboat
        if (poi.properties.tags[':panel'].indexOf('m_boat') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-model-sailboat'><use xlink:href='icons/defs.svg#icon-model-sailboat'></use></svg><span class='fpccAmenityTitle'>Model Sailboat</span></div>"
        }

        // nature_center = Nature Center
        if (poi.properties.tags[':panel'].indexOf('nature_center') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-nature-center'><use xlink:href='icons/defs.svg#icon-nature-center'></use></svg><span class='fpccAmenityTitle'>Nature Center</span></div>"
        }
        // picnic_grove = Picnic Grove
        if (poi.properties.tags[':panel'].indexOf('picnic_grove') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity picnic-grove'><svg class='icon icon-picnic-grove'><use xlink:href='icons/defs.svg#icon-picnic-grove'></use></svg><span class='fpccAmenityTitle'>Picnic Grove</span></div>"
        }

        // shelter = Picnic Grove (with shelter)
        if (poi.properties.tags[':panel'].indexOf('shelter') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-picnic-grove-shelter'><use xlink:href='icons/defs.svg#icon-picnic-grove-shelter'></use></svg><span class='fpccAmenityTitle'>Picnic Grove (with shelter)</span></div>"
        }
        // public_building = Public Building
        if (poi.properties.tags[':panel'].indexOf('public_building') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity public-building'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg><span class='fpccAmenityTitle'>Public Building</span></div>"
        }
        
        // sledding = Sledding
        if (poi.properties.tags[':panel'].indexOf('sledding') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-sledding'><use xlink:href='icons/defs.svg#icon-sledding'></use></svg><span class='fpccAmenityTitle'>Sledding</span></div>"
        }

        // snowmobile = Snowmobile Area
        if (poi.properties.tags[':panel'].indexOf('snowmobile') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-snowmobiling'><use xlink:href='icons/defs.svg#icon-snowmobiling'></use></svg><span class='fpccAmenityTitle'>Snowmobile Area</span></div>"
        }

        // swimming = Aquatic Center
        if (poi.properties.tags[':panel'].indexOf('swimming') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-aquatic-center'><use xlink:href='icons/defs.svg#icon-aquatic-center'></use></svg><span class='fpccAmenityTitle'>Aquatic Center</span></div>"
        }

        // rec_center = Special Activity / Swallow Cliff Stairs, GoApe, Sullivan Barn
        if (poi.properties.tags[':panel'].indexOf('recreation_center') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-rec-center'><use xlink:href='icons/defs.svg#icon-rec-center'></use></svg><span class='fpccAmenityTitle'>Special Activity</span></div>"
        }

        // Activities/Amenities NOT on map

        // birding = Birding Hotspot
        if (poi.properties.tags[':panel'].indexOf('birding') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-birding-hotspot'><use xlink:href='icons/defs.svg#icon-birding-hotspot'></use></svg><span class='fpccAmenityTitle'>Birding Hotspot</span></div>"
        }
        // cycling = Bicycling
        if (poi.properties.tags[':panel'].indexOf('cycling') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bicycling'><use xlink:href='icons/defs.svg#icon-bicycling'></use></svg><span class='fpccAmenityTitle'>Bicycling</span></div>"
        }

        // cross_country = Cross-Country Skiing
        if (poi.properties.tags[':panel'].indexOf('cross_country') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-cross-country-skiing'><use xlink:href='icons/defs.svg#icon-cross-country-skiing'></use></svg><span class='fpccAmenityTitle'>Cross-Country Skiing</span></div>"
        }

        //  dog_leash = Dogs (with a leash)
        if (poi.properties.tags[':panel'].indexOf('dog_leash') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-dog-leash'><use xlink:href='icons/defs.svg#icon-dog-leash'></use></svg><span class='fpccAmenityTitle'>Dogs (with a leash)</span></div>"
        }

        //  drone = Drone Flying
        if (poi.properties.tags[':panel'].indexOf('drone') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-drone'><use xlink:href='icons/defs.svg#icon-drone'></use></svg><span class='fpccAmenityTitle'>Drone Flying Area</span></div>"
        }

        // ecological = Ecological Management
        // if (poi.properties.tags[':panel'].indexOf('ecological') > -1) {
        //   fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ecological-management-area'><use xlink:href='icons/defs.svg#icon-ecological-management-area'></use></svg><span class='fpccAmenityTitle'>Ecological Management</span></div>"
        // }

        // equestrian = Equestrian
        if (poi.properties.tags[':panel'].indexOf('equestrian') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-equestrian'><use xlink:href='icons/defs.svg#icon-equestrian'></use></svg><span class='fpccAmenityTitle'>Equestrian</span></div>"
        }

        // fishing = Fishing
        if (poi.properties.tags[':panel'].indexOf('fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-fishing'><use xlink:href='icons/defs.svg#icon-fishing'></use></svg><span class='fpccAmenityTitle'>Fishing</span></div>"
        }

        // hiking = Hiking
        if (poi.properties.tags[':panel'].indexOf('hiking') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-hiking'><use xlink:href='icons/defs.svg#icon-hiking'></use></svg><span class='fpccAmenityTitle'>Hiking</span></div>"
        }

        // ice_fishing = Ice Fishing
        if (poi.properties.tags[':panel'].indexOf('ice_fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ice-fishing'><use xlink:href='icons/defs.svg#icon-ice-fishing'></use></svg><span class='fpccAmenityTitle'>Ice Fishing</span></div>"
        }

        // no_alcohol = No Alcohol
        if (poi.properties.tags[':panel'].indexOf('no_alcohol') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-alcohol'><use xlink:href='icons/defs.svg#icon-no-alcohol'></use></svg><span class='fpccAmenityTitle'>No Alcohol</span></div>"
        }
        // no_fishing = No Fishing
        if (poi.properties.tags[':panel'].indexOf('no_fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-fishing'><use xlink:href='icons/defs.svg#icon-no-fishing'></use></svg> <span class='fpccAmenityTitle'>No Fishing</span></div>"
        }
        // overlook = Scenic Overlook
        if (poi.properties.tags[':panel'].indexOf('overlook') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-scenic-overlook'><use xlink:href='icons/defs.svg#icon-scenic-overlook'></use></svg><span class='fpccAmenityTitle'>Scenic Overlook</span></div>"
        }
        // pavilion = Pavilion/Event Space
        // if (poi.properties.tags[':panel'].indexOf('pavilion') > -1) {
        //  fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg><span class='fpccAmenityTitle'>Indoor Facility</span></div>"
        // }
        // skating_ice = Ice Skating
        if (poi.properties.tags[':panel'].indexOf('skating_ice') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ice-skating'><use xlink:href='icons/defs.svg#icon-ice-skating'></use></svg><span class='fpccAmenityTitle'>Ice Skating</span></div>"
        }

        // volunteer = Volunteer Opportunities
        if (poi.properties.tags[':panel'].indexOf('volunteer') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-volunteer'><use xlink:href='icons/defs.svg#icon-volunteer'></use></svg><span class='fpccAmenityTitle'>Volunteer Opportunities</span></div>"
        }

        // nature_preserve = Nature Preserve
        if (poi.properties.tags[':panel'].indexOf('nature_preserve') > -1) {
          naturePreserveString = '<div class="fpccNP clearfix" target="_blank"><a href="http://fpdcc.com/illinois-nature-preserves/" target="_blank"><img src="images/idnr-np-logo.png" width="75" height="65" alt="Illinois Nature Preserves Commission Logo"></a><p>This land is designated as one of the highest quality natural areas in the state by the Illinois Nature Preserves Commission. This status includes increased levels of legal protection and management. <a href="http://fpdcc.com/illinois-nature-preserves/" target="_blank">Learn more &gt;</a></p></div>'
        }

        // tagLinks
        if ((poi.properties.tags[':panel'].indexOf("cycling") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/bicycling/">Biking</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("birding") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/birding/">Birding</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("boat_ramp") > -1) || (poi.properties.tags[':panel'].indexOf("boat_rental") > -1) || (poi.properties.tags[':panel'].indexOf("canoe") > -1)) {
            tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/boating/">Boating</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("camping") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/camping/">Camping</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("cross_country") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/cross-county-skiing/">Cross-Country Skiing</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("dog_leash") > -1) || (poi.properties.tags[':panel'].indexOf("dog_friendly") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/dogs/">Dogs</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("equestrian") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/equestrian/">Equestrian</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("fishing") > -1) || (poi.properties.tags[':panel'].indexOf("ice_fishing") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/fishing/">Fishing</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("hiking") > -1)) {
        tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/hiking/">Hiking</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("m_airplane") > -1) || (poi.properties.tags[':panel'].indexOf("drone") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/model-airplane-drone/">Model Airplanes &amp; Drones</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("picnic_grove") > -1) || (poi.properties.tags[':panel'].indexOf("shelter") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/permits/">Picnic &amp; Event Permits</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("sledding") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/sledding/">Sledding</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("snowmobile") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/snowmobiling/">Snowmobiling</a></li>'
        }
        if ((poi.properties.tags[':panel'].indexOf("swimming") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/aquatic-centers/">Swimming</a></li>'
        }
      }
      if (poi.properties.special_link) {
        fpccAmenitiesString += '<a href="' + poi.properties.special_link + '" class="fpccSpecialDesc" target="_blank"><span class="fpccSpecialBlurb">' + poi.properties.special_description + '</span><span class="fpccSpecialIcon"><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg></span></a>'
      }
      if (fpccAmenitiesString.length > 0) {
        fpccContainerHTML += '<div class="fpccAmenities fpccUnit clearfix">' + fpccAmenitiesString + '</div>'
      }
      if (naturePreserveString.length > 0) {
        fpccContainerHTML += naturePreserveString
      }

      var hoursHTML = ''
      if (poi.properties.hours1) {
        hoursHTML += '<span class="fpccHours1"><strong>' + poi.properties.season1
        hoursHTML += ':</strong> ' + poi.properties.hours1 + '</span>'
      }
      if (poi.properties.hours2) {
        hoursHTML += '<span class="fpccHours2"><strong>' + poi.properties.season2
        hoursHTML += ':</strong> ' + poi.properties.hours2 + '</span>'
      }
      if (poi.properties.special_hours) {
        hoursHTML += '<span class="fpccSpecialHours">' + poi.properties.special_hours + '</span>'
      }
      if (hoursHTML != '') {
        fpccContainerHTML += '<div class="fpccHours fpccUnit"><span class="fpccLabel">Hours</span>'
                           + hoursHTML + '</div>'
      }

      var extraLinksText = '<span class="fpccLabel fpccMore">More Information</span><ul>'
      var extraLinksExist = true
      if (poi.properties.web_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="fpccMore" href="' + poi.properties.web_link
        extraLinksText += '" target="_blank">Webpage</a></li>'
      }
      if (poi.properties.map_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="fpccMore" href="' + poi.properties.map_link
        extraLinksText += '" target="_blank">English Map (PDF)</a></li>'
      }
      if (poi.properties.map_link_spanish) {
        extraLinksExist = true
        extraLinksText += '<li><a class="fpccMore" href="' + poi.properties.map_link_spanish
        extraLinksText += '" target="_blank">Mapa Español (PDF)</a></li>'
      }
      if (poi.properties.picnic_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="fpccMore" href="' + poi.properties.picnic_link
        extraLinksText += '" target="_blank">Picnic Grove Map (PDF)</a></li>'
      }
      if (poi.properties.vol_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="fpccMore" href="' + poi.properties.vol_link
        extraLinksText += '" target="_blank">Volunteer Opportunity</a></li>'
      }
      if (poi.properties.vol_link2) {
        extraLinksExist = true
        extraLinksText += '<li><a class="fpccMore" href="' + poi.properties.vol_link2
        extraLinksText += '" target="_blank">Volunteer Opportunity</a></li>'
      }
      extraLinksText += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/rules-and-regulations/">Rules &amp Regulations</a></li>'
      if (tagLinks.length > 0) {
        extraLinksExist = true
        extraLinksText += tagLinks
      }
      extraLinksText += '</ul></div>'
      if (extraLinksExist === true) {
        fpccContainerHTML += '<div class="fpccLinks fpccUnit clearfix">' + extraLinksText + '</div>'
      }
    }
    var closeID = 'closeDetail'
    fpccNameHTML += '</span><svg id="closeDetail" class="icon icon-x closeDetail"><use xlink:href="icons/defs.svg#icon-x"></use></svg></div>'
    //Trails Section
    var trailsHTML = ""
    if (descriptionTrail) {
      console.log('[decorateDetailPanelForTrailhead] system = ' + descriptionTrail.trail_subsystem)
      var subSystem = descriptionTrail.trail_subsystem
      trailsHTML += '<div class="fpccTrails fpccUnit clearfix">'
      if (directTrail) {
        trailsHTML += '<svg class="icon icon-trail-marker"><use xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>'
                    + '<div class="fpccTrailHeader">'
                    + '<span class="fpccLabel fpccBlock">Trail Access</span>'
                    + '<span class="fpccTrailName">'
                    + subSystem
                    + '</span></div>'
      }            
      var trailDescriptionHTML = '<div class="fpccTrailDescription">'
      var showDescription = false
      if (descriptionTrail.trail_desc) {
        showDescription = true
        trailDescriptionHTML += '<div class="fpccTrailDescription" id="trailDescription">'
                              + descriptionTrail.trail_desc
                              + '</div>'
      }
      var showMaps = false
      var trailMapHTML = '<div class="fpccTrailMaps clearfix trailMaps"><span class="fpccLabel">PDF Trail Map:</span>'
      console.log('[decorateDetailPanelForTrailhead2] showMaps = ' + showMaps)
      if (descriptionTrail.map_link != null && descriptionTrail.map_link != '') {
        console.log('[decorateDetailPanelForTrailhead2] descriptionTrail.map_link is true? ' + descriptionTrail.map_link)
        trailMapHTML += '<a class="fpccButton" id="pdfEnglish" href="'
                      + descriptionTrail.map_link + '">English</a>'
        showMaps = true
        showDescription = true
      }
      if (descriptionTrail.map_link_spanish != null && descriptionTrail.map_link_spanish != '') {
        trailMapHTML += ' <a class="fpccButton" id="pdfSpanish" href="'
                      + descriptionTrail.map_link_spanish + '">Español</a>'
        showMaps = true
        showDescription = true
      }
      trailMapHTML += '</div>'
      console.log('[decorateDetailPanelForTrailhead] showMaps = ' + showMaps)
      if (showMaps) {
        trailDescriptionHTML += trailMapHTML
      }
      trailDescriptionHTML += '</div>'
      if (showDescription) {
        trailsHTML += trailDescriptionHTML
      }
      var trailSegmentsHTML = '<div class="fpccTrailSegments">'
      var indirectHTML = ""
      if (directTrail) {
        var directTrailHTML = buildTrailSegmentHTML(directTrail)
        trailSegmentsHTML += directTrailHTML
        indirectHTML += '<div class="fpccAccessTo fpccLabel"><svg class="icon icon-trail-marker" style="display: inline-block"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>with access to:</div>'
      }
      if (trailSubsystemTrails) {
        var useIndirect = false
        for (var trailIndex = 0; trailIndex < trailSubsystemTrails.length; trailIndex++) {
          var thisTrail = trailSubsystemTrails[trailIndex]
          if (directTrail) {
            if (thisTrail.direct_trail_id != directTrail.direct_trail_id) {
              if (thisTrail.subtrail_length_mi >= 1) {
                useIndirect = true
                indirectHTML += buildTrailSegmentHTML(thisTrail)
              }
            }
          } else {
            if (thisTrail.subtrail_length_mi >= 1 || trailIndex == 0) {
              useIndirect = true
              indirectHTML += buildTrailSegmentHTML(thisTrail)
            }
          } 
        }
        if (useIndirect) {
          trailSegmentsHTML += indirectHTML
        }
      }
      trailSegmentsHTML += '<span class="fpccOneMile">*Segments under 1 mile not shown.</span>'
                         + '</div>'
      trailsHTML += trailSegmentsHTML + '</div>'
      fpccContainerHTML += trailsHTML
    }
    fpccContainerHTML += '</div>'
    var socialLink = encodeURIComponent(window.location.href)
    socialLink = socialLink.replace(/%20/g, '+')
    socialLink = socialLink.replace('/#/", "/')
    fpccContainerHTML += '<div class="fpccSocial fpccUnit clearfix">'
                       + '<div class="fpccShare">Share Your Plans:</div><a href="'
                       + 'mailto:?subject=Map: ' + displayName +' in the Forest Preserves of Cook County&body=' + socialLink
                       + '" id="fpccSocialEmail" class="fpccSocialIcon">'
                       + '<svg class="icon icon-email"><use xlink:href="icons/defs.svg#icon-email"></use></svg>'
                       + '<span>Email</span></a>'
                       + '<a href="https://twitter.com/intent/tweet?text=Map: ' + displayName + '&via=FPDCC&url=' + socialLink
                       + '" id="fpccSocialTwitter" class="fpccSocialIcon" target="_blank">'
                       + '<svg class="icon icon-twitter"><use xlink:href="icons/defs.svg#icon-twitter"></use></svg>'
                       + '<span>Twitter</span></a>'
                       + '<a href="' + 'https://www.facebook.com/dialog/share?app_id=1382262871801846&display=popup&href=' + socialLink + '&redirect_uri=' + socialLink
                       + '" id="fpccSocialFacebook" class="fpccSocialIcon" target="_blank">'
                       + '<svg class="icon icon-facebook"><use xlink:href="icons/defs.svg#icon-facebook"></use></svg>'
                       + '<span>Facebook</span></a></div>'  
    fpccContainerHTML += '</div></div>'
    // var fpccDisplayPanelElement = document.getElementById('fpccDetailPanel')

    that.currentDetailPanelHTML = fpccNameHTML + fpccContainerHTML
    
    // fpccDisplayPanelElement.innerHTML = fullHTML
  }

  var buildTrailSegmentHTML = function (trailSegment) {
    var thisColor = trailSegment.trail_color
    var thisType = trailSegment.trail_type
    var thisNameType = trailSegment.trail_name_type
    var thisDirection = trailSegment.direction
    var trailSegmentHTML = '<div class="fpccTrailSegment"><div class="fpccSegmentOverview '
    //console.log('[buildTrailSegmentHTML] trailSegment.off_fpdcc= ' + trailSegment.off_fpdcc)
    //console.log('[buildTrailSegmentHTML] trailSegment.trail_color= ' + trailSegment.trail_color)
    if (trailSegment.off_fpdcc === 'y') {
      trailSegmentHTML += 'off '
      trailSegmentHTML += trailSegment.trail_color.replace(/ /g, '_').toLowerCase()
    } else {
      trailSegmentHTML += trailSegment.trail_color.replace(/ /g, '_').toLowerCase()
    }
    trailSegmentHTML += ' ' + thisType.replace(/ /g, '_').toLowerCase()
    // if (thisType.toLowerCase() != "paved") {
    //   trailSegmentHTML += " fpccUnpaved";
    // }
    trailSegmentHTML += ' clearfix"><span class="fpccSegmentName">'
    trailSegmentHTML += thisColor + ' ' + thisType
    if (thisNameType) {
      trailSegmentHTML += ' ' + thisNameType
    }
    if (thisDirection) {
      trailSegmentHTML += ' ' + thisDirection
    }
    if (trailSegment.off_fpdcc === 'y') {
      trailSegmentHTML += ' (Non-FPCC)'
    }
    trailSegmentHTML += '</span><span class="fpccTrailUse">';
    trailSegmentHTML += '<svg class="icon icon-hiking"><use xlink:href="icons/defs.svg#icon-hiking"></use></svg>';
    if (thisType.toLowerCase() == "single track" || thisType.toLowerCase() == "unpaved" || thisType.toLowerCase() == "paved" || thisType == "") {
      trailSegmentHTML += '<svg class="icon icon-bicycling"><use xlink:href="icons/defs.svg#icon-bicycling"></use></svg>';
      trailSegmentHTML += '<svg class="icon icon-cross-country-skiing"><use xlink:href="icons/defs.svg#icon-cross-country-skiing"></use></svg>';
    }
    if (thisType.toLowerCase() == "single track" || thisType.toLowerCase() == "unpaved" || thisType == "") {
      trailSegmentHTML += '<svg class="icon icon-equestrian"><use xlink:href="icons/defs.svg#icon-equestrian"></use></svg>';
    }
    trailSegmentHTML += '</span>';
    trailSegmentHTML += '<svg width="100%" height="8px"><line x1="4" x2="100%" y1="4" y2="4" stroke-width="8"/></svg>';
    trailSegmentHTML += '</div>';
    trailSegmentHTML += '<div class="fpccSegmentDetails clearfix"><span class="fpccLabel fpccLeft">Length<span>';
    //trailSegmentsHTML += (Math.round(trailhead.properties.length * 100) / 100);
    trailSegmentHTML += trailSegment.subtrail_length_mi;
    trailSegmentHTML += ' mi</span></span>';
    trailSegmentHTML += '<span class="fpccLabel fpccRight">Surface<span>';
    trailSegmentHTML += thisType;
    trailSegmentHTML += '</span></span></div></div>';
    return trailSegmentHTML;
  }

  that.populateDetailPanel = function (content) {
    if (content) {
      $('#fpccDetailPanel').html(content)
    }
    that.setHeights()
    $('#closeAbout').click(that.closeAboutPage)
    $('#closeDetail').on(Config.listenType, events.closeDetailPanel)
    $('.detailPanelBanner').on(Config.listenType, detailPanelBannerClick)
  }

  that.slideDetailPanel = function (expand) {
    if (that.SMALL) {
      if (expand) {
        console.log('[slideDetailPanel] expand = true')
        $('#fpccDetailPanel').addClass('expanded').removeClass('contracted')
        $('#fpccTrailListColumn').addClass('expanded').removeClass('contracted')
        if (document.getElementById('fpccMobileCheckbox').checked) {
          document.getElementById('fpccSearchBack').innerHTML = '<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to Map</a>'
        } else {
          document.getElementById('fpccSearchBack').innerHTML = '<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to List</a>'
        }
        $('#fpccSearchBack').show()
        $('#fpccMainContainer').hide()
        $('#fpccMobileSearchButton').hide()
      } else {
        console.log('[showDetailPanel] expand = false')
        $('#fpccDetailPanel').addClass('contracted').removeClass('expanded')
        $('.trailListColumn').addClass('contracted').removeClass('expanded')
        $('#fpccSearchBack').hide()
        $('#fpccMainContainer').show()
        $('#fpccMobileSearchButton').show()
      }
      that.setHeights()
    } else {
      $('#fpccSearchBack').html('<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to List</a>')
      $('#fpccSearchBack').show()
    }
  }

  that.toggleDetailPanel = function (action) {
    if (action === 'open') {
      $('#fpccSearchResults').hide()
      $('#fpccSearchStatus').hide()
      $('#fpccDetailPanel').show()
      $('#fpccPreserveInfo').scrollTop(0)
      $('fpccContainer').html(loaderDiv)
      if (that.SMALL) {
        $('#fpccMainContainer').hide()
      }
    } else if (action === 'close') {
      $('#fpccDetailPanel').hide()
      $('#fpccSearchBack').hide()
      $('#fpccSearchResults').show()
      $('#fpccSearchStatus').show()
      that.showfpccMainContainer()
      if (that.SMALL) {
        $('#fpccMainContainer').show()
      }
      changePageTitle(null)
      that.addSearchURL()
      that.currentDetailPanelHTML = ''
      that.setHeights()
    }
  }

  that.addSearchURL = function () {
    console.log('[readdSearchURL] start')
    $.address.parameter('trail', null)
    $.address.parameter('poi', null)
    var searchValue = filters.current.search.slice(0)
    if (filters.current.zipMuniFilter) {
      searchValue.push(filters.current.zipMuniFilter)
    }
    console.log('[readdSearchURL] searchValue = ' + searchValue)
    var searchLink =  encodeURIComponent(searchValue)
    searchLink = searchLink.replace(/%20/g, '+')
    console.log('[readdSearchURL] searchLink = ' + searchLink)
    $.address.parameter('search', searchLink)
    $.address.update()
  }

  that.toggleResultsList = function (action) {
    console.log('toggleResultsList action = ' + action)
    if (action === 'open') {
      $('#fpccSearchStatus').show()
      $('#fpccSearchResults').show()
      $('#fpccSearchBack').hide()
    } else if (action === 'close') {
      $('#fpccSearchStatus').hide()
      $('#fpccSearchResults').hide()
      // $('#fpccSearchBack').show()
    }  
  }

  that.showfpccMainContainer = function (e) {
    console.log('showfpccMainContainer')
    var showMap = document.getElementById('fpccMobileCheckbox').checked
    console.log('[showfpccMainContainer] show = ' + showMap)
    if (showMap) {
      $('#fpccMainContainer').addClass('contracted').removeClass('expanded')
      $('.trailListColumn').addClass('contracted').removeClass('expanded')
      $('#fpccDetailPanel').addClass('contracted').removeClass('expanded')
      // document.getElementById("fpccMainContainer").style.zIndex = "1";
      $('#fpccSearchBack').hide()
      $('#fpccMainContainer').show()
      if ($('#fpccDetailPanel').is(':visible')) {
        $('#fpccMobileSearchButton').show()
      } else {
        $('#fpccMobileSearchButton').hide()
      }
    } else {
      $('#fpccMainContainer').addClass('expanded').removeClass('contracted')
      $('.trailListColumn').addClass('expanded').removeClass('contracted')
      $('#fpccDetailPanel').addClass('expanded').removeClass('contracted')
      $('#fpccMobileSearchButton').hide()
      $('#fpccSearchBack').html('<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to List</a>')
      if ($('#fpccDetailPanel').is(':visible')) {
        $('#fpccSearchBack').show()
        $('#fpccMainContainer').hide()
      } else {
        $('#fpccMainContainer').show()
      }
    }
    // setHeights();
  }

  var changePageTitle = function (name) {
    var newTitle = 'Map: Forest Preserves of Cook County'
    if (name) {
      // document.title = "Map: " + name + " | Forest Preserves of Cook County"
      newTitle = 'Map: ' + name + ' | Forest Preserves of Cook County'
    } else {
      // document.title = "Map: Forest Preserves of Cook County"
      newTitle = 'Map: Forest Preserves of Cook County'
    }
    $.address.title(newTitle)
    $.address.update()
  }

  var detailPanelBannerClick = function (e) {
    console.log('detailPanelBannerClick')
    if ($(e.target).parents('#fpccDetailPanel').is(':visible')) {
      if ($(e.target).parents('#fpccDetailPanel').hasClass('contracted')) {
        console.log('[detailPanelBannerClick] parent has contracted. Run slideDetailPanel2(false)')
        that.slideDetailPanel(true)
      } else {
        console.log('[detailPanelBannerClick] parent does not have contracted')
        that.slideDetailPanel(false)
      }
    }
  }

  var METERSTOMILESFACTOR = 0.00062137
  function metersToMiles (i) {
    return (i * METERSTOMILESFACTOR).toFixed(1)
  }

  return that
}

module.exports = {
  setup: setup,
  panelFuncs: panelFuncs
}
