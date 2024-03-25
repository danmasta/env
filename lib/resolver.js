const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const util = require('./util');

const defaults = {
    encoding: 'utf8',
    dir: undefined,
    files: undefined
};

class FileResolver {

    constructor (opts) {
        this.opts = opts = util.defaults(opts, defaults);
    }

    refresh (opts) {
        this.opts = util.defaults(opts, this.opts, defaults);
    }

    resolvePath (str) {
        return util.resolvePath(str, this.opts.dir);
    }

    resolvePathIfExists (str) {
        return util.resolvePathIfExists(str, this.opts.dir);
    }

    // Conditionally require or import based on esm-ness
    requireImportOrRead (str) {

        let ext = path.extname(str);

        switch (ext) {
            case '.json':
                if (util.isEsmMode()) {
                    return import(str, { assert: { type: 'json' }});
                } else {
                    return require(str);
                }
            case '.js':
            case '.cjs':
                if (util.isEsmMode()) {
                    return import(str);
                } else {
                    try {
                        return require(str);
                    } catch (err) {
                        if (err.code === 'ERR_REQUIRE_ESM' || err.code === 'ERR_REQUIRE_ASYNC_MODULE') {
                            return import(str);
                        }
                        throw err;
                    }
                }
                break;
            case '.mjs':
                return import(str);
            case '':
            case '.env':
                return fs.readFileSync(str, this.opts.encoding);
            default:
                throw new util.EnvError(`File type not supported: ${str}`);
        }

    }

    // Resolve in a conditionally async manner
    // Returns a promise if any file requires import or async is set to true
    // Uses regular .map and .allSettled to preserve correct order
    resolveConditional (async) {

        let files = this.getFileList().map(file => {
            if (util.isPromise(file.contents)) {
                if (async === false) {
                    throw new util.EnvError(`Failed to resolve, requires async: ${file.original}`);
                } else {
                    async = true;
                }
                return file.contents.then(contents => {
                    return _.set(file, 'contents', contents);
                });
            } else {
                if (util.isError(file.error) && async === true) {
                    return Promise.reject(file);
                } else {
                    return file;
                }
            }
        });

        if (async) {
            return Promise.allSettled(files).then(this.formatSettledFiles);
        } else {
            return files;
        }

    }

    resolve () {
        return this.resolveConditional(false);
    }

    resolveAsync () {
        return this.resolveConditional(true);
    }

    // Returns a list of file objects
    getFileList () {

        let files = util.flattenAndCompact(this.opts.files);

        return files.map(str => {
            let file, contents, error;
            try {
                file = this.resolvePathIfExists(str);
                contents = this.requireImportOrRead(file);
            } catch (err) {
                error = err;
            }
            return {
                path: file,
                original: str,
                contents,
                error
            }
        });

    }

    formatSettledFiles (arr) {
        return arr.map(val => {
            if (val.status === 'rejected') {
                return val.reason;
            } else {
                return val.value;
            }
        });
    }

    static get defaults () {
        return defaults;
    }

}

module.exports = FileResolver;
