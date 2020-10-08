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
export const api = {
    /**
     * Sends async API call to open-api.myhelsinki.fi for
     * all the bars and nightlife locations. Tags and meta
     * are excluded from response object.
     * 
     * @returns {object[]} collection of bars from API.
     */
    getBarsAsync: async function () {
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
     * Gets the routes from specified location to destination
     * using HSL route planning api.
     * @param {object} fromPosition start position coords
     * @param {object} toPosition destination position coords
     * 
     * @returns {object} Collection of 3 route objects to destination.
     */
    getRoutesToBarAsync: async function (fromPosition, toPosition) {
        try {
            // fill the request body with graphQl query
            graphQl.options.body = graphQl.getRouteToDest(fromPosition, toPosition, 3);
            const response = await fetch(DIGITRANSIT_URL, graphQl.options);
            return (await response.json()).data.plan.itineraries; // take only the routes
        } catch (error) {
            console.error(error);
            return false;
        } finally {
            // clear the request body
            graphQl.options.body = null;
        }
    },

    /**
     * Filters the locations using location tags.
     * 
     * @param {object[]} locations location collection.
     * @param {string[]} tagArray tag collection to use in filtering.
     * 
     * @returns {string[]} location id array
     */
    filterLocationsByTags: function (locations, tagArray) {
        return locations
            .filter(loc => loc.tags.map(t => t.name)
            .some(t => tagArray.indexOf(t) >= 0))
            .map(loc => loc.id);
    },
    
    /**
     * Filters the locations by comparing location
     * names. Substrings included.
     * @param {Array} locations Collection of location objects.
     * @param {string} name name used in filtering
     * 
     * @returns {string[]} array of location ids
     */
    filterLocationsByName: function(locations, name) {
        name = name.toUpperCase();
        return locations.filter(loc =>
            loc.name.fi.toUpperCase().includes(name)
         || loc.name.fi.toUpperCase().startsWith(name))
            .map(loc => loc.id);
    }
}
