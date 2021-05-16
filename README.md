# Env
Environment variable helper for node apps

Features:
* Easy to use
* Load `.env`, `.js`, or `.json` files
* [Type coercion](#type-coercion) for primitive types
* Option for setting helper variables like `NODE_ENV`
* Optional command line helper `--env` for defining variables from argv
* Source of truth is always `process.env`
* Will not override existing variables
* Bash-like [variable expansion](#variable-expansion) via `$var` or `${var}`
* Full [character escape sequence](#escape-sequences) support (unicode, hex, octal, single)
* Start of line and end of line [comments](#comments) are supported
* Support for loading variables from [vault](https://www.vaultproject.io/)

## About
We needed a better way to interact with environment variables in node apps. This package aims to simplify the process while maintaining `process.env` as the source of truth. It can load environment variables from vault secrets and from dotenv, json, or js files. It can also coerce values so you can use variables with booleans and numbers as their native types. Variable expansion, comments, and full character escape sequences are also supported.

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
### Options
name | type | description
-----|------|------------
`nativeType` | *`boolean`* | Whether or not to convert values to native types when reading variables. Default is `true`
`setNodeEnv` | *`boolean`* | Whether or not to attempt to set `NODE_ENV` if not already set. Default is `false`
`setHelpers` | *`boolean`* | Whether or not to set helper environment variables. Default is `false`
`filePaths` | *`string\|array`* | Which file paths to attempt to load env variables from. Default is: `undefined`
`enableArgv` | *`boolean`* | Whether or not to enable cli argv helper options. Default is `false`
`encoding` | *`string`* | What encoding to use when reading env files. Default is `'utf8'`
`timeout` | *`number`* | Timeout in milliseconds to use when loading variables from vault. Default is `1000`
`replaceMissing` | *`boolean`* | Whether or not to replace missing variables during expansion. Default is `true`
`default` | *`string`* | Default value to use for undefined or missing variables during expansion. Default is `''`
`vault` | *`object`* | Default parameters to use when loading variables from vault secrets. Default is `{ secret: undefined, token: undefined, addr: undefined }`


### Methods
Name | Description
-----|------------
`get(key)` | Get a value from `process.env`. Will attempt to convert to native type if desired
`set(key, val)` | Set a value on `process.env`. Will not overwrite already existing values
`env(key, val)` | Getter/setter function. It proxies to `get` and `set` based on arguments signature
`loadFromFile(path)` | Load environment variables from a file. Will parse text files in dotenv format or require json or js files
`loadFromVault(secret, token, addr)` | Attempts to load variables from a [vault](https://www.vaultproject.io/) secret. This method creates a network request using a synchronous worker thread which will block the thread til complete. It has a default timeout of 1 second

## Environment Files
By default this package will attempt to load environment files in the following order:
1. `./.env`
2. `./config/.env`
3. `./env.(js|json)`
4. `./config/env.(js|json)`

*If multiple files are found, they do not overwrite each other. This package will respect the first value set for each key*

## Type Coercion
When values are set on `process.env`, by default they are always converted to a string. This makes it awkward when using boolean values or other primitive types. When getting a variable using this package, it will attempt to convert the value back to it's native type if desired. This includes: `true`, `false`, `null`, `undefined`, `NaN`, and `number`.

## Escape Sequences
All escape sequences defined [here](https://mathiasbynens.be/notes/javascript-escapes) are supported, including unicode code points, unicode escapes, hexidecimal escapes, octal escapes, and single character escapes.

Just use regular escape code format for values with escape sequences: `\u{1d306}`, `\u2665`, `\xA5`, `\001`, `\n`, `\t`, etc.

## Variable Expansion
Bash like variable expansion is supported in `.env` files. Just prefix a variable name with a `$` sign or wrap it in `${var}`. If you need to escape the `$` sign just use regular escape format like other sequences: `\$`.
```sh
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT
ESCAPED=\$ESCAPED
```

## Helper Options
There are a few helper options you use to set things like `NODE_ENV` and parse variables from argv:
```js
let env = new Env({
    setNodeEnv: true,
    setHelpers: true,
    enableArgv: true
});
```
This will let you use helper cli options to set variables when running your app:
```sh
node app --node-env=local --env=REDIS_HOST=127.0.0.1,REDIS_PORT=6379
```
Two other helper variables are also added: `DEVELOPMENT`, and `PRODUCTION`. They are boolean values which are true only when `NODE_ENV` matches their respective variable name.

## Comments
Start of line and end of line comments are supported:
```sh
# redis config
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT # expanded redis url
```
If you want to use the `#` symbol in a string, just wrap the string in single or double quotes:
```sh
COMMENT='This #comment will not be stripped'
```

## Load Additional Files
If you want to load variables from other files you can use the function `loadFromFile`. By default paths in node are resolved using `process.cwd`. Tilde expansion `~` is also supported.
```js
env.loadFromFile('./config/production/.env'));
```

## Load Variables from [Vault](https://www.vaultproject.io/)
This package also has support for loading environment variables from vault. It will attempt to read the variables from a vault secret path, then parse the key,value pairs and set them in the environment. The vault api http requests are made synchronously in a worker thread that has a default timeout of 1 second.
```js
env.loadFromVault('env/app/prod', '$VAULT_TOKEN', '$VAULT_ADDR');
```
Secret, token, and address params can be set explicity when calling the function, or can be set as defaults when creating an env instance. It can also read from the `VAULT_TOKEN` and `VAULT_ADDR` [environment variable](https://www.vaultproject.io/docs/commands#environment-variables) settings and the default [token helper](https://www.vaultproject.io/docs/commands#token-helper) file location `~/.vault-token`.

## Examples
#### Set a single value
```js
env('NODE_ENV', 'development');
```

#### Get a value
```js
env('NODE_ENV');
```

#### Set multiple values
```js
env({
    NODE_ENV: 'development',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379
});
```

#### Load extra env files
```js
env.loadFromFile('./config/production/.env'));
```

#### Load env variables from vault
```sh
export VAULT_TOKEN="$TOKEN"
export VAULT_ADDR="https://vault.app.com"
```
```js
env.loadFromVault('env/app/prod'));
```

#### Load env variables dynamically from vault based on config settings
If you use a [config library](https://github.com/danmasta/config) that supports loading js files you can use this package to load environment variables based on your config settings:
```js
// config/local.js
env.loadFromVault('env/app/local');

module.exports = {
    // config here
};


// config/development.js
env.loadFromVault('env/app/dev');

module.exports = {
    // config here
};


// config/production.js
env.loadFromVault('env/app/prod');

module.exports = {
    // config here
};


// app.js
const env = require('@danmata/env');
const config = require('@danmasta/config');

app.listen(...);
```

#### Check if development environment using helper var
```js
env('DEVELOPMENT'); // true if NODE_ENV === 'development' otherwise false
```

#### Check if production environment using helper var
```js
env('PRODUCTION'); // true if NODE_ENV === 'production' otherwise false
```


## Contact
If you have any questions feel free to get in touch
