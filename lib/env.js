import { ARGV, defaults, eachNotNil, ENV, forOwn, importRequireOrReadFiles, isModule, isNilEnv, isObject, isString, parseArgv, requireOrReadFilesSync, toNativeType, toUpper } from 'lo';
import { NotFoundError } from 'lo/errors';
import { expandVars, parseEnvStr, parseParamStr } from './util.js';
import { getVaultSecret, getVaultSecretSync } from './vault.js';

const argv = parseArgv(ARGV.slice(2));

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

export default class Env {

    constructor (opts) {
        this.opts = opts = defaults(opts, defs);
        if (opts.enableArgv) {
            this.set('NODE_ENV', argv['node-env']);
            this.set(parseParamStr(argv['env']));
        }
    }

    get (key) {
        if (this.opts.nativeType) {
            return toNativeType(ENV[key]);
        }
        return ENV[key];
    }

    set (key, val, args) {
        switch (arguments.length) {
            case 1:
                if (isObject(key)) {
                    forOwn(key, (v, k, args) => {
                        this.set(k, v, args);
                    });
                }
                return ENV;
            case 2:
            case 3:
                let { replace, default: def, nativeType } = this.opts;
                let v = ENV[key];
                val = expandVars(val, args, replace, def);
                if (isNilEnv(v)) {
                    return ENV[key] = val;
                }
                if (nativeType) {
                    return toNativeType(v);
                }
                return v;
        }
    }

    env (key, val, args) {
        switch (arguments.length) {
            case 1:
                if (isString(key)) {
                    return this.get(key);
                } else {
                    return this.set(key);
                }
            case 2:
            case 3:
                return this.set(key, val, args);
            default:
                return ENV;
        }
    }

    setHelpers () {
        let { setNodeEnv, defaultNodeEnv, helpers } = this.opts;
        if (setNodeEnv) {
            this.set('NODE_ENV', defaultNodeEnv);
        }
        if (helpers) {
            let env = toUpper(this.get('NODE_ENV'));
            eachNotNil(helpers, str => {
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
        files = await importRequireOrReadFiles(files, { dir, exts, encoding });
        eachNotNil(files, ({ err, contents }) => {
            if (err) {
                this.handleError(err);
            } else {
                if (isModule(contents)) {
                    this.set(contents.default);
                } else if (isString(contents)) {
                    this.set(parseEnvStr(contents, false, replace, def));
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
        files = requireOrReadFilesSync(files, { dir, exts, encoding });
        eachNotNil(files, ({ err, contents }) => {
            if (err) {
                this.handleError(err);
            } else {
                if (isModule(contents)) {
                    this.set(contents.default);
                } else if (isString(contents)) {
                    this.set(parseEnvStr(contents, false, replace, def));
                } else {
                    this.set(contents);
                }
            }
        });
        this.setHelpers();
        return this.exports;
    }

    async loadFromVault (path, opts={}) {
        if (isObject(path)) {
            opts = path;
        } else {
            opts.secret = path;
        }
        let { secret, token, addr, timeout } = this.opts;
        let vars = await getVaultSecret(defaults(opts, { secret, token, addr, timeout }));
        this.set(vars);
    }

    loadFromVaultSync (path, opts={}) {
        if (isObject(path)) {
            opts = path;
        } else {
            opts.secret = path;
        }
        let { secret, token, addr, timeout } = this.opts;
        let vars = getVaultSecretSync(defaults(opts, { secret, token, addr, timeout }));
        this.set(vars);
    }

    handleError (err) {
        if (err.code !== NotFoundError.code) {
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
