const path = require('path');
const fs = require('fs');
const minimist = require('minimist');

// get cmd args
const argv = minimist(process.argv.slice(2));

// primitive types
const types = {
    'true': true,
    'false': false,
    'null': null,
    'undefined': undefined,
    'NaN': NaN
};

// https://stackoverflow.com/a/1830844/2180385
function isNumeric(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// get env variable, converts to native type
function get(key){

    let val = process.env[key];
    return val in types ? types[val] : isNumeric(val) ? parseFloat(val) : val;

}

// sets environment variable if it does not exist already
// env variables are stringified when set
function set(key, val){
    return process.env[key] = (process.env[key] === undefined ? val : process.env[key]);
}

function env(key, val){

    // handle get
    if(typeof key === 'string' && val === undefined){
        return get(key);
    }

    // handle setting single values
    if(arguments.length === 2){
        return set(key, val);
    }

    // handle setting objects
    if(key && typeof key === 'object' && !(key instanceof Array)){
        for(let i in key){
            set(i, key[i]);
        }
    }

    return process.env;

}

// attempt to load env configuration files
function init(){

    let prod = argv._.findIndex(e => { return /production|prod/.test(e); }) > -1;

    // NODE_ENV = true if production cli flag passed
    if(prod || argv.production || argv.prod){
        set('NODE_ENV', 'production');
    }

    // load and parse .env file
    ['./.env'].map(file => {

        try {

            fs.readFileSync(path.resolve(file), 'utf8').split(/\r\n|\r|\n/g).map(str => {

                if(str){
                    set.apply(null, str.split('='));
                }

            });

        } catch(err) {

            if(env('DEBUG')){
                console.log(`Env: ${err.message}`);
            }

        }

    });

    // load .js and .json files
    ['./env', './config/env'].map(file => {

        try {

            env(require(path.resolve(file)));

        } catch(err) {

            if(env('DEBUG')){
                console.log(`Env: ${err.message}`);
            }

        }

    });

    set('NODE_ENV', 'development');
    set('DEV', /development/.test(get('NODE_ENV')));
    set('PROD', /production/.test(get('NODE_ENV')));

}

init();

module.exports = env;
