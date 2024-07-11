import Env from './lib/env.js';

export const {
    get,
    set,
    env,
    loadFromVault,
    loadFromVaultSync
} = await new Env().resolve();

export {
    env as default,
    Env
};
