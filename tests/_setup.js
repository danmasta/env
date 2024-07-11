import { assert, expect, should } from 'chai';
import { readFile } from 'node:fs/promises';
import Env from '../lib/env.js';

const envstr = await readFile('./tests/.env', 'utf8');
const env = new Env({
    files: './tests/.env'
});

await env.resolve();

beforeEach(() => {
    global.assert = assert;
    global.expect = expect;
    global.should = should();
    global.Env = Env;
    global.env = env;
    global.envstr = envstr;
});
