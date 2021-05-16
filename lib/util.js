const path = require('path');
const os = require('os');
const _ = require('lodash');
const constants = require('./constants');

// https://stackoverflow.com/a/1830844/2180385
function isNumeric (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function toNativeType (val) {
    return val in constants.TYPES ? constants.TYPES[val] : isNumeric(val) ? parseFloat(val) : val;
}

function unixify (str) {
    return str.replace(/\\+/g, '/');
}

// resolve path with support for home character
function resolveFilePath (str) {
    if (str && str[0] === '~') {
        return path.normalize(path.join(os.homedir(), str.slice(1)));
    } else {
        return path.resolve(str);
    }
}

function removeQuotes (str) {
    return str.replace(constants.REGEX.quotes, '');
}

// https://mathiasbynens.be/notes/javascript-escapes
function unescape (str) {

    return str.replace(constants.REGEX.unescape, (match, hex1, hex2, hex3, octal, special) => {

        let hex = hex1 !== undefined ? hex1 : hex2 !== undefined ? hex2 : hex3 !== undefined ? hex3 : undefined;

        if (hex !== undefined) {
            return String.fromCodePoint(parseInt(hex, 16));
        } else if (octal !== undefined) {
            return String.fromCodePoint(parseInt(octal, 8));
        } else {
            return constants.SPECIAL_CHARS[special];
        }

    });

}

function removeInlineComment (str) {

    let comment = str.lastIndexOf('#');
    let first = str[0];

    if (comment > -1) {
        if (first === '"' && str.lastIndexOf('"') < comment) {
            str = str.slice(0, comment);
        } else if (first === "'" && str.lastIndexOf("'") < comment) {
            str = str.slice(0, comment);
        } else if (first !== '"' && first !== "'") {
            str = str.slice(0, comment);
        }
    }

    return str.trim();

}

function parseParamString (str) {

    let res = null;

    try {

        res = JSON.parse(str);

    } catch (e) {

        let pairs = _.map(_.split(str, ','), str => {

            let index = -1;
            let key = undefined;
            let val = undefined;

            if (!str.length || str === '=') {
                return undefined;
            }

            index = str.indexOf('=');

            if (index > -1) {
                key = str.slice(0, index).trim();
                if (index + 1 < str.length) {
                    val = str.slice(index + 1);
                }
            } else {
                key = str.slice(0).trim();
            }

            if (!key.length) {
                return undefined;
            } else {
                return [key, val];
            }

        });

        res = _.fromPairs(_.compact(pairs));

    }

    return res;

}

exports.isNumeric = isNumeric;
exports.toNativeType = toNativeType;
exports.unixify = unixify;
exports.resolveFilePath = resolveFilePath;
exports.removeQuotes = removeQuotes;
exports.unescape = unescape;
exports.removeInlineComment = removeInlineComment;
exports.parseParamString = parseParamString;
