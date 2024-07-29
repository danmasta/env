var lo = require('@danmasta/lo');
var errors = require('@danmasta/lo/errors');
var util = require('./util.cjs');
var vault = require('./vault.cjs');

const argv = lo.parseArgv(lo.ARGV.slice(2));

const defs = {
    enableArgv: true,
    nativeType: true,
    setNodeEnv: false,
    helpers: ['DEVELOPMENT', 'PRODUCTION'],
    files: ['./.env', './config/.env', './env.js', './config/env.js'],
    dir: undefined,
    encoding: 'utf8',
    timeout: 1000 * 2.5,
    replace: true,
    default: '',
    defaultNodeEnv: 'development',
    secret: undefined,
    token: undefined,
    addr: undefined,
    warn: false,
    throw: false,
    exts: ['.js', '.json', '.cjs', '.mjs']
};

class Env {

    constructor (opts) {
        this.opts = opts = lo.defaults(opts, defs);
        if (opts.enableArgv) {
            this.set('NODE_ENV', argv['node-env']);
            this.set(util.parseParamStr(argv['env']));
        }
    }

    get (key) {
        if (this.opts.nativeType) {
            return lo.toNativeType(lo.ENV[key]);
        }
        return lo.ENV[key];
    }

    set (key, val, args) {
        switch (arguments.length) {
            case 1:
                if (lo.isObject(key)) {
                    lo.forOwn(key, (v, k, args) => {
                        this.set(k, v, args);
                    });
                }
                return lo.ENV;
            case 2:
            case 3:
                let { replace, default: def, nativeType } = this.opts;
                let v = lo.ENV[key];
                val = util.expandVars(val, args, replace, def);
                if (lo.isNilEnv(v)) {
                    return lo.ENV[key] = val;
                }
                if (nativeType) {
                    return lo.toNativeType(v);
                }
                return v;
        }
    }

    env (key, val, args) {
        switch (arguments.length) {
            case 1:
                if (lo.isString(key)) {
                    return this.get(key);
                } else {
                    return this.set(key);
                }
            case 2:
            case 3:
                return this.set(key, val, args);
            default:
                return lo.ENV;
        }
    }

    setHelpers () {
        let { setNodeEnv, defaultNodeEnv, helpers } = this.opts;
        if (setNodeEnv) {
            this.set('NODE_ENV', defaultNodeEnv);
        }
        if (helpers) {
            let env = lo.toUpper(this.get('NODE_ENV'));
            lo.eachNotNil(helpers, str => {
                this.set(str, str === env);
            });
        }
    }

    async resolve () {
        let {
            files,
            dir,
            exts,
            encoding,
            replace,
            default: def
        } = this.opts;
        files = await lo.importRequireOrReadFiles(files, { dir, exts, encoding });
        lo.eachNotNil(files, ({ err, contents }) => {
            if (err) {
                this.handleError(err);
            } else {
                if (lo.isModule(contents)) {
                    this.set(contents.default);
                } else if (lo.isString(contents)) {
                    this.set(util.parseEnvStr(contents, false, replace, def));
                } else {
                    this.set(contents);
                }
            }
        });
        this.setHelpers();
        return this.exports;
    }

    resolveSync () {
        let {
            files,
            dir,
            exts,
            encoding,
            replace,
            default: def
        } = this.opts;
        files = lo.requireOrReadFilesSync(files, { dir, exts, encoding });
        lo.eachNotNil(files, ({ err, contents }) => {
            if (err) {
                this.handleError(err);
            } else {
                if (lo.isModule(contents)) {
                    this.set(contents.default);
                } else if (lo.isString(contents)) {
                    this.set(util.parseEnvStr(contents, false, replace, def));
                } else {
                    this.set(contents);
                }
            }
        });
        this.setHelpers();
        return this.exports;
    }

    async loadFromVault (path, opts={}) {
        if (lo.isObject(path)) {
            opts = path;
        } else {
            opts.secret = path;
        }
        let { secret, token, addr, timeout } = this.opts;
        let vars = await vault.getVaultSecret(lo.defaults(opts, { secret, token, addr, timeout }));
        this.set(vars);
    }

    loadFromVaultSync (path, opts={}) {
        if (lo.isObject(path)) {
            opts = path;
        } else {
            opts.secret = path;
        }
        let { secret, token, addr, timeout } = this.opts;
        let vars = vault.getVaultSecretSync(lo.defaults(opts, { secret, token, addr, timeout }));
        this.set(vars);
    }

    handleError (err) {
        if (err.code !== errors.NotFoundError.code) {
            throw err;
        } else {
            if (this.opts.throw) {
                throw err;
            }
            if (this.opts.warn) {
                console.warn(err);
            }
        }
    }

    get exports () {
        let env = this.env.bind(this);
        env.get = this.get.bind(this);
        env.set = this.set.bind(this);
        env.env = env;
        env.Env = Env;
        env.loadFromVault = this.loadFromVault.bind(this);
        env.loadFromVaultSync = this.loadFromVaultSync.bind(this);
        return env;
    }

    static get defaults () {
        return defs;
    }

    static factory () {
        let Fn = this;
        return function factory (...args) {
            return new Fn(...args);
        };
    }

}

module.exports = Env;
