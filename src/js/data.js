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
     * @param {object} fromPosition route start position.
     * @param {object} toPosition route target position.
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
     * 
     * @returns {string[]} location id array
     */
    filterLocationsByTags: function (locations, tagArray) {
        return locations
            .filter(loc => loc.tags.map(t => t.name)
            .some(t => tagArray.indexOf(t) >= 0))
            .map(loc => loc.id);
    },
}

export const routesAPI = {
    getRoutesToBarAsync: async function (fromPosition, toPosition) {
        try {
            graphQl.options.body = graphQl.getRouteToDest(fromPosition, toPosition, 3);
            const response = await fetch(DIGITRANSIT_URL, graphQl.options);
            return (await response.json()).data.plan.itineraries;
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            graphQl.options.body = null;
        }
    },
}
