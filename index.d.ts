interface EnvDefaults {
    nativeType: boolean,
    setNodeEnv: boolean,
    helpers: boolean,
    files: string|string[],
    dir: string,
    enableArgv: boolean,
    encoding: string|null,
    timeout: number,
    replaceMissing: boolean,
    default: string,
    vault: {
        secret: string,
        token: string,
        addr: string,
    },
    warn: boolean,
    throw: boolean
}

interface ParserDefaults {
    replaceMissing: boolean,
    default: string
}

interface FileResolverDefaults {
    encoding: string,
    dir: string,
    files: string|string[]
}

interface EnvConstants {
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
        envext: RegExp,
        args: RegExp,
        quotes: RegExp,
        unescape: RegExp
    }
}

type Subset<T> = Partial<{
    [P in keyof T]: T[P] extends object ? Subset<T[P]> : T[P]
}>

type GetFn = {
    (key: string): string|number|boolean|null|undefined;
}

type SetFn = {
    (key: string|object, val?: unknown, args?: object|undefined): unknown;
}

type EnvFn = {
    (key: string|object, val?: unknown): unknown;
}

type LoadFromVaultFn = {
    (secret?: string, token?: string, addr?: string): void;
}

type ExportsFn = EnvFn & {
    default: ExportsFn;
    get: GetFn;
    set: SetFn;
    env: ExportsFn;
    Env: typeof Env;
    loadFromVault: LoadFromVaultFn;
}

type FactoryFn = {
    (opts?: Subset<EnvDefaults>): Env;
}

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6918081f66a51df9eab940d9b690d627467c4401/types/node/process.d.ts#L138
interface ProcessEnv extends Dict<string>{

}

declare class Parser {
    constructor (opts?: Subset<ParserDefaults>);
    opts: ParserDefaults;
    expandVariables (str: string, vars?: object): string;
    parse (str: string, expand?: boolean): object;
}

declare class FileResolver {
    constructor (opts?: Subset<FileResolverDefaults>);
    opts: FileResolverDefaults;
    refresh (opts?: object): void;
    resolvePath (str: string): string;
    resolvePathIfExists (str: string): string;
    requireImportOrRead (str: str): Promise<object|string>|object|string;
    resolveConditional (async?: boolean): Promise<Array<object>>|Array<object>;
    resolve (): Array<object>;
    resolveAsync (): Promise<Array<object>>;
    getFileList (): object[];
    formatSettledFiles (arr: object[]): Array<object>;
}

export class Env {
    constructor (opts?: Subset<EnvDefaults>);
    opts: EnvDefaults;
    parser: Parser;
    resolver: FileResolver;
    get: GetFn;
    set: SetFn;
    env: EnvFn;
    resolveConditional (async?: boolean): Promise<ProcessEnv>|ProcessEnv;
    resolve (): ProcessEnv;
    resolveAsync (): Promise<ProcessEnv>;
    loadFromVault: LoadFromVaultFn;
    handleError (err: Error): void;
    public get exports (): ExportsFn;
    static get defaults(): EnvDefaults;
    static get constants(): EnvConstants;
    static factory (...args: unknown[]): FactoryFn;
}

export const get: GetFn;
export const set: SetFn;
export const env: ExportsFn;
export const loadFromVault: LoadFromVaultFn;

declare const mod: Env;

export default mod.exports.default;
