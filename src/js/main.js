'use strict'

import { map } from "./map.js";
import { ui } from "./ui.js"
import { locationAPI } from "./data.js";

let bars, pizzas;
let locateTogle = true;

window.onload = () => {
    const fetchStaticData = [locationAPI.getNightlifeAsync(), locationAPI.getPizzaAsync()];
    ui.init();

    ui.showLoadingSpinner();
    map.create('map');
    
    map.view.setTo(map.newPos(60.160095, 24.942513));

    map.gps.on('found', events.onLocationFound);
    map.gps.on('error', events.onLocationError);

    Promise.all(fetchStaticData).then(data => {
        [bars, pizzas] = data;
        map.locations.create(bars, map.options.markers.bar);
        events.onLocationParamsChange();
        ui.hideLoadingSpinner();
    });
}

export const events = {
    onLocationFound: function(position) {

        // Update user's position
        map.user.position = map.newPos(position.latlng.lat, position.latlng.lng);

        if (locateTogle) {
            // Only run the first time
            map.user.marker.create();
            map.view.focus(); // because of this. // TODO: make more sense of this
            locateTogle = false;
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

    locationSearch: function(query) {
        if (map._layers.locations) {
            map.locations.cache();
            map.locations.clear();
            map.locations.focusGroup.clearLayers();
        }

        const filteredIds = locationAPI.filterLocationsByName(bars, query);
        filteredIds.forEach(id => {
            map._layers.locations.addLayer(map.locations._markerPool[id]);
            map.locations.focusGroup.addLayer(map.locations._markerPool[id]);
        })
        map.view.fitBounds(map.locations.focusGroup.getBounds());
    },

    onLocationParamsChange: function () {
        if (map._layers.locations) {
            map.locations.clear();
        }
        const filteredBarIds = locationAPI.filterLocationsByTags(bars, ui.locationTags.styles
            .concat(ui.locationTags.types)
            .filter(tag => tag.include)
            .map(tag => tag.tag)
            .flat());
        
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

    let startHours = time1date.getHours();
    let startMinutes = time1date.getMinutes();

    let endHours = time2date.getHours();
    let endMinutes = time2date.getMinutes();


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