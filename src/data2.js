/* ================= EXPANSION DATA ================= */
Object.assign(BUILD, {
  mesila: { n: 'Mesila', d: 'Mesitarud lillede keskel. Mesilased toovad mett (toitu) ja vaha müügiks (kulda).', cost: { wood: 150, berries: 100, gold: 120 }, time: 40, lvl: 9, prod: { food: 5, gold: 3 }, use: {}, upkeep: 0, fame: 0.3, max: 10 },
  kalurionn: { n: 'Kalurionn', d: 'Kalurite onn kaldal. Annab palju toitu. Tuleb ehitada vee kõrvale.', cost: { wood: 200, stone: 80, gold: 200 }, time: 45, lvl: 11, prod: { food: 12, gold: 2 }, use: {}, upkeep: 1, fame: 0.3, water: true, max: 10 },
  purskkaev: { n: 'Purskkaev', d: 'Uhke kivist purskkaev. Rahvas imetleb seda ja kuningriigi kuulsus kasvab kiiresti.', cost: { stone: 800, gold: 1500, water: 300 }, time: 70, lvl: 13, prod: {}, use: {}, upkeep: 0, fame: 3, max: 5 },
});
BUILD_ORDER.push('mesila', 'kalurionn', 'purskkaev');

Object.assign(ANIMALS, {
  siil: { n: 'Siil', part: 'siili', com: 'Siiliga', feed: 3, lvl: 2, bonus: { berries: 1.5 }, bt: '+1,5 marja minutis (hoiab aiad tervena)', speed: .6 },
  kobras: { n: 'Kobras', part: 'koprat', com: 'Kopraga', feed: 6, lvl: 4, bonus: { wood: 2 }, bt: '+2 puitu minutis', speed: .8 },
  ilves: { n: 'Ilves', part: 'ilvest', com: 'Ilvesega', feed: 14, lvl: 8, bonus: { fame: 0.4 }, bt: '+0,4 kuulsust minutis ja kaitseb öiste huntide eest', speed: 1.3, guard: true },
  poder: { n: 'Põder', part: 'põtra', com: 'Põdraga', feed: 12, lvl: 10, bonus: { food: 2 }, bt: '+2 toitu minutis', speed: .9 },
  hyljes: { n: 'Hüljes', part: 'hüljest', com: 'Hülgega', feed: 10, lvl: 12, bonus: { gold: 2 }, bt: '+2 kulda minutis (leiab merepõhjast aardeid)', speed: .5 },
  karu: { n: 'Karu', part: 'karu', com: 'Karuga', feed: 25, lvl: 12, bonus: { food: 2, fame: 0.3 }, bt: '+2 toitu ja +0,3 kuulsust minutis', speed: .8 },
});
ANIMAL_ORDER.push('siil', 'kobras', 'ilves', 'poder', 'hyljes', 'karu');
REGIONS.kodu.animals.push('siil');
REGIONS.pime.animals.push('ilves', 'poder');
REGIONS.jarv.animals.push('kobras');
REGIONS.maed.animals.push('ilves');
REGIONS.org.animals.push('siil');
REGIONS.iidne.animals.push('karu');
Object.assign(REGIONS.jarv.bonus, { kalurionn: 1.3, mesila: 1.2 });
Object.assign(REGIONS.org.bonus, { mesila: 1.3 });

Object.assign(REGIONS, {
  raba: { n: 'Rabamaa', d: 'Lai sammaldunud raba laukaliste ja jõhvikamätastega. Siin elavad põdrad ja koprad.', lvl: 10, cost: 2200, fame: 350, ground: ['#7a8550', '#84905a'], animals: ['poder', 'kobras', 'lind', 'janes'], bonus: { marjaaed: 1.6, mesila: 1.3, kalurionn: 1.2 }, gen: { trees: .12, rocks: .02, bushes: .16, water: 'pools', kinds: ['mand', 'kask', 'mand'] }, disc: ['chest', 'relic', 'mushring'] },
  meri: { n: 'Merekallas', d: 'Liivane rand ja kõrged männid. Kalurionnid ja turud õitsevad, kaljudel lebavad hülged.', lvl: 12, cost: 3000, fame: 500, ground: ['#c2b27c', '#cbbb86'], animals: ['hyljes', 'lind', 'janes'], bonus: { kalurionn: 1.6, turg: 1.4, purskkaev: 1.2 }, gen: { trees: .1, rocks: .07, bushes: .03, water: 'sea', kinds: ['mand', 'mand', 'kuusk'] }, disc: ['chest', 'chest', 'crystal'] },
  pohjala: { n: 'Põhjala', d: 'Igavese lume maa. Kaljud, jäätunud järved, ilvesed ja karud. Kivimurrud ja sepad on siin väga tõhusad.', lvl: 14, cost: 4500, fame: 800, snowy: true, ground: ['#dde6e9', '#e7eef0'], animals: ['ilves', 'karu', 'poder', 'hunt', 'janes'], bonus: { kivimurd: 1.6, sepikoda: 1.5, vahitorn: 1.5 }, gen: { trees: .16, rocks: .14, bushes: .02, water: 'pond', kinds: ['kuusk', 'kuusk', 'tume'] }, disc: ['relic', 'crystal', 'chest'] },
  haldja: { n: 'Haldjasaar', d: 'Järve keskel hõljuv saar, kus kristallid laulavad ja hõbekased helendavad. Kõige maagilisem paik.', lvl: 16, cost: 7000, fame: 1200, ground: ['#5a8f78', '#649a83'], animals: ['hirv', 'rebane', 'siil', 'lind'], bonus: { purskkaev: 2, marjaaed: 1.5, mesila: 1.5, loss: 1.3, turg: 1.3 }, gen: { trees: .16, rocks: .03, bushes: .1, water: 'island', kinds: ['hobekask', 'hobekask', 'kask'] }, disc: ['crystal', 'crystal', 'mushring', 'relic', 'chest'] },
});
REGION_ORDER.push('raba', 'meri', 'pohjala', 'haldja');
TOTAL_DISC = REGION_ORDER.reduce((a, k) => a + REGIONS[k].disc.length, 0);

/* Seasons: each lasts 3 game days */
const SEASONS = [
  { k: 'kevad', n: 'Kevad', mult: { marjaaed: 1.1, mesila: 1.2 }, grow: 1.5, fx: 'puud kasvavad 50% kiiremini' },
  { k: 'suvi', n: 'Suvi', mult: { pold: 1.25, marjaaed: 1.25, mesila: 1.3 }, grow: 1.2, fx: 'põllud, aiad ja mesilad toodavad rohkem' },
  { k: 'sygis', n: 'Sügis', mult: { pold: 1.15, marjaaed: 1.1, kalurionn: 1.1 }, grow: 1, fx: 'lõikuse aeg, põllud +15%' },
  { k: 'talv', n: 'Talv', mult: { pold: .6, marjaaed: .7, mesila: .5 }, grow: .6, fx: 'põllud, aiad ja mesilad toodavad vähem' },
];

/* Royal council upgrades */
const UPG = {
  kirves: { n: 'Teravad kirved', d: 'Puu langetamine annab 40% rohkem puitu.', max: 3, cost: { gold: 300, stone: 150 }, fame: 50, lvl: 6 },
  kirka: { n: 'Tugevad kirkad', d: 'Kivi ja kulla kaevandamine annab 40% rohkem.', max: 3, cost: { gold: 300, wood: 200 }, fame: 50, lvl: 6 },
  amber: { n: 'Suured korvid ja ämbrid', d: 'Marjade ja vee korjamine annab 40% rohkem.', max: 3, cost: { gold: 250, wood: 150 }, fame: 40, lvl: 6 },
  haldjad: { n: 'Metsahaldjate õnnistus', d: 'Puud kasvavad 30% kiiremini.', max: 3, cost: { gold: 400, berries: 200 }, fame: 80, lvl: 7 },
  muld: { n: 'Viljakas muld', d: 'Põllud, aiad ja mesilad toodavad 15% rohkem.', max: 3, cost: { gold: 500, food: 200, water: 200 }, fame: 100, lvl: 8 },
  ladu: { n: 'Suured aidad', d: 'Laomaht suureneb 500 võrra.', max: 3, cost: { gold: 600, wood: 400, stone: 400 }, fame: 100, lvl: 8 },
  sosistaja: { n: 'Loomade sosistaja', d: 'Sõbrunemine õnnestub 8% sagedamini ja iga liigiga saad 2 sõpra rohkem.', max: 2, cost: { gold: 500, berries: 300 }, fame: 120, lvl: 8 },
  kaubateed: { n: 'Kaubateed', d: 'Turul müües saad 10% rohkem kulda ja ostes maksad 6% vähem.', max: 3, cost: { gold: 800, stone: 300 }, fame: 150, lvl: 9 },
  peod: { n: 'Rahvapeod', d: 'Elumajade maksud kasvavad 15%.', max: 3, cost: { gold: 700, food: 300 }, fame: 150, lvl: 9 },
  ehitajad: { n: 'Osavad ehitajad', d: 'Ehitamine ja täiendamine käib 20% kiiremini.', max: 3, cost: { gold: 900, wood: 500 }, fame: 200, lvl: 10 },
  kroonikud: { n: 'Kuninglikud kroonikud', d: 'Kogu kuulsuse teenimine kasvab 20%.', max: 3, cost: { gold: 1000, wood: 300, stone: 300 }, fame: 250, lvl: 10 },
  valitsus: { n: 'Hoolas valitsus', d: 'Kui oled eemal, töötab kuningriik 2 tundi kauem.', max: 2, cost: { gold: 1200 }, fame: 200, lvl: 10 },
};
const UPG_ORDER = Object.keys(UPG);
const upgRank = k => (S && S.upg && S.upg[k]) || 0;
const upgTotal = s => Object.values(s.upg || {}).reduce((a, v) => a + v, 0);
const maxTame = () => MAX_TAME + 2 * upgRank('sosistaja');

/* quest text fixes */
Object.assign(QUESTS.find(q => q.id === 'q34'), { n: 'Ava kuus piirkonda' });
Object.assign(QUESTS.find(q => q.id === 'q38'), { n: `Tee kõik ${TOTAL_DISC} avastust`, goal: TOTAL_DISC });
Object.assign(ACH.find(a => a.id === 'a6'), { d: 'Ava kuus piirkonda' });
Object.assign(ACH.find(a => a.id === 'a11'), { d: `Tee kõik ${TOTAL_DISC} avastust` });
Object.assign(QUESTS.find(q => q.id === 'q37'), { n: 'Sõbrune viie erineva loomaliigiga' });

const tamedOf = (s, k) => s.st.tamed[k] || 0;
const lvl5Count = s => s.buildings.filter(b => b.lvl >= 5).length;
QUESTS.push(
  Q('q39', 'Sõbrune siiliga', 1, s => tamedOf(s, 'siil'), { berries: 60, xp: 60 }),
  Q('q40', 'Sõbrune kopraga', 1, s => tamedOf(s, 'kobras'), { wood: 150, xp: 80 }),
  Q('q41', 'Saavuta 10. tase', 10, s => s.level, { gold: 500, fame: 25 }),
  Q('q42', 'Osta kuninglikult nõukogult esimene uuendus', 1, s => upgTotal(s), { gold: 300, xp: 100 }),
  Q('q43', 'Ehita mesila', 1, bc('mesila'), { berries: 150, xp: 120 }),
  Q('q44', 'Kauple rändkaupmehega', 1, s => s.st.trades, { gold: 200, xp: 80 }),
  Q('q45', 'Ela üle kõik neli aastaaega', 4, s => (s.seenSeasons || []).length, { fame: 40, xp: 200 }),
  Q('q46', 'Ava Rabamaa', 1, s => s.regions.raba ? 1 : 0, { gold: 600, fame: 30, xp: 250 }),
  Q('q47', 'Sõbrune ilvesega', 1, s => tamedOf(s, 'ilves'), { gold: 400, xp: 150 }),
  Q('q48', 'Sõbrune põdraga', 1, s => tamedOf(s, 'poder'), { food: 200, xp: 200 }),
  Q('q49', 'Ehita kalurionn', 1, bc('kalurionn'), { gold: 500, xp: 200 }),
  Q('q50', 'Saavuta 12. tase', 12, s => s.level, { gold: 800, fame: 40 }),
  Q('q51', 'Ava Merekallas', 1, s => s.regions.meri ? 1 : 0, { gold: 900, fame: 40, xp: 300 }),
  Q('q52', 'Sõbrune hülgega', 1, s => tamedOf(s, 'hyljes'), { gold: 600, xp: 250 }),
  Q('q53', 'Sõbrune karuga', 1, s => tamedOf(s, 'karu'), { food: 300, fame: 30, xp: 300 }),
  Q('q54', 'Ehita purskkaev', 1, bc('purskkaev'), { gold: 1000, fame: 50, xp: 300 }),
  Q('q55', 'Osta nõukogult 10 uuendust', 10, s => upgTotal(s), { gold: 1500, fame: 60, xp: 400 }),
  Q('q56', 'Kauple rändkaupmehega 10 korda', 10, s => s.st.trades, { gold: 1200, fame: 40, xp: 300 }),
  Q('q57', 'Saavuta 14. tase', 14, s => s.level, { gold: 1500, fame: 60 }),
  Q('q58', 'Ava Põhjala', 1, s => s.regions.pohjala ? 1 : 0, { gold: 1500, fame: 60, xp: 500 }),
  Q('q59', 'Sõbrune 25 loomaga', 25, s => s.st.tamedTotal, { berries: 500, fame: 50, xp: 400 }),
  Q('q60', 'Langeta 300 puud', 300, s => s.st.chopped, { gold: 1000, xp: 300 }),
  Q('q61', 'Istuta 150 puud', 150, s => s.st.planted, { water: 500, fame: 40, xp: 300 }),
  Q('q62', 'Täienda viis hoonet 5. tasemele', 5, lvl5Count, { gold: 2000, fame: 60, xp: 500 }),
  Q('q63', 'Teeni kokku 25 000 kulda', 25000, s => s.st.goldEarned, { fame: 80, xp: 600 }),
  Q('q64', 'Saavuta 1000 kuulsust', 1000, s => s.fame, { gold: 3000, xp: 600 }),
  Q('q65', 'Peleta minema 25 hunti', 25, s => s.st.scared, { food: 400, fame: 40, xp: 300 }),
  Q('q66', 'Saavuta 16. tase', 16, s => s.level, { gold: 3000, fame: 80 }),
  Q('q67', 'Ava Haldjasaar', 1, s => s.regions.haldja ? 1 : 0, { gold: 3000, fame: 100, xp: 800 }),
  Q('q68', 'Sõbrune kõigi 11 loomaliigiga', 11, s => ANIMAL_ORDER.filter(a => (s.st.tamed[a] || 0) > 0).length, { gold: 4000, fame: 120, xp: 1000 }),
  Q('q69', 'Ava kõik 10 piirkonda', 10, s => Object.keys(s.regions).length, { gold: 5000, fame: 150, xp: 1200 }),
  Q('q70', 'Saavuta 20. tase', 20, s => s.level, { gold: 8000, fame: 200 }),
);
ACH.push(
  { id: 'a19', n: 'Maailmarändur', d: 'Ava kõik 10 piirkonda', ok: s => Object.keys(s.regions).length >= 10, fame: 50 },
  { id: 'a20', n: 'Nelja aastaaja valitseja', d: 'Ela läbi kõik aastaajad', ok: s => (s.seenSeasons || []).length >= 4, fame: 15 },
  { id: 'a21', n: 'Rändkaupmehe sõber', d: 'Kauple rändkaupmehega 15 korda', ok: s => s.st.trades >= 15, fame: 20 },
  { id: 'a22', n: 'Suur karjus', d: 'Sõbrune 40 loomaga', ok: s => s.st.tamedTotal >= 40, fame: 30 },
  { id: 'a23', n: 'Tark valitseja', d: 'Täienda kõik nõukogu uuendused maksimumini', ok: s => UPG_ORDER.every(k => (s.upg || {})[k] >= UPG[k].max), fame: 50 },
  { id: 'a24', n: 'Legendide valitseja', d: 'Saavuta 20. tase', ok: s => s.level >= 20, fame: 40 },
);
