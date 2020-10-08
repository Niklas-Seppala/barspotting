'use strict'

const FIVE_BIT_MASK = 0x1f;
const SIX_BITS = 0x20;
const CHAR_OFFSET = 0x3f;

/**
 * Module to encode/decode polylines using
 * google polyline algorithm.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export const polyline = {
    /**
     * Encodes coordinate array using Google-polyline
     * algorithm
     * @param {Array} coords Coordinate array
     * 
     * @returns {string} encoded string
     */
    encode: function(coords) {
        let charArr = [];
        let lastLat = 0;
        let lastLon = 0;
        
        for (let i = 0; i < len; i++) {
            // convert lat and lon to integers
            const lat = Math.round(coords[i].lat * 1e5);
            const lon = Math.round(coords[i].lon * 1e5);

            encodeCoord(charArr, lat - lastLat) // calculate offset
            encodeCoord(charArr, lon - lastLon)
            
            lastLat = lat; // update latest processed coordinate
            lastLon = lon;
        }
        // char array to string
        return String.fromCharCode(...charArr);
    },

    /**
     * Decodes google-polyline encoded string
     * to coordinate array.
     * @param {string} encodedStr encoded coordinates
     * @returns {Array} coordinate array
     */
    decode: function(encodedStr) {
         const coords = [];

        let char, sum, leftShift, i, lat, lon;
        i = lat = lon = 0;
        const charCount = encodedStr.length;
        while (i < charCount) {

            // decode latitude
            sum = leftShift = 0;
            do {
                char = encodedStr.charCodeAt(i++) - CHAR_OFFSET; // reverse char offset
                // five bits gets added to left side of the sum.
                sum |= (char & FIVE_BIT_MASK) << leftShift;
                // update left shift 5 bits further
                leftShift += 5;
            } while (char >= SIX_BITS);
            // deal with negative numbers
            lat += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            // decode longitude
            sum = leftShift = 0;
            do {
                char = encodedStr.charCodeAt(i++) - CHAR_OFFSET;
                sum |= (char & FIVE_BIT_MASK) << leftShift;
                leftShift += 5;
            } while (char >= SIX_BITS);
            lon += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            // add lon/lat object to result array
            coords.push({ lat: (lat * 1e-5), lon: (lon * 1e-5) });
        }
        return coords;
    }
}

/**
 * Encodes single coordinate to char and pushes
 * it to char array.
 * @param {number[]} charArr array to store encoded coordinates as chars
 * @param {number} coord lat/lon
 */
function encodeCoord(charArr, coord) {
    // flip all bits if coord value is negative, then left shift by 1
    let chunk = coord < 0 ? (~coord) << 1 : coord << 1;

    while (chunk >= SIX_BITS) {
        // take first 5 rightmost bits using mask and OR them with 0x20, add char offset
        charArr.push((0x20 | (chunk & FIVE_BIT_MASK)) + CHAR_OFFSET);
        chunk >>= 5; // shift another 5 bits
    }
    // trailing chunk doesn't require OR'ing
    charArr.push(chunk + CHAR_OFFSET);
}