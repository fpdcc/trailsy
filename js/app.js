var $ = require('jquery')
if (__DEV__) {
    require('jquery-migrate')
}
require('./vendor/jquery.address.js')

//var selectize = require('selectize')
require('./vendor/selectize-newmod.js')

import {trailMap} from './map.js'
window.trailMap = trailMap()
window.trailMap.fetchData()
