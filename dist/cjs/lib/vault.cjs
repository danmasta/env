var lo = require('lo');
var promises = require('node:fs/promises');
var constants = require('./constants.cjs');
var util = require('./util.cjs');

const defs = {
    secret: lo.env('VAULT_SECRET'),
    token: lo.env('VAULT_TOKEN'),
    addr: lo.env('VAULT_ADDR'),
    timeout: 1000 * 2.5
};

async function getVaultSecret (path, opts={}) {
    if (lo.isObject(path)) {
        opts = path;
    } else {
        opts.secret = path;
    }
    let { secret, token, addr, timeout } = lo.defaults(opts, defs);
    if (!secret) {
        throw new util.EnvError('Vault secret not found');
    }
    if (!token) {
        try {
            token = await promises.readFile(constants.PATHS.vaultToken, 'utf8');
        } catch {
            throw new util.EnvError('Vault token not found');
        }
    }
    if (!addr) {
        throw new util.EnvError('Vault address not found');
    }
    let url = new URL(addr);
        url.pathname = util.unixify('/v1/' + secret);
    let res;
    // Note: Vault HTTP Api uses json by default
    // https://developer.hashicorp.com/vault/api-docs#api-operations
    try {
        res = await fetch(url, {
            headers: {
                'X-Vault-Token': token
            },
            signal: AbortSignal.timeout(timeout)
        });
    } catch (err) {
        throw new util.EnvError('Vault request failed: %s', err.message);
    }
    let json = await res.json();
    if (res.ok) {
        return json.data.data;
    } else {
        throw new util.EnvError('Vault request failed: %d %s: %O', res.status, res.statusText, json);
    }
}

function getVaultSecretSync (path, opts={}) {
    if (lo.isObject(path)) {
        opts = path;
    } else {
        opts.secret = path;
    }
    let { secret, token, addr, timeout } = lo.defaults(opts, defs);
    let { stderr, stdout, err } = util.spawnWorkerSync({
        env: {
            ENV_VAULT_WORKER_OPTS: JSON.stringify({ secret, token, addr, timeout })
        },
        timeout
    });
    if (err) {
        throw new util.EnvError('Vault worker failed: %s', err.message);
    }
    if (stderr) {
        throw new util.EnvError(stderr);
    }
    if (stdout) {
        try {
            return JSON.parse(stdout);
        } catch (err) {
            throw new util.EnvError('Failed to parse vault variables: %s', err.message);
        }
    }
}

exports.getVaultSecret = getVaultSecret;
exports.getVaultSecretSync = getVaultSecretSync;
