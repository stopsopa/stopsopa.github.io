const flipget = (function (c) {
    for (const i in c) {
        c[c[i]] = i;
    }
    
    const charMap = new Array(256);
    for (let i = 0; i < 256; i++) {
        charMap[i] = String.fromCharCode(i);
    }
    for (const char in c) {
        charMap[char.charCodeAt(0)] = c[char];
    }
    
    return function (s) {
        let result = '';
        for (let i = 0, len = s.length; i < len; ++i) {
            const code = s.charCodeAt(i);
            if (code < 256) {
                result += charMap[code];
            } else {
                result += s[i];
            }
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
