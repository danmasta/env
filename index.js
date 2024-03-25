const Env = require('./lib/env');

const env = new Env({
    files: ['./.env', './config/.env', './env', './config/env'],
    enableArgv: true
});

env.resolve();

module.exports = env.exports;
