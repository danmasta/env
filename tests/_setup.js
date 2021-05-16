const chai = require('chai');
const path = require('path');
const fs = require('fs');
const Env = require('../lib/env');
const util = require('../lib/util');

const envFilePath = path.resolve(__dirname, './.env');
const envFileContents = fs.readFileSync(envFilePath).toString();

beforeEach(() => {
    global.assert = chai.assert;
    global.expect = chai.expect;
    global.should = chai.should();
    global.Env = Env;
    global.env = new Env();
    global.envFilePath = envFilePath;
    global.envFileContents = envFileContents;
    global.util = util;
});
