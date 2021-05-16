describe('load', () => {

    it('should load env variables from file path', () => {

        env.loadFromFile(envFilePath);

        expect(env.get('NODE_ENV')).to.equal('test');
        expect(env.get('TEST_HOST')).to.equal('127.0.0.1');
        expect(env.get('TEST_PORT')).to.equal(6379);

    });

    it.skip('should load env variables from vault', () => {
        env.loadFromVault();
    });

});
