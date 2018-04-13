# Env
Environment variable helper for node apps

Features:
* Easy to use
* Load `.env`, `.js`, or `.json` files
* [Type coercion](#type-coercion) for primitive types
* Ensures `NODE_ENV` is always set
* Command line helper `--env` for setting `NODE_ENV` variable
* Source of truth is always `process.env`
* Will not override existing variables
* Bash-like [variable expansion](#variable-expansion) via `$var` or `${var}`
* Full [character escape sequence](#escape-sequences) support (unicode, hex, octal, single)
* Start of line and end of line [comments](#comments) are supported

## About
We needed a better way to interact with environment variables in node apps. This package aims to simplify the process while maintaining `process.env` as the source of truth. It can load environment variables from dotenv, json, or js files. It can also coerce values so you can use variables with booleans and numbers as their native types. Variable expansion, comments, and full character escape sequences are also supported.

## Usage
Add env as a dependency for your app and install via npm
```bash
npm install @danmasta/env --save
```

Require the package in your app
```javascript
const env = require('@danmasta/env');
```

Get an environment variable
```javascript
env('NODE_ENV');
```

Set an environment variable
```javascript
env('NODE_ENV', 'development');
```

### Methods
Name | Description
-----|------------
`parse(str)` | Parse a `.env` file string and return an object. Supports variable expansion.
`load(str)` | Load a file path, parse the contents, and set key/values on `process.env`

## Environment Files
This package will attempt to load environment files in the following order:
1. `./.env`
2. `./config/.env`
3. `./env.(js|json)`
4. `./config/env.(js|json)`

*If multiple files are found, they do not overwrite each other. This package will respect the first value set for each key*

## Type Coercion
When values are set on `process.env`, by default they are always converted to a string. This makes it awkward when using boolean values or other primitive types. When getting a variable using this package, it will be converted back to it's native type if possible. This includes: `true`, `false`, `null`, `undefined`, `NaN`, and `number`.

## Escape Sequences
All escape sequences defined [here](https://mathiasbynens.be/notes/javascript-escapes) are supported, including unicode code points, unicode escapes, hexidecimal escapes, octal escapes, and single character escapes.

The only way to support escape sequences safely was to use double escape format. Just double escape your sequences: `\\u{1d306}`, `\\u2665`, `\\xA5`, `\\001`, `\\n`, `\\t`, etc.

## Variable Expansion
Bash like variable expansion is supported in `.env` files. Just prefix a variable name with a `$` sign or wrap it in `${var}`. If you need to escape the `$` sign just use double escape format like other sequences: `\\$`.
```
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT
ESCAPED=\\$ESCAPED
```

## Default `NODE_ENV`
This package will attempt to ensure the `NODE_ENV` variable is always set. If it is `undefined` it will set it to 'development', otherwise if the `--env` option is passed as a cmd line argument it will set `NODE_ENV` to `argv.env`.

```
node app --env production
```
Two other helper variables are also included: `DEVELOPMENT`, and `PRODUCTION`. They are boolean values that are true only when `NODE_ENV` matches their respective variable name.

## Comments
Start of line and end of line comments are supported:
```
# redis config
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT # expanded redis url
```
If you want to use the `#` symbol in a string, just wrap the string in single or double quotes:
```
COMMENT='This #comment will not be stripped'
```

## Load Additional `.env` Files
If you are a package author and want to allow configuration of your module via environment variables, but also set safe defaults, you can just include your default variables in a `.env` file in your package, then call the `env.load()` method.
```javascript
const env = require('@danmasta/env');
const path = require('path');

env.load(path.resolve(__dirname, './.env'));
```
This will allow you to set env variables for keys that have not already been set by the user.

## Examples
#### Set a single value
```javascript
env('NODE_ENV', 'development');
```

#### Get a value
```javascript
env('NODE_ENV');
```

#### Set multiple values
```javascript
env({
    NODE_ENV: 'development',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379
});
```

#### Check if development environment
```javascript
env('DEVELOPMENT'); // true if NODE_ENV === 'development' otherwise false
```

#### Check if production environment
```javascript
env('PRODUCTION'); // true if NODE_ENV === 'production' otherwise false
```


## Contact
If you have any questions feel free to get in touch
