const chai = require('chai');
const env = require('../index');
const path = require('path');
const fs = require('fs');

const envfile = path.resolve(__dirname, './.env');
const envstr = fs.readFileSync(envfile).toString();

beforeEach(() => {
    global.assert = chai.assert;
    global.expect = chai.expect;
    global.should = chai.should();
    global.envstr = envstr;
    global.env = env;
    global.envfile = envfile;
});
