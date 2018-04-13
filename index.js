const path = require('path');
const fs = require('fs');
const minimist = require('minimist');
const util = require('./lib/util');
const constants = require('./lib/constants');;
const types = constants.TYPES;

// get cmd args
const argv = minimist(process.argv.slice(2));

// get env variable, converts to native type
function get(key) {

    let val = process.env[key];

    return val in types ? types[val] : util.isNumeric(val) ? parseFloat(val) : val;

}

// sets environment variable if it does not exist already
// env variables are stringified when set
function set(key, val) {
    return process.env[key] = (process.env[key] === undefined ? val : process.env[key]);
}

function env(key, val) {

    // handle get
    if (typeof key === 'string' && val === undefined) {
        return get(key);
    }

    // handle setting single values
    if (arguments.length === 2) {
        return set(key, val);
    }

    // handle setting objects
    if (key && typeof key === 'object' && !(key instanceof Array)) {
        for(let i in key){
            set(i, key[i]);
        }
    }

    return process.env;

}

// load a file's contents and add to env
function load(file) {

    let contents = null;

    file = path.resolve(file);

    // handle .env files
    if (constants.REGEX.envfile.test(file)) {
        contents = util.parse(fs.readFileSync(file, 'utf8'));

    // handle .js/.json files
    } else {
        contents = require(file);
    }

    return env(contents);

}

// attempt to load env configuration files
function init(){

    // set NODE_ENV to --env value
    if (argv.env) {
        set('NODE_ENV', argv.env);
    }

    // load evironment files
    ['./.env', './config/.env', './env', './config/env'].map(file => {

        try {

            load(file);

        } catch(err) {

            if (env('DEBUG')) {
                console.error(`Env: ${err.message}`);
            }

        }

    });

    // set default vars
    set('NODE_ENV', 'development');

    ['DEVELOPMENT', 'PRODUCTION'].map(str => {
        set(str, get('NODE_ENV') === str.toLowerCase());
    });

}

init();

module.exports = env;
module.exports.load = load;
module.exports.parse = util.parse;
