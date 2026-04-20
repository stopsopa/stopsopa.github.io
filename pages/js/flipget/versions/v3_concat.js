const flipget = (function (c) {
    for (const i in c) {
        c[c[i]] = i;
    }
    
    return function (s) {
        let result = '';
        for (let i = 0, len = s.length; i < len; ++i) {
            const char = s[i];
            result += c[char] || char;
        }
        return result;
    };
})({
    ' ' : '.',
    '"' : '!',
    ':' : '-',
    '{' : '(',
    '}' : ")",
    '?' : "_",
    '&' : "~",
    ',' : "*"
});

export default flipget;
