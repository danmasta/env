var lo = require('@danmasta/lo');
var node_child_process = require('node:child_process');
var process = require('node:process');
var node_util = require('node:util');
var constants = require('./constants.cjs');

class EnvError extends Error {
    constructor (...args) {
        super(node_util.format(...args));
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = this.constructor.code;
    }
    static get code () {
        return 'ERR_ENV';
    }
}

// https://mathiasbynens.be/notes/javascript-escapes
function unescape (str) {
    return str.replace(constants.REGEX.unescape, (match, hex1, hex2, hex3, octal, special) => {
        let hex = hex1 !== undefined ? hex1 : hex2 !== undefined ? hex2 : hex3 !== undefined ? hex3 : undefined;
        if (hex !== undefined) {
            return String.fromCodePoint(parseInt(hex, 16));
        }
        if (octal !== undefined) {
            return String.fromCodePoint(parseInt(octal, 8));
        }
        return constants.SPECIAL_CHARS[special];
    });
}

// Don't strip if quoted
function stripLineComment (str) {
    let index = str.lastIndexOf('#');
    let char = str[0];
    if (index > -1) {
        switch (char) {
            case '"':
            case "'":
                if (str.lastIndexOf(char) < index) {
                    str = str.slice(0, index);
                }
                break;
            default:
                str = str.slice(0, index);
        }
    }
    return str.trim();
}

function stripQuotes (str) {
    return str.replace(constants.REGEX.quotes, '');
}

function stripCommentAndQuotes (str) {
    str = stripLineComment(str);
    str = stripQuotes(str);
    return str;
}

function parseParamStr (str) {
    try {
        return JSON.parse(str);
    } catch {
        let pairs = lo.map(lo.split(str, ','), str => {
            return lo.split(str, '=', { limit: 1, trim: true });
        });
        return lo.fromPairs(pairs);
    }
}

function expandVars (str, vars, replace=1, def='') {
    if (!lo.isString(str)) {
        // Need to return same value
        return str;
    }
    return str.replace(constants.REGEX.args, (match, $1, $2) => {
        let key = $1 !== undefined ? $1 : $2;
        let val;
        // Ignore escaped vars
        if (match[0] === '\\') {
            return match.slice(1);
        }
        if (lo.isNilEnv(lo.ENV[key])) {
            if (vars) {
                val = expandVars(vars[key], undefined, replace, def);
            }
        } else {
            val = lo.ENV[key];
        }
        if (val === undefined) {
            if (replace) {
                val = def;
            } else {
                val = match;
            }
        }
        return val;
    });
}

function parseEnvStr (str, expand=1, replace=1, def='') {
    let res = {};
    let prev;
    if (!lo.isString(str)) {
        return res;
    }
    lo.each(lo.split(str, constants.REGEX.newline, { trim: true }), line => {
        // Ignore comments
        if (line[0] === '#') {
            return;
        }
        if (expand) {
            line = expandVars(line, res, replace, def);
        }
        let [key, val = ''] = lo.split(line, '=', { limit: 1, trim: true });
        // Support multiline values
        if (!val && key.length === line.length) {
            val = key, key = null;
        }
        val = stripCommentAndQuotes(val);
        val = unescape(val);
        // Support multiline values
        if (key) {
            res[key] = val;
            prev = key;
        } else {
            if (prev) {
                res[prev] += (res[prev] ? '\n' : '') + val;
            }
        }
    });
    return res;
}

function unixify (str) {
    return str.replace(/[\/\\]+/g, '/');
}

async function spawnWorker (opts={}) {
    return await new Promise((resolve, reject) => {
        let child = node_child_process.spawn(process.execPath, [constants.PATHS.vaultWorker], opts);
        let stderr = '';
        let stdout = '';
        let error;
        child.stderr.on('data', chunk => {
            stderr += chunk;
        });
        child.stdout.on('data', chunk => {
            stdout += chunk;
        });
        child.once('error', err => {
            error = err;
        });
        child.once('close', (status, signal) => {
            resolve({
                stderr: stderr.trim(),
                stdout: stdout.trim(),
                pid: child.pid,
                status,
                signal,
                err: error
            });
        });
        if (opts.input) {
            child.stdin.write(opts.input);
        }
    });
}

function spawnWorkerSync (opts={}) {
    let {
        stdout,
        stderr,
        error: err,
        pid,
        status,
        signal
    } = node_child_process.spawnSync(process.execPath, [constants.PATHS.vaultWorker], opts);
    return {
        stderr: ('' + stderr).trim(),
        stdout: ('' + stdout).trim(),
        pid,
        status,
        signal,
        err
    };
}

exports.EnvError = EnvError;
exports.expandVars = expandVars;
exports.parseEnvStr = parseEnvStr;
exports.parseParamStr = parseParamStr;
exports.spawnWorker = spawnWorker;
exports.spawnWorkerSync = spawnWorkerSync;
exports.stripCommentAndQuotes = stripCommentAndQuotes;
exports.stripLineComment = stripLineComment;
exports.stripQuotes = stripQuotes;
exports.unescape = unescape;
exports.unixify = unixify;
