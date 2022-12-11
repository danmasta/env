export interface EnvDefaults {
    nativeType: boolean;
    setNodeEnv: boolean;
    setHelpers: boolean;
    filePaths: string | Array<string>;
    enableArgv: boolean;
    encoding: string | null;
    timeout: number;
    replaceMissing: boolean;
    default: string;
    vault: {
        secret: string;
        token: string;
        addr: string;
    }
}

export interface EnvConstants {
    TYPES: {
        true: boolean,
        false: boolean,
        null: null,
        undefined: undefined,
        NaN: number
    },
    SPECIAL_CHARS: {
        'b': string,
        'f': string,
        'n': string,
        'r': string,
        't': string,
        'v': string,
        '0': string,
        '\'': string,
        '"': string,
        '\\': string,
        '$': string
    },
    REGEX: {
        newline: RegExp,
        envfile: RegExp,
        args: RegExp,
        quotes: RegExp,
        unescape: RegExp
    }
}

type Subset<T> = Partial<{
    [P in keyof T]: T[P] extends object ? Subset<T[P]> : T[P]
}>;

type GetFn = {
    (key: string): string | number | boolean | null | undefined;
}

type SetFn = {
    (key: string | object, val?: any, args?: object | undefined): any;
}

type EnvFn = {
    (key: string | object, val?: any): any;
}

type LoadFromFileFn = {
    (file: string): object;
}

type LoadFromVaultFn = {
    (secret?: string, token?: string, addr?: string): void;
}

type ExportsFn = EnvFn & {
    get: GetFn;
    set: SetFn;
    env: EnvFn;
    Env: typeof Env;
    loadFromFile: LoadFromFileFn;
    loadFromVault: LoadFromVaultFn;
}

type FactoryFn = {
    (opts?: Subset<EnvDefaults>): Env;
}

export class Env {
    constructor (opts?: Subset<EnvDefaults>);
    _opts: EnvDefaults;
    get: GetFn;
    set: SetFn;
    env: EnvFn;
    expandVariables (str: string, vars?: object): string;
    parseEnvStr (str: string, expand?: boolean): object;
    loadFromFile: LoadFromFileFn;
    loadFromVault: LoadFromVaultFn;
    public get exports (): ExportsFn;
    static defaults: EnvDefaults;
    static constants: EnvConstants;
    static factory (...args: any[]): FactoryFn;
}

export const get: GetFn;
export const set: SetFn;
export const env: EnvFn;
export const loadFromFile: LoadFromFileFn;
export const loadFromVault: LoadFromVaultFn;

declare const _env: Env;
export default _env.exports;
