describe('Helpers', () => {

    it('should set helper vars', async () => {
        let env = new Env({ helpers: ['TEST'], setNodeEnv: true });
        await env.resolve();
        expect(env.get('NODE_ENV')).to.exist;
        expect(env.get('TEST')).to.be.true;
    });

});
