'use strict';

var trailSegmentsFeature = require("../js/trailSegmentsFeature");

var duplicatedData = [
            {
                type: "Feature",
                properties: {
                    id: 98655,
                    created_at: "2015-04-07T19:35:40.929Z",
                    updated_at: "2015-04-07T19:35:42.136Z",
                    distance_in_meters: 6754,
                    steward_ids: [
                        4724,
                        4154
                    ],
                    trailhead_ids: [],
                    trail_ids: [
                        25489
                    ],
                    trail_segment_attributes: []
                },
                geometry: {
                    type: "MultiLineString",
                    coordinates: [
                        [
                            [
                                -105.126714,
                                39.938037
                            ],
                            [
                                -105.126304,
                                39.938161
                            ],
                            [
                                -105.126186,
                                39.938186
                            ],
                            [
                                -105.126068,
                                39.938205
                            ],
                            [
                                -105.125965,
                                39.938211
                            ],
                            [
                                -105.125873,
                                39.938202
                            ],
                            [
                                -105.125755,
                                39.938179
                            ],
                            [
                                -105.125638,
                                39.938124
                            ],
                            [
                                -105.125513,
                                39.938076
                            ],
                            [
                                -105.125359,
                                39.938013
                            ],
                            [
                                -105.125226,
                                39.937959
                            ],
                            [
                                -105.125112,
                                39.93793
                            ],
                            [
                                -105.124976,
                                39.93791
                            ]
                        ]
                    ]
                }
            },
            {
                type: "Feature",
                properties: {
                    id: 98655,
                    created_at: "2015-04-07T19:35:40.929Z",
                    updated_at: "2015-04-07T19:35:42.136Z",
                    distance_in_meters: 6754,
                    steward_ids: [
                        4724,
                        4154
                    ],
                    trailhead_ids: [],
                    trail_ids: [
                        25489
                    ],
                    trail_segment_attributes: [
                        {
                            attribute: {
                                id: 6,
                                name: "Motor Vehicles"
                            },
                            value: null
                        },
                        {
                            attribute: {
                                id: 1,
                                name: "Accessible"
                            },
                            value: null
                        },
                        {
                            attribute: {
                                id: 2,
                                name: "Skiing"
                            },
                            value: null
                        },
                        {
                            attribute: {
                                id: 3,
                                name: "Horse"
                            },
                            value: "yes"
                        },
                        {
                            attribute: {
                                id: 4,
                                name: "Bicycle"
                            },
                            value: "yes"
                        },
                        {
                            attribute: {
                                id: 5,
                                name: "Hiking"
                            },
                            value: "yes"
                        }
                    ]
                },
                geometry: {
                    type: "MultiLineString",
                    coordinates: [
                        [
                            [
                                -105.126714,
                                39.938037
                            ],
                            [
                                -105.126304,
                                39.938161
                            ],
                            [
                                -105.126186,
                                39.938186
                            ],
                            [
                                -105.126068,
                                39.938205
                            ],
                            [
                                -105.125965,
                                39.938211
                            ],
                            [
                                -105.125873,
                                39.938202
                            ],
                            [
                                -105.125755,
                                39.938179
                            ],
                            [
                                -105.125638,
                                39.938124
                            ],
                            [
                                -105.125513,
                                39.938076
                            ],
                            [
                                -105.125359,
                                39.938013
                            ],
                            [
                                -105.125226,
                                39.937959
                            ],
                            [
                                -105.125112,
                                39.93793
                            ],
                            [
                                -105.124976,
                                39.93791
                            ]
                        ]
                    ]
                }
            }];

describe('trailSegmentsFeature', function () {
   it('does not contain duplicate trail segments', function () {
       var tsf = trailSegmentsFeature();
       tsf.updateGeoJson(duplicatedData);
       expect(tsf.getGeoJson()[0].features.length).toBe(1);
   })
});
