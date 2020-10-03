'use strict'

const FIVE_BIT_MASK = 0x1f;
const SIX_BITS = 0x20;
const CHAR_OFFSET = 0x3f;

export const polyline = {
    /**
     * 
     * @param {Array} coords 
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
     * 
     * @param {string} encodedStr 
     */
    decode: function(encodedStr) {
        const coords = [];

        let chunk, sum, leftShift, i, lat, lon;
        i = lat = lon = 0;
        const charCount = encodedStr.length;
        while (i < charCount) {
            sum = leftShift = 0;
            do {
                chunk = encodedStr.charCodeAt(i++) - CHAR_OFFSET;
                sum |= (chunk & FIVE_BIT_MASK) << leftShift;
                leftShift += 5;
            } while (chunk >= SIX_BITS);
            lat += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);

            sum = leftShift = 0;
            do {
                chunk = encodedStr.charCodeAt(i++) - CHAR_OFFSET;
                sum |= (chunk & FIVE_BIT_MASK) << leftShift;
                leftShift += 5;
            } while (chunk >= SIX_BITS);
            lon += (sum & 1) == 1 ? ~(sum >> 1) : (sum >> 1);
    
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
    let remaining = (coord & 1) == 1 ? ~(coord) << 1 : coord << 1;
    while (remaining >= SIX_BITS) {
        charArr.push((0x20 | (remaining & FIVE_BIT_MASK)) + CHAR_OFFSET);
        remaining >>= 5;
    }
    charArr.push(remaining + CHAR_OFFSET);
}