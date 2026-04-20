# Flipget Benchmark

1. **Add versions**: Put ES Module files in `versions/` (e.g., `v2.js`). Must `export default` the function.
2. **Customize**: Edit `data.js` to change test string and iteration count.
3. **Run Backend**: `node run.js` (Benchmarks in Node & generates `versions.json`).
4. **Run Frontend**: Open `test.html` in browser via local server (Reads `versions.json` & benchmarks in browser).


```

cd pages/js/flipget
node run.js

```

or

https://stopsopa.github.io.local:4339/pages/js/flipget/test.html