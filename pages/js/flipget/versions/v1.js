const flipget = (function (w, c) {
    for (var i in c)
        c[c[i]] = i;
    return function (s) {
        s = s.split('');
        for (var i = 0, l = s.length ; i < l ; ++i )
            if (c[s[i]]) s[i] = c[s[i]];
        return s.join('');
    };
})(null, {
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
