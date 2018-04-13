const constants = require('./constants');

// https://stackoverflow.com/a/1830844/2180385
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// https://mathiasbynens.be/notes/javascript-escapes
function unescape(str) {

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

function parseComment(str) {

    // get line comment # index
    let comment = str.lastIndexOf('#');
    let first = str[0];

    // handle comments if they exist
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

// parse a string and return an env object
function parse(str) {

    let res = {};

    str.split(constants.REGEX.newline).map(line => {

        line = line.trim();

        // ignore empty lines and comments
        if (!line || line[0] === '#') {
            return;
        }

        // replace variables that are not escaped
        line = line.replace(constants.REGEX.args, (match, $1, $2) => {

            let key = $1 !== undefined ? $1 : $2;

            if (match.slice(0, 2) === '\\\\') {
                return match.slice(2);
            }

            return process.env[key] !== undefined ? process.env[key] : res[key];

        });

        // find the line split index based on the first occurence of = sign
        let index = line.indexOf('=') > -1 ? line.indexOf('=') : line.length;

        // get key/val and trim whitespace
        let key = line.slice(0, index).trim();
        let val = line.slice(index +1).trim();

        val = parseComment(val).replace(constants.REGEX.quotes, '');

        res[key] = unescape(val);

    });

    return res;

}

exports.isNumeric = isNumeric;
exports.parse = parse;
