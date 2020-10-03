'use strict'

import { map } from "./map.js";
import { ui } from "./ui.js"
import { locationAPI } from "./data.js";

let bars, pizzas;
let locateTogle = true;

window.onload = () => {
    const fetchStaticData = [locationAPI.getNightlifeAsync(), locationAPI.getPizzaAsync()];
    ui.init();
    map.create('map');
    map.instance.on('locationfound', events.onLocationFound);
    map.instance.on('locationerror', events.onLocationError);

    Promise.all(fetchStaticData).then(data => {
        [bars, pizzas] = data;
        map.createLocations(bars, map.markerOptions.bar);
        events.onLocationParamsChange();
    });
}

export const events = {
    onLocationFound: function(position) {
        map.user.position = map.newPos(position.latlng.lat, position.latlng.lng) ;
        map.refreshUserLocationMarker();
        if (locateTogle) {
            map.focus();
            locateTogle = false;
        }
    },

    onLocationError: function(err) {
        alert(err.message);
        
    },

    onLocateBtnClicked: function() {
        try {
            map.setView(map.user.position);
        } catch (error) {
            alert(error.message)
        }
    },

    onLocationParamsChange: function () {
        if (map.layers.locations) {
            map.locations.clear();
        }
        const filteredBarIds = locationAPI.filterLocationsByTags(bars, ui.locationTags.styles
            .concat(ui.locationTags.types)
            .filter(tag => tag.include)
            .map(tag => tag.tag)
            .flat());
        
        filteredBarIds.forEach(id => {
            const len = map.markerPool.locations.length;
            for (let i = 0; i < len; i++) {
                const m = map.markerPool.locations[i];
                if (m.locationId === id) {
                    map.layers.locations.addLayer(m);
                }
            }
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