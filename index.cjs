import { defs, loadFromArgv, loadFromFilesSync, setHelpers } from './lib/env.js';

loadFromArgv({ overwrite: true });
loadFromFilesSync(defs);
setHelpers(defs);

export {
    env as default,
    Env,
    env,
    get,
    loadFromArgv,
    loadFromFiles,
    loadFromFilesSync,
    loadFromVault,
    loadFromVaultSync,
    resolve,
    resolveSync,
    set,
    setHelpers
} from './lib/env.js';
