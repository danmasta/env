import { parse } from '../lib/util.js';

describe('Util', () => {

    it('should parse env values from strings', () => {

        let res = parse(envstr);

        // Generic
        expect(res.NODE_ENV).to.equal('test');
        expect(res.TEST_HOST).to.equal('127.0.0.1');
        expect(res.TEST_PORT).to.equal('6379');
        expect(res.PATH).to.equal(process.env.PATH);
        expect(res.TRUE).to.equal('true');
        expect(res.FALSE).to.equal('false');
        expect(res.NULL).to.equal('null');
        expect(res.UNDEFINED).to.equal('undefined');
        expect(res.NAN).to.equal('NaN');

        // Numbers
        expect(res.NUMBER).to.equal('9000');

        // Strings
        expect(res.STRING1).to.equal('string');
        expect(res.STRING2).to.equal('string with spaces');
        expect(res.STRING3).to.equal('string with double quotes');
        expect(res.STRING4).to.equal('string with single quotes');

        // Whitespace
        expect(res.SPACE1).to.equal('test');
        expect(res.SPACE2).to.equal('test');
        expect(res.SPACE3).to.equal('test');
        expect(res.SPACE4).to.equal('test ');
        expect(res.SPACE5).to.equal('test');
        expect(res.SPACE6).to.equal('test\n');
        expect(res.SPACE7).to.equal('test');
        expect(res.SPACE8).to.equal('test');
        expect(res.SPACE9).to.equal('test ');
        expect(res.SPACE10).to.equal(' test ');

        // Expansion
        expect(res.TEST_URL1).to.equal('redis://127.0.0.1:6379');
        expect(res.TEST_URL2).to.equal('redis://127.0.0.1:6379');
        expect(res.TEST_URL3).to.equal('redis://127.0.0.1:6379');
        expect(res.TEST_URL4).to.equal('redis://127.0.0.1:6379');

        // Escapes
        expect(res.ESCAPED1).to.equal('$ESCAPED');
        expect(res.ESCAPED2).to.equal('Copyright \u00A9');
        expect(res.ESCAPED3).to.equal('p@$$w%r^D');
        expect(res.ESCAPED4).to.equal('p@$$@#w%r^D');
        expect(res.ESCAPED5).to.equal('test$test');
        expect(res.ESCAPED6).to.equal('test');
        expect(res.ESCAPED7).to.equal('test\test');
        expect(res.ESCAPED8).to.equal('\u{1d306}');
        expect(res.ESCAPED9).to.equal('\u2665');
        expect(res.ESCAPED10).to.equal('\xA5');
        // Need to test octal escapes with hex
        expect(res.ESCAPED11).to.equal('\x01');
        expect(res.ESCAPED12).to.equal('\x01');
        expect(res.ESCAPED13).to.equal('\x01');
        expect(res.ESCAPED14).to.equal('\b');
        expect(res.ESCAPED15).to.equal('\t');
        expect(res.ESCAPED16).to.equal('\0');

        // Comments
        expect(res.COMMENT1).to.equal('test');
        expect(res.COMMENT2).to.equal('test #comment');
        expect(res.COMMENT3).to.equal('test #comment');
        expect(res.COMMENT4).to.equal('test #comment');
        expect(res.COMMENT5).to.equal('test#test');
        expect(res.COMMENT6).to.equal('test ');

        // Misc
        expect(res.WINDOWS_PATH).to.equal('C:\\Windows\\system32');
        expect(res.NEWLINE).to.equal('Some\nValue');
        expect(res.ESCAPED_UNICODE).to.equal('Copyright \\u00A9');
        expect(res.WINDOWS_PATH_SPECIAL).to.equal('C:\\special\\chars\\b\\n\\t');

        // Multiline
        expect(res.MULTILINE1).to.equal('-----BEGIN PRIVATE KEY-----\n0000000000000000000000000000000000000000000000000000000000000000\n1111111111111111111111111111111111111111111111111111111111111111\n0000000000000000000000000000000000000000000000000000000000000000\n-----END PRIVATE KEY-----');
        expect(res.MULTILINE2).to.equal('-----BEGIN PRIVATE KEY-----\n0000000000000000000000000000000000000000000000000000000000000000\n1111111111111111111111111111111111111111111111111111111111111111\n0000000000000000000000000000000000000000000000000000000000000000\n-----END PRIVATE KEY-----');
        expect(res.TEST_END).to.equal('end');

        // Count
        expect(Object.keys(res).length).to.equal(59);

    });

});
