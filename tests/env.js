describe('env', () => {

    it('should get env variables', () => {

        env.load(envfile);

        expect(env('NODE_ENV')).to.equal('development');
        expect(env('TEST_HOST')).to.equal('127.0.0.1');
        expect(env('DEVELOPMENT')).to.be.true;
        expect(env('PRODUCTION')).to.be.false;

    });

    it('should set env variables that are not set', () => {

        env.load(envfile);

        env('NODE_ENV', 'production');
        env('NODE_TEST1', 1);
        env({ 'NODE_TEST2': 2, 'NODE_TEST3': 3 });
        expect(env('NODE_ENV')).to.equal('development');
        expect(env('NODE_TEST1')).to.equal(1);
        expect(env('NODE_TEST2')).to.equal(2);
        expect(env('NODE_TEST3')).to.equal(3);

    });

    it('should coerce to native types', () => {

        env.load(envfile);

        expect(env('TRUE')).to.be.true;
        expect(env('FALSE')).to.be.false;
        expect(env('NULL')).to.be.null;
        expect(env('UNDEFINED')).to.be.undefined;
        expect(env('NAN')).to.be.NaN;
        expect(env('NUMBER')).to.be.a('number');

    });

});
