describe('helpers', () => {

    it('should set helper vars', () => {

        let env = new Env({ setHelpers: true, setNodeEnv: true });

        expect(env.get('NODE_ENV')).to.exist;
        expect(env.get('DEVELOPMENT')).to.exist;
        expect(env.get('PRODUCTION')).to.exist;

    });

});
