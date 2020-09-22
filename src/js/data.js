'use strict'

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const DIGITRANSIT_URL = `https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql`;

/**
 * 
 */
export const locationAPI = {
    /**
    * Sends async API call to open-api.myhelsinki.fi for
    * all the locations that contain 'Pizza'-tag. Tags and meta
    * are excluded from response object.
    * 
    * @returns {object[]} collection containing
    *      pizza locations in helsinki.
    */
    getPizzaAsync: async function () {
        const url = `${CORS_PROXY}http://open-api.myhelsinki.fi/v1/places/?tags_search=Pizza`;
        try {
            const response = await fetch(url);
            const data = await response.json()
            return data.data; // Extract only the important data
        } catch (error) {
            console.error(error.message);
            console.log('getting backup data');
            return pizza;
        }
    },

    /**
     * Sends async API call to open-api.myhelsinki.fi for
     * all the bars and nightlife locations. Tags and meta
     * are excluded from response object.
     * 
     * @returns {object[]} collection containing
     *      bar and nightlife locations in Helsinki.
     */
    getNightlifeAsync: async function () {
        const url = `${CORS_PROXY}http://open-api.myhelsinki.fi/v1/places/?tags_search=BARS%20%26%20NIGHTLIFE`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.data; // Extract only the important data
        } catch (error) {
            console.error(error.message);
            console.log('getting backup data..');
            return bars;
        }
    },

    /**
     * Gets (bar/food) destinations using specified tags.
     * Query can be exclusive or inclusive.
     * 
     * @param {object[]} locations location collection.
     * @param {string[]} tagArray tag collection to use in query.
     * @param {boolean} exclusive if query is exclusive => false, else true.
     * 
     * @returns {object[]} collection that holds matching destinations.
     */
    filterLocationsByTags: function (locations, tagArray, exclusive=false) { 

        function contains(array, itemToFind) {
            for (let i = 0; i < array.length; i++) {
                const item = array[i];
                if (item === itemToFind) {
                    return true;
                }
            }
            return false;
        }
        const results = []; // TODO: create extra function?
        if (exclusive) {
            // all specified tags must be found in destination
            for (let i = 0; i < locations.length; i++) {
                const location = locations[i];
                // extract tags for contains function
                const locationTags = location.tags.map(tag => tag.name); 
                let allFound = true;
                for (let j = 0; j < tagArray.length; j++) {
                    const tag = tagArray[j];
                    if (!contains(locationTags, tag)) {
                        allFound = false;
                        break;
                    }
                }
                if (allFound) {
                    results.push(location);
                }
            }
        } else {
            // Only one of the tags must be found in destination
            for (let i = 0; i < locations.length; i++) {
                const location = locations[i];
                // extract tags for contains function
                const locationTags = location.tags.map(tag => tag.name);
                let found = false;
                for (let j = 0; j < tagArray.length; j++) {
                    const tag = tagArray[j];
                    if (contains(locationTags, tag)) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    results.push(location);
                }
            }
        }
        return results;
    },
}

export const routesAPI = {
    /**
     * Sends async API request to api.digitransit.fi for
     * pre-calculated route options from point a to b.
     * Can be configured to ignore walk-only routes.
     * Sorts the routes by travel duration by default.
     * 
     * @param {Position} fromPosition Start position latitude.
     * @param {Position} toPosition Start position longitude.
     * @param {number} toLat Destination position latitude.
     * @param {number} toLon Destination position longitude.
     * @param {Function} sortFunc Sort function.
     * 
     * @returns {Array} Collection of routes. In case of
     *      error returns false.
     */
    getRoutesToBarAsync: async function (fromPosition, toPosition, ignoreWalkRoutes=false, sortFunc) {
        try {
            // Create request body
            graphQl.options.body = graphQl.getRouteToDest(fromPosition, toPosition, 3);
            
            // Send request and process the response
            const response = await fetch(DIGITRANSIT_URL, graphQl.options);
            const routes = (await response.json()).data.plan.itineraries
                .map(r => new Route(r))
                .sort(sortFunc ? sortFunc : Route.cmpArrivalTimesFromNow);

            // Filter walk only routes if requested
            return ignoreWalkRoutes ? routes.filter(r => r.modes[0] !== 'WALK') : routes;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            graphQl.options.body = null;
        }
    }
}

/**
 * Calculates distance between two points on Earth.
 * 
 * @param {number} lat1 point 1 latitude
 * @param {number} long1 point 1 longitude
 * @param {number} lat2 point 2 latitude
 * @param {number} long2 point 2 longitude
 * 
 * @returns {number} Distance between points (km)
 */
function calculateDistance(lat1, long1, lat2, long2) {
    let lat1Rad = lat1 / (180/Math.PI);
    let long1Rad = long1 / (180/Math.PI);
    let lat2Rad = lat2 / (180/Math.PI);
    let long2Rad = long2 / (180/Math.PI);

    let distance = 3963.0 * Math.acos(
        (Math.sin(lat1Rad) * Math.sin(lat2Rad)) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(long2Rad - long1Rad)
    ) * 1.609344;

    return distance;
};
