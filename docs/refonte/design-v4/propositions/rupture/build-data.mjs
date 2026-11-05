// Lit les JSON du site et écrit data.js (window.STT) pour les prototypes en file://.
// Usage : node build-data.mjs
// La couche « carte » (positions, liens lieu -> sortie, créneaux de la journée) est écrite ici
// à la main, mais chaque lien et chaque horaire porte une citation qui doit exister telle quelle
// dans le JSON du produit : sinon le script s'arrête.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, '../../../../..');
const data = (p) => JSON.parse(fs.readFileSync(path.join(repo, 'src/_data', p), 'utf8'));

const site = data('site.json');
const photos = data('photos-v3.json').photos;

const pick = (j, keys) => Object.fromEntries(keys.filter((k) => j[k] !== undefined).map((k) => [k, j[k]]));
const productKeys = ['slug', 'url', 'name', 'h1', 'lead', 'promise', 'facts', 'price', 'priceOnRequest', 'options', 'day', 'included', 'notIncluded', 'beforeYouBook', 'faq', 'refPrefix'];

const products = {};
for (const group of ['tours', 'activities']) {
  for (const f of fs.readdirSync(path.join(repo, 'src/_data/products', group)).sort()) {
    const j = data(`products/${group}/${f}`);
    products[j.slug] = { ...pick(j, productKeys), group, places: j.schema?.places || [], todo: j.todo || [] };
  }
}
const rental = pick(data('products/rental.json'), ['slug', 'url', 'name', 'lead', 'facts', 'price', 'options']);
const transfers = ['shared-minivan', 'speedboat-ferry'].map((s) => pick(data(`products/secret-transfers/${s}.json`), ['slug', 'url', 'name', 'lead', 'facts', 'timetable', 'priceOnRequest']));
const taxi = fs.readdirSync(path.join(repo, 'src/_data/products/taxi')).sort().map((f) => pick(data(`products/taxi/${f}`), ['slug', 'url', 'name']));

// ---- vérification des citations
const errors = [];
function q(slug, text) {
  const src = slug === 'speedboat' ? JSON.stringify(transfers[1]) : JSON.stringify(products[slug]);
  if (!src) errors.push(`produit inconnu ${slug}`);
  else if (!src.includes(JSON.stringify(text).slice(1, -1))) errors.push(`${slug} : citation absente « ${text} »`);
  return text;
}

// Positions approximatives (longitude, latitude) : carte schématique, à remplacer par un fond OSM en production.
const places = {
  'koh-lanta':    { name: 'Koh Lanta', lon: 99.062, lat: 7.50, land: true },
  'old-town':     { name: 'Lanta Old Town pier', lon: 99.103, lat: 7.528, pier: true },
  'thung-yee-peng': { name: 'Thung Yee Peng', lon: 99.074, lat: 7.584, pier: true },
  'sala-dan':     { name: 'Sala Dan pier', lon: 99.036, lat: 7.600, pier: true },
  'talabeng':     { name: 'Koh Talabeng', lon: 99.160, lat: 7.575 },
  'bubu':         { name: 'Koh Bubu', lon: 99.140, lat: 7.515 },
  'ma':           { name: 'Koh Ma', lon: 99.205, lat: 7.452 },
  'ngai':         { name: 'Koh Ngai', lon: 99.205, lat: 7.418 },
  'chueak':       { name: 'Koh Chueak', lon: 99.292, lat: 7.398 },
  'mook':         { name: 'Koh Mook', lon: 99.305, lat: 7.368 },
  'kradan':       { name: 'Koh Kradan', lon: 99.252, lat: 7.312 },
  'rok':          { name: 'Koh Rok', lon: 99.070, lat: 7.215 },
  'haa':          { name: 'Koh Haa', lon: 98.925, lat: 7.405 },
  'phi-phi':      { name: 'Koh Phi Phi', lon: 98.770, lat: 7.725 },
  'bida':         { name: 'Koh Bida', lon: 98.755, lat: 7.640 },
};

// Quelles sorties vont où : chaque lien cite le texte du produit qui le justifie.
const visits = [
  ['4-islands', 'old-town', q('4-islands', 'Lanta Old Town pier')],
  ['4-islands', 'chueak', q('4-islands', 'Koh Chueak, snorkelling over the reef, about 45 minutes.')],
  ['4-islands', 'mook', q('4-islands', 'Koh Mook, swim through the Emerald Cave to the hidden lagoon.')],
  ['4-islands', 'ngai', q('4-islands', 'Thai buffet on the beach: Koh Ngai by longtail, Koh Kradan by speedboat')],
  ['4-islands', 'ma', q('4-islands', 'Koh Ma on the longtail')],
  ['4-islands', 'kradan', q('4-islands', 'Koh Kradan instead of Koh Ma')],
  ['koh-rok-koh-haa', 'rok', q('koh-rok-koh-haa', 'Lunch buffet on the beach of Koh Rok')],
  ['koh-rok-koh-haa', 'haa', q('koh-rok-koh-haa', 'Koh Haa and a third snorkelling stop in the lagoon.')],
  ['koh-phi-phi', 'phi-phi', q('koh-phi-phi', 'Maya Bay, Pileh Lagoon and Bamboo Island by speedboat')],
  ['koh-talabeng-koh-bubu', 'talabeng', q('koh-talabeng-koh-bubu', 'Kayaking around the limestone islets of Koh Talabeng.')],
  ['koh-talabeng-koh-bubu', 'bubu', q('koh-talabeng-koh-bubu', 'Longtail to Koh Bubu, lunch and time on the beach.')],
  ['kayak', 'thung-yee-peng', q('kayak', 'Thung Yee Peng pier, east coast')],
  ['kayak', 'talabeng', q('kayak', 'Mangroves and the Koh Talabeng sea cave by kayak')],
  ['kayak', 'bubu', q('kayak', 'Lunch and a swim on Koh Bubu.')],
  ['kayak', 'old-town', q('kayak', 'Mangrove, Old Town and viewpoint, half day')],
  ['mangroves', 'thung-yee-peng', q('mangroves', 'Thung Yee Peng, east coast of Koh Lanta')],
  ['mangroves', 'old-town', q('mangroves', 'Longtail through the mangrove, then Old Town and a viewpoint')],
  ['fishing-trip', 'thung-yee-peng', q('fishing-trip', 'Thung Yee Peng pier, check-in 10:00')],
  ['atv', 'thung-yee-peng', q('atv', 'the protected mangrove of Thung Yee Peng')],
  ['batik', 'talabeng', q('batik', 'Koh Talabeng by longtail and kayak')],
  ['batik', 'thung-yee-peng', q('batik', 'Pickup at 08:00 to 09:00 for Thung Yee Peng pier.')],
  ['scuba-diving', 'haa', q('scuba-diving', 'Koh Haa or Koh Bida')],
  ['scuba-diving', 'bida', q('scuba-diving', 'Koh Haa or Koh Bida')],
  ['scuba-diving', 'phi-phi', q('scuba-diving', '2 dives, Phi Phi and Koh Bida')],
  ['atv', 'koh-lanta', q('atv', 'Forest trails up to a sea viewpoint, or a closed track')],
  ['batik', 'koh-lanta', q('batik', 'Paint your own batik canvas with a local instructor')],
  ['cooking-class', 'koh-lanta', q('cooking-class', 'Visit to the local market to pick the ingredients.')],
  ['elephant-sanctuary', 'koh-lanta', q('elephant-sanctuary', 'Walk with the elephants, feed them bananas')],
  ['go-kart', 'koh-lanta', q('go-kart', 'Race electric karts on a track')],
].map(([slug, place, quote]) => ({ slug, place, quote }));

// Tracés dessinés sur la carte (ordre des étapes du programme publié).
const routes = [
  { slug: '4-islands', id: 'longtail', via: ['old-town', 'chueak', 'mook', 'ngai', 'ma', 'old-town'], quote: q('4-islands', 'Koh Chueak, Koh Mook (Emerald Cave), Koh Ngai, Koh Ma') },
  { slug: '4-islands', id: 'speedboat', via: ['koh-lanta-se', 'chueak', 'mook', 'kradan', 'ngai', 'koh-lanta-se'], quote: q('4-islands', 'Koh Chueak, Koh Mook (Emerald Cave), Koh Kradan, Koh Ngai') },
  { slug: 'koh-rok-koh-haa', via: ['koh-lanta-s', 'rok', 'haa', 'koh-lanta-s'], quote: q('koh-rok-koh-haa', 'Koh Rok Nok, Koh Rok Nai, Koh Haa') },
  { slug: 'koh-phi-phi', via: ['koh-lanta-w', 'phi-phi', 'koh-lanta-w'], quote: q('koh-phi-phi', 'Crossing to Phi Phi Leh.') },
  { slug: 'koh-talabeng-koh-bubu', via: ['thung-yee-peng', 'talabeng', 'bubu', 'old-town'], quote: q('koh-talabeng-koh-bubu', 'East coast of Koh Lanta: Koh Talabeng, Koh Bubu') },
];
// Points de départ génériques quand le ponton n'est pas publié (pas de nom affiché).
const anchors = {
  'koh-lanta-se': { lon: 99.100, lat: 7.470 },
  'koh-lanta-s': { lon: 99.083, lat: 7.395 },
  'koh-lanta-w': { lon: 99.030, lat: 7.560 },
};

// Créneaux de la journée : uniquement les heures écrites dans les données.
const day = [
  { slug: 'mangroves', option: 'raft-sunrise', label: 'Sunrise raft, mangrove', spans: [['04:40', '07:30']], quote: q('mangroves', 'pickup around 04:40, back at the hotel by 07:30') },
  { slug: 'elephant-sanctuary', option: 'programme-a', label: 'Elephant sanctuary, programme A', spans: [['07:30', '09:30'], ['10:00', '12:00'], ['13:00', '15:00']], approxEnd: true, quote: q('elephant-sanctuary', 'Sessions start at 07:30, 10:00 and 13:00') + ' / ' + q('elephant-sanctuary', 'About 1 hr 30 min to 2 hours') },
  { slug: 'elephant-sanctuary', option: 'programme-b', label: 'Elephant sanctuary, programme B', spans: [['07:30', '10:30'], ['13:00', '16:00']], approxEnd: true, quote: q('elephant-sanctuary', 'About 3 hours, 07:30 or 13:00') },
  { slug: 'batik', option: 'morning-or-afternoon', label: 'Batik, morning course', spans: [['08:00', '13:00']], quote: q('batik', 'Pickup 08:00–09:00, back around 13:00') },
  { slug: 'batik', option: 'morning-or-afternoon', label: 'Batik, afternoon course', spans: [['12:00', '17:00']], quote: q('batik', 'Pickup 12:00–13:00, back by 17:00') },
  { slug: 'batik', option: 'kayak-and-painting', label: 'Kayak and batik', spans: [['08:00', '17:00']], quote: q('batik', 'painting from 13:00, back 17:00') },
  { slug: '4-islands', option: 'join-in-longtail', label: '4 Islands, longtail', spans: [['07:45', '16:00']], fuzzyFrom: '15:30', quote: q('4-islands', 'Back on Koh Lanta around 15:30 to 16:00') },
  { slug: 'koh-phi-phi', option: 'join-in-speedboat', label: 'Koh Phi Phi, speedboat', spans: [['08:00', '16:30']], quote: q('koh-phi-phi', 'at your hotel around 16:30') },
  { slug: 'koh-rok-koh-haa', option: 'join-in-speedboat', label: 'Koh Rok & Koh Haa, speedboat', spans: [['08:00', '16:30']], season: { from: 10, to: 4 }, quote: q('koh-rok-koh-haa', 'at your hotel by 16:30') },
  { slug: 'kayak', option: 'sea-cave-island-hopping-1-day', label: 'Kayak, sea cave and island hopping', spans: [['09:00', '15:00']], quote: q('kayak', '09:00 to 15:00') },
  { slug: 'kayak', option: 'love-kayak-1-day', label: 'Kayak, love kayak', spans: [['09:00', '15:30']], quote: q('kayak', '09:00 to 15:30') },
  { slug: 'kayak', option: 'mangrove-kayak-half-day', label: 'Kayak, half day', spans: [['09:30', '12:30'], ['14:00', '17:00']], quote: q('kayak', '09:30–12:30 or 14:00–17:00') },
  { slug: 'fishing-trip', option: 'private-raft', label: 'Fishing raft', spans: [['09:30', '14:00']], quote: q('fishing-trip', 'Private wooden raft in Ao Lanta, 09:30–14:00') },
  { slug: 'cooking-class', option: 'partner-chef', label: 'Cooking, morning class', spans: [['09:00', '14:00']], weekdays: [1, 3, 6], quote: q('cooking-class', 'Monday, Wednesday, Saturday, 09:00 to about 14:00') },
  { slug: 'cooking-class', option: 'carving', label: 'Fruit carving', spans: [['15:00', '18:00']], weekdays: [1, 3, 6], quote: q('cooking-class', 'Monday, Wednesday, Saturday 15:00–18:00') },
  { slug: 'cooking-class', option: 'carving', label: 'Fruit carving', spans: [['09:00', '12:00']], weekdays: [2, 4, 5], quote: q('cooking-class', 'Tuesday, Thursday, Friday 09:00–12:00') },
  { slug: 'cooking-class', option: 'partner-chef', label: 'Cooking, evening class', spans: [['16:00', '21:00']], weekdays: [2, 4, 5], quote: q('cooking-class', 'Tuesday, Thursday, Friday, 16:00–21:00') },
  { slug: 'mangroves', option: 'raft-sunset-dinner', label: 'Sunset raft and dinner', spans: [['16:30', '20:00']], quote: q('mangroves', 'back by 20:00') },
];

// Questionnaire : envie et durée, chaque étiquette citée.
const tags = {
  sea: { label: 'Islands and snorkelling', items: [
    ['4-islands', q('4-islands', 'Masks, snorkels and life jackets')],
    ['koh-rok-koh-haa', q('koh-rok-koh-haa', 'Two snorkelling stops over the coral around Koh Rok.')],
    ['koh-phi-phi', q('koh-phi-phi', 'Bamboo Island, swimming and snorkelling from the beach.')],
    ['koh-talabeng-koh-bubu', q('koh-talabeng-koh-bubu', 'Longtail to Koh Bubu, lunch and time on the beach.')],
    ['scuba-diving', q('scuba-diving', 'Snorkelling on the dive boat')],
  ] },
  paddle: { label: 'Kayak and mangrove', items: [
    ['kayak', q('kayak', 'Seven kayak trips from Thung Yee Peng pier')],
    ['mangroves', q('mangroves', 'The mangrove on the east side of Koh Lanta, by longtail, on a private wooden raft, or by kayak.')],
    ['koh-talabeng-koh-bubu', q('koh-talabeng-koh-bubu', 'You paddle around the limestone islets of Koh Talabeng')],
    ['atv', q('atv', 'an hour of ATV followed by an hour of kayak in the mangrove')],
    ['batik', q('batik', 'pair it with a kayak trip to the sea cave of Koh Talabeng')],
  ] },
  animals: { label: 'Animals', items: [
    ['elephant-sanctuary', q('elephant-sanctuary', 'Walk with the elephants, feed them bananas and join them in the mud bath and the pool. No riding and no show.')],
    ['kayak', q('kayak', 'Mangrove and monkeys')],
    ['koh-rok-koh-haa', q('koh-rok-koh-haa', 'the monitor lizards that live on the island')],
    ['go-kart', q('go-kart', 'then feed the koi fish')],
  ] },
  make: { label: 'Make or learn something', items: [
    ['cooking-class', q('cooking-class', 'four dishes you cook yourself with a local cook')],
    ['batik', q('batik', 'Paint your own batik canvas with a local instructor')],
    ['scuba-diving', q('scuba-diving', 'Try diving for a day, or train from your first breath to advanced diver.')],
  ] },
  fast: { label: 'Engines', items: [
    ['atv', q('atv', 'Thirty minutes on a closed track, an hour on the forest trails up to a viewpoint over the sea')],
    ['go-kart', q('go-kart', 'Race electric karts on a track, alone or in a double seat')],
  ] },
  fish: { label: 'Fishing', items: [
    ['fishing-trip', q('fishing-trip', 'A half day of fishing')],
    ['mangroves', q('mangroves', 'Private raft, fishing morning')],
  ] },
};
const lengths = {
  short: { label: 'An hour or two', items: [
    ['atv', q('atv', '30 min closed track, 1 hr forest and sea viewpoint')],
    ['go-kart', q('go-kart', 'Sessions of 10 or 15 minutes.')],
    ['elephant-sanctuary', q('elephant-sanctuary', 'Programme A, about 2 hours')],
  ] },
  half: { label: 'Half a day', items: [
    ['fishing-trip', q('fishing-trip', 'Half day')],
    ['koh-talabeng-koh-bubu', q('koh-talabeng-koh-bubu', 'Half day')],
    ['mangroves', q('mangroves', 'Half day, or a sunrise')],
    ['kayak', q('kayak', '09:30–12:30 or 14:00–17:00')],
    ['batik', q('batik', 'Pickup 08:00–09:00, back around 13:00')],
    ['cooking-class', q('cooking-class', '09:00 to about 14:00')],
    ['elephant-sanctuary', q('elephant-sanctuary', 'Programme B, about 3 hours')],
    ['atv', q('atv', '1 hour of ATV and 1 hour of kayak')],
  ] },
  full: { label: 'A full day', items: [
    ['4-islands', q('4-islands', 'Full day')],
    ['koh-rok-koh-haa', q('koh-rok-koh-haa', 'Full day')],
    ['koh-phi-phi', q('koh-phi-phi', 'Full day')],
    ['kayak', q('kayak', '09:00–15:00 or 09:00–15:30')],
    ['scuba-diving', q('scuba-diving', 'One-day experience, 2 dives')],
    ['elephant-sanctuary', q('elephant-sanctuary', 'Programme C, full day')],
    ['batik', q('batik', 'Kayaking and painting')],
  ] },
  edge: { label: 'Sunrise or evening', items: [
    ['mangroves', q('mangroves', 'On the water by 05:30, breakfast on board.')],
    ['mangroves', q('mangroves', 'Seafood dinner and the plankton after dark.')],
    ['cooking-class', q('cooking-class', 'Tuesday, Thursday, Friday, 16:00–21:00')],
  ] },
};
// Restrictions d'âge écrites dans les données.
const ageRules = {
  atv: { min: 4, quote: q('atv', 'No children under 4. Passengers from 4, drivers from 6 with staff supervision.') },
};
const seasons = {
  'koh-rok-koh-haa': { from: 10, to: 4, quote: q('koh-rok-koh-haa', 'October to April') },
};

const cardPhoto = {
  '4-islands': 'card-4-islands', 'koh-rok-koh-haa': 'card-koh-rok', 'koh-phi-phi': 'card-koh-phi-phi',
  'koh-talabeng-koh-bubu': 'card-talabeng', mangroves: 'card-mangroves', 'fishing-trip': 'card-fishing',
  'elephant-sanctuary': 'card-elephant', atv: 'card-atv', batik: 'card-batik', kayak: 'card-kayak',
  'cooking-class': 'card-cooking', 'scuba-diving': 'card-scuba', 'go-kart': 'card-go-kart',
};
for (const id of Object.values(cardPhoto)) if (!photos.find((p) => p.id === id)) errors.push(`photo absente ${id}`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const out = {
  built: new Date().toISOString().slice(0, 10),
  site: {
    name: site.brands.secret.name,
    whatsapp: site.whatsapp,
    booking: site.booking,
    operator: site.operator.name,
    licence: site.brands.secret.licence,
    vip: { name: site.brands.vip.name, url: site.brands.vip.url },
  },
  photos: Object.fromEntries(photos.map((p) => [p.id, { file: p.file, alt: p.alt, ratio: p.ratio, position: p.position, placeholder: !!p.placeholder }])),
  products, rental, transfers, taxi,
  layer: { places, anchors, visits, routes, day, tags, lengths, ageRules, seasons, cardPhoto },
};
fs.writeFileSync(path.join(here, 'data.js'), `// Généré par build-data.mjs le ${out.built} à partir de src/_data. Ne pas éditer.\nwindow.STT = ${JSON.stringify(out)};\n`);
console.log('data.js écrit :', Object.keys(products).length, 'produits,', visits.length, 'liens lieu-sortie,', day.length, 'créneaux');
