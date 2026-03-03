// Merge all dictionary batches with existing dictionary
const fs = require('fs');
const path = require('path');

const existing = require('../data/dict-ecdict.json');
const batch1 = require('./dict-batch1.js');
const batch2 = require('./dict-batch2.js');
const batch3 = require('./dict-batch3.js');
const batch4 = require('./dict-batch4.js');
const batch5 = require('./dict-batch5.js');
const batch6 = require('./dict-batch6.js');
const batch7 = require('./dict-batch7.js');
const batch8 = require('./dict-batch8.js');
const batch9 = require('./dict-batch9.js');
const batch10 = require('./dict-batch10.js');
const batch11 = require('./dict-batch11.js');
const batch12 = require('./dict-batch12.js');
const batch13 = require('./dict-batch13.js');
const batch14 = require('./dict-batch14.js');
const batch15 = require('./dict-batch15.js');
const batch16 = require('./dict-batch16.js');
const batch17 = require('./dict-batch17.js');
const batch18 = require('./dict-batch18.js');
const batch19 = require('./dict-batch19.js');
const batch20 = require('./dict-batch20.js');
const batch21 = require('./dict-batch21.js');
const batch22 = require('./dict-batch22.js');
const batch23 = require('./dict-batch23.js');
const batch24 = require('./dict-batch24.js');
const batch25 = require('./dict-batch25.js');
const batch26 = require('./dict-batch26.js');

// Load frequency list for exclusion
const freq = new Set(require('../data/word-frequency.json').map(w => w.toLowerCase()));

// Merge all batches (later batches override earlier for same key)
const merged = { ...existing, ...batch1, ...batch2, ...batch3, ...batch4, ...batch5, ...batch6, ...batch7, ...batch8, ...batch9, ...batch10, ...batch11, ...batch12, ...batch13, ...batch14, ...batch15, ...batch16, ...batch17, ...batch18, ...batch19, ...batch20, ...batch21, ...batch22, ...batch23, ...batch24, ...batch25, ...batch26 };

// Remove words that are in the 5000 common word frequency list
// BUT keep words that have AI dual meanings (contain "|AI:")
const cleaned = {};
let removed = 0;
for (const [key, val] of Object.entries(merged)) {
  const lower = key.toLowerCase();
  if (freq.has(lower) && !val.includes('|AI:') && !val.includes('｜AI:')) {
    removed++;
    continue;
  }
  cleaned[lower] = val; // normalize to lowercase
}

// Sort alphabetically
const sorted = {};
for (const key of Object.keys(cleaned).sort()) {
  sorted[key] = cleaned[key];
}

// Write output
const outPath = path.join(__dirname, '..', 'data', 'dict-ecdict.json');
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n');

console.log(`Merged: ${Object.keys(sorted).length} entries`);
console.log(`Removed (in freq list): ${removed}`);

// Verify no overlap with freq list (except AI dual-meaning)
const overlap = Object.keys(sorted).filter(w => freq.has(w) && !sorted[w].includes('|AI:') && !sorted[w].includes('｜AI:'));
console.log(`Remaining overlap: ${overlap.length}`);
if (overlap.length > 0) console.log('  ', overlap.slice(0, 20).join(', '));

// Verify JSON is valid
try {
  JSON.parse(fs.readFileSync(outPath, 'utf8'));
  console.log('JSON: valid');
} catch (e) {
  console.log('JSON: INVALID -', e.message);
}
