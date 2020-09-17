'use strict'

import { map } from "./map.js";
import { ui } from "./ui.js"
import { locationAPI, routesAPI } from "./data.js";

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
        events.onLocationParamsChange()
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

    /**
     * This eventhandler should be called when something changes
     * that should impact on the bars and pizzaplaces
     * displayed to user.
     * For example:
     *      User changes range parameter on the UI =>
     *      This function processes location data with changed
     *      parameters (range) and calls UI module to render
     *      changes to screen.
     *
     *      Same principle is applied to any user made changes on the UI
     *      that impact location data.
     *
     * NOTE! walkRoute-checkbox impacts routes, not location data!
     */
    onLocationParamsChange: function () {
        if (map.layers.locations) {
            map.clearLocationMarkers();
        }
        const filteredBars = locationAPI.filterLocationsByTags(bars, ui.locationTags.styles
            .concat(ui.locationTags.types)
            .filter(tag => tag.include)
            .map(tag => tag.tag)
            .flat(), ui.locationTags.exclusive);

        // let destinationGotFiltered = Boolean(currentDestination);
        
        filteredBars.forEach(loc => {

            // Check if users selected destination got filtered
            // if (currentDestination && location.id === currentDestination.id) {
            //     destinationGotFiltered = false;
            // }
            // const html = map.createLocationHTML(loc);
            map.setMarker(map.newPos(loc.location.lat, loc.location.lon), loc,
                map.markerOptions.bar, null, null); //appEvents.onlocationMarkerClicked
        });

        // if (userCtrValues.includePizzas) {
        //     const pizzasCloseBy = locationAPI.getLocationsByPos(pizzas, userLocation, userCtrValues.rangeInKm);
        //     pizzasCloseBy.forEach(location => {
        //         // Check if users selected destination got filtered
        //         if (currentDestination && location.id === currentDestination.id) {
        //             destinationGotFiltered = false;
        //         }
        //         map.setMarker(new Position(location.location.lat, location.location.lon),
        //             location, map.markerOptions.pizza, null, appEvents.onlocationMarkerClicked);
        //     });
        // }
        // if (destinationGotFiltered) {
        //     ui.renderRouteInstructions([], null)
        //     currentDestination = null;
        // }
    },
}




