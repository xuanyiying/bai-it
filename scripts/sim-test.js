// Simulate vocab annotation on sample tweets
const dict = require('../data/dict-ecdict.json');
const freq = new Set(require('../data/word-frequency.json').map(w => w.toLowerCase()));
const ai = require('../data/industry-ai.json');

function stems(word) {
  const w = word.toLowerCase();
  const candidates = [w];
  if (w.endsWith('s')) candidates.push(w.slice(0, -1));
  if (w.endsWith('es')) candidates.push(w.slice(0, -2));
  if (w.endsWith('ed')) candidates.push(w.slice(0, -2));
  if (w.endsWith('ing')) { candidates.push(w.slice(0, -3)); candidates.push(w.slice(0, -3) + 'e'); }
  if (w.endsWith('ly')) candidates.push(w.slice(0, -2));
  if (w.endsWith('er')) candidates.push(w.slice(0, -2));
  if (w.endsWith('est')) candidates.push(w.slice(0, -3));
  if (w.endsWith('tion')) candidates.push(w.slice(0, -4) + 'te');
  if (w.endsWith('ment')) candidates.push(w.slice(0, -4));
  if (w.endsWith('ness')) candidates.push(w.slice(0, -4));
  return candidates;
}

function lookup(word) {
  const w = word.toLowerCase();
  if (freq.has(w)) return null;
  const cands = stems(w);
  for (const c of cands) {
    if (ai[c]) return 'AI: ' + ai[c];
    if (dict[c]) return dict[c];
  }
  return null;
}

const tweets = [
  'The proliferation of agentic AI systems is fundamentally reshaping enterprise workflows and necessitating unprecedented governance frameworks',
  'Investors remain skeptical about the viability of autonomous vehicles despite substantial improvements in LiDAR technology',
  'The geopolitical ramifications of semiconductor export controls continue to reverberate across global supply chains',
  'Critics lambaste the administration for its lackluster response to escalating cybersecurity threats',
  'The juxtaposition of opulence and destitution in metropolitan areas epitomizes systemic inequality',
  'Pundits speculate that the forthcoming legislation will exacerbate tensions between privacy advocates and surveillance proponents',
  'The burgeoning cryptocurrency ecosystem faces scrutiny from regulators concerned about volatility and fraud',
  'Anthropological research corroborates the hypothesis that collective resilience stems from communal solidarity',
  'The entrepreneur leveraged cutting-edge biotechnology to disrupt the pharmaceutical industry paradigm',
  'Whistleblowers allege pervasive malfeasance within the conglomerate despite ostensible compliance protocols'
];

let totalAnnotated = 0;
tweets.forEach((t, i) => {
  const words = t.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 2);
  const annotated = words.filter(w => lookup(w));
  totalAnnotated += annotated.length;
  console.log(`Tweet ${i+1}: ${annotated.length}/${words.length} annotated: ${annotated.join(', ')}`);
});
console.log(`\nTotal: ${totalAnnotated} words annotated across ${tweets.length} tweets (avg ${(totalAnnotated/tweets.length).toFixed(1)}/tweet)`);
console.log(`Dict size: ${Object.keys(dict).length}`);
console.log(`AI pack size: ${Object.keys(ai).length}`);
