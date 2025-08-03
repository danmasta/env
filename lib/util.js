import { each, ENV, fromPairs, isNilEnv, isString, map, split } from 'lo';
import { BaseError } from 'lo/errors';
import { spawn, spawnSync } from 'node:child_process';
import { execPath } from 'node:process';
import { format } from 'node:util';
import { PATHS, REGEX, SPECIAL_CHARS } from './constants.js';

export class EnvError extends BaseError {
    constructor (...args) {
        super(format(...args));
    }
    static code = 'ERR_ENV';
}

// https://mathiasbynens.be/notes/javascript-escapes
export function unescape (str) {
    return str.replace(REGEX.unescape, (match, hex1, hex2, hex3, octal, special) => {
        let hex = hex1 !== undefined ? hex1 : hex2 !== undefined ? hex2 : hex3 !== undefined ? hex3 : undefined;
        if (hex !== undefined) {
            return String.fromCodePoint(parseInt(hex, 16));
        }
        if (octal !== undefined) {
            return String.fromCodePoint(parseInt(octal, 8));
        }
        return SPECIAL_CHARS[special];
    });
}

// Don't strip if quoted
export function stripLineComment (str) {
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

export function stripQuotes (str) {
    return str.replace(REGEX.quotes, '');
}

export function stripCommentAndQuotes (str) {
    str = stripLineComment(str);
    str = stripQuotes(str);
    return str;
}

export function parseParamStr (str) {
    try {
        return JSON.parse(str);
    } catch {
        let pairs = map(split(str, ','), str => {
            return split(str, '=', { limit: 1, trim: true });
        });
        return fromPairs(pairs);
    }
}

export function expandVars (str, { vars, replace=1, def='' }={}) {
    if (!isString(str)) {
        // Need to return same value
        return str;
    }
    return str.replace(REGEX.args, (match, $1, $2) => {
        let key = $1 !== undefined ? $1 : $2;
        let val;
        // Ignore escaped vars
        if (match[0] === '\\') {
            return match.slice(1);
        }
        if (isNilEnv(ENV[key])) {
            if (vars) {
                val = expandVars(vars[key], { replace, def });
            }
        } else {
            val = ENV[key];
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

export function parseEnvStr (str, { expand=1, replace=1, def='' }={}) {
    let vars = {};
    let prev;
    if (!isString(str)) {
        return vars;
    }
    each(split(str, REGEX.newline, { trim: true }), line => {
        // Ignore comments
        if (line[0] === '#') {
            return;
        }
        if (expand) {
            line = expandVars(line, { vars, replace, def });
        }
        let [key, val=''] = split(line, '=', { limit: 1, trim: true });
        // Support multiline values
        if (!val && key.length === line.length) {
            val = key, key = null;
        }
        val = stripCommentAndQuotes(val);
        val = unescape(val);
        // Support multiline values
        if (key) {
            vars[key] = val;
            prev = key;
        } else {
            if (prev) {
                vars[prev] += (vars[prev] ? '\n' : '') + val;
            }
        }
    });
    return vars;
}

export function unixify (str) {
    return str.replace(/[\/\\]+/g, '/');
}

export async function spawnWorker (opts={}) {
    return await new Promise((resolve, reject) => {
        let child = spawn(execPath, [PATHS.vaultWorker], opts);
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

export function spawnWorkerSync (opts={}) {
    let {
        stdout,
        stderr,
        error: err,
        pid,
        status,
        signal
    } = spawnSync(execPath, [PATHS.vaultWorker], opts);
    return {
        stderr: ('' + stderr).trim(),
        stdout: ('' + stdout).trim(),
        pid,
        status,
        signal,
        err
    };
}
