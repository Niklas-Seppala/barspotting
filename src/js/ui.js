'use strict'
import { events } from "./main.js";


export const ui = {
    init: function() {

        // set menu slider click events
        const menuBtn = document.querySelector('#settings-panel-button');
        const settingsBar = document.querySelector('#settings-panel');
        menuBtn.addEventListener('click', _ => {
            if (!settingsBar.classList.contains('panel-down') &&
                !settingsBar.classList.contains('panel-up')) {
                    settingsBar.classList.add('panel-down');
                    return;
            }
            settingsBar.classList.toggle('panel-down');
            settingsBar.classList.toggle('panel-up');
        })

        // locate button
        const locateBtn = document.querySelector('#locate-user-btn')
        locateBtn.addEventListener('click', _ => events.onLocateBtnClicked());

        // const tags = document.querySelector('.tag-selection');
        // const tagTypes = tags.querySelector('#tag-types');
    }
}