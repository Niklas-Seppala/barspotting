'use strict'

import { events, timeDiff } from "./main.js";
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
        const closeRouteBtn = document.querySelector('#close-route-btn');

        closeRouteBtn.addEventListener('click', _ => {
            _.target.classList.add('hidden');
            const barInfoPanel = document.querySelector('#bar-info');
            const routeInstructionsList = document.querySelector('#route-instructions');

            routeInstructionsList.classList.add('hidden');
            barInfoPanel.classList.remove('hidden');

            document.querySelectorAll('.active-route').forEach(x => {
                x.classList.remove('active-route');
            });
        });

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
    renderBarInfo: function(bar, routes, loc) {
        this.toggleLocationPanel('up');
        const routeList = document.querySelector('#route-list');

        const closeRouteBtn = document.querySelector('#close-route-btn');
        closeRouteBtn.classList.add('hidden');

        const routeInstructionsList = document.querySelector('#route-instructions');

        routeInstructionsList.classList.add('hidden');

        const routePanel = document.querySelector('#route-panel');

        const barInfoPanel = document.querySelector('#bar-info');
        barInfoPanel.classList.remove('hidden');
        const barName = document.querySelector('#bar-name');
        const barDescription = document.querySelector('#bar-description');
        barName.innerText = bar.title;
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
                    <time>${durationString}</time>
                    <span>${travelModes}</span>
                </span>
            `;
            routeListSection.appendChild(routeItem);

            routeItem.addEventListener('click', (evt) => {this.renderRoute(route, evt)});

        });
    },
    renderRoute: function(route, evt=null) {
        const closeRouteBtn = document.querySelector('#close-route-btn');
        closeRouteBtn.classList.remove('hidden');
        if (evt != null) {
            const routeItem = evt.target;
            document.querySelectorAll('.active-route').forEach(x => {
                x.classList.remove('active-route');
            });

            if(!routeItem.classList.contains('active-route')) {
                routeItem.classList.add('active-route');
            }
        }

        map.clearRoutes();
        document.querySelectorAll(".route-leg").forEach(x => {
            x.remove();
        });

        const barInfoPanel = document.querySelector('#bar-info');
        barInfoPanel.classList.add("hidden");
        const routeInstructionsList = document.querySelector('#route-instructions');


        routeInstructionsList.classList.remove("hidden");
        route.legs.forEach(leg => {
            const distance = calculateDistance(leg.from.lat, leg.from.lon, leg.to.lat, leg.from.lon);

            let distanceString = `${(distance/1000).toFixed(2)}km`;

            if (distance < 1000) {
                distanceString = `${(distance).toFixed(0)}m`;
            }

            // evil oneliner to pad with zeroes
            const d = (x) => x<10 ? "0"+x : x;

            const startTimeDate = new Date(leg.startTime);
            const endTimeDate = new Date(leg.endTime);

            const startHours = startTimeDate.getHours();
            const startMinutes = endTimeDate.getMinutes()

            const endHours = endTimeDate.getHours();
            const endMinutes = endTimeDate.getMinutes();

            const startTimeString = `${d(startHours)}:${d(startMinutes)}`;
            const endTimeString = `${d(endHours)}:${d(endMinutes)}`;


            const legItem = document.createElement("li");
            legItem.classList.add('route-leg');

            const duration = timeDiff(leg.startTime, leg.endTime);

            let durationString = `${duration[1]}min`;
            if (duration[0] > 0) {
                durationString = `${duration[0]}h ` + durationString;
            }
            legItem.innerHTML = `
            <span>
                <time>${startTimeString}</time>
                ${this.modes[leg.mode]} to ${leg.to.name} (${distanceString} - ${durationString})
            </span>`;
            routeInstructionsList.appendChild(legItem);
            map.drawRoute(leg.legGeometry.points, map.routeDrawOptions[leg.mode]);
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