const util = require('./util');
const constants = require('./constants');

const defaults = {
    replaceMissing: true,
    default: '',
};

class Parser {

    constructor (opts) {
        this.opts = opts = util.defaults(opts, defaults);
    }

    expandVariables (str, vars) {

        if (typeof str !== 'string') {

            return str;

        } else {

            return str.replace(constants.REGEX.args, (match, $1, $2) => {

                let key = $1 !== undefined ? $1 : $2;
                let val = undefined;

                // Don't replace escaped vars
                if (match[0] === '\\') {
                    return match.slice(1);
                }

                val = process.env[key] !== undefined ? process.env[key] : vars ? this.expandVariables(vars[key]) : undefined;

                if (val === undefined) {
                    if (this.opts.replaceMissing) {
                        val = this.opts.default;
                    } else {
                        val = match;
                    }
                }

                return val;

            });

        }

    }

    parse (str, expand) {

        let res = {};
        let prev = null;

        str.split(constants.REGEX.newline).forEach(line => {

            line = line.trim();

            // Ignore comments
            if (!line || line[0] === '#') {
                return;
            }

            if (expand !== false) {
                line = this.expandVariables(line, res);
            }

            let { 0: key, 1: val } = util.split(line, line.indexOf('='));

            // Support multiline values
            if (!val && key.length === line.length) {
                val = key, key = null;
            }

            val = util.removeCommentAndQuotes(val);
            val = util.unescape(val);

            if (key) {
                res[key] = val;
                prev = key;
            } else {
                if (prev) {
                    res[prev] += (res[prev] ? '\n' : '') + val;
                }
            }

        });

        return res;

    }

    static get defaults () {
        return defaults;
    }

    static get constants () {
        return constants;
    }

}

module.exports = Parser;
