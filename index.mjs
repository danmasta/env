import Env from './lib/env.js';

const mod = new Env({
    files: ['./.env', './config/.env', './env', './config/env'],
    enableArgv: true,
    helpers: true
});

await mod.resolveConditional();

export default mod.exports.default;
export { Env };
export const { get, set, env, loadFromVault } = mod.exports;
