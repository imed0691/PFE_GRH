
import fs from 'fs';
import path from 'path';

const srcDir = 'c:\\Users\\younes\\Downloads\\PFE_GRH-main\\PFE_GRH-main\\frontend\\src';
const enPath = path.join(srcDir, 'i18n', 'translations', 'en.js');

// Mock a way to evaluate the en.js file to get the object
const enFileContent = fs.readFileSync(enPath, 'utf-8');
const enObjectStr = enFileContent.replace('const en = ', '').replace('export default en;', '');
// This is a bit hacky but should work for a simple object
let en;
try {
    // Basic cleanup for eval-like parsing
    const cleanContent = enFileContent
        .replace(/import .*/g, '')
        .replace(/export default .*/g, '')
        .replace(/const en = /, 'return ');
    en = new Function(cleanContent)();
} catch (e) {
    console.error('Failed to parse en.js', e);
    process.exit(1);
}

function getFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, allFiles);
    } else if (name.endsWith('.jsx') || name.endsWith('.js')) {
      allFiles.push(name);
    }
  }
  return allFiles;
}

const files = getFiles(srcDir);
const missingKeys = new Set();

files.forEach(file => {
    if (file === enPath) return;
    const content = fs.readFileSync(file, 'utf-8');
    const regex = /t\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        
        const parts = key.split('.');
        let current = en;
        let found = true;
        for (const part of parts) {
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                found = false;
                break;
            }
        }
        if (!found) {
            missingKeys.add(key);
        }
    }
});

console.log(Array.from(missingKeys).sort().join('\n'));
