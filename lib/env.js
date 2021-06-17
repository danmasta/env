const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const minimist = require('minimist');
const _ = require('lodash');
const util = require('./util');
const constants = require('./constants');

const defaults = {
    nativeType: true,
    setNodeEnv: false,
    setHelpers: false,
    filePaths: undefined,
    enableArgv: false,
    encoding: 'utf8',
    timeout: 1000 * 1,
    replaceMissing: true,
    default: '',
    vault: {
        secret: undefined,
        token: undefined,
        addr: undefined
    }
};

const argv = minimist(process.argv.slice(2));

class EnvError extends Error {

    constructor (msg) {
        super(msg);
        Error.captureStackTrace(this, EnvError);
        this.name = 'EnvError';
        this.code = 'ENVERROR';
    }

}

class Env {

    constructor (opts) {

        opts = this._opts = _.defaultsDeep(opts, defaults);

        if (opts.enableArgv) {
            this.set('NODE_ENV', argv['node-env']);
            this.set(util.parseParamString(argv.env));
        }

        if (opts.vault.secret) {
            try {
                this.loadFromVault(opts.vault);
            } catch (err) {
                if (this.get('DEBUG')) {
                    console.error(err);
                }
            }
        }

        if (opts.filePaths) {
            _.each(_.concat(opts.filePaths), file => {
                try {
                    this.loadFromFile(file);
                } catch (err) {
                    if (this.get('DEBUG')) {
                        console.error(err);
                    }
                }
            });
        }

        if (opts.setNodeEnv) {
            this.set('NODE_ENV', 'development');
        }

        if (opts.setHelpers) {
            ['DEVELOPMENT', 'PRODUCTION'].map(str => {
                this.set(str, this.get('NODE_ENV') === str.toLowerCase());
            });
        }

    }

    get (key) {

        let val = process.env[key];

        if (this._opts.nativeType) {
            return util.toNativeType(val);
        } else {
            return val;
        }

    }

    set (key, val, args) {

        if (_.isString(key)) {
            val = this.expandVariables(val, args);
            if (val !== undefined) {
                return process.env[key] = (process.env[key] === undefined ? val : process.env[key]);
            }
        } else if (_.isPlainObject(key)) {
            _.forOwn(key, (val, key_) => {
                this.set(key_, val, key);
            });
        }

        return process.env;

    }

    env (...args) {

        if (args.length === 2) {
            return this.set(...args);
        }

        if (_.isString(args[0])) {
            return this.get(args[0]);
        }

        if (_.isPlainObject(args[0])) {
            return this.set(args[0]);
        }

        return process.env;

    }

    expandVariables (str, vars) {

        if (typeof str !== 'string') {

            return str;

        } else {

            return str.replace(constants.REGEX.args, (match, $1, $2) => {

                let key = $1 !== undefined ? $1 : $2;
                let val = undefined;

                // don't replace escaped vars
                if (match[0] === '\\') {
                    return match.slice(1);
                }

                val = process.env[key] !== undefined ? process.env[key] : vars ? vars[key] : undefined;

                if (val === undefined) {
                    if (this._opts.replaceMissing) {
                        val = this._opts.default;
                    } else {
                        val = match;
                    }
                }

                return val;

            });

        }

    }

    parseEnvStr (str, expand) {

        let res = {};

        str.split(constants.REGEX.newline).forEach(line => {

            let index = -1;
            let key = undefined;
            let val = undefined;

            line = line.trim();

            // ignore comments
            if (!line || line[0] === '#') {
                return;
            }

            if (expand !== false) {
                line = this.expandVariables(line, res);
            }

            index = line.indexOf('=');
            index = index > -1 ? index : line.length;

            key = line.slice(0, index).trim();
            val = line.slice(index +1).trim();

            val = util.removeInlineComment(val);
            val = util.removeQuotes(val);

            res[key] = util.unescape(val);

        });

        return res;

    }

    loadFromFile (file) {

        file = util.resolveFilePath(file);

        let contents = null;
        let ext = path.extname(file);

        try {
            try {
                fs.accessSync(file, fs.constants.F_OK);
                switch (ext) {
                    case '.js':
                    case '.json':
                        contents = require(file);
                        break;
                    default:
                        contents = this.parseEnvStr(fs.readFileSync(file, this._opts.encoding), false);
                }
            } catch (err) {
                contents = require(file);
            }
        } catch (err) {
            throw new EnvError(`Failed to load env file: ${err.name}: ${err.message}`);
        }

        return this.set(contents);

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

        stdin = JSON.stringify(_.defaults(opts, this._opts.vault));

        res = cp.spawnSync('node', [workerFilePath], {
            input: stdin,
            timeout: this._opts.timeout
        });

        err = res.error;

        if (err) {
            throw new EnvError(`Failed to load variables from vault: ${err.name}: ${err.message}`);
        } else if (res.stderr.length) {
            throw new EnvError(`Failed to load variables from vault: ${res.stderr.toString().trim()}`);
        } else if (res.stdout.length) {
            try {
                this.set(JSON.parse(res.stdout.toString()));
            } catch (err) {
                throw new EnvError(`Failed to parse vault variables: ${err.name}: ${err.message}`);
            }
        }

    }

    get exports () {
        let env = this.env.bind(this);
        env.get = this.get.bind(this);
        env.set = this.set.bind(this);
        env.loadFromFile = this.loadFromFile.bind(this);
        env.loadFromVault = this.loadFromVault.bind(this);
        return env;
    }

    static get defaults () {
        return defaults;
    }

    static get constants () {
        return constants;
    }

    static factory () {
        let Fn = this;
        return function envFactory (...args) {
            return new Fn(...args);
        };
    }

}

module.exports = Env;
