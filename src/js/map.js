'use strict'

/**
 * Container object to functions and
 * constant data related to map state
 * manipulation.
 * 
 * All functions support function call chaining.
 */
export const map = {

    user: {
        position: null,
        marker: null,
    },
    instance: null,

    layers: {
        routes: new L.FeatureGroup(),
        locations: new L.FeatureGroup()
    },

    routes: new L.FeatureGroup(), // route layer group.
    locationMarkers: new L.FeatureGroup(), // location marker layer group.

    newPos: function (latitude, longitude) {
        return {lat: latitude, lon: longitude}
    },

    /**
     * Map movement animation options
     * object. DON'T CHANGE THE STATE!
     */
    moveViewOptions: {
        animate: true,
        duration: 0.6,
        easeLinearity: 0.25,
        noMoveStart: true
    }, 

    /**
     * Map marker style options. Use these when you want
     * to set markers with pre-defined styles
     * to map. DON'T CHANGE THE STATES!
     */
    markerOptions: {
        default: {
            title : 'title here',
            alt: 'alt comes here',
            opacity: 0.8,
            riseOnHover: true
        },
        bar: {
            icon : L.icon({
                iconUrl: './img/beer-icon.png',
                iconSize: [40, 45],
                iconAnchor: [20, 40],
                popupAnchor:[4, -80]
            }),
            title : 'Kalja rafla',
            alt: 'alt comes here',
            opacity: 0.8,
            riseOnHover: true
        },
        bus: {
            icon : L.icon({
                iconUrl: './img/bus-icon.png',
                iconSize: [40, 45],
                iconAnchor: [20, 40],
                popupAnchor: [4, -80]
            }),
            title : 'bussi bysäkki',
            alt: 'alt comes here',
            opacity: 0.8,
            riseOnHover: true
        },
        pizza: {
            icon : L.icon({
                iconUrl: './img/pizza-icon.png',
                iconSize: [40, 45],
                iconAnchor: [20, 40],
                popupAnchor: [4, -80]
            }),
            title : 'pizzeria',
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
     * Map polyline style options. Use these
     * when you wish to draw new polylines with
     * pre-defined styles to map. DON'T CHANGE STATES!
     */
    routeDrawOptions: {
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

    /**
     * Creates leaflet.js map to specified DOM element id.
     * Map uses HSL map tiles. Created map is stored to this
     * module. If you create new one, the old map is replaced.
     * 
     * Use the functions in this module to manipulate map state!
     * 
     * @param {string} mapId element id of the element where the map will be located.
     */
    create: function (mapId) {
        this.instance = L.map(mapId).fitWorld();
        L.tileLayer('https://cdn.digitransit.fi/map/v1/hsl-map/{z}/{x}/{y}.png', {
            maxZoom: 17,
            minZoom: 11,
            tileSize: 512,
            zoomOffset: -1,
            zoomControl: false
        }).addTo(this.instance);

        this.instance.locate({setView: true, maxZoom: 13});
        this.instance.addLayer(this.layers.locations);
        this.instance.addLayer(this.layers.routes);
        return this;
    },

    /**
    * Clears marker layer from the map.
    */
    clearLocationMarkers: function () {
        this.layers.locations.clearLayers();
        return this;
    },

    /**
    * Clears route layer from the map.
    */
    clearRoutes: function () {
        this.layers.routes.clearLayers();
        return this;
    },

    /**
     * Sets the map view to specified position.
     * @param {} position New map view position.
     */
    setView: function (position) {
        this.instance.setView(position, 13)
        return this;
    },

    /**
     * Clears user's marker from the map.
     */
    clearUserLocationMarker: function () {
        if (this.user.marker) {
            this.instance.removeLayer(this.user.marker);
            this.user.marker = null;
        }
        return this;
    },

    /**
     * Refreshes user's marker to new position.
     */
    refreshUserLocationMarker: function () {
        return this.clearUserLocationMarker().SetUserMarker();
    },

    // /**
    //  * Creates and sets marker to map. Adds the created marker
    //  * to marker layer group. If marker options are not provided,
    //  * default options are used. Include popupHTML parameter if
    //  * you wish to include popup to map marker.
    //  * 
    //  * @param {Position} markerPos marker Position object.
    //  * @param {object} location location object 
    //  * @param {object} options marker style options
    //  * @param {string} popupHTML popup's HTML string
    //  * @param {Function} onClick click eventHandler function,
    //  *      uses earlier location and position parameters.
    //  */
    // setMarker: function (markerPos, location, options, popupHTML=null, onClick=null) {
    //     const drawOptions = options ? options : this.markerOptions.default;
    //     const marker = L.marker([markerPos.lat, markerPos.lon], drawOptions).addTo(mapObject);
    //     if (popupHTML) {
    //         marker.bindPopup(popupHTML)
    //     }
    //     setMarkerClickEvent(marker, markerPos, location, onClick);
    //     locationMarkers.addLayer(marker);
    //     return this;
    // },

    /**
     * Creates and sets user's location marker to map.
     * Marker style options are pre-defined user options.
     * Include popupHTML parameter if you wish to add popup
     * to marker.
     * 
     * @param {string} popupHTML popup's HTML string
     * @param {Function} onClick click eventhandler function
     * 
     */
    SetUserMarker: function (popupHTML=null, onClick=null) {
        console.log(this.user.position)
        this.user.marker = L.marker(this.user.position, this.markerOptions.user)
            .addTo(this.instance);

        if (popupHTML) {
            this.user.marker.bindPopup(popupHTML)
        }
        
        if (onClick) {
            this.user.marker.on('click', _ => {
                onClick.call(this.user.marker);
            });
        }
        return this;
    },

    // /**
    //  * Draws route polyline to map. Adds route to route layer group.
    //  * If draw options are not provided in parameters, polyline
    //  * is drawn using default options.
    //  * 
    //  * @param {string} points encoded google polyline string
    //  * @param {object} drawOptions polyline style options
    //  * 
    //  */
    // drawRoute: function (points, drawOptions) {
    //     const options = drawOptions ? drawOptions : routeDrawOptions.default;
    //     const route = L.polyline(polyline.decode(points), options);
    //     route.addTo(mapObject);
    //     routes.addLayer(route);
    //     return this;
    // }
}


// /**
//  * Sets marker click event. When marker is clicked,
//  * map moves on top of that marker and zooms in smoothly.
//  * Marker is also highlighted, and raised to the top on Z-axis.
//  * 
//  * @param {object} marker marker object.
//  * @param {Position} position marker's Position object.
//  * @param {object} location location object.
//  * @param {Function} onClick eventhandler function.
//  */
// function setMarkerClickEvent(marker, position, location, onClick) {
//     marker.on('click', eArgs => {
//         if (mapObject.getZoom() >= 13) {
//             mapObject.panTo(eArgs.target.getLatLng(), mapObject.moveViewOptions); // No zoom
//         } else {
//             mapObject.setView(eArgs.target.getLatLng(), 13,
//             mapObject.moveViewOptions);
//         }
//         if (map.user.marker) {
//             map.user.marker.setOpacity(0.8);
//             map.user.marker.setZIndexOffset(0);
//         }
//         eArgs.target.setOpacity(1);
//         eArgs.target.setZIndexOffset(100);
//         map.user.marker = marker;

//         if (onClick) {
//             onClick.call(null, ...[position, location]);
//         }
//     });
// }
