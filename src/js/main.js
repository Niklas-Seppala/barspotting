'use strict'

import { map } from "./map.js";
import { ui } from "./ui.js"

window.onload = () => {
    ui.init();
    map.create('map');
    map.instance.on('locationfound', events.onLocationFound);
    map.instance.on('locationerror', events.onLocationError);
}


export const events = {

    onLocationFound: function(position) {
        map.user.position = position.latlng;
        map.refreshUserLocationMarker();
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
    }
}




