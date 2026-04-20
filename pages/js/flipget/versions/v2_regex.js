const flipget = (function (c) {
    for (const i in c) {
        c[c[i]] = i;
    }
    
    const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(Object.keys(c).map(escapeRegex).join('|'), 'g');

    return function (s) {
        return s.replace(regex, (match) => c[match]);
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
