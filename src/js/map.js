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
        pizza: {
            icon : L.icon({
                iconUrl: './icons/pizza-icon.png',
                iconSize: [40, 45],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
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

        this.instance.locate({watch: true, timeout: 5000, setView: false});
        this.instance.addLayer(this.layers.locations);
        this.instance.addLayer(this.layers.routes);
        return this;
    },

    focus: function() {
        this.instance.setView([
            this.user.position.lat, this.user.position.lon
        ], 13);
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

    /**
     * Creates and sets marker to map. Adds the created marker
     * to marker layer group. If marker options are not provided,
     * default options are used. Include popupHTML parameter if
     * you wish to include popup to map marker.
     * 
     * @param {object} location location object 
     * @param {object} options marker style options
     * @param {string} popupHTML popup's HTML string
     * @param {Function} onClick click eventHandler function,
     *      uses earlier location and position parameters.
     */
    setLocationMarker: function (location, options=null, popupHTML=null) {

        const drawOptions = options ? options : this.markerOptions.default;

        const marker = L.marker([location.location.lat, location.location.lon], drawOptions)
            .addTo(this.instance);

        if (popupHTML) {
            marker.bindPopup(popupHTML);
        }

        setMarkerClickEvent(marker, location);

        this.layers.locations.addLayer(marker);
        return marker;
    },

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

    createLocationHTML: function(location) {
        return `<h3>${location.name.fi}</h3>`
    },

    /**
     * Draws route polyline to map. Adds route to route layer group.
     * If draw options are not provided in parameters, polyline
     * is drawn using default options.
     * 
     * @param {string} points encoded google polyline string
     * @param {object} drawOptions polyline style options
     * 
     */
    drawRoute: function (points, drawOptions) {
        const options = drawOptions ? drawOptions : this.routeDrawOptions.DEFAULT;
        const route = L.polyline(polyline.decode(points), options);
        route.addTo(this.instance);
        this.layers.routes.addLayer(route);
        return this;
    }
}


/**
 * Sets marker click event. When marker is clicked,
 * map moves on top of that marker and zooms in smoothly.
 * Marker is also highlighted, and raised to the top on Z-axis.
 * 
 * @param {object} marker marker object.
 * @param {object} location location object.
 */
function setMarkerClickEvent(marker, location, ) {
    marker.on('click', eArgs => {
        if (map.instance.getZoom() >= 13) {
            map.instance.panTo(eArgs.target.getLatLng(), map.instance.moveViewOptions); // No zoom
        } else {
            map.instance.setView(eArgs.target.getLatLng(), 13,
            map.instance.moveViewOptions);
        }
        if (map.user.marker) {
            map.user.marker.setOpacity(0.8);
            map.user.marker.setZIndexOffset(0);
        }
        eArgs.target.setOpacity(1);
        eArgs.target.setZIndexOffset(100);
        map.user.marker = marker;
    });
}
