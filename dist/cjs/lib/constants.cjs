var lo = require('@danmasta/lo');
var node_path = require('node:path');
var node_url = require('node:url');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
const lib = node_path.dirname(node_url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.src || new URL('lib/constants.cjs', document.baseURI).href))));

// Primitive types
const TYPES = {
    'true': true,
    'false': false,
    'null': null,
    'undefined': undefined,
    'NaN': NaN,
    'Infinity': Infinity,
    '-Infinity': -Infinity
};

// Single character escape sequences
const SPECIAL_CHARS = {
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
const REGEX = {
    newline: /\r\n|\r|\n/g,
    args: /(?:\\)?(?:\${(\w*)}|\$(\w*))/g,
    quotes: /^["']|["']$/g,
    unescape: /\\(?:u\{([a-fA-F0-9]+)\}|u([a-fA-F0-9]{4})|x([a-fA-F0-9]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|([bfnrtv0'"\\$]))/g
};

const PATHS = {
    lib,
    vaultWorker: lo.resolvePath('./vault-worker.cjs', lib),
    vaultToken: lo.resolvePath('~/.vault-token')
};

exports.PATHS = PATHS;
exports.REGEX = REGEX;
exports.SPECIAL_CHARS = SPECIAL_CHARS;
exports.TYPES = TYPES;
