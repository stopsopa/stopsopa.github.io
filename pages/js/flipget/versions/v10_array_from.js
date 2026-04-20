const flipget = (function (c) {
    for (var i in c)
        c[c[i]] = i;
    return function (s) {
        return Array.from(s, char => c[char] || char).join('');
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
