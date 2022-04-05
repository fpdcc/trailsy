// Which tags should NOT should up in the results list
var tagsExcludeTrailsList = []
tagsExcludeTrailsList = tagsExcludeTrailsList.concat(['accessible', 'boat rental', 'canoe rental', 'kayak rental', 'boating center', 'boat_rental', 'camping', 'camp', 'campground', 'canoeing', 'kayaking', 'boating', 'canoe', 'kayak', 'boat', 'boat_ramp', 'disc golf', 'frisbee', 'disc_golf', 'dog park', 'off-leash dog', 'dog_friendly', 'drone flying', 'drone', 'fishing', 'golfing', 'golf', 'ice fishing', 'ice_fishing', 'ice skating', 'ice skate', 'skating_ice', 'indoor event space', 'wedding', 'meeting', 'indoor_rental', 'model airplane flying', 'm_airplane', 'model boat ', 'm_boat', 'nature center', 'museum', 'education', 'nature_center', 'picnic / event space', 'grove', 'bbq', 'grill', 'picnic_grove + shelter', 'sled', 'coasting', 'sledding', 'snowmobiling', 'snowmobile', 'snowmachine', 'pool', 'aquatic', 'swimming', 'volunteering', 'restoration', 'volunteer', 'zip line / treetop adventure', 'zip_line'])

// Which tags should NOT should up on map
var tagsExcludeTrailsMap = []
tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(['drone'])
tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(['m_airplane'])
tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(['snowmobile', 'snowmachine'])
tagsExcludeTrailsMap = tagsExcludeTrailsMap.concat(['swimming', 'swim', 'pool', 'aquatic'])



module.exports = {
  list: tagsExcludeTrailsList,
  map: tagsExcludeTrailsMap
}
