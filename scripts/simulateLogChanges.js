const fs = require('fs/promises');
const path = require('path');

const logFileName = 'PostScriptum.log';
const logFilePath = path.resolve(process.cwd(), logFileName);
const linesToCopy = 10;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))



async function performAppendAndReset() {
    try {
        const originalStat = await fs.stat(logFilePath);
        const originalSize = originalStat.size;
        const originalContent = await fs.readFile(logFilePath, 'utf-8');

        if (originalSize === 0 || !originalContent.trim()) {
            return;
        }

        const allLines = originalContent.split('\n');
        const lastTenLines = allLines.slice(-linesToCopy);
        const contentToAppend = '\n' + lastTenLines.join('\n');

        await fs.appendFile(logFilePath, contentToAppend);
        await delay(1000);
        await fs.truncate(logFilePath, originalSize);
    } catch (error) {
        console.log(error)
    }
}

async function run() {
    await performAppendAndReset();
}

setInterval(() => {
    run();
}, 2500);