'use strict'

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const DIGITRANSIT_URL = `https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql`;

const graphQl = {
    options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/graphql',
          'Accept': 'application/json',
      },
      body: null
    },
    /**
     * Creates graphQL POST body for route query between
     * two positions. 
     * 
     * @param {Position} fromPosition route start position.
     * @param {Position} toPosition route target position.
     * @param {number} resultCount query result count.
     * 
     * @returns {string} graphQL POST body as string.
     */
    getRouteToDest: (fromPosition, toPosition, resultCount) => `{
      plan(
        from: { lat:${fromPosition.lat}, lon: ${fromPosition.lon} }
        to: {lat:${toPosition.lat}, lon: ${toPosition.lon} }
        numItineraries: ${resultCount}
      ) {
        itineraries {
          legs {
            intermediateStops {
              name
            }
            route {
              id,
              gtfsId,
              shortName
              longName
            }
            mode
            startTime
            endTime
            duration
            to {
              name
              lat
              lon
            }
            distance
            from {
              name
              lat
              lon
            }
            legGeometry {
              points
            }
          }
        }
      }
    }`
}

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
     * @param {Position} fromPosition Start position.
     * @param {Position} toPosition Destination position.
     * 
     * @returns {Array} Collection of routes. In case of
     *      error returns false.
     */
    getRoutesToBarAsync: async function (fromPosition, toPosition, ignoreWalkRoutes=false) {
        try {
            // Create request body
            graphQl.options.body = graphQl.getRouteToDest(fromPosition, toPosition, 3);
            
            // Send request and process the response
            const response = await fetch(DIGITRANSIT_URL, graphQl.options);
            const routes = (await response.json()).data.plan.itineraries;
            return ignoreWalkRoutes ? routes.filter(r => r.modes[0] !== 'WALK') : routes;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            graphQl.options.body = null;
        }
    },
}
