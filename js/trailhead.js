var console = console || {
  "log": function() {}
};
console.log("start");

$(document).ready(startup);

// This function is used to set the max heights for PreserveInfo & SearchResults.
// It is called on body load and resize. It is also called when opening Detail panel.
function setHeights() {
      var h = $(window).height();
      var k = $("#fpccBrand").outerHeight();
      var m = $("#fpccPreserveName").outerHeight();
      var o = $("#fpccSearchBack").outerHeight();
      var q = $("#fpccSearchContainer").outerHeight();
      $('#fpccPreserveInfo').css('max-height', (h-(k + m + o + q)) );
      $('#fpccSearchResults').css('max-height', (h-(k + o + q)) );
}

/* The Big Nested Function
==========================*/

// Print to ensure file is loaded

function startup() {
  "use strict";

  console.log("trailhead.js");

  // $(".js-example-basic-multiple").select2({
  //   placeholder: "Search by Location or Activity",
  //   tags: true,
  //   tokenSeparators: [','],
  //   allowClear: true
  // });

  var $select = $(".js-example-basic-multiple").selectize({
    placeholder: "Search by Location or Activity",
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
    onChange: function() {
      setTimeout(function() {
        console.log("[selectize] onItemRemove trigger");
        this.blur();
        this.close();
      }.bind(this), 200)
    }
  });

  $('#logo-link a').attr("href", window.location.origin);

  var SMALL = false;
  if (Modernizr.mq("only screen and (max-width: 768px)")) {
    SMALL = true;
  } else if (Modernizr.mq("only screen and (min-width: 769px)")) {
    SMALL = false;
  }

  var TOUCH = $('html').hasClass('touch');
 
  var MAPBOX_MAP_ID = "mapbox.streets";
  var MAPCENTERPOINT = {
    lat: 42.0723,
    lng: -87.87
  };



  // API_HOST: The API server.
  var API_HOST = "http://fpcc-staging.smartchicagoapps.org";
 
  if (window.location.hostname.split(".")[0] == "localhost") {
    document.title = "LOCALHOST | Cook County Trailsy";
  } else if (window.location.hostname.split(".")[0] == "fpcc-staging") {
    document.title = "STAGING | Cook County Trailsy";
  } else if (window.location.hostname.split(".")[0] = "smartchicago") {
    document.title = "gh-pages | Cook County Forest Preserves";
    API_HOST = "http://fpcc-staging.smartchicagoapps.org";
  } else if (window.location.hostname.split(".")[0] = "fpcc") {
    document.title = "Cook County Forest Preserves";
    API_HOST = "http://fpcc.smartchicagoapps.org";
  } 
  //API_HOST = "http://localhost:8080";
  console.log("API_HOST = " + API_HOST);
  //API_HOST = "http://fpcc-staging.smartchicagoapps.org/json"

  //  Near-Global Variables
  var METERSTOMILESFACTOR = 0.00062137;
  var MAX_ZOOM = SMALL ? 16 : 17;
  var MIN_ZOOM = SMALL ? 13 : 14;
  var SECONDARY_TRAIL_ZOOM = 12;
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
  var oms;
  // var mapDivName = SMALL ? "trailMapSmall" : "trailMapLarge";
  var mapDivName = "trailMapLarge";
  var CLOSED = false;
  var customSmoothFactor = SMALL ? 1.5 : 1.0;

  var originalTrailData = {}; // all of the trails metadata (from traildata table), with trail ID as key
  // for yes/no features, check for first letter "y" or "n".

  var originalTrailheads = []; // all trailheads (from trailsegments)
  
  var currentTrailheads = [];
  var currentUserLocation = {};
  var anchorLocation = {};

  var currentFilters = {
    lengthFilter: [],
    activityFilter: [],
    searchFilter: "",
    location: null,
    zipMuniFilter: ""

  };
  var lastFilters = {};
  var orderedTrails = [];
  var currentDetailTrail = null;
  var currentDetailTrailhead = null;
  var userMarker = null;

  // Segment Variables
  var allSegmentLayer = null; // All the segments (both invisible and visible)
  var currentHighlightedSegmentLayer = null; // Segment that is highlighted.

  // Activity Variables
  var originalActivities = {};
  var highlightedActivityMarkerArray = [];
  
  var lastZoom = null;
  var closeTimeout = null;
  var openTimeout = null;
  var currentWeightedSegment = null;
  var currentTrailPopup = null;
  var currentTrailhead = null;
  var orderedTrailIndex = 0;
  var geoWatchId = null;
  var currentTrailheadHover = null;
  var geoSetupDone = false;
  
  var currentTrailData;
  var searchKeyTimeout = null;
  var trailheadsFetched = false;
  var traildataFetched = false;
  var trailsegmentsFetched = false;
  var activitiesFetched = false;
  var allDataFetched = false;
  
  var secondaryTrails = {};

  // Search variables
  var searchZipcode = null;
  var searchLocation = null;
  // var zipCodeLocations = {
  //   60625: [41.971614, -87.70256],
  //   60004: [42.108428, -87.97723],
  //   60005: [42.069327, -87.98464],
  //   60006: [41.811929, -87.68732],
  //   60007: [42.005978, -87.99847],
  //   60008: [42.07506, -88.02508],
  //   60009: [41.811929, -87.68732],
  //   60016: [42.047178, -87.89058],
  //   60017: [42.028779, -87.894366],
  //   60018: [42.008429, -87.89234],
  //   60019: [42.024278, -87.907066],
  //   60022: [42.130976, -87.76252],
  //   60025: [42.07672, -87.81922],
  //   60026: [42.09166, -87.837363],
  //   60029: [42.056529, -87.79286],
  //   60038: [42.097976, -88.014072],
  //   60043: [42.088128, -87.716],
  //   60053: [42.041999, -87.78882],
  //   60055: [42.097976, -88.014072],
  //   60056: [42.065427, -87.93621],
  //   60062: [42.124576, -87.84303],
  //   60065: [41.811929, -87.68732],
  //   60067: [42.10979, -88.04917],
  //   60068: [42.01183, -87.84158],
  //   60070: [42.105576, -87.92816],
  //   60074: [42.143819, -88.02546],
  //   60076: [42.03618, -87.7321],
  //   60077: [42.033313, -87.75764]
  // };
  var zipCodeLocations = {};
  $.getJSON("json/search_zip.json", function(result){
    zipCodeLocations = result;
    console.log("[getJSON zipCodeLocations] done at " + new Date().getTime());
  });

  // var muniLocations = {
  //   "des plaines" : [42.03618, -87.7321]
  // };
  var muniLocations = {};
  $.getJSON("json/search_muni.json", function(result){
    muniLocations = result;
    console.log("[getJSON muniLocations] done at " + new Date().getTime());
  });
  

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

  var trailheadIcon2 = L.divIcon({
    className: 'icon-sign icon-map',
    html: '<svg class="icon icon-map icon-sign"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>',
    iconAnchor: [13 * 0.60, 33 * 0.60],
    popupAnchor: [0, -3],
    iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
  });
 
  // =====================================================================//
  // UI events to react to

  // $("#redoSearch").click(reorderTrailsWithNewLocation);

  $('.closeDetail').click(closeDetailPanel); // Close the detail panel!
  $('#fpccSearchBack').click(closeDetailPanel);
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

  $(".fpccMenu").click(changeMenuDisplay);

  //  Shouldn't the UI event of a Map Callout click opening the detail panel go here?

  //if mobile, we expand 2 of the sidebar sections
  if(SMALL){
    $(".trigger1").addClass("active");
    $(".trigger3").addClass("active");
  }



  $.address.autoUpdate(0);
  //$.address.crawlable(1);
  $.address.externalChange(function(event) {  
    // do something depending on the event.value property, e.g.  
    console.log("internalChange event = " + event.parameters);
    //console.log("hash = " + $.address.hash()  );
    //console.log("queryString = " + $.address.queryString()  );

    // var searchFilter = decodeURIComponent($.address.parameter('search'));
    // var entrance  = decodeURIComponent($.address.parameter('entrance'));
    // var trail  = decodeURIComponent($.address.parameter('trail'));
    // console.log("[address.change] searchFilter = " + searchFilter);
    // console.log("[address.change] entrance = " + entrance);
    // console.log("[address.change] trail = " + trail);
    waitForAllData();
    //$('.filter').load(event.value + '.xml');  
  });  

  var activeTrailheadsMapped = false;
  var makeTrailDivsEnded = false;
  function waitForAllData() {
    // console.log("waitForAllTrailData");
    console.log("[waitForAllData] active + make: " + activeTrailheadsMapped + makeTrailDivsEnded);
    if (activeTrailheadsMapped && makeTrailDivsEnded) {
      addressChange();
    }
    else {
      setTimeout(waitForAllData, 100);
    }
  }

  function addressChange() {
    //var searchFilter = $.address.parameter('search');
    
    var searchFilter = decodeURIComponent($.address.parameter('search'));
    var poi  = decodeURIComponent($.address.parameter('poi'));
    var trail  = decodeURIComponent($.address.parameter('trail'));
    console.log("[address.change] searchFilter = " + searchFilter);
    console.log("[address.change] poi = " + poi);
    console.log("[address.change] trail = " + trail);
    if (searchFilter == 'undefined' || searchFilter == 'null') {
      searchFilter = "";
    }
    if (poi == 'undefined' || poi == 'null') {
      poi = "";
    }
    if (trail == 'undefined' || trail == 'null') {
      trail = "";
    }
    console.log("[addressChange] searchFilter = " + searchFilter);
    //if (searchFilter != searchFilterLast) {
    // setTimeout(function() {
    //   updateFilterObject("activityFilter", searchFilter);
    //   //}
    if (poi) {
      var poiID = poi.split("-")[0];
      trailDivWork(null, poiID);
    } else if (trail) {
      var trailSystem = trail;
      trailDivWork(trail, null);
    }

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
    openResultsList();
    setupGeolocation(function() {
      if (geoSetupDone) {
        return;
      }
      fetchTrailheads(currentUserLocation, function() { trailheadsFetched = true; });
      fetchTraildata(function() { traildataFetched = true; });
      fetchActivities(function() { activitiesFetched = true; });
      fetchTrailsegments(function() { trailsegmentsFetched = true; });
      
      if (USE_LOCAL) {
        
       //setTimeout(waitForDataAndSegments, 0);
        setTimeout(waitForAllTrailData, 0);
        //setTimeout(waitForTrailSegments, 0);
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
    if (traildataFetched && trailsegmentsFetched && trailheadsFetched && activitiesFetched) {
      allDataFetched = true;
      addTrailsToTrailheads(originalTrailData, originalTrailheads);

      // if we haven't added the segment layer yet, add it.
      // if (map.getZoom() >= SECONDARY_TRAIL_ZOOM && !(map.hasLayer(allSegmentLayer))) {
        
      // }
    }
    else {
      setTimeout(waitForAllTrailData, 100);
    }
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

    var tagsToIncludeTrailsPanel = ["bike_rental"]
    
    lastFilters =  $.extend(true, {}, currentFilters);
    console.log("[updateFilterObject] lastFilters.activityFilter = " + lastFilters.activityFilter);
        
    if (filterType == "activityFilter") {
      console.log("[updateFilterObject] activityFilter");
      var activityFilterLength = currentFilters.activityFilter.length;
      console.log("[updateFilterObject] old activityFilterLength = " + activityFilterLength);
      console.log("[updateFilterObject] old currentFilters.activityFilter = " + currentFilters.activityFilter);
      console.log("[updateFilterObject] old currentFilters.location = " + currentFilters.location);
      currentFilters.activityFilter = [];
      currentFilters.location = null;
      currentFilters.zipMuniFilter = "";
      console.log("[updateFilterObject] lastZipMuni, currentZipMuni = " + lastFilters.zipMuniFilter + ", " + currentFilters.zipMuniFilter );
      if (currentUIFilterState) {   
        console.log("[updateFilterObject] in currentUIFilterState if statement");
        currentFilters.activityFilter = String(currentUIFilterState).split(",");
        console.log("[updateFilterObject] new currentFilters.activityFilter.length + activityFilter= " + currentFilters.activityFilter.length + " - " + currentFilters.activityFilter);
        var removeIndex = null;
        currentFilters.activityFilter.forEach(function(value, index) {
          var normalizedValue = value.toLowerCase();
          if (!(zipCodeLocations[normalizedValue] === undefined)) {
            console.log("[updateFilterObject] zip lat,lon = " + zipCodeLocations[normalizedValue]['latitude'] + ", " + zipCodeLocations[value]['longitude'] );
            currentFilters.location = new L.LatLng(zipCodeLocations[normalizedValue]['latitude'], zipCodeLocations[value]['longitude']);
            currentFilters.zipMuniFilter = normalizedValue;
            removeIndex = index;
          } else if (!(muniLocations[normalizedValue] === undefined)) {
            currentFilters.location = new L.LatLng(muniLocations[normalizedValue]['latitude'], muniLocations[value]['longitude']);
            currentFilters.zipMuniFilter = normalizedValue;
            console.log("[updateFilterObject] muni loc, zipMuniFilter= " + currentFilters.location + ", " + currentFilters.zipMuniFilter);
            removeIndex = index;  
          }
        });
        console.log("[updateFilterObject] removeIndex = " + removeIndex);
        if (!(removeIndex === null)) {
          console.log("[updateFilterObject] in the remove index if statement");
          currentFilters.activityFilter.splice(removeIndex, 1);
        }
        console.log("[updateFilterObject] NEW currentFilters.activityFilter = " + currentFilters.activityFilter);
        console.log("[updateFilterObject] NEW currentFilters.zipMuniFilter = " + currentFilters.zipMuniFilter);
      } else {
        currentFilters.activityFilter = [];
        currentFilters.location = null;
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
    //console.log(currentFilters);

    // Remove blank and null activityFilter elements:
    currentFilters.activityFilter = currentFilters.activityFilter.filter(Boolean);
    console.log("[updateFilterObject] lastFilters.activityFilter.length = " + lastFilters.activityFilter.length);
    console.log("[updateFilterObject] currentFilters.activityFilter.length = " + currentFilters.activityFilter.length);

    var is_same = (currentFilters.activityFilter.length == lastFilters.activityFilter.length) && currentFilters.activityFilter.every(function(element, index) {
        return element === lastFilters.activityFilter[index]; 
    });
    console.log("[updateFilterObject] is_same= " + is_same);
    if (is_same) {
      console.log("[updateFilterObject] activityFilter is same");
      makeTrailDivs(currentTrailheads);
      console.log("[updateFilterObject] currentFilters.location = " + currentFilters.location);
      if (currentFilters.location) {
        console.log("[updateFilterObject] IN IF = " + currentFilters.location);

        // This zoom level is arbitrary. Need to figure out best option
        map.setView(currentFilters.location, 14);

      }
      

    } else {
      applyFilterChange(currentFilters);
    }
  }

  
  function filterResults(trail, trailhead) {
    var matched = 1;
    var term = 1;
    //console.log("[filterResults] initial matched = " + matched);
    if (currentFilters.activityFilter) {
      //console.log("[filterResults] currentFilters.activityFilter exists.." + currentFilters.activityFilter.length);
      for (var i = 0; i < currentFilters.activityFilter.length; i++) {
        var activity = currentFilters.activityFilter[i];
        //console.log("[filterResults] activityFilter = " + activity);
        //console.log("trailhead.properties[activity] = " + trailhead.properties[activity]);
        var trailheadActivity = 0;
        var trailheadTag = 0;
        term = 0;
        // var a = trailhead.properties.tags.indexOf(activity);
        // console.log("filterResults a = " + a);
        // if (a != -1) {
        //   searchMatched = 1;
        // }
        var normalizedTrailName = "";
        var normalizedTrailDescription = "";
        if (trail) {
          normalizedTrailName = trail.properties.name.toLowerCase();
          if (trail.properties.description) {
            normalizedTrailDescription = trail.properties.description.toLowerCase();
          }
        }
        var normalizedTrailheadName = trailhead.properties.name.toLowerCase();
        var normalizedTrailheadDescription = "";
        if (trailhead.properties.description) {
          normalizedTrailheadDescription = trailhead.properties.description.toLowerCase();
        }
        var normalizedTrailheadAddress = "";
        if (trailhead.properties.address) {
          normalizedTrailheadAddress = trailhead.properties.address.toLowerCase();
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
        var nameTrailMatched = !! normalizedTrailName.match(searchRegex);
        var nameTrailheadMatched = !! normalizedTrailheadName.match(searchRegex);
        var addressTrailheadMatched = !! normalizedTrailheadAddress.match(searchRegex);

        if ( (nameTrailMatched || nameTrailheadMatched ) ) {
          term = 10;
        } else if ((!! normalizedTrailDescription.match(searchRegex)) || (!! normalizedTrailheadDescription.match(searchRegex))) {
          term = 1;
        // } else if (!(trailhead.properties[activity] === undefined)) {
        //   term = trailhead.properties[activity];
        } else if (trailhead.properties.tags.indexOf(activity) > -1 ) {
          term = 1;
        } else if ((!! normalizedTrailheadAddress.match(searchRegex))) {
          term = 1;
        }
        matched = matched * term;
      }
      
    }
    
    //console.log("[filterResults] matched = " + matched);
    return matched;
  }

  // function filterResults(trail, trailhead) {
  //   var wanted = 0;
  //   var lengthMatched = false;
  //   var activityMatched = 1;
  //   var searchMatched = 0;
  //   var tagMatched = 1;
  //   if (currentFilters.activityFilter) {
  //     for (var i = 0; i < currentFilters.activityFilter.length; i++) {
  //       var activity = currentFilters.activityFilter[i];
  //       //console.log("trailhead.properties[activity] = " + trailhead.properties[activity]);
  //       var trailheadActivity = 0;
  //       var trailheadTag = 0;
  //       var a = trailhead.properties.tags.indexOf(activity);
  //       console.log("filterResults a = " + a);
  //       if (a != -1) {
  //         searchMatched = 1;
  //       }
  //       // if (!(trailhead.properties[activity] === undefined)) {
  //       //   trailheadActivity = trailhead.properties[activity];
  //       // }
  //       else {
  //         // var a = trailhead.properties.tags.indexOf(activity);
  //         // if (a != -1) {
  //         //   trailheadTag = 0;
  //         // }
  //         //console.log("searchfilter is not null = " + currentFilters.activityFilter[i]);
  //         searchMatched = 0;
  //         var normalizedTrailName = "";
  //         var normalizedDescription = null;
  //         if (trail) {
  //           normalizedTrailName = trail.properties.name.toLowerCase();
  //           normalizedDescription = trail.properties.description.toLowerCase();
  //           //console.log("normalizedTrailName= " + normalizedTrailName);
  //         }
  //         var normalizedSearchFilter = currentFilters.activityFilter[i].toLowerCase();
  //         var equivalentWords = [
  //           [" and ", " & "],
  //           ["tow path", "towpath"]
  //         ];
  //         $.each(equivalentWords, function(i, el) {
  //           var regexToken = "(" + el[0] + "|" + el[1] + ")";
  //           normalizedSearchFilter = normalizedSearchFilter.replace(el[0], regexToken);
  //           normalizedSearchFilter = normalizedSearchFilter.replace(el[1], regexToken);
  //         });
  //         var searchRegex = new RegExp(normalizedSearchFilter);
  //         var nameMatched = !! normalizedTrailName.match(searchRegex);

  //         var descriptionMatched;
  //         if (normalizedDescription === null) {
  //           descriptionMatched = false;
  //         } else {
  //           descriptionMatched = !! normalizedDescription.match(searchRegex);
  //         }

  //         var trailheadNameMatched;
  //         var normalizedTrailheadName = trailhead.properties.name.toLowerCase();
  //         trailheadNameMatched = !! normalizedTrailheadName.match(searchRegex);

  //         var parkNameMatched;
  //         if (trailhead.properties.park === null) {
  //           parkNameMatched = false;
  //         }
  //         else {
  //           var normalizedParkName = trailhead.properties.park.toLowerCase();
  //           parkNameMatched = !! normalizedParkName.match(searchRegex);
  //         }

  //         var addressMatched;
  //         if (trailhead.properties.address === null) {
  //           addressMatched = false;
  //         }
  //         else {
  //           var normalizedAddress = trailhead.properties.address.toLowerCase();
  //           addressMatched = !! normalizedAddress.match(searchRegex);
  //         }

  //         if ((descriptionMatched || parkNameMatched || addressMatched)) {
  //           searchMatched = 1;
  //         } 
  //         if ( (nameMatched || trailheadNameMatched ) ) {
  //           searchMatched = 10;
  //         }
          
  //       }

  //       if (!trailheadActivity) {
  //         activityMatched = 0;
  //       }
  //     }
  //   }
    
   

  //   if (activityMatched) {
  //     wanted = searchMatched;
  //   }
  //   else {
  //     wanted = 0;
  //   }
  //   return wanted;
  // }

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
      var offsetUserLatLng = map.containerPointToLatLng(offsetUserLocation);
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

    //oms = new OverlappingMarkerSpiderfier(map, {keepSpiderfied: true});

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
        if (zoomLevel >= SECONDARY_TRAIL_ZOOM && !(map.hasLayer(allSegmentLayer))) {
          // console.log(allSegmentLayer);
          setTimeout(function() {
           // map.addLayer(allSegmentLayer);
            //allSegmentLayer.bringToBack();
          }, 0);

        }
        if (zoomLevel < SECONDARY_TRAIL_ZOOM && map.hasLayer(allSegmentLayer)) {
          if (currentTrailPopup) {
            map.removeLayer(currentTrailPopup);
          }
          //map.removeLayer(allSegmentLayer);
        }
      }
    
      var currentTrailheadDivs = document.getElementsByClassName("icon-map icon-sign");
      console.log("change zoom currentTrailheadDivs.length = " + currentTrailheadDivs.length);
      for (var i = 0; i < currentTrailheadDivs.length; i++) {
        currentTrailheadDivs[i].classList.remove('icon-' + lastZoom);
        currentTrailheadDivs[i].classList.add('icon-' + zoomLevel);
      }
      
      var currentActivityDivs = document.getElementsByClassName("icon-map icon-activity" );
      console.log("change zoom currentActivityDivs.length = " + currentActivityDivs.length);
      for (var i = 0; i < currentActivityDivs.length; i++) {
        currentActivityDivs[i].classList.remove('icon-' + lastZoom);
        currentActivityDivs[i].classList.add('icon-' + zoomLevel);
      }
      lastZoom = zoomLevel;
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
    var originalActivityFeatureGroup = new L.FeatureGroup();
    originalActivityFeatureGroup.addTo(map);

    for (var i = 0; i < ActivityDataGeoJSON.features.length; i++) {
      var currentFeature = ActivityDataGeoJSON.features[i];
      var currentFeatureLatLng = new L.LatLng(currentFeature.geometry.coordinates[1], currentFeature.geometry.coordinates[0]);
      var iconType = null;
      var activityType = currentFeature.properties.activity_type;
      var activityName = currentFeature.properties.name || activityType;
      var popupContentMainDivHTML = "<div class='activity-popup'>";
      popupContentMainDivHTML += activityName;
      if (activityType == "trailhead") {
        popupContentMainDivHTML += " Trail Access";
      }
      popupContentMainDivHTML += "</div>";
      var iconName = "";
      if (activityType == "Fishing Lake") {
        iconType = "icon-fishing";
      } else if (activityType == "aquatic center") {
        iconType = "icon-aquatic-center";
        iconName = activityName;
      //} else if (activityType == "bicycle lot") {
      //  iconType = "icon-bicycling";
      } else if (activityType == "bicycle rental") {
        iconType = "icon-bike-rental";
      //} else if (activityType == "birding hotspot") {
      //  iconType = "icon-birding-hotspot";
      } else if (activityType == "boating center") {
        iconType = "icon-boat-rental";
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
        iconType = "icon-facility";
      //} else if (activityType == "equestrian parking") {
      //  iconType = "icon-equestrian";
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
      //} else if  (activityType == "scenic") {
      //  iconType = "icon-scenic-overlook";
      } else if  (activityType == "sledding") {
        iconType = "icon-sledding";
      } else if  (activityType == "snowmobiling") {
        iconType = "icon-snowmobiling";
      } else if  (activityType == "special activity") {
        iconType = "icon-facility";
      } else if (activityType == "trailhead") {
        iconType = "icon-trail-marker";
      } else if (activityType == "volunteer center") {
        iconType = "icon-volunteer";
      } else if (activityType == "warming shelter") {
        iconType = "icon-facility";
      } else if (activityType == "welcome shelter") {
        iconType = "icon-facility";
      } else if (activityType == "zipline") {
        iconType = "icon-zip-line";
      } 

      var activityIcon = L.divIcon({
        className: 'icon-map icon-activity activity-' + currentFeature.properties.id + ' ' + iconType,
        html: '<svg class="icon icon-map icon-activity ' + iconType + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconType + '"></use></svg><br />' + iconName,
        iconAnchor: [13 * 0.60, 33 * 0.60],
        popupAnchor: [0, -20],
        iconSize: null
      });

      var newMarker = null;

      if (iconType) {
        newMarker = new L.Marker(currentFeatureLatLng, {
          icon: activityIcon,
        });
      
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
        originalActivityFeatureGroup.addLayer(activity.marker);
      }
    } 
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
    var lastTrailheadId = "";
    if (currentTrailhead) {
      lastTrailheadId = currentTrailhead.id;
    }
    console.log("lastTrailheadId = " + lastTrailheadId);
    var trailhead = getTrailheadById(activity.properties.trailhead_id);
    
    if (trailhead) {
      showTrailDetails(null, trailhead);
      if ( lastTrailheadId != activity.properties.trailhead_id ) {
        highlightTrailhead(activity.properties.trailhead_id);
        highlightActivities(activity.properties.trailhead_id);
        var trailSystem = null;
        if (trailhead.properties.trail_systems.length > 0) {
          trailSystem = trailhead.properties.trail_systems[0];
        }
        highlightTrailSegmentsForTrailSystem(trailSystem);
        var zoomArray = highlightedActivityMarkerArray.slice(0);
        console.log("zoomArray = " + zoomArray);
        zoomArray.push(trailhead.marker);
        console.log("zoomArray = " + zoomArray);
        var zoomFeatureGroup = new L.FeatureGroup(zoomArray);
        var zoomFeatureGroupBounds = zoomFeatureGroup.getBounds();
        map.fitBounds(zoomFeatureGroupBounds,{
           maxZoom: map.getZoom(),
           paddingTopLeft: centerOffset
        })  
      }
    }
  }
 

  // given the fetchTrailheads response, a geoJSON collection of trailheads ordered by distance,
  // populate trailheads[] with the each trailhead's stored properties, a Leaflet marker,
  // and a place to put the trails for that trailhead.

  function populateOriginalTrailheads(trailheadsGeoJSON, location) {
    console.log("populateOriginalTrailheads");
    originalTrailheads = [];
    var originalTrailheadFeatureGroup = new L.FeatureGroup();
    originalTrailheadFeatureGroup.addTo(map);
    for (var i = 0; i < trailheadsGeoJSON.features.length; i++) {
      var currentFeature = trailheadsGeoJSON.features[i];
      var otLength = originalTrailheads.length;
      var currentGeoOne = currentFeature.geometry.coordinates[1];
      var currentGeoTwo = currentFeature.geometry.coordinates[0];
      for (var otnum = 0; otnum < otLength; otnum++) {
        //console.log("[populateOriginalTrailheads] originalTrailheads[otnum].geometry = " + originalTrailheads[otnum].geometry);
        //console.log("[populateOriginalTrailheads] currentFeature.geometry = " + currentFeature.geometry);
        var otGeoOne = originalTrailheads[otnum].geometry.coordinates[1];
        var otGeoTwo = originalTrailheads[otnum].geometry.coordinates[0];
        if ( (currentGeoOne == otGeoOne) && (currentGeoTwo == otGeoTwo) ) {
          console.log("[populateOriginalTrailheads] GEOMETRIES MATCH: current & originalTrailheads- " + currentFeature.properties.id + " and " + originalTrailheads[otnum].properties.id);
          console.log("[populateOriginalTrailheads] GEOMETRIES MATCH: current & originalTrailheads- " + currentFeature.properties.name + " and " + originalTrailheads[otnum].properties.name);
          console.log("[populateOriginalTrailheads] currentFeature.geometry = " + currentFeature.geometry.coordinates);
          console.log("[populateOriginalTrailheads] originalTrailheads[otnum].geometry = " + originalTrailheads[otnum].geometry.coordinates);
          currentGeoTwo += .0002;
          otGeoTwo -= .0002;
          var newOtLatLng = new L.LatLng(otGeoOne, otGeoTwo);
          originalTrailheads[otnum].marker.setLatLng(newOtLatLng);
          originalTrailheads[otnum].signMarker.setLatLng(newOtLatLng);
          originalTrailheads[otnum].geometry.coordinates[0] = otGeoTwo;
          break;
        }
      }
      var currentFeatureLatLng = new L.LatLng(currentGeoOne, currentGeoTwo);   
      var newMarker = new L.CircleMarker(currentFeatureLatLng, {
        color: "#D86930",
        fillOpacity: 0.5,
        opacity: 0.8,
        className: 'circleTest'
      }).setRadius(MARKER_RADIUS);
      var trailheadIcon2 = L.divIcon({
        className: 'icon-sign icon-map entrance-' + currentFeature.properties.id,
        html: '<svg class="icon icon-map icon-sign" id="entrance-' + currentFeature.properties.id + '" ><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>',
        // iconAnchor: [13 * 0.60, 33 * 0.60],
        iconAnchor: [15,20],
        popupAnchor: [0, 0],
        iconSize: null
        // iconSize: [52 * 0.60, 66 * 0.60] // size of the icon
      });
      var signMarker = new L.Marker(currentFeatureLatLng, {
        icon: trailheadIcon2
      });
      signMarker.trailheadID = currentFeature.properties.id;
      //console.log("signMarker.trailheadID = " + signMarker.trailheadID);
      var trailhead = {
        properties: currentFeature.properties,
        geometry: currentFeature.geometry,
        marker: newMarker,
        signMarker: signMarker,
        trails: currentFeature.properties.trail_ids,
        popupContent: ""
      };

      // Add alternative tags for trailhead amenities
      var tagList = [];
      if ((trailhead.properties["bike_rental"] === 1)) {
        tagList = tagList.concat(["bike_rental","bicycle rental", "bike rental"]);
      }
      if ((trailhead.properties["cycling"] === 1)) {
        tagList = tagList.concat(["cycling","biking", "bicycle", "bike", "mtb", "mountain"]);
      }
      if ((trailhead.properties["birding"] === 1)) {
        tagList = tagList.concat(["birding","birdwatching", "bird"]);
      }
      if ((trailhead.properties["boat_rental"] === 1) || (trailhead.properties["canoe"] === 1) || (trailhead.properties["boat_ramp"] === 1)) {
        tagList = tagList.concat(["boat_rental","boat rental", "canoe", "boat_ramp", "boat ramp", "canoe rental", "kayak rental", "boating center", "canoeing", "kayaking", "boating", "kayak", "boat"]);
      }
      if ((trailhead.properties["camping"] === 1)) {
        tagList = tagList.concat(["camping","camp", "campground"]);
      }
      if ((trailhead.properties["cross_country"] === 1)) {
        tagList = tagList.concat(["cross_country","cross country", "ski"]);
      }
      if ((trailhead.properties["disc_golf"] === 1)) {
        tagList = tagList.concat(["disc_golf","disc golf", "frisbee"]);
      }
      if ((trailhead.properties["dog_friendly"] === 1)) {
        tagList = tagList.concat(["dog_friendly","dog friendly", "off-leash", "dog"]);
      }
      if ((trailhead.properties["dog_leash"] === 1)) {
        tagList = tagList.concat(["dog_leash","dog leash", "dog"]);
      }
      if ((trailhead.properties["golf"] === 1)) {
        tagList = tagList.concat(["golf","golfing"]);
      }
      if ((trailhead.properties["hiking"] === 1)) {
        tagList = tagList.concat(["hiking","walking", "running", "hike", "walk", "run", "jog", "jogging"]);
      }
      if ((trailhead.properties["equestrian"] === 1)) {
        tagList = tagList.concat(["equestrian","horse riding", "horse"]);
      }
      if ((trailhead.properties["skating_ice"] === 1)) {
        tagList = tagList.concat(["skating_ice","ice skate"]);
      }
      if ((trailhead.properties["indoor_rental"] === 1)) {
        tagList = tagList.concat(["indoor_rental","wedding", "meeting"]);
      }
      if ((trailhead.properties["nature_center"] === 1)) {
        tagList = tagList.concat(["nature_center","museum", "education"]);
      }
      if ((trailhead.properties["picnic_grove"] === 1) || (trailhead.properties["shelter"] === 1)) {
        tagList = tagList.concat(["picnic_grove","shelter", "picnic", "event space", "grove", "bbq", "grill"]);
      }
      if ((trailhead.properties["sledding"] === 1)) {
        tagList = tagList.concat(["sledding","sled", "coasting"]);
      }
      if ((trailhead.properties["snowmobile"] === 1)) {
        tagList = tagList.concat(["snowmobile","snowmachine"]);
      }
      if ((trailhead.properties["swimming"] === 1)) {
        tagList = tagList.concat(["swimming","swim", "pool", "aquatic"]);
      }
      if ((trailhead.properties["volunteer"] === 1)) {
        tagList = tagList.concat(["volunteer","volunteering", "restoration"]);
      }
      trailhead.properties.tags = tagList.slice();
      setTrailheadEventHandlers(trailhead);
      originalTrailheads.push(trailhead);
      originalTrailheadFeatureGroup.addLayer(trailhead.signMarker);
      //oms.addMarker(trailhead.signMarker);
    }
    // oms.addListener('click', function(marker) {
    //   console.log("[oms click] marker.trailheadID = " + marker.trailheadID);
    //   trailheadMarkerClick(marker.trailheadID);
    // });
    
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

  }

  function trailheadMarkerClick(id) {
    console.log("trailheadMarkerClick");
    highlightTrailhead(id);
    highlightActivities(id);
    var trailhead = getTrailheadById(id);
    var trailSystem = null;
    if (trailhead.properties.trail_systems.length > 0) {
      trailSystem = trailhead.properties.trail_systems[0];
    }
    highlightTrailSegmentsForTrailSystem(trailSystem);
    var zoomArray = highlightedActivityMarkerArray.slice(0);
    console.log("zoomArray = " + zoomArray);
    zoomArray.push(trailhead.marker);
    console.log("zoomArray = " + zoomArray);
    var zoomFeatureGroup = new L.FeatureGroup(zoomArray);
    var zoomFeatureGroupBounds = zoomFeatureGroup.getBounds();
    if ( map.getBoundsZoom(zoomFeatureGroupBounds) >= map.getZoom() ) {
      map.fitBounds(zoomFeatureGroupBounds,
        {
          paddingTopLeft: centerOffset
        });
    } else {
      map.fitBounds(zoomFeatureGroupBounds,{
        maxZoom: map.getZoom(),
        paddingTopLeft: centerOffset
      })
    }

    //if (trailhead.trails) {
    //  showTrailDetails(originalTrailData[trailhead.trails[0]], trailhead);
    //} else {
    showTrailDetails(null, trailhead);
    //}
  }


  function makeCurrentActivities(myTrailheads) {
    console.log("[makeCurrentActivities] Begin");
    var activeActivityDivs = document.getElementsByClassName("leaflet-marker-icon icon-activity");
    console.log("[makeCurrentActivities] old activeActivityDivs.length = " + activeActivityDivs.length);
    for (var i = 0; i < activeActivityDivs.length; i++) {
      //console.log("[activeActivityDivs] old activeActivityDivs loop i = " + i);
      activeActivityDivs[i].classList.remove('active');
      activeActivityDivs[i].classList.add('inactive');
    }
    for (var i = 0; i < myTrailheads.length; i++) {
      var trailhead_id = myTrailheads[i].properties.id
      if (originalActivities[trailhead_id]) {
        for ( var j = 0; j < originalActivities[trailhead_id].length; j++ ) {
          var myActivityID = "activity-" + originalActivities[trailhead_id][j].properties.id;
          //console.log("[makeCurrentActivities] myActivityID = " + myActivityID);
          var currentActivityDivs = document.getElementsByClassName(myActivityID);
          //console.log("[makeCurrentActivities] new currentActivityDivs.length = " + currentActivityDivs.length);
          for (var k = 0; k < currentActivityDivs.length; k++) {
            //console.log("[highlightActivities] new currentActivityDivs loop k = " + k);
            currentActivityDivs[k].classList.add('active');
            currentActivityDivs[k].classList.remove('inactive');
          }
          originalActivities[trailhead_id][j].marker.setOpacity(.5);
        }
      }
    }
    console.log("[makeCurrentActivities] end");
  }

  function highlightActivities(myTrailhead_id) {
    console.log("[highlightActivities] myTrailhead_id = " + myTrailhead_id);
    var currentActivityDivs = document.getElementsByClassName("icon-activity selected");
    console.log("[highlightActivities] old currentActivityDivs.length = " + currentActivityDivs.length);
    for (var i = 0; i < currentActivityDivs.length; i++) {
      //console.log("[highlightActivities] old currentActivityDivs loop i = " + i);
      currentActivityDivs[i].classList.remove('selected');
    }
    for (var i = 0; i < highlightedActivityMarkerArray.length; i++) {
      highlightedActivityMarkerArray[i].setOpacity(.5);
    }
    

    highlightedActivityMarkerArray = [];
    if (myTrailhead_id) {
      var trailheadActivities = originalActivities[myTrailhead_id];
      if (trailheadActivities) {
        for ( var i = 0; i < trailheadActivities.length; i++) {
          trailheadActivities[i].marker.setOpacity(1);
          highlightedActivityMarkerArray.push(trailheadActivities[i].marker);
          var myActivityID = "activity-" + trailheadActivities[i].properties.id;
          //console.log("[highlightActivities] myActivityID = " + myActivityID);
          var currentActivityDivs = document.getElementsByClassName(myActivityID);
          //console.log("[highlightActivities] new currentActivityDivs.length = " + currentActivityDivs.length);
          for (var j = 0; j < currentActivityDivs.length; j++) {
            //console.log("[highlightActivities] new currentActivityDivs loop j = " + j);
            currentActivityDivs[j].classList.add('selected');
          }
        }
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
      } 
      else {
        //originalTrailData[trailDataGeoJSON.features[i].properties.id] = trailDataGeoJSON.features[i];
        
      }
      originalTrailData[trailDataGeoJSON.features[i].properties.id] = trailDataGeoJSON.features[i];
      originalTrailData[trailDataGeoJSON.features[i].properties.id].properties.secondaryHTML = '';
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
      //console.log("[populateTrailData] thisSecondaryTrail.properties.length=" + thisSecondaryTrail.properties.length);
        // iteration code
      if (thisSecondaryTrail.properties.length >= 1) {
        //console.log("thisSecondaryTrail= " + thisSecondaryTrail);
        var secondaryHTML = '<div class="fpccTrailSegment"><div class="fpccSegmentOverview fpcc';
        secondaryHTML += thisSecondaryTrail.properties.trail_color

        if (thisSecondaryTrail.properties.trail_type.toLowerCase() != "paved") {
          secondaryHTML += " fpccUnpaved";
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
        //console.log("[populateTrailData] secondaryHTML= " + secondaryHTML);
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
    var allVisibleSegmentsArray = [];
    var allInvisibleSegmentsArray = [];
    var allSegmentLayer = new L.FeatureGroup();
    // console.log("visibleAllTrailLayer start");

    // make a normal visible layer for the segments, and add each of those layers to the allVisibleSegmentsArray
    var visibleAllTrailLayer = L.geoJson(response, {
      style: function(feature) {
        //console.log(feature.properties.trail_names[0] + " " + feature.properties.trail_colors[0]);
        var thisColor = NORMAL_SEGMENT_COLOR;
        var thisWeight = NORMAL_SEGMENT_WEIGHT;
        //var thisWeight = 0;
        var thisOpacity = 1;
        var thisClickable = false;
        var thisSmoothFactor = customSmoothFactor;
        var thisDash = "";
        //console.log("[visibleAllTrailLayer] secondary_trail_ids = " + feature.properties.secondary_trail_ids[0]);
        var thisSecondaryTrail = feature.properties.secondary_trail_ids[0];
        var thisTrailType = ""
        if (originalTrailData[thisSecondaryTrail]) {
          thisTrailType = originalTrailData[thisSecondaryTrail].properties.trail_type;
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
        return {className: "testClass testClass2", color: thisColor, dashArray: thisDash,  weight: thisWeight, opacity: thisOpacity, clickable: thisClickable, smoothFactor: thisSmoothFactor};
      }, //color: thisColor,
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
            trailPopupLineDiv = "<div class='trail-popup-line trail-popup-line-named' " +
            "data-steward='" + invisLayer.feature.properties.steward + "' " +
            "data-source='" + invisLayer.feature.properties.source + "' " +
            "data-trailid='" + trailID + "' " +
            "data-trailname='" + trailName + "'> " +
            trailName + //" Trail System" +
            "</div>";
            atLeastOne = true;
          
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
              var trailIDs = invisLayer.feature.properties.trail_systems[0];
              console.log("[trail click] " + trailIDs);
              showTrailDetails(trailIDs, null);
              highlightTrailSegmentsForTrailSystem(trailIDs);
              highlightTrailhead(null);
              highlightActivities(null);
              //var trail = originalTrailData[trailIDs];
              
             
              var popupHTML = invisLayer.feature.properties.popupHTML;
              currentTrailPopup = new L.Popup({ autoPan: SMALL ? false : true}).setContent(popupHTML).setLatLng(originalEvent.latlng).openOn(map);
              // currentWeightedSegment = target;
            };
          }(e, e.target), 250);
        };
      }(invisLayer));

      allSegmentLayer.addLayer(newTrailFeatureGroup);
    }

    // use this to just show the network
    // allSegmentLayer = visibleAllTrailLayer;
    allVisibleSegmentsArray = null;
    allInvisibleSegmentsArray = null;
    map.addLayer(allSegmentLayer);
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
      //console.log("[trailPopupLineClick] " + matchedTrailhead );
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
    var currentTrailIDs = {};
    
    for (var j = 0; j < myTrailheads.length; j++) {
      var trailhead = myTrailheads[j];
      // var currentFeatureLatLng = new L.LatLng(trailhead.geometry.coordinates[1], trailhead.geometry.coordinates[0]);
      // var distance = currentFeatureLatLng.distanceTo(currentUserLocation);
      // if (currentFilters.location) {
      //   distance = currentFeatureLatLng.distanceTo(currentFilters.location);
      //   //console.log("[addTrailsToTrailheads] using currentFilters.location");
      // }
      // trailhead.properties.distance = distance;
      trailhead.properties.filterResults = 0;
      //console.log("[addTrailsToTrailheads] distance = " + distance);
      var trailheadWanted = 0;
      // for each original trailhead trail name
      if (trailhead.properties.trail_systems.length > 0) {
        var trailheadTrailIDs = trailhead.properties.trail_systems;
        for (var trailNum = 0; trailNum < trailheadTrailIDs.length; trailNum++) {
          var trailheadTrailID = trailheadTrailIDs[trailNum];
          var trail = myTrailData[trailheadTrailID];
          trailhead.properties.filterResults = filterResults(trail, trailhead);
          if (trailhead.properties.filterResults > 0) {
            //wanted = true;
            trailheadWanted = true;
            currentTrailIDs[trailheadTrailID] = 1;
            //console.log("[addTrailsToTrailheads] currentTrailIDs trailheadTrailID= " + trailheadTrailID);
            trailhead.properties.filterScore = trailhead.properties.filterResults;
            //currentTrailIDs.push(trailheadTrailID);
            //currentTrailData = $.extend(true, currentTrailData, trail);
          }
        }
      } else {
        trailhead.properties.filterResults = filterResults(null, trailhead);
        if (trailhead.properties.filterResults > 0) {
          trailheadWanted = true;
          trailhead.properties.filterScore = trailhead.properties.filterResults;
          //wanted = true;
        }
      }
      if (trailheadWanted) {
        //console.log("filterResults is good");
        //trailheadWanted = true;
        currentTrailheads.push(trailhead);
      }
    }
    
    console.log("currentTrailheads count = " + currentTrailheads.length);
    setTimeout(function() {
      //fixDuplicateTrailheadTrails(myTrailheads);
      makeCurrentActivities(currentTrailheads);
      makeTrailheadPopups(currentTrailheads);
      mapActiveTrailheads(currentTrailheads);
      
      allSegmentLayer.eachLayer(function (layer) {
        //console.log("trail_ids= " + layer.getLayers()[0].feature.properties.trail_ids);
        //console.log("trail_systems= " + layer.getLayers()[0].feature.properties.trail_systems);
        
        if (layer.getLayers()[0].feature.properties.trail_systems) {
          var layerWanted = 0;
          if (currentTrailIDs[layer.getLayers()[0].feature.properties.trail_systems]) {
            //console.log("[allSegmentLayer true] layer.getLayers()[0].feature.properties.trail_systems[0]= " + layer.getLayers()[0].feature.properties.trail_systems[0]);
            layer.getLayers()[0].setStyle({weight: NORMAL_SEGMENT_WEIGHT});
            layer.getLayers()[1].setStyle({weight: 20});
          } else {
            //console.log("[allSegmentLayer false] layer.getLayers()[0].feature.properties.trail_systems[0]= " + layer.getLayers()[0].feature.properties.trail_systems[0]);
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
      if (trailhead.properties.trail_systems.length > 0)  {
        for (var trailsIndex = 0; trailsIndex < trailhead.properties.trail_systems.length; trailsIndex++) {
          //console.log("[makeTrailheadPopups] trailhead.trails[trailsIndex] = " + trailhead.trails[trailsIndex]);
          var trail = originalTrailData[trailhead.properties.trail_systems[trailsIndex]];
          //console.log("[makeTrailheadPopups] trail = " + trail);

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
    var currentTrailheadSignArray = [];
    var activeTrailheadDivs = document.getElementsByClassName("leaflet-marker-icon icon-sign");
    console.log("[mapActiveTrailheads] old activeTrailheadDivs.length = " + activeTrailheadDivs.length);
    for (var i = 0; i < activeTrailheadDivs.length; i++) {
      //console.log("[activeTrailheadDivs] old activeTrailheadDivs loop i = " + i);
      activeTrailheadDivs[i].classList.remove('active');
      activeTrailheadDivs[i].classList.add('inactive');
    }
    for (var i = 0; i < myTrailheads.length; i++) {
      //currentTrailheadMarkerArray.push(myTrailheads[i].marker);
      currentTrailheadSignArray.push(myTrailheads[i].signMarker);
      var myEntranceID = "entrance-" + myTrailheads[i].properties.id;
      //console.log("[mapActiveTrailheads] myEntranceID= " + myEntranceID);
      var activeTrailheadDivs = document.getElementsByClassName(myEntranceID);
      for (var j = 0; j < activeTrailheadDivs.length; j++) {
        //console.log("[mapActiveTrailheads] activeTrailheadDivs loop");
        activeTrailheadDivs[j].classList.add('active');
        activeTrailheadDivs[j].classList.remove('inactive');
      }
    }
    if (currentTrailheadSignArray.length > 0) {
      var currentTrailheadLayerGroup = new L.FeatureGroup(currentTrailheadSignArray);
      map.fitBounds(currentTrailheadLayerGroup.getBounds(), {
        paddingTopLeft: centerOffset
      });
    }
    
    activeTrailheadsMapped = true;
    console.log("mapActiveTrailheads end");
  }


  // given trailheads, now populated with matching trail names,
  // make the trail/trailhead combination divs
  // noting if a particular trailhead has no trails associated with it

  function makeTrailDivs(myTrailheads) {
    console.log("makeTrailDivs");
    closeDetailPanel();
    orderedTrails = [];
    var trailList = {}; // used to see if trail div has been built yet.
    var divCount = 0;
    //var topLevelID = SMALL ? "mobile" : "desktop";
    var topLevelID = "desktop";
    //var trailListElementList = document.getElementById(topLevelID).getElementsByClassName("fpccResults");
    //trailListElementList[0].innerHTML = "";
    var myTrailheadsLength = myTrailheads.length;
    var trailListContents = "";
    //if(myTrailheads.length === 0) return;

    for (var j = 0; j < myTrailheadsLength; j++) {
      var trailhead = myTrailheads[j];
      var currentFeatureLatLng = new L.LatLng(trailhead.geometry.coordinates[1], trailhead.geometry.coordinates[0]);
      var distance = currentFeatureLatLng.distanceTo(currentUserLocation);
      if (currentFilters.location) {
        distance = currentFeatureLatLng.distanceTo(currentFilters.location);
      }
      trailhead.properties.distance = distance;
    }

    myTrailheads.sort(function(a, b){
      //console.log("a and b.properties.filterResult = " + a.properties.filterScore + " vs " + b.properties.filterScore);
      if (a.properties.filterScore > b.properties.filterScore) return -1;
      if (a.properties.filterScore < b.properties.filterScore) return 1;
      if (a.properties.distance < b.properties.distance) return -1;
      if (a.properties.distance > b.properties.distance) return 1;
      return 0;
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
  
      if (trailheadTrailIDs) {
        var trailID = trailheadTrailIDs[0];
        var trail = originalTrailData[trailID];
        var trailName = originalTrailData[trailID].properties.trail_system;
        var trailLength = Number(Math.round(originalTrailData[trailID].properties.length +'e2')+'e-2');
      }
      else {
        var trailID = null;
        var trail = null;
        var trailName = null;
        var trailLength = null;
      }
      //var trailCurrentIndex = divCount++;

       var trailDivText = "<a class='fpccEntry clearfix' " +
        "data-source='list' " +
        "data-trailid='" + "' " +
        "data-trailname='" + "' " +
        "data-trail-length='" + "' " +
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
      divCount++;
      if ((!trailList[trailName]) && trailheadTrailIDs) {
        trailDivText = "<a class='fpccEntry clearfix' " +
        "data-source='list' " +
        "data-trailid='" + trailID + "' " +
        "data-trailname='" + trailName + "' " +
        "data-trail-length='" + trailLength + "' " +
        "data-trailheadName='" + null + "' " +
        "data-trailheadid='" + null + "' " +
        "data-index='" + 0 + "'>";
        trailheadInfoText =  "<span class='fpccEntryName'>" +
        '<svg class="icon icon-trail-marker"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>' +
        '<span class="fpccEntryNameText">' + trailName + ' </span></span>' +
        //'<span class="fpccEntryDis">' + trailheadDistance + ' mi away</span></a>' +
        "</div>"
        trailList[trailName] = 1;
        trailDivComplete = trailDivText + trailheadInfoText + trailSourceText;
        trailListContents = trailListContents + trailDivComplete;
        divCount++;
      }

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
    $("#fpccSearchResults").html(trailListContents);
    //$(".fpccEntry").click(populateTrailsForTrailheadDiv);
    $(".fpccEntry").click(trailDivClickHandler);
    $("#fpccSearchStatus").html(divCount + " Results Found");
    console.log("end makeTrailDivs 4");
    makeTrailDivsEnded = true;
  }

  function trailDivClickHandler(e) {
    var $myTarget = $(e.currentTarget);
    var divTrailID = $myTarget.attr("data-trailid");
    var divTrailName = $myTarget.attr("data-trailname");
    console.log(divTrailID);
    var divTrail = originalTrailData[divTrailID];
    var trailSystem = null;
    var divTrailheadID = $myTarget.attr("data-trailheadid");
    var divTrailheadName = $myTarget.attr("data-trailheadname");
    var trailheadID = null;
    
    if (divTrail) {
      trailSystem = divTrail.properties.trail_system;
      trailDivWork(trailSystem, null);
    } else {   
      trailDivWork(null, divTrailheadID);
    }  
  }

  function trailDivWork(trailSystem, trailheadId) {
    if (trailSystem) {
      showTrailDetails(trailSystem, null);
    } else {   
      var divTrailhead = getTrailheadById(trailheadId);
      console.log("[trailDivWork] about to showTrailDetails(divTrail, divTrailhead)");
      showTrailDetails(null, divTrailhead);
      //console.log("[trailDivClickHandler] trailSystem is null");
      if (divTrailhead.properties.trail_systems.length > 0) {
        trailSystem = divTrailhead.properties.trail_systems[0];
      }  
    }
    highlightTrailSegmentsForTrailSystem(trailSystem);
    highlightTrailhead(trailheadId);
    highlightActivities(trailheadId);
    var zoomFeatureGroup = null;
    var zoomArray = [];

    if (divTrailhead) {
      zoomArray = highlightedActivityMarkerArray.slice(0);
      zoomArray.push(divTrailhead.marker);
      zoomFeatureGroup = new L.FeatureGroup(zoomArray);
      var zoomFeatureGroupBounds = zoomFeatureGroup.getBounds();

    } else {
      zoomFeatureGroup = currentHighlightedSegmentLayer;
      //console.log("zoomFeatureGroup= " + zoomFeatureGroup);
    }  
    map.fitBounds(zoomFeatureGroup.getBounds(), {
      paddingTopLeft: centerOffset
    });
  }

  function metersToMiles(i) {
    return (i * METERSTOMILESFACTOR).toFixed(1);
  }


  // detail panel section
  //
  // KEEP REVISED: showTrailDetails
  function showTrailDetails(trailSystem, trailhead) {
    console.log("showTrailDetails");
    
    var trailheadLink = null;
    var trailLink = null;
    if (trailSystem) {
      trailLink =  encodeURIComponent(trailSystem);
      trailLink = trailLink.replace(/%20/g, '+');
    } else {
      trailheadLink = encodeURIComponent(trailhead.properties.id + "-" + trailhead.properties.name);
      trailheadLink = trailheadLink.replace(/%20/g, '+');
    }

    
    if (trailSystem) {
      decorateDetailPanelForTrailSystem(trailSystem);
    } else {
      decorateDetailPanelForTrailhead(trailhead);
    }

    $.address.parameter('trail', trailLink);  
    $.address.parameter('poi', trailheadLink);
    $.address.update();

    if ($('.detailPanel').is(':hidden')) {
      //decorateDetailPanel(trail, trailhead);
      openDetailPanel();
      currentDetailTrail = trailSystem;
      currentDetailTrailhead = trailhead;
    } else {
        //decorateDetailPanel(trail, trailhead);
        currentDetailTrail = trailSystem;
        currentDetailTrailhead = trailhead;
    }
  }


  //  Helper functions for ShowTrailDetails

  function openDetailPanel() {
    console.log("openDetailPanel");
    $('.accordion').hide();
    $('.aboutPage').hide();

    // New versions

    $('#fpccSearchStatus').hide();
    $('#fpccSearchResults').hide();
    $('#fpccSearchBack').show();
    $('.detailPanel').show();

    // We need to re-calculate the max height for fpccPreserveInfo because 
    // fpccPreserveName height can change.
    setHeights(); 


    //var myDiv = document.getElementById('detailPanelBodySection');
    //myDiv.scrollTop = 0;
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
   // New versions
    $('#fpccSearchStatus').show();
    $('#fpccSearchResults').show();
    $('#fpccSearchBack').hide();
    $('.detailPanel').hide();

    $('.accordion').show();
    $('.trailhead-trailname.selected').removeClass("detail-open");
    highlightTrailhead(null,null);
    highlightTrailSegmentsForTrailSystem(null);
    highlightActivities(null);
    //resetDetailPanel();

    map.closePopup();
    // map.invalidateSize();
  }

  function openResultsList() {
    console.log("openResultsList");
    // New versions
    $('#fpccSearchStatus').show();
    $('#fpccSearchResults').show();
    $('#fpccSearchBack').hide();
    $('.detailPanel').hide();
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
      $("#fpccPreserveInfo").animate({ scrollTop: 0 }, 'fast');
      
      $('.detailPanel .detailPanelBanner .entranceName').html("");
      //$('.detailPanel .fpccTrails').html("");
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
      $('.detailPanel #trailDescription').html("");
      //$('.detailPanel .fpccEntranceDescription').html("");
      $('.detailPanel .detailStewardLogo').attr("src", "/img/logoPlaceholder.jpg");

      // New areas
      $('.detailPanel .fpccTop').hide();

      $('.detailPanel .fpccPhoto').html("");
      $('.detailPanel .fpccPhoto').hide();
      $('.detailPanel .fpccAlerts').html("");
      $('.detailPanel .fpccAlerts').hide();
      $('.detailPanel .fpccDirections a').attr("href", "").attr("target", "_blank");
      $('.detailPanel .fpccEntranceAddress').html("");
      $('.detailPanel .fpccEntranceZip').html("");
      $('.detailPanel .fpccPhone').html("");
      $('.detailPanel .fpccEntranceAddress').hide();
      $('.detailPanel .fpccEntranceZip').hide();
      $('.detailPanel .fpccPhone').hide();

      $('.detailPanel .fpccDescription').html("");
      $('.detailPanel .fpccDescription').hide();
      $('.detailPanel .fpccAmenities').html("");
      $('.detailPanel .fpccHours').html("");
      $('.detailPanel .fpccHours').hide();

      $('.detailPanel .fpccTrails').hide();
      $('.detailPanel .fpccTrailSegments').html("");
      $('.detailPanel .fpccTrailSegments').hide();

      $('.detailPanel #trailDescription').html("");
      $('.detailPanel #trailDescription').hide();

      $('.detailPanel .fpccLinks').html("");
      $('.detailPanel .fpccLinks').hide();
      $('.detailPanel .fpccTrailHeader').hide();
      $('.detailPanel .fpccTrails .icon-trail-marker').hide();


  }

  // KEEP NEW: decorateDetailPanelForTrailSystem
  function decorateDetailPanelForTrailSystem(trailSystem) {
    enableTrailControls();
    resetDetailPanel();
    console.log("[decorateDetailPanelForTrailSystem] trailSystem = " + trailSystem);

    if (trailSystem) {
        // var trailname = trail.properties.name + " Trail";

        // $('.detailPanel .fpccTrailName').html(trailname);
        // $('.detailPanel .trailheadTrailMaps').show();
        // $('.detailPanel .fpccTrailHeader').show();
        var trailSystemTrail = originalTrailData[trailSystem];
        console.log("[decorateDetailPanelForTrailSystem] trailSystemTrail = " + trailSystemTrail);
        if (trailSystemTrail.properties.description) {
          //document.getElementById('trailDescription').innerHTML = trail.properties.description;
          $('.detailPanel #trailDescription').html(trailSystemTrail.properties.description);
          $('.detailPanel #trailDescription').show();
        }
        if (trailSystemTrail) {
          $('#fpccPreserveName .trailName').html(trailSystemTrail.properties.name);
        }
        $('.detailPanel .fpccTrailDescription').show();
        $('.detailPanel .fpccTrailSegments').show();
        //console.log("[decorateDetailPanelForTrailSystem] secondaryHTML = " + trailSystemTrail.properties.secondaryHTML);
        $('.detailPanel .fpccTrailSegments').html(trailSystemTrail.properties.secondaryHTML);
        $('.detailPanel .fpccTrails').show();
        //$('.detailPanel .fpccTrails .icon-trail-marker').show();
        $('.detailPanel .fpccLinks').hide();

        var a = document.getElementById('fpccSocialEmail'); 
        a.href = "mailto:?subject=Heading to " + trailSystemTrail.properties.name;
        a = document.getElementById('fpccSocialTwitter'); 
        a.href = "http://twitter.com/home?status=Heading to " + trailSystemTrail.properties.name + " " + window.location.href;
        a = document.getElementById('fpccSocialFacebook'); 
        a.href = "http://www.facebook.com/sharer/sharer.php?s=100&p[url]=" + window.location.href + "&p[images][0]=&p[title]=Cook County Forest Preserves &p[summary]=Heading to " + trailSystemTrail.properties.name;
        

    }
  }

  // KEEP NEW: decorateDetailPanelForTrailhead
  function decorateDetailPanelForTrailhead(trailhead) {
    enableTrailControls();
    resetDetailPanel();
    console.log("[decorateDetailPanelForTrailhead]");

    $('.detailPanel .trailMaps').show();
    $('.detailPanel .fpccEntrance').show();
    $('.detailPanel .fpccAmenities').show();
    $('.detailPanel .fpccTop').show();
    if(trailhead) {
      if (trailhead.properties.trail_systems.length > 0) {
        console.log("[decorateDetailPanelForTrailhead] systems = " + trailhead.properties.trail_systems);
        var systems = trailhead.properties.trail_systems;
        //for ( var systemIndex=0; systemIndex < systems.length; systemIndex++ ) {
        $('.detailPanel .fpccTrailName').html(systems[0]);
        $('.detailPanel .trailheadTrailMaps').show();
        $('.detailPanel .fpccTrailHeader').show();
        $('.detailPanel .fpccTrailDescription').show();
        $('.detailPanel .fpccTrailSegments').show();
        $('.detailPanel .fpccTrails').show();
        $('.detailPanel .fpccTrails .icon-trail-marker').show();

        var trailSegmentsHTML = "";
        for (var trailIndex = 0; trailIndex < trailhead.properties.trail_ids.length; trailIndex++ ) {
          var thisTrailId = trailhead.properties.trail_ids[trailIndex];
          var thisTrail = originalTrailData[thisTrailId];
          trailSegmentsHTML += '<div class="fpccTrailSegment"><div class="fpccSegmentOverview fpcc';
          trailSegmentsHTML += thisTrail.properties.trail_color;
          if (thisTrail.properties.trail_type.toLowerCase() != "paved") {
            trailSegmentsHTML += " fpccUnpaved";
          }
          trailSegmentsHTML += ' clearfix"><span class="fpccSegmentName">';
          trailSegmentsHTML += thisTrail.properties.trail_color + ' ' + thisTrail.properties.trail_type;
          trailSegmentsHTML += '</span><span class="fpccTrailUse">';
          trailSegmentsHTML += '<svg class="icon icon-hiking"><use xlink:href="icons/defs.svg#icon-hiking"></use></svg>';
          if (thisTrail.properties.trail_type.toLowerCase() == "unpaved" || thisTrail.properties.trail_type.toLowerCase() == "paved" || thisTrail.properties.trail_type == "") {
            trailSegmentsHTML += '<svg class="icon icon-bicycling"><use xlink:href="icons/defs.svg#icon-bicycling"></use></svg>';
            trailSegmentsHTML += '<svg class="icon icon-cross-country-skiing"><use xlink:href="icons/defs.svg#icon-cross-country-skiing"></use></svg>';
          }
          if (thisTrail.properties.trail_type.toLowerCase() == "unpaved" || thisTrail.properties.trail_type == "") {
            trailSegmentsHTML += '<svg class="icon icon-equestrian"><use xlink:href="icons/defs.svg#icon-equestrian"></use></svg>';
          }
          trailSegmentsHTML += '</span></div>';
          trailSegmentsHTML += '<div class="fpccSegmentDetails clearfix"><span class="fpccLabel fpccLeft">Length<span>';
          trailSegmentsHTML += (Math.round(thisTrail.properties.length * 100) / 100);
          trailSegmentsHTML += ' mi</span></span>';
          trailSegmentsHTML += '<span class="fpccLabel fpccRight">Surface<span>';
          trailSegmentsHTML += thisTrail.properties.trail_type;
          trailSegmentsHTML += '</span></span></div></div>';
        }

        if (trailhead.properties.indirect_trail_ids) {
          console.log("[decorateDetailPanel] indirect_trail_ids.length = " + trailhead.properties.indirect_trail_ids.length);
          var indirectHTML = '<div class="fpccAccessTo fpccLabel"><svg class="icon icon-trail-marker" style="display: inline-block;"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>with access to:</div>';
          var useIndirect = false;
          for (var trailIndex = 0; trailIndex < trailhead.properties.indirect_trail_ids.length; trailIndex++ ) {
            var thisTrailId = trailhead.properties.indirect_trail_ids[trailIndex];
            var thisTrail = originalTrailData[thisTrailId];
            if (thisTrail.properties.length >= 1) {
              useIndirect = true;
              indirectHTML += '<div class="fpccTrailSegment"><div class="fpccSegmentOverview fpcc';
              indirectHTML += thisTrail.properties.trail_color;
              if (thisTrail.properties.trail_type.toLowerCase() != "paved") {
                indirectHTML += " fpccUnpaved";
              }
              indirectHTML += ' clearfix"><span class="fpccSegmentName">';
              indirectHTML += thisTrail.properties.trail_color + ' ' + thisTrail.properties.trail_type;
              indirectHTML += '</span><span class="fpccTrailUse">';
              indirectHTML += '<svg class="icon icon-hiking"><use xlink:href="icons/defs.svg#icon-hiking"></use></svg>';
              if (thisTrail.properties.trail_type.toLowerCase() == "unpaved" || thisTrail.properties.trail_type.toLowerCase() == "paved" || thisTrail.properties.trail_type == "") {
                indirectHTML += '<svg class="icon icon-bicycling"><use xlink:href="icons/defs.svg#icon-bicycling"></use></svg>';
                indirectHTML += '<svg class="icon icon-cross-country-skiing"><use xlink:href="icons/defs.svg#icon-cross-country-skiing"></use></svg>';
              }
              if (thisTrail.properties.trail_type.toLowerCase() == "unpaved" || thisTrail.properties.trail_type == "") {
                indirectHTML += '<svg class="icon icon-equestrian"><use xlink:href="icons/defs.svg#icon-equestrian"></use></svg>';
              }
              indirectHTML += '</span></div>';
              indirectHTML += '<div class="fpccSegmentDetails clearfix"><span class="fpccLabel fpccLeft">Length<span>';
              indirectHTML += (Math.round(thisTrail.properties.length * 100) / 100);
              indirectHTML += ' mi</span></span>';
              indirectHTML += '<span class="fpccLabel fpccRight">Surface<span>';
              indirectHTML += thisTrail.properties.trail_type;
              indirectHTML += '</span></span></div></div>';
            }
          }
          if (useIndirect) {
            trailSegmentsHTML += indirectHTML;
          }
        }

        $('.detailPanel .fpccTrailSegments').html(trailSegmentsHTML);

        // if (trail.properties.description) {
        //   $('.detailPanel #trailDescription').html(trail.properties.description);
        //   $('.detailPanel #trailDescription').show();
        // }

        //}
        
      } else {
        $('.detailPanel .trailheadTrailMaps').hide();
        $('.detailPanel .fpccTrailHeader').hide();
        $('.detailPanel .fpccTrailSegments').hide();
        $('.detailPanel .fpccTrailDescription').hide();
        $('.detailPanel .fpccTrails').hide();
        $('.detailPanel .fpccTrails .icon-trail-marker').hide();
      }

      if (trailhead.properties.photo_link) {
        $('.detailPanel .fpccPhoto').html('<img src="images/poi-photos/' + trailhead.properties.photo_link + '">');
        $('.detailPanel .fpccPhoto').show();
      }
  
      var a = document.getElementById('fpccSocialEmail'); 
      a.href = "mailto:?subject=Heading to " + trailhead.properties.name;
      a = document.getElementById('fpccSocialTwitter'); 
      a.href = "http://twitter.com/home?status=Heading to " + trailhead.properties.name + " " + window.location.href;
      a = document.getElementById('fpccSocialFacebook'); 
      a.href = "http://www.facebook.com/sharer/sharer.php?s=100&p[url]=" + window.location.href + "&p[images][0]=&p[title]=Cook County Forest Preserves &p[summary]=Heading to " + trailhead.properties.name;
      
      if (trailhead.properties.description) {
        var entranceDescription = trailhead.properties.description;
        if (trailhead.properties.web_link) {
          entranceDescription += ' <a target="_blank" href="' + trailhead.properties.web_link + '" class="fpccMore">Read more &gt;</a>';
        }
        $('.detailPanel .fpccDescription').html(entranceDescription);
        $('.detailPanel .fpccDescription').show();
      }

      var extraLinksText = '<div class="fpccMoreHeader">';
      extraLinksText += '<span class="fpccMoreName">More Information</span></div><ul>';
      var extraLinksExist = false;

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
        $('#fpccPreserveName .trailName').html(trailhead.properties.name);
      }

      if (trailhead.properties.address) {
        $('.detailPanel .fpccAddress .fpccLabel').html("Entrance");
        $('.detailPanel .fpccEntranceAddress').html(trailhead.properties.address);
        $('.detailPanel .fpccEntranceAddress').show();
      } else {
        $('.detailPanel .fpccAddress .fpccLabel').html("Location");
      }
      if (trailhead.properties.city) {
        $('.detailPanel .fpccEntranceZip').html(trailhead.properties.city);
        $('.detailPanel .fpccEntranceZip').show();
      }

      if (trailhead.properties.phone) {
        $('.detailPanel .fpccPhone').show();
        $('.detailPanel .fpccPhone').html(trailhead.properties.phone);
      }

      var hoursHTML = "";
      if (trailhead.properties.hours1) {
        hoursHTML += '<span class="fpccHours1"><strong>' + trailhead.properties.season1;
        hoursHTML += ':</strong> ' + trailhead.properties.hours1 + '</span>';
      }
      if (trailhead.properties.hours2) {
        hoursHTML += '<span class="fpccHours2"><strong>' + trailhead.properties.season2;
        hoursHTML += ':</strong> ' + trailhead.properties.hours2 + '</span>';
      }
      if (trailhead.properties.special_hours) {
        hoursHTML += '<span class="fpccSpecialHours">' + trailhead.properties.special_hours + '</span>';
      }
      if (hoursHTML != "") {
        hoursHTML = '<span class="fpccLabel">Hours</span>' + hoursHTML;
        $('.detailPanel .fpccHours').html(hoursHTML);
        $('.detailPanel .fpccHours').show();
      }
      

      var directionsUrl = "http://maps.google.com?saddr=" + currentUserLocation.lat + "," + currentUserLocation.lng +
        "&daddr=" + trailhead.geometry.coordinates[1] + "," + trailhead.geometry.coordinates[0];
      var a = document.getElementById('entranceDirections'); 
      a.href = directionsUrl;

      // bike_rental = Bike Rental
      if (trailhead.properties.bike_rental) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-bike-rental'><use xlink:href='icons/defs.svg#icon-bike-rental'></use></svg><span class='fpccAmenityTitle'>Bike Rental</span></div>");
      }

      // birding = Birding Hotspot
      if (trailhead.properties.birding) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-birding-hotspot'><use xlink:href='icons/defs.svg#icon-birding-hotspot'></use></svg><span class='fpccAmenityTitle'>Birding Hotspot</span></div>");
      }

      // boat_ramp = Boat Launch
      if (trailhead.properties.boat_ramp) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-boat-launch'><use xlink:href='icons/defs.svg#icon-boat-launch'></use></svg><span class='fpccAmenityTitle'>Boat Launch</span></div>");
      }

      // boat_rental = Boat Rental
      if (trailhead.properties.boat_rental) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-boat-rental'><use xlink:href='icons/defs.svg#icon-boat-rental'></use></svg><span class='fpccAmenityTitle'>Boat Rental</span></div>");
      }

      // camping = Campground
      if (trailhead.properties.camping) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-camp'><use xlink:href='icons/defs.svg#icon-camp'></use></svg><span class='fpccAmenityTitle'>Campground</span></div>");
      }

      // canoe = Canoe Landing
      if (trailhead.properties.canoe) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-canoe-landing'><use xlink:href='icons/defs.svg#icon-canoe-landing'></use></svg><span class='fpccAmenityTitle'>Canoe Landing</span></div>");
      }

      // cross_country = Cross-Country Skiing
      if (trailhead.properties.cross_country) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-cross-country-skiing'><use xlink:href='icons/defs.svg#icon-cross-country-skiing'></use></svg><span class='fpccAmenityTitle'>Cross-Country Skiing</span></div>");
      }

      // cycling = Bicycling
      if (trailhead.properties.cycling) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-bicycling'><use xlink:href='icons/defs.svg#icon-bicycling'></use></svg><span class='fpccAmenityTitle'>Bicycling</span></div>");
      }

      // disc_golf = Disc Golf
      if (trailhead.properties.disc_golf) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-disc-golf'><use xlink:href='icons/defs.svg#icon-disc-golf'></use></svg><span class='fpccAmenityTitle'>Disc Golf</span></div>");
      }

      //  dog_friendly = Off-Leash Dog Area
      if (trailhead.properties.dog_friendly) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-off-leash-dog-area'><use xlink:href='icons/defs.svg#icon-off-leash-dog-area'></use></svg><span class='fpccAmenityTitle'>Off-Leash Dog Area</span></div>");
      }

      //  dog_leash = Dogs (with a leash)
      if (trailhead.properties.dog_leash) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-dog-leash'><use xlink:href='icons/defs.svg#icon-dog-leash'></use></svg><span class='fpccAmenityTitle'>Dogs (with a leash)</span></div>");
      }

      //  drone = Drone Flying
      if (trailhead.properties.drone) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-drone'><use xlink:href='icons/defs.svg#icon-drone'></use></svg><span class='fpccAmenityTitle'>Drone Flying</span></div>");
      }

      // ecological = Ecological Management
      if (trailhead.properties.ecological) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-ecological-management-area'><use xlink:href='icons/defs.svg#icon-ecological-management-area'></use></svg><span class='fpccAmenityTitle'>Ecological Management</span></div>");
      }

      // equestrian = Equestrian
      if (trailhead.properties.equestrian) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-equestrian'><use xlink:href='icons/defs.svg#icon-equestrian'></use></svg><span class='fpccAmenityTitle'>Equestrian</span></div>");
      }

      // fishing = Fishing
      if (trailhead.properties.fishing) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-fishing'><use xlink:href='icons/defs.svg#icon-fishing'></use></svg><span class='fpccAmenityTitle'>Fishing</span></div>");
      }

      // golf = Golf
      if (trailhead.properties.golf) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'>Golf</span></div>");
      }

      // hiking = Hiking
      if (trailhead.properties.hiking) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-hiking'><use xlink:href='icons/defs.svg#icon-hiking'></use></svg><span class='fpccAmenityTitle'>Hiking</span></div>");
      }

      // ice_fishing = Ice Fishing
      if (trailhead.properties.ice_fishing) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-ice-fishing'><use xlink:href='icons/defs.svg#icon-ice-fishing'></use></svg><span class='fpccAmenityTitle'>Ice Fishing</span></div>");
      }

      // m_airplane = Model Airplane Flying Field
      if (trailhead.properties.m_airplane) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-model-airplane'><use xlink:href='icons/defs.svg#icon-model-airplane'></use></svg><span class='fpccAmenityTitle'>Model Airplane Flying Field</span></div>");
      }

      // m_boat = Model Sailboat
      if (trailhead.properties.m_boat) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-model-sailboat'><use xlink:href='icons/defs.svg#icon-model-sailboat'></use></svg><span class='fpccAmenityTitle'>Model Sailboat</span></div>");
      }

      // nature_center = Nature Center
      if (trailhead.properties.nature_center) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-nature-center'><use xlink:href='icons/defs.svg#icon-nature-center'></use></svg><span class='fpccAmenityTitle'>Nature Center</span></div>");
      }

      // no_alcohol = No Alcohol
      if (trailhead.properties.no_alcohol) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-no-alcohol'><use xlink:href='icons/defs.svg#icon-no-alcohol'></use></svg><span class='fpccAmenityTitle'>No Alcohol</span></div>");
      }

      // no_parking = No Parking
      if (trailhead.properties.no_parking) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-no-parking'><use xlink:href='icons/defs.svg#icon-no-parking'></use></svg> <span class='fpccAmenityTitle'>No Parking</span></div>");
      }

      // overlook = Scenic Overlook
      if (trailhead.properties.overlook) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-scenic-overlook'><use xlink:href='icons/defs.svg#icon-scenic-overlook'></use></svg><span class='fpccAmenityTitle'>Scenic Overlook</span></div>");
      }

      // pavilion = Pavilion/Event Space
      if (trailhead.properties.pavilion) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg><span class='fpccAmenityTitle'>Indoor Facility</span></div>");
      }

      // picnic_grove = Picnic Grove
      if (trailhead.properties.picnic_grove) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity picnic-grove'><svg class='icon icon-picnic-grove'><use xlink:href='icons/defs.svg#icon-picnic-grove'></use></svg><span class='fpccAmenityTitle'>Picnic Grove</span></div>");
      }

      // shelter = Picnic Grove (with shelter)
      if (trailhead.properties.shelter) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-picnic-grove-shelter'><use xlink:href='icons/defs.svg#icon-picnic-grove-shelter'></use></svg><span class='fpccAmenityTitle'>Picnic Grove (with shelter)</span></div>");
      }

      // skating_ice = Ice Skating
      if (trailhead.properties.skating_ice) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-ice-skating'><use xlink:href='icons/defs.svg#icon-ice-skating'></use></svg><span class='fpccAmenityTitle'>Ice Skating</span></div>");
      }

      // sledding = Sledding
      if (trailhead.properties.sledding) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-sledding'><use xlink:href='icons/defs.svg#icon-sledding'></use></svg><span class='fpccAmenityTitle'>Sledding</span></div>");
      }

      // snowmobile = Snowmobile Area
      if (trailhead.properties.snowmobile) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-snowmobiling'><use xlink:href='icons/defs.svg#icon-snowmobiling'></use></svg><span class='fpccAmenityTitle'>Snowmobile Area</span></div>");
      }

      // swimming = Aquatic Center
      if (trailhead.properties.swimming) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-aquatic-center'><use xlink:href='icons/defs.svg#icon-aquatic-center'></use></svg><span class='fpccAmenityTitle'>Aquatic Center</span></div>");
      }

      // volunteer = Volunteer Opportunities
      if (trailhead.properties.volunteer) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-volunteer'><use xlink:href='icons/defs.svg#icon-volunteer'></use></svg><span class='fpccAmenityTitle'>Volunteer Opportunities</span></div>");
      }
      
      // parking = Parking
      if (trailhead.properties.parking) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-parking'><use xlink:href='icons/defs.svg#icon-parking'></use></svg><span class='fpccAmenityTitle'>Parking</span></div>");
      }

      // trailacces = Trail System Access
      if (trailhead.properties.trailacces) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-trail-marker'><use xlink:href='icons/defs.svg#icon-trail-marker'></use></svg><span class='fpccAmenityTitle'>Trail Access</span></div>");
      }

      // trailacces = Trail System Access
      if (trailhead.properties.zip_line) {
        $('.detailPanel .fpccAmenities').append("<div class='fpccAmenity'><svg class='icon icon-zip-line'><use xlink:href='icons/defs.svg#icon-zip-line'></use></svg><span class='fpccAmenityTitle'>Zip Line / Treetop Adventure</span></div>");
      }

      if (trailhead.properties.special_link) {
        $('.detailPanel .fpccAmenities').append('<a href="' + trailhead.properties.special_link + '" class="fpccSpecialDesc" target="_blank"><span class="fpccSpecialBlurb">' + trailhead.properties.special_description + '</span><span class="fpccSpecialIcon"><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg></span></a>');
      }
    }
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

  // Open/close fpccMenu list
  function changeMenuDisplay() {
    console.log("changeMenuDisplay");
    if ($(".fpccMenuList").hasClass("hide")) {
      $('.fpccMenuList').removeClass('hide');
      $('.fpccMenuList').addClass("show");
    } else {
      $('.fpccMenuList').removeClass('show');
      $('.fpccMenuList').addClass("hide");
    }

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
    //var trail = originalTrailData[parsed.trailID];
    console.log("trail id = " + parsed.trailID);
    showTrailDetails(parsed.trailID, null);
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
    console.log("[populateTrailsForTrailheadDiv] parsed.trailID = " + parsed.trailID + " parsed.highlightedTrailIndex = " + parsed.highlightedTrailIndex);

    var trail = null;
    var trailhead = null;
    var trailIDs = [];
    var zoomFeatureGroup = null;
    var zoomArray = [];

    zoomArray = highlightedActivityMarkerArray.slice(0);
    //console.log("zoomArray = " + zoomArray);
    zoomArray.push(trailhead.marker);
    //console.log("zoomArray = " + zoomArray);
    zoomFeatureGroup = new L.FeatureGroup(zoomArray);
    //console.log("zoomFeatureGroup = " + zoomFeatureGroup);

    zoomFeatureGroup = currentHighlightedSegmentLayer;

    //console.log("zoomFeatureGroup= " + zoomFeatureGroup);
    map.fitBounds(zoomFeatureGroup.getBounds(), {
      paddingTopLeft: centerOffset
    });
    // if (parsed.trailID) {
    //   trail = originalTrailData[parsed.trailID];
    //   //trailIDs.push(parsed.trailID);
    // }
    if (parsed.trailheadID) {
      trailhead = getTrailheadById(parsed.trailheadID);
      highlightTrailhead(parsed.trailheadID, parsed.highlightedTrailIndex);
      
      zoomArray = highlightedActivityMarkerArray.slice(0);
      //console.log("zoomArray = " + zoomArray);
      zoomArray.push(trailhead.marker);
      //console.log("zoomArray = " + zoomArray);
      zoomFeatureGroup = new L.FeatureGroup(zoomArray);
      //console.log("zoomFeatureGroup = " + zoomFeatureGroup);
    }
    else {
      highlightTrailhead(null, parsed.highlightedTrailIndex, parsed.trailID);
      //console.log("currentHighlightedSegmentLayer = " + currentHighlightedSegmentLayer);
      zoomFeatureGroup = currentHighlightedSegmentLayer;
    }
    //console.log("zoomFeatureGroup= " + zoomFeatureGroup);
    map.fitBounds(zoomFeatureGroup.getBounds(), {
      paddingTopLeft: centerOffset
    });
    console.log("[populateTrailsForTrailheadDiv] about to run showTrailDetails(trail, trailhead )" + trail + " trailhead= " + trailhead);
    showTrailDetails(null, trailhead);
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

  function highlightTrailhead(trailheadID,highlightedTrailIndex) {
    console.log("highlightTrailhead");
    var startTime = new Date().getTime();
    console.log("highlightTrailhead start = " + startTime);
    map.closePopup();
    highlightedTrailIndex = highlightedTrailIndex || 0;
    var trailhead = null;
    trailhead = getTrailheadById(trailheadID);

    if ($('.detailPanel').is(":visible")) {
      $('.trailhead-trailname.selected').removeClass("detail-open");
    }

    if ($('.detailPanel').is(":visible")) {
      $('.trailhead-trailname.selected').addClass("detail-open");
    }

    if (currentTrailhead) {
        var myEntranceID = "entrance-" + currentTrailhead.properties.id;
        console.log("[highlightTrailhead] currentTrailhead");
        var currentTrailheadDivs = document.getElementsByClassName(myEntranceID);
        for (var i = 0; i < currentTrailheadDivs.length; i++) {
          console.log("[highlightTrailhead] old currentTrailheadDivs loop i = " + i);
          currentTrailheadDivs[i].classList.remove('selected');
        }
    }


    if (trailhead) {
      currentTrailhead = trailhead;
      var myEntranceID = "entrance-" + currentTrailhead.properties.id;
      console.log("[highlightTrailhead] new currentTrailhead = " + myEntranceID);

      var currentTrailheadDivs = document.getElementsByClassName(myEntranceID);
      for (var i = 0; i < currentTrailheadDivs.length; i++) {
        console.log("[highlightTrailhead] new currentTrailheadDivs loop i = " + i);
        //console.log("[highlightTrailhead] new currentTrailhead in loop");
        //console.log("[highlightTrailhead] loop i = " + i + " div= " + currentTrailheadDivs[i]);
        currentTrailheadDivs[i].classList.add('selected');
      }
  
      //highlightTrailInPopup(trailhead, highlightedTrailIndex);
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
    var endTime = new Date().getTime();
    var diff = endTime - startTime;
    console.log("highlightTrailhead time: " + diff);
    //highlightTrailSegmentsForTrailhead(trailhead, highlightedTrailIndex, trailIDs);
    
  }


  // For a given Trail_System, change the style weight to active
  function highlightTrailSegmentsForTrailSystem(trailSystem) {
    var startTime = new Date().getTime();
    console.log("highlight start = " + startTime);
    if (currentHighlightedSegmentLayer) {
      currentHighlightedSegmentLayer.setStyle({weight: NORMAL_SEGMENT_WEIGHT});
    }

    currentHighlightedSegmentLayer = null;
    
    if (trailSystem) {
      console.log("[highlightTrailSegmentsForTrailhead] trailSystem = " + trailSystem);
      currentHighlightedSegmentLayer = new L.FeatureGroup();
      
      allSegmentLayer.eachLayer(function (layer) {
        var layerTrailSystem = layer.getLayers()[0].feature.properties.trail_systems[0];
        //console.log("[highlightTrailSegmentsForTrailhead] layerTrailSystem = " + layerTrailSystem);
        var layerWanted = 0;
        if (layerTrailSystem) {
            if (layerTrailSystem == trailSystem) {
              layerWanted = 1;
            } 
        }
        if (layerWanted) {
          layer.getLayers()[0].setStyle({weight: ACTIVE_TRAIL_WEIGHT});
          currentHighlightedSegmentLayer.addLayer(layer.getLayers()[0]);
          //layer.getLayers()[0].setStyle({weight: ACTIVE_TRAIL_WEIGHT});
          //layer.getLayers()[1].setStyle({weight: 20});
        }
      });
      //execute your code here  
    }
    var endTime = new Date().getTime();
    var diff = endTime - startTime;
    console.log("highlight trail time: " + diff);
  }


  // For a given trailhead or set of trailIDs, change the style weight to active
  function highlightTrailSegmentsForTrailhead(trailhead, highlightedTrailIndex, trailIDs) {
    console.log("highlightTrailSegmentsForTrailhead");

    var zoomType = "trailhead";
    var trail_system;
    if (trailhead) {
      trail_system = trailhead.properties.trail_systems[0];
      console.log("[highlightTrailSegmentsForTrailhead] trail_system = " + trail_system);
    } else if (trailIDs) {
      trail_system = trailIDs;
      zoomType = "trail";
    } else {
      zoomType = null;
    }
    //console.log("[getAllTrailPathsForTrailheadLocal] trails = " + trails);
    // allSegmentLayer.setStyle({weight: 0});
    var startTime = new Date().getTime();
    console.log("highlight start = " + startTime);
    if (currentHighlightedSegmentLayer) {
      currentHighlightedSegmentLayer.setStyle({weight: NORMAL_SEGMENT_WEIGHT});
    }

    currentHighlightedSegmentLayer = null;
    
    if (trail_system) {
      console.log("[highlightTrailSegmentsForTrailhead] trail_system = " + trail_system);
      currentHighlightedSegmentLayer = new L.FeatureGroup();
      
      allSegmentLayer.eachLayer(function (layer) {
        var layerTrailSystem = layer.getLayers()[0].feature.properties.trail_systems[0];
        //console.log("[highlightTrailSegmentsForTrailhead] layerTrailSystem = " + layerTrailSystem);
        var layerWanted = 0;
        if (layerTrailSystem) {
            if (layerTrailSystem == trail_system) {
              layerWanted = 1;
            } 
        }
        if (layerWanted) {
          layer.getLayers()[0].setStyle({weight: ACTIVE_TRAIL_WEIGHT});
          currentHighlightedSegmentLayer.addLayer(layer.getLayers()[0]);
          //layer.getLayers()[0].setStyle({weight: ACTIVE_TRAIL_WEIGHT});
          //layer.getLayers()[1].setStyle({weight: 20});
        }
      });
      //execute your code here
      
    }
    var endTime = new Date().getTime();
    var diff = endTime - startTime;
    console.log("highlight trail time: " + diff);
  }

  // merge multiple geoJSON trail features into one geoJSON FeatureCollection

  function mergeResponses(responses) {

    console.log("mergeResponses");
    // console.log(responses);

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

  // return the calculated CSS background-color for the class given
  // This may need to be changed since AJW changed it to "border-color" above

  function getClassBackgroundColor(className) {
    var $t = $("<div class='" + className + "'>").hide().appendTo("body");
    var c = $t.css("background-color");
    console.log(c);
    $t.remove();
    return c;
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
        console.log("zoomToLayer currentZoom < layerBoundsZoom");
        map.fitBounds(layer.getBounds(), {
          paddingTopLeft: centerOffset
        });
    }

      // otherwise, center on trailhead, with offset, and use MAX_ZOOM or MIN_ZOOM
      // with setView
    else {
      var boundsCenter = layer.getBounds().getCenter();
        map.setView(boundsCenter, currentZoom);
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
