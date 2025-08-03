var env = require('./lib/env.cjs');

env.loadFromArgv({ overwrite: true });
env.loadFromFilesSync(env.defs);
env.setHelpers(env.defs);

exports.Env = env.Env;
exports.default = env.env;
exports.env = env.env;
exports.get = env.get;
exports.loadFromArgv = env.loadFromArgv;
exports.loadFromFiles = env.loadFromFiles;
exports.loadFromFilesSync = env.loadFromFilesSync;
exports.loadFromVault = env.loadFromVault;
exports.loadFromVaultSync = env.loadFromVaultSync;
exports.resolve = env.resolve;
exports.resolveSync = env.resolveSync;
exports.set = env.set;
exports.setHelpers = env.setHelpers;
