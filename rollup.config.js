import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

export default [
    {
        input: [
            'index.cjs',
            'lib/constants.js',
            'lib/env.js',
            'lib/util.js',
            'lib/vault-worker.js',
            'lib/vault.js'
        ],
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            sourcemap: false,
            strict: false,
            preserveModules: true,
            exports: 'auto',
            entryFileNames: '[name].[format]',
            esModule: false
        },
        plugins: [
            resolve(),
            replace({
                'vault-worker.js': 'vault-worker.cjs'
            })
        ],
        external: [
            '@danmasta/lo',
            '@danmasta/lo/errors'
        ]
    }
];
