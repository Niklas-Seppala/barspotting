'use strict'

import { events } from "./main.js";
import { map } from "./map.js";

export const ui = {

    userOptions: {
        rangeInKm: 20,
        includePizzas: false
    },

    locationTags: {
        // exclusive: false,
        types : [
            { tag: 'Bar', uiStr: 'Baari', include: true },
            { tag: ['Nightclub', 'Club'] , uiStr: 'Yökerho', include: true },
            { tag: 'Cafe', uiStr: 'Kahvila', include: true },
            { tag: 'Pub', uiStr: 'Pubi', include: true },
        ],
        styles: [
            { tag: 'Billiards', uiStr: 'Biljardi', include: false },
            { tag: 'LiveMusic', uiStr: 'Live musiikki', include: false },
            { tag: 'Metal', uiStr: 'Metalli', include: false },
            { tag: 'Beer', uiStr: 'Olut', include: false },
            { tag: 'Karaoke', uiStr: 'Karaoke', include: false },
            { tag: 'Rock', uiStr: 'Rock', include: false },
            { tag: 'Sport', uiStr: 'Sportti', include: false },
            { tag: 'LGBT', uiStr: 'LGBT', include: false },
        ]
    },

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

        const routePanelBtn = document.querySelector('#route-panel-btn');
        const routePanel = document.querySelector('#route-panel');

        routePanelBtn.addEventListener('click', _ => {
            routePanel.classList.toggle('routes-down');
            map.clearRoutes();
        });

        // locate button
        const locateBtn = document.querySelector('#locate-user-btn')
        locateBtn.addEventListener('click', _ => events.onLocateBtnClicked());

        const tags = document.querySelector('#tag-selection');
        const tagTypes = tags.querySelector('#tag-types').children;
        const tagStyles = tags.querySelector('#tag-styles').children;


        for (let i = 0; i < tagTypes.length; i++) {
            const elem = tagTypes[i];
            const checkbox = elem.querySelector('input');
            checkbox.addEventListener('change', _ => {
                const include = this.locationTags.types[i].include;
                this.locationTags.types[i].include = !include
                events.onLocationParamsChange();
            })
        }
        for (let i = 0; i < tagStyles.length; i++) {
            const elem = tagStyles[i];
            const checkbox = elem.querySelector('input');
            checkbox.addEventListener('change', _ => {
                const include = this.locationTags.styles[i].include;
                this.locationTags.styles[i].include = !include
                events.onLocationParamsChange();
            })
        }
    },

    renderRouteInstructions: function(routes, destination) {

        const routePanel = document.querySelector('#route-panel');
        routePanel.classList.add('routes-up');
        routePanel.classList.remove('routes-down')

        routes[0].legs.forEach(leg => {
            map.drawRoute(leg.legGeometry.points, map.routeDrawOptions[leg.mode]);
        });
    },

    renderError: function(err) {
        console.error(err);
    }
}