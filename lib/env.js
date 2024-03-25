const path = require('path');
const cp = require('child_process');
const _ = require('lodash');
const util = require('./util');
const Parser = require('./parser');
const FileResolver = require('./resolver');

const defaults = {
    nativeType: true,
    setNodeEnv: false,
    helpers: false,
    files: undefined,
    dir: undefined,
    enableArgv: false,
    encoding: 'utf8',
    timeout: 1000 * 1,
    replaceMissing: true,
    default: '',
    vault: {
        secret: undefined,
        token: undefined,
        addr: undefined
    },
    warn: false,
    throw: false
};

class Env {

    constructor (opts) {

        this.opts = opts = util.defaults(opts, defaults);

        this.parser = new Parser(opts);
        this.resolver = new FileResolver(opts);

        if (opts.enableArgv) {
            this.set('NODE_ENV', util.argv('node-env'));
            this.set(util.parseParamString(util.argv('env')));
        }

        if (opts.setNodeEnv) {
            this.set('NODE_ENV', 'development');
        }

        if (opts.helpers) {
            ['DEVELOPMENT', 'PRODUCTION'].map(str => {
                this.set(str, this.get('NODE_ENV') === str.toLowerCase());
            });
        }

        if (opts.vault.secret) {
            try {
                this.loadFromVault(opts.vault);
            } catch (err) {
                this.handleError(err);
            }
        }

    }

    get (key) {

        let val = process.env[key];

        if (this.opts.nativeType) {
            return util.toNativeType(val);
        } else {
            return val;
        }

    }

    set (key, val, args) {

        if (_.isString(key)) {

            val = this.parser.expandVariables(val, args);

            if (val !== undefined && util.isUndefined(process.env[key])) {
                return process.env[key] = val;
            } else {
                return this.get(key);
            }

        } else if (_.isPlainObject(key)) {
            _.forOwn(key, (val, _key, args) => {
                this.set(_key, val, args);
            });
        }

        return process.env;

    }

    env (key, val, args) {

        if (arguments.length >= 2) {
            return this.set(key, val, args);
        }

        if (_.isString(key)) {
            return this.get(key);
        }

        if (_.isPlainObject(key)) {
            return this.set(key);
        }

        return process.env;

    }

    resolveConditional (async) {

        let res = this.resolver.resolveConditional(async);

        let handleFiles = (files) => {
            files.map(file => {
                if (file.error) {
                    this.handleError(file.error);
                } else {
                    if (util.isModule(file.contents)) {
                        this.set(file.contents.default);
                    } else if (typeof file.contents === 'string') {
                        this.set(this.parser.parse(file.contents, false));
                    } else {
                        this.set(file.contents);
                    }
                }
            });
            return process.env;
        };

        if (util.isPromise(res)) {
            return res.then(handleFiles);
        } else {
            return handleFiles(res);
        }

    }

    resolve () {
        return this.resolveConditional(false);
    }

    resolveAsync () {
        return this.resolveConditional(true);
    }

    loadFromVault (secret, token, addr) {

        let opts = null;
        let stdin = '';
        let res = null;
        let err = null;
        let workerFilePath = path.join(__dirname, './vault-worker.js');

        if (_.isPlainObject(secret)) {
            opts = secret;
        } else {
            opts = {secret, token, addr};
        }

        stdin = JSON.stringify(_.defaults(opts, this.opts.vault));

        res = cp.spawnSync('node', [workerFilePath], {
            input: stdin,
            timeout: this.opts.timeout
        });

        err = res.error;

        if (err) {
            throw new util.EnvError(`Failed to load variables from vault: ${err.name}: ${err.message}`);
        } else if (res.stderr.length) {
            throw new util.EnvError(`Failed to load variables from vault: ${res.stderr.toString().trim()}`);
        } else if (res.stdout.length) {
            try {
                this.set(JSON.parse(res.stdout.toString()));
            } catch (err) {
                throw new util.EnvError(`Failed to parse vault variables: ${err.name}: ${err.message}`);
            }
        }

    }

    handleError (err) {
        if (this.opts.throw) {
            throw err;
        } else if (this.opts.warn) {
            console.warn(`${err.name}: ${err.message}`);
        }
    }

    get exports () {
        let env = this.env.bind(this);
        env.default = env;
        env.get = this.get.bind(this);
        env.set = this.set.bind(this);
        env.env = env;
        env.Env = Env;
        env.loadFromVault = this.loadFromVault.bind(this);
        return env;
    }

    static get defaults () {
        return defaults;
    }

    static factory () {
        let Fn = this;
        return function factory (...args) {
            return new Fn(...args);
        };
    }

}

module.exports = Env;
