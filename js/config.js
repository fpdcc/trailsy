var L = require('leaflet')
var mapCenter = [41.838, -87.685]
var defaultZoom = 9
// var listenType = ((navigator.userAgent.toLowerCase().indexOf('edge') !== -1) || (navigator.userAgent.toLowerCase().indexOf('trident') !== -1)) ? 'mouseup' : 'click'
var listenType = 'click'
console.log('listenType = ' + listenType)
var isEdge = ((navigator.userAgent.toLowerCase().indexOf('edge') !== -1) || (navigator.userAgent.toLowerCase().indexOf('trident') !== -1)) ? true : false
var url = 'https://map.fpdcc.com'
var gaCode1 = 'UA-92972430-1'
var gaCode2 = 'UA-29985181-1'
var trailsyBaseEndpoint = url

module.exports = {
  trailEndpoint: trailsyBaseEndpoint + '/cached_trails_csv',
  // trailheadEndpoint: baseEndpoint + "/cached_trailheads",
  trailheadEndpoint: trailsyBaseEndpoint + '/pointsofinterests.json',
  activityEndpoint: trailsyBaseEndpoint + '/activities.json',
  trailInfoEndpoint: trailsyBaseEndpoint + '/trail_subtrails.json',
  trailSegmentEndpoint: trailsyBaseEndpoint + '/trails_infos.json',
  picnicgroveEndpoint: trailsyBaseEndpoint + '/picnicgroves.json',
  alertEndpoint: trailsyBaseEndpoint + '/alerts.json',

  // trailSegmentEndpoint: trailsyBaseEndpoint + "/cached_trail_segments",
  mapCenter: mapCenter,
  defaultZoom: defaultZoom,
  listenType: listenType,
  isEdge: isEdge,
  gaCode1: gaCode1,
  gaCode2: gaCode2
}
