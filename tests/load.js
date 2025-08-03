describe('Load', () => {

    it('should load variables from argv', () => {
        env.loadFromArgv({
            argv: '--node-env development --env ARGV1=1,ARGV2=true',
            overwrite: true
        });
        expect(env.get('ARGV1')).to.equal(1);
        expect(env.get('ARGV2')).to.equal(true);
        expect(env.get('NODE_ENV')).to.equal('development');
        env.set('NODE_ENV', 'test', { overwrite: true });
    });

    it('should load variables from file paths', async () => {
        await env.loadFromFiles({
            files: './tests/.env-test'
        });
        expect(env.get('ENV_TEST_LOAD_FILE')).to.equal('test');
    });

    it('should load variables from file paths synchronously', () => {
        env.loadFromFilesSync({
            files: './tests/.env-sync'
        });
        expect(env.get('ENV_TEST_LOAD_FILE_SYNC')).to.equal('test');
    });

    it.skip('should load variables from vault', async () => {
        await env.loadFromVault();
    });

});
