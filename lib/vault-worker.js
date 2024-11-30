import { env } from 'lo';
import process, { exit, nextTick, stdout } from 'node:process';
import { getVaultSecret } from './vault.js';

function close (code = 0) {
    nextTick(() => {
        exit(code);
    });
}

function handleError (err) {
    console.error(err.message);
    close(1);
}

process.on('SIGINT', () => {
    close();
});

process.on('SIGTERM', () => {
    close();
});

process.on('uncaughtException', err => {
    handleError(err);
});

process.on('unhandledRejection', err => {
    handleError(err);
});

(async function run () {
    try {
        let opts = env('ENV_VAULT_WORKER_OPTS');
        let vars = await getVaultSecret(JSON.parse(opts));
        stdout.write(JSON.stringify(vars));
    } catch (err) {
        handleError(err);
    }
})();
