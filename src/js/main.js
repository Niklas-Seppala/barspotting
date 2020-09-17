'use strict'

import { map } from "./map.js";

window.onload = () => {

    const btn = document.querySelector('#settings-bar-button');
    const settingsBar = document.querySelector('#settings-bar');
    console.log(btn);
    btn.addEventListener('click', _ => {
        if (!settingsBar.classList.contains('anim-panel-down') &&
            !settingsBar.classList.contains('anim-panel-up')) {
                settingsBar.classList.add('anim-panel-down');
                return;
        }
        settingsBar.classList.toggle('anim-panel-down');
        settingsBar.classList.toggle('anim-panel-up');
    })


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
