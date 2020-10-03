'use strict'

import { routesAPI } from "./data.js";
import { ui } from "./ui.js";
import { polyline } from "./polyline.js";

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


        let barOptions = {...drawOptions};

        locations.forEach(loc => {
            barOptions.title = loc.name.fi;
            barOptions._description = loc.description;
            barOptions._infoUrl = loc.info_url;

            const marker = L.marker([loc.location.lat, loc.location.lon], barOptions)
            .addTo(this.instance);

            if (popupHTML) {
                marker.bindPopup(popupHTML);
            }
            marker.locationId = loc.id;

            marker.on('click', _ => setMarkerZoom(marker))

            marker.on('click', async _ => {
                console.log('marker clicked', marker)
                this.clearRoutes();
                ui.toggleLocationPanel('down');

                ui.showLoadingSpinner();
                const routes = await routesAPI.getRoutesToBarAsync(this.user.position, loc.location);
                ui.hideLoadingSpinner();
                if (routes) {
                    ui.renderBarInfo(marker.options, routes, loc);
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
    },
    /**
    * Draws circles for the stops on the map
    *
    * @param {Array} latitude and longitude as an array 
    */
    drawRouteStop: function(latLng) {

        const circle = L.circle(
            latLng, {radius: 20}
        ).addTo(
        this.instance
        );
        this.layers.routes.addLayer(circle);

        return this;
    }
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
    if (map.instance.getZoom() >= 13) {
        map.instance.panTo(marker.getLatLng(), map.instance.moveViewOptions); // No zoom
    } else {
        map.instance.setView(marker.getLatLng(), 13,
        map.instance.moveViewOptions);
    }
    if (map.user.marker) {
        map.user.marker.setOpacity(0.8);
        map.user.marker.setZIndexOffset(0);
    }
    marker.setOpacity(1);
    marker.setZIndexOffset(100);
}

