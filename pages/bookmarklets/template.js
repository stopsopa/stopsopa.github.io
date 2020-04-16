
const path          = require('path');

const fs            = require('fs');

const log           = require('inspc');

const inpufile      = path.resolve(__dirname, 'index.tmp.html');

const output        = path.resolve(__dirname, 'index.html');

if ( ! fs.existsSync(inpufile) ) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    throw new Error(`file '${inpufile}' doesn't exist`);
}

if ( fs.existsSync(output) ) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

    fs.unlinkSync(output);
}

const content = fs.readFileSync(inpufile, 'utf8').toString();

const data = content.replace(/<%\s*(.*?)\s*%>/g, (all, center) => {

    const file = path.resolve(__dirname, `${center}.min.js`);

    if ( ! fs.existsSync(file) ) { // warning: if under dirfile there will be broken link (pointing to something nonexisting) then this function will return false even if link DO EXIST but it's broken

        throw new Error(`file '${file}' doesn't exist`);
    }

    const data = fs.readFileSync(file, 'utf8').toString();

    if (data.includes("'")) {

        throw new Error(`file '${file}' containe "'" character`);
    }

    return data.replace(/"/g, "'");
});

fs.writeFileSync(output, data);

console.log(`

        OK: file '${output}' generated

`);


