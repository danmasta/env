declare function env (key: string | object, val?: any, args?: object): string | object | undefined;

declare namespace env {

    export interface EnvOptions {
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

    type Subset<K> = {
        [attr in keyof K]?: K[attr] extends object ? Subset<K[attr]> : K[attr];
    };

    export class Env {
        constructor (opts?: Subset<EnvOptions>);
        public opts: EnvOptions;
        get (key: string): string | number | boolean | null | undefined;
        set (key: string | object, val?: string | undefined, args?: object | undefined): object;
        env (key: string | object, val?: any, args?: object): string | number | boolean | null | undefined;
        expandVariables (str: string, vars?: object): string;
        parseEnvStr (str: string, expand?: boolean): object;
        loadFromFile (file: string): object;
        loadFromVault (secret?: string, token?: string, addr?: string): void;
        public get exports(): function;
        static defaults: object;
        static constants: object;
        static factory (): function;
    }

    export function get (key: string): string | number | boolean | null | undefined;
    export function set (key: string | object, val?: string | undefined, args?: object | undefined): object;
    export function loadFromFile (file: string): object;
    export function loadFromVault (secret?: string, token?: string, addr?: string): void;
    export function env (key: string | object, val?: any, args?: object): string | number | boolean | null | undefined;

}

export = env;
