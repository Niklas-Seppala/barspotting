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
            map.clearLocationMarkers();
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
