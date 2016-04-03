var console = console || {
  "log": function() {}
};
console.log("start");

$(document).ready(startup);

/* The Big Nested Function
==========================*/

// Print to ensure file is loaded

function startup() {
  "use strict";

  console.log("trailhead.js");

  $(".js-example-basic-multiple").select2({
    placeholder: "Search by Location or Activity",
    tags: true,
    tokenSeparators: [',', ' '],
    allowClear: true,
  });



  var SMALL = false;
  if (Modernizr.mq("only screen and (max-width: 768px)")) {
    SMALL = true;
  } else if (Modernizr.mq("only screen and (min-width: 769px)")) {
    SMALL = false;
  }

  var TOUCH = $('html').hasClass('touch');
  // Map generated in CfA Account
  //var MAPBOX_MAP_ID = "codeforamerica.map-j35lxf9d";
  var MAPBOX_MAP_ID = "mapbox.streets";
  var MAPCENTERPOINT = {
    lat: 42.0723,
    lng: -87.87
    // lat: 41.87,
    // lng: -87.67
  };

  // API_HOST: The API server. Here we assign a default server, then
  // test to check whether we're using the Heroky dev app or the Heroku production app
  // and reassign API_HOST if necessary
  // var API_HOST = window.location.protocol + "//" + window.location.host;
  var API_HOST = "http://fpcc-staging.smartchicagoapps.org";
  //var API_HOST = "http://52.7.102.166"
  //var API_HOST = "http://localhost:3000";
  //var API_HOST = "http://trailsy.herokuapp.com";
  // var API_HOST = "http://trailsyserver-dev.herokuapp.com";
  // var API_HOST = "http://trailsyserver-prod.herokuapp.com";
  // var API_HOST = "http://10.0.1.102:3000";
  // var API_HOST = "http://10.0.2.2:3000" // for virtualbox IE
  if (window.location.hostname.split(".")[0] == "localhost") {
    //API_HOST = "http://localhost:3000";
    document.title = "LOCALHOST | Cook County Trailsy";
  } else if (window.location.hostname.split(".")[0] == "fpcc-staging") {
    document.title = "STAGING | Cook County Trailsy";
  } else if (window.location.hostname.split(".")[0] = "fpcc") {
    document.title = "Cook County Forest Preserves";
    API_HOST = "http://fpcc.smartchicagoapps.org";
  }
  console.log("API_HOST = " + API_HOST);

  //   API_HOST = window.location.protocol + "//" + window.location.host;
  // } else if (window.location.hostname.split(".")[0] == "trailsyserver-dev") {
  //   API_HOST = window.location.protocol + "//" + window.location.host;
  // } else if (window.location.hostname.split(".")[0] == "trailsy" || window.location.hostname == "www.tothetrails.com") {
  //   API_HOST = window.location.protocol + "//" + window.location.host;
  //   // API_HOST = "http://trailsyserver-prod.herokuapp.com";
  // }


  //  Near-Global Variables
  var METERSTOMILESFACTOR = 0.00062137;
  var MAX_ZOOM = SMALL ? 16 : 17;
  var MIN_ZOOM = SMALL ? 13 : 14;
  var SECONDARY_TRAIL_ZOOM = 12;
  var SHOW_SIGN_ZOOM = 13;
  var SHOW_ALL_ACTIVITIES_ZOOM = 14; //Show all activity points starting at this zoom level
  var SHORT_MAX_DISTANCE = 2.0;
  var MEDIUM_MAX_DISTANCE = 5.0;
  var LONG_MAX_DISTANCE = 10.0;
  var SHOW_ALL_TRAILS = 1;
  // var USE_LOCAL = SMALL ? false : true; // Set this to a true value to preload/use a local trail segment cache
  var USE_LOCAL = true;
  var USE_SEGMENT_LAYER = true; // performance testing on mobile
  var USE_COMPLEX_SEGMENT_LAYER = SMALL ? false : true;
  var NORMAL_SEGMENT_COLOR = "#C4D0DB";
  var NORMAL_SEGMENT_WEIGHT = 4;
  var HOVER_SEGMENT_COLOR = "#C4D0DB";
  var HOVER_SEGMENT_WEIGHT = 6;
  var ACTIVE_TRAIL_COLOR = "#C4D0DB";
  var ACTIVE_TRAIL_WEIGHT = 7;
  var NOTRAIL_SEGMENT_COLOR = "#FF0000";
  var NOTRAIL_SEGMENT_WEIGHT = 3;
  var LOCAL_LOCATION_THRESHOLD = 100; // distance in km. less than this, use actual location for map/userLocation
  var centerOffset = SMALL ? new L.point(0, 0) : new L.Point(450, 0);
  var MARKER_RADIUS = TOUCH ? 12 : 4;
  var ALL_SEGMENT_LAYER_SIMPLIFY = 5;
  var map;
  // var mapDivName = SMALL ? "trailMapSmall" : "trailMapLarge";
  var mapDivName = "trailMapLarge";
  var CLOSED = false;
  var customSmoothFactor = SMALL ? 1.5 : 1.0;

  var originalTrailData = {}; // all of the trails metadata (from traildata table), with trail ID as key
  // for yes/no features, check for first letter "y" or "n".

  var originalTrailheads = []; // all trailheads (from trailsegments)
  
  // for yes/no features, check for first letter "y" or "n".

  var trailSegments = [];
  var currentTrailIDs = {};
  var currentMultiTrailLayer = {}; // We have to know if a trail layer is already being displayed, so we can remove it
  var currentTrailLayers = [];
  var currentHighlightedTrailLayer = {};
  var currentTrailheads = [];
  var currentTrailheadMarkerArray = [];
  var currentTrailheadSignArray = [];
  var currentActivities = [];
  var currentActivityMarkerArray = [];
  var currentUserLocation = {};
  var anchorLocation = {};
  var currentTrailheadLayerGroup;
  var currentActivityLayerGroup;
  var currentFilters = {
    lengthFilter: [],
    activityFilter: [],
    searchFilter: ""
  };
  var orderedTrails = [];
  var currentDetailTrail = null;
  var currentDetailTrailhead = null;
  var userMarker = null;

  // Segment Variables
  var allSegmentLayer = null; // All the segments (both invisible and visible)
  var currentHighlightedSegmentLayer = null; // Segment that is highlighted.

  // Activity Variables
  var originalActivities = [];
  var allActivityLayer = null
  var currentActivityMarkerArray = [];
  var highlightedActivityMarkerArray = [];
  var currentActivityLayerGroup;
  

  var closeTimeout = null;
  var openTimeout = null;
  var currentWeightedSegment = null;
  var currentTrailPopup = null;
  var currentTrailhead = null;
  var orderedTrailIndex = 0;
  var geoWatchId = null;
  var currentTrailheadHover = null;
  var geoSetupDone = false;
  var segmentTrailnameCache = {};
  var segmentTrailIdCache = {}; // For OpenTrails 1.1. This is the equivalent of segmentTrailnameCache.
  var currentTrailData;
  var searchKeyTimeout = null;
  var trailheadsFetched = false;
  var traildataFetched = false;
  var trailsegmentsFetched = false;
  var activitiesFetched = false;
  var allInvisibleSegmentsArray = [];
  var allVisibleSegmentsArray = [];
  var secondaryTrails = {};
  // Trailhead Variables
  // Not sure if these should be global, but hey whatev

  var remoteSegmentCache = {};

  var trailheadIconOptions = {
    iconSize: [52 * 0.60, 66 * 0.60],
    iconAnchor: [13 * 0.60, 33 * 0.60],
    popupAnchor: [0, -3]
  };

  var trailheadIcon1Options = $.extend(trailheadIconOptions, {
    iconUrl: 'img/icon_trailhead_active.png'
  });
  var trailheadIcon1 = L.icon(trailheadIcon1Options);
  var trailheadIcon2Options = $.extend(trailheadIconOptions, {
    className: 'icon icon-sign'
  });
  // var trailheadIcon2 = L.icon({
  //       iconUrl: 'icons/defs.svg#icon-sign',
  //       iconAnchor: [13 * 0.60, 33 * 0.60],
  //       popupAnchor: [0, -3],
  //       iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
  //       });

  var trailheadIcon2 = L.divIcon({
    className: 'icon-sign',
    html: '<svg class="icon icon-map icon-sign"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>',
    iconAnchor: [13 * 0.60, 33 * 0.60],
    popupAnchor: [0, -3],
    iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
  });
  //L.divIcon(trailheadIcon2Options);


  // =====================================================================//
  // UI events to react to

  // $("#redoSearch").click(reorderTrailsWithNewLocation);

  $('.closeDetail').click(closeDetailPanel); // Close the detail panel!
  $('.detailPanelControls').click(changeDetailPanel); // Shuffle Through Trails Shown in Detail Panel
  $('.filter').change(filterChangeHandler);

  $(".clearSelection").click(clearSelectionHandler);
  $(".fpccSearchbox").keyup(function(e) { processSearch(e); });
  $(".offsetZoomControl").click(offsetZoomIn);
  $(".fpccSearchsubmit").click(processSearch);

  //$(".fpccSearchsubmit").click(processSearch);
  //$(".fpccSearchbox").keyup(function(e) { processSearch(e); });


  $(".geolocateButton").click(centerOnLocation);

  //  Detail Panel Navigation UI events
  $('.hamburgerBox').click(moveSlideDrawer);

  $('.slider, .detailPanelBanner').click(slideDetailPanel);
  $(".detailPanel").hover(detailPanelHoverIn, detailPanelHoverOut);

  $(".aboutLink").click(openAboutPage);
  $(".closeAbout").click(closeAboutPage);
  //  Shouldn't the UI event of a Map Callout click opening the detail panel go here?

  //if mobile, we expand 2 of the sidebar sections
  if(SMALL){
    $(".trigger1").addClass("active");
    $(".trigger3").addClass("active");
  }

  // =====================================================================//
  // Kick things off

  // showOverlay();

  if ($("html").hasClass("lt-ie8")) {
     return;  //abort, dont load
  }
  initialSetup();

  // =====================================================================//
  function showOverlay() {
    var overlayHTMLIE = "<h1>Welcome to To The Trails!</h1>" +
    "<p>We're sorry, but To The Trails is not compatible with Microsoft Internet Explorer 8 or earlier versions of that web browser." +
    "<p>Please upgrade to the latest version of " +
    "<a href='http://windows.microsoft.com/en-us/internet-explorer/download-ie'>Internet Explorer</a>, " +
    "<a href='http://google.com/chrome'>Google Chrome</a>, or " +
    "<a href='http://getfirefox.com'>Mozilla Firefox</a>." +
    "<p>If you are currently using Windows XP, you'll need to download and use Chrome or Firefox." +
    "<img src='/img/Overlay-Image-01.png' alt='trees'>";

    var overlayHTML = "<span class='closeOverlay'>x</span>" +
    "<h1>Welcome To The Trails!</h1>" +
    "<p>Pick trails, find your way, and keep your bearings as you move between trails and parks in Cuyahoga Valley National Park and Metro Parks, Serving Summit County and beyond." +
    "<p>ToTheTrails.com is currently in public beta. It's a work in progress! We'd love to hear how this site is working for you." +
    "<p>Send feedback and report bugs to <a href='mailto:hello@tothetrails.com?Subject=Feedback' target='_top'>hello@tothetrails.com</a>. Learn more on our 'About' page.";

    var closedOverlayHTML = "<h1>Visit us on your desktop!</h1>" +
    "<p>We'll be launching To The Trails for mobile devices on November 15th, but desktop access is available now!" +
    "<img src='/img/Overlay-Image-01.png' alt='trees'>";

    // restricting SMALL devices only as of 11/13/2013
    // if ((window.location.hostname === "www.tothetrails.com" && SMALL) || CLOSED) {

    // open to all 11/15/2013
    if (CLOSED) {
      console.log("closed");
      $(".overlay-panel").html(closedOverlayHTML);
      $(".overlay").show();
    } else {
      if ($("html").hasClass("lt-ie8")) {
        $(".overlay-panel").html(overlayHTMLIE);
      } else {
        if (window.localStorage && window.localStorage['already-visited']) {
          // The user has already visited the page – skip showing the
          // generic welcome message
          return;
        } else {
          $(".overlay-panel").html(overlayHTML);

          // Saving so that the welcome message is not shown the second
          // time around.
          if (window.localStorage) {
            window.localStorage['already-visited'] = true;
          }
        }
      }

      $(".overlay-panel").click(function() {
        $(".overlay").hide();
      });
    }

    $(".overlay").show();
  }

  // The next three functions perform trailhead/trail mapping
  // on a) initial startup, b) requested re-sort of trailheads based on the map,
  // and c) a change in filter settings
  // They all call addTrailsToTrailheads() as their final action
  // --------------------------------------------------------------

  // on startup, get location, display the map,
  // get and display the trailheads, populate originalTrailData,
  // add originalTrailData to trailheads

  function initialSetup() {
    console.log("initialSetup");
    setupGeolocation(function() {
      if (geoSetupDone) {
        return;
      }
      fetchTrailheads(currentUserLocation, function() { trailheadsFetched = true; });
      fetchTraildata(function() { traildataFetched = true; });
      fetchTrailsegments(function() { trailsegmentsFetched = true; });
      fetchActivities(function() { activitiesFetched = true; });
      if (USE_LOCAL) {
        setTimeout(waitForTrailSegments, 0);
        setTimeout(waitForDataAndSegments, 0);
        setTimeout(waitForAllTrailData, 0);
        //setTimeout(waitForActivities, 0);
      } else {
        setTimeout(waitForDataAndTrailHeads, 0);
        setTimeout(waitForTrailSegments, 0);
      }
    });
  }

  function waitForTrailSegments() {
    // console.log("waitForTrailSegments");
    if (trailsegmentsFetched) {
      console.log("waitForTrailSegments trailsegmentsFetched");
      if (map.getZoom() >= SECONDARY_TRAIL_ZOOM && !(map.hasLayer(allSegmentLayer))) {
      //  map.addLayer(allSegmentLayer).bringToBack();
      }
    }
    else {
      setTimeout(waitForTrailSegments, 100);
    }
  }

  function waitForDataAndSegments() {
    // console.log("waitForDataAndSegments");
    if (traildataFetched && trailsegmentsFetched) {
      //createSegmentTrailnameCache();
      //console.log("[waitForDataAndSegments] createSegmentTrailIdCache")
      //createSegmentTrailIdCache();
    }
    else {
      setTimeout(waitForDataAndSegments, 100);
    }
  }

  function waitForAllTrailData() {
    // console.log("waitForAllTrailData");
    if (traildataFetched && trailsegmentsFetched && trailheadsFetched) {

      addTrailsToTrailheads(originalTrailData, originalTrailheads);
      // if we haven't added the segment layer yet, add it.
      if (map.getZoom() >= SECONDARY_TRAIL_ZOOM && !(map.hasLayer(allSegmentLayer))) {
        map.addLayer(allSegmentLayer);
        console.log("Hello???");
        testChangeStyle();
      }
    }
    else {
      setTimeout(waitForAllTrailData, 100);
    }
  }

  function testChangeStyle() {
    console.log("testChangeStyle!!!");
    // allSegmentLayer.eachLayer(function (layer) {
    //   layer.getLayers()[0].setStyle({weight: 0});
    //   //console.log("[testChangeStyle] : " + layer.getLayers()[0].feature.properties.trail_ids);

    // });

  }

  function waitForDataAndTrailHeads() {
    // console.log("waitForDataAndTrailHeads");
    if (traildataFetched && trailheadsFetched) {
      //addTrailsToTrailheads(originalTrailData, originalTrailheads);
      highlightFirstTrail();
    }
    else {
      setTimeout(waitForDataAndTrailHeads, 100);
    }
  }

  function highlightFirstTrail() {
    if (orderedTrails.length) {
      if (SMALL &&($(".slideDrawer").hasClass("closedDrawer")) ){
        highlightTrailhead(orderedTrails[0].trailheadID, 0);
        showTrailDetails(orderedTrails[0].trail, orderedTrails[0].trailhead);
      }
    }
    else {
      setTimeout(highlightFirstTrail, 100);
    }
  }

  // set currentUserLocation to the center of the currently viewed map
  // then get the ordered trailheads and add trailData to trailheads

  // function reorderTrailsWithNewLocation() {
  //   setAnchorLocationFromMap();
  //   fetchTrailheads(anchorLocation, function() {
  //     addTrailsToTrailheads(trailData);
  //   });
  // }



  // =====================================================================//
  //  Filter function + helper functions, triggered by UI events declared above.

  function applyFilterChange(currentFilters) {
    console.log("[applyFilterChange]");
    // currentTrailData = $.extend(true, {}, originalTrailData);
    currentTrailheads = [];
    addTrailsToTrailheads(originalTrailData, originalTrailheads);
  }

  function filterChangeHandler(e) {
    var $currentTarget = $(e.currentTarget);
    var filterType = $currentTarget.attr("data-filter");
    var currentUIFilterState = $currentTarget.val();
    console.log(currentUIFilterState + " filterType = " + filterType);
    updateFilterObject(filterType, currentUIFilterState);
  }

  function processSearch(e) {
    var $currentTarget = $(e.currentTarget);
    var filterType = "searchFilter";
    console.log("[processSearch]");
    var currentUIFilterState;
    if (SMALL) {
      currentUIFilterState = $('#mobile .fpccSearchbox').val();
    } else {
      //currentUIFilterState = $('#desktop .fpccSearchbox').val();
      currentUIFilterState = $('#desktop .fpccSearchbox').val();
    }
    if (($currentTarget).hasClass('fpccSearchbox')) {
      if (SMALL) {
        if (e.keyCode === 13) {
          updateFilterObject(filterType, currentUIFilterState);
        }
      } else {
        clearTimeout(searchKeyTimeout);
        searchKeyTimeout = setTimeout(function () {
          console.log("[processSearch] searchKeyTimeout currentUIFilterState = " + currentUIFilterState);
          updateFilterObject(filterType, currentUIFilterState);
        }, 800);
      }
    } else if (($currentTarget).hasClass('fpccSearchsubmit')) {
      updateFilterObject(filterType, currentUIFilterState);
    }
  }

  function updateFilterObject(filterType, currentUIFilterState) {
    console.log("[updateFilterObject] currentUIFilterState = " + currentUIFilterState);
    var matched = 0;
    if (filterType == "activityFilter") {
      console.log("[updateFilterObject] activityFilter");
      var activityFilterLength = currentFilters.activityFilter.length;
      console.log("[updateFilterObject] old activityFilterLength = " + activityFilterLength);
      console.log("[updateFilterObject] old currentFilters.activityFilter = " + currentFilters.activityFilter);
      if (currentUIFilterState) {
        currentFilters.activityFilter = [];
        currentFilters.activityFilter = String(currentUIFilterState).split(",");
        console.log("[updateFilterObject] NEW currentFilters.activityFilter = " + currentFilters.activityFilter);
      } else {
        currentFilters.activityFilter = [];
      }
      console.log("[updateFilterObject] activityFilterLength = " + activityFilterLength);
      console.log("[updateFilterObject] currentFilters.activityFilter = " + currentFilters.activityFilter);
    }

    if (filterType == "lengthFilter") {
      console.log("length");
      console.log(currentFilters.lengthFilter.length);
      var lengthFilterLength = currentFilters.lengthFilter.length;
      for (var j = 0; j < lengthFilterLength; j++) {
        var lengthRange = currentFilters.lengthFilter[j];
        if (lengthRange == currentUIFilterState) {
          // console.log("match");
          currentFilters.lengthFilter.splice(j, 1);
          matched = 1;
          break;
        }
      }
      if (matched === 0) {
        currentFilters.lengthFilter.push(currentUIFilterState);
      }
    }

    if (filterType == "searchFilter") {
      console.log("[updateFilterObject] searchFilter currentUIFilterState= " + currentUIFilterState);
      //console.log("searchFilter");
      currentFilters.searchFilter = currentUIFilterState;
    }
    // currentFilters[filterType] = currentUIFilterState;
    console.log(currentFilters);
    applyFilterChange(currentFilters);
  }

  
  function filterResults(trail, trailhead) {
    var wanted = false;
    var lengthMatched = false;
    var activityMatched = true;
    var searchMatched = true;
    if (currentFilters.activityFilter) {
      for (var i = 0; i < currentFilters.activityFilter.length; i++) {
        var activity = currentFilters.activityFilter[i];
        console.log("trailhead.properties[activity] = " + trailhead.properties[activity]);
        var trailheadActivity = 1;
        if (!(trailhead.properties[activity] === undefined)) {
          trailheadActivity = trailhead.properties[activity];
        }
        else {
          console.log("searchfilter is not null = " + currentFilters.activityFilter[i]);
          //searchMatched = false;
          var normalizedTrailName = "";
          var normalizedDescription = null;
          if (trail) {
            normalizedTrailName = trail.properties.name.toLowerCase();
            normalizedDescription = trail.properties.description.toLowerCase();
            console.log("normalizedTrailName= " + normalizedTrailName);
          }
          var normalizedSearchFilter = currentFilters.activityFilter[i].toLowerCase();
          var equivalentWords = [
            [" and ", " & "],
            ["tow path", "towpath"]
          ];
          $.each(equivalentWords, function(i, el) {
            var regexToken = "(" + el[0] + "|" + el[1] + ")";
            normalizedSearchFilter = normalizedSearchFilter.replace(el[0], regexToken);
            normalizedSearchFilter = normalizedSearchFilter.replace(el[1], regexToken);
          });
          var searchRegex = new RegExp(normalizedSearchFilter);
          var nameMatched = !! normalizedTrailName.match(searchRegex);

          var descriptionMatched;
          if (normalizedDescription === null) {
            descriptionMatched = false;
          } else {
            descriptionMatched = !! normalizedDescription.match(searchRegex);
          }

          var trailheadNameMatched;
          var normalizedTrailheadName = trailhead.properties.name.toLowerCase();
          trailheadNameMatched = !! normalizedTrailheadName.match(searchRegex);

          var parkNameMatched;
          if (trailhead.properties.park === null) {
            parkNameMatched = false;
          }
          else {
            var normalizedParkName = trailhead.properties.park.toLowerCase();
            parkNameMatched = !! normalizedParkName.match(searchRegex);
          }

          var addressMatched;
          if (trailhead.properties.address === null) {
            addressMatched = false;
          }
          else {
            var normalizedAddress = trailhead.properties.address.toLowerCase();
            addressMatched = !! normalizedAddress.match(searchRegex);
          }

          if ((descriptionMatched || nameMatched || trailheadNameMatched || parkNameMatched || addressMatched)) {
            //searchMatched = false;
          } else {
            searchMatched = false;
          }
          
        }

        if (!trailheadActivity) {
          activityMatched = false;
        }
      }
    }
    
   

    if (searchMatched && activityMatched) {
      wanted = true;
    }
    else {
      // console.log('no match');
    }
    return wanted;
  }

  function clearSelectionHandler(e) {
    console.log("clearSelectionHandler");
    $(".visuallyhidden_2 input").attr("checked", false);
    $(".visuallyhidden_3 input").attr("checked", false);
    $(".fpccSearchbox").val("");
    currentFilters = {
      lengthFilter: [],
      activityFilter: [],
      searchFilter: ""
    };
    applyFilterChange(currentFilters);
  }

  // ======================================
  // map generation & geolocation updates

  function offsetZoomIn(e) {
    // get map center lat/lng
    // convert to pixels
    // add offset
    // convert to lat/lng
    // setZoomAround to there with currentzoom + 1
    var centerLatLng = map.getCenter();
    var centerPoint = map.latLngToContainerPoint(centerLatLng);
    var offset = centerOffset;
    var offsetCenterPoint = centerPoint.add(offset.divideBy(2));
    var offsetLatLng = map.containerPointToLatLng(offsetCenterPoint);
    if ($(e.target).hasClass("offsetZoomIn")) {
      map.setZoomAround(offsetLatLng, map.getZoom() + 1);
    } else if ($(e.target).hasClass("offsetZoomOut")) {
      map.setZoomAround(offsetLatLng, map.getZoom() - 1);

    } else if ($(e.target).hasClass("offsetGeolocate")) {
      // console.log('Centering on geolocaton');
      var userPoint = map.latLngToContainerPoint(currentUserLocation);
      var offsetUserLocation = userPoint.subtract(offset.divideBy(2));
      var offsetUserLatLng = map.containerPointToLatLng(offsetUserLocation)
      map.setView(offsetUserLatLng, map.getZoom());
    }
  }

  function setAnchorLocationFromMap() {
    anchorLocation = map.getCenter();
  }

  function setupGeolocation(callback) {
    console.log("setupGeolocation");
    if (navigator.geolocation) {
      // setup location monitoring
      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      };
      geoWatchId = navigator.geolocation.watchPosition(
        function(position) {
          if (originalTrailheads.length === 0) {
            handleGeoSuccess(position, callback);
            geoSetupDone = true;
          } else {
            handleGeoSuccess(position);
          }
        },
        function(error) {
          if (originalTrailheads.length === 0) {
            handleGeoError(error, callback);
            geoSetupDone = true;
          } else {
            handleGeoError(error);
          }
        },
        options);
    } else {
      // for now, just returns MAPCENTERPOINT
      // should use browser geolocation,
      // and only return MAPCENTERPOINT if we're far from home base
      currentUserLocation = MAPCENTERPOINT;
      showGeoOverlay();
      handleGeoError("no geolocation", callback);
    }

  }

  function handleGeoSuccess(position, callback) {
    currentUserLocation = new L.LatLng(position.coords.latitude, position.coords.longitude);
    var distanceToMapCenterPoint = currentUserLocation.distanceTo(MAPCENTERPOINT) / 1000;
    // if no map, set it up
    if (!map) {
      var startingMapLocation;
      var startingMapZoom;
      // if we're close to Cook County, start the map and the trailhead distances from
      // the current location, otherwise just use MAPCENTERPOINT for both
      if (distanceToMapCenterPoint < LOCAL_LOCATION_THRESHOLD) {
        anchorLocation = currentUserLocation;
        startingMapLocation = currentUserLocation;
        startingMapZoom = 13;
      } else {
        anchorLocation = MAPCENTERPOINT;
        startingMapLocation = MAPCENTERPOINT;
        startingMapZoom = 13;
      }
      map = createMap(startingMapLocation, startingMapZoom);
    }
    // always update the user marker, create if needed
    if (!userMarker) {
      userMarker = L.userMarker(currentUserLocation, {
        smallIcon: true,
        pulsing: true,
        accuracy: 0
      }).addTo(map);
    }
    // If user location exists, turn on geolocation button
    if (currentUserLocation) {
      $(".offsetGeolocate").show();
    }
    // console.log(currentUserLocation);
    userMarker.setLatLng(currentUserLocation);
    if (typeof callback == "function") {
      callback();
    }
  }

  function handleGeoError(error, callback) {
    console.log("handleGeoError");
    console.log(error);
    if (!map) {
      console.log("making map anyway");
      map = createMap(MAPCENTERPOINT, 13);
      currentUserLocation = MAPCENTERPOINT;
      if (error.code === 1) {
        showGeoOverlay();
      }
    }
    if (map && userMarker && error.code === 3) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    if (typeof callback == "function") {
      callback();
    }
  }

  function showGeoOverlay() {
    var noGeolocationOverlayHTML = "<span class='closeOverlay'>x</span><p>We weren't able to get your current location, so we'll give you trailhead distances from the center of Cook County.";
    $(".overlay-panel").html(noGeolocationOverlayHTML);
    $(".overlay").show();
    $(".overlay-panel").click(function() {
      $(".overlay").hide();
    });
  }

  function centerOnLocation() {
    map.setView(currentUserLocation, map.getZoom());
  }

  var mapDragUiHide = false;

  function hideUiOnMapDrag() {
    mapDragUiHide = true;

    // Hide the top UI
    $('.title-row').addClass('dragging-map');
    // Hide the bottom UI
    $('.detailPanel').addClass('dragging-map');
    // Resize the map container to be bigger
    $('.trailMapContainer').addClass('dragging-map');
    // Make sure the map catches up to the fact that we resized the container
    map.invalidateSize({ animate: false });
  }

  function unhideUiOnMapDrag() {
    mapDragUiHide = false;

    $('.title-row').removeClass('dragging-map');
    $('.detailPanel').removeClass('dragging-map');

    // Wait with resizing the map until the UI is actually hidden, otherwise
    // it will resize too early and there will be a blank space for a bit.
    window.setTimeout(function() {
      if (!mapDragUiHide) {
        $('.trailMapContainer').removeClass('dragging-map');
        map.invalidateSize({ animate: false });
      }
    }, 250); // TODO make a const
  }

  function createMap(startingMapLocation, startingMapZoom) {
    console.log("createMap");
    console.log(mapDivName);
    var mapboxAttribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>';
    var mapboxAccessToken = 'sk.eyJ1Ijoic21hcnRjaGljYWdvY29sbGFib3JhdGl2ZSIsImEiOiJjaWlqOGU2dmMwMTA2dWNrcHM0d21qNDhzIn0.2twD0eBu4UKHu-3JZ0vt0w';

    var map = L.map(mapDivName, {
      zoomControl: false,
      scrollWheelZoom: 'center',
      minZoom: 9,
      maxBounds: [[41.16211, -90.89539], [42.61577, -85.62195]]
    });

    var rbhBase = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: mapboxAttribution,
    maxZoom: 18,
    id: 'mapbox.run-bike-hike',
    accessToken: mapboxAccessToken
    }).addTo(map);

    var imageryBase = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: mapboxAttribution,
    maxZoom: 18,
    id: 'mapbox.satellite',
    accessToken: mapboxAccessToken
    });

    var baseMaps = {
      "Streets": rbhBase,
      "Satellite": imageryBase
    };

    L.control.layers(baseMaps, null, {collapsed: false, position: 'bottomright'}).addTo(map);
    

    // L.tileLayer.provider('MapBox.' + MAPBOX_MAP_ID).addTo(map);
    map.setView(startingMapLocation, startingMapZoom);
    map.fitBounds(map.getBounds(), {
      paddingTopLeft: centerOffset
    });
    // L.control.scale().addTo(map);
    map.on('dragstart', hideUiOnMapDrag);
    map.on('dragend', unhideUiOnMapDrag);

    map.on("zoomend", function(e) {
      console.log("zoomend start " + map.getZoom());
      var zoomLevel = map.getZoom();
      if (SHOW_ALL_TRAILS && allSegmentLayer) {
        if (map.getZoom() >= SECONDARY_TRAIL_ZOOM && !(map.hasLayer(allSegmentLayer))) {
          // console.log(allSegmentLayer);
          setTimeout(function() {
            map.addLayer(allSegmentLayer);
            //allSegmentLayer.bringToBack();
          }, 0);

        }
        if (map.getZoom() < SECONDARY_TRAIL_ZOOM && map.hasLayer(allSegmentLayer)) {
          if (currentTrailPopup) {
            map.removeLayer(currentTrailPopup);
          }
          map.removeLayer(allSegmentLayer);
        }
      }
      
      if (currentTrailheadLayerGroup) {
        map.removeLayer(currentTrailheadLayerGroup);
      }
      if (zoomLevel >= SHOW_SIGN_ZOOM) {
        currentTrailheadLayerGroup = L.layerGroup(currentTrailheadSignArray);
      } else {
        currentTrailheadLayerGroup = L.layerGroup(currentTrailheadMarkerArray);
      }
      map.addLayer(currentTrailheadLayerGroup);
      showActivities();
      console.log("zoomend end " + map.getZoom());
    });
    map.on('popupclose', popupCloseHandler);
    map.on('popupopen', popupOpenHandler);
    return map;
  }



  // =====================================================================//
  // Getting trailhead data

  function fetchTrailheads(location, callback) {
    console.log("fetchTrailheads");
    var callData = {
      loc: location.lat + "," + location.lng,
      type: "GET",
      path: "/trailheads.json"
    };
    makeAPICall(callData, function(response) {
      populateOriginalTrailheads(response, location);
      if (typeof callback == "function") {
        callback(response);
      }
    });
  }

  // =====================================================================//
  // Getting activity data

  function fetchActivities(callback) {
    console.log("fetchActivities");
    var callData = {
      type: "GET",
      path: "/activities.json"
    };
    makeAPICall(callData, function(response) {
      populateOriginalActivities(response);
      if (typeof callback == "function") {
        callback(response);
      }
    });
  }

  function populateOriginalActivities(ActivityDataGeoJSON) {
    console.log("[populateOriginalActivities] features count = " + ActivityDataGeoJSON.features.length);
    originalActivities = {};

    for (var i = 0; i < ActivityDataGeoJSON.features.length; i++) {
      var currentFeature = ActivityDataGeoJSON.features[i];
      var currentFeatureLatLng = new L.LatLng(currentFeature.geometry.coordinates[1], currentFeature.geometry.coordinates[0]);
      var iconType = null;
      var activityType = currentFeature.properties.activity_type;
      var activityName = currentFeature.properties.name || activityType;
      var popupContentMainDivHTML = "<div class='activity-popup'>";
      popupContentMainDivHTML += activityName + "</div>";
      var iconName = "";
      if (activityType == "Fishing Lake") {
        iconType = "icon-fishing";
      } else if (activityType == "aquatic center") {
        iconType = "icon-aquatic-center";
        iconName = activityName;
      } else if (activityType == "bicycle lot") {
        iconType = "icon-bicycling";
      } else if (activityType == "bicycle rental") {
        iconType = "icon-bike-rental";
      } else if (activityType == "birding hotspot") {
        iconType = "icon-birding-hotspot";
      } else if (activityType == "boating center") {
        iconType = "icon-boat-launch";
      } else if (activityType == "boat launch") {
        iconType = "icon-boat-launch";
      } else if (activityType == "boat rental") {
        iconName = activityName;
        iconType = "icon-boat-rental";
      } else if (activityType == "canoe landing") {
        iconType = "icon-canoe-landing";
      } else if (activityType == "dog park") {
        iconType = "icon-off-leash-dog-area";
      } else if (activityType == "equestrian center") {
        iconType = "icon-equestrian";
      } else if (activityType == "equestrian parking") {
        iconType = "icon-equestrian";
      } else if (activityType == "frisbee golf") {
        iconType = "icon-disc-golf";
      } else if (activityType == "golf course") {
        iconType = "icon-golf-course-driving-range";
      } else if (activityType == "golf driving range") {
        iconType = "icon-golf-course-driving-range";
      } else if  (activityType == "model airplane flying field") {
        iconType = "icon-model-airplane";
      } else if  (activityType == "pavillion") {
        iconName = activityName;
        iconType = "icon-facility";
      } else if  (activityType == "recreational waterbody") {
        iconName = activityName;
        iconType = "icon-waterbody";
      } else if  (activityType == "scenic") {
        iconType = "icon-scenic-overlook";
      } else if  (activityType == "sledding") {
        iconType = "icon-sledding";
      } else if  (activityType == "snowmobiling") {
        iconType = "icon-snowmobiling";
      } else if  (activityType == "special activity") {
        iconType = "icon-facility";
      } else if (activityType == "trailhead") {
        iconType = "icon-trail-marker";
      } else if (activityType == "Volunteer center") {
        iconType = "icon-facility";
      } else if (activityType == "warming shelter") {
        iconType = "icon-picnic-grove-shelter";
      } 

      var activityIcon = L.divIcon({
        className: 'icon-map' + iconType,
        html: '<svg class="icon icon-map ' + iconType + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconType + '"></use></svg>' + iconName,
        iconAnchor: [13 * 0.60, 33 * 0.60],
        popupAnchor: [0, -3],
        iconSize: [90 * 0.60, 75 * 0.60] // size of the icon
      });

      // var newMarker = new L.CircleMarker(currentFeatureLatLng, {
      //     color: "#0000FF",
      //     fillOpacity: 0.5,
      //     opacity: 0.8
      //   }).setRadius(MARKER_RADIUS);

      var newMarker = new L.Marker(currentFeatureLatLng);

      if (iconType) {
        newMarker = new L.Marker(currentFeatureLatLng, {
          icon: activityIcon,
        });
      }

      var activity = {
        properties: currentFeature.properties,
        geometry: currentFeature.geometry,
        marker: newMarker,
        popupContent: popupContentMainDivHTML
      };

      setActivityEventHandlers(activity);
      activity.marker.bindPopup(activity.popupContent);
      originalActivities[activity.properties.trailhead_id] = originalActivities[activity.properties.trailhead_id] || [];
      originalActivities[activity.properties.trailhead_id].push(activity);

      //originalActivities.push(activity);
      //console.log("[populateOriginalActivities] thisActivity= " + originalActivities[activity.properties.trailhead_id]);
    }
    //console.log("[populateOriginalTrailheads] originalTrailheads count " + originalTrailheads.length );
  }

  function setActivityEventHandlers(activity) {
    activity.marker.on("click", function(activity) {
      return function() {
        activityMarkerClick(activity);
      };
    }(activity));
  }

  function activityMarkerClick(activity) {
    console.log("activityMarkerClick");
    //highlightTrailhead(id, 0);
    highlightActivities(activity.properties.trailhead_id);
    var trailhead = getTrailheadById(activity.properties.trailhead_id);
    if (trailhead) {
      if (trailhead.trails) {
        showTrailDetails(originalTrailData[trailhead.trails[0]], trailhead);
      } else {
        showTrailDetails(null, trailhead);
      }
    }
  }
 

  // given the fetchTrailheads response, a geoJSON collection of trailheads ordered by distance,
  // populate trailheads[] with the each trailhead's stored properties, a Leaflet marker,
  // and a place to put the trails for that trailhead.

  function populateOriginalTrailheads(trailheadsGeoJSON, location) {
    console.log("populateOriginalTrailheads");
    originalTrailheads = [];
    for (var i = 0; i < trailheadsGeoJSON.features.length; i++) {
      var currentFeature = trailheadsGeoJSON.features[i];
      //console.log("[populateOriginalTrailheads] trailheadID = " + currentFeature.properties.id + " trail_ids = " + currentFeature.properties.trail_ids);
      var currentFeatureLatLng = new L.LatLng(currentFeature.geometry.coordinates[1], currentFeature.geometry.coordinates[0]);
      var distance = currentFeatureLatLng.distanceTo(location);
      currentFeature.properties.distance = distance;
      // var newMarker = L.marker(currentFeatureLatLng, ({
      //   icon: trailheadIcon1
      // }));
      var newMarker = new L.CircleMarker(currentFeatureLatLng, {
        color: "#D86930",
        fillOpacity: 0.5,
        opacity: 0.8
      }).setRadius(MARKER_RADIUS);
      var signMarker = new L.Marker(currentFeatureLatLng, {
        icon: trailheadIcon2
      });
      var trailhead = {
        properties: currentFeature.properties,
        geometry: currentFeature.geometry,
        marker: newMarker,
        signMarker: signMarker,
        trails: currentFeature.properties.trail_ids,
        popupContent: ""
      };
      setTrailheadEventHandlers(trailhead);
      originalTrailheads.push(trailhead);
      //console.log("[populateOriginalTrailheads] trails " + trailhead.trails);
    }
    console.log("[populateOriginalTrailheads] originalTrailheads count " + originalTrailheads.length );
  }

  function setTrailheadEventHandlers(trailhead) {

    trailhead.marker.on("click", function(trailheadID) {
      return function() {
        trailheadMarkerClick(trailheadID);
      };
    }(trailhead.properties.id));

    trailhead.signMarker.on("click", function(trailheadID) {
      return function() {
        trailheadMarkerClick(trailheadID);
      };
    }(trailhead.properties.id));

    // placeholders for possible trailhead marker hover behavior
    // trailhead.marker.on("mouseover", function(trailhead) {
    // }(trailhead));

    // trailhead.marker.on("mouseout", function(trailhead) {
    // }(trailhead));
  }

  function trailheadMarkerClick(id) {
    console.log("trailheadMarkerClick");
    highlightTrailhead(id, 0);
    var trailhead = getTrailheadById(id);
    var zoomArray = highlightedActivityMarkerArray;
    console.log("zoomArray = " + zoomArray);
    zoomArray.push(trailhead.marker);
    console.log("zoomArray = " + zoomArray);
    var zoomFeatureGroup = new L.FeatureGroup(zoomArray);
    var zoomFeatureGroupBounds = zoomFeatureGroup.getBounds();
    if ( map.getBoundsZoom(zoomFeatureGroupBounds) >= map.getZoom() ) {
      map.fitBounds(zoomFeatureGroupBounds);
    } else {
      map.fitBounds(zoomFeatureGroupBounds,{
        maxZoom: map.getZoom()
      })
    }
    if (trailhead.trails) {
      showTrailDetails(originalTrailData[trailhead.trails[0]], trailhead);
    } else {
      showTrailDetails(null, trailhead);
    }
  }


  function makeCurrentActivities(myTrailheads) {
    console.log("[makeCurrentActivities] Begin");
    currentActivityMarkerArray = [];
    for (var i = 0; i < myTrailheads.length; i++) {
      var trailhead_id = myTrailheads[i].properties.id
      if (originalActivities[trailhead_id]) {
        for ( var j = 0; j < originalActivities[trailhead_id].length; j++ ) {
          originalActivities[trailhead_id][j].marker.setOpacity(.5);
          currentActivityMarkerArray.push(originalActivities[trailhead_id][j].marker);
        }
      }
    }
  }


  function showActivities() {
    console.log("[showActivties]");
    if (!currentActivityLayerGroup) {
      currentActivityLayerGroup = L.layerGroup(currentActivityMarkerArray);
    }
    if (map.getZoom() >= SHOW_ALL_ACTIVITIES_ZOOM) {
      map.addLayer(currentActivityLayerGroup);
    }
    else {
      map.removeLayer(currentActivityLayerGroup);
    }
  }

  function highlightActivities(myTrailhead_id) {
    console.log("[highlightActivities]");
    for (var i = 0; i < highlightedActivityMarkerArray.length; i++) {
      highlightedActivityMarkerArray[i].setOpacity(.5);
    }
    highlightedActivityMarkerArray = [];
    var trailheadActivities = originalActivities[myTrailhead_id];
    if (trailheadActivities) {
      for ( i = 0; i < trailheadActivities.length; i++) {
        trailheadActivities[i].marker.setOpacity(1);
        highlightedActivityMarkerArray.push(trailheadActivities[i].marker);
      }
    }
  }

  function popupCloseHandler(e) {
    currentTrailPopup = null;
  }

  function popupOpenHandler(e) {
    //$(".trail-popup-line-named").click(trailPopupLineClick);
    $(".trailhead-trailname").click(trailnameClick); // Open the detail panel!
  }

  // get the trailData from the API

  function fetchTraildata(callback) {
    console.log("fetchTraildata");
    var callData = {
      type: "GET",
      path: "/trails.json"
    };
    makeAPICall(callData, function(response) {
      populateTrailData(response);
      if (typeof callback == "function") {
        callback();
      }
    });
  }

  function populateTrailData(trailDataGeoJSON) {
    secondaryTrails = {};

    for (var i = 0; i < trailDataGeoJSON.features.length; i++) {
      if (trailDataGeoJSON.features[i].properties.part_of[0]) {
        secondaryTrails[trailDataGeoJSON.features[i].properties.id] = trailDataGeoJSON.features[i];
      } else {
        originalTrailData[trailDataGeoJSON.features[i].properties.id] = trailDataGeoJSON.features[i];
        originalTrailData[trailDataGeoJSON.features[i].properties.id].properties.secondaryHTML = '';
      }
    }

    // Sorting by length so that longest trail is first
    var sort_array = [];
    for (var key in secondaryTrails) {
      sort_array.push({key:key, length:secondaryTrails[key].properties.length});
    }
    sort_array.sort(function(x,y){return y.length - x.length});

    //Object.keys(secondaryTrails).forEach(function (key) {
    for (var i = 0; i < sort_array.length; i++) {
      var thisSecondaryTrail = secondaryTrails[sort_array[i].key];
        // iteration code
      if (thisSecondaryTrail.properties.length >= 1) {
        //console.log("thisSecondaryTrail= " + thisSecondaryTrail);
        var secondaryHTML = '<div class="fpccTrailSegment"><div class="fpccSegmentOverview fpcc';
        secondaryHTML += thisSecondaryTrail.properties.trail_color
        if (thisSecondaryTrail.properties.trail_type.toLowerCase() == "unpaved" || thisSecondaryTrail.properties.trail_type.toLowerCase() == "primitive" ) {
          secondaryHTML += " fpcc" + thisSecondaryTrail.properties.trail_type;
        }
        secondaryHTML += ' clearfix"><span class="fpccSegmentName">';
        secondaryHTML += thisSecondaryTrail.properties.trail_color + ' ' + thisSecondaryTrail.properties.trail_type;
        secondaryHTML += '</span><span class="fpccTrailUse">';
        secondaryHTML += '<svg class="icon icon-hiking"><use xlink:href="icons/defs.svg#icon-hiking"></use></svg>';
        if (thisSecondaryTrail.properties.trail_type.toLowerCase() == "unpaved" || thisSecondaryTrail.properties.trail_type.toLowerCase() == "paved" || thisSecondaryTrail.properties.trail_type == "") {
          secondaryHTML += '<svg class="icon icon-bicycling"><use xlink:href="icons/defs.svg#icon-bicycling"></use></svg>';
          secondaryHTML += '<svg class="icon icon-cross-country-skiing"><use xlink:href="icons/defs.svg#icon-cross-country-skiing"></use></svg>';
        }
        if (thisSecondaryTrail.properties.trail_type.toLowerCase() == "unpaved" || thisSecondaryTrail.properties.trail_type == "") {
          secondaryHTML += '<svg class="icon icon-equestrian"><use xlink:href="icons/defs.svg#icon-equestrian"></use></svg>';
        }
        secondaryHTML += '</span></div>';
        secondaryHTML += '<div class="fpccSegmentDetails clearfix"><span class="fpccLabel fpccLeft">Length<span>';
        secondaryHTML += (Math.round(thisSecondaryTrail.properties.length * 100) / 100);
        secondaryHTML += ' mi</span></span>';
        secondaryHTML += '<span class="fpccLabel fpccRight">Surface<span>';
        secondaryHTML += thisSecondaryTrail.properties.trail_type;
        secondaryHTML += '</span></span></div></div>';
        //console.log(thisSecondaryTrail.properties);
        originalTrailData[thisSecondaryTrail.properties.part_of[0]].properties.secondaryHTML += secondaryHTML;
      }
    }
    currentTrailData = $.extend(true, {}, originalTrailData);
  }

  function fetchTrailsegments(callback) {
    console.log("fetchTrailsegments");
    var callData = {
      type: "GET",
      path: "/trailsegments.json"
    };
    // if (SMALL) {
    //   callData.path = "/trailsegments.json?simplify=" + ALL_SEGMENT_LAYER_SIMPLIFY;
    // }
    makeAPICall(callData, function(response) {
      trailSegments = response;
      if (USE_SEGMENT_LAYER) {
        if (USE_COMPLEX_SEGMENT_LAYER) {
          allSegmentLayer = makeAllSegmentLayer(response);
        }
        else {
          allSegmentLayer = L.geoJson(response, {
            style: {
              color: NORMAL_SEGMENT_COLOR,
              weight: NORMAL_SEGMENT_WEIGHT,
              opacity: 1,
              clickable: false,
              smoothFactor: customSmoothFactor
            }
          });
        }
      }
      if (typeof callback == "function") {
        callback();
      }
    });
  }

  // this creates a lookup object so we can quickly look up if a trail has any segment data available
  function createSegmentTrailnameCache() {
    console.log("createSegmentTrailnameCache");
    for (var segmentIndex = 0; segmentIndex < trailSegments.features.length; segmentIndex++) {
      // var segment = $.extend(true, {}, trailSegments.features[segmentIndex]);
      var segment = trailSegments.features[segmentIndex];
      for (var i = 0; i < 6; i++) {
        var fieldName = "trail" + i;
        if (segment.properties[fieldName]) {
          segmentTrailnameCache[segment.properties[fieldName]] = true;
        }
      }
    }
  }

  // this creates a lookup object so we can quickly find trail information for a segment
  // This might not be needed with 1.1 structure. [OpenTrails 1.1]
  function createSegmentTrailIdCache() {
    console.log("createSegmentTrailIdCache");
    console.log("originalTrailData length" + originalTrailData.length);
    for (var prop in originalTrailData) {
    //for (var trailIndex = 0; trailIndex < originalTrailData.length; trailIndex++) {
    //for (var segmentIndex = 0; segmentIndex < trailSegments.features.length; segmentIndex++) {
      // var segment = $.extend(true, {}, trailSegments.features[segmentIndex]);
      console.log("IN THE LOOP");
      var trailID = originalTrailData[trailIndex].features.id;
      console.log("trailID = " + trailID);
      var segments = originalTrailData[trailIndex].features.segment_ids;
      for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
        var segment = segments[segmentIndex];
        segmentTrailIdCache[segment].push(trailID);
        console.log("segmentTrailIdCache = " + segmentTrailIdCache);
      }
    }
  }

  // returns true if trailname is in trailData
  var trailNameLookup = null;
  function trailnameInListOfTrails(trailname) {
    // console.log("trailnameInListOfTrails");
    if (trailNameLookup === null) {
      trailNameLookup = {};
      $.each(originalTrailData, function(key, value) {
        var myTrailName = value.properties.name;
        trailNameLookup[myTrailName] = true;
      });
    }

    // console.log("trailnameInListOfTrails end");
    return trailNameLookup[trailname];
  }

  function segmentHasTrailWithMetadata(feature) {
    for (var i = 0; i <= 6; i++) {
      var trailFieldname = "trail" + i;
      if (trailnameInListOfTrails(feature.properties[trailFieldname])) {
        return true;
      }
    }
    return false;
  }


  function makeAllSegmentLayer(response) {
    if (allSegmentLayer !== undefined) {
      return allSegmentLayer;
    }
    console.log("makeAllSegmentLayer");
    // make visible layers
    allVisibleSegmentsArray = [];
    allInvisibleSegmentsArray = [];
    var allSegmentLayer = new L.FeatureGroup();
    // console.log("visibleAllTrailLayer start");

    // make a normal visible layer for the segments, and add each of those layers to the allVisibleSegmentsArray
    var visibleAllTrailLayer = L.geoJson(response, {
      style: function(feature) {
        //console.log(feature.properties.trail_names[0] + " " + feature.properties.trail_colors[0]);
        var thisColor = NORMAL_SEGMENT_COLOR;
        var thisWeight = NORMAL_SEGMENT_WEIGHT;
        var thisWeight = 0;
        var thisOpacity = 1;
        var thisClickable = false;
        var thisSmoothFactor = customSmoothFactor;
        var thisDash = "";
        //console.log("[visibleAllTrailLayer] secondary_trail_ids = " + feature.properties.secondary_trail_ids[0]);
        var thisSecondaryTrail = feature.properties.secondary_trail_ids[0];
        var thisTrailType = ""
        if (secondaryTrails[thisSecondaryTrail]) {
          thisTrailType = secondaryTrails[thisSecondaryTrail].properties.trail_type;
        }
        switch (thisTrailType) {
          case 'unpaved': thisDash = "5,10"; break;
          case '': thisDash = "5,10"; break;
          case 'primitive': thisDash = "5,10"; break;
        }
        switch (feature.properties.trail_colors[0].toLowerCase()) {
                case 'red': thisColor = "#EE2D2F"; break;
                case 'orange': thisColor = "#F7941E"; break;
                case 'purple': thisColor = "#7F58A5"; break;
                case 'grey': thisColor = "#58595B"; break;
                case 'yellow': thisColor = "#FFF450"; break;
                case 'green': thisColor = "#006129"; break;
                case 'tan': thisColor = "#969161"; break;
                case 'olive': thisColor = "#969161"; break;
                case 'brown': thisColor = "#6C503F"; break;
                case 'blue': thisColor = "#26B8EB"; break;
                case 'black': thisColor = "#333132"; break;
        }
        return {dashArray: thisDash, color: thisColor, weight: thisWeight, opacity: thisOpacity, clickable: thisClickable, smoothFactor: thisSmoothFactor};
      },
      onEachFeature: function visibleOnEachFeature(feature, layer) {
        // console.log("visibleAllTrailLayer onEachFeature");
        allVisibleSegmentsArray.push(layer);
      }
    });

    // make invisible layers

    // make the special invisible layer for mouse/touch events. much wider paths.
    // make popup html for each segment
    var invisibleAllTrailLayer = L.geoJson(response, {
      style: {
        opacity: 0,
        weight: 20,
        clickable: true,
        smoothFactor: 10
      },
      onEachFeature: function invisibleOnEachFeature(feature, layer) {
        // console.log("invisibleAllTrailLayer onEachFeature");
        allInvisibleSegmentsArray.push(layer);
      }
    });
    // console.log("invisibleAllTrailLayer end");

    var numSegments = allInvisibleSegmentsArray.length;
    //console.log("numSegments = " + numSegments);
    for (var i = 0; i < numSegments; i++) {
      // console.log("numSegments loop");
      var invisLayer = allInvisibleSegmentsArray[i];
      // make a FeatureGroup including both visible and invisible components
      // var newTrailFeatureGroup = new L.FeatureGroup([allVisibleSegmentsArray[i]]);

      var newTrailFeatureGroup = new L.FeatureGroup([allInvisibleSegmentsArray[i], allVisibleSegmentsArray[i]]);

      // var $popupHTML = $("<div class='trail-popup'>");

      var popupHTML = "<div class='trail-popup'>";
      var atLeastOne = false;
      // console.log("[makeAllSegmentLayer] invisLayer ID = " + invisLayer.feature.properties.id);
      var segmentTrailIDs = invisLayer.feature.properties.trail_ids || [];
      var segmentTrailNames = invisLayer.feature.properties.trail_names;
      //console.log("[makeAllSegmentLayer] segmentTrailIDs = " + segmentTrailIDs);
      for (var trailIndex = 0; trailIndex < segmentTrailIDs.length; trailIndex++) {
        // console.log("trailHTML start");
        var trailID = segmentTrailIDs[trailIndex];
        var trailName = segmentTrailNames[trailIndex];
        //console.log("[makeAllSegmentLayer] trail = " + trailID + " " + trailName);
        //var trailField = "trail" + j;
        //if (invisLayer.feature.properties[trailField]) {
          var trailPopupLineDiv;
        //if (trailnameInListOfTrails(invisLayer.feature.properties[trailField])) {
            trailPopupLineDiv = "<div class='trail-popup-line trail-popup-line-named' " +
            "data-steward='" + invisLayer.feature.properties.steward + "' " +
            "data-source='" + invisLayer.feature.properties.source + "' " +
            "data-trailid='" + trailID + "' " +
            "data-trailname='" + trailName + "'> " +
            trailName + " Trail System" +
            "</div>";
            atLeastOne = true;
          // } else {
          //   trailPopupLineDiv = "<div class='trail-popup-line trail-popup-line-unnamed'>" +
          //   invisLayer.feature.properties[segmentTrailIDs] +
          //   "</div>";
          // }
          popupHTML = popupHTML + trailPopupLineDiv;

        // console.log("trailHTML end");

      }


      popupHTML = popupHTML + "</div>";

      invisLayer.feature.properties.popupHTML = popupHTML;
      var eventType = "click";
      // if (TOUCH) {
      //   eventType = "click";
      // } else {
      //   eventType = "mouseover";
      // }

      newTrailFeatureGroup.addEventListener(eventType, function featureGroupEventListener(invisLayer) {
        return function newMouseover(e) {
          // console.log("new mouseover");
          if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
          }
          if (openTimeout) {
            clearTimeout(openTimeout);
            openTimeout = null;
          }
          openTimeout = setTimeout(function openTimeoutFunction(originalEvent, target) {
            return function() {
              var trailIDs = invisLayer.feature.properties.trail_ids;
              console.log("[trail click] " + trailIDs);
              highlightTrailhead(null, null, trailIDs);
              var trail = originalTrailData[trailIDs];
              showTrailDetails(trail, null);
              //var trail = target.
              //showTrailDetails(trail, trailhead);
              // target.setStyle({
              //   weight: HOVER_SEGMENT_WEIGHT
              // });
              // // set currentWeightedSegment back to normal
              // if (target != currentWeightedSegment) {
              //   if (currentWeightedSegment) {
              //     currentWeightedSegment.setStyle({
              //       weight: NORMAL_SEGMENT_WEIGHT
              //     });
              //   }
              // }
              var popupHTML = invisLayer.feature.properties.popupHTML;
              currentTrailPopup = new L.Popup({ autoPan: SMALL ? false : true}).setContent(popupHTML).setLatLng(originalEvent.latlng).openOn(map);
              // currentWeightedSegment = target;
            };
          }(e, e.target), 250);
        };
      }(invisLayer));

      // newTrailFeatureGroup.addEventListener("mouseout", function(e) {
      //   if (closeTimeout) {
      //     clearTimeout(closeTimeout);
      //     closeTimeout = null;
      //   }
      //   if (openTimeout) {
      //     clearTimeout(openTimeout);
      //     openTimeout = null;
      //   }
      //   closeTimeout = setTimeout(function(e) {
      //     return function() {
      //       e.target.setStyle({
      //         weight: 3
      //       });
      //       //map.closePopup();
      //     };
      //   }(e), 1250);
      // });

      //newTrailFeatureGroup.addEventListener("onClick", function)
      allSegmentLayer.addLayer(newTrailFeatureGroup);
    }

    // use this to just show the network
    // allSegmentLayer = visibleAllTrailLayer;
    allVisibleSegmentsArray = null;
    allInvisibleSegmentsArray = null;
    return allSegmentLayer;
  }

  // after clicking on a trail name in a trail popup,
  // find the closest matching trailhead and highlight it

  function trailPopupLineClick(e) {
    console.log("trailPopupLineClick");
    // get all trailheads that have this trailname and source
    var trailname = $(e.target).attr("data-trailname");
    var trailid = $(e.target).attr("data-trailid");
    var source = $(e.target).attr("data-source");

    var trailheadMatches = [];
    for (var i = 0; i < originalTrailheads.length; i++) {
      var trailhead = originalTrailheads[i];
      if (trailhead.properties.source == source) {
        console.log("[trailPopupLineClick] trail_id " + trailhead.properties.trail_ids + " data-trailid " + trailid);
        var thismatch = false;
        for (var j = 0; j < trailhead.properties.trail_ids.length; j++){
          if (trailhead.properties.trail_ids[j] == trailid) {
            thismatch = true;
          }
        }
        if (thismatch) {
          trailheadMatches.push(trailhead);
        }
      }
    }
    // find the closest one
    // popups have no getLatLng, so we're cheating here.
    var currentLatLng = currentTrailPopup._latlng;
    var nearestDistance = Infinity;
    var nearestTrailhead = null;
    console.log("[trailPopupLineClick] trailheadMatches.length " + trailheadMatches.length );
    for (var j = 0; j < trailheadMatches.length; j++) {
      var matchedTrailhead = trailheadMatches[j];
      console.log("[trailPopupLineClick] " + matchedTrailhead );
      var trailheadLatLng = matchedTrailhead.marker.getLatLng();
      var distance = currentLatLng.distanceTo(trailheadLatLng);
      if (distance < nearestDistance) {
        nearestTrailhead = matchedTrailhead;
        nearestDistance = distance;
      }
    }
    // find the index of the clicked trail
    var trailIndex = 0;
    var trail = null;
    for (var k = 0; k < nearestTrailhead.trails.length; k++) {
      var trailheadTrailID = nearestTrailhead.trails[k];
      if (originalTrailData[trailheadTrailID].properties.name == trailname) {
        trail = originalTrailData[trailheadTrailID];
        trailIndex = k;
      }
    }
    // highlight it
    highlightTrailhead(nearestTrailhead.properties.id, trailIndex);
    showTrailDetails(trail, nearestTrailhead);
  }

  // given trailData,
  // populate trailheads[x].trails with all of the trails in trailData
  // that match each trailhead's named trails from the trailhead table.
  // Also add links to the trails within each trailhead popup
  // then call fixDuplicateTrailheadTrails, makeTrailheadPopups, mapActiveTrailheads, and makeTrailDivs

  function addTrailsToTrailheads(myTrailData, myTrailheads) {
    console.log("addTrailsToTrailheads");
    currentTrailheads = [];
    currentTrailData = {};
    currentTrailIDs = {};
    for (var j = 0; j < myTrailheads.length; j++) {
      var trailhead = myTrailheads[j];
      var trailheadWanted = false;
      // for each original trailhead trail name
      if (trailhead.properties.trail_ids) {
        var trailheadTrailIDs = trailhead.properties.trail_ids;
        for (var trailNum = 0; trailNum < trailheadTrailIDs.length; trailNum++) {
          var trailheadTrailID = trailheadTrailIDs[trailNum];
          //console.log("[addTrailsToTrailheads] trailheadTrailID: " + trailheadTrailID);
          var trail = myTrailData[trailheadTrailID];
          //console.log("[addTrailsToTrailheads] trail: " + trail);
          if (filterResults(trail, trailhead)) {
            //wanted = true;
            trailheadWanted = true;
            currentTrailIDs[trailheadTrailID] = 1;
            //currentTrailIDs.push(trailheadTrailID);
            //currentTrailData = $.extend(true, currentTrailData, trail);
          }
        }
      } else {
        if (filterResults(null, trailhead)) {
          trailheadWanted = true;
          //wanted = true;
        }
      }
      if (trailheadWanted) {
        //console.log("filterResults is good");
        //trailheadWanted = true;
        currentTrailheads.push(trailhead);
      }



      // if (trailheadWanted) {
      //   myTrailheads.splice(j, 1);
      // }
    }
    console.log("curentTrailheads count = " + currentTrailheads.length);
    setTimeout(function() {
      //fixDuplicateTrailheadTrails(myTrailheads);
      makeTrailheadPopups(currentTrailheads);
      mapActiveTrailheads(currentTrailheads);
      makeCurrentActivities(currentTrailheads);
      allSegmentLayer.eachLayer(function (layer) {
        //console.log("trail_ids= " + layer.getLayers()[0].feature.properties.trail_ids);
        if (layer.getLayers()[0].feature.properties.trail_ids) {
          var layerWanted = 0;
          if (currentTrailIDs[layer.getLayers()[0].feature.properties.trail_ids[0]]) {
            layer.getLayers()[0].setStyle({weight: NORMAL_SEGMENT_WEIGHT});
            layer.getLayers()[1].setStyle({weight: 20});
          } else {
            layer.getLayers()[0].setStyle({weight: 0});
            layer.getLayers()[1].setStyle({weight: 0});
          }
        }
        
        //console.log("[testChangeStyle] : " + layer.getLayers()[0].feature.properties.trail_ids);

        });



      setTimeout(function() {
        makeTrailDivs(currentTrailheads);
        setTimeout(function() {
          if (SMALL && USE_LOCAL) {
            highlightTrailhead(orderedTrails[0].trailheadID, 0);
            orderedTrailIndex = 0;
            showTrailDetails(orderedTrails[0].trail, orderedTrails[0].trailhead);
          }
        }, 0);
      }, 0);
    }, 0);
  }


  // this is so very wrong and terrible and makes me want to never write anything again.
  // alas, it works for now.
  // for each trailhead, if two or more of the matched trails from addTrailsToTrailheads() have the same name,
  // remove any trails that don't match the trailhead source

  function fixDuplicateTrailheadTrails(myTrailheads) {
    console.log("fixDuplicateTrailheadTrails");
    for (var trailheadIndex = 0; trailheadIndex < myTrailheads.length; trailheadIndex++) {
      var trailhead = myTrailheads[trailheadIndex];
      var trailheadTrailNames = {};
      for (var trailsIndex = 0; trailsIndex < trailhead.trails.length; trailsIndex++) {
        var trailName = originalTrailData[trailhead.trails[trailsIndex]].properties.name;
        trailheadTrailNames[trailName] = trailheadTrailNames[trailName] || [];
        var sourceAndTrailID = {
          source: originalTrailData[trailhead.trails[trailsIndex]].properties.source,
          trailID: originalTrailData[trailhead.trails[trailsIndex]].properties.id
        };
        trailheadTrailNames[trailName].push(sourceAndTrailID);
      }
      for (var trailheadTrailName in trailheadTrailNames) {
        if (trailheadTrailNames.hasOwnProperty(trailheadTrailName)) {
          if (trailheadTrailNames[trailheadTrailName].length > 1) {
            // remove the ID from the trailhead trails array if the source doesn't match
            for (var i = 0; i < trailheadTrailNames[trailheadTrailName].length; i++) {
              var mySourceAndTrailID = trailheadTrailNames[trailheadTrailName][i];
              if (mySourceAndTrailID.source != trailhead.properties.source) {
                var idToRemove = mySourceAndTrailID.trailID;
                var removeIndex = $.inArray(idToRemove.toString(), trailhead.trails);
                trailhead.trails.splice(removeIndex, 1);
              }
            }
          }
        }
      }
    }
    console.log("fixDuplicateTrailheadTrails end");
  }

  // given the trailheads,
  // make the popup menu content for each one, including each trail present
  // and add it to the trailhead object

  function makeTrailheadPopups() {
    console.log("makeTrailheadPopups start");
    for (var trailheadIndex = 0; trailheadIndex < originalTrailheads.length; trailheadIndex++) {
      var trailhead = originalTrailheads[trailheadIndex];
      //console.log("[makeTrailheadPopups] trailhead " + trailhead);

      var popupContentMainDivHTML = "<div class='trailhead-popup'>";
      var popupTrailheadDivHTML = "<div class='trailhead-box'><div class='popupTrailheadNames'>" + trailhead.properties.name + "</div>";
      popupContentMainDivHTML = popupContentMainDivHTML + popupTrailheadDivHTML;
      if (trailhead.trails)  {
        for (var trailsIndex = 0; trailsIndex < trailhead.trails.length; trailsIndex++) {
          var trail = originalTrailData[trailhead.trails[trailsIndex]];

          var popupTrailDivHTMLStart = "<div class='trailhead-trailname trail" + (trailsIndex + 1) + "' " +
          "data-trailname='" + trail.properties.name + "' " +
          "data-trailid='" + trail.properties.id + "' " +
          "data-trailheadname='" + trailhead.properties.name + "' " +
          "data-trailheadid='" + trailhead.properties.id + "' " +
          "data-index='" + trailsIndex + "'>";
          var statusHTML = "";
          if (trail.properties.status == 1) {
            statusHTML = "<img class='status' src='img/icon_alert_yellow.png' title='alert'>";
          }
          else if (trail.properties.status == 2) {
            statusHTML = "<img class='status' src='img/icon_alert_red.png' title='alert'>";
          }

          var trailNameHTML = "<div class='popupTrailNames'>" + trail.properties.name + "</div><b></b>";
          var popupTrailDivHTML = popupTrailDivHTMLStart + statusHTML + trailNameHTML + "</div>";
          popupContentMainDivHTML = popupContentMainDivHTML + popupTrailDivHTML;

          //var detailPanelContentMainDivHTML =
        }
      }
      popupContentMainDivHTML = popupContentMainDivHTML + "</div>";
      trailhead.popupContent = popupContentMainDivHTML;
    }
    console.log("makeTrailheadPopups end");
  }

  // given trailheads, add all of the markers to the map in a single Leaflet layer group
  // except for trailheads with no matched trails

  function mapActiveTrailheads(myTrailheads) {
    console.log("mapActiveTrailheads start");
    currentTrailheadMarkerArray = [];
    currentTrailheadSignArray = [];
    for (var i = 0; i < myTrailheads.length; i++) {
      currentTrailheadMarkerArray.push(myTrailheads[i].marker);
      currentTrailheadSignArray.push(myTrailheads[i].signMarker);
      //} else {
        // console.log(["trailhead not displayed: ", trailheads[i].properties.name]);
      //}
    }
    if (currentTrailheadLayerGroup) {
      map.removeLayer(currentTrailheadLayerGroup);
    }

    if (map.getZoom() >= SHOW_SIGN_ZOOM) {
      currentTrailheadLayerGroup = L.layerGroup(currentTrailheadSignArray);
    } else {
      currentTrailheadLayerGroup = L.layerGroup(currentTrailheadMarkerArray);
    }
    map.addLayer(currentTrailheadLayerGroup);
    console.log("mapActiveTrailheads end");
  }


  // given trailheads, now populated with matching trail names,
  // make the trail/trailhead combination divs
  // noting if a particular trailhead has no trails associated with it

  function makeTrailDivs(myTrailheads) {
    console.log("makeTrailDivs");
    orderedTrails = [];
    var trailList = {}; // used to see if trail div has been built yet.
    var divCount = 1;
    //var topLevelID = SMALL ? "mobile" : "desktop";
    var topLevelID = "desktop";
    var trailListElementList = document.getElementById(topLevelID).getElementsByClassName("fpccResults");
    trailListElementList[0].innerHTML = "";
    var myTrailheadsLength = myTrailheads.length;
    var trailListContents = "<h4>" + myTrailheadsLength + " RESULTS FOUND</h4>";
    //if(myTrailheads.length === 0) return;
    myTrailheads.sort(function(a, b){
     return a.properties.distance-b.properties.distance
    })
    
    for (var j = 0; j < myTrailheadsLength; j++) {
      // console.log("makeTrailDivs trailhead: " + j);
      // newTimeStamp = Date.now();
      // time = newTimeStamp - lastTimeStamp;
      // lastTimeStamp = newTimeStamp;
      // console.log(time + ": " + "next trailhead");
      var trailhead = myTrailheads[j];

      var trailheadName = trailhead.properties.name;
      var trailheadType = trailhead.properties.poi_type;
      var trailheadID = trailhead.properties.id;
      var parkName = trailhead.properties.park;
      var trailheadTrailIDs = trailhead.trails;
      var trailheadSource = trailhead.properties.source;
      var trailheadDistance = metersToMiles(trailhead.properties.distance);



      // Making a new div for text / each trail
      //var trailIDsLength = trailheadTrailIDs.length;
      //for (var i = 0; i < trailIDsLength; i++) {
        // console.log("makeTrailDivs " + i);
      if (trailheadTrailIDs) {
        var trailID = trailheadTrailIDs[0];
        var trail = originalTrailData[trailID];
        var trailName = originalTrailData[trailID].properties.name;
        var trailLength = Number(Math.round(originalTrailData[trailID].properties.length +'e2')+'e-2');
      }
      else {
        var trailID = null;
        var trail = null;
        var trailName = null;
        var trailLength = null;
      }
      var trailCurrentIndex = divCount++;

       var trailDivText = "<a href='#' class='fpccEntry clearfix' " +
        "data-source='list' " +
        "data-trailid='" + trailID + "' " +
        "data-trailname='" + trailName + "' " +
        "data-trail-length='" + trailLength + "' " +
        "data-trailheadName='" + trailheadName + "' " +
        "data-trailheadid='" + trailheadID + "' " +
        "data-index='" + 0 + "'>";


        var trailheadInfoText = "<span class='fpccEntryName'>" +
        '<svg class="icon icon-sign"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>' +
        '<span class="fpccEntryNameText">' + trailheadName + '</span></span>' +
        '<span class="fpccEntryDis">' + trailheadDistance + ' mi away</span></a>' +
        "</div>"

      var trailSourceText = "<div class='trailSource' id='" + trailheadSource + "'>" + trailheadSource + "</div></div>";
      var trailDivComplete = trailDivText + trailheadInfoText + trailSourceText;

      trailListContents = trailListContents + trailDivComplete;

      if ((!trailList[trailID]) && trailheadTrailIDs) {
        trailDivText = "<a href='#' class='fpccEntry clearfix' " +
        "data-source='list' " +
        "data-trailid='" + trailID + "' " +
        "data-trailname='" + trailName + "' " +
        "data-trail-length='" + trailLength + "' " +
        "data-trailheadName='" + null + "' " +
        "data-trailheadid='" + null + "' " +
        "data-index='" + 0 + "'>";
        trailheadInfoText =  "<span class='fpccEntryName'>" +
        '<svg class="icon icon-trail-marker"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>' +
        '<span class="fpccEntryNameText">' + trailName + ' Trail System</span></span>' +
        //'<span class="fpccEntryDis">' + trailheadDistance + ' mi away</span></a>' +
        "</div>"
        trailList[trailID] = 1;
        trailDivComplete = trailDivText + trailheadInfoText + trailSourceText;
        trailListContents = trailListContents + trailDivComplete;
      }

      //var trailDivWrapper = document.createElement('div');
      //var trailDivComplete = trailDivText + trailInfoText + trailheadInfoText + trailSourceText;
        // trailDivWrapper.innerHTML = trailDivComplete;
        // trailListElementList[0].insertAdjacentHTML('beforeend', trailDivWrapper.firstChild.outerHTML);

        var trailInfoObject = {
          trailID: trailID,
          trail: trail,
          trailheadID: trailheadID,
          trailhead: trailhead,
          index: 0
        };
        orderedTrails.push(trailInfoObject);
        // newTimeStamp = Date.now();
        // time = newTimeStamp - lastTimeStamp;
        // lastTimeStamp = newTimeStamp;
        // console.log(time + ": " + "end loop");
      //}
    }
    trailListElementList[0].innerHTML = trailListContents;
    $(".fpccEntry").click(populateTrailsForTrailheadDiv);
    //$(".fpccEntry").click(populateTrailsForTrailheadDiv).click(trailDivClickHandler);
    $(".trails-count").html(orderedTrails.length + " RESULTS FOUND");
    console.log("end makeTrailDivs 4");
  }

  function trailDivClickHandler(e) {
    var $myTarget = $(e.currentTarget);
    var divTrailID = $myTarget.attr("data-trailid");
    console.log(divTrailID);
    var divTrail = originalTrailData[divTrailID];
    var divTrailheadID = $myTarget.attr("data-trailheadid");
    var divTrailhead = getTrailheadById(divTrailheadID);
    console.log("[trailDivClickHandler] about to showTrailDetails(divTrail, divTrailhead)");
    showTrailDetails(divTrail, divTrailhead);
  }

  function metersToMiles(i) {
    return (i * METERSTOMILESFACTOR).toFixed(1);
  }


  // detail panel section
  //

  function showTrailDetails(trail, trailhead) {
    console.log("showTrailDetails");
    if ($('.detailPanel').is(':hidden')) {
      decorateDetailPanel(trail, trailhead);
      openDetailPanel();
      currentDetailTrail = trail;
      currentDetailTrailhead = trailhead;
    } else {
      // if (currentDetailTrail == trail && currentDetailTrailhead == trailhead) {
      //   currentDetailTrail = null;
      //   currentDetailTrailhead = null;
      //   closeDetailPanel();
      // } else {
        decorateDetailPanel(trail, trailhead);
        currentDetailTrail = trail;
        currentDetailTrailhead = trailhead;
      //}
    }
  }


  //  Helper functions for ShowTrailDetails

  function openDetailPanel() {
    console.log("openDetailPanel");
    $('.accordion').hide();
    $('.aboutPage').hide();
    $('.detailPanel').show();
    var myDiv = document.getElementById('detailPanelBodySection');
    myDiv.scrollTop = 0;
    if (!SMALL) {
      //$('.accordion').hide();
    }
    if (SMALL) {
      if ($(".slideDrawer").hasClass("openDrawer")) {
        console.log("slide drawer is open");
        $(".slideDrawer").removeClass("openDrawer");
        $(".slideDrawer").addClass("closedDrawer");
        $(".detailPanel").removeClass("hidden");
        $(".detailPanel").addClass("contracted");
      }
    }
    $('.trailhead-trailname.selected').addClass("detail-open");
    //$(".detailPanel .detailPanelPicture")[0].scrollIntoView();
    // map.invalidateSize();
  }

  function closeDetailPanel() {
    console.log("closeDetailPanel");
    $('.detailPanel').hide();
    $('.accordion').show();
    $('.trailhead-trailname.selected').removeClass("detail-open");
    highlightTrailhead(null,null);
    map.closePopup();
    //map.removeLayer(currentTrailhead.marker);
    //map.removeLayer(currentMultiTrailLayer);

    //currentTrailhead = null;
    //currentHighlightedTrailLayer = {};
    //currentMultiTrailLayer = {};

    // map.invalidateSize();
  }

  function detailPanelHoverIn(e) {
    enableTrailControls();
  }

  function detailPanelHoverOut(e) {
    // if(!SMALL){
    //   $(".controlRight").removeClass("enabled").addClass("disabled");
    //   $(".controlLeft").removeClass("enabled").addClass("disabled");
    // }
  }

  function changeDetailPanel(e) {
    console.log("changeDetailPanel");
    e.stopPropagation();
    var trailheadID = currentDetailTrailhead.properties.id;
    var trailID = String(currentDetailTrail.properties.id);
    console.log(trailID);
    var trailhead;

    for (var i = 0; i < orderedTrails.length; i++) {
      if (orderedTrails[i].trailID == trailID && orderedTrails[i].trailheadID == trailheadID) {
        orderedTrailIndex = i;
      }
    }
    var trailChanged = false;
    // if ($(e.target).hasClass("controlRight")) {
    //   orderedTrailIndex = orderedTrailIndex + 1;
    //   trailChanged = true;
    // }
    // if ($(e.target).hasClass("controlLeft") && orderedTrailIndex > 0) {
    //   orderedTrailIndex = orderedTrailIndex - 1;
    //   trailChanged = true;
    // }
    if (trailChanged) {
      var orderedTrail = orderedTrails[orderedTrailIndex];
      // console.log(orderedTrail);
      trailheadID = orderedTrail.trailheadID;
      // console.log(["trailheadID", trailheadID]);
      var trailIndex = orderedTrail.index;
      // console.log(["trailIndex", trailIndex]);
      for (var j = 0; j < originalTrailheads.length; j++) {
        if (originalTrailheads[j].properties.id == trailheadID) {
          trailhead = originalTrailheads[j];
        }
      }
      enableTrailControls();
      highlightTrailhead(trailheadID, trailIndex);
      showTrailDetails(currentTrailData[trailhead.trails[trailIndex]], trailhead);
      //$(".detailPanel .detailPanelPicture")[0].scrollIntoView();
    }
  }

  function enableTrailControls() {

    // if (orderedTrailIndex === 0) {
    //   $(".controlLeft").removeClass("enabled").addClass("disabled");
    // } else {
    //   $(".controlLeft").removeClass("disabled").addClass("enabled");
    // }

    // if (orderedTrailIndex == orderedTrails.length - 1) {
    //   $(".controlRight").removeClass("enabled").addClass("disabled");
    // } else {
    //   $(".controlRight").removeClass("disabled").addClass("enabled");
    // }
    return orderedTrailIndex;
  }

  function resetDetailPanel() {
      $('.detailPanel .detailPanelBanner .entranceName').html("");
      $('.detailPanel .fpccEntranceAddress').html("");
      $('.detailPanel .fpccAmenities').html("");
      //$('.detailPanel .fpccTrails').html("");
      $('.detailPanel .fpccDirections a').attr("href", "").attr("target", "_blank");

      $('.detailPanel .detailPanelPicture').attr("src", "img/ImagePlaceholder.jpg");
      $('.detailPanel .detailPanelPictureCredits').remove();
      $('.detailPanel .detailConditionsDescription').html("");
      $('.detailPanel .detailTrailSurface').html("");
      $('.detailPanel .detailTrailheadName').html("");
      $('.detailPanel .detailTrailheadPark').html("");
      $('.detailPanel .detailTrailheadAddress').html("");
      $('.detailPanel .detailTrailheadCity').html("");
      $('.detailPanel .detailTrailheadState').html("");
      $('.detailPanel .detailTrailheadZip').html("");
      $('.detailPanel .statusMessage').remove();
      $('.detailPanel .hike').html("");
      $('.detailPanel .cycle').html("");
      $('.detailPanel .handicap').html("");
      $('.detailPanel .horse').html("");
      $('.detailPanel .xcountryski').html("");
      $('.detailPanel .detailBottomRow .detailTrailheadAmenities .detailTrailheadIcons .water').html("");
      $('.detailPanel .detailBottomRow .detailTrailheadAmenities .detailTrailheadIcons .kiosk').html("");
      $('.detailPanel .detailBottomRow .detailTrailheadAmenities .detailTrailheadIcons .restrooms').html("");
      $('.detailPanel .detailBottomRow .detailTrailheadAmenities .detailTrailheadIcons .parking').html("");
      $('.detailPanel .detailDescription').html("");
      $('.detailPanel .fpccTrailDescription').html("");
      $('.detailPanel .fpccEntranceDescription').html("");
      $('.detailPanel .fpccLinks').html("");

      $('.detailPanel .detailStewardLogo').attr("src", "/img/logoPlaceholder.jpg");
  }

  function decorateDetailPanel(trail, trailhead) {
    // console.log(orderedTrailIndex);

    enableTrailControls();

    resetDetailPanel();
    var myDiv = document.getElementById('detailPanelBodySection');
    myDiv.scrollTop = 0;

    if (trail) {
        var trailname = trail.properties.name + " Trail";

        $('.detailPanel .fpccTrailName').html(trailname);
        $('.detailPanel .trailheadTrailMaps').show();
        $('.detailPanel .fpccTrailHeader').show();
        if (trail.properties.description) {
          $('.detailPanel .fpccTrailDescription').html(trail.properties.description);
          $('.detailPanel .fpccTrailDescription').show();
        }
        $('.detailPanel .fpccTrailSegments').show();
        $('.detailPanel .fpccTrailSegments').html(trail.properties.secondaryHTML);
        $('.detailPanel .fpccTrails').show();
        $('.detailPanel .fpccTrails .icon-trail-marker').show();
        $('.detailPanel .fpccLinks').hide();

    } else {
      $('.detailPanel .trailheadTrailMaps').hide();
      $('.detailPanel .fpccTrailHeader').hide();
      $('.detailPanel .fpccTrailSegments').hide();
      $('.detailPanel .fpccTrailDescription').hide();
      $('.detailPanel .fpccTrails').hide();
      $('.detailPanel .fpccTrails .icon-trail-marker').hide();
    }

    if (trailhead) {
      $('.detailPanel .trailMaps').hide();
      $('.detailPanel .fpccEntrance').show();
      $('.detailPanel .fpccAmenities').show();

      var a = document.getElementById('fpccSocialEmail'); 
      a.href = "mailto:?subject=Heading to " + trailhead.properties.name;
      a = document.getElementById('fpccSocialTwitter'); 
      a.href = "http://twitter.com/home?status=Heading to " + trailhead.properties.name;
      a = document.getElementById('fpccSocialFacebook'); 
      a.href = "http://www.facebook.com/sharer/sharer.php?s=100&p[url]=" + window.location.href + "&p[images][0]=&p[title]=Cook County Forest Preserves &p[summary]=Heading to " + trailhead.properties.name;
      
      if (trailhead.properties.description) {
        var entranceDescription = trailhead.properties.description;
        if (trailhead.properties.web_link) {
          entranceDescription += '<a target="_blank" href="' + trailhead.properties.web_link + '" class="fpccMore">Read more &gt;</a>';
        }
        $('.detailPanel .fpccEntranceDescription').html(entranceDescription);
        $('.detailPanel .fpccEntranceDescription').show();
      }

      var extraLinksText = '<div class="fpccMoreHeader">';
      extraLinksText += '<span class="fpccMoreName">More Information</span></div><ul>';
      var extraLinksExist = false;
      if (trailhead.properties.hours1) {
        extraLinksExist = true;
        extraLinksText += '<li>Hours<ul><li>' + trailhead.properties.hours1 + '</li>';
        if (trailhead.properties.hours2) {
          extraLinksText += '<li>' + trailhead.properties.hours2 + '</li>';
        }
        extraLinksText += '</ul></li>';
      }

      if (trailhead.properties.phone) {
        extraLinksExist = true;
        extraLinksText += '<li>Phone Number: ' + trailhead.properties.phone + '</li>';
      }

      if (trailhead.properties.web_link) {
        extraLinksExist = true;
        extraLinksText += '<li><a class="fpccMore" href="' + trailhead.properties.web_link;
        extraLinksText += '" target="_blank">Webpage</a></li>';
      }
      if (trailhead.properties.map_link) {
        extraLinksExist = true;
        extraLinksText += '<li><a class="fpccMore" href="' + trailhead.properties.map_link;
        extraLinksText += '" target="_blank">English Map (PDF)</a></li>';
      }
      if (trailhead.properties.map_link_spanish) {
        extraLinksExist = true;
        extraLinksText += '<li><a class="fpccMore" href="' + trailhead.properties.map_link_spanish;
        extraLinksText += '" target="_blank">Spanish Map (PDF)</a></li>';
      }
      if (trailhead.properties.picnic_link) {
        extraLinksExist = true;
        extraLinksText += '<li><a class="fpccMore" href="' + trailhead.properties.picnic_link;
        extraLinksText += '" target="_blank">Picnic Grove Map (PDF)</a></li>';
      }
      if (trailhead.properties.vol_link) {
        extraLinksExist = true;
        extraLinksText += '<li><a class="fpccMore" href="' + trailhead.properties.vol_link;
        extraLinksText += '" target="_blank">Volunteer Opportunity</a></li>';
      }
      if (trailhead.properties.vol_link2) {
        extraLinksExist = true;
        extraLinksText += '<li><a class="fpccMore" href="' + trailhead.properties.vol_link2;
        extraLinksText += '" target="_blank">Volunteer Opportunity</a></li>';
      }
      extraLinksText += '</ul></div>';
      if (extraLinksExist === true) {
        $('.detailPanel .fpccLinks').html(extraLinksText);
        $('.detailPanel .fpccLinks').show();
      }

      if (trailhead.properties.name) {
        $('.detailPanel .detailPanelBanner .entranceName').html(trailhead.properties.name);
      }

      if (trailhead.properties.address) {
        $('.detailPanel .fpccEntranceAddress').html(trailhead.properties.address);
      }

      var directionsUrl = "http://maps.google.com?saddr=" + currentUserLocation.lat + "," + currentUserLocation.lng +
        "&daddr=" + trailhead.geometry.coordinates[1] + "," + trailhead.geometry.coordinates[0];
      $('.detailPanel .fpccDirections a').attr("href", directionsUrl).attr("target", "_blank");

      // swimming = Aquatic Center
      if (trailhead.properties.swimming) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity aquatic-center'><svg class='icon icon-aquatic-center'><use xlink:href='icons/defs.svg#icon-aquatic-center'></use></svg> <span class='fpccAmenityTitle'>Aquatic Center</span></div>");
      }

      // cycling = Bicycling
      if (trailhead.properties.cycling) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-bicycling'><use xlink:href='icons/defs.svg#icon-bicycling'></use></svg> <span class='fpccAmenityTitle'>Bicycling</span></div>");
      }

      // birding = Birding Hotspot
      if (trailhead.properties.birding) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-birding-hotspot'><use xlink:href='icons/defs.svg#icon-birding-hotspot'></use></svg> <span class='fpccAmenityTitle'>Birding Hotspot</span></div>");
      }

      // boat_ramp = Boat Launch
      if (trailhead.properties.boat_ramp) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-boat-launch'><use xlink:href='icons/defs.svg#icon-boat-launch'></use></svg> <span class='fpccAmenityTitle'>Boat Launch</span></div>");
      }

      // boat_rental = Boat Rental
      if (trailhead.properties.boat_rental) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-boat-rental'><use xlink:href='icons/defs.svg#icon-boat-rental'></use></svg> <span class='fpccAmenityTitle'>Boat Rental</span></div>");
      }

      // camping = Campground
      if (trailhead.properties.camping) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-camp'><use xlink:href='icons/defs.svg#icon-camp'></use></svg> <span class='fpccAmenityTitle'>Campground</span></div>");
      }

      // canoe = Canoe Landing
      if (trailhead.properties.canoe) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-canoe-landing'><use xlink:href='icons/defs.svg#icon-canoe-landing'></use></svg> <span class='fpccAmenityTitle'>Canoe Landing</span></div>");
      }

      // comfortstation = Comfort Station/Toilet
      if (trailhead.properties.comfortstation) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-restroom'><use xlink:href='icons/defs.svg#icon-restroom'></use></svg> <span class='fpccAmenityTitle'>Comfort Station/Toilet</span></div>");
      }

      // cross_country = Cross-Country Skiing
      if (trailhead.properties.cross_country) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-cross-country-skiing'><use xlink:href='icons/defs.svg#icon-cross-country-skiing'></use></svg> <span class='fpccAmenityTitle'>Cross-Country Skiing</span></div>");
      }

      // ecological = Ecological Management
      if (trailhead.properties.ecological) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-ecological-management-area'><use xlink:href='icons/defs.svg#icon-ecological-management-area'></use></svg> <span class='fpccAmenityTitle'>Ecological Management</span></div>");
      }

      // equestrian = Equestrian
      if (trailhead.properties.equestrian) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-equestrian'><use xlink:href='icons/defs.svg#icon-equestrian'></use></svg> <span class='fpccAmenityTitle'>Equestrian</span></div>");
      }

      // fishing = Fishing
      if (trailhead.properties.fishing) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-fishing'><use xlink:href='icons/defs.svg#icon-fishing'></use></svg> <span class='fpccAmenityTitle'>Fishing</span></div>");
      }

      // golf = Golf
      if (trailhead.properties.golf) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg> <span class='fpccAmenityTitle'>Golf</span></div>");
      }

      // hiking = Hiking
      if (trailhead.properties.hiking) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-hiking'><use xlink:href='icons/defs.svg#icon-hiking'></use></svg> <span class='fpccAmenityTitle'>Hiking</span></div>");
      }

      // m_airplane = Model Airplane Flying Field
      if (trailhead.properties.m_airplane) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-model-airplane'><use xlink:href='icons/defs.svg#icon-model-airplane'></use></svg> <span class='fpccAmenityTitle'>Model Airplane Flying Field</span></div>");
      }

      // m_boat = Model Sailboat
      if (trailhead.properties.m_boat) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-model-sailboat'><use xlink:href='icons/defs.svg#icon-model-sailboat'></use></svg> <span class='fpccAmenityTitle'>Model Sailboat</span></div>");
      }

      // nature_center = Nature Center
      if (trailhead.properties.nature_center) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-nature-center'><use xlink:href='icons/defs.svg#icon-nature-center'></use></svg> <span class='fpccAmenityTitle'>Nature Center</span></div>");
      }

      // no_alcohol = No Alcohol
      if (trailhead.properties.no_alcohol) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-no-alcohol'><use xlink:href='icons/defs.svg#icon-no-alcohol'></use></svg> <span class='fpccAmenityTitle'>No Alcohol</span></div>");
      }

      // no_parking = No Parking
      if (trailhead.properties.no_parking) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-no-parking'><use xlink:href='icons/defs.svg#icon-no-parking'></use></svg> <span class='fpccAmenityTitle'>No Parking</span></div>");
      }

      //  dog_friendly = Off-Leash Dog Area
      if (trailhead.properties.dog_friendly) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-off-leash-dog-area'><use xlink:href='icons/defs.svg#icon-off-leash-dog-area'></use></svg> <span class='fpccAmenityTitle'>Off-Leash Dog Area</span></div>");
      }

      // parking = Parking
      if (trailhead.properties.parking) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-parking'><use xlink:href='icons/defs.svg#icon-parking'></use></svg> <span class='fpccAmenityTitle'>Parking</span></div>");
      }

      // pavilion = Pavilion/Event Space
      if (trailhead.properties.pavilion) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg> <span class='fpccAmenityTitle'>Pavilion/Event Space</span></div>");
      }

      // picnic_grove = Picnic Grove
      if (trailhead.properties.picnic_grove) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity picnic-grove'><svg class='icon icon-picnic-grove'><use xlink:href='icons/defs.svg#icon-picnic-grove'></use></svg><span class='fpccAmenityTitle'>Picnic Grove</span></div>");
      }
      
      // shelter = Picnic Grove (with shelter)
      if (trailhead.properties.shelter) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-picnic-grove-shelter'><use xlink:href='icons/defs.svg#icon-picnic-grove-shelter'></use></svg> <span class='fpccAmenityTitle'>Picnic Grove (with shelter)</span></div>");
      }

      // sledding = Sledding
      if (trailhead.properties.sledding) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-sledding'><use xlink:href='icons/defs.svg#icon-sledding'></use></svg> <span class='fpccAmenityTitle'>Sledding</span></div>");
      }

      // snowmobile = Snowmobile Area
      if (trailhead.properties.snowmobile) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-snowmobiling'><use xlink:href='icons/defs.svg#icon-snowmobiling'></use></svg> <span class='fpccAmenityTitle'>Snowmobile Area</span></div>");
      }

      // trailacces = Trail System Access
      if (trailhead.properties.trailacces) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-trail-marker'><use xlink:href='icons/defs.svg#icon-trail-marker'></use></svg> <span class='fpccAmenityTitle'>Trail System Access</span></div>");
      }

    } else {
      $('.detailPanel .trailMaps').show();
      $('.detailPanel .fpccEntrance').hide();
      $('.detailPanel .fpccEntranceDescription').hide();
      $('.detailPanel .fpccTrailHeader').hide();
      $('.detailPanel .fpccTrails .icon-trail-marker').hide();
      $('.detailPanel .trailheadTrailMaps').hide();
      $('.detailPanel .fpccAmenities').hide();
      $('.detailPanel .detailPanelBanner .entranceName').html(trail.properties.name);
    }

    // var emailSubject = encodeURIComponent("Heading to the " + trail.properties.name);
    // var emailBody = encodeURIComponent("Check out more trails at tothetrails.com!");
    // $(".email a").attr("href", "mailto:?subject=" + emailSubject + "&body=" + emailBody).attr("target", "_blank");

    // var tweet = encodeURIComponent("Heading to the " + trail.properties.name + ". Find it on tothetrails.com!");
    // $(".twitter a").attr("href", "http://twitter.com/home?status=" + tweet).attr("target", "_blank");

    // var facebookStatus = encodeURIComponent("Heading to the " + trail.properties.name + "!");
    // $(".facebook a").attr("href",
    //   "http://www.facebook.com/sharer/sharer.php?s=100&p[url]=tothetrails.com&p[images][0]=&p[title]=To%20The%20Trails!&p[summary]=" + facebookStatus).attr("target", "_blank");
    // $('.detailPanel .detailBottomRow .detailTrailheadAmenities .detailTrailheadIcons');
  }

  function showDetailPanel(show){
    console.log("showDetailPanel");
    if (show){
      $('.detailPanel').addClass('expanded');
      $('.detailPanel').removeClass('contracted');
      $('.statusMessage span').removeClass('truncate');
    } else {
      $('.detailPanel').addClass('contracted');
      $('.detailPanel').removeClass('expanded');
      $('.statusMessage span').addClass('truncate');
    }
  }

  function slideDetailPanel(e) {
    console.log("slideDetailPanel");
    if ($(e.target).parents(".detailPanel").hasClass("expanded")) {
      showDetailPanel(false);
    } else {
      showDetailPanel(true);
    }
  }

  //  Mobile-only function changing the position of the detailPanel

  function moveSlideDrawer(e) {
    console.log("moveSlideDrawer");
    if ($(".slideDrawer").hasClass("closedDrawer")) {
      console.log("openSlideDrawer");
      $('.slideDrawer').removeClass('closedDrawer');
      $('.slideDrawer').addClass("openDrawer");
      // and move the Detail Panel all the way down
      if ($(".detailPanel").hasClass("expanded")) {
        $(".detailPanel").removeClass("expanded");
        $(".detailPanel").addClass("hidden");
      } else {
        $(".detailPanel").removeClass("contracted");
        $(".detailPanel").addClass("hidden");
      }
    } else {
      console.log("closeSlideDrawer");
      $('.slideDrawer').removeClass('openDrawer');
      $('.slideDrawer').addClass('closedDrawer');
      // and restore the Detail Panel to contracted
      $('.detailPanel').removeClass("hidden");
      $('.detailPanel').addClass("contracted");
    }
  }

  // function closeSlideDrawerOnly(e) {
  //   console.log("closeSlideDrawerOnly")
  //   var container = $(".slideDrawer");

  //   if (!container.is(e.target)
  //     && container.has(e.target).length == 0
  //     && container.hasClass('openDrawer') {
  //     container.addClass('closedDrawer');
  //     container.removeClass('openDrawer');
  //   }
  // }

  //  About page functions

  function openAboutPage() {
    console.log("openAboutPage");
    $('.accordion').hide();
    $('.aboutPage').show();
    $('.detailPanel').hide();
    if (!SMALL) {
      //$('.accordion').hide();
    }
  }

  function closeAboutPage() {
    console.log("closeAboutPage");
    $('.aboutPage').hide();
    $('.accordion').show();
  }


  // event handler for click of a trail name in a trailhead popup

  //  Going to change the function of this trailnameClick function
  //  But currently, it is not logging trailnameClick.
  //  Current: init populateTrailsforTrailheadName(e)
  //  Future: init showTrailDetails

  function trailnameClick(e) {
    console.log("trailnameClick");
    //populateTrailsForTrailheadDiv(e);

    var $myTarget;
    //
    // // this makes trailname click do the same thing as general div click
    // // (almost certainly a better solution exists)
    if (e.target !== this) {
      $myTarget = $(this);
    } else {
      $myTarget = $(e.target);
    }
    var parsed = parseTrailElementData($myTarget);
    var trail = originalTrailData[parsed.trailID];
    console.log("trail id = " + parsed.trailID);
    showTrailDetails(trail, null);
  }

  // given jquery

  function parseTrailElementData($element) {
    var trailheadID = $element.data("trailheadid");
    var highlightedTrailIndex = $element.data("index") || null;
    var trailID = $element.data("trailid");
    if (trailID == "null") {
      trailID = null;
      highlightedTrailIndex = null;
    }
    var results = {
      trailheadID: trailheadID,
      highlightedTrailIndex: highlightedTrailIndex,
      trailID: trailID
    };
    return results;
  }

  // two event handlers for click of trailDiv and trail in trailhead popup:
  // get the trailName and trailHead that they clicked on
  // highlight the trailhead (showing all of the trails there) and highlight the trail path

  function populateTrailsForTrailheadDiv(e) {
    console.log("populateTrailsForTrailheadDiv");
    var $myTarget;

    // this makes trailname click do the same thing as general div click
    // (almost certainly a better solution exists)
    if (e.target !== this) {
      $myTarget = $(this);
    } else {
      $myTarget = $(e.target);
    }
    var parsed = parseTrailElementData($myTarget);
    //console.log("parsed.trailheadID = " + parsed.trailheadID + " parsed.highlightedTrailIndex = " + parsed.highlightedTrailIndex);

    var trail = null;
    var trailhead = null;
    var trailIDs = [];
    var zoomFeatureGroup = null;
    var zoomArray = [];
    if (parsed.trailID) {
      trail = originalTrailData[parsed.trailID];
      trailIDs.push(parsed.trailID);
    }
    if (parsed.trailheadID) {
      trailhead = getTrailheadById(parsed.trailheadID);
      highlightTrailhead(parsed.trailheadID, parsed.highlightedTrailIndex);
      
      zoomArray = highlightedActivityMarkerArray;
      console.log("zoomArray = " + zoomArray);
      zoomArray.push(trailhead.marker);
      console.log("zoomArray = " + zoomArray);
      zoomFeatureGroup = new L.FeatureGroup(zoomArray);
      console.log("zoomFeatureGroup = " + zoomFeatureGroup);
      //showActivities(parsed.trailheadID); // show activities!
    }
    else {
      highlightTrailhead(null, parsed.highlightedTrailIndex, trailIDs);
      console.log("currentHighlightedSegmentLayer = " + currentHighlightedSegmentLayer);
      zoomFeatureGroup = currentHighlightedSegmentLayer;
    }
    console.log("zoomFeatureGroup= " + zoomFeatureGroup);
    map.fitBounds(zoomFeatureGroup.getBounds(), {
          //paddingTopLeft: centerOffset
    });
    console.log("[populateTrailsForTrailheadDiv] about to run showTrailDetails(trail, trailhead )" + trail + " trailhead= " + trailhead);
    showTrailDetails(trail, trailhead);
  }

  function populateTrailsForTrailheadTrailName(e) {
    console.log("populateTrailsForTrailheadTrailName");

    var $myTarget;
    if ($(e.target).data("trailheadid")) {
      $myTarget = $(e.target);
    } else {
      $myTarget = $(e.target.parentNode);
    }
    var parsed = parseTrailElementData($myTarget);
    var trailhead = getTrailheadById(parsed.trailheadID);
    // for (var i = 0; i < trailheads.length; i++) {
    //   if (trailheads[i].properties.id == parsed.trailheadID) {
    //     trailhead = trailheads[i];
    //   }
    // }
    // decorateDetailPanel(trailData[parsed.trailID], trailhead);
    
    var trail = originalTrailData[parsed.trailID];
    showTrailDetails(trail, trailhead);
    highlightTrailhead(parsed.trailheadID, parsed.highlightedTrailIndex);
  }

  function getTrailheadById(trailheadID) {
    var trailhead;
    for (var i = 0; i < originalTrailheads.length; i++) {
      if (originalTrailheads[i].properties.id == trailheadID) {
        trailhead = originalTrailheads[i];
        break;
      }
    }
    return trailhead;
  }

  function highlightTrailInPopup(trailhead, highlightedTrailIndex) {
    // add selected class to selected trail in trailhead popup, and remove it from others,
    // unless highlightedTrailIndex == -1, then just remove it everywhere
    var $trailheadPopupContent = $(trailhead.popupContent);

    $trailheadPopupContent.find(".trailhead-trailname").removeClass("selected").addClass("not-selected");
    if (highlightedTrailIndex != -1) {
      if (trailhead.trails) {
        var trailID = trailhead.trails[highlightedTrailIndex];
        var selector = '[data-trailid="' + trailID + '"]';
        var $trailnameItem = $trailheadPopupContent.find(selector);
        $trailnameItem.addClass("selected").removeClass("not-selected");
      }
    }
    trailhead.popupContent = $trailheadPopupContent.outerHTML();

    if ($('.detailPanel').is(":visible")) {
      // console.log("detail is open");
      // console.log($('.trailhead-trailname.selected'));
      $('.trailhead-trailname.selected').addClass("detail-open");
    }
  }

  // given a trailheadID and a trail index within that trailhead
  // display the trailhead marker and popup,
  // then call highlightTrailheadDivs() and getAllTrailPathsForTrailhead()
  // with the trailhead record

  var currentTrailheadMarker;

  function highlightTrailhead(trailheadID, highlightedTrailIndex, trailIDs) {
    console.log("highlightTrailhead");
    map.closePopup();
    highlightedTrailIndex = highlightedTrailIndex || 0;
    var trailhead = null;
    trailhead = getTrailheadById(trailheadID);
    // for (var i = 0; i < trailheads.length; i++) {
    //   if (trailheads[i].properties.id == trailheadID) {
    //     trailhead = trailheads[i];
    //     break;
    //   }
    // }

    if ($('.detailPanel').is(":visible")) {
      $('.trailhead-trailname.selected').removeClass("detail-open");
    }

    if (currentTrailhead && (map.getZoom() < SHOW_SIGN_ZOOM) ) {
      map.removeLayer(currentTrailhead.marker);
      currentTrailhead.marker = new L.CircleMarker(currentTrailhead.marker.getLatLng(), {
        color: "#D86930",
        fillOpacity: 0.5,
        opacity: 0.6,
        zIndexOffset: 100
      }).setRadius(MARKER_RADIUS).addTo(map);
      setTrailheadEventHandlers(currentTrailhead);
    }
    if ($('.detailPanel').is(":visible")) {
      $('.trailhead-trailname.selected').addClass("detail-open");
    }

    if (trailhead) {
      currentTrailhead = trailhead;

      map.removeLayer(currentTrailhead.marker);
      currentTrailhead.marker = new L.Marker(currentTrailhead.marker.getLatLng(), {
        icon: trailheadIcon2
      }).addTo(map);
      setTrailheadEventHandlers(currentTrailhead);
      highlightTrailInPopup(trailhead, highlightedTrailIndex);
      var popup = new L.Popup({
        offset: [0, -12],
        autoPanPadding: [10, 10],
        autoPan: SMALL ? false : true
      })
      .setContent(trailhead.popupContent)
      .setLatLng(trailhead.marker.getLatLng())
      .openOn(map);

    } else {
      currentTrailhead = null;
    }
    highlightTrailSegmentsForTrailhead(trailhead, highlightedTrailIndex, trailIDs);
    highlightActivities(trailheadID);
    //getAllTrailPathsForTrailhead(trailhead, highlightedTrailIndex, trailIDs);
    //groupArray.push(currentTrailhead.marker);
    //var trailheadFeatureGroup = L.featureGroup(groupArray);
    //getAllActivitiesForTrailhead(trailhead);
  }



  // For a given trailhead or set of trailIDs, change the style weight to active
  function highlightTrailSegmentsForTrailhead(trailhead, highlightedTrailIndex, trailIDs) {
    console.log("highlightTrailSegmentsForTrailhead");

    var zoomType = "trailhead";
    var trails = [];
    if (trailhead) {
      trails = trailhead.trails;
    } else if (trailIDs) {
      trails = trailIDs;
      zoomType = "trail";
    } else {
      zoomType = null;
    }
    //console.log("[getAllTrailPathsForTrailheadLocal] trails = " + trails);
    // allSegmentLayer.setStyle({weight: 0});

    if (currentHighlightedSegmentLayer) {
      currentHighlightedSegmentLayer.setStyle({weight: NORMAL_SEGMENT_WEIGHT});
      // currentHighlightedSegmentLayer.eachLayer(function (layer) {
      //   layer.setStyle({weight: NORMAL_SEGMENT_WEIGHT});
      // });

    }

    currentHighlightedSegmentLayer = null;
    
    if (trails) {
      currentHighlightedSegmentLayer = new L.FeatureGroup();
      allSegmentLayer.eachLayer(function (layer) {
        var layerTrailIds = layer.getLayers()[0].feature.properties.trail_ids || [];
        var layerTrailsLength = layerTrailIds.length || 0;
        var layerWanted = 0;
        if (layerTrailIds) {
          for (var layerTrailIndex = 0; layerTrailIndex < layerTrailsLength; layerTrailIndex++) {
            for (var i = 0; i < trails.length; i++) {
              var trailID = trails[i];
              if (layerTrailIds[layerTrailIndex] == trailID) {
                layerWanted = 1;
              } 
            }
          }
        }
        if (layerWanted) {
          layer.getLayers()[0].setStyle({weight: ACTIVE_TRAIL_WEIGHT});
          currentHighlightedSegmentLayer.addLayer(layer.getLayers()[0]);
          //layer.getLayers()[0].setStyle({weight: ACTIVE_TRAIL_WEIGHT});
          //layer.getLayers()[1].setStyle({weight: 20});
        }
      });
    }
  }

  // merge multiple geoJSON trail features into one geoJSON FeatureCollection

  function mergeResponses(responses) {

    console.log("mergeResponses");
    // console.log(responses);

    // var combined = { type: "FeatureCollection", features: [] };
    // for (var i = 0; i < responses.length; i++) {
    //   console.log("xxxx");
    //   console.log(responses[i]);
    //   // responses[i].properties.order = i;
    //   combined.features.push(responses[i]);
    // }


    var combined = $.extend(true, {}, responses[0]);
    if (combined.features) {
      combined.features[0].properties.order = 0;
      //console.log("combined.features = true");
      for (var i = 1; i < responses.length; i++) {
        //console.log("combined.features i = " + i);
        combined.features = combined.features.concat(responses[i].features);
        combined.features[i].properties.order = i;
        //console.log("combined.features[i].properties.trail_color= " + combined.features[i].properties.trail_colors);
      }
    } else {
      console.log("ERROR: missing segment data for trail.");
    }
    // console.log("----");
    // console.log(combined);
    return combined;
  }

  function checkSegmentsForTrailname(trailName, trailSource) {
    var segmentsExist = false;
    segmentsExist = trailName in segmentTrailnameCache || 'trailname + " Trail"' in segmentTrailnameCache;
    return segmentsExist;
  }

  // given a geoJSON set of linestring features,
  // draw them all on the map (in a single layer we can remove later)

  function drawMultiTrailLayer(response) {
    console.log("drawMultiTrailLayer");
    if (currentMultiTrailLayer) {
      console.log("[drawMultiTrailLayer] Remove currentMultiTrailLayer");
      map.removeLayer(currentMultiTrailLayer);
      currentTrailLayers = [];
    }
    //console.log("[drawMultiTrailLayer] response.features = " + response.features);
    // Add check to see if there are segment features
    if (response.features) {
      if (response.features.length > 0) {
        console.log("response.features count = " + response.features.length);
        currentMultiTrailLayer = L.geoJson(response, {
          style: function(feature) {
            //console.log(feature.properties.trail_names[0] + " " + feature.properties.trail_colors[0]);
            var thisColor = NORMAL_SEGMENT_COLOR;
            var thisWeight = ACTIVE_TRAIL_WEIGHT;
            var thisOpacity = 1;
            var thisClickable = false;
            var thisSmoothFactor = customSmoothFactor;
            var thisDash = "";
            //console.log("[visibleAllTrailLayer] secondary_trail_ids = " + feature.properties.secondary_trail_ids[0]);
            var thisSecondaryTrail = feature.properties.secondary_trail_ids[0];
            var thisTrailType = ""
            if (secondaryTrails[thisSecondaryTrail]) {
              thisTrailType = secondaryTrails[thisSecondaryTrail].properties.trail_type;
              if (secondaryTrails[thisSecondaryTrail].properties.length < 1) {
                thisWeight = NORMAL_SEGMENT_WEIGHT;
              }
            }
            switch (thisTrailType) {
              case 'unpaved': thisDash = "5,10"; break;
              case '': thisDash = "5,10"; break;
              case 'primitive': thisDash = "5,10"; break;
            }
            switch (feature.properties.trail_colors[0].toLowerCase()) {
                case 'red': thisColor = "#EE2D2F"; break;
                case 'orange': thisColor = "#F7941E"; break;
                case 'purple': thisColor = "#7F58A5"; break;
                case 'grey': thisColor = "#58595B"; break;
                case 'yellow': thisColor = "#FFF450"; break;
                case 'green': thisColor = "#006129"; break;
                case 'tan': thisColor = "#969161"; break;
                case 'olive': thisColor = "#969161"; break;
                case 'brown': thisColor = "#6C503F"; break;
                case 'blue': thisColor = "#26B8EB"; break;
                case 'black': thisColor = "#333132"; break;
            }
            return {dashArray: thisDash, color: thisColor, weight: thisWeight, opacity: thisOpacity, clickable: thisClickable, smoothFactor: thisSmoothFactor};
          },
            onEachFeature: function(feature, layer) {
              currentTrailLayers.push(layer);
            }
          });
          //.addTo(map);
          //.bringToFront();
          //zoomToLayer(currentMultiTrailLayer);
        }
    }
  }


  // return the calculated CSS background-color for the class given
  // This may need to be changed since AJW changed it to "border-color" above

  function getClassBackgroundColor(className) {
    var $t = $("<div class='" + className + "'>").hide().appendTo("body");
    var c = $t.css("background-color");
    console.log(c);
    $t.remove();
    return c;
  }

  // given the index of a trail within a trailhead,
  // highlight that trail on the map, and call zoomToLayer with it

  function setCurrentTrail(index) {
    console.log("setCurrentTrail");
    if (currentHighlightedTrailLayer && typeof currentHighlightedTrailLayer.setStyle == "Function") {
      currentHighlightedTrailLayer.setStyle({
        weight: NORMAL_SEGMENT_WEIGHT
      });
    }

    if (currentHighlightedTrailLayer) {
      console.log(currentHighlightedTrailLayer);
      // currentHighlightedTrailLayer.setStyle({
      //   weight: NORMAL_SEGMENT_WEIGHT
      // });
    }

    if (currentTrailLayers[index]) {
      currentHighlightedTrailLayer = currentTrailLayers[index];
      currentHighlightedTrailLayer.setStyle({
        weight: ACTIVE_TRAIL_WEIGHT
      });
      currentHighlightedTrailLayer.bringToFront();
    } else {
      console.log("ERROR: trail layer missing");
      console.log(currentTrailLayers);
      console.log(index);
    }
    console.log("setCurrentTrail end");
  }

  // given a leaflet layer, zoom to fit its bounding box, up to MAX_ZOOM
  // in and MIN_ZOOM out (commented out for now)

  function zoomToLayer(layer) {
    console.log("zoomToLayer");
    // figure out what zoom is required to display the entire trail layer
    var layerBoundsZoom = map.getBoundsZoom(layer.getBounds());
    var currentZoom = map.getZoom();
    console.log("zoomToLayer - currentZoom = " + currentZoom);
    console.log("zoomToLayer - layerBoundsZoom = " + layerBoundsZoom);
    // console.log(layer.getLayers().length);

    // var layerBoundsZoom = map.getZoom();
    // console.log(["layerBoundsZoom:", layerBoundsZoom]);
    if (currentZoom < layerBoundsZoom) {
      // if the entire trail layer will fit in a reasonable zoom full-screen,
      // use fitBounds to place the entire layer onscreen
      //if (!SMALL && layerBoundsZoom <= MAX_ZOOM && layerBoundsZoom >= MIN_ZOOM) {
        console.log("zoomToLayer currentZoom < layerBoundsZoom");
        map.fitBounds(layer.getBounds(), {
          //paddingTopLeft: centerOffset
        });
    }

      // otherwise, center on trailhead, with offset, and use MAX_ZOOM or MIN_ZOOM
      // with setView
    else {
      var boundsCenter = layer.getBounds().getCenter();
      // map.panInsideBounds(layer.getBounds(), {
      //     paddingTopLeft: centerOffset
      // });
      
        // var newZoom = layerBoundsZoom > MAX_ZOOM ? MAX_ZOOM : layerBoundsZoom;
        // newZoom = newZoom < MIN_ZOOM ? MIN_ZOOM : newZoom;
        // // setTimeout(function() {
        //var originalLatLng = currentTrailhead.marker.getLatLng();
        //   var projected = map.project(originalLatLng, newZoom);
        //   var offsetProjected = projected.subtract(centerOffset.divideBy(2));
        //   var newLatLng = map.unproject(offsetProjected, newZoom);
        map.setView(boundsCenter, currentZoom);
        // }, 0);
      //}
    }
    console.log("zoomToLayer end");
  }

  function zoomToCurrentTrailhead() {
    console.log("zoomToTrailhead");
    // figure out what zoom is required to display the entire trail layer
    var layerBoundsZoom = 15;
    var currentZoom = map.getZoom();
    var newZoom = layerBoundsZoom;
    //var newLatLng = currentTrailhead.marker.getLatLng();

    var originalLatLng = currentTrailhead.marker.getLatLng();
    var projected = map.project(originalLatLng, newZoom);
    var offsetProjected = projected.subtract(centerOffset.divideBy(2));
    var newLatLng = map.unproject(offsetProjected, newZoom);

    console.log("zoomToLayer - currentZoom = " + currentZoom);
    console.log("zoomToLayer - layerBoundsZoom = " + layerBoundsZoom);

    if (!SMALL && layerBoundsZoom <= MAX_ZOOM && layerBoundsZoom >= MIN_ZOOM) {

    }
    if ( currentZoom < newZoom ) {
      map.setView(newLatLng, newZoom);
    } 
    else {
      map.setView(originalLatLng, currentZoom);
    }
    

    console.log("zoomToTrailhead end");

  }

  function makeAPICall(callData, doneCallback) {
    console.log('makeAPICall: ' + callData.path);
    if (!($.isEmptyObject(callData.data))) {
      callData.data = JSON.stringify(callData.data);
    }
    var url = API_HOST + callData.path;
    var request = $.ajax({
      type: callData.type,
      url: url,
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      //beforeSend: function(xhr) {
      //  xhr.setRequestHeader("Accept", "application/json")
      //},
      data: callData.data
    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.log("error! " + errorThrown + " " + textStatus);
      console.log(jqXHR.status);
      $("#results").text("error: " + JSON.stringify(errorThrown));
    }).done(function(response, textStatus, jqXHR) {
      if (typeof doneCallback === 'function') {
        console.log("calling doneCallback: " + callData.path);
        doneCallback.call(this, response);
      }
    });
  }

  // get the outerHTML for a jQuery element

  jQuery.fn.outerHTML = function(s) {
    return s ? this.before(s).remove() : jQuery("<p>").append(this.eq(0).clone()).html();
  };


}
