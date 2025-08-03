import { defaults, eachNotNil as each, ENV, forOwn, getType, importRequireOrReadFiles, isModule, isNilEnv, isObject, isString, parseArgv, requireOrReadFilesSync, toNativeType, toUpper } from 'lo';
import { NotFoundError } from 'lo/errors';
import { expandVars, parseEnvStr, parseParamStr } from './util.js';
import { getVaultSecret, getVaultSecretSync } from './vault.js';

export const defs = {
    setArgv: false,
    argv: undefined,
    setNodeEnv: false,
    nodeEnv: 'development',
    helpers: ['DEVELOPMENT', 'PRODUCTION'],
    files: ['./.env', './config/.env', './env.js', './config/env.js'],
    dir: undefined,
    exts: ['.js', '.json', '.cjs', '.mjs'],
    encoding: 'utf8',
    native: true,
    replace: true,
    def: '',
    secret: undefined,
    token: undefined,
    addr: undefined,
    timeout: 2500,
    silent: true,
    warn: false,
    overwrite: false
};

export class Env {

    constructor (opts) {
        this.opts = opts = defaults(opts, defs);
    }

    get (key, { native=this.opts.native, string }={}) {
        return get(key, { native, string });
    }

    set (key, val, opts) {
        return set(key, val, { ...this.opts, ...opts });
    }

    env (key, val, opts) {
        return env(key, val, { ...this.opts, ...opts });
    }

    setHelpers (opts) {
        setHelpers({ ...this.opts, ...opts });
    }

    loadFromArgv (opts) {
        loadFromArgv({ ...this.opts, ...opts });
    }

    async loadFromFiles (opts) {
        await loadFromFiles({ ...this.opts, ...opts });
    }

    loadFromFilesSync (opts) {
        loadFromFilesSync({ ...this.opts, ...opts });
    }

    async loadFromVault (path, opts) {
        if (isObject(path)) {
            [path, opts] = [opts, path];
        }
        await loadFromVault(path, { ...this.opts, ...opts });
    }

    loadFromVaultSync (path, opts) {
        if (isObject(path)) {
            [path, opts] = [opts, path];
        }
        loadFromVaultSync(path, { ...this.opts, ...opts });
    }

    async resolve (opts) {
        await resolve({ ...this.opts, ...opts });
    }

    resolveSync (opts) {
        resolveSync({ ...this.opts, ...opts });
    }

    handleError (err, { silent=this.opts.silent, warn=this.opts.warn }={}) {
        handleError(err, { silent, warn });
    }

    static get defaults () {
        return defs;
    }

    static factory (defs) {
        return function factory (opts) {
            return new Env({ ...defs, ...opts });
        };
    }

}

export function get (key, { native=true, string }={}) {
    if (native && !string) {
        return toNativeType(ENV[key]);
    }
    return ENV[key];
}

export function set (key, val, { vars, replace, def, native=true, string, overwrite }={}) {
    let type = getType(key);
    if (type.object) {
        forOwn(key, (v, k, vars) => {
            set(k, v, { vars, replace, def, native, string, overwrite });
        });
        return ENV;
    }
    if (key) {
        let v = ENV[key];
        val = expandVars(val, { vars, replace, def });
        if (isNilEnv(v) || overwrite) {
            return ENV[key] = val;
        }
        if (native && !string) {
            return toNativeType(v);
        }
        return v;
    }
    return ENV;
}

export function env (key, val, opts) {
    switch (arguments.length) {
        case 1:
            if (isString(key)) {
                return get(key);
            }
            return set(key);
        case 2:
            if (isObject(val)) {
                return get(key, val);
            }
            return set(key, val);
        case 3:
            return set(key, val, opts);
        default:
            return ENV;
    }
}

export function setHelpers ({ nodeEnv, helpers, ...opts }={}) {
    if (nodeEnv) {
        set('NODE_ENV', nodeEnv, opts);
    }
    if (helpers) {
        let env = toUpper(get('NODE_ENV'));
        each(helpers, str => {
            set(str, str === env, opts);
        });
    }
}

export function loadFromArgv ({ argv, ...opts }={}) {
    if (!isObject(argv)) {
        argv = parseArgv(argv);
    }
    if (argv.nodeEnv) {
        set('NODE_ENV', argv.nodeEnv, opts);
    }
    if (argv.env) {
        set(parseParamStr(argv.env), undefined, opts);
    }
}

export async function loadFromFiles ({ files, dir, exts, encoding, ...opts }={}) {
    each(await importRequireOrReadFiles(files, { dir, exts, encoding }), ({ err, data }) => {
        if (err) {
            handleError(err, opts);
        } else {
            if (isModule(data)) {
                set(data.default ?? data, undefined, opts);
            } else if (isString(data)) {
                set(parseEnvStr(data, { ...opts, expand: false }), undefined, opts);
            } else {
                set(data, undefined, opts);
            }
        }
    });
}

export function loadFromFilesSync ({ files, dir, exts, encoding, ...opts }={}) {
    each(requireOrReadFilesSync(files, { dir, exts, encoding }), ({ err, data }) => {
        if (err) {
            handleError(err, opts);
        } else {
            if (isModule(data)) {
                set(data.default ?? data, undefined, opts);
            } else if (isString(data)) {
                set(parseEnvStr(data, { ...opts, expand: false }), undefined, opts);
            } else {
                set(data, undefined, opts);
            }
        }
    });
}

export async function loadFromVault (path, { secret, token, addr, timeout=2500, ...opts }={}) {
    if (isObject(path)) {
        ({ secret, token, addr, timeout=timeout, ...opts } = path);
    } else {
        if (path) {
            secret = path;
        }
    }
    let vars = await getVaultSecret({ secret, token, addr, timeout });
    set(vars, undefined, opts);
}

export function loadFromVaultSync (path, { secret, token, addr, timeout=2500, ...opts }={}) {
    if (isObject(path)) {
        ({ secret, token, addr, timeout=timeout, ...opts } = path);
    } else {
        if (path) {
            secret = path;
        }
    }
    let vars = getVaultSecretSync({ secret, token, addr, timeout });
    set(vars, undefined, opts);
}

export async function resolve ({ setArgv, setNodeEnv, ...opts }={}) {
    if (setArgv) {
        loadFromArgv(opts);
    }
    await loadFromFiles(opts);
    if (setNodeEnv) {
        setHelpers(opts);
    }
}

export function resolveSync ({ setArgv, setNodeEnv, ...opts }={}) {
    if (setArgv) {
        loadFromArgv(opts);
    }
    loadFromFilesSync(opts)
    if (setNodeEnv) {
        setHelpers(opts);
    }
}

export function handleError (err, { silent=true, warn=false }={}) {
    if (err.code !== NotFoundError.code) {
        throw err;
    } else {
        if (!silent) {
            if (warn) {
                console.warn(err);
            } else {
                throw err;
            }
        }
    }
}

export {
    env as default,
    getVaultSecret,
    getVaultSecretSync
};
