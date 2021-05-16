describe('env', () => {

    it('should get env variables', () => {

        env.loadFromFile(envFilePath);

        expect(env.get('NODE_ENV')).to.equal('test');
        expect(env.get('TEST_HOST')).to.equal('127.0.0.1');

    });

    it('should set env variables that are not set', () => {

        env.loadFromFile(envFilePath);

        env.set('NODE_ENV', 'development');
        env.set('NODE_TEST1', 1);
        env.env({ 'NODE_TEST2': 2, 'NODE_TEST3': 3 });

        expect(env.get('NODE_ENV')).to.equal('test');
        expect(env.get('NODE_TEST1')).to.equal(1);
        expect(env.get('NODE_TEST2')).to.equal(2);
        expect(env.get('NODE_TEST3')).to.equal(3);

    });

    it('should coerce to native types', () => {

        env.loadFromFile(envFilePath);

        expect(env.get('TRUE')).to.be.true;
        expect(env.get('FALSE')).to.be.false;
        expect(env.get('NULL')).to.be.null;
        expect(env.get('UNDEFINED')).to.be.undefined;
        expect(env.get('NAN')).to.be.NaN;
        expect(env.get('NUMBER')).to.be.a('number');

    });

});
