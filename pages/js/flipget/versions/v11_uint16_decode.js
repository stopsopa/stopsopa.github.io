const flipget = (function (c) {
    const map = new Uint16Array(256);
    for (let i = 0; i < 256; i++) map[i] = i;
    for (var i in c) {
        map[i.charCodeAt(0)] = c[i].charCodeAt(0);
        map[c[i].charCodeAt(0)] = i.charCodeAt(0);
    }
    
    // Check if we are in Node or Browser for the most efficient decode
    const decode = typeof TextDecoder !== 'undefined' 
        ? (arr) => new TextDecoder('utf-16').decode(arr)
        : (arr) => Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString('utf16le');

    return function (s) {
        const len = s.length;
        const out = new Uint16Array(len);
        for (let i = 0; i < len; i++) {
            const code = s.charCodeAt(i);
            out[i] = code < 256 ? map[code] : code;
        }
        return decode(out);
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
