var lo = require('lo');
var errors = require('lo/errors');
var util = require('./util.cjs');
var vault = require('./vault.cjs');

const defs = {
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

class Env {

    constructor (opts) {
        this.opts = opts = lo.defaults(opts, defs);
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
        if (lo.isObject(path)) {
            [path, opts] = [opts, path];
        }
        await loadFromVault(path, { ...this.opts, ...opts });
    }

    loadFromVaultSync (path, opts) {
        if (lo.isObject(path)) {
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

function get (key, { native=true, string }={}) {
    if (native && !string) {
        return lo.toNativeType(lo.ENV[key]);
    }
    return lo.ENV[key];
}

function set (key, val, { vars, replace, def, native=true, string, overwrite }={}) {
    let type = lo.getType(key);
    if (type.object) {
        lo.forOwn(key, (v, k, vars) => {
            set(k, v, { vars, replace, def, native, string, overwrite });
        });
        return lo.ENV;
    }
    if (key) {
        let v = lo.ENV[key];
        val = util.expandVars(val, { vars, replace, def });
        if (lo.isNilEnv(v) || overwrite) {
            return lo.ENV[key] = val;
        }
        if (native && !string) {
            return lo.toNativeType(v);
        }
        return v;
    }
    return lo.ENV;
}

function env (key, val, opts) {
    switch (arguments.length) {
        case 1:
            if (lo.isString(key)) {
                return get(key);
            }
            return set(key);
        case 2:
            if (lo.isObject(val)) {
                return get(key, val);
            }
            return set(key, val);
        case 3:
            return set(key, val, opts);
        default:
            return lo.ENV;
    }
}

function setHelpers ({ nodeEnv, helpers, ...opts }={}) {
    if (nodeEnv) {
        set('NODE_ENV', nodeEnv, opts);
    }
    if (helpers) {
        let env = lo.toUpper(get('NODE_ENV'));
        lo.eachNotNil(helpers, str => {
            set(str, str === env, opts);
        });
    }
}

function loadFromArgv ({ argv, ...opts }={}) {
    if (!lo.isObject(argv)) {
        argv = lo.parseArgv(argv);
    }
    if (argv.nodeEnv) {
        set('NODE_ENV', argv.nodeEnv, opts);
    }
    if (argv.env) {
        set(util.parseParamStr(argv.env), undefined, opts);
    }
}

async function loadFromFiles ({ files, dir, exts, encoding, ...opts }={}) {
    lo.eachNotNil(await lo.importRequireOrReadFiles(files, { dir, exts, encoding }), ({ err, data }) => {
        if (err) {
            handleError(err, opts);
        } else {
            if (lo.isModule(data)) {
                set(data.default ?? data, undefined, opts);
            } else if (lo.isString(data)) {
                set(util.parseEnvStr(data, { ...opts, expand: false }), undefined, opts);
            } else {
                set(data, undefined, opts);
            }
        }
    });
}

function loadFromFilesSync ({ files, dir, exts, encoding, ...opts }={}) {
    lo.eachNotNil(lo.requireOrReadFilesSync(files, { dir, exts, encoding }), ({ err, data }) => {
        if (err) {
            handleError(err, opts);
        } else {
            if (lo.isModule(data)) {
                set(data.default ?? data, undefined, opts);
            } else if (lo.isString(data)) {
                set(util.parseEnvStr(data, { ...opts, expand: false }), undefined, opts);
            } else {
                set(data, undefined, opts);
            }
        }
    });
}

async function loadFromVault (path, { secret, token, addr, timeout=2500, ...opts }={}) {
    if (lo.isObject(path)) {
        ({ secret, token, addr, timeout=timeout, ...opts } = path);
    } else {
        if (path) {
            secret = path;
        }
    }
    let vars = await vault.getVaultSecret({ secret, token, addr, timeout });
    set(vars, undefined, opts);
}

function loadFromVaultSync (path, { secret, token, addr, timeout=2500, ...opts }={}) {
    if (lo.isObject(path)) {
        ({ secret, token, addr, timeout=timeout, ...opts } = path);
    } else {
        if (path) {
            secret = path;
        }
    }
    let vars = vault.getVaultSecretSync({ secret, token, addr, timeout });
    set(vars, undefined, opts);
}

async function resolve ({ setArgv, setNodeEnv, ...opts }={}) {
    if (setArgv) {
        loadFromArgv(opts);
    }
    await loadFromFiles(opts);
    if (setNodeEnv) {
        setHelpers(opts);
    }
}

function resolveSync ({ setArgv, setNodeEnv, ...opts }={}) {
    if (setArgv) {
        loadFromArgv(opts);
    }
    loadFromFilesSync(opts);
    if (setNodeEnv) {
        setHelpers(opts);
    }
}

function handleError (err, { silent=true, warn=false }={}) {
    if (err.code !== errors.NotFoundError.code) {
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

exports.getVaultSecret = vault.getVaultSecret;
exports.getVaultSecretSync = vault.getVaultSecretSync;
exports.Env = Env;
exports.default = env;
exports.defs = defs;
exports.env = env;
exports.get = get;
exports.handleError = handleError;
exports.loadFromArgv = loadFromArgv;
exports.loadFromFiles = loadFromFiles;
exports.loadFromFilesSync = loadFromFilesSync;
exports.loadFromVault = loadFromVault;
exports.loadFromVaultSync = loadFromVaultSync;
exports.resolve = resolve;
exports.resolveSync = resolveSync;
exports.set = set;
exports.setHelpers = setHelpers;
