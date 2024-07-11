interface Defaults {
    enableArgv: boolean,
    nativeType: boolean,
    setNodeEnv: boolean,
    helpers: string|string[],
    files: string|string[],
    dir: string,
    encoding: string|null,
    timeout: number,
    replace: boolean,
    default: string,
    defaultNodeEnv: string,
    secret: string,
    token: string,
    addr: string,
    warn: boolean,
    throw: boolean,
    exts: string|string[]
}

type Subset<T> = Partial<{
    [P in keyof T]: T[P] extends object ? Subset<T[P]> : T[P]
}>

type GetFn = {
    (key: string): string|number|boolean|null|undefined;
}

type SetFn = {
    (key: string|object, val?: unknown, args?: object): unknown;
}

type EnvFn = {
    (key: string|object, val?: unknown): unknown;
}

type LoadFromVaultFn = {
    (secret?: string, token?: string, addr?: string): Promise<void>;
}

type LoadFromVaultSyncFn = {
    (secret?: string, token?: string, addr?: string): void;
}

type ExportsFn = EnvFn & {
    get: GetFn;
    set: SetFn;
    env: ExportsFn;
    Env: typeof Env;
    loadFromVault: LoadFromVaultFn;
    loadFromVaultSync: LoadFromVaultSyncFn;
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
    setHelpers (): void;
    resolve (): Promise<ExportsFn>;
    resolveSync (): ExportsFn;
    loadFromVault: LoadFromVaultFn;
    loadFromVaultSync: LoadFromVaultSyncFn;
    handleError (err: Error): void;
    public get exports (): ExportsFn;
    static get defaults (): Defaults;
    static factory (): FactoryFn;
}

export const {
    get,
    set,
    env,
    loadFromVault,
    loadFromVaultSync
}: Awaited<Promise<ExportsFn>>;

export {
    env as default,
    Env
};
