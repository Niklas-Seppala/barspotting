'use strict'

import { actions, formatTime, timeDiff } from "./main.js";
import { map, calculateDistance } from "./map.js";

export const ui = {
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

    /**
     * Initializes ui components.
     * (Adds eventhandlers)
     */
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

        const routePanelBtn = document.querySelector('#route-panel-btn');
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
                map.locations.popCache();
            }
            routePanel.classList.toggle('routes-down');
            map.routes.clear();
        });

        // locate button
        const locateBtn = document.querySelector('#locate-user-btn')
        locateBtn.addEventListener('click', _ => actions.onLocateBtnClicked());

        const tags = document.querySelector('#tag-selection');
        const tagTypes = tags.querySelector('#tag-types').children;
        const tagStyles = tags.querySelector('#tag-styles').children;

        for (let i = 0; i < tagTypes.length; i++) {
            const elem = tagTypes[i];
            const checkbox = elem.querySelector('input');
            checkbox.addEventListener('change', _ => {
                const include = this.locationTags.types[i].include;
                this.locationTags.types[i].include = !include
                actions.updateMarkers();
            })
        }
        for (let i = 0; i < tagStyles.length; i++) {
            const elem = tagStyles[i];
            const checkbox = elem.querySelector('input');
            checkbox.addEventListener('change', _ => {
                const include = this.locationTags.styles[i].include;
                this.locationTags.styles[i].include = !include
                actions.updateMarkers();
            })
        }

        const searchBtn = document.querySelector('#search-btn');
        const clearSearchBtn = document.querySelector('#clear-search-btn')
        const searchInput = document.querySelector('#search-input');

        clearSearchBtn.addEventListener('click', e => {
            this.clearSearchBar();
            if (map.locations.anyHidden()) {
                map.locations.popCache();
            }
        });

        searchBtn.addEventListener('click', e => {
            const query = searchInput.value;
            if (query) {
                actions.updateSearchedMarkers(query);
                this.toggleLocationPanel('down');
            }
        });
    },

    /**
     * Helper functio to hide and display elements
     * @param {string} selector css selector syntax
     * @param {boolean} visible true => visible
     */
    setElemVisibility: function(selector, visible) {
        if (visible) {
            document.querySelector(selector).classList.remove('hidden');
        } else {
            document.querySelector(selector).classList.add('hidden');
        }
    },

    /**
     * Renders selected bar's name, description etc.
     * to bar panel at the bottom of the screen.
     */
    renderBarInfo: function(bar, routes, loc) {
        this.toggleLocationPanel('up');

        this.setElemVisibility('#close-route-btn', false);
        this.setElemVisibility('#route-instructions', false);

        this.setElemVisibility('#bar-info', true);
        const barName = document.querySelector('#bar-name');
        const barLink = document.querySelector('#bar-link');
        const barDescription = document.querySelector('#bar-description');
        barName.innerText = bar.title;
        barLink.href = bar._infoUrl;
        barDescription.innerText = bar._description.body;

        this.renderRouteList(routes, loc);
    },

    /**
     * 
     * @param {*} routes 
     * @param {*} destination 
     * @param {*} exclude 
     */
    renderRouteList: function(routes, destination, exclude=null) {
        const routeList = document.querySelector('#route-list');

        document.querySelectorAll(".route-btn").forEach(x => {
            x.remove();
        });

        // Create each route element
        routes.forEach((route) => {

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
            routeItem.classList.add('btn');
            routeItem.classList.add('route-btn');
            routeItem.classList.add('route');
            routeItem.addEventListener('click', evt => {
                this.renderRoute(route, destination, evt);
            });
            routeItem.innerHTML = `
            <time>${startTimeString}</time><span>&nbsp;-&nbsp;</span><time>${endTimeString}</time>
            <span>&nbsp;${travelModes} (${durationString})</span>
            `;

            routeList.appendChild(routeItem);
        });
    },

    /**
     * Draws route polyline to map, and and details about
     * the journey to route panel.
     * @param {object} route 
     * @param {destination} destination
     * @param {Event} event 
     */
    renderRoute: function(route, destination, event=null) {

        // Clear the map from other destination markers
        map.locations.onlyDisplayFocused(destination.id);

        this.setElemVisibility('#close-route-btn', true);

        // update css classes
        if (event != null) {
            event.target.closest("ul").querySelectorAll('.active-route')
                .forEach(elem => elem.classList.remove('active-route'));

            const routeBtn = event.target.classList.contains('btn') 
                ? event.target
                : event.target.closest('.btn');

            routeBtn.classList.add('active-route');
        }

        // Clear the routes from ui
        map.routes.clear();
        document.querySelectorAll(".route-leg").forEach(leg => {
            leg.remove();
        });

        // hide bar description and display route instructions
        this.setElemVisibility('#bar-info', false);
        const routeInstructionsList = document.querySelector('#route-instructions');
        routeInstructionsList.classList.remove('hidden');

        route.legs.forEach((leg, i) => {
            
            // const routeInstruction = document.createElement('div');
            const routeInstruction = document.createElement('li');
            routeInstruction.classList.add('btn');
            routeInstruction.classList.add('route-leg');

            // Leg click eventhandler
            routeInstruction.addEventListener('click', _ => {
                map.view.zoomTo([leg.from.lat, leg.from.lon], 16, 17);
            });

            const legTime = document.createElement('div');
            legTime.innerHTML = 
                `<time>${formatTime(leg.startTime)}</time><span>&nbsp;-&nbsp;</span><time>${formatTime(leg.endTime)}</time>`
            routeInstruction.appendChild(legTime);

            let detailStr = '';
            if (leg.mode == "WALK") {
                const distance = calculateDistance(leg.from.lat, leg.from.lon, leg.to.lat, leg.from.lon);
                detailStr = `${(distance/1000).toFixed(2)}km`;
                if (distance < 1000) {
                    detailStr = `${(distance).toFixed(0)}m`;
                }
            }

            if (leg.intermediateStops.length > 0) {
                detailStr = `${leg.intermediateStops.length} stops`;
            }
            else if (leg.intermediateStops.length == 1) {
                detailStr = `1 stop`;
            }

            // Create directions to route leg element
            const destString = i != route.legs.length-1 ? leg.to.name : destination.name.fi;
            const directions = document.createElement('span');
            directions.textContent = `${this.modes[leg.mode].instruction} kohteeseen ${destString}`;
            routeInstruction.appendChild(directions)

            const detailElem = document.createElement('span');
            detailElem.textContent = detailStr;
            routeInstruction.appendChild(detailElem);

            routeInstructionsList.appendChild(routeInstruction);

            // draw new routes to map
            map.routes.draw(leg, map.options.routes[leg.mode], true);
        });

        // Focus map to view the whole route
        map.view.fitBounds(map._layers.routes.getBounds());
    },
    
    renderError: function(err) {
        console.error(err);
    },

    clearSearchBar: function() {
        const searchInput = document.querySelector('#search-input');
        searchInput.value = '';
    },

    /**
     * Location panel slide animation
     * @param {string} direction 'up' is up, 'down' is down
     */
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