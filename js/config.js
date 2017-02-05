var L = require('leaflet')
var mapCenter = [42.0723, -87.87]
var defaultZoom = 12

// var appId = '6' // OuterSpatial assigns a unique id for each customer
var url = 'https://fpcc-staging.smartchicagoapps.org'
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
  defaultZoom: defaultZoom
}