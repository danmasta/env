# Env
Environment helper for node apps

#### Features:
* Easy to use
* Load `.env`, `.js`, `.json`, `.cjs`, or `.mjs` files
* [Type coercion](#type-coercion) for primitive types
* Option for setting helper variables like `NODE_ENV`
* Optional command line helper `--env` for defining variables from argv
* Source of truth is always `process.env`
* Will not override existing variables
* Bash-like [variable expansion](#variable-expansion) via `$var` or `${var}`
* Full [character escape sequence](#escape-sequences) support (unicode, hex, octal, single)
* Start of line and end of line [comments](#comments) are supported
* Support for multiline values
* Support for loading variables from [vault](#load-variables-from-vault)
* Native esm and cjs support

## About
I wanted a better way to interact with environment variables in node apps. This package aims to simplify the process while maintaining `process.env` as the source of truth. It can parse variables from `.env`, `.js`, `.json`, `.cjs`, or `.mjs` files, and it can also import variables from [vault](https://github.com/hashicorp/vault) secrets. It supports type casting so you can use variables with boolean or number values as their native types. Variable expansion, multiline values, comments, and full character escape sequences are also supported.

## Usage
Add env as a dependency for your app and install via npm
```bash
npm install @danmasta/env --save
```

Import or require the package in your app
```js
import env from '@danmasta/env';
```

Get an environment variable
```js
env('NODE_ENV');
```

Set an environment variable
```js
env('NODE_ENV', 'development');
```
### Options
name | type | description
-----|------|------------
`enableArgv` | *`boolean`* | Whether or not to enable cli argv helper options. Default is `true`
`nativeType` | *`boolean`* | Whether or not to convert values to native types when reading variables. Default is `true`
`setNodeEnv` | *`boolean`* | Whether or not to set the `NODE_ENV` environment variable if not already set. Default is `false`
`helpers` | *`string\|array`* | List of helper variables to add to env. Default is `['DEVELOPMENT', 'PRODUCTION']`
`files` | *`string\|array`* | Which file paths to attempt to load env variables from. Default is: `['./.env', './config/.env', './env.js', './config/env.js']`
`dir` | *`string`* | Directory to resolve relative paths from. Default is `undefined`
`encoding` | *`string`* | What encoding to use when reading `.env` files. Default is `'utf8'`
`timeout` | *`number`* | Timeout in milliseconds to use when loading variables from vault. Default is `2500`
`replace` | *`boolean`* | Whether or not to replace missing variables during expansion. Default is `true`
`default` | *`string`* | Default value to use for undefined or missing variables during expansion. Default is `''`
`defaultNodeEnv` | *`string`* | Which env name to use if `setNodeEnv` is enabled. Default is `'development'`
`secret` | *`string`* | Default secret path to use when loading variables from vault. Default is `undefined`
`token` | *`string`* | Default auth token to use when loading variables from vault. Default is `undefined`
`addr` | *`string`* | Default server address to use when loading variables from vault. Default is `undefined`
`warn` | *`boolean`* | If true will write a message to `stderr` when an env file is not found. Default is `false`
`throw` | *`boolean`* | If true will throw an error when an env file is not found. Default is `false`
`exts` | *`string\|array`* | Which file extensions to use during file lookup. Default is `['.js', '.json', '.cjs', '.mjs']`

### Methods
Name | Description
-----|------------
`get(key)` | Get a value from `process.env`. Will attempt to convert to native type if enabled
`set(key, val?, args?)` | Set a value on `process.env`. Will not overwrite existing values
`env(key, val?, args?)` | Getter/setter function. Proxies to `get` and `set` based on arguments signature
`resolve()` | Loads env config asynchronously. Returns a promise that resolves with an env `function`
`resolveSync()` | Loads env config synchronously. Returns an env `function`
`loadFromVault(secret?, { secret?, token?, addr?, timeout? })` | Load env variables from a [vault](https://github.com/hashicorp/vault) secret asynchronously. It has a default timeout of `2.5 seconds`
`loadFromVaultSync(secret?, { secret?, token?, addr?, timeout? })` | Load env variables from a [vault](https://github.com/hashicorp/vault) secret synchronously. This method creates a network request using a synchronous worker thread which will block the main thread til complete. It has a default timeout of `2.5 seconds`

## Environment Files
By default this package will attempt to load environment files in the following order:
1. `./.env`
2. `./config/.env`
3. `./env.(js|json|cjs|mjs)`
4. `./config/env.(js|json|cjs|mjs)`

*If multiple files are found, they do not overwrite each other. This package will respect the first value set for each key*

## Type Coercion
When values are set on `process.env`, by default they are always converted to a string. This makes it awkward when using boolean values or other primitive types. When getting a variable using this package, it will attempt to convert the value back to it's native type if desired. This includes: `true`, `false`, `null`, `undefined`, `NaN`, and `number`.

## Escape Sequences
All escape sequences defined [here](https://mathiasbynens.be/notes/javascript-escapes) are supported, including unicode code points, unicode escapes, hexidecimal escapes, octal escapes, and single character escapes.

Just use regular escape code format for values with escape sequences: `\u{1d306}`, `\u2665`, `\xA5`, `\001`, `\n`, `\t`, etc.

## Variable Expansion
Bash-like variable expansion is supported in `.env` files. Just prefix a variable name with a `$` sign or wrap it in `${var}`. If you need to escape the `$` sign just use regular escape format like other sequences: `\$`.
```bash
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT
ESCAPED=\$ESCAPED
```

## Helper Options
There are a few helper options you can use to set things like `NODE_ENV` and parse variables from `argv`:
```js
let env = new Env({
    enableArgv: true
    setNodeEnv: true,
    helpers: ['DEVELOPMENT', 'PRODUCTION'],
});
```
This will let you use helper cli arguments to set variables when running your app:
```bash
node app --node-env=local --env=REDIS_HOST=127.0.0.1,REDIS_PORT=6379
```
Two other helper variables are also added: `DEVELOPMENT`, and `PRODUCTION`. They are boolean values which will be `true` if `NODE_ENV` matches their variable name, otherwise `false`.

## Comments
Start of line and end of line comments are supported:
```bash
# Redis config
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT # Expanded redis url
```
If you want to use the `#` symbol in a string, just wrap the string in single or double quotes:
```bash
COMMENT='This #comment will not be stripped'
```

## Load Additional Files
If you want to load variables from other files programatically you can create a new instance and provide the `files` option with a list of files to load. By default paths in node are resolved using `process.cwd`. Home character expansion `~` is also supported.
```js
let env = new Env({
    files: './config/production/.env'
});

await env.resovle();
```

## Load Variables from [Vault](https://github.com/hashicorp/vault)
This package also supports loading environment variables from vault. It will attempt to read the variables from a vault secret path, then parse the key/value pairs and set them in the environment. The vault api HTTP requests can be made asynchronously, or synchronously via a worker thread that has a default timeout of `2.5 seconds`.
```js
import { loadFromVault } from '@danmasta/env';

let token = '$VAULT_TOKEN';
let addr = '$VAULT_ADDR';

await loadFromVault('/env/app/prod', { token, addr });
```
The secret, token, and addr params can be set explicity when calling the function, or can be set as defaults when creating an env instance. It will also read from the `VAULT_TOKEN` and `VAULT_ADDR` [environment variables](https://www.vaultproject.io/docs/commands#environment-variables), as well as the default [token helper](https://www.vaultproject.io/docs/commands#token-helper) file location: `~/.vault-token`.

*Note: When loading secrets from vault, the api path is slightly [different](https://developer.hashicorp.com/vault/docs/secrets/kv#version-comparison) for `kv v1` vs `kv v2 (versioned)` secrets*

### Example
If you had a `kv v1` secret mount point of `/env` and you wanted to load the secret path `/app/prod`, you could use the whole path as-is:
```js
await loadFromVault('/env/app/prod');
```
However, with `kv v2`, you need to append `/data` to the mount point. The above example would become:
```js
await loadFromVault('/env/data/app/prod');
```

### Sync
If your app is still `cjs` and/or doesn't support top level `await`, and you need to load variables from vault synchronously, you can do that too:
```js
const { loadFromVaultSync } = require('@danmasta/env');

loadFromVaultSync('/env/app/prod');
```

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
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379
});
```

#### Load extra env files
```js
let env = new Env({
    files: './config/production/.env'
});

await env.resovle();
```

#### Load env variables from vault
```bash
export VAULT_TOKEN="$TOKEN"
export VAULT_ADDR="https://vault.tld.net"
```
```js
await env.loadFromVault('/env/app/prod');
```

#### ESM
If running in esm mode, you should export your env config as default:
```js
export default {
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379
};
```

#### Load env variables dynamically from vault based on config settings
If you use a [config library](https://github.com/danmasta/config) that supports loading `js` files you can use this package to load environment variables based on your config settings:
```js
// ./config/local.js
import { loadFromVault } from '@danmasta/env';

await loadFromVault('/env/app/local');

export default {
    ...
};


// ./config/development.js
import { loadFromVault } from '@danmasta/env';

await loadFromVault('/env/app/dev');

export default {
    ...
};


// ./config/production.js
import { loadFromVault } from '@danmasta/env';

await loadFromVault('/env/app/prod');

export default {
    ...
};


// ./app.js
import env from '@danmata/env';
import config from '@danmasta/config';

app.listen(...);
```

#### Check if development environment using helper vars
```js
env('DEVELOPMENT'); // true if NODE_ENV === 'development' otherwise false
```

#### Check if production environment using helper vars
```js
env('PRODUCTION'); // true if NODE_ENV === 'production' otherwise false
```

## Contact
If you have any questions feel free to get in touch
