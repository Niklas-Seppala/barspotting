'use strict'

import { events, formatTime, timeDiff } from "./main.js";
import { map, calculateDistance } from "./map.js";

export const ui = {

    userOptions: {
        rangeInKm: 20,
        includePizzas: false
    },
    modes : {
        'WALK': 'Walk',
        'BUS': 'Bus',
        'SUBWAY': 'Metro',
        'TRAM': 'Tram',
        'RAIL': 'Train',
        'FERRY': 'Ferry'
    },
    locationTags: {
        types : [
            { tag: ['Bar', 'BARS & NIGHTLIFE'], uiStr: 'Baari', include: true },
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
        });

        const routePanelBtn = document.querySelector('#route-panel-btn');
        const routePanel = document.querySelector('#route-panel');
        const closeRouteBtn = document.querySelector('#close-route-btn');

        closeRouteBtn.addEventListener('click', _ => {
            if (map.locations.anyHidden()) {
                map.locations.popCacheToMap();
            }

            this.setElemVisibility("#"+_.target.id, false);

            this.setElemVisibility('#route-instructions', false);
            this.setElemVisibility('#bar-info', true);

            document.querySelectorAll('.active-route').forEach(x => {
                x.classList.remove('active-route');
            });
            map.routes.clear();
        });

        routePanelBtn.addEventListener('click', _ => {
            if (map.locations.anyHidden()) {
                map.locations.popCacheToMap();
            }
            routePanel.classList.toggle('routes-down');
            map.routes.clear();
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

        const searchBtn = document.querySelector('#search-btn');
        const searchInput = document.querySelector('#search-input');
        searchBtn.addEventListener('click', e => {
            const query = searchInput.value;
            if (query) {
                events.locationSearch(query);
                this.toggleLocationPanel('down');
            }
        });
    },

    setElemVisibility: function(selector, visible) {
        if (visible == true) {
            document.querySelector(selector).classList.remove('hidden');
        } else {
            document.querySelector(selector).classList.add('hidden');
        }
    },

    renderBarInfo: function(bar, routes, loc) {
        this.toggleLocationPanel('up');

        this.setElemVisibility('#close-route-btn', false);

        this.setElemVisibility('#route-instructions', false);

        const routePanel = document.querySelector('#route-panel');

        this.setElemVisibility('#bar-info', true);
        const barName = document.querySelector('#bar-name');
        const barLink = document.querySelector('#bar-link');
        const barDescription = document.querySelector('#bar-description');
        barName.innerText = bar.title;
        barLink.href = bar._infoUrl;
        barDescription.innerText = bar._description.body;

        this.renderRouteList(routes, loc);
    },

    renderRouteList: function(routes, destination, exclude=null) {
        const routeList = document.querySelector('#route-list');
        const routeListSection = document.querySelector("#route-list section");

        document.querySelectorAll(".route").forEach(x => {
            x.remove();
        });
        routes.forEach((route) => {

            const firstLeg = route.legs[0];
            const lastLeg = route.legs[route.legs.length-1];

            // evil oneliner to pad with zeroes
            const d = (x) => x<10 ? "0"+x : x;

            const startTimeString = formatTime(firstLeg.startTime);
            const endTimeString = formatTime(lastLeg.endTime);


            const duration = timeDiff(firstLeg.startTime, lastLeg.endTime);
            let durationString = `${duration[1]}min`;
            if (duration[0] > 0) {
                durationString = `${duration[0]}h ` + durationString;
            }

            const travelModes = route.legs.map(leg => this.modes[leg.mode]).join(", ");

            const routeItem = document.createElement('li');
            routeItem.classList.add('route');
            routeItem.innerHTML = `
                <span>
                    <time>${startTimeString} - ${endTimeString} (${durationString})</time>
                    <span>${travelModes}</span>
                </span>
            `;
            routeListSection.appendChild(routeItem);

            routeItem.addEventListener('click', (evt) => {
                this.renderRoute(route, destination, evt);
            });

        });
    },
    renderRoute: function(route, destination, evt=null) {

        map.locations.onlyDisplayFocused(destination.id);

        this.setElemVisibility('#close-route-btn', true);
        if (evt != null) {
            const routeItem = evt.target.closest("li");

            document.querySelectorAll('.active-route').forEach(x => {
                x.classList.remove('active-route');
            });

            if(!routeItem.classList.contains('active-route')) {
                routeItem.classList.add('active-route');
            }
        }

        map.routes.clear();
        document.querySelectorAll(".route-leg").forEach(x => {
            x.remove();
        });

        const barInfoPanel = document.querySelector('#bar-info');
        barInfoPanel.classList.add('hidden');
        const routeInstructionsList = document.querySelector('#route-instructions');


        routeInstructionsList.classList.remove('hidden');
        route.legs.forEach(leg => {
            let routeStringParts = [];

            const startTimeString = formatTime(leg.startTime);
            const endTimeString = formatTime(leg.endTime);

            routeStringParts.push(startTimeString);
            routeStringParts.push(endTimeString);

            routeStringParts.push(`${this.modes[leg.mode]} to ${leg.to.name}`);

            if (leg.mode == "WALK") {
                const distance = calculateDistance(leg.from.lat, leg.from.lon, leg.to.lat, leg.from.lon);
                let distanceString = `${(distance/1000).toFixed(2)}km`;
    
                if (distance < 1000) {
                    distanceString = `${(distance).toFixed(0)}m`;
                }

                routeStringParts.push(distanceString)
            }

            const legItem = document.createElement('li');
            legItem.classList.add('route-leg');

            const duration = timeDiff(leg.startTime, leg.endTime);

            let durationString = `${duration[1]}min`;
            if (duration[0] > 0) {
                durationString = `${duration[0]}h ` + durationString;
            }
            routeStringParts.push(durationString);

            let stopAmountString = ``;
            if (leg.intermediateStops.length > 0) {
                stopAmountString = `${leg.intermediateStops.length} stops`;
                routeStringParts.push(stopAmountString);
            }
            else if (leg.intermediateStops.length == 1) {
                stopAmountString = `1 stop`;
                routeStringParts.push(stopAmountString); 
            }

            legItem.innerHTML = `
            <span>
                <time>${startTimeString}</time>
                ${routeStringParts.join(" - ")}
            </span>`;
            routeInstructionsList.appendChild(legItem);
            
            map.routes.draw(leg, map.options.routes[leg.mode], true);

            legItem.addEventListener('click', _ => {
                map.view.zoomTo([leg.from.lat, leg.from.lon], 16, 17);
            });
        });
    },
    
    renderError: function(err) {
        console.error(err);
    },

    toggleLocationPanel: function(direction) {
        const routePanel = document.querySelector('#route-panel');
        if (direction === 'up') {
            routePanel.classList.add('routes-up');
            routePanel.classList.remove('routes-down')
        } else if (direction === 'down') {
            if (routePanel.classList.contains('routes-up')) {
                routePanel.classList.add('routes-down');
                routePanel.classList.remove('routes-up')
            }
        }
    }

}