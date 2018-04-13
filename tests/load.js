describe('load', () => {

    it('should load env variables from file path', () => {

        env.load(envfile);

        expect(env('NODE_ENV')).to.equal('development');
        expect(env('TEST_HOST')).to.equal('127.0.0.1');
        expect(env('TEST_PORT')).to.equal(6379);

    });

});
