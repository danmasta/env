import { defaults, env, isObject } from '@danmasta/lo';
import { readFile } from 'node:fs/promises';
import { PATHS } from './constants.js';
import { EnvError, spawnWorkerSync, unixify } from './util.js';

const defs = {
    secret: env('VAULT_SECRET'),
    token: env('VAULT_TOKEN'),
    addr: env('VAULT_ADDR'),
    timeout: 1000 * 2.5
};

export async function getVaultSecret (path, opts={}) {
    if (isObject(path)) {
        opts = path;
    } else {
        opts.secret = path;
    }
    let { secret, token, addr, timeout } = defaults(opts, defs);
    if (!secret) {
        throw new EnvError('Vault secret not found');
    }
    if (!token) {
        try {
            token = await readFile(PATHS.vaultToken, 'utf8');
        } catch {
            throw new EnvError('Vault token not found');
        }
    }
    if (!addr) {
        throw new EnvError('Vault address not found');
    }
    let url = new URL(addr);
        url.pathname = unixify('/v1/' + secret);
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
        throw new EnvError('Vault request failed: %s', err.message);
    }
    let json = await res.json();
    if (res.ok) {
        return json.data.data;
    } else {
        throw new EnvError('Vault request failed: %O', json);
    }
}

export function getVaultSecretSync (path, opts={}) {
    if (isObject(path)) {
        opts = path;
    } else {
        opts.secret = path;
    }
    let { secret, token, addr, timeout } = defaults(opts, defs);
    let { stderr, stdout, err } = spawnWorkerSync({
        env: {
            ENV_VAULT_WORKER_OPTS: JSON.stringify({ secret, token, addr, timeout })
        },
        timeout
    });
    if (err) {
        throw new EnvError('Vault worker failed: %s', err.message);
    }
    if (stderr) {
        throw new EnvError(stderr);
    }
    if (stdout) {
        try {
            return JSON.parse(stdout);
        } catch (err) {
            throw new EnvError('Failed to parse vault variables: %s', err.message);
        }
    }
}
