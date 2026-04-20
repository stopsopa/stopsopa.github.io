const flipget = (function (c) {
    for (const i in c) {
        c[c[i]] = i;
    }
    
    return function (s) {
        return s.split('').map(char => c[char] || char).join('');
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
