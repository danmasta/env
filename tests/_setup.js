const path = require('path');
const fs = require('fs');
const Env = require('../lib/env');
const util = require('../lib/util');

const envpath = path.resolve(__dirname, './.env');
const envstr = fs.readFileSync(envpath, 'utf8');

const env = new Env({
    files: envpath
});

env.resolve();

beforeEach(() => {
    return import('chai').then(chai => {
        global.assert = chai.assert;
        global.expect = chai.expect;
        global.should = chai.should();
        global.Env = Env;
        global.env = env;
        global.envpath = envpath;
        global.envstr = envstr;
        global.util = util;
        global.path = path;
    });
});
