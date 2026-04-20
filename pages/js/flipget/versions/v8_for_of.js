const flipget = (function (c) {
    for (var i in c)
        c[c[i]] = i;
    return function (s) {
        let r = '';
        for (const char of s) {
            r += c[char] || char;
        }
        return r;
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
