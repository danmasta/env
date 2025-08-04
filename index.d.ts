interface Defaults {
    setArgv: boolean,
    argv: string | string[] | object,
    setNodeEnv: boolean,
    nodeEnv: string,
    helpers: string | string[],
    files: string | string[],
    dir: string,
    exts: string | string[],
    encoding: string | null,
    native: boolean,
    replace: boolean,
    def: string,
    secret: string,
    token: string,
    addr: string,
    timeout: number,
    silent: boolean,
    warn: boolean,
    overwrite: boolean
}

type Subset<T> = Partial<{
    [P in keyof T]: T[P] extends object ? Subset<T[P]> : T[P]
}>

type GetFn = {
    (key: string, opts?: { native?: boolean, string?: boolean }): string | number | boolean | null | undefined;
}

type SetFn = {
    (key: string | object, val?: unknown, opts?: Subset<Defaults>): unknown;
}

type EnvFn = {
    (key: string | object, val?: unknown, opts?: Subset<Defaults>): unknown;
}

type SetHelpersFn = {
    (opts?: Subset<Defaults>): void;
}

type LoadFromArgvFn = {
    (opts?: Subset<Defaults>): void;
}

type LoadFromFilesFn = {
    (opts?: Subset<Defaults>): Promise<void>;
}

type LoadFromFilesSyncFn = {
    (opts?: Subset<Defaults>): void;
}

type LoadFromVaultFn = {
    (secret?: string | object, opts?: Subset<Defaults>): Promise<void>;
}

type LoadFromVaultSyncFn = {
    (secret?: string | object, opts?: Subset<Defaults>): void;
}

type ResolveFn = {
    (opts?: Subset<Defaults>): Promise<void>;
}

type ResolveSyncFn = {
    (opts?: Subset<Defaults>): void;
}

type HandleErrorFn = {
    (err: Error, opts?: { silent?: boolean, warn?: boolean }): void;
}

type FactoryFn = {
    (opts?: Subset<Defaults>): Env;
}

declare class Env {
    constructor (opts?: Subset<Defaults>);
    opts: Defaults;
    get: GetFn;
    set: SetFn;
    env: EnvFn;
    setHelpers: SetHelpersFn;
    loadFromArgv: LoadFromArgvFn;
    loadFromFiles: LoadFromFilesFn;
    loadFromFilesSync: LoadFromFilesSyncFn;
    loadFromVault: LoadFromVaultFn;
    loadFromVaultSync: LoadFromVaultSyncFn;
    resolve: ResolveFn;
    resolveSync: ResolveSyncFn;
    handleError: HandleErrorFn;
    static get defaults (): Defaults;
    static factory (defs?: Subset<Defaults>): FactoryFn;
}

declare const env: EnvFn;
declare const get: GetFn;
declare const loadFromArgv: LoadFromArgvFn;
declare const loadFromFiles: LoadFromFilesFn;
declare const loadFromFilesSync: LoadFromFilesSyncFn;
declare const loadFromVault: LoadFromVaultFn;
declare const loadFromVaultSync: LoadFromVaultSyncFn;
declare const resolve: ResolveFn;
declare const resolveSync: ResolveSyncFn;
declare const set: SetFn;
declare const setHelpers: SetHelpersFn;

export {
    env as default,
    Env,
    env,
    get,
    loadFromArgv,
    loadFromFiles,
    loadFromFilesSync,
    loadFromVault,
    loadFromVaultSync,
    resolve,
    resolveSync,
    set,
    setHelpers
};
