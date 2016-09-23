var console = console || {
  "log": function() {}
};
console.log("start");

$(document).ready(startup);

// This function is used to set the max heights for PreserveInfo & SearchResults.
// It is called on body load and resize. It is also called when opening Detail panel.
function setHeights() {
      var h = $(window).height();
      var k = $('#fpccBrand').is(':visible') ? $('#fpccBrand').outerHeight() : 0;
      var l = $('#fpccBrandMobile').is(':visible') ? $('#fpccBrandMobile').outerHeight(true) : 0;
      var m = $("#fpccPreserveName").outerHeight();
      var o = $('#fpccSearchBack').is(':visible') ? $('#fpccSearchBack').outerHeight(true) : 0;
      var p = $('#fpccSearchStatus').is(':visible') ? $('#fpccSearchStatus').outerHeight(true) : 0;
      var q = $('#fpccSearchContainer').is(':visible') ? $('#fpccSearchContainer').outerHeight(true) : 0;
      console.log("[setHeights] h = " + h);
      console.log("[setHeights] k + l + m + o + p + q = " + k + " + " + l + " + " + m + " + " + o + " + " + p + " + " + q);
      var fpccSearchResultsHeight = (h-(k + l + o + p + q));
      console.log("[setHeights] fpccSearchResultsHeight= " + fpccSearchResultsHeight);
      $('#fpccSearchResults').css('max-height',fpccSearchResultsHeight );
      var SMALL = false;
      if (Modernizr.mq("only screen and (max-width: 768px)")) {
        SMALL = true;
      } else if (Modernizr.mq("only screen and (min-width: 769px)")) {
        SMALL = false;
      }
      var fpccPreserveInfoHeight = 0;
      if (SMALL) {
        console.log("[setHeights] yes small");
        fpccPreserveInfoHeight = (h-(l + m + o));
        $('#fpccPreserveInfo').css('min-height', fpccPreserveInfoHeight );
        $('#fpccSearchResults').css('min-height',fpccSearchResultsHeight );
      } else {
        fpccPreserveInfoHeight = (h-(k + m + o + q));
        console.log("[setHeights] no small");
      }
      $('#fpccPreserveInfo').css('max-height', fpccPreserveInfoHeight );
      console.log("[setHeights] #fpccPreserveInfoHeight= " + fpccPreserveInfoHeight);

      
}

/* The Big Nested Function
==========================*/

// Print to ensure file is loaded

function startup() {
  "use strict";

  console.log("trailhead.js");

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
  var API_HOST = "https://fpcc-staging.smartchicagoapps.org";
 
  if (window.location.hostname.split(".")[0] == "localhost") {
    document.title = "LOCALHOST | Map: Forest Preserves of Cook County";
  } else if (window.location.hostname.split(".")[0] == "fpcc-staging") {
    document.title = "STAGING | Map: Forest Preserves of Cook County";
  } else if (window.location.hostname.split(".")[0] = "smartchicago") {
    document.title = "gh-pages | Map: Forest Preserves of Cook County";
    API_HOST = "https://fpcc-staging.smartchicagoapps.org";
  } else if (window.location.hostname.split(".")[0] = "fpcc") {
    document.title = "Map: Forest Preserves of Cook County";
    API_HOST = "https://fpcc.smartchicagoapps.org";
  } 
  //API_HOST = "http://localhost:8080";
  // console.log("API_HOST = " + API_HOST);
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
  //var USE_COMPLEX_SEGMENT_LAYER = SMALL ? false : true;
  var USE_COMPLEX_SEGMENT_LAYER = true;
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
  var trailSubsystemMap = {}; // map 

  var originalTrailheads = []; // all trailheads (from trailsegments)
  
  var currentTrailheads = [];
  var currentUserLocation = {};
  var anchorLocation = {};



  var currentFilters = {
    lengthFilter: [],
    activityFilter: [],
    searchFilter: "",
    location: null,
    zipMuniFilter: "",
    trailInList: true,
    trailOnMap: true
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

  var originalPicnicgroves = {};
  
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
  var picnicgrovesFetched = false;
  var allDataFetched = false;
  
  var secondaryTrails = {};

  // Search variables
  var searchZipcode = null;
  var searchLocation = null;
  
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
  $('#fpccSearchBack').click(fpccBackClick);
  //.click(closeDetailPanel).click(readdSearchURL);
  //$('.filter').change(filterChangeHandler);

  //$(".fpccSearchbox").keyup(function(e) { processSearch(e); });
  $(".fpccSearchbox").change(function(e) { processSearch(e); });
  $(".offsetZoomControl").click(offsetZoomIn);
  $("#fpccSearchButton").click(processSearch);
  $("#fpccMobileCheckbox").click(showfpccMainContainer);

  //$(".fpccSearchsubmit").click(processSearch);
  //$(".fpccSearchbox").keyup(function(e) { processSearch(e); });


  $(".geolocateButton").click(centerOnLocation);

  $('.detailPanelBanner').click(slideDetailPanel);

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
    console.log("externalChange event = " + event.parameters);
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
    //var searchFilter = $.address.parameter('search');/%20/g
    
    var searchFilter = decodeURIComponent($.address.parameter('search')).replace(/\+/g, ' ');
    var poi  = decodeURIComponent($.address.parameter('poi')).replace(/\+/g, ' ');
    var trail  = decodeURIComponent($.address.parameter('trail')).replace(/\+/g, ' ');
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
    } else if (searchFilter) {
      console.log("[addressChange] IF searchFilter = " + searchFilter);
      var selectize = $select[0].selectize;
      selectize.clear(true);
      var filterItems = searchFilter.split(",");
      $.each(filterItems, function(key, value) {
        selectize.createItem(value, false);
      });
      //selectize.createItem(searchFilter, false);
    }

  }




  // =====================================================================//
  // Kick things off


  if ($("html").hasClass("lt-ie8")) {
     return;  //abort, dont load
  }
  initialSetup();

  // =====================================================================//
 
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
      fetchTrailsegments(function() { trailsegmentsFetched = true; });
      fetchTrailheads(currentUserLocation, function() { trailheadsFetched = true; });
      fetchTraildata(function() { traildataFetched = true; });
      fetchActivities(function() { activitiesFetched = true; });
      fetchPicnicgroves(function() { picnicgrovesFetched = true; });
      
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
      // if (SMALL &&($(".slideDrawer").hasClass("closedDrawer")) ){
      //   highlightTrailhead(orderedTrails[0].trailheadID, 0);
      //   showTrailDetails(orderedTrails[0].trail, orderedTrails[0].trailhead);
      // }
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
    var filterType = "activityFilter";
    console.log("[processSearch]");
    var currentUIFilterState;
    currentUIFilterState = $('#desktop .fpccSearchbox').val();
    if (($currentTarget).hasClass('fpccSearchbox')) {
      // if (SMALL) {
      //   if (e.keyCode === 13) {
      //     updateFilterObject(filterType, currentUIFilterState);
      //   }
      // } else {
        clearTimeout(searchKeyTimeout);
        searchKeyTimeout = setTimeout(function () {
          console.log("[processSearch] searchKeyTimeout currentUIFilterState = " + currentUIFilterState);
          updateFilterObject(filterType, currentUIFilterState);
        }, 800);
      //}
    } else if (($currentTarget).hasClass('fpccButton')) {
      updateFilterObject(filterType, currentUIFilterState);
    }
  }

  function updateFilterObject(filterType, currentUIFilterState) {
    console.log("[updateFilterObject] currentUIFilterState = " + currentUIFilterState);
    var matched = 0;

    // Which tags should show trail system in results list
    var tagsInTrailsPanel = [];
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["bike_rental","bicycle rental", "bike rental"]);
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["cycling","biking", "bicycle", "bike", "mtb", "mountain"]);
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["birding","birdwatching", "bird"]);
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["cross_country","cross country", "ski"]);
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["dog_leash","dog leash", "dog"]);
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["hiking","walking", "running", "hike", "walk", "run", "jog", "jogging"]);
    tagsInTrailsPanel = tagsInTrailsPanel.concat(["equestrian","horse riding", "horse"]);

    // Which tags should NOT should up on map
    var tagsExcludeTrailsMap = [];
    tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(["drone"]);
    tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(["m_airplane"]);
    tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(["snowmobile","snowmachine"]);
    tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(["swimming","swim", "pool", "aquatic"]);



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
      currentFilters.trailOnMap = true;
      currentFilters.trailInList = true;
      console.log("[updateFilterObject] lastZipMuni, currentZipMuni = " + lastFilters.zipMuniFilter + ", " + currentFilters.zipMuniFilter );
      if (currentUIFilterState) {   
        var searchLink =  encodeURIComponent(currentUIFilterState);
        searchLink = searchLink.replace(/%20/g, '+');
        $.address.parameter('search', searchLink);
        $.address.parameter('trail', null);
        $.address.parameter('poi', null);
        $.address.update();

        console.log("[updateFilterObject] in currentUIFilterState if statement");
        currentFilters.activityFilter = String(currentUIFilterState).split(",");
        console.log("[updateFilterObject] new currentFilters.activityFilter.length + activityFilter= " + currentFilters.activityFilter.length + " - " + currentFilters.activityFilter);
        var removeIndex = null;
        currentFilters.activityFilter = currentFilters.activityFilter.filter(Boolean);
        currentFilters.activityFilter.forEach(function(value, index) {
          var normalizedValue = value.toLowerCase();
          if (!(zipCodeLocations[normalizedValue] === undefined)) {
            console.log("[updateFilterObject] zip lat,lon = " + zipCodeLocations[normalizedValue]['latitude'] + ", " + zipCodeLocations[normalizedValue]['longitude'] );
            currentFilters.location = new L.LatLng(zipCodeLocations[normalizedValue]['latitude'], zipCodeLocations[normalizedValue]['longitude']);
            currentFilters.zipMuniFilter = normalizedValue;
            removeIndex = index;
          } else if (!(muniLocations[normalizedValue] === undefined)) {
            currentFilters.location = new L.LatLng(muniLocations[normalizedValue]['latitude'], muniLocations[normalizedValue]['longitude']);
            currentFilters.zipMuniFilter = normalizedValue;
            console.log("[updateFilterObject] muni loc, zipMuniFilter= " + currentFilters.location + ", " + currentFilters.zipMuniFilter);
            removeIndex = index;  
          } else {
            currentFilters.trailInList = false;
            currentFilters.trailOnMap = true;
            if ( tagsInTrailsPanel.indexOf(normalizedValue) > -1 ) {
              currentFilters.trailInList = true;
            }
            if ( tagsExcludeTrailsMap.indexOf(normalizedValue) > -1 ) {
              currentFilters.trailOnMap = false;
            }
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
        currentFilters.trailInList = true;
        currentFilters.trailOnMap = true;
        $.address.parameter('search', null);
        $.address.update();
      }
      console.log("[updateFilterObject] activityFilterLength = " + activityFilterLength);
      console.log("[updateFilterObject] currentFilters.activityFilter = " + currentFilters.activityFilter);
    }

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

  function filterResults2(trailhead) {
    var matched = 1;
    var term = 1;
    //console.log("[filterResults] initial matched = " + matched);
    var currentFiltersActivityFilterLength = currentFilters.activityFilter.length;
    if (currentFiltersActivityFilterLength > 0) {
      var normalizedNames = [];
      var normalizedTrailDescription = "";
      if(trailhead.properties.direct_trail_id) {
        //console.log("[filterResults2] trailhead.properties.direct_trail_id = " + trailhead.properties.direct_trail_id);
        var trailheadTrail = originalTrailData[trailhead.properties.direct_trail_id];
        //console.log("[filterResults2] trailheadTrail.direct_trail_id = " + trailheadTrail.direct_trail_id);
        if (trailheadTrail) {
          normalizedNames.push(trailheadTrail.trail_subsystem.toLowerCase());
          if (trailheadTrail.alt_name) {
            normalizedNames.push(trailheadTrail.alt_name.toLowerCase());
          }
          if (trailheadTrail.trail_desc) {
            normalizedTrailDescription = trailheadTrail.trail_desc.toLowerCase();
          }
        }
      }
      
      var normalizedTrailheadNames = [];
      if (trailhead.properties.name) {
        normalizedNames.push(trailhead.properties.name.toLowerCase());
      }
      if (trailhead.properties.alt_names) {
        trailhead.properties.alt_names.forEach(function(value, index) {
          normalizedNames.push(value.toLowerCase());
        });
      }
      var normalizedTrailheadDescription = "";
      if (trailhead.properties.description) {
        normalizedTrailheadDescription = trailhead.properties.description.toLowerCase();
      }
      var normalizedTrailheadAddress = "";
      if (trailhead.properties.web_street_addr) {
        normalizedTrailheadAddress = trailhead.properties.web_street_addr.toLowerCase();
      }

      var normalizedNamesLength = normalizedNames.length;
      //console.log("[filterResults] currentFilters.activityFilter exists.." + currentFilters.activityFilter.length);
      for (var i = 0; i < currentFilters.activityFilter.length; i++) {
        var activity = currentFilters.activityFilter[i];
        console.log("[filterResults] activityFilter = " + activity);
        //console.log("trailhead.properties[activity] = " + trailhead.properties[activity]);
        var trailheadActivity = 0;
        var trailheadTag = 0;
        term = 0;
        var normalizedSearchFilter = currentFilters.activityFilter[i].toLowerCase();
        var normalizedSearchArray = normalizedSearchFilter.split(" ");
        var normalizedSearchArrayLength = normalizedSearchArray.length;
        //console.log("[filterResults2] normalizedSearchArray = " + normalizedSearchArray);
        //console.log("[filterResults2] normalizedSearchArrayLength = " + normalizedSearchArrayLength);
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
        //var nameTrailMatched = !! normalizedTrailName.match(searchRegex);
        //var nameTrailheadMatched = !! normalizedTrailheadName.match(searchRegex);
        var addressTrailheadMatched = !! normalizedTrailheadAddress.match(searchRegex);
        var descriptionTrailMatched = !! normalizedTrailDescription.match(searchRegex);
        var descriptionTrailheadMatched = !! normalizedTrailheadDescription.match(searchRegex);
        var nameMatched = false;
        //console.log("[filterResults2] normalizedNames = " + normalizedNames);
        for (var normalizedNamesIndex = 0; normalizedNamesIndex < normalizedNamesLength; normalizedNamesIndex++) {
          var thisNormalizedName = normalizedNames[normalizedNamesIndex];
          //console.log("[filterResults2] normalizedNamesIndex: val = " + normalizedNamesIndex + " : " + thisNormalizedName);
          if((!! thisNormalizedName.match(searchRegex)) ) {
            nameMatched = true;
            //console.log("[filterResults2] In First match = true nameMatched = " + nameMatched);
            normalizedNamesIndex = 100000000000000000000;  // Return false to break out of $.each loop
          } else {
            var subMatched = true;
            //console.log("[filterResults2] In else for thisNormalizedName= " + thisNormalizedName);
            for (var searchIndex = 0; searchIndex < normalizedSearchArrayLength; searchIndex++) {
              var thisSearchElement = normalizedSearchArray[searchIndex];
              var elementSearch = thisNormalizedName.search(thisSearchElement);
              //console.log("[filterResults2] thisSearchElement:elementSearch= " + thisSearchElement + ":" + elementSearch);
              if (elementSearch == -1) {
                //console.log("[filterResults2] In elementSearch = -1");
                subMatched = false;
                searchIndex = 100000000000000000000;
              }
            }
            if (subMatched) {
              nameMatched = true;
            }
          }
          //console.log("[filterResults2] nameMatched for nameIndex: " + normalizedNamesIndex + " - " + nameMatched);
        }
        //console.log("filterResults2] normalizedNames : nameMatched = " + normalizedNames + ":" + nameMatched);
        //console.log("[filterResults] activityFilter = " + activity);
        //console.log("[filterResults] tags = " + trailhead.properties.tags);


        if ( nameMatched ) {
          //console.log("[filterResults2] normalizedNames: in if = " + normalizedNames);
          term = 10;
        } else if ((descriptionTrailMatched) || (descriptionTrailheadMatched)) {
          term = 1;
        } else if ((trailhead.properties.tags) && (trailhead.properties.tags[':panel']) && (trailhead.properties.tags[':panel'].indexOf(normalizedSearchFilter) > -1 )) {
          term = 1;
        } else if ((trailhead.properties.tags) && (trailhead.properties.tags[':search']) && (trailhead.properties.tags[':search'].indexOf(normalizedSearchFilter) > -1 )) {
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
    
      var currentMarkerDivs = $(".leaflet-marker-pane").find(".icon-map");
      currentMarkerDivs.addClass('icon-' + zoomLevel).removeClass('icon-' + lastZoom);
   
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
      path: "/poi_infos.json"
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
      var activityType = currentFeature.properties.atype;
      var activityName = currentFeature.properties.name || currentFeature.properties.aname;
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
      } else if (activityType == "canoe landing") {
        iconType = "icon-canoe-landing";
      } else if (activityType == "dog park") {
        iconType = "icon-off-leash-dog-area";
      } else if (activityType == "drone") {
        iconType = "icon-drone";
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
       } else if  (activityType == "headquarters") {
        iconType = "icon-facility";
      } else if  (activityType == "model airplane flying field") {
        iconType = "icon-model-airplane";
       } else if  (activityType == "nature center") {
        iconType = "icon-nature-center";
      } else if  (activityType == "pavillion") {
        iconType = "icon-facility";
      } else if  (activityType == "recreational waterbody") {
        // iconName = activityName;
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
        html: '<svg class="icon icon-map icon-activity ' + iconType + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconType + '"></use></svg><br />',
        iconAnchor: [13 * 0.60, 33 * 0.60],
        popupAnchor: [0, -20],
        iconSize: null
      });

      var newMarker = null;

      if (iconType) {
        newMarker = new L.Marker(currentFeatureLatLng, {
          icon: activityIcon,
          alt: activityType,
          zIndexOffset: -50
        });
      
        var activity = {
          properties: currentFeature.properties,
          geometry: currentFeature.geometry,
          marker: newMarker,
          popupContent: popupContentMainDivHTML
        };

        setActivityEventHandlers(activity);
        activity.marker.bindPopup(activity.popupContent);
        originalActivities[activity.properties.poi_info_id] = originalActivities[activity.properties.poi_info_id] || [];
        originalActivities[activity.properties.poi_info_id].push(activity);
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
    var trailhead = getTrailheadById(activity.properties.poi_info_id);
    
    if (trailhead) {
      showTrailDetails(null, trailhead);
      if ( lastTrailheadId != activity.properties.poi_info_id ) {
        highlightTrailhead(activity.properties.poi_info_id);
        highlightActivities(activity.properties.poi_info_id);
        var trailSubsystem = null;
        if (trailhead.properties.direct_trail_id) {
          trailSubsystem = originalTrailData[trailhead.properties.direct_trail_id].trail_subsystem;
        }
        highlightTrailSegmentsForTrailSubsystem(trailSubsystem);
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

   // =====================================================================//
  // Getting picnicgrove data

  function fetchPicnicgroves(callback) {
    console.log("fetchPicnicgroves");
    var callData = {
      type: "GET",
      path: "/picnicgroves.json"
    };
    makeAPICall(callData, function(response) {
      populateOriginalPicnicgroves(response);
      if (typeof callback == "function") {
        callback(response);
      }
    });
  }

  function populateOriginalPicnicgroves(PicnicgroveDataGeoJSON) {
    console.log("[populateOriginalPicnicgroves] features count = " + PicnicgroveDataGeoJSON.features.length);
    var originalPicnicgroveFeatureGroup = new L.FeatureGroup();
    originalPicnicgroveFeatureGroup.addTo(map);

    for (var i = 0; i < PicnicgroveDataGeoJSON.features.length; i++) {
      var currentFeature = PicnicgroveDataGeoJSON.features[i];
      var currentFeatureLatLng = new L.LatLng(currentFeature.geometry.coordinates[1], currentFeature.geometry.coordinates[0]);
      var iconType = null;
      var popupContentMainDivHTML = "<div class='picnicgrove-popup'>";
      popupContentMainDivHTML += currentFeature.properties.preserve_name;
      popupContentMainDivHTML += " Grove #" + currentFeature.properties.grove;
      popupContentMainDivHTML += "</div>";
      var iconName = "icon-picnic-grove";

      if (currentFeature.properties.picnicgrove_type == 'shelter') {
        iconName = "icon-picnic-grove-shelter";
      }

      var picnicgroveIcon = L.divIcon({
        className: 'icon-map picnic-grove-marker '+ iconName + ' notselected picnicgrove-' + currentFeature.properties.id + ' poi-' + currentFeature.properties.poi_info_id,
        html: '<svg class="icon icon-map picnic-grove-marker ' + iconName + '"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#' + iconName + '"></use></svg><br />',
        iconAnchor: [13 * 0.60, 33 * 0.60],
        popupAnchor: [0, -20],
        iconSize: null
      });

      var newMarker = null;

        newMarker = new L.Marker(currentFeatureLatLng, {
          icon: picnicgroveIcon,
          alt: popupContentMainDivHTML,
          zIndexOffset: -50
        });
      
        var picnicgrove = {
          properties: currentFeature.properties,
          geometry: currentFeature.geometry,
          marker: newMarker,
          popupContent: popupContentMainDivHTML
        };

        setPicnicgroveEventHandlers(picnicgrove);
        picnicgrove.marker.bindPopup(picnicgrove.popupContent);
        originalPicnicgroves[picnicgrove.properties.poi_info_id] = originalPicnicgroves[picnicgrove.properties.poi_info_id] || [];
        originalPicnicgroves[picnicgrove.properties.poi_info_id].push(picnicgrove);
        originalPicnicgroveFeatureGroup.addLayer(picnicgrove.marker);
      
    } 
  }

  function setPicnicgroveEventHandlers(picnicgrove) {
    picnicgrove.marker.on("click", function(picnicgrove) {
      return function() {
        picnicgroveMarkerClick(picnicgrove);
      };
    }(picnicgrove));
  }

  function picnicgroveMarkerClick(picnicgrove) {
    console.log("picnicgroveMarkerClick");
    var lastTrailheadId = "";
    if (currentTrailhead) {
      lastTrailheadId = currentTrailhead.id;
    }
    console.log("lastTrailheadId = " + lastTrailheadId);
    var trailhead = getTrailheadById(picnicgrove.properties.poi_info_id);
    
    if (trailhead) {
      showTrailDetails(null, trailhead);
      if ( lastTrailheadId != picnicgrove.properties.poi_info_id ) {
        highlightTrailhead(picnicgrove.properties.poi_info_id);
        highlightActivities(picnicgrove.properties.poi_info_id);
        var trailSubsystem = null;
        if (trailhead.properties.direct_trail_id) {
          trailSubsystem = originalTrailData[trailhead.properties.direct_trail_id].trail_subsystem;
        }
        highlightTrailSegmentsForTrailSubsystem(trailSubsystem);
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
          // originalTrailheads[otnum].signMarker.setLatLng(newOtLatLng);
          originalTrailheads[otnum].geometry.coordinates[0] = otGeoTwo;
          break;
        }
      }
      var currentFeatureLatLng = new L.LatLng(currentGeoOne, currentGeoTwo);   
      
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
        icon: trailheadIcon2,
        zIndexOffset: 50
      });
      signMarker.trailheadID = currentFeature.properties.id;
      //console.log("signMarker.trailheadID = " + signMarker.trailheadID);
      var trailhead = {
        properties: currentFeature.properties,
        geometry: currentFeature.geometry,
        marker: signMarker,
        popupContent: ""
      };
      setTrailheadEventHandlers(trailhead);
      originalTrailheads.push(trailhead);
      originalTrailheadFeatureGroup.addLayer(trailhead.marker);
    }
   
    console.log("[populateOriginalTrailheads] originalTrailheads count " + originalTrailheads.length );
  }

  function setTrailheadEventHandlers(trailhead) {
    trailhead.marker.on("click", function(trailheadID) {
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
    var trailSubsystem = trailhead.properties.trail_subsystem || null;
    // if (trailhead.properties.trail_subsystem) {
    //   trail_subsystem = trailhead.properties.trail_systems[0];
    // }
    highlightTrailSegmentsForTrailSubsystem(trailSubsystem);
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
        var originalActivitiesTrailhead_idLength = originalActivities[trailhead_id].length;
        for ( var j = 0; j < originalActivitiesTrailhead_idLength; j++ ) {
          var myActivityID = "activity-" + originalActivities[trailhead_id][j].properties.id;
          //console.log("[makeCurrentActivities] myActivityID = " + myActivityID);
          var currentActivityDivs = document.getElementsByClassName(myActivityID);
          //console.log("[makeCurrentActivities] new currentActivityDivs.length = " + currentActivityDivs.length);
          var currentActivityDivsLength = currentActivityDivs.length;
          for (var k = 0; k < currentActivityDivsLength; k++) {
            //console.log("[highlightActivities] new currentActivityDivs loop k = " + k);
            currentActivityDivs[k].classList.add('active');
            currentActivityDivs[k].classList.remove('inactive');
          }
          //originalActivities[trailhead_id][j].marker.setOpacity(.5);
        }
      }
    }
    console.log("[makeCurrentActivities] end");
  }

  function highlightActivities(myTrailhead_id) {
    console.log("[highlightActivities] myTrailhead_id = " + myTrailhead_id);
    var currentActivityDivs = $(".leaflet-marker-pane").find(".icon-activity.selected");
    currentActivityDivs.removeClass('selected');
    var currentPicnicgroveDivs = $(".leaflet-marker-pane").find(".picnic-grove-marker.selected");
    currentPicnicgroveDivs.addClass('notselected').removeClass('selected');
   
    highlightedActivityMarkerArray = [];
    if (myTrailhead_id) {
      var trailheadActivities = originalActivities[myTrailhead_id];
      var trailheadPicnicgroves = originalPicnicgroves[myTrailhead_id];
      if (trailheadActivities) {
        var trailheadActivitiesLength = trailheadActivities.length;
        for ( var i = 0; i < trailheadActivitiesLength; i++) {
          //trailheadActivities[i].marker.setOpacity(1);
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
      if (trailheadPicnicgroves) {
        var trailheadPicnicgrovesLength = trailheadPicnicgroves.length;
        for ( var i = 0; i < trailheadPicnicgrovesLength; i++) {
          highlightedActivityMarkerArray.push(trailheadPicnicgroves[i].marker);
        }
      }
      var picnicgroveDivs = $(".leaflet-marker-pane").find(".picnic-grove-marker.poi-" + myTrailhead_id);
      picnicgroveDivs.addClass('selected').removeClass('notselected');
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
      path: "/trails_infos.json"
    };
    makeAPICall(callData, function(response) {
      populateTrailData(response);
      if (typeof callback == "function") {
        callback();
      }
    });
  }

  function populateTrailData(trailDataGeoJSON) {
    originalTrailData = {};
    trailSubsystemMap = {};

    for (var i = 0; i < trailDataGeoJSON.features.length; i++) {
      originalTrailData[trailDataGeoJSON.features[i].properties.direct_trail_id] = trailDataGeoJSON.features[i].properties;
      trailSubsystemMap[trailDataGeoJSON.features[i].properties.trail_subsystem] = trailSubsystemMap[trailDataGeoJSON.features[i].properties.trail_subsystem] || [];
      trailSubsystemMap[trailDataGeoJSON.features[i].properties.trail_subsystem].push(trailDataGeoJSON.features[i].properties);
    }
    // sort by value
   
    //Object.keys(secondaryTrails).forEach(function (key) {
    //console.log("[PopulateTrailData] originalTrailData[0].properties.subtrail_length_mi = " + originalTrailData[0].properties.subtrail_length_mi);
    //currentTrailData = originalTrailData.slice(0);
  }

  function fetchTrailsegments(callback) {
    console.log("fetchTrailsegments");
    var callData = {
      type: "GET",
      path: "/new_trails.json"
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
        //var thisSecondaryTrail = feature.properties.secondary_trail_ids[0];
        var thisTrailType = feature.properties.trail_type;
        // if (originalTrailData[thisSecondaryTrail]) {
        //   thisTrailType = originalTrailData[thisSecondaryTrail].properties.trail_type;
        // }
        if (thisTrailType == 'paved') {
          thisDash = null;
        } else {
          thisDash = "5,10";
        }
  
        switch (feature.properties.trail_color.toLowerCase()) {
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
                case 'future extension': thisColor = "58595B"; break;
        }
        if (feature.properties.off_fpdcc == 'y') {
          thisColor = NORMAL_SEGMENT_COLOR;
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
      var segmentTrailSubsystem = invisLayer.feature.properties.trail_subsystem || null;
      if (segmentTrailSubsystem) {
        var trailPopupLineDiv;
        trailPopupLineDiv = "<div class='trail-popup-line trail-popup-line-named' " +
          "data-trailsubsystem='" + segmentTrailSubsystem + "' " +
          "data-trailid='" + segmentTrailSubsystem + "' " +
          "data-trailname='" + segmentTrailSubsystem + "'> " +
          segmentTrailSubsystem + //" Trail System" +
          "</div>";
        atLeastOne = true;
        popupHTML = popupHTML + trailPopupLineDiv;
      }
      popupHTML = popupHTML + "</div>";

      invisLayer.feature.properties.popupHTML = popupHTML;
      var eventType = "click";

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
              var trailSubsystem = invisLayer.feature.properties.trail_subsystem;
              console.log("[trail click] " + trailSubsystem);
              showTrailDetails(trailSubsystem, null);
              highlightTrailSegmentsForTrailSubsystem(trailSubsystem);
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
    currentTrailData = [];
    var currentTrailIDs = {};
    
    for (var j = 0; j < myTrailheads.length; j++) {
      var trailhead = myTrailheads[j];
      trailhead.properties.filterResults = 0;
      var trailheadWanted = 0;
      trailhead.properties.filterResults = filterResults2(trailhead);
      trailhead.properties.filterScore = trailhead.properties.filterResults;
      if (trailhead.properties.filterResults > 0) {
        trailheadWanted = true;
        var thisTrailSubsystem = trailhead.properties.trail_subsystem;
        //console.log("[addTrailsToTrailheads] thisTrailSubsystem = " + thisTrailSubsystem);
        currentTrailIDs[thisTrailSubsystem] = 1;
      }
      if (trailheadWanted) {
        currentTrailheads.push(trailhead);
      }
    }
    
    console.log("currentTrailheads count = " + currentTrailheads.length);
    setTimeout(function() {
      //fixDuplicateTrailheadTrails(myTrailheads);
      makeCurrentActivities(currentTrailheads);
      makeTrailheadPopups(currentTrailheads);
      mapActiveTrailheads(currentTrailheads);
      //console.log("[addTrailsToTrailheads] currentFilters.trailOnMap= " + currentFilters.trailOnMap);
      
      allSegmentLayer.eachLayer(function (layer) {
        //console.log("trail_ids= " + layer.getLayers()[0].feature.properties.trail_ids);
        //console.log("trail_systems= " + layer.getLayers()[0].feature.properties.trail_systems);
        if (layer.getLayers()[0].feature.properties.trail_subsystem) {
          var layerWanted = 0;

          if (currentTrailIDs[layer.getLayers()[0].feature.properties.trail_subsystem] && currentFilters.trailOnMap) {
            //console.log("[allSegmentLayer true] layer.getLayers()[0].feature.properties.trail_subsystem= " + layer.getLayers()[0].feature.properties.trail_subsystem);
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
            // highlightTrailhead(orderedTrails[0].trailheadID, 0);
            // orderedTrailIndex = 0;
            // showTrailDetails(orderedTrails[0].trail, orderedTrails[0].trailhead);
          }
        }, 0);
      }, 0);
    }, 0);
  }

  // given the trailheads,
  // make the popup menu content for each one, including each trail present
  // and add it to the trailhead object

  function makeTrailheadPopups() {
    console.log("makeTrailheadPopups start");
    for (var trailheadIndex = 0; trailheadIndex < originalTrailheads.length; trailheadIndex++) {
      var trailhead = originalTrailheads[trailheadIndex];

      var popupContentMainDivHTML = "<div class='trailhead-popup'>";
      var popupTrailheadDivHTML = "<div class='trailhead-box'><div class='popupTrailheadNames'>" + trailhead.properties.name + "</div>";
      popupContentMainDivHTML = popupContentMainDivHTML + popupTrailheadDivHTML;
      if (trailhead.properties.direct_trail_id)  {
        var trailheadTrail = originalTrailData[trailhead.properties.direct_trail_id];
        var popupTrailDivHTMLStart = "<div class='trailhead-trailname trail" + 1 + "' " +
        "data-trailname='" + trailheadTrail.trail_subsystem + "' " +
        "data-trailid='" + trailheadTrail.trail_subsystem + "' " +
        "data-trailheadname='" + trailheadTrail.trail_subsystem + "' " +
        "data-trailheadid='" + trailheadTrail.trail_subsystem + "' " +
        "data-index='" + 1 + "'>";
        var statusHTML = "";
        var trailNameHTML = "<div class='popupTrailNames'>" + trailheadTrail.trail_subsystem + "</div><b></b>";
        var popupTrailDivHTML = popupTrailDivHTMLStart + statusHTML + trailNameHTML + "</div>";
        popupContentMainDivHTML = popupContentMainDivHTML + popupTrailDivHTML;
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
      currentTrailheadSignArray.push(myTrailheads[i].marker);
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
      if (currentFilters.zipMuniFilter) {
        var locationBounds = L.latLngBounds(currentFilters.location, currentFilters.location);
        map.panInsideBounds(locationBounds);
      }
    }
    activeTrailheadsMapped = true;
    console.log("mapActiveTrailheads end");
  }


  // given trailheads, now populated with matching trail names,
  // make the trail/trailhead combination divs
  // noting if a particular trailhead has no trails associated with it

  function makeTrailDivs(myTrailheads) {
    console.log("makeTrailDivs");
    
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
      var trailheadType = trailhead.properties.point_type;
      var trailheadID = trailhead.properties.id;
      var trailheadTrailSubsystem = null;
      var trailheadTrail = originalTrailData[trailhead.properties.direct_trail_id];
      if (trailheadTrail) {
        trailheadTrailSubsystem = trailheadTrail.trail_subsystem;
      }
      var trailheadDistance = metersToMiles(trailhead.properties.distance);
      // Making a new div for text / each trail
  
      if (trailheadTrailSubsystem) {
        var trailID = trailheadTrailSubsystem;
        var trail = trailheadTrailSubsystem;
        var trailName = trailheadTrailSubsystem;
        var trailLength = null //Number(Math.round(originalTrailData[trailID].properties.length +'e2')+'e-2');
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

      //var trailSourceText = "<div class='trailSource' id='" + trailheadSource + "'>" + trailheadSource + "</div></div>";
      var trailDivComplete = trailDivText + trailheadInfoText;
      trailListContents = trailListContents + trailDivComplete;
      divCount++;
     
      //console.log("[makeTrailDivs] trailList[trailName] = " + trailList[trailName]);
      //console.log("[makeTrailDivs] trailheadTrailSubsystem = " + trailheadTrailSubsystem);

      if ((!trailList[trailName]) && trailheadTrailSubsystem && currentFilters.trailInList) {
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
        trailDivComplete = trailDivText + trailheadInfoText;
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
    closeDetailPanel();
    console.log("end makeTrailDivs 4");
    makeTrailDivsEnded = true;
  }

  function trailDivClickHandler(e) {
    var $myTarget = $(e.currentTarget);
    var divTrailID = $myTarget.attr("data-trailid");
    var divTrailName = $myTarget.attr("data-trailname");
    console.log(divTrailID);
    var trailSubsystem = null;
    var divTrailheadID = $myTarget.attr("data-trailheadid");
    var divTrailheadName = $myTarget.attr("data-trailheadname");
    var trailheadID = null;
    
    if (divTrailID) {
      trailSubsystem = divTrailID;
      trailDivWork(trailSubsystem, null);
    } else {   
      trailDivWork(null, divTrailheadID);
    }  
  }

  function median(sequence) {
    sequence.sort();  // note that direction doesn't matter
    return sequence[Math.ceil(sequence.length / 2)];
  }


  function trailDivWork(trailSubsystem, trailheadId) {
    if (trailSubsystem) {
      showTrailDetails(trailSubsystem, null);
    } else {   
      var divTrailhead = getTrailheadById(trailheadId);
      console.log("[trailDivWork] about to showTrailDetails(divTrail, divTrailhead)");
      // var numbers = [];
      // for (var i=0; i < 10; i++) {
      //   var t0 = performance.now();
      showTrailDetails(null, divTrailhead);
      //   var t1 = performance.now();
      //   numbers.push(t1 - t0);
      // }
      // console.log('Median time', median(numbers).toFixed(4), 'milliseconds');
      //console.log("[trailDivClickHandler] trailSystem is null");
      if (divTrailhead.properties.direct_trail_id) {
        trailSubsystem = originalTrailData[divTrailhead.properties.direct_trail_id].trail_subsystem;
      }  
    }
    highlightTrailSegmentsForTrailSubsystem(trailSubsystem);
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
  function showTrailDetails(trailSubsystemName, trailhead) {
    console.log("showTrailDetails");
    
    var trailheadLink = null;
    var trailLink = null;
    if (trailSubsystemName) {
      trailhead = null;
      trailLink =  encodeURIComponent(trailSubsystemName);
      trailLink = trailLink.replace(/%20/g, '+');
    } else {
      trailSubsystemName = null;
      trailheadLink = encodeURIComponent(trailhead.properties.id + "-" + trailhead.properties.name);
      trailheadLink = trailheadLink.replace(/%20/g, '+');
    }

    //var numbers = [];
    // for (var i=0; i < 20; i++) {
    //  var t0 = performance.now();
      decorateDetailPanel(trailSubsystemName, trailhead);
    //  var t1 = performance.now();
    //  numbers.push(t1 - t0);
    //}
    //console.log('Median time', median(numbers).toFixed(4), 'milliseconds');

    $.address.parameter('trail', trailLink);  
    $.address.parameter('poi', trailheadLink);
    $.address.parameter('search', null);
    $.address.update();
    showDetailPanel(true);
    if ($('.detailPanel').is(':hidden')) {
      //decorateDetailPanel(trail, trailhead);
      openDetailPanel();
      currentDetailTrail = trailSubsystemName;
      currentDetailTrailhead = trailhead;
    } else {
        //decorateDetailPanel(trail, trailhead);
        currentDetailTrail = trailSubsystemName;
        currentDetailTrailhead = trailhead;
    }
  }


  //  Helper functions for ShowTrailDetails

  function openDetailPanel() {
    console.log("openDetailPanel");
    $('.aboutPage').hide();

    // New versions

    $('#fpccSearchStatus').hide();
    $('#fpccSearchResults').hide();
    $('#fpccSearchBack').show();
    $('.detailPanel').show();

    $('#fpccPreserveInfo').scrollTop(0);

    // We need to re-calculate the max height for fpccPreserveInfo because 
    // fpccPreserveName height can change.
    if (!SMALL) {
    }
    if (SMALL) {
      $('#fpccMainContainer').hide();
      $(".detailPanel").removeClass("contracted");
      $(".detailPanel").addClass("expanded");
      /*$(".trailListColumn").removeClass("contracted");
      $(".trailListColumn").addClass("expanded");*/
      if ($(".slideDrawer").hasClass("openDrawer")) {
        console.log("slide drawer is open");
        $(".slideDrawer").removeClass("openDrawer");
        $(".slideDrawer").addClass("closedDrawer");
        $(".detailPanel").removeClass("hidden");

      }
    }
    $('.trailhead-trailname.selected').addClass("detail-open");
    setHeights(); 

    //$(".detailPanel .detailPanelPicture")[0].scrollIntoView();
    // map.invalidateSize();
  }

  function fpccBackClick() {
    console.log("[fpccBackClick]");
    if (SMALL) {
      if (document.getElementById("fpccMobileCheckbox").checked) {

      } else {

      }
    } else {
      closeDetailPanel();
    }

  }

  function closeDetailPanel() {
    console.log("closeDetailPanel");
   // New versions
    $('#fpccPreserveInfo').scrollTop(0);
    $('#fpccSearchStatus').show();
    $('#fpccSearchResults').show();
    $('#fpccSearchBack').hide();
    $('.detailPanel').hide();

    $('.trailhead-trailname.selected').removeClass("detail-open");
    highlightTrailhead(null,null);
    highlightTrailSegmentsForTrailSubsystem(null);
    highlightActivities(null);
    if (SMALL) {
      $('#fpccMainContainer').show();
    }
    //resetDetailPanel();
    map.closePopup();
    readdSearchURL();
    setHeights();
    // map.invalidateSize();
  }

  function readdSearchURL() {
    console.log("[readdSearchURL");
    var selectize = $select[0].selectize;
    
    var searchBoxValue = selectize.getValue().filter(Boolean).toString();
    $.address.parameter('trail', null);  
    $.address.parameter('poi', null);
    if (searchBoxValue.length != 0) {
      console.log("[readdSearchURL] searchBoxValue = " + searchBoxValue);
      var searchLink =  encodeURIComponent(searchBoxValue);
      searchLink = searchLink.replace(/%20/g, '+');
      console.log("[readdSearchURL] searchLink = " + searchLink);
      $.address.parameter('search', searchLink);
      $.address.update();
    }
    $.address.update();
  }

  function openResultsList() {
    console.log("openResultsList");
    // New versions
    $('#fpccSearchStatus').show();
    $('#fpccSearchResults').show();
    $('#fpccSearchBack').hide();
    $('.detailPanel').hide();
  }



  // KEEP NEW: decorateDetailPanel
  function decorateDetailPanel(trailSubsystemName, trailhead) {
    var fpccContainerHTML = '';
    var directTrail = null;
    var descriptionTrail = null;
    var trailSubsystemTrails = null;
    var displayName = "";
    //console.log("[decorateDetailPanelForTrailhead2]");
    if (trailSubsystemName) {
      trailSubsystemTrails = trailSubsystemMap[trailSubsystemName] || null;
      descriptionTrail = trailSubsystemTrails[0] || null;
      displayName = trailSubsystemName;
      $('#fpccPreserveName .trailName').html(trailSubsystemName);
    }
    if (trailhead) {
      if (trailhead.properties.name) {
        displayName = trailhead.properties.name;
        $('#fpccPreserveName .trailName').html(trailhead.properties.name);
      }
      directTrail = originalTrailData[trailhead.properties.direct_trail_id] || null;
      if (directTrail) {
        trailSubsystemTrails = trailSubsystemMap[directTrail.trail_subsystem] || null;
        descriptionTrail = directTrail;
      }
      fpccContainerHTML = '<div class="fpccTop">';
      if (trailhead.properties.photo_link) {
        fpccContainerHTML += '<div class="fpccPhoto">'
                           + '<img src="images/poi-photos/' + trailhead.properties.photo_link + '">'
                           + '</div>';
      }
      // ADD ALERTS INFO HERE
      fpccContainerHTML += '<div class="fpccEntrance fpccUnit clearfix">'
                         + '<div class="fpccSign clearfix">'
                         + '<svg class="icon icon-sign"><use xlink:href="icons/defs.svg#icon-sign"></use></svg>'
                         + '<div class="fpccAddress">'
                         + '<span class="fpccLabel fpccBlock">';

      if (trailhead.properties.web_street_addr) {
        fpccContainerHTML += 'Entrance</span><span class="fpccEntranceAddress">'
                           + trailhead.properties.web_street_addr + '</span>';
      } else {
        fpccContainerHTML += 'Location</span>';
      }
      if (trailhead.properties.web_muni_addr) {
        fpccContainerHTML += '<span class="fpccEntranceZip">' + trailhead.properties.web_muni_addr + '</span>';
      }
      if (trailhead.properties.phone) {
        fpccContainerHTML += '<span class="fpccPhone">' + trailhead.properties.phone + '</span>';
      }
      var directionsUrl = "http://maps.google.com?saddr=" + currentUserLocation.lat + "," + currentUserLocation.lng +
        "&daddr=" + trailhead.geometry.coordinates[1] + "," + trailhead.geometry.coordinates[0];
      fpccContainerHTML += '</div></div>'
                         + '<a href="' + directionsUrl + '" target="_blank" id="entranceDirections" class="fpccButton fpccDirections">Directions</a></div>';
      if (trailhead.properties.description) {
        fpccContainerHTML += '<div class="fpccDescription fpccUnit">' + trailhead.properties.description + '</div>';
      }

      var fpccAmenitiesString = "";
      var naturePreserveString = "";
      var tagLinks = "";
      if ((trailhead.properties.tags) && (trailhead.properties.tags[':panel'])) {
        console.log("tags.panel = " + trailhead.properties.tags[':panel']);
        // bike_rental = Bike Rental
        if (trailhead.properties.tags[':panel'].indexOf("bike_rental") > -1 ) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bike-rental'><use xlink:href='icons/defs.svg#icon-bike-rental'></use></svg><span class='fpccAmenityTitle'>Bike Rental</span></div>";
        }

        // birding = Birding Hotspot
        if (trailhead.properties.tags[':panel'].indexOf("birding") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-birding-hotspot'><use xlink:href='icons/defs.svg#icon-birding-hotspot'></use></svg><span class='fpccAmenityTitle'>Birding Hotspot</span></div>";
        }

        // boat_ramp = Boat Launch
        if (trailhead.properties.tags[':panel'].indexOf("boat_ramp") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-launch'><use xlink:href='icons/defs.svg#icon-boat-launch'></use></svg><span class='fpccAmenityTitle'>Boat Launch</span></div>";
        }

        // boat_rental = Boat Rental
        if (trailhead.properties.tags[':panel'].indexOf("boat_rental") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-rental'><use xlink:href='icons/defs.svg#icon-boat-rental'></use></svg><span class='fpccAmenityTitle'>Boat Rental</span></div>";
        }

        // camping = Campground
        if (trailhead.properties.tags[':panel'].indexOf("camping") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp'><use xlink:href='icons/defs.svg#icon-camp'></use></svg><span class='fpccAmenityTitle'>Campground</span></div>";
        }

        // canoe = Canoe Landing
        if (trailhead.properties.tags[':panel'].indexOf("canoe") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-canoe-landing'><use xlink:href='icons/defs.svg#icon-canoe-landing'></use></svg><span class='fpccAmenityTitle'>Canoe Landing</span></div>";
        }

        // cross_country = Cross-Country Skiing
        if (trailhead.properties.tags[':panel'].indexOf("cross_country") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-cross-country-skiing'><use xlink:href='icons/defs.svg#icon-cross-country-skiing'></use></svg><span class='fpccAmenityTitle'>Cross-Country Skiing</span></div>";
        }

        // cycling = Bicycling
        if (trailhead.properties.tags[':panel'].indexOf("cycling") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bicycling'><use xlink:href='icons/defs.svg#icon-bicycling'></use></svg><span class='fpccAmenityTitle'>Bicycling</span></div>";
        }

        // disc_golf = Disc Golf
        if (trailhead.properties.tags[':panel'].indexOf("disc_golf") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-disc-golf'><use xlink:href='icons/defs.svg#icon-disc-golf'></use></svg><span class='fpccAmenityTitle'>Disc Golf</span></div>";
        }

        //  dog_friendly = Off-Leash Dog Area
        if (trailhead.properties.tags[':panel'].indexOf("dog_friendly") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-off-leash-dog-area'><use xlink:href='icons/defs.svg#icon-off-leash-dog-area'></use></svg><span class='fpccAmenityTitle'>Off-Leash Dog Area</span></div>";
        }

        //  dog_leash = Dogs (with a leash)
        if (trailhead.properties.tags[':panel'].indexOf("dog_leash") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-dog-leash'><use xlink:href='icons/defs.svg#icon-dog-leash'></use></svg><span class='fpccAmenityTitle'>Dogs (with a leash)</span></div>";
        }

        //  drone = Drone Flying
        if (trailhead.properties.tags[':panel'].indexOf("driving_range") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'>Driving Range</span></div>";
        }


        //  drone = Drone Flying
        if (trailhead.properties.tags[':panel'].indexOf("drone") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-drone'><use xlink:href='icons/defs.svg#icon-drone'></use></svg><span class='fpccAmenityTitle'>Drone Flying Area</span></div>";
        }

        // ecological = Ecological Management
        // if (trailhead.properties.tags[':panel'].indexOf("ecological") > -1) {
        //   fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ecological-management-area'><use xlink:href='icons/defs.svg#icon-ecological-management-area'></use></svg><span class='fpccAmenityTitle'>Ecological Management</span></div>";
        // }

        // equestrian = Equestrian
        if (trailhead.properties.tags[':panel'].indexOf("equestrian") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-equestrian'><use xlink:href='icons/defs.svg#icon-equestrian'></use></svg><span class='fpccAmenityTitle'>Equestrian</span></div>";
        }

        // fishing = Fishing
        if (trailhead.properties.tags[':panel'].indexOf("fishing") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-fishing'><use xlink:href='icons/defs.svg#icon-fishing'></use></svg><span class='fpccAmenityTitle'>Fishing</span></div>";
        }

        // golf = Golf
        if (trailhead.properties.tags[':panel'].indexOf("golf") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'>Golf</span></div>";
        }

        // hiking = Hiking
        if (trailhead.properties.tags[':panel'].indexOf("hiking") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-hiking'><use xlink:href='icons/defs.svg#icon-hiking'></use></svg><span class='fpccAmenityTitle'>Hiking</span></div>";
        }

        // ice_fishing = Ice Fishing
        if (trailhead.properties.tags[':panel'].indexOf("ice_fishing") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ice-fishing'><use xlink:href='icons/defs.svg#icon-ice-fishing'></use></svg><span class='fpccAmenityTitle'>Ice Fishing</span></div>";
        }

        // m_airplane = Model Airplane Flying Field
        if (trailhead.properties.tags[':panel'].indexOf("m_airplane") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-model-airplane'><use xlink:href='icons/defs.svg#icon-model-airplane'></use></svg><span class='fpccAmenityTitle'>Model Airplane Flying Field</span></div>";
        }

        // m_boat = Model Sailboat
        if (trailhead.properties.tags[':panel'].indexOf("m_boat") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-model-sailboat'><use xlink:href='icons/defs.svg#icon-model-sailboat'></use></svg><span class='fpccAmenityTitle'>Model Sailboat</span></div>";
        }

        // nature_center = Nature Center
        if (trailhead.properties.tags[':panel'].indexOf("nature_center") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-nature-center'><use xlink:href='icons/defs.svg#icon-nature-center'></use></svg><span class='fpccAmenityTitle'>Nature Center</span></div>";
        }

        // no_alcohol = No Alcohol
        if (trailhead.properties.tags[':panel'].indexOf("no_alcohol") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-alcohol'><use xlink:href='icons/defs.svg#icon-no-alcohol'></use></svg><span class='fpccAmenityTitle'>No Alcohol</span></div>";
        }

        // no_fishing = No Fishing
        if (trailhead.properties.tags[':panel'].indexOf("no_fishing") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-fishing'><use xlink:href='icons/defs.svg#icon-no-fishing'></use></svg> <span class='fpccAmenityTitle'>No Fishing</span></div>";
        }

        // no_parking = No Parking
        if (trailhead.properties.tags[':panel'].indexOf("no_parking") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-parking'><use xlink:href='icons/defs.svg#icon-no-parking'></use></svg> <span class='fpccAmenityTitle'>No Parking Lot</span></div>";
        }

        // overlook = Scenic Overlook
        if (trailhead.properties.tags[':panel'].indexOf("overlook") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-scenic-overlook'><use xlink:href='icons/defs.svg#icon-scenic-overlook'></use></svg><span class='fpccAmenityTitle'>Scenic Overlook</span></div>";
        }

        // pavilion = Pavilion/Event Space
        if (trailhead.properties.tags[':panel'].indexOf("pavilion") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg><span class='fpccAmenityTitle'>Indoor Facility</span></div>";
        }

        // picnic_grove = Picnic Grove
        if (trailhead.properties.tags[':panel'].indexOf("picnic_grove") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity picnic-grove'><svg class='icon icon-picnic-grove'><use xlink:href='icons/defs.svg#icon-picnic-grove'></use></svg><span class='fpccAmenityTitle'>Picnic Grove</span></div>";
        }

        // public_building = Public Building
        if (trailhead.properties.tags[':panel'].indexOf("public_building") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity public-building'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg><span class='fpccAmenityTitle'>Public Building</span></div>";
        }

        // shelter = Picnic Grove (with shelter)
        if (trailhead.properties.tags[':panel'].indexOf("shelter") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-picnic-grove-shelter'><use xlink:href='icons/defs.svg#icon-picnic-grove-shelter'></use></svg><span class='fpccAmenityTitle'>Picnic Grove (with shelter)</span></div>";
        }

        // skating_ice = Ice Skating
        if (trailhead.properties.tags[':panel'].indexOf("skating_ice") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ice-skating'><use xlink:href='icons/defs.svg#icon-ice-skating'></use></svg><span class='fpccAmenityTitle'>Ice Skating</span></div>";
        }

        // sledding = Sledding
        if (trailhead.properties.tags[':panel'].indexOf("sledding") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-sledding'><use xlink:href='icons/defs.svg#icon-sledding'></use></svg><span class='fpccAmenityTitle'>Sledding</span></div>";
        }

        // snowmobile = Snowmobile Area
        if (trailhead.properties.tags[':panel'].indexOf("snowmobile") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-snowmobiling'><use xlink:href='icons/defs.svg#icon-snowmobiling'></use></svg><span class='fpccAmenityTitle'>Snowmobile Area</span></div>";
        }

        // swimming = Aquatic Center
        if (trailhead.properties.tags[':panel'].indexOf("swimming") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-aquatic-center'><use xlink:href='icons/defs.svg#icon-aquatic-center'></use></svg><span class='fpccAmenityTitle'>Aquatic Center</span></div>";
        }

        // volunteer = Volunteer Opportunities
        if (trailhead.properties.tags[':panel'].indexOf("volunteer") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-volunteer'><use xlink:href='icons/defs.svg#icon-volunteer'></use></svg><span class='fpccAmenityTitle'>Volunteer Opportunities</span></div>";
        }
        
        // parking = Parking
        if (trailhead.properties.tags[':panel'].indexOf("parking") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-parking'><use xlink:href='icons/defs.svg#icon-parking'></use></svg><span class='fpccAmenityTitle'>Parking Lot</span></div>";
        }

        // trailacces = Trail System Access
        if (trailhead.properties.tags[':panel'].indexOf("trailhead") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-trail-marker'><use xlink:href='icons/defs.svg#icon-trail-marker'></use></svg><span class='fpccAmenityTitle'>Trail Access</span></div>";
        }

        // zip_line = Zip Line
        if (trailhead.properties.tags[':panel'].indexOf("zip_line") > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-zip-line'><use xlink:href='icons/defs.svg#icon-zip-line'></use></svg><span class='fpccAmenityTitle'>Zip Line / Treetop Adventure</span></div>";
        }

        // nature_preserve = Nature Preserve
        if (trailhead.properties.tags[':panel'].indexOf("nature_preserve") > -1) {
          naturePreserveString = '<div class="fpccNP clearfix" target="_blank"><a href="http://fpdcc.com/illinois-nature-preserves/" target="_blank"><img src="images/idnr-np-logo.png" width="75" height="65" alt="Illinois Nature Preserves Commission Logo"></a><p>This is an Illinois Nature Preserve&mdash;one of the highest quality natural lands in the state. This designation includes increased levels of legal protection and management. <a href="http://fpdcc.com/illinois-nature-preserves/" target="_blank">Learn more &gt;</a></p></div>';
        }

        if ((trailhead.properties.tags[':panel'].indexOf("picnic_grove") > -1) || (trailhead.properties.tags[':panel'].indexOf("shelter") > -1)) {
        tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/permits/">Picnic &amp; Event Permits</a></li>'
        }
        if ((trailhead.properties.tags[':panel'].indexOf("boat_ramp") > -1) || (trailhead.properties.tags[':panel'].indexOf("boat_rental") > -1) || (trailhead.properties.tags[':panel'].indexOf("canoe") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/boating/">Boating Information</a></li>'
        }
        if ((trailhead.properties.tags[':panel'].indexOf("fishing") > -1)) {
          tagLinks += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/fishing/">Fishing Information</a></li>'
        }

      }
      if (trailhead.properties.special_link) {
        fpccAmenitiesString += '<a href="' + trailhead.properties.special_link + '" class="fpccSpecialDesc" target="_blank"><span class="fpccSpecialBlurb">' + trailhead.properties.special_description + '</span><span class="fpccSpecialIcon"><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg></span></a>';
      }
      if (fpccAmenitiesString.length > 0) {
        fpccContainerHTML += '<div class="fpccAmenities fpccUnit clearfix">' + fpccAmenitiesString + '</div>';
      }
      if(naturePreserveString.length > 0) {
        fpccContainerHTML += naturePreserveString;
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
        fpccContainerHTML += '<div class="fpccHours fpccUnit"><span class="fpccLabel">Hours</span>'
                           + hoursHTML + '</div>';
      }

      var extraLinksText = '<span class="fpccLabel fpccMore">More Information</span><ul>';
      var extraLinksExist = true;
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
      extraLinksText += '<li><a class="fpccMore" target="_blank" href="http://fpdcc.com/rules-and-regulations/">Rules &amp; Regulations</a></li>';
      if (tagLinks.length > 0) {
        extraLinksExist = true;
        extraLinksText += tagLinks;
      }
      extraLinksText += '</ul></div>';
      if (extraLinksExist === true) {
        fpccContainerHTML += '<div class="fpccLinks fpccUnit clearfix">' + extraLinksText + '</div>';
      }
      fpccContainerHTML += '</div>';
    }
    //Trails Section
    var trailsHTML = "";
    if (descriptionTrail) {
      console.log("[decorateDetailPanelForTrailhead] system = " + descriptionTrail.trail_subsystem);
      var subSystem = descriptionTrail.trail_subsystem;
      trailsHTML += '<div class="fpccTrails fpccUnit clearfix">';
      if (directTrail) {
        trailsHTML += '<svg class="icon icon-trail-marker"><use xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>'
                    + '<div class="fpccTrailHeader">'
                    + '<span class="fpccLabel fpccBlock">Trail Access</span>'
                    + '<span class="fpccTrailName">'
                    + subSystem
                    + '</span></div>';
      }            
      var trailDescriptionHTML = '<div class="fpccTrailDescription">';
      var showDescription = false;
      if (descriptionTrail.trail_desc) {
        showDescription = true;
        trailDescriptionHTML += '<div class="fpccTrailDescription" id="trailDescription">'
                              + descriptionTrail.trail_desc
                              + '</div>';
      }
      var showMaps = false;
      var trailMapHTML = '<div class="fpccTrailMaps clearfix trailMaps"><span class="fpccLabel">PDF Trail Map:</span>';
      console.log("[decorateDetailPanelForTrailhead2] showMaps = " + showMaps);
      if (descriptionTrail.map_link != null && descriptionTrail.map_link != '') {
        console.log("[decorateDetailPanelForTrailhead2] descriptionTrail.map_link is true? " + descriptionTrail.map_link);
        trailMapHTML += '<a class="fpccButton" id="pdfEnglish" href="'
                      + descriptionTrail.map_link + '">English</a>';
        showMaps = true;
        showDescription = true;
      }
      if (descriptionTrail.map_link_spanish != null && descriptionTrail.map_link_spanish != '') {
        trailMapHTML += ' <a class="fpccButton" id="pdfSpanish" href="'
                      + descriptionTrail.map_link_spanish + '">Español</a>';
        showMaps = true;
        showDescription = true;
      }
      trailMapHTML += '</div>';
      console.log("[decorateDetailPanelForTrailhead] showMaps = " + showMaps);
      if (showMaps) {
        trailDescriptionHTML += trailMapHTML;
      }
      trailDescriptionHTML += '</div>';
      if (showDescription) {
        trailsHTML += trailDescriptionHTML;
      }
      var trailSegmentsHTML = '<div class="fpccTrailSegments">';
      var indirectHTML = "";
      if (directTrail) {
        var directTrailHTML = buildTrailSegmentHTML(directTrail);
        trailSegmentsHTML += directTrailHTML;
        indirectHTML += '<div class="fpccAccessTo fpccLabel"><svg class="icon icon-trail-marker" style="display: inline-block;"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>with access to:</div>';
      }
      if (trailSubsystemTrails) {
        var useIndirect = false;
        for (var trailIndex = 0; trailIndex < trailSubsystemTrails.length; trailIndex++ ) {
          var thisTrail = trailSubsystemTrails[trailIndex];
          if (directTrail) {
            if (thisTrail.direct_trail_id != directTrail.direct_trail_id) {
              if (thisTrail.subtrail_length_mi >= 1) {
                useIndirect = true;
                indirectHTML += buildTrailSegmentHTML(thisTrail);
              }
            }
          } else {
            if (thisTrail.subtrail_length_mi >= 1 || trailIndex == 0) {
              useIndirect = true;
              indirectHTML += buildTrailSegmentHTML(thisTrail);
            }
          } 
        }
        if (useIndirect) {
          trailSegmentsHTML += indirectHTML;
        }
      }
      trailSegmentsHTML += '<span class="fpccOneMile">*Segments under 1 mile not shown.</span>'
                         + '</div>';
      trailsHTML += trailSegmentsHTML + '</div>';
      fpccContainerHTML += trailsHTML;
    }
    var socialLink = encodeURIComponent(window.location.href);
    socialLink = socialLink.replace(/%20/g, '+');
    socialLink = socialLink.replace("/#/", "/");
    fpccContainerHTML += '<div class="fpccSocial fpccUnit clearfix">'
                       + '<div class="fpccShare">Share Your Plans:</div><a href="'
                       + 'mailto:?subject=Heading to ' + displayName
                       + '" id="fpccSocialEmail" class="fpccSocialIcon">'
                       + '<svg class="icon icon-email"><use xlink:href="icons/defs.svg#icon-email"></use></svg>'
                       + '<span>Email</span></a>'
                       + '<a href="http://twitter.com/home?status=Heading to ' + displayName + ' ' + socialLink
                       + '" id="fpccSocialTwitter" class="fpccSocialIcon">'
                       + '<svg class="icon icon-twitter"><use xlink:href="icons/defs.svg#icon-twitter"></use></svg>'
                       + '<span>Twitter</span></a>'
                       + '<a href="' + 'http://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + socialLink + '&p[images][0]=&p[title]=Cook County Forest Preserves &p[summary]=Heading to ' + displayName
                       + '" id="fpccSocialFacebook" class="fpccSocialIcon">'
                       + '<svg class="icon icon-facebook"><use xlink:href="icons/defs.svg#icon-facebook"></use></svg>'
                       + '<span>Facebook</span></a></div>';  
    var fpccContainerElement = document.getElementsByClassName('fpccContainer')[0];
    fpccContainerElement.innerHTML = fpccContainerHTML;
  }

  // Create TrailSegment HTML for Detail Panel
  function buildTrailSegmentHTML(trailSegment) {
    var thisColor = trailSegment.trail_color;
    var thisType = trailSegment.trail_type;
    var trailSegmentHTML = '<div class="fpccTrailSegment"><div class="fpccSegmentOverview fpcc';
    console.log("[buildTrailSegmentHTML] trailSegment.off_fpdcc= " + trailSegment.off_fpdcc);
    console.log("[buildTrailSegmentHTML] trailSegment.trail_color= " + trailSegment.trail_color);
    if (trailSegment.off_fpdcc == 'y') {
      trailSegmentHTML += "off";
    } else {
      trailSegmentHTML += trailSegment.trail_color;
    }
    if (thisType.toLowerCase() != "paved") {
      trailSegmentHTML += " fpccUnpaved";
    }
    trailSegmentHTML += ' clearfix"><span class="fpccSegmentName">';
    trailSegmentHTML += thisColor + ' ' + thisType;
    if (trailSegment.off_fpdcc == 'y') {
      trailSegmentHTML += " Off FPDCC";
    }
    trailSegmentHTML += '</span><span class="fpccTrailUse">';
    trailSegmentHTML += '<svg class="icon icon-hiking"><use xlink:href="icons/defs.svg#icon-hiking"></use></svg>';
    if (thisType.toLowerCase() == "unpaved" || thisType.toLowerCase() == "paved" || thisType == "") {
      trailSegmentHTML += '<svg class="icon icon-bicycling"><use xlink:href="icons/defs.svg#icon-bicycling"></use></svg>';
      trailSegmentHTML += '<svg class="icon icon-cross-country-skiing"><use xlink:href="icons/defs.svg#icon-cross-country-skiing"></use></svg>';
    }
    if (thisType.toLowerCase() == "unpaved" || thisType == "") {
      trailSegmentHTML += '<svg class="icon icon-equestrian"><use xlink:href="icons/defs.svg#icon-equestrian"></use></svg>';
    }
    trailSegmentHTML += '</span></div>';
    trailSegmentHTML += '<div class="fpccSegmentDetails clearfix"><span class="fpccLabel fpccLeft">Length<span>';
    //trailSegmentsHTML += (Math.round(trailhead.properties.length * 100) / 100);
    trailSegmentHTML += trailSegment.subtrail_length_mi;
    trailSegmentHTML += ' mi</span></span>';
    trailSegmentHTML += '<span class="fpccLabel fpccRight">Surface<span>';
    trailSegmentHTML += thisType;
    trailSegmentHTML += '</span></span></div></div>';
    return trailSegmentHTML;
  }

  function showfpccMainContainer(e){
    console.log("showfpccMainContainer");
    var showMap = document.getElementById("fpccMobileCheckbox").checked;
    console.log("[showfpccMainContainer] show = " + show);
    if (showMap){
      $('#fpccMainContainer').addClass('contracted');
      $('#fpccMainContainer').removeClass('expanded');
      $('.trailListColumn').addClass('contracted');
      $('.trailListColumn').removeClass('expanded');
      $('.detailPanel').addClass('contracted');
      $('.detailPanel').removeClass('expanded');
      // document.getElementById("fpccMainContainer").style.zIndex = "1";
      $('#fpccSearchBack').hide();
    } else {
      $('#fpccMainContainer').addClass('expanded');
      $('.trailListColumn').addClass('expanded');
      $('.trailListColumn').removeClass('contracted');
      $('#fpccMainContainer').removeClass('contracted');
      $('.detailPanel').addClass('expanded');
      $('.detailPanel').removeClass('contracted');
      if ($(".detailPanel").is(":visible") ) {
        $('#fpccSearchBack').show();
      }
    }
    setHeights();
  }

  function showDetailPanel(show){
    console.log("showDetailPanel");
    if (show){
      console.log("[showDetailPanel] show = true");
      $('.detailPanel').addClass('expanded');
      $('.detailPanel').removeClass('contracted');
      $('.trailListColumn').addClass('expanded');
      $('.trailListColumn').removeClass('contracted');
      if (document.getElementById("fpccMobileCheckbox").checked) {
        $('#fpccSearchBack').html('<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg>Back to Map</a>');
      } else {
        $('#fpccSearchBack').html('<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg>Back to Search Results</a>');
      }
    } else {
      console.log("[showDetailPanel] show = false");
      $('.detailPanel').addClass('contracted');
      $('.detailPanel').removeClass('expanded');
      $('.trailListColumn').addClass('contracted');
      $('.trailListColumn').removeClass('expanded');
      $('#fpccSearchBack').hide();
      //document.getElementById("fpccMobileCheckbox").checked = true;
    }
    //showfpccMainContainer();
  }

  function slideDetailPanel(e) {
    console.log("slideDetailPanel");
    if ( $(e.target).parents(".detailPanel").is(":visible") ) {
      if ($(e.target).parents(".detailPanel").hasClass("expanded")) {
        console.log("[slideDetailPanel] parent has expanded. Run showDetailPanel(false)");
        showDetailPanel(false);
      } else {
        showDetailPanel(true);
        console.log("[slideDetailPanel] parent doesn't have expanded. Run showDetailPanel(true)");

      }
    }
  }

  //  About page functions

  function openAboutPage() {
    console.log("openAboutPage");
    $('.aboutPage').show();
    $('.detailPanel').hide();
    if (!SMALL) {
    }
  }

  function closeAboutPage() {
    console.log("closeAboutPage");
    $('.aboutPage').hide();
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
  function highlightTrailSegmentsForTrailSubsystem(trailSubsystem) {
    var startTime = new Date().getTime();
    console.log("highlight start = " + startTime);
    if (currentHighlightedSegmentLayer) {
      currentHighlightedSegmentLayer.setStyle({weight: NORMAL_SEGMENT_WEIGHT});
    }

    currentHighlightedSegmentLayer = null;
    
    if (trailSubsystem) {
      console.log("[highlightTrailSegmentsForTrailhead] trailSubsystem = " + trailSubsystem);
      currentHighlightedSegmentLayer = new L.FeatureGroup();
      
      allSegmentLayer.eachLayer(function (layer) {
        var layerTrailSubsystem = layer.getLayers()[0].feature.properties.trail_subsystem;
        //console.log("[highlightTrailSegmentsForTrailhead] layerTrailSystem = " + layerTrailSystem);
        var layerWanted = 0;
        if (layerTrailSubsystem) {
            if (layerTrailSubsystem == trailSubsystem) {
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
