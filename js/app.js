var $ = require('jquery')
require('jquery-address')
//var selectize = require('selectize')
require('./vendor/selectize.js')

var trailMap = require('./map.js')
window.trailMap = trailMap()
window.trailMap.fetchData()
