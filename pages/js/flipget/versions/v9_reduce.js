const flipget = (function (c) {
    for (var i in c)
        c[c[i]] = i;
    return function (s) {
        return s.split('').reduce((acc, char) => acc + (c[char] || char), '');
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
