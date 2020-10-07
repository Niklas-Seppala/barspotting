'use strict'

import { events, formatTime, timeDiff } from "./main.js";
import { map, calculateDistance } from "./map.js";

export const ui = {

    userOptions: {
        rangeInKm: 20,
        includePizzas: false
    },
    modes : {
        'WALK': {
            instruction: 'Kävele',
            mode: 'Kävellen'
        },
        'BUS': {
            instruction: 'Bussi',
            mode: 'Bussi'
        },
        'SUBWAY': {
            instruction: 'Metro',
            mode: 'Metro'
        },
        'TRAM': {
            instruction: 'Ratikka',
            mode: 'Ratikka'
        },
        'RAIL': {
            instruction: 'Juna',
            mode: 'Juna'
        },
        'FERRY': {
            instruction: 'Lautta',
            mode: 'Lautta'
        }
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
        const expandIcon = menuBtn.querySelector('img');
        const settingsBar = document.querySelector('#settings-panel');
        menuBtn.addEventListener('click', _ => {
            if (!settingsBar.classList.contains('panel-down') &&
                !settingsBar.classList.contains('panel-up')) {
                    settingsBar.classList.add('panel-down');
            } else {
                settingsBar.classList.toggle('panel-down');
                settingsBar.classList.toggle('panel-up');
            }

            if (!expandIcon.classList.contains('expand') &&
                !expandIcon.classList.contains('de-expand')) {
                    expandIcon.classList.add('expand');
            } else {
                expandIcon.classList.toggle('expand');
                expandIcon.classList.toggle('de-expand');
            }
        });

        const routePanelBtn = document.querySelector('#route-panel-close-btn');
        const routePanel = document.querySelector('#route-panel');
        const backToLocationBtn = document.querySelector('#close-route-btn');

        backToLocationBtn.addEventListener('click', _ => {
            this.setElemVisibility('#close-route-btn', false);
            this.setElemVisibility('#route-instructions', false);
            this.setElemVisibility('#bar-info', true);

            document.querySelectorAll('.active-route').forEach(x => {
                x.classList.remove('active-route');
            });
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
        const clearSearchBtn = document.querySelector('#clear-search-btn')
        const searchInput = document.querySelector('#search-input');

        clearSearchBtn.addEventListener('click', e => {
            this.clearSearchBar();
            if (map.locations.anyHidden()) {
                map.locations.popCacheToMap();
            }
        });

        searchBtn.addEventListener('click', e => {
            const query = searchInput.value;
            if (query) {
                events.locationSearch(query);
                this.toggleLocationPanel('down');
            }
        });
    },
    setElemVisibility: function(selector, visible) {
        if (visible) {
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

        document.querySelectorAll(".route-btn").forEach(x => {
            x.remove();
        });
        routes.forEach((route) => {

            // Filter walk leg modes.
            const m = [];
            route.legs.forEach(leg => m.push(leg.mode));
            let temp = [...new Set(m.filter(mode => mode !== 'WALK'))];
            temp = temp.length === 0 ? ['WALK'] : temp;
            const travelModes = temp.map(m => this.modes[m].mode).join(', ')


            const firstLeg = route.legs[0];
            const lastLeg = route.legs[route.legs.length-1];

            const startTimeString = formatTime(firstLeg.startTime);
            const endTimeString = formatTime(lastLeg.endTime);

            const duration = timeDiff(firstLeg.startTime, lastLeg.endTime);
            let durationString = `${duration[1]}min`;
            if (duration[0] > 0) {
                durationString = `${duration[0]}h ` + durationString;
            }

            const routeItem = document.createElement('li');
            routeItem.classList.add('route');
            routeItem.innerHTML = `
                <span>
                    <time>${startTimeString}-${endTimeString} (${durationString})</time>
                    <span>${travelModes}</span>
                </span>
            `;

            const routeContainer = document.createElement('div');
            routeContainer.classList.add('btn');
            routeContainer.classList.add('route-btn');
            routeContainer.addEventListener('click', evt => {
                this.renderRoute(route, destination, evt);
            })

            routeContainer.appendChild(routeItem);
            routeList.appendChild(routeContainer);
        });
    },

    renderRoute: function(route, destination, event=null) {

        // Clear the map from other destination markers
        map.locations.onlyDisplayFocused(destination.id);

        // Display back button
        this.setElemVisibility('#close-route-btn', true);

        if (event != null) {
            // Remove old active css classes
            event.target.closest("ul").querySelectorAll('.active-route')
                .forEach(elem => elem.classList.remove('active-route'));

            // get pressed button;
            const routeBtn = event.target.classList.contains('btn') 
                ? event.target
                : event.target.closest('.btn');

            // set it active
            routeBtn.classList.add('active-route');
        }

        // from map
        map.routes.clear();
        // from panel
        document.querySelectorAll(".route-leg-container").forEach(leg => {
            leg.remove();
        });

        this.setElemVisibility('#bar-info', false);
        const routeInstructionsList = document.querySelector('#route-instructions');
        routeInstructionsList.classList.remove('hidden');

        route.legs.forEach((leg, i) => {
            
            const container = document.createElement('div');
            container.classList.add('btn');
            container.classList.add('route-leg-container');

            let routeStringParts = [];

            const timeElem = document.createElement('time');
            timeElem.classList.add('leg-time');
            timeElem.textContent = `${formatTime(leg.startTime)} - ${formatTime(leg.endTime)}`

            container.appendChild(timeElem);

            const destString = i != route.legs.length-1
                ? leg.to.name
                : destination.name.fi;

            routeStringParts.push(`${this.modes[leg.mode].instruction} kohteeseen ${destString}`);

            let detailStr = '';
            
            if (leg.mode == "WALK") {
                const distance = calculateDistance(leg.from.lat, leg.from.lon, leg.to.lat, leg.from.lon);
                detailStr = `${(distance/1000).toFixed(2)}km`;
    
                if (distance < 1000) {
                    detailStr = `${(distance).toFixed(0)}m`;
                }
            }

            const legItem = document.createElement('li');

            legItem.classList.add('route-leg');

            if (leg.intermediateStops.length > 0) {
                detailStr = `${leg.intermediateStops.length} stops`;
            }
            else if (leg.intermediateStops.length == 1) {
                detailStr = `1 stop`;
            }

            legItem.innerHTML = `
            <span>
                ${routeStringParts.join(" - ")}
            </span>`;
            container.appendChild(legItem);

            const detailElem = document.createElement('span');
            detailElem.textContent = detailStr;
            container.appendChild(detailElem);


            routeInstructionsList.appendChild(container);

            map.routes.draw(leg, map.options.routes[leg.mode], true);

            container.addEventListener('click', _ => {
                map.view.zoomTo([leg.from.lat, leg.from.lon], 16, 17);
            });
        });

        // Focus map to view the whole route
        map.view.fitBounds(
            map._layers.routes.getBounds(),
            {
                padding: [50,50],
                maxZoom: 16
            }
        );
    },
    
    renderError: function(err) {
        console.error(err);
    },

    clearSearchBar: function() {
        const searchInput = document.querySelector('#search-input');
        searchInput.value = '';
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
    },
    showLoadingSpinner: function() {
        this.setElemVisibility('#spinner', true);
    },
    hideLoadingSpinner: function() {
        this.setElemVisibility('#spinner', false);
    }
}