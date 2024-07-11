import { defaults, eachNotNil, forOwn, importRequireOrReadFiles, isModule, isNilEnv, isObject, isString, notNil, requireOrReadFilesSync, toUpper } from '@danmasta/lo';
import { NotFoundError } from '@danmasta/lo/errors';
import { env } from 'node:process';
import { argv, expandVars, parse, parseParamString, toNativeType } from './util.js';
import { getVaultSecret, getVaultSecretSync } from './vault.js';

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
            this.set(parseParamString(argv['env']));
        }
    }

    get (key) {
        let val = env[key];
        if (this.opts.nativeType) {
            return toNativeType(val);
        }
        return val;
    }

    set (key, val, args) {
        if (isString(key)) {
            let { replace, default: def } = this.opts;
            val = expandVars(val, args, replace, def);
            if (notNil(val) && isNilEnv(env[key])) {
                return env[key] = val;
            }
            return this.get(key);
        }
        if (isObject(key)) {
            forOwn(key, (val, key, args) => {
                this.set(key, val, args);
            });
        }
        return env;
    }

    env (key, val, args) {
        if (arguments.length >= 2 || isObject(key)) {
            return this.set(key, val, args);
        }
        if (isString(key)) {
            return this.get(key);
        }
        return env;
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
                    this.set(parse(contents, false, replace, def));
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
                    this.set(parse(contents, false, replace, def));
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
