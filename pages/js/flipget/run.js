import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runBenchmark } from './benchmark-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionsDir = path.join(__dirname, 'versions');
const files = fs.readdirSync(versionsDir).filter(f => f.endsWith('.js'));

process.env.NO_COLOR = '1';

fs.writeFileSync(path.join(__dirname, 'versions.json'), JSON.stringify(files, null, 2));

let logBuffer = '';
const originalWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, encoding, callback) => {
    logBuffer += chunk.toString();
    return originalWrite(chunk, encoding, callback);
};

async function run() {
    console.log(`Starting benchmark... Versions found: ${files.length}\n`);

    const results = [];
    for (const file of files) {
        const modulePath = `file://${path.join(versionsDir, file)}`;
        const { default: flipget } = await import(modulePath);
        
        const result = await runBenchmark(
            file, 
            flipget, 
            (msg) => process.stdout.write(msg + '\n'),
            () => process.memoryUsage().heapUsed
        );
        results.push(result);
    }
    console.log('Done.\n');
    
    results.sort((a, b) => a.time - b.time);
    
    const tableData = results.map(r => ({
        'Script Name': r.name,
        'Time (ms)': r.time.toFixed(2),
        'Memory Diff (MB)': r.memory !== null ? (r.memory / 1024 / 1024).toFixed(2) : 'N/A',
        'Pass': r.pass ? '✅' : '❌'
    }));
    
    console.table(tableData);
    
    // Capture only the table part for the report
    const tableBuffer = logBuffer.substring(logBuffer.lastIndexOf('┌'));

    fs.writeFileSync(path.join(__dirname, 'server.log'), logBuffer);
    fs.writeFileSync(path.join(__dirname, 'server-report.txt'), tableBuffer);
    console.log(`\nFull log saved to server.log`);
    console.log(`Report saved to server-report.txt`);
}

try {
    await run();
} catch (e) {
    console.error(e);
}

