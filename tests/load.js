describe('Load', () => {

    it('should load env variables from file path', async () => {
        let env = new Env({
            files: './tests/.env-test'
        });
        await env.resolve();
        expect(env.get('ENV_TEST_LOAD_FILE')).to.equal('test');
    });

    it('should load env files synchronously', () => {
        let env = new Env({
            files: './tests/.env-sync'
        });
        env.resolveSync();
        expect(env.get('ENV_TEST_LOAD_FILE_SYNC')).to.equal('test');
    });

    it.skip('should load env variables from vault', () => {
        env.loadFromVault();
    });

});
