const fs = require('fs');
const path = require('path');

const locales = ['fr', 'en', 'ar'];
const translations = {};

locales.forEach(lang => {
  const content = fs.readFileSync(path.join(__dirname, `src/i18n/translations/${lang}.js`), 'utf8');
  // Simple regex to extract the object
  const match = content.match(/const \w+ = (\{[\s\S]+\});/);
  if (match) {
    try {
      // Use eval because it's a JS object not JSON
      translations[lang] = eval(`(${match[1]})`);
    } catch (e) {
      console.error(`Error parsing ${lang}.js`, e);
    }
  }
});

function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

const existingKeys = translations.fr ? getKeys(translations.fr) : [];

const jsxFiles = [];
function getFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') getFiles(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      jsxFiles.push(fullPath);
    }
  });
}

getFiles(path.join(__dirname, 'src'));

const missingKeys = new Set();
const foundKeys = new Set();

jsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/t\(['"]([^'"]+)['"]\)/g);
  for (const match of matches) {
    const key = match[1];
    foundKeys.add(key);
    if (!existingKeys.includes(key) && !key.includes('`') && !key.includes('${')) {
      missingKeys.add(key);
    }
  }
});

console.log('--- MISSING KEYS ---');
Array.from(missingKeys).sort().forEach(k => console.log(k));

console.log('\n--- KEYS WITH DYNAMIC CONTENT (Potentially problematic) ---');
jsxFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/t\(`([^`]+)`\)/g);
  for (const match of matches) {
    console.log(`${path.basename(file)}: t(\`${match[1]}\`)`);
  }
});
