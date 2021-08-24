/**
 * The Util service is for thin, globally reusable, utility functions
 */

import {
    isFunction,
    noop,
} from 'lodash';

/**
 * Return a callback or noop function
 *
 * @param  {Function|*} cb - a 'potential' function
 * @return {Function}
 */
export function safeCb(cb) {
    return isFunction(cb) ? cb : noop;
}

/**
 * Parse a given url with the use of an anchor element
 *
 * @param  {String} url - the url to parse
 * @return {Object}     - the parsed url, anchor element
 */
export function urlParse(url) {
    var a = document.createElement('a');
    a.href = url;

    // Special treatment for IE, see http://stackoverflow.com/a/13405933 for details
    if (a.host === '') {
        // eslint-disable-next-line no-self-assign
        a.href = a.href;
    }
    return a;
}

/**
 * Test whether or not a given url is same origin
 *
 * @param  {String}           url       - url to test
 * @param  {String|String[]}  [origins] - additional origins to test against
 * @return {Boolean}                    - true if url is same origin
 */
export function isSameOrigin(url, origins) {
    url = urlParse(url);
    origins = (origins && [].concat(origins)) || [];
    origins = origins.map(urlParse);
    origins.push(window.location);
    origins = origins.filter(function (o) {
        let hostnameCheck = url.hostname === o.hostname;
        let protocolCheck = url.protocol === o.protocol;
        // 2nd part of the special treatment for IE fix (see above):
        // This part is when using well-known ports 80 or 443 with IE,
        // when window.location.port==='' instead of the real port number.
        // Probably the same cause as this IE bug: https://goo.gl/J9hRta
        let portCheck = url.port === o.port || (o.port === '' && (url.port === '80' || url.port === '443'));
        return hostnameCheck && protocolCheck && portCheck;
    });
    return origins.length >= 1;
}

export function randomInRange(min: number, max: number) {
    var r = Math.random();
    return min + r * (max - min);
}

/**
 * shuffle: Fisher-Yates (Knuth) shuffle as provided by:
 *  https://bost.ocks.org/mike/shuffle/
 * @param array
 */
export function shuffle(array: any[]) {
    var currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}


/**
 * a filter function that filters out duplicate values
 * @param value
 * @param index
 * @param self
 */
export function onlyUniqueFilter(value, index, self) {
    return self.indexOf(value) === index;
}

// STRING NORMALIZATION FUNCTIONS
export function capitalizeFirstLetter(str: String): String {
    let first = str.charAt(0).toUpperCase();
    let rest = str.substring(1).toLowerCase();
    return first + rest;
}

export function capitalizeTitles(str: String): String {
    let arr = str.split(' ').map((e: String): String => {
        return this.capitalizeFirstLetter(e);
    });
    return arr.join(' ');
}

export function emailValidation(email: string) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,}$/;
    return emailRegex.test(email);
}
