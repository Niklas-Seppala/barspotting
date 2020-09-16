'use strict'

import { map } from "./map.js";

window.onload = () => {

    map.create('map');
    map.instance.on('locationfound', onLocationFound);
    map.instance.on('locationerror', onLocationError);
}

function onLocationFound(position) {
    map.user.position = position;
    alert('gps found');
}

function onLocationError(err) {
    console.error(err);
    alert('loaction error');
}
