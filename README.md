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
* Native ESM and CJS support
* 0 external dependencies

## About
I wanted a better way to interact with environment variables in node apps. This package aims to simplify the process while maintaining `process.env` as the source of truth. It can parse variables from `.env`, `.js`, `.json`, `.cjs`, or `.mjs` files, and it can also import variables from [vault](https://github.com/hashicorp/vault) secrets. It supports type casting so you can use variables with boolean or number values as their native types. Variable expansion, multiline values, comments, and full character escape sequences are also supported.

## Usage
Add env as a dependency for your app and install via npm
```sh
npm install env@danmasta/env --save
```
Install a specific [version](https://github.com/danmasta/env/tags)
```sh
npm install env@danmasta/env#(tag\|commit) --save
```

Import or require the package in your app
```js
import env from 'env';
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
Name | Type | Description
-----|------|------------
`setArgv` | *`boolean`* | Set variables from argv. Used in `resolve` fns. Default is `false`
`argv` | *`string\|string[]\|object`* | Value to use for parsing argv. Default is `undefined`
`setNodeEnv` | *`boolean`* | Set the `NODE_ENV` variable if not already set. Default is `false`
`nodeEnv` | *`string`* | Value to use if `setNodeEnv` is enabled. Default is `'development'`
`helpers` | *`string\|string[]`* | List of helper variables to add if `setNodeEnv` is enabled. Default is `['DEVELOPMENT', 'PRODUCTION']`
`files` | *`string\|string[]`* | File paths to load variables from. Default is: `['./.env', './config/.env', './env.js', './config/env.js']`
`dir` | *`string`* | Directory to resolve relative paths from. Default is `undefined`
`exts` | *`string\|string[]`* | Supported file extensions to use during file lookup. Default is `['.js', '.json', '.cjs', '.mjs']`
`encoding` | *`string`* | Encoding to use when reading `.env` files. Default is `'utf8'`
`native` | *`boolean`* | Convert values to native types when reading variables. Default is `true`
`replace` | *`boolean`* | Replace `undefined` variables during expansion. Default is `true`
`def` | *`string`* | Value to use for `undefined` variables during expansion. Default is `''`
`secret` | *`string`* | Secret path to use when loading variables from vault. Default is `undefined`
`token` | *`string`* | Auth token to use when loading variables from vault. Default is `undefined`
`addr` | *`string`* | Server address to use when loading variables from vault. Default is `undefined`
`timeout` | *`number`* | Timeout in milliseconds to use when loading variables from vault. Default is `2500`
`silent` | *`boolean`* | Disable error output. Default is `true`
`warn` | *`boolean`* | Write errors to `stderr` instead of throwing. Default is `false`
`overwrite` | *`boolean`* | Overwrite variables if they already exist. Used in all methods that call `set`. Default is `false`
---

### Methods
Name | Description
-----|------------
`get(key, opts?)` | Get a value from `process.env`. Will convert to native type if enabled
`set(key, val?, opts?)` | Set a value on `process.env`
`env(key, val?, opts?)` | Getter/setter. Proxies to `get` and `set` based on arguments signature
`loadFromArgv(opts?)` | Load variables from argv
`loadFromFiles(opts?)` | Load variables from files asynchronously
`loadFromFilesSync(opts?)` | Load variables from files synchronously
`loadFromVault(secret?, opts?)` | Load variables from a [vault](https://github.com/hashicorp/vault) secret asynchronously. Default timeout is `2.5 seconds`
`loadFromVaultSync(secret?, opts?)` | Load variables from a [vault](https://github.com/hashicorp/vault) secret synchronously. This method creates a network request using a synchronous worker thread which will block the main thread until complete. Default timeout is `2.5 seconds`
`resolve(opts?)` | Load variables asynchronously. Optionally load from argv and set helpers
`resolveSync(opts?)` | Load variables synchronously. Optionally load from argv and set helpers
`setHelpers(opts?)` | Set `NODE_ENV` and helper variables
---

## Environment Files
By default this package will attempt to load environment files in the following order:
1. `.env`
2. `config/.env`
3. `env.(js|json|cjs|mjs)`
4. `config/env.(js|json|cjs|mjs)`

*Note: If multiple files are found, they do not overwrite each other. This package respects the first value set for each key*

## Type Coercion
When values are set on `process.env` they are always converted to a string. This can make it awkward when using boolean values or other primitive types. When getting a variable using this package, it will attempt to convert the value back to it's native type if desired. This includes: `true`, `false`, `null`, `undefined`, `NaN`, and `number`.

## Escape Sequences
All escape sequences defined [here](https://mathiasbynens.be/notes/javascript-escapes) are supported, including unicode code points, unicode escapes, hexidecimal escapes, octal escapes, and single character escapes.

Just use regular escape code format for values with escape sequences: `\u{1d306}`, `\u2665`, `\xA5`, `\001`, `\n`, `\t`, etc.

## Variable Expansion
Bash-like variable expansion is supported in `.env` files. Just prefix a variable name with a `$` sign or wrap it in `${var}`. If you need to escape the `$` sign just use regular escape format like other sequences: `\$`.
```sh
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT
ESCAPED=\$ESCAPED
```

## Helper Options
There are a few helper options you can use to set `NODE_ENV` and parse variables from `argv`:
```js
import { setHelpers } from 'env';

await setHelpers({
    nodeEnv: 'development',
    helpers: ['DEVELOPMENT', 'PRODUCTION']
});
```
Or you can do it all at the same time with `resolve`:
```js
import { resolve } from 'env';

await resolve({
    setArgv: true
    setNodeEnv: true,
    ...opts
});
```
This will enable CLI arguments for setting environment variables when running your app:
```sh
node app --node-env=local --env=REDIS_HOST=127.0.0.1,REDIS_PORT=6379
```
The other helper variables are also added. They become boolean values which will be `true` if `NODE_ENV` matches their variable name, otherwise `false`.

## Comments
Start of line and end of line comments are supported:
```sh
# Redis config
HOST=127.0.0.1
PORT=6379
REDIS_URL=redis://$HOST:$PORT # Redis URL
```
If you want to use the `#` symbol in a string, just wrap the string in single or double quotes:
```sh
TEST="This #comment will be ignored"
```

## Load Additional Files
If you want to load variables from other files programatically you can use the `loadFromFiles` and `loadFromFilesSync` methods:
```js
import { loadFromFiles } from 'env';

await loadFromFiles({
    files: './config/production/.env'
});
```
*Note: Home character expansion (`~`) is also supported.*

## Load Variables from [Vault](https://github.com/hashicorp/vault)
This package also supports loading environment variables from vault. It will attempt to read the variables from a vault secret path, then parse the key/value pairs and set them in the environment. The vault api HTTP requests can be made asynchronously, or synchronously via a worker thread that has a default timeout of `2.5 seconds`.
```js
import { loadFromVault } from 'env';

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
If your app still uses `CJS` and/or doesn't support top level `await` and you need to load variables from vault synchronously, you can do that too:
```js
const { loadFromVaultSync } = require('env');

loadFromVaultSync('/env/app/prod');
```

## Examples
#### Get an environment variable
```js
env('NODE_ENV');
```

#### Set an environment variable
```js
env('NODE_ENV', 'development');
```

#### Set multiple environment variables
```js
env({
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379
});
```

#### Load extra environment files
```js
import { loadFromFiles } from 'env';

await loadFromFiles({
    files: './config/production/.env'
});
```

#### Load environment variables from vault
```sh
export VAULT_TOKEN="$TOKEN"
export VAULT_ADDR="https://vault.example.net"
```
```js
await loadFromVault('/env/app/prod');
```

#### ESM
If using ESM for your config, you can export env variables as a default export or named exports:
```js
export default {
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379
};
```
```js
export const REDIS_HOST = '127.0.0.1';
export const REDIS_PORT = 6379;
```
*Note: If both a default export and named exports are found, default export will take precedence*

#### Load env variables dynamically from vault based on config settings
If you use a [config](https://github.com/danmasta/config) library that supports loading `js` files, you can use this package to dynamically load environment variables based on your config settings:
```js
---
// config/local.js
import { loadFromVault } from 'env';

await loadFromVault('/env/app/local');

export default {
    ...
};
---
// config/development.js
import { loadFromVault } from 'env';

await loadFromVault('/env/app/dev');

export default {
    ...
};
---
// config/production.js
import { loadFromVault } from 'env';

await loadFromVault('/env/app/prod');

export default {
    ...
};
---
// app.js
import env from 'env';
import config from 'config';

app.listen(env('PORT'));
---
```

#### Check if environment is `development` using helper variable
```js
// true if NODE_ENV === 'development'
env('DEVELOPMENT');
```

#### Check if environment is `production` using helper variable
```js
// true if NODE_ENV === 'production'
env('PRODUCTION');
```

## Testing
Tests are currently run using mocha and chai. To execute tests run `make test`. To generate unit test coverage reports run `make coverage`

## Contact
If you have any questions feel free to get in touch
