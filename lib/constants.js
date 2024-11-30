import { resolve } from 'lo';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const lib = dirname(fileURLToPath(import.meta.url));

// Primitive types
export const TYPES = {
    'true': true,
    'false': false,
    'null': null,
    'undefined': undefined,
    'NaN': NaN,
    'Infinity': Infinity,
    '-Infinity': -Infinity
};

// Single character escape sequences
export const SPECIAL_CHARS = {
    'b': '\b',
    'f': '\f',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'v': '\v',
    '0': '\0',
    '\'': '\'',
    '"': '"',
    '\\': '\\',
    '$': '$'
};

// Regex literals
// Unescape: (unicode|unicode|hex|octal|special)
export const REGEX = {
    newline: /\r\n|\r|\n/g,
    args: /(?:\\)?(?:\${(\w*)}|\$(\w*))/g,
    quotes: /^["']|["']$/g,
    unescape: /\\(?:u\{([a-fA-F0-9]+)\}|u([a-fA-F0-9]{4})|x([a-fA-F0-9]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|([bfnrtv0'"\\$]))/g
};

export const PATHS = {
    lib,
    vaultWorker: resolve('./vault-worker.js', lib),
    vaultToken: resolve('~/.vault-token')
};
