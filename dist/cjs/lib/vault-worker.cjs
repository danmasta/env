var lo = require('lo');
var process = require('node:process');
var vault = require('./vault.cjs');

function close (code = 0) {
    process.nextTick(() => {
        process.exit(code);
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
        let opts = lo.env('ENV_VAULT_WORKER_OPTS');
        let vars = await vault.getVaultSecret(JSON.parse(opts));
        process.stdout.write(JSON.stringify(vars));
    } catch (err) {
        handleError(err);
    }
})();
