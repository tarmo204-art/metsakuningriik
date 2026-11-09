'use strict';
/* ================= DATA ================= */
const W = 16, H = 11, DAY = 360, BASE_CAP = 400, MAX_LVL = 5, MAX_TAME = 8;
const RES_KEYS = ['wood', 'stone', 'berries', 'food', 'water', 'gold'];
const RES = {
  wood: { n: 'Puit', g: 'puitu', c: '#e2b27a' },
  stone: { n: 'Kivi', g: 'kivi', c: '#c9d0d2' },
  berries: { n: 'Marjad', g: 'marju', c: '#ff8ea0' },
  food: { n: 'Toit', g: 'toitu', c: '#f0cd7d' },
  water: { n: 'Vesi', g: 'vett', c: '#9fdcf0' },
  gold: { n: 'Kuld', g: 'kulda', c: '#ffd065' },
};
const ICON = {
  wood: '<svg viewBox="0 0 20 20"><rect x="1.5" y="10.5" width="15" height="6" rx="3" fill="#8a5530"/><ellipse cx="16" cy="13.5" rx="2.6" ry="3" fill="#e2b27a" stroke="#8a5530"/><rect x="3.5" y="4" width="13" height="5.5" rx="2.75" fill="#a0653a"/><ellipse cx="16.3" cy="6.75" rx="2.3" ry="2.75" fill="#eac08a" stroke="#a0653a"/></svg>',
  stone: '<svg viewBox="0 0 20 20"><path d="M3 15 L5 8 L10 4 L16 7 L18 14 L12 17 Z" fill="#8d979a"/><path d="M5 8 L10 4 L16 7 L11 9 Z" fill="#cdd3d5"/><path d="M11 9 L16 7 L18 14 L12 17 Z" fill="#6c7679"/></svg>',
  berries: '<svg viewBox="0 0 20 20"><path d="M10 3 C 12 1, 15 2, 16 4 C 13 5, 11 5, 10 3Z" fill="#6fbf55"/><path d="M10 3 L7 9 M10 3 L13 8" stroke="#5a7a3a" stroke-width="1" fill="none"/><circle cx="7" cy="12" r="3.6" fill="#c8344f"/><circle cx="13" cy="11" r="3.6" fill="#e0506a"/><circle cx="10" cy="15.5" r="3.4" fill="#b02a45"/><circle cx="12" cy="9.8" r="1" fill="#ffc0cb"/></svg>',
  food: '<svg viewBox="0 0 20 20"><path d="M2.5 13 C2.5 6.5, 17.5 6.5, 17.5 13 C17.5 15.6, 2.5 15.6, 2.5 13Z" fill="#d79a45"/><path d="M6 9.5 L7.5 12 M10 8.6 L11.3 11.5 M14 9.5 L15 12" stroke="#f6d698" stroke-width="1.4" stroke-linecap="round"/></svg>',
  gold: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" fill="#e8a73a"/><circle cx="10" cy="10" r="5.4" fill="#f6c95c" stroke="#c98a22"/><path d="M10 6.6 L11 9 L13.4 10 L11 11 L10 13.4 L9 11 L6.6 10 L9 9Z" fill="#c4861d"/></svg>',
  water: '<svg viewBox="0 0 20 20"><path d="M10 2 C 13 7, 16 10, 16 13 A6 6 0 0 1 4 13 C4 10, 7 7, 10 2Z" fill="#4fa6c8"/><path d="M7 13 A3 3 0 0 0 10 16" stroke="#c8eef9" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>',
  fame: '<svg viewBox="0 0 20 20"><path d="M3 15 L4 6 L7.5 10 L10 4 L12.5 10 L16 6 L17 15 Z" fill="#f2b552"/><rect x="3" y="15" width="14" height="2.4" rx="1" fill="#d99633"/><circle cx="10" cy="4" r="1.4" fill="#ffe3a3"/><circle cx="4" cy="6" r="1.1" fill="#ffe3a3"/><circle cx="16" cy="6" r="1.1" fill="#ffe3a3"/></svg>',
  xp: '<svg viewBox="0 0 20 20"><path d="M10 1.5 L12 8 L18.5 10 L12 12 L10 18.5 L8 12 L1.5 10 L8 8Z" fill="#b9e3a0"/></svg>',
  time: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" fill="none" stroke="#93ab9b" stroke-width="1.8"/><path d="M10 5.5 V10 L13 12" stroke="#93ab9b" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 20 20"><rect x="4" y="9" width="12" height="9" rx="2" fill="currentColor"/><path d="M6.5 9 V6.5 a3.5 3.5 0 0 1 7 0 V9" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  people: '<svg viewBox="0 0 20 20"><circle cx="7" cy="6.5" r="3" fill="#d9c7a0"/><circle cx="14" cy="7.5" r="2.5" fill="#bfae88"/><path d="M1.5 17 C2 11.5, 12 11.5, 12.5 17Z" fill="#d9c7a0"/><path d="M10.5 17 C11 12.5, 18 12.5, 18.5 17Z" fill="#bfae88"/></svg>',
};
const TOOL_ICON = {
  kogu: '<svg viewBox="0 0 20 20"><path d="M4 16 L12 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M10 4 C13 3, 16 5, 16.5 8 L12.5 8.5 L11 6.5 Z" fill="currentColor"/></svg>',
  istuta: '<svg viewBox="0 0 20 20"><path d="M10 18 V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 10 C 5 10, 3 7, 3.5 3.5 C 7.5 3.5, 10 6, 10 10Z M10 12 C 14 12, 17 9.5, 16.5 6 C 12.5 6, 10 8.5, 10 12Z" fill="currentColor"/></svg>',
  ehita: '<svg viewBox="0 0 20 20"><path d="M3 17 L11 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="9" y="2.5" width="9" height="5" rx="1.2" transform="rotate(45 13.5 5)" fill="currentColor"/></svg>',
};
const ic = (k, cls = '') => `<span class="ic ${cls}" aria-hidden="true">${ICON[k]}</span>`;

/* Buildings: prod/use per minute at level 1 */
const BUILD = {
  metsamaja: { n: 'Metsamaja', d: 'Metsavahi palkmaja. Toodab puitu ja kiirendab puude kasvu oma piirkonnas.', cost: { wood: 20, gold: 15 }, time: 8, lvl: 1, prod: { wood: 6 }, use: {}, upkeep: 0, fame: 0.1, max: 20 },
  elumaja: { n: 'Elumaja', d: 'Kodu neljale elanikule. Elanikud maksavad makse, söövad toitu ja suurendavad ladu.', cost: { wood: 30, stone: 10 }, time: 12, lvl: 1, prod: { gold: 4 }, use: { food: 1 }, upkeep: 0, res: 4, storage: 150, fame: 0.2, max: 30 },
  marjaaed: { n: 'Marjapõõsaste aed', d: 'Aed täis mustikaid ja vaarikaid. Vajab kastmiseks vett.', cost: { wood: 25, gold: 10 }, time: 10, lvl: 1, prod: { berries: 7 }, use: { water: 1 }, upkeep: 0, fame: 0.1, max: 20 },
  kaev: { n: 'Kaev', d: 'Kivist kaev, mis ammutab puhast põhjavett.', cost: { wood: 15, stone: 20 }, time: 12, lvl: 2, prod: { water: 8 }, use: {}, upkeep: 0.5, max: 20 },
  saeveski: { n: 'Saeveski', d: 'Vesiratta jõul töötav saag. Toodab palju puitu.', cost: { wood: 60, stone: 30, gold: 40 }, time: 22, lvl: 2, prod: { wood: 15 }, use: {}, upkeep: 1, fame: 0.2, max: 10 },
  kivimurd: { n: 'Kivimurd', d: 'Kaevurid raiuvad kaljust ehituskivi.', cost: { wood: 50, gold: 30 }, time: 22, lvl: 2, prod: { stone: 9 }, use: {}, upkeep: 1, fame: 0.1, max: 10 },
  pold: { n: 'Põld', d: 'Viljapõld, mis toidab elanikke. Vajab vett.', cost: { wood: 40, stone: 15, gold: 20 }, time: 18, lvl: 3, prod: { food: 9 }, use: { water: 2 }, upkeep: 0, fame: 0.1, max: 20 },
  turg: { n: 'Turg', d: 'Avab kauplemise, toob kaupmeeste maksu ja suurendab ladu. Iga tase tõstab müügihindu.', cost: { wood: 80, stone: 60, gold: 80 }, time: 35, lvl: 3, prod: { gold: 6 }, use: {}, upkeep: 0, storage: 300, fame: 0.5, max: 1 },
  sepikoda: { n: 'Sepikoda', d: 'Sepp teeb tööriistu. Iga tase suurendab käsitsi korjamist 20% ja toob kulda.', cost: { wood: 120, stone: 120, gold: 150 }, time: 45, lvl: 5, prod: { gold: 12 }, use: { wood: 3, stone: 2 }, upkeep: 0, fame: 0.3, gather: 0.2, max: 3 },
  vahitorn: { n: 'Vahitorn', d: 'Valvab kuningriiki öiste huntide eest, toob kuulsust ja avab tee Salapärasesse orgu.', cost: { wood: 100, stone: 150, gold: 120 }, time: 40, lvl: 6, prod: {}, use: {}, upkeep: 2, fame: 1, guard: true, max: 2 },
  loss: { n: 'Loss', d: 'Kuningriigi süda. Toob palju kuulsust ja kulda ning suurendab ladu tohutult.', cost: { wood: 500, stone: 600, gold: 800, food: 200 }, time: 90, lvl: 8, prod: { gold: 15 }, use: {}, upkeep: 0, storage: 2000, fame: 5, max: 1 },
};
const BUILD_ORDER = ['metsamaja', 'elumaja', 'marjaaed', 'kaev', 'saeveski', 'kivimurd', 'pold', 'turg', 'sepikoda', 'vahitorn', 'loss'];

const REGIONS = {
  kodu: { n: 'Kodumets', d: 'Sinu esimene maalapp keset metsa. Kuuskede ja kaskede vahel on väike tiik.', lvl: 1, cost: 0, fame: 0, ground: ['#4a8a3e', '#56954a'], animals: ['janes', 'lind', 'hirv', 'rebane'], bonus: {}, gen: { trees: .2, rocks: .05, bushes: .06, water: 'pond', kinds: ['kuusk', 'kask', 'kask'] }, disc: ['chest'] },
  pime: { n: 'Pime mets', d: 'Tihe ja hämar kuusik. Siin kasvab kõige rohkem puid, liiguvad rebased ja hundid.', lvl: 3, cost: 120, fame: 10, ground: ['#2d5838', '#284f32'], animals: ['rebane', 'hunt', 'lind', 'janes'], bonus: { metsamaja: 1.4, saeveski: 1.5 }, gen: { trees: .4, rocks: .04, bushes: .09, water: 'none', kinds: ['tume', 'tume', 'kuusk'] }, disc: ['chest', 'chest', 'mushring'] },
  jarv: { n: 'Järveäärne maa', d: 'Lai järv ja niisked heinamaad. Kaevud, aiad ja põllud annavad siin rohkem.', lvl: 4, cost: 250, fame: 25, ground: ['#5f9f47', '#68a84f'], animals: ['hirv', 'lind', 'janes'], bonus: { kaev: 1.5, pold: 1.3, marjaaed: 1.2 }, gen: { trees: .12, rocks: .03, bushes: .09, water: 'lake', kinds: ['kask', 'kask', 'kuusk'] }, disc: ['chest', 'relic', 'crystal'] },
  maed: { n: 'Mäestik', d: 'Kaljune kõrgustik täis kivi ja kullasooni. Kivimurrud ja sepad on siin tõhusamad.', lvl: 5, cost: 400, fame: 50, ground: ['#7a8a66', '#84936e'], animals: ['hunt', 'lind', 'hirv'], bonus: { kivimurd: 1.6, sepikoda: 1.3 }, gen: { trees: .08, rocks: .24, bushes: .02, water: 'stream', gold: 5, kinds: ['kuusk'] }, disc: ['chest', 'relic', 'crystal'] },
  org: { n: 'Salapärane org', d: 'Udune org, kus helendavad kristallid ja seenteringid. Sinna pääseb ainult vahitorni abil.', lvl: 7, cost: 800, fame: 120, tower: true, ground: ['#4a7a64', '#518370'], animals: ['hirv', 'rebane', 'lind', 'janes'], bonus: { marjaaed: 1.4, turg: 1.3 }, gen: { trees: .15, rocks: .05, bushes: .1, water: 'pond', kinds: ['hobekask', 'hobekask', 'kask'] }, disc: ['crystal', 'crystal', 'mushring', 'relic'] },
  iidne: { n: 'Iidne mets', d: 'Tuhandeaastased tammed ja unustatud kivid. Kõige rikkalikum ja metsikum ala.', lvl: 9, cost: 1500, fame: 250, ground: ['#2b4e3e', '#2f5443'], animals: ['hunt', 'hirv', 'rebane', 'lind', 'janes'], bonus: { metsamaja: 1.6, saeveski: 1.6, loss: 1.2 }, gen: { trees: .34, rocks: .06, bushes: .06, water: 'stream', kinds: ['tamm', 'tamm', 'kuusk'] }, disc: ['relic', 'relic', 'chest', 'crystal'] },
};
const REGION_ORDER = ['kodu', 'pime', 'jarv', 'maed', 'org', 'iidne'];
let TOTAL_DISC = REGION_ORDER.reduce((a, k) => a + REGIONS[k].disc.length, 0);

const ANIMALS = {
  janes: { n: 'Jänes', part: 'jänest', com: 'Jänesega', feed: 3, lvl: 1, bonus: { berries: 1 }, bt: '+1 marja minutis', speed: 1.5 },
  lind: { n: 'Lind', part: 'lindu', com: 'Linnuga', feed: 2, lvl: 1, bonus: { fame: 0.2 }, bt: '+0,2 kuulsust minutis', speed: 2.2, fly: true },
  hirv: { n: 'Hirv', part: 'hirve', com: 'Hirvega', feed: 6, lvl: 2, bonus: { food: 1 }, bt: '+1 toitu minutis', speed: 1.0 },
  rebane: { n: 'Rebane', part: 'rebast', com: 'Rebasega', feed: 8, lvl: 3, bonus: { gold: 1 }, bt: '+1 kulda minutis (leiab läikivaid asju)', speed: 1.35 },
  hunt: { n: 'Hunt', part: 'hunti', com: 'Hundiga', feed: 15, lvl: 5, bonus: { fame: 0.3 }, bt: '+0,3 kuulsust minutis ja kaitseb öiste huntide eest', speed: 1.25, guard: true },
};
const ANIMAL_ORDER = ['janes', 'lind', 'hirv', 'rebane', 'hunt'];

const WEATHER = {
  paike: { n: 'Päikeseline', w: 32, mult: { pold: 1.2, marjaaed: 1.1 }, grow: 1, fx: 'Põllud ja aiad +' },
  pilves: { n: 'Pilvine', w: 26, grow: 1 },
  vihm: { n: 'Vihmane', w: 20, mult: { marjaaed: 1.3, kaev: 1.3, pold: 1.15 }, grow: 2 },
  udu: { n: 'Udune', w: 10, grow: 1.2 },
  lumi: { n: 'Lumesadu', w: 12, mult: { pold: .6, marjaaed: .6, kaev: .8, _: .9 }, grow: .5 },
};
const WEATHER_FX = { paike: 'Põllud +20%, aiad +10%', pilves: 'Tavaline päev', vihm: 'Puud kasvavad 2× kiiremini, aiad ja kaevud +30%', udu: 'Puud kasvavad veidi kiiremini', lumi: 'Kõik toodang aeglasem, põllud −40%' };

const MBASE = { wood: 2, stone: 3, berries: 2.2, food: 4, water: 1.4 };
const MARKET_KEYS = ['wood', 'stone', 'berries', 'food', 'water'];

const DAILY = [{ gold: 30, wood: 20 }, { gold: 40, berries: 30 }, { gold: 50, stone: 30 }, { gold: 60, food: 30 }, { gold: 80, water: 50 }, { gold: 100, wood: 60, stone: 40 }, { gold: 200, fame: 10 }];

/* Quests (38) */
const bc = t => s => (s.st.built[t] || 0);
const Q = (id, n, goal, get, reward) => ({ id, n, goal, get, reward });
const QUESTS = [
  Q('q1', 'Kogu 25 puitu', 25, s => s.st.gathered.wood, { gold: 20, xp: 15 }),
  Q('q2', 'Ehita esimene elumaja', 1, bc('elumaja'), { wood: 25, xp: 20 }),
  Q('q3', 'Istuta 5 puud', 5, s => s.st.planted, { water: 15, xp: 15 }),
  Q('q4', 'Korja 30 marja', 30, s => s.st.gathered.berries, { gold: 20, xp: 15 }),
  Q('q5', 'Ehita metsamaja', 1, bc('metsamaja'), { stone: 20, xp: 20 }),
  Q('q6', 'Kogu 50 kivi', 50, s => s.st.gathered.stone, { gold: 30, xp: 20 }),
  Q('q7', 'Kogu 100 puitu', 100, s => s.st.gathered.wood, { gold: 40, xp: 25 }),
  Q('q8', 'Ehita marjapõõsaste aed', 1, bc('marjaaed'), { water: 30, xp: 20 }),
  Q('q9', 'Too järvest või tiigist 50 vett', 50, s => s.st.gathered.water, { gold: 30, xp: 20 }),
  Q('q10', 'Saavuta 3. tase', 3, s => s.level, { gold: 60, fame: 5 }),
  Q('q11', 'Istuta 10 puud', 10, s => s.st.planted, { berries: 30, xp: 30 }),
  Q('q12', 'Langeta 15 puud', 15, s => s.st.chopped, { gold: 50, xp: 30 }),
  Q('q13', 'Ehita kaev', 1, bc('kaev'), { gold: 40, xp: 25 }),
  Q('q14', 'Valmista lõkkel 20 toitu', 20, s => s.st.cooked, { gold: 40, xp: 25 }),
  Q('q15', 'Sõbrune esimese loomaga', 1, s => s.st.tamedTotal, { berries: 40, xp: 30, fame: 3 }),
  Q('q16', 'Ehita saeveski', 1, bc('saeveski'), { gold: 60, xp: 35 }),
  Q('q17', 'Ehita kivimurd', 1, bc('kivimurd'), { gold: 60, xp: 35 }),
  Q('q18', 'Ehita põld', 1, bc('pold'), { water: 50, xp: 35 }),
  Q('q19', 'Ehita turg', 1, bc('turg'), { gold: 100, xp: 40, fame: 5 }),
  Q('q20', 'Müü turul 100 ühikut kaupa', 100, s => s.st.sold, { gold: 80, xp: 40 }),
  Q('q21', 'Ava esimene uus piirkond', 2, s => Object.keys(s.regions).length, { gold: 100, xp: 50, fame: 10 }),
  Q('q22', 'Täienda mõni hoone 3. tasemele', 3, s => s.st.maxBldLvl, { stone: 80, xp: 50 }),
  Q('q23', 'Teeni kokku 1000 kulda', 1000, s => s.st.goldEarned, { fame: 15, xp: 60 }),
  Q('q24', 'Saavuta 5. tase', 5, s => s.level, { gold: 150, fame: 10 }),
  Q('q25', 'Sõbrune 5 loomaga', 5, s => s.st.tamedTotal, { food: 60, xp: 60, fame: 8 }),
  Q('q26', 'Tee 3 avastust', 3, s => s.st.discoveries, { gold: 150, xp: 70 }),
  Q('q27', 'Ehita sepikoda', 1, bc('sepikoda'), { gold: 120, xp: 70 }),
  Q('q28', 'Ehita vahitorn', 1, bc('vahitorn'), { stone: 150, xp: 70, fame: 10 }),
  Q('q29', 'Kogu 1000 puitu', 1000, s => s.st.gathered.wood, { gold: 200, xp: 80 }),
  Q('q30', 'Ava kolm uut piirkonda', 4, s => Object.keys(s.regions).length, { gold: 300, fame: 20, xp: 100 }),
  Q('q31', 'Saavuta 100 kuulsust', 100, s => s.fame, { gold: 250, xp: 100 }),
  Q('q32', 'Saavuta 8. tase', 8, s => s.level, { gold: 300, fame: 20 }),
  Q('q33', 'Ehita loss', 1, bc('loss'), { gold: 500, fame: 50, xp: 200 }),
  Q('q34', 'Ava kõik piirkonnad', 6, s => Object.keys(s.regions).length, { gold: 800, fame: 60, xp: 300 }),
  Q('q35', 'Ela üle 10 päeva', 10, s => dayNum(), { food: 100, xp: 80 }),
  Q('q36', 'Kogu 500 toitu', 500, s => s.st.gathered.food, { gold: 200, xp: 90 }),
  Q('q37', 'Sõbrune iga loomaliigiga', 5, s => ANIMAL_ORDER.filter(a => (s.st.tamed[a] || 0) > 0).length, { fame: 30, xp: 150 }),
  Q('q38', `Tee kõik ${TOTAL_DISC} avastust`, TOTAL_DISC, s => s.st.discoveries, { gold: 1000, fame: 80, xp: 400 }),
];

const ACH = [
  { id: 'a1', n: 'Esimene samm', d: 'Kogu oma esimene ressurss', ok: s => s.st.gathered.wood + s.st.gathered.stone + s.st.gathered.berries + s.st.gathered.water > 0, fame: 2 },
  { id: 'a2', n: 'Metsavaht', d: 'Istuta 50 puud', ok: s => s.st.planted >= 50, fame: 10 },
  { id: 'a3', n: 'Puuraiuja', d: 'Langeta 100 puud', ok: s => s.st.chopped >= 100, fame: 10 },
  { id: 'a4', n: 'Ehitusmeister', d: 'Ehita 15 hoonet', ok: s => s.st.builtTotal >= 15, fame: 10 },
  { id: 'a5', n: 'Loomasõber', d: 'Sõbrune 10 loomaga', ok: s => s.st.tamedTotal >= 10, fame: 10 },
  { id: 'a6', n: 'Rändur', d: 'Ava kõik piirkonnad', ok: s => Object.keys(s.regions).length >= 6, fame: 20 },
  { id: 'a7', n: 'Kullakuningas', d: 'Teeni kokku 5000 kulda', ok: s => s.st.goldEarned >= 5000, fame: 15 },
  { id: 'a8', n: 'Legendaarne', d: 'Saavuta 500 kuulsust', ok: s => s.fame >= 500, fame: 0 },
  { id: 'a9', n: 'Ööde valvur', d: 'Ela üle 5 öö', ok: s => s.st.nights >= 5, fame: 5 },
  { id: 'a10', n: 'Kaupmees', d: 'Müü turul 1000 ühikut', ok: s => s.st.sold >= 1000, fame: 10 },
  { id: 'a11', n: 'Aardekütt', d: `Tee kõik ${TOTAL_DISC} avastust`, ok: s => s.st.discoveries >= TOTAL_DISC, fame: 30 },
  { id: 'a12', n: 'Lossiisand', d: 'Ehita loss', ok: s => (s.st.built.loss || 0) >= 1, fame: 25 },
  { id: 'a13', n: 'Kogenud valitseja', d: 'Saavuta 10. tase', ok: s => s.level >= 10, fame: 15 },
  { id: 'a14', n: 'Arhitekt', d: 'Ehita igat tüüpi hoone', ok: s => BUILD_ORDER.every(t => (s.st.built[t] || 0) > 0), fame: 20 },
  { id: 'a15', n: 'Vihmatantsija', d: 'Istuta puu vihmasajus', ok: s => s.st.rainPlant >= 1, fame: 3 },
  { id: 'a16', n: 'Truu valitseja', d: 'Võta päevapreemiat 7 päeva järjest', ok: s => s.daily.best >= 7, fame: 15 },
  { id: 'a17', n: 'Täiuslikkus', d: 'Täienda hoone 5. tasemele', ok: s => s.st.maxBldLvl >= 5, fame: 10 },
  { id: 'a18', n: 'Hundipeletaja', d: 'Peleta 10 öist hunti', ok: s => s.st.scared >= 10, fame: 8 },
];
