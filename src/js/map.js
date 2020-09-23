'use strict'

import { routesAPI } from "./data.js";
import { ui } from "./ui.js";

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

    markerPool: {
        locations: [],
        routes: []
    },

    newPos: function (latitude, longitude) {
        return {lat: latitude, lon: longitude}
    },

    moveViewOptions: {
        animate: true,
        duration: 0.6,
        easeLinearity: 0.25,
        noMoveStart: true
    },

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

    createLocations: function(locations, options, popupHTML) {
        const drawOptions = options ? options : this.markerOptions.default;
        locations.forEach(loc => {
            const marker = L.marker([loc.location.lat, loc.location.lon], drawOptions)
            .addTo(this.instance);

            if (popupHTML) {
                marker.bindPopup(popupHTML);
            }
            marker.locationId = loc.id;

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

            marker.on('click', async _ => {

                console.log('marker clicked')

                this.clearRoutes();
                const routePanel = document.querySelector('#route-panel');
                if (routePanel.classList.contains('routes-up')) {
                    routePanel.classList.add('routes-down');
                    routePanel.classList.remove('routes-up')
                }
                const routes = await routesAPI.getRoutesToBarAsync(this.user.position, loc.location);
                if (routes) {
                    ui.renderRouteInstructions(routes, loc);
                } else {
                    ui.renderError('no routes');
                }
            })
            this.markerPool.locations.push(marker);
        });
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
        this.clearUserLocationMarker();
        this.user.marker = L.marker(this.user.position, this.markerOptions.user)
        this.user.marker.addTo(this.instance);
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

