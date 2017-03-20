'use strict'
var $ = require('jquery')
var Config = require('./config.js')

var setup = function () {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', Config.gaCode1, 'auto', 'tracker1')
  ga('tracker1.set', 'anonymizeIp', true);
  ga('tracker1.send', 'pageview');
  if (Config.gaCode2) {
    ga('create', Config.gaCode2, 'auto', 'tracker2')
    ga('tracker2.set', 'anonymizeIp', true);
    ga('tracker2.send', 'pageview');
  }
}

var trackClickEventWithGA = function (category, action, label) {
  ga('tracker1.send', {
    hitType: 'event',
    eventCategory: category,
    eventAction: action,
    eventLabel: label
  })
}

module.exports = {
  setup: setup,
  trackClickEventWithGA: trackClickEventWithGA
}
