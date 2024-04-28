const Env = require('./lib/env');

const env = new Env({
    files: ['./.env', './config/.env', './env', './config/env'],
    enableArgv: true,
    helpers: true
});

env.resolve();

module.exports = env.exports;
