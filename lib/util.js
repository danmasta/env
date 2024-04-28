const path = require('path');
const os = require('os');
const fs = require('fs');
const minimist = require('minimist');
const _ = require('lodash');
const constants = require('./constants');
const format = require('util').format;

const _argv = minimist(process.argv.slice(2));

class EnvError extends Error {
    constructor (...args) {
        super(format(...args));
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = this.constructor.code;
    }
    static get code () {
        return 'ERR_ENV';
    }
}

class NotResolvedError extends EnvError {
    static get code () {
        return 'ERR_ENV_NOT_RESOLVED';
    }
}

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

// Resolve file path with support for home char
function resolvePath (str, dir) {
    if (str && str[0] === '~') {
        return path.normalize(path.join(os.homedir(), str.slice(1)));
    } else {
        if (dir) {
            return path.resolve(dir, str);
        } else {
            return path.resolve(str);
        }
    }
}

// Resolve file path if it exists
// Checks for home char, existing file, require path, cjs, mjs
// Throws error if not found
function resolvePathIfExists (str, dir) {

    let file = resolvePath(str, dir);

    try {
        fs.accessSync(file, fs.constants.F_OK);
    } catch {
        try {
            file = require.resolve(file);
        } catch {
            try {
                fs.accessSync(file + '.cjs', fs.constants.F_OK);
                file += '.cjs';
            } catch {
                try {
                    fs.accessSync(file + '.mjs', fs.constants.F_OK);
                    file += '.mjs';
                } catch {
                    throw new NotResolvedError(`Failed to resolve file path: ${str}`);
                }
            }
        }
    }

    return file;

}

// Get argv by key, return argv if no key passed
function argv (key) {
    if (arguments.length === 1) {
        return _argv[key];
    } else {
        return _argv;
    }
}

// Test if running in esm or commonjs mode
function isEsmMode () {
    return typeof module === 'undefined';
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import#module_namespace_object
function isModule (obj) {
    return !_.isNil(obj) && obj[Symbol.toStringTag] === 'Module';
}

function isPromise (p) {
    return p instanceof Promise || Promise.resolve(p) === p;
}

function isError (obj) {
    return Error.prototype.isPrototypeOf(obj);
}

// if a value is never set on process.env it will return typeof undefined
// if a value was set on process.env that was of type undefined if will become typeof string 'undefined'
// we want to test for both
function isUndefined (val) {
    return (val === undefined || val === 'undefined');
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

function flattenAndCompact (...args) {
    return Array.prototype.concat.call([], ...args).filter(Boolean);
}

function split (str, idx) {
    idx = idx > -1 ? idx : str.length;
    return [
        str.slice(0, idx).trim(),
        str.slice(idx +1).trim()
    ];
}

function removeLineComment (str) {

    let index = str.lastIndexOf('#');
    let first = str[0];

    if (index > -1) {
        if (first === '"' && str.lastIndexOf('"') < index) {
            str = str.slice(0, index);
        } else if (first === "'" && str.lastIndexOf("'") < index) {
            str = str.slice(0, index);
        } else if (first !== '"' && first !== "'") {
            str = str.slice(0, index);
        }
    }

    return str.trim();

}

function removeQuotes (str) {
    return str.replace(constants.REGEX.quotes, '');
}

function removeCommentAndQuotes (str) {
    str = removeLineComment(str);
    str = removeQuotes(str);
    return str;
}

function parseParamString (str) {

    try {
        return JSON.parse(str);
    } catch {

        let pairs = _.map(_.split(str, ','), str => {
            if (!str.length || str === '=') {
                return undefined;
            }
            return split(str, str.indexOf('='));
        });

        return  _.fromPairs(_.compact(pairs));

    }

}

// Resolve an object with defaults recursively
// Accepts multiple sources
// Filters keys based on provided defaults (last arg)
function defaults (...args) {

    let accumulator = {};

    function iterate (res, obj, def) {
        _.forOwn(obj, (val, key) => {
            if (_.has(def, key)) {
                if (_.isPlainObject(def[key])) {
                    res[key] = iterate(_.toPlainObject(res[key]), val, def[key]);
                } else {
                    if (res[key] === undefined) {
                        res[key] = val;
                    }
                }
            }
        });
        return res;
    }

    args.map(obj => {
        iterate(accumulator, obj, args.at(-1));
    });

    return accumulator;

}

exports.EnvError = EnvError;
exports.NotResolvedError = NotResolvedError;
exports.isNumeric = isNumeric;
exports.toNativeType = toNativeType;
exports.unixify = unixify;
exports.resolvePath = resolvePath;
exports.resolvePathIfExists = resolvePathIfExists;
exports.argv = argv;
exports.isEsmMode = isEsmMode;
exports.isModule = isModule;
exports.isPromise = isPromise;
exports.isError = isError;
exports.isUndefined = isUndefined;
exports.unescape = unescape;
exports.flattenAndCompact = flattenAndCompact;
exports.split = split;
exports.removeLineComment = removeLineComment;
exports.removeQuotes = removeQuotes;
exports.removeCommentAndQuotes = removeCommentAndQuotes;
exports.parseParamString = parseParamString;
exports.defaults = defaults;
