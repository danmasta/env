# Env
Environment variable helper for node apps

Features:
* Easy to use
* Load `.js`, `.json`, or `.env` files
* [Type coercion](#type-coercion) for primitive types

## About
We needed a better way to interact with environment variables in node apps. This package aims to simplify the process while maintaining `process.env` as the source of truth. It can also coerce values to native types so you don't have to do things like `process.env.DEBUG === 'true'`

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

## Config Files
This package will attempt to load environment config files in the following order:
1. `./.env`
2. `./env.(js|json)`
3. `./config/env.(js|json)`

*If multiple files are found, they do not overwrite each other. This package will respect the first value set for each key*

## Type Coercion
When values are set on `process.env`, by default they are always converted to a string. This makes it awkward when using boolean values or other primitive types. When getting a variable using this package, it will be converted back to it's native type if possible. This includes: `true`, `false`, `null`, `undefined`, `NaN`, and `number`.

## Examples
#### Set a single value
```javascript
env('NODE_ENV', 'development');
```

#### Get a value
```javascript
env('NODE_ENV'); // 'development'
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
env('DEV'); // true if NODE_ENV = 'development' or undefined
```

## Contact
If you have any questions feel free to get in touch :

Name | Role | Email
-----|------|------
Daniel Smith | Engineer | dannmasta@gmail.com
