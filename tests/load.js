describe('load', () => {

    it('should load env variables from file path', () => {

        let env = new Env({
            files: path.resolve(__dirname, './.env.env')
        });

        env.resolve();

        expect(env.get('ENV_TEST_LOAD_FILE')).to.equal('test');

    });

    it.skip('should load env variables from vault', () => {
        env.loadFromVault();
    });

});
