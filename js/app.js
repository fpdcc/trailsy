var $ = require('jquery')
if (__DEV__) {
    require('jquery-migrate')
}
require('./vendor/jquery.address.js')

//var selectize = require('selectize')
require('./vendor/selectize.js')

var trailMap = require('./map.js')
window.trailMap = trailMap()
window.trailMap.fetchData()
