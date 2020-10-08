'use strict'

import { map } from "./map.js";
import { ui } from "./ui.js"
import { api } from "./data.js";

let bars; // all the bar locations
let locateFlag = true;

window.onload = async () => {
    // start fetching the static api data
    const fetchBars = api.getBarsAsync();
    
    ui.init();
    ui.showLoadingSpinner();

    map.create('map');
    map.view.setTo(map.newPos(60.160095, 24.942513)); // Position in central helsinki

    // GPS event handlers
    map.gps.on('found', actions.onLocationFound);
    map.gps.on('error', actions.onLocationError);

    bars = await fetchBars;

    // create and store the location markers.
    map.locations.create(bars, map.options.markers.bar);

    actions.updateMarkers();

    ui.hideLoadingSpinner();
}

export const actions = {
    onLocationFound: function(position) {

        // Update user's position
        map.user.position = map.newPos(position.latlng.lat, position.latlng.lng);

        if (locateFlag) {
            // Only run the first time
            map.user.marker.create();
            map.view.focus(); // because of this. // TODO: make more sense of this
            locateFlag = false;
        } else {
            map.user.marker.move(map.user.position);
        }
    },

    onLocationError: function(err) {
        console.error(err.message);
    },

    onLocateBtnClicked: function() {
        map.view.focus();
    },

    /**
     * Updates te searched locations to map, old map state
     * is cached for future use.
     * @param {string} searchName 
     */
    updateSearchedMarkers: function(searchName) {
        if (map._layers.locations) {
            map.locations.cache();
            map.locations.clear();
            map.locations.focusGroup.clearLayers();
        }

        const filteredIds = api.filterLocationsByName(bars, searchName);
        filteredIds.forEach(id => {
            map._layers.locations.addLayer(map.locations._markerPool[id]);
            map.locations.focusGroup.addLayer(map.locations._markerPool[id]);
        })
        map.view.fitBounds(map.locations.focusGroup.getBounds());
    },

    /**
     * Updates the markers diplayed to ui
     */
    updateMarkers: function () {
        // Clear any previous markers
        if (map._layers.locations) {
            map.locations.clear();
        }

        const filteredBarIds = api.filterLocationsByTags(bars, ui.locationTags.styles
            .concat(ui.locationTags.types)
            .filter(tag => tag.include) // check if tag is selected active in the ui
            .map(tag => tag.tag)
            .flat()); // some tags got two "internal" tags
        
        filteredBarIds.forEach(id => {
            map._layers.locations.addLayer(map.locations._markerPool[id])
        });
    },
}

/**
* Utility function to get difference in two Unix timestamps
* 
* @param {Number} time1 timestamp of the starting time
* @param {Number} time2 timestamp of the ending time
* 
* @returns {Array} the time difference in hours and minutes
*/
export function timeDiff(time1, time2) {
    let time1date = new Date(time1);
    let time2date = new Date(time2);

    let diffMilliseconds = time2date - time1date;

    let diffHours = Math.floor((diffMilliseconds % 86400000) / 3600000);
    let diffMinutes = Math.round(((diffMilliseconds % 86400000) % 3600000) / 60000);

    return [diffHours, diffMinutes];
}

/**
* Utility function to render an Unix timestamp as a human readable string (HH:MM)
* 
* @param {Number} timeStamp Unix timestamp
* 
* @returns {String} the time as a human readable string
*/
export function formatTime(timeStamp) {
    // evil oneliner to pad with zeroes
    const d = (x) => x<10 ? "0"+x : x;

    const date = new Date(timeStamp);

    const hours = date.getHours();
    const minutes = date.getMinutes()

    return `${d(hours)}:${d(minutes)}`;
}