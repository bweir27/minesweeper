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

/**
 *
 * @param {String} num  - inputted phone number from user
 * @return {String} - normalized phone number as string
 */
export function phoneNormalization(num: string) {
    let numArr: string[] = [];
    // scrub string into an array of only numbers
    let i = 0;
    while(i < num.length) {
        if(/^\d+$/.test(num.charAt(i))) {
            numArr[numArr.length] = num.charAt(i);
        }
        i++;
    }
    // base - just return the user input
    let normal = num;

    // first three digits is the area code
    if(numArr.length >= 3) {
        normal = '(' + numArr[0] + numArr[1] + numArr[2] + ')';
    }

    // add the next three digits if they exist
    if(numArr.length >= 4) {
        let j = 3;
        while(j < numArr.length && j < 6) {
            normal += numArr[j];
            j++;
        }
    }

    // add '-' after first 6 digits
    if(numArr.length >= 6) {
        normal += '-';
    }

    // add and limit the last 4 digits
    if(numArr.length >= 7) {
        let k = 6;
        while(k < numArr.length && k < 10) {
            normal += numArr[k];
            k++;
        }
    }

    return normal;
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
