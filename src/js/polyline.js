'use strict'

const FIVE_BIT_MASK = 0x1f;
const SIX_BITS = 0x20;
const CHAR_OFFSET = 0x3f;

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
            const lat = Math.round(coords[i].lat * 1e5);
            const lon = Math.round(coords[i].lon * 1e5);
            encodeCoord(charArr, lat - lastLat)
            encodeCoord(charArr, lon - lastLon)
            lastLat = lat;
            lastLon = lon;
        }
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
                char = encodedStr.charCodeAt(i++) - CHAR_OFFSET;
                sum |= (char & FIVE_BIT_MASK) << leftShift;
                leftShift += 5;
            } while (char >= SIX_BITS);
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
 * 
 * @param {number[]} charArr 
 * @param {number} coord 
 */
function encodeCoord(charArr, coord) {
    // flip alla bits if coord value is negative
    let remaining = coord < 0 ? (~coord) << 1 : coord << 1;
    while (remaining >= SIX_BITS) {
        charArr.push((0x20 | (remaining & FIVE_BIT_MASK)) + CHAR_OFFSET);
        remaining >>= 5;
    }
    charArr.push(remaining + CHAR_OFFSET);
}