const Env = require('./lib/env');

const env = new Env({
    filePaths: ['./.env', './config/.env', './env', './config/env'],
    enableArgv: true
});

exports = module.exports = env.exports;
exports.Env = Env;
