'use strict'

import { map } from "./map.js";
import { ui } from "./ui.js"
import { locationAPI, routesAPI } from "./data.js";

window.onload = () => {
    const fetchStaticData = [locationAPI.getNightlifeAsync(), locationAPI.getPizzaAsync()];
    ui.init();
    map.create('map');
    map.instance.on('locationfound', events.onLocationFound);
    map.instance.on('locationerror', events.onLocationError);

    Promise.all(fetchStaticData).then(data => {
        const [bars, pizzas] = data;
        alert('dataaaa')
    });
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




