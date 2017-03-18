var L = require('leaflet')
var mapCenter = [41.838, -87.685]
var defaultZoom = 9
// var listenType = ((navigator.userAgent.toLowerCase().indexOf('edge') !== -1) || (navigator.userAgent.toLowerCase().indexOf('trident') !== -1)) ? 'mouseup' : 'click'
var listenType = 'click'
console.log('listenType = ' + listenType)
var isEdge = ((navigator.userAgent.toLowerCase().indexOf('edge') !== -1) || (navigator.userAgent.toLowerCase().indexOf('trident') !== -1)) ? true : false
// var appId = '6' // OuterSpatial assigns a unique id for each customer
//var url = 'https://fpcc-staging.smartchicagoapps.org'
var url = 'https://map.fpdcc.com'
var gaCode = 'UA-92972430-2'
// var trailsyBaseEndpoint = url + '/v0/applications/' + appId;
var trailsyBaseEndpoint = url

module.exports = {
  trailEndpoint: trailsyBaseEndpoint + '/cached_trails_csv',
  // trailheadEndpoint: baseEndpoint + "/cached_trailheads",
  trailheadEndpoint: trailsyBaseEndpoint + '/pointsofinterests.json',
  activityEndpoint: trailsyBaseEndpoint + '/activities.json',
  trailInfoEndpoint: trailsyBaseEndpoint + '/trails_infos.json',
  trailSegmentEndpoint: trailsyBaseEndpoint + '/new_trails.json',
  picnicgroveEndpoint: trailsyBaseEndpoint + '/picnicgroves.json',

  // trailSegmentEndpoint: trailsyBaseEndpoint + "/cached_trail_segments",
  mapCenter: mapCenter,
  defaultZoom: defaultZoom,
  listenType: listenType,
  isEdge: isEdge,
  gaCode: gaCode
}
