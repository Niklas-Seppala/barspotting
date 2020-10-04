'use strict'

import { routesAPI } from "./data.js";
import { ui } from "./ui.js";
import { polyline } from "./polyline.js";

export const map = {
    /**
     * Leaflet map object's instance.
     */
    _instance: null,

    /**
     * Layer groups. When something is added/removed
     * from the map, it's primarily done with these
     * groups, and not directly from the map instance.
     */
    _layers: {
        routes: new L.FeatureGroup(),
        locations: new L.FeatureGroup(),
        user: new L.FeatureGroup()
    },

    /**
     * Position object factory function.
     * @param {number} latitude
     * @param {number} longitude
     */
    newPos: function (latitude, longitude) {
        return {lat: latitude, lon: longitude}
    },

    /**
     * Creates leaflet.js map to specified DOM element id.
     * Map uses HSL map tiles. Created map object is stored.
     * All map manipulation should be done using defined functions!
     * 
     * @param {string} elemId element id of the element where the map will be located.
     */
    create: function (elemId) {
        this._instance = L.map(elemId).fitWorld();
        L.tileLayer(
            'https://cdn.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}.png',
            {
                maxZoom: 18,
                minZoom: 11,
                tileSize: 512,
                zoomOffset: -1,
                zoomControl: false
            }
        ).addTo(this._instance);

        this._instance.locate({watch: true, timeout: 5000, setView: false})
            .addLayer(this._layers.locations)
            .addLayer(this._layers.routes)
            .addLayer(this._layers.user);
    },

    gps: {
        /**
         * Set gps related events.
         * @param {string} event event name
         * @param {Function} callback function
         */
        on: function(event, callback) {
            switch (event) {
                case 'found':
                    map._instance.on('locationfound', callback);
                    return;
                case 'error':
                    map._instance.on('locationerror', callback);
                    return;
                default:
                    throw new Error('Event not found');
            }
        }
    },
    

    /**
     * Namespace for manipulating user's state
     * on the map.
     */
    user: {
        /**
         * User's current known position
         * with latitude and longitude fields.
         */
        position: null,

        marker: {

            /**
             * User's leaflet map marker object instance.
             */
            _instance: null,

            /**
             * Constructor function for user's location marker.
             * Created object instance is added to map's user layer
             * and stored in "instance" field.
             */
            create: function() {
                const m = L.marker(map.user.position, map.options.markers.user)
                map._layers.user.addLayer(m);
                this._instance = m;
            },

            /**
             * Removes user's location marker temporarily
             * from the map. Object instance is not lost.
             */
            hide: function() {
                map._layers.user.clearLayers();
            },

            /**
             * Adds user's location marker back to map.
             */
            visible: function() {
                if (this_instance) {
                    map._layers.user.addLayer(this._instance);
                }
            },

            /**
             * Changes user's location marker's coordinates.
             * @param {object} newLoc new coordinate object
             */
            move(newLoc) {
                if (map.user.marker._instance) {
                    map.user.marker._instance.setLatLng(newLoc);
                }
            }
        }
    },

    /**
     * Namespace to manipulate location markers in the map.
     */
    locations: {
        /**
         * Object pool for leaflet marker
         * objects. When the objects are first
         * created, they are to be stored here.
         */
        _markerPool: {},

        /**
         * Cache for temporarely cleared locations.
         */
        _cache: [],

        /**
         * Check if any locations are hidden.
         * @returns {boolean}
         */
        anyHidden: function () { return map.locations._cache.length > 0; },

        /**
         * Creates all the location markers.
         * @param {object[]} locations Collection of all the locations
         * @param {object} options location marker options
         * @param {string} popupHTML optional HTML string for marker popup
         */
        create: function(locations, options, popupHTML) {
            const drawOptions = options ? options : map.options.markers.default;

            let barOptions = {...drawOptions};
            locations.forEach(loc => {

                barOptions.title = loc.name.fi;
                barOptions._description = loc.description;
                barOptions._infoUrl = loc.info_url;

                const marker = L.marker([loc.location.lat, loc.location.lon], barOptions)
                    .addTo(map._instance);

                if (popupHTML) {
                    marker.bindPopup(popupHTML);
                }

                marker.locationId = loc.id;

                marker.on('click', _ => setMarkerZoom(marker))
                marker.on('click', async _ => {
                    map.routes.clear();
                    ui.toggleLocationPanel('down');

                    const routes = await routesAPI.getRoutesToBarAsync(map.user.position, loc.location);
                    if (routes) {
                        ui.renderBarInfo(marker.options, routes, loc);
                    } else {
                        ui.renderError('no routes');
                    }
                })
                this._markerPool[marker.locationId] = marker;
            });
        },

        /**
         * Clear all locations from the map.
         */
        clear: function() {
            map._layers.locations.clearLayers();
        },

        /**
         * Removes all other markers than the marker with
         * provided id from the map. Removed markers are cached for
         * future use.
         * @param {string} id marker id that remains visible.
         */
        onlyDisplayFocused: function(id) {
            // Cache all the markers currently displayed
            for (const key in map._layers.locations._layers) {
                if (map._layers.locations._layers.hasOwnProperty(key)) {
                    map.locations._cache.push(map._layers.locations._layers[key])
                }
            }
            map.locations.clear();
            if (this._markerPool.hasOwnProperty(id)) {
                const focused = this._markerPool[id];
                map._layers.locations.addLayer(focused);
            }
        },

        /**
         * Adds all markers in the cache to the
         * map. Clears cache.
         */
        popCacheToMap: function() {
            map.locations.clear();
            map.locations._cache.forEach(m => {
                map._layers.locations.addLayer(m);
            })
            map.locations._cache.length = 0;
        }
    },

    /**
     * Namespace to draw route polylines to map
     */
    routes: {
        /**
         * Clears the routes and route stop circles
         * from the route layer.
         */
        clear: function() {
            map._layers.routes.clearLayers();
        },
         
        /**
         * Draws route polyline to map. Adds route to route layer group.
         * If draw options are not provided in parameters, polyline
         * is drawn using default options.
         * 
         * @param {object} routeLeg route "leg" object that contains encoded polyline
         * @param {object} drawOptions polyline style options
         * @param {boolean} includeStops if true -> draws a circle
         *      at the end of each route leg
         */
        draw: function(routeLeg, drawOptions, includeStops=false) {
            const options = drawOptions ? drawOptions : map.options.routes.DEFAULT;
            const route = L.polyline(polyline.decode(routeLeg.legGeometry.points), options);
            map._layers.routes.addLayer(route);

            if (includeStops) {
                map._layers.routes.addLayer(
                    L.circle(
                        [routeLeg.from.lat, routeLeg.from.lon],
                        {radius: 20}
                    )
                );
            }
        }
    },

    /**
     * Namespace to manipulate map view.
     */
    view: {
        /**
         * Options object to specify how the view
         * change animation plays out.
         */
        moveOptions: {
            animate: true,
            duration: 0.6,
            easeLinearity: 0.25,
            noMoveStart: true
        },

        /**
         * Sets the map view to specified position with default
         * zoom level of 13.
         * @param {object} position object with lat/lon fields
         * @param {number[]} position array with lat/lon values
         * @param {object} options map move options object
         * @param {number} zoomLevel defaults to 13
         */
        setTo: function(position, options, zoomLevel=13) {
            const mOptions = options ? options : this.moveOptions;
            map._instance.setView(position, zoomLevel, mOptions);
        },

        /**
         * Focuses the map view to user's position
         */
        focus: function() {
            map.view.setTo(
                [map.user.position.lat, map.user.position.lon],
                null,
                16
            );
        },

        /**
         * Conditional zoom function. Zooms to specified position if
         * user's current zoom level is lower than target zoom level.
         * Otherwise only pans the view to specified position.
         * 
         * @param {number[]} position array containing lat and lon values
         * @param {number} zoomTreshold if user already is zoomed beyound this
         *  level, no zoom is executed.
         * @param {number} zoomLevel target zoom level
         * @param {object} options move view options
         */
        zoomTo: function(position, zoomTreshold, zoomLevel, options=null) {
            if (map._instance.getZoom() >= zoomTreshold) {
                this.setTo(position, options, map._instance.getZoom());
            } else {
                this.setTo(position, options, zoomLevel)
            }
        }
    },

    /**
     * Namespace for leaflet map option
     * templates.
     */
    options: {

        /**
         * Options for predefined markers
         */
        markers: {
            default: {
                title : 'title here',
                alt: 'alt comes here',
                opacity: 0.8,
                riseOnHover: true
            },
            bar: {
                icon : L.icon({
                    iconUrl: './icons/beer-icon.png',
                    iconSize: [40, 45],
                    iconAnchor: [20, 40],
                    popupAnchor:[0, -40]
                }),
                title : 'Kalja rafla',
                alt: 'alt comes here',
                opacity: 0.8,
                riseOnHover: true
            },
            user: {
                title : 'Sinä',
                alt: 'alt comes here',
                riseOnHover: true
            }
        },

        /**
         * Polyline style options. Use these
         * when you wish to draw new polylines with
         * pre-defined styles to map.
         */
        routes: {
            'DEFAULT': {
                color: '#5eb5a7',
                smoothFactor: 1,
                noClip: false,
                weight: 3,
            },
            'BUS': {
                color: '#1c8bc9',
                noClip: true,
                weight: 3
            },
            'RAIL': {
                color: '#b8659d',
                noClip: true,
                weight: 3
            },
            'SUBWAY': {
                color: '#f75701',
                noClip: true,
                weight: 3
            },
            'TRAM': {
                color: '#196343',
                noClip: true,
                weight: 3,
            },
            'WALK': {
                color: '#5eb5a7',
                noClip: true,
                weight: 5,
                dashArray: '1, 6',
            },
            'FERRY': {
                color: '#196343',
                noClip: true,
                weight: 4,
            }
        },
    },
}




/**
* Calculates the distance in meters between two coordinate points
*
* @param {Number} lat1 latitude coordinate of the first point
* @param {Number} long1 longitude coordinate of the first point
* @param {Number} lat2 latitude coordinate of the second point 
* @param {Number} long2 longitude coordinate of the second point
*
* @returns {Number} the distance between the two points in meters
*/
export function calculateDistance(lat1, long1, lat2, long2) {
    let latRad1 = lat1 / (180/Math.PI);
    let longRad1 = long1 / (180/Math.PI);
    let latRad2 = lat2 / (180/Math.PI);
    let longRad2 = long2 / (180/Math.PI);

    let distance = 3963.0 * Math.acos(
        (Math.sin(latRad1) * Math.sin(latRad2)) + Math.cos(latRad1) * Math.cos(latRad2) * Math.cos(longRad2 - longRad2)
    ) * 1.609344 * 1000;

    return distance;
};

function setMarkerZoom(marker) {
    if (map._instance.getZoom() >= 13) {
        map._instance.panTo(marker.getLatLng(), map._instance.moveViewOptions); // No zoom
    } else {
        map.view.setTo(marker.getLatLng());
    }
    marker.setOpacity(1);
    marker.setZIndexOffset(100);
}
