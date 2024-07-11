var env$1 = require('./lib/env.cjs');

const env = new env$1().resolveSync();

module.exports = env;
