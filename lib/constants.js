module.exports = {

    // Primitive types
    TYPES: {
        'true': true,
        'false': false,
        'null': null,
        'undefined': undefined,
        'NaN': NaN
    },

    // Single character escape sequences
    SPECIAL_CHARS: {
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
    },

    // Regex literals
    // unescape: (unicode|unicode|hex|octal|special)
    REGEX: {
        newline: /\r\n|\r|\n/g,
        envext: /\.env$/,
        args: /(?:\\)?(?:\${(\w*)}|\$(\w*))/g,
        quotes: /^["']|["']$/g,
        unescape: /\\(?:u\{([a-fA-F0-9]+)\}|u([a-fA-F0-9]{4})|x([a-fA-F0-9]{2})|([1-7][0-7]{0,2}|[0-7]{2,3})|([bfnrtv0'"\\$]))/g
    }

};
