var lo = require('@danmasta/lo');
var errors = require('@danmasta/lo/errors');
var process = require('node:process');
var util = require('./util.cjs');
var vault = require('./vault.cjs');

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
            this.set('NODE_ENV', util.argv['node-env']);
            this.set(util.parseParamString(util.argv['env']));
        }
    }

    get (key) {
        let val = process.env[key];
        if (this.opts.nativeType) {
            return util.toNativeType(val);
        }
        return val;
    }

    set (key, val, args) {
        if (lo.isString(key)) {
            let { replace, default: def } = this.opts;
            val = util.expandVars(val, args, replace, def);
            if (lo.notNil(val) && lo.isNilEnv(process.env[key])) {
                return process.env[key] = val;
            }
            return this.get(key);
        }
        if (lo.isObject(key)) {
            lo.forOwn(key, (val, key, args) => {
                this.set(key, val, args);
            });
        }
        return process.env;
    }

    env (key, val, args) {
        if (arguments.length >= 2 || lo.isObject(key)) {
            return this.set(key, val, args);
        }
        if (lo.isString(key)) {
            return this.get(key);
        }
        return process.env;
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
                    this.set(util.parse(contents, false, replace, def));
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
                    this.set(util.parse(contents, false, replace, def));
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
