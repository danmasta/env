describe('Helpers', () => {

    it('should set helper vars', async () => {
        env.setHelpers({
            nodeEnv: 'development',
            helpers: ['TEST']
        });
        expect(env.get('NODE_ENV')).to.exist;
        expect(env.get('TEST')).to.be.true;
    });

});
