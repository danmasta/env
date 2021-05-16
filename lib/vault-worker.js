#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const util = require('./util');
const _ = require('lodash');

const defaults = {
    secret: process.env.VAULT_SECRET,
    token: undefined,
    addr: process.env.VAULT_ADDR
};

try {
    defaults.token = fs.readFileSync(util.resolveFilePath('~/.vault-token'), 'utf8');
} catch (err) {
    defaults.token = undefined;
}

function getOptsFromStdin () {

    return new Promise((resolve, reject) => {

        let res = '';

        process.stdin.setEncoding('utf8');

        process.stdin.on('data', chunk => {
            res += chunk;
        });

        process.stdin.on('end', () => {
            try {
                resolve(_.defaults(JSON.parse(res), defaults));
            } catch (err) {
                reject(err);
            }
        });

    });

}

function makeApiRequest (opts) {

    return new Promise((resolve, reject) => {

        let url = new URL(opts.addr);

        let req = (url.protocol === 'http:' ? http : https).request({
            method: 'GET',
            host: url.host,
            protocol: url.protocol,
            port: url.port,
            path: util.unixify('/v1/' + opts.secret),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Vault-Token': opts.token
            }
        }, res => {

            let data = '';

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data).data.data);
                } catch (err) {
                    reject(err);
                }
            });

        });

        req.on('error', err => {
            reject(err);
        });

        req.end();

    });

}

function close (code) {

    code = _.isNumber(code) && code > 0 ? code : 0;

    process.nextTick(() => {
        process.exit(code);
    });

}

function handleError (err) {
    console.error(err);
    close(1);
}

process.on('SIGINT', () => {
    close();
});

process.on('SIGTERM', () => {
    close();
});

process.on('uncaughtException', err => {
    err.message = `Uncaught Exception Error: ${err.message}`;
    handleError(err);
});

process.on('unhandledRejection', err => {
    err.message = `Unhandled Promise Rejection: ${err.message}`;
    handleError(err);
});

getOptsFromStdin().then(opts => {

    if (!opts.addr) {
        throw new Error('Vault address not found');
    }
    if (!opts.token) {
        throw new Error('Vault token not found');
    }
    if (!opts.secret) {
        throw new Error('Vault secret not found');
    }

    return makeApiRequest(opts).then(res => {
        process.stdout.write(JSON.stringify(res));
    });

}).catch(err => {

    handleError(err);

});
