/* ================= ELAV KUNINGRIIK: elanikud, soovid, auaste, sündmused, ekspeditsioonid ja varakamber ================= */

/* ---------- andmed ---------- */
const FOLK_NAMES = ['Mari', 'Jaan', 'Liis', 'Peeter', 'Kadri', 'Toomas', 'Anu', 'Mart', 'Kertu', 'Rein', 'Helmi', 'Ants', 'Leena', 'Juhan', 'Maie', 'Tiit', 'Eeva', 'Priit', 'Kati', 'Villem', 'Aino', 'Karl', 'Liina', 'Hans'];
const FOLK_SKIN = ['#f2d0b0', '#e8bc96', '#d8a47c', '#f6dcc4', '#c8946c'];
const FOLK_HAIR = ['#3a2416', '#6a4224', '#c89a4a', '#1e1410', '#8a5a2a', '#d8c48a', '#7a7068'];
const FOLK_CLOTH = ['#3f6b3a', '#7a3a2a', '#2f5a7a', '#8a6a2a', '#5a3a6a', '#4a5a3a', '#a8502a', '#2a4a5a', '#6a2a3a'];
const RANKS = [
  { n: 'Asundus', d: 'Väike asundus keset metsa.', need: null },
  { n: 'Küla', d: 'Mõned majad ja esimesed elanikud.', need: { b: 3, r: 8, l: 2 } },
  { n: 'Alev', d: 'Elav alev, kus on juba käsitöölisi.', need: { b: 8, r: 24, l: 5 } },
  { n: 'Linn', d: 'Turuga linn, kuhu kaupmehed kaugelt tulevad.', need: { b: 15, r: 48, l: 8, turg: 1 } },
  { n: 'Kuningriik', d: 'Lossiga kuningriik, mille kuulsus levib kaugele.', need: { b: 24, r: 80, l: 12, loss: 1, reg: 4 } },
  { n: 'Impeerium', d: 'Võimas impeerium, millest räägitakse legende.', need: { b: 36, r: 140, l: 20, loss: 3, reg: 6 } },
];
const REQ_TXT = {
  wood: ['tahab ehitada lastele kiike', 'peab parandama oma katust', 'tahab teha uue aia'],
  stone: ['tahab laduda kiviahju', 'ehitab kaevule uut äärt', 'tahab sillutada teerada'],
  berries: ['küpsetab marjapirukaid', 'keedab talveks moosi', 'teeb külapeoks marjamahla'],
  food: ['korraldab pulmapidu', 'toidab haiget naabrit', 'valmistab rännakuks toitu'],
  water: ['peseb pesu suurpuhastuseks', 'kastab köögiviljaaeda', 'keedab õlut lõikuspeoks'],
};
// Varakambri leiud: igaüks annab väikese püsiva boonuse
const RELICS = {
  kabi: { n: 'Hõbekuuse käbi', r: 1, fx: { wood: .03 }, d: 'Puidu tootmine +3%' },
  sarv: { n: 'Karjase sarv', r: 1, fx: { food: .03 }, d: 'Toidu tootmine +3%' },
  kruus: { n: 'Savikruus', r: 1, fx: { water: .03 }, d: 'Vee tootmine +3%' },
  korv: { n: 'Punutud korv', r: 1, fx: { berries: .03 }, d: 'Marjade tootmine +3%' },
  kirves: { n: 'Vana kirves', r: 2, fx: { gather: .05 }, d: 'Käsitsi korjamine +5%' },
  haamer: { n: 'Kiviraiuja haamer', r: 2, fx: { stone: .05 }, d: 'Kivi tootmine +5%' },
  mynt: { n: 'Iidne münt', r: 2, fx: { gold: .03 }, d: 'Kulla tootmine +3%' },
  sulg: { n: 'Kuldne sulg', r: 2, fx: { fame: .04 }, d: 'Kuulsus +4%' },
  kompass: { n: 'Messingist kompass', r: 3, fx: { exp: .1 }, d: 'Ekspeditsioonid 10% kiiremad' },
  rull: { n: 'Kroonikute rull', r: 3, fx: { fame: .06 }, d: 'Kuulsus +6%' },
  amulett: { n: 'Metsahaldja amulett', r: 3, fx: { wood: .05, berries: .05 }, d: 'Puit ja marjad +5%' },
  karikas: { n: 'Hõbekarikas', r: 3, fx: { gold: .05 }, d: 'Kulla tootmine +5%' },
  kilp: { n: 'Kuningate kilp', r: 4, fx: { all: .04 }, d: 'Kogu tootmine +4%' },
  kera: { n: 'Tähekera', r: 4, fx: { fame: .1 }, d: 'Kuulsus +10%' },
  kroon: { n: 'Kadunud kroon', r: 5, fx: { all: .06, fame: .08 }, d: 'Kogu tootmine +6%, kuulsus +8%' },
  muna: { n: 'Draakonimuna', r: 5, fx: { gold: .1, gather: .1 }, d: 'Kuld +10%, korjamine +10%' },
};
const RELIC_ORDER = Object.keys(RELICS);
const REL_COL = ['', '#c3d3a4', '#8fd17a', '#6cb8ff', '#c58cff', '#ffb347'];
const REL_RN = ['', 'Tavaline', 'Ebatavaline', 'Haruldane', 'Eepiline', 'Legendaarne'];
const EXPEDS = [
  { id: 'marja', n: 'Marjamäed', d: 'Päikselised nõlvad täis metsmaasikaid.', min: 15, lvl: 1, cost: { food: 15 }, rew: l => ({ berries: 60 + l * 8, food: 20 + l * 3, xp: 15 + l * 3 }), rel: .04, map: .03 },
  { id: 'kaljud', n: 'Kaljukoopad', d: 'Kaljude vahel on vanu kaevureid ja kivihunnikuid.', min: 30, lvl: 3, cost: { food: 30, wood: 20 }, rew: l => ({ stone: 80 + l * 10, gold: 40 + l * 10, xp: 30 + l * 5 }), rel: .08, map: .06 },
  { id: 'varemed', n: 'Vanad varemed', d: 'Sammaldunud müürid, kus elasid kunagised kuningad.', min: 60, lvl: 5, cost: { food: 50, gold: 30 }, rew: l => ({ gold: 150 + l * 25, fame: 15 + l * 2, xp: 60 + l * 8 }), rel: .16, map: .12 },
  { id: 'tundra', n: 'Põhjala tundrad', d: 'Lõputud lumeväljad ja põhjapõdrakarjad.', min: 120, lvl: 8, cost: { food: 80, wood: 50, gold: 60 }, rew: l => ({ gold: 300 + l * 40, fame: 30 + l * 3, wood: 100 + l * 10, xp: 120 + l * 12 }), rel: .26, map: .25 },
  { id: 'rabad', n: 'Udused rabad', d: 'Salapärased sood, kus helendavad virvatuled.', min: 240, lvl: 12, cost: { food: 120, water: 60, gold: 120 }, rew: l => ({ gold: 600 + l * 60, fame: 60 + l * 5, xp: 250 + l * 18 }), rel: .4, map: .35 },
  { id: 'kadunud', n: 'Kadunud kuningriik', d: 'Legendaarne linn, mida keegi pole ammu näinud.', min: 480, lvl: 18, cost: { food: 200, stone: 100, gold: 300 }, rew: l => ({ gold: 1500 + l * 120, fame: 150 + l * 10, xp: 600 + l * 30 }), rel: .7, map: .5, rare: true },
];
const EXP_STORY = {
  marja: ['Maasikaid oli nii palju, et korvid läksid rebenema.', 'Teel kohtusid nad sõbraliku siiliga.', 'Nad leidsid salajase vaarikasalu.'],
  kaljud: ['Koopas kajasid nende laulud.', 'Üks kaevur näitas neile vana kullasoont.', 'Varing jäi neist napilt mööda!'],
  varemed: ['Varemetes kõlasid kummalised sammud.', 'Vanalt müürilt leiti kuningate märgid.', 'Öö veedeti lõkke ääres tornis.'],
  tundra: ['Põhjapõdrad näitasid neile teed.', 'Virmalised valgustasid kogu öö.', 'Lumetorm sundis neid iglusse peitu.'],
  rabad: ['Virvatuled juhatasid neid saarekesele.', 'Rabahaldjas pakkus neile teed.', 'Udu seest kerkis vana kivisild.'],
  kadunud: ['Kuldsed väravad avanesid kriuksudes.', 'Linna keskel seisis tühi troon.', 'Varakambri uks oli lahti!'],
};
const EXPLORERS = ['Kaarel', 'Ilse', 'Ragnar', 'Merilin', 'Tõnis', 'Sigrid', 'Oskar', 'Vaike'];
const EVENTS = {
  laat: { n: 'Laat', ic: '🎪', d: 'Kuningriiki tuli suur laat! Turul makstakse kauba eest 40% rohkem.', dur: 240 },
  tuli: { n: 'Metsatulekahju', ic: '🔥', d: 'Mets põleb! Klõpsa põlevatel puudel, et need veega kustutada (3 vett).', dur: 75 },
  hirv: { n: 'Kuldne hirv', ic: '🦌', d: 'Metsa ilmus haruldane kuldne hirv! Leia ta kaardilt ja klõpsa temal, enne kui ta kaob.', dur: 60 },
  saadik: { n: 'Kuninglik saadik', ic: '📜', d: 'Naaberkuningas saatis saadiku, kes palub sõpruse märgiks kingitust.', dur: 300 },
  muusik: { n: 'Rändmuusikud', ic: '🎻', d: 'Rändmuusikud mängivad väljakul. Kuulsus kasvab sel ajal 50% kiiremini.', dur: 180 },
  taht: { n: 'Langenud täht', ic: '🌠', d: 'Öösel kukkus Kodumetsa täheke! Klõpsa sellel kaardil, et väärtuslikku maaki kaevata.', dur: 300 },
};

/* ---------- olek ---------- */
function ensureLife() {
  if (!S.life) S.life = {};
  const L = S.life;
  if (L.req === undefined) L.req = [];
  if (L.happy === undefined) L.happy = 60;
  if (L.rank === undefined) L.rank = 0;
  if (L.nextReq === undefined) L.nextReq = Date.now() + 60000;
  if (L.ev === undefined) L.ev = null;
  if (L.nextEv === undefined) L.nextEv = Date.now() + 4 * 60000;
  if (L.exp === undefined) L.exp = [];
  if (L.relics === undefined) L.relics = {};
  for (const k of ['reqDone', 'evDone', 'expDone', 'fires', 'deer']) if (S.st[k] === undefined) S.st[k] = 0;
  return L;
}
const lifeOn = () => S && S.life;
function relicFx(k) { let v = 0; if (!lifeOn()) return 0; for (const id in S.life.relics) { const f = RELICS[id] && RELICS[id].fx; if (f) v += (f[k] || 0) + (['wood', 'stone', 'berries', 'food', 'water', 'gold'].includes(k) ? (f.all || 0) : 0) } return v }
function expSlots() { return 1 + (S.level >= 8 ? 1 : 0) + (S.level >= 15 ? 1 : 0) }
function lifeSellMult() { return lifeOn() && S.life.ev && S.life.ev.k === 'laat' ? 1.4 : 1 }

/* ---------- auaste ---------- */
function rankStats() {
  return { b: S.buildings.filter(b => !b.done || b.up).length, r: RATES ? RATES.residents : 0, l: S.level, turg: S.buildings.some(b => b.type === 'turg' && (!b.done || b.up)) ? 1 : 0, loss: Math.max(0, ...S.buildings.filter(b => b.type === 'loss' && (!b.done || b.up)).map(b => b.lvl)), reg: Object.keys(S.regions).length };
}
function rankReqs(i) {
  const n = RANKS[i] && RANKS[i].need; if (!n) return [];
  const st = rankStats(), out = [];
  if (n.b) out.push({ t: `${n.b} hoonet`, ok: st.b >= n.b, v: st.b, g: n.b });
  if (n.r) out.push({ t: `${n.r} elanikku`, ok: st.r >= n.r, v: st.r, g: n.r });
  if (n.l) out.push({ t: `${n.l}. tase`, ok: st.l >= n.l, v: st.l, g: n.l });
  if (n.turg) out.push({ t: 'turg', ok: st.turg >= 1, v: st.turg, g: 1 });
  if (n.loss) out.push({ t: n.loss > 1 ? `loss ${n.loss}. tasemel` : 'loss', ok: st.loss >= n.loss, v: st.loss, g: n.loss });
  if (n.reg) out.push({ t: `${n.reg} piirkonda`, ok: st.reg >= n.reg, v: st.reg, g: n.reg });
  return out;
}
function checkRank() {
  const L = S.life;
  while (L.rank < RANKS.length - 1 && rankReqs(L.rank + 1).every(x => x.ok)) {
    L.rank++;
    const r = L.rank, rew = { gold: 100 * r * r, fame: 40 * r * r, xp: 60 * r * r };
    give(rew);
    if (!SILENT) { toast(`${S.kingdom} on nüüd ${RANKS[r].n.toLowerCase()}! ${rewardText(rew)}`, 'gold', 'fame'); if (typeof sparkle === 'function') sparkle(W / 2, H / 2, '#ffd286', 30) }
  }
}

/* ---------- elanike soovid ---------- */
function newRequest() {
  const L = S.life, used = L.req.map(q => q.who);
  const names = FOLK_NAMES.filter(n => !used.includes(n)); if (!names.length) return;
  const avail = ['wood', 'stone', 'berries', 'food', 'water'].filter(k => k !== 'stone' || S.level >= 2);
  const k = pick(avail), lvl = S.level, amt = Math.round((25 + lvl * 9) * rnd(.8, 1.3) / 5) * 5;
  const val = amt * (MBASE[k] || 2);
  const rew = { gold: Math.round(val * 1.2 + 20), fame: 4 + lvl * 2, xp: 12 + lvl * 4 };
  if (Math.random() < .12) rew.map = 1;
  L.req.push({ id: Date.now() + Math.floor(Math.random() * 1000), who: pick(names), k, amt, txt: pick(REQ_TXT[k]), rew, until: Date.now() + 40 * 60000 });
}
function deliverReq(id) {
  const L = S.life, q = L.req.find(x => x.id === id); if (!q) return;
  if (S.res[q.k] < q.amt) { toast(`Sul pole piisavalt: vaja ${q.amt} ${RES[q.k].g}.`, 'bad'); return }
  S.res[q.k] -= q.amt; give(q.rew); L.req = L.req.filter(x => x.id !== id); L.happy = Math.min(100, L.happy + 8); S.st.reqDone++;
  toast(`${q.who} on väga tänulik! ${rewardText(q.rew)}`, 'gold', 'fame');
  const f = folk.find(a => a.name === q.who); if (f && typeof hearts === 'function') hearts(f.x, f.y - .6);
}
function happyMult() { return lifeOn() ? .9 + S.life.happy * .003 : 1 }

/* ---------- sündmused ---------- */
function startEvent(k) {
  const L = S.life, E = EVENTS[k]; const ev = { k, until: Date.now() + E.dur * 1000, done: false };
  if (k === 'tuli') {
    const regs = Object.keys(S.regions).filter(r => S.regions[r].tiles.filter(t => t.t === 'tree' && t.s >= 2).length >= 4);
    if (!regs.length) return;
    const reg = regs.includes(S.view) ? S.view : pick(regs), trees = [];
    S.regions[reg].tiles.forEach((t, i) => { if (t.t === 'tree' && t.s >= 2) trees.push(i) });
    ev.reg = reg; ev.fires = []; for (let i = 0; i < 3 && trees.length; i++) ev.fires.push({ i: trees.splice(Math.floor(Math.random() * trees.length), 1)[0], t: 45 + i * 8 });
  }
  if (k === 'saadik') { const l = S.level; ev.ask = { food: 30 + l * 6, wood: 20 + l * 5 }; if (l >= 4) ev.ask.stone = 10 + l * 4; ev.rew = { fame: 30 + l * 8, gold: 60 + l * 20, xp: 30 + l * 6 } }
  if (k === 'taht') { const reg = S.regions.kodu, opts = []; reg.tiles.forEach((t, i) => { if (t.t === 'grass') opts.push(i) }); if (!opts.length) return; ev.reg = 'kodu'; ev.i = pick(opts); ev.hits = 4 }
  if (k === 'hirv') { ev.reg = S.view; ev.caught = false }
  L.ev = ev;
  if (k === 'hirv') spawnDeer();
  toast(`${E.ic} ${E.n}! ${E.d}`, k === 'tuli' ? 'bad' : 'gold', 'fame');
  if (k === 'tuli' && ev.reg !== S.view) toast(`Tulekahju on piirkonnas ${REGIONS[ev.reg].n}. Mine sinna kustutama!`, 'bad');
}
function endEvent(ok) {
  const L = S.life, ev = L.ev; if (!ev) return;
  if (ev.k === 'tuli' && ev.fires) {
    let burned = 0; const R = S.regions[ev.reg];
    for (const f of ev.fires) { const t = R && R.tiles[f.i]; if (t && t.t === 'tree') { t.t = 'stump'; delete t.s; delete t.g; delete t.k; burned++ } }
    if (burned) toast(`Tuli hävitas ${burned} puud. Uued puud saab istutada kändudele.`, 'bad'); else { toast('Tulekahju on kustutatud! Elanikud tänavad sind.', 'good'); S.life.happy = Math.min(100, S.life.happy + 6) }
    groundKey = '';
  }
  if (ev.k === 'hirv') for (const a of folk) if (a.deer) a.leave = true;
  if (ok) S.st.evDone++;
  L.ev = null; L.nextEv = Date.now() + rnd(7, 15) * 60000;
}
function evAction(a) {
  const L = S.life, ev = L.ev; if (!ev) return;
  if (ev.k === 'saadik' && a === 'give') {
    if (!canAfford(ev.ask)) { toast('Sul pole kingituseks piisavalt kaupa.', 'bad'); return }
    pay(ev.ask); give(ev.rew); toast(`Saadik kummardab sügavalt. ${rewardText(ev.rew)}`, 'gold', 'fame'); endEvent(true);
  } else if (ev.k === 'saadik' && a === 'no') { toast('Saadik lahkus pettunult.', 'info'); endEvent(false) }
  else if (ev.k === 'laat' && a === 'pidu') {
    const c = { food: 30 + S.level * 4, berries: 20 + S.level * 3 };
    if (ev.done) return; if (!canAfford(c)) { toast(`Peoks on vaja ${rewardText(c).replace(/\+/g, '')}.`, 'bad'); return }
    pay(c); const rew = { fame: 25 + S.level * 6, xp: 20 + S.level * 4 }; give(rew); ev.done = true; L.happy = Math.min(100, L.happy + 10);
    toast(`Laadapidu oli suurepärane! ${rewardText(rew)}`, 'gold', 'fame');
  } else if (ev.k === 'muusik' && a === 'kuula') {
    if (ev.done) return; const rew = { fame: 10 + S.level * 3, gold: 20 + S.level * 5 }; give(rew); ev.done = true; L.happy = Math.min(100, L.happy + 5);
    toast(`Muusikud mängisid sulle oma ilusaima loo. ${rewardText(rew)}`, 'gold', 'fame');
  } else if (a === 'go' && ev.reg) { setView(ev.reg) }
}
function fireAt(x, y) {
  const ev = lifeOn() && S.life.ev; if (!ev || ev.k !== 'tuli' || ev.reg !== S.view) return false;
  const i = y * W + x, f = ev.fires.find(z => z.i === i); if (!f) return false;
  if (S.res.water < 3) { toast('Kustutamiseks on vaja 3 vett. Too ämbriga vett tiigist!', 'bad'); return true }
  S.res.water -= 3; ev.fires = ev.fires.filter(z => z !== f); S.st.fires++; addXP(8 + S.level); S.fame += 2;
  floatText(x + .5, y, 'Kustutatud!', '#9fdcf0'); if (typeof ripple === 'function') ripple(x + .5, y + .7);
  if (!ev.fires.length) { give({ fame: 20 + S.level * 4, gold: 30 + S.level * 8 }); endEvent(true) }
  return true;
}
function starAt(x, y) {
  const ev = lifeOn() && S.life.ev; if (!ev || ev.k !== 'taht' || S.view !== 'kodu' || ev.i !== y * W + x) return false;
  ev.hits--; const g = 25 + S.level * 8; addRes('gold', g, x + .5, y + .2); addRes('stone', 10 + S.level * 2, x + .5, y + .5); addXP(6);
  if (typeof sparkle === 'function') sparkle(x + .5, y + .5, '#bfe8ff', 14);
  if (ev.hits <= 0) { if (Math.random() < .5) { S.maps = (S.maps || 0) + 1; toast('Tähekivi sees oli vana aardekaart!', 'gold') } if (Math.random() < .15) giveRelic(1, 3); endEvent(true) }
  return true;
}

/* ---------- ekspeditsioonid ---------- */
function expDur(E) { return E.min * 60000 * (1 - relicFx('exp')) }
function startExp(id) {
  const E = EXPEDS.find(e => e.id === id), L = S.life; if (!E) return;
  if (S.level < E.lvl) { toast(`See retk avaneb ${E.lvl}. tasemel.`, 'bad'); return }
  if (L.exp.length >= expSlots()) { toast('Kõik maadeuurijad on juba teel.', 'bad'); return }
  if (!canAfford(E.cost)) { toast('Retke varustamiseks pole piisavalt kaupa.', 'bad'); return }
  pay(E.cost);
  const who = pick(EXPLORERS.filter(n => !L.exp.some(x => x.who === n)));
  L.exp.push({ id: E.id, who, start: Date.now(), end: Date.now() + expDur(E) });
  toast(`${who} asus teele: ${E.n}. Tagasi ${fmtTime(expDur(E) / 1000)} pärast.`, 'good');
}
function claimExp(i) {
  const L = S.life, x = L.exp[i]; if (!x || Date.now() < x.end) return;
  const E = EXPEDS.find(e => e.id === x.id), rew = E.rew(S.level);
  for (const k in rew) if (k !== 'xp') rew[k] = Math.round(rew[k] * rnd(.85, 1.2));
  if (Math.random() < E.map) rew.map = 1;
  L.exp.splice(i, 1); give(rew); S.st.expDone++;
  let rel = '';
  if (Math.random() < E.rel) rel = giveRelic(E.rare ? 3 : 1, E.rare ? 5 : E.min >= 120 ? 4 : E.min >= 60 ? 3 : 2);
  showModal(() => `<h2>${esc(x.who)} on tagasi!</h2><div class="expstory"><canvas data-exp="${E.id}"></canvas><p>„${pick(EXP_STORY[E.id])}“</p></div><p class="lead">Retk: <b>${E.n}</b></p><div class="rew big">${rewardHTML(rew)}</div>${rel}<div class="mbtns"><button class="btn" type="button" data-act="closeModal">Suurepärane!</button></div>`);
}
function giveRelic(minR, maxR) {
  const opts = RELIC_ORDER.filter(k => RELICS[k].r >= minR && RELICS[k].r <= maxR);
  const w = opts.map(k => 1 / Math.pow(2, RELICS[k].r)), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, id = opts[0];
  for (let i = 0; i < opts.length; i++) { r -= w[i]; if (r <= 0) { id = opts[i]; break } }
  const R = RELICS[id];
  if (S.life.relics[id]) { const g = 100 * R.r * R.r; give({ gold: g }); return `<p class="lead">Leiti veel üks <b>${R.n}</b>. Sul on see juba olemas, nii et müüsid selle ${g} kulla eest.</p>` }
  S.life.relics[id] = Date.now();
  toast(`Uus aare varakambris: ${R.n}! ${R.d}.`, 'gold', 'fame');
  return `<div class="relicnew" style="--rc:${REL_COL[R.r]}"><canvas data-relic="${id}"></canvas><div><b>Uus leid varakambrisse: ${R.n}</b><small style="color:${REL_COL[R.r]}">${REL_RN[R.r]}</small><small>${R.d}</small></div></div>`;
}

/* ---------- loogika iga tiksuga ---------- */
let lifeAcc = 0;
function lifeTick(dt, silent) {
  if (!S) return; const L = ensureLife(); lifeAcc += dt;
  if (lifeAcc < 1) return; lifeAcc = 0;
  const now = Date.now();
  if (RATES && RATES.residents > 0 && L.req.length < 3 && now >= L.nextReq) { newRequest(); L.nextReq = now + rnd(6, 12) * 60000; if (!silent) toastOnce('req', `${L.req[L.req.length - 1].who} palub abi. Vaata elanike soove vahekaardil Kuningriik.`, 'info') }
  const exp = L.req.filter(q => now > q.until); if (exp.length) { L.req = L.req.filter(q => now <= q.until); L.happy = Math.max(0, L.happy - 5 * exp.length) }
  if (S.res.food < 1 && RATES && RATES.residents > 0) L.happy = Math.max(0, L.happy - .05);
  else if (L.happy < 60) L.happy = Math.min(60, L.happy + .01);
  checkRank();
  if (L.ev) {
    if (L.ev.k === 'tuli' && L.ev.fires) {
      for (const f of L.ev.fires) f.t -= 1;
      const burnt = L.ev.fires.filter(f => f.t <= 0); const R = S.regions[L.ev.reg];
      for (const f of burnt) { const t = R.tiles[f.i]; if (t && t.t === 'tree') { t.t = 'stump'; delete t.s; delete t.g; delete t.k; groundKey = '' } }
      if (burnt.length) {
        L.ev.fires = L.ev.fires.filter(f => f.t > 0);
        // tuli võib levida naaberpuule
        for (const f of burnt) { const x = f.i % W, y = Math.floor(f.i / W); const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => (y + b) * W + x + a).filter(i => i >= 0 && i < W * H && R.tiles[i].t === 'tree' && !L.ev.fires.some(z => z.i === i)); if (nb.length && Math.random() < .5) L.ev.fires.push({ i: pick(nb), t: 25 }) }
        if (!silent) toast('Üks puu põles maha!', 'bad');
      }
      if (!L.ev.fires.length) endEvent(false);
    }
    if (L.ev && now > L.ev.until) { if (L.ev.k === 'saadik' && !silent) toast('Saadik ei jõudnud kingitust ära oodata ja lahkus.', 'info'); endEvent(false) }
  } else if (!silent && S.level >= 2 && now >= L.nextEv) {
    const night = typeof skyState === 'function' && skyState().dark > .5;
    const opts = ['laat', 'saadik', 'muusik', 'hirv', 'tuli'].filter(k => k !== 'laat' || S.buildings.some(b => b.type === 'turg'));
    if (night) opts.push('taht', 'taht');
    startEvent(pick(opts)); if (!L.ev) L.nextEv = now + 3 * 60000;
  }
}
{
  const _tick = tick;
  tick = function (dt, silent) { _tick(dt, silent); if (S) lifeTick(dt, silent) };
  const _cr = computeRates;
  computeRates = function () {
    const r = _cr(); if (!S || !S.life) return r;
    const rk = S.life.rank || 0;
    for (const k of RES_KEYS) if (r.net[k] > 0) r.net[k] *= 1 + .03 * rk + relicFx(k);
    // õnnelikud elanikud maksavad rohkem makse
    let houseGold = 0; for (const b of S.buildings) if (b.type === 'elumaja' && !b.done && r.status[b.id] && r.status[b.id].s !== 'stall') houseGold += bEffect(b).prod.gold || 0;
    r.net.gold += houseGold * (happyMult() - 1);
    r.fame *= (1 + .05 * rk + relicFx('fame')) * (S.life.ev && S.life.ev.k === 'muusik' ? 1.5 : 1);
    r.gather += relicFx('gather');
    return r;
  };
  const _it = interactTile;
  interactTile = function (x, y) { if (fireAt(x, y) || starAt(x, y)) return; return _it(x, y) };
  const _tt = tryTame;
  tryTame = function (a) { if (a.folk) return folkClick(a); if (a.deer) return deerClick(a); return _tt(a) };
  const _bd = badges;
  badges = function () { const b = _bd(); if (S && S.life) { b.kuningriik = (b.kuningriik || 0) + S.life.req.filter(q => S.res[q.k] >= q.amt).length; b.seiklused = (b.seiklused || 0) + S.life.exp.filter(x => Date.now() >= x.end).length } return b };
  const _ds = describe;
  describe = function (x, y, fx, fy) {
    const ev = S.life && S.life.ev;
    if (ev && ev.k === 'tuli' && ev.reg === S.view && ev.fires.some(f => f.i === y * W + x)) return 'Puu põleb! Klõpsa, et kustutada (3 vett).';
    if (ev && ev.k === 'taht' && S.view === 'kodu' && ev.i === y * W + x) return `Langenud täht. Klõpsa, et maaki kaevata (${ev.hits} korda veel).`;
    const a = UI.tool === 'kogu' && animalAt(fx, fy);
    if (a && a.folk) { const q = S.life.req.find(z => z.who === a.name); return q ? `${a.name} ${q.txt} ja vajab ${q.amt} ${RES[q.k].g}. Klõpsa, et aidata.` : `${a.name}, ${a.job}. Klõpsa, et tervitada.` }
    if (a && a.deer) return 'Kuldne hirv! Klõpsa kiiresti!';
    return _ds(x, y, fx, fy);
  };
  const _aa = animalAt;
  animalAt = function (fx, fy) { const a = _aa(fx, fy); if (a) return a; let best = null, bd = 1e9; for (const f of folk) { if (f.inside || f.leave) continue; const d = Math.hypot(f.x - fx, f.y - .3 - fy); if (d < (f.deer ? .6 : .38) && d < bd) { best = f; bd = d } } return best };
  const _eg = enterGame;
  enterGame = function () { if (S) ensureLife(); _eg(); setTimeout(lifeHud, 50) };
}
function folkClick(a) {
  const q = S.life.req.find(z => z.who === a.name);
  if (q) { showReqModal(q); return }
  const lines = ['Tere, valitseja!', 'Ilus päev täna!', 'Aitäh, et meie eest hoolitsed!', 'Kas kuulsid, et metsas nähti kuldset hirve?', 'Mul on nii hea siin elada.', 'Kõht on täis ja süda rõõmus!'];
  a.say = S.life.happy < 30 ? 'Meil on raske... toitu napib.' : pick(lines); a.sayT = 3; if (typeof hearts === 'function' && S.life.happy >= 50) hearts(a.x, a.y - .6);
}
function deerClick(a) {
  const ev = S.life.ev; if (!ev || ev.k !== 'hirv' || ev.caught) return;
  ev.caught = true; a.leave = true; S.st.deer++;
  const rew = { gold: 80 + S.level * 25, fame: 20 + S.level * 5, xp: 30 + S.level * 6 }; if (Math.random() < .35) rew.map = 1;
  give(rew); if (typeof sparkle === 'function') sparkle(a.x, a.y - .5, '#ffd060', 30);
  if (Math.random() < .2) giveRelic(1, 3);
  toast(`Kuldne hirv andis sulle oma õnnistuse! ${rewardText(rew)}`, 'gold', 'fame'); endEvent(true);
}
function showReqModal(q) {
  showModal(() => {
    if (!S.life.req.includes(q)) return null;
    const ok = S.res[q.k] >= q.amt;
    return `<h2>${esc(q.who)} palub abi</h2><div class="reqbig"><canvas data-folk="${esc(q.who)}"></canvas><p>„Valitseja, ma ${q.txt}. Kas sa saaksid mulle anda <b>${q.amt} ${RES[q.k].g}</b>?“</p></div>
      <div class="rew">Tänutäheks: ${rewardHTML(q.rew)}</div><p class="lead">Soov kehtib veel ${fmtTime((q.until - Date.now()) / 1000)}. Täidetud soovid teevad elanikud õnnelikumaks ja nad maksavad rohkem makse.</p>
      <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Hiljem</button><button class="btn" type="button" data-act="reqGive" data-arg="${q.id}" ${ok ? '' : 'disabled'}>${ok ? `Anna ${q.amt} ${RES[q.k].g}` : `Puudu ${fmt(q.amt - S.res[q.k])} ${RES[q.k].g}`}</button></div>`;
  });
}

/* ---------- elanikud kaardil ---------- */
let folk = [];
function folkList() { return folk }
function regionResidents(rk) { return S.buildings.filter(b => b.region === rk && b.type === 'elumaja' && (!b.done || b.up)).reduce((a, b) => a + 4 * b.lvl, 0) }
function spawnFolk() {
  folk = []; if (!S || !S.life) return;
  const res = regionResidents(S.view), n = Math.min(12, Math.ceil(res / 3)) + (S.life.ev && S.life.ev.k === 'laat' && S.view === 'kodu' ? 4 : 0);
  const homes = S.buildings.filter(b => b.region === S.view && b.type === 'elumaja' && (!b.done || b.up));
  for (let i = 0; i < n; i++) {
    const seed = hashStr(S.created + ':' + S.view + ':' + i), r = mulberry32(seed), nm = FOLK_NAMES[seed % FOLK_NAMES.length];
    const home = homes.length ? homes[i % homes.length] : null, p = home ? { x: home.x + .5, y: home.y + 1.05 } : randLand();
    folk.push({ folk: true, name: i < FOLK_NAMES.length ? FOLK_NAMES[(seed >> 3) % FOLK_NAMES.length] : nm, x: p.x + rnd(-.3, .3), y: Math.min(H - .1, p.y), tx: p.x, ty: p.y, wait: rnd(0, 3), ph: 0, f: 1,
      skin: FOLK_SKIN[Math.floor(r() * FOLK_SKIN.length)], hair: FOLK_HAIR[Math.floor(r() * FOLK_HAIR.length)], cloth: FOLK_CLOTH[Math.floor(r() * FOLK_CLOTH.length)], dress: r() < .5, hat: r() < .35 ? Math.floor(r() * 3) : -1,
      job: pick(['puuraidur', 'aednik', 'kaevur', 'kalur', 'pagar', 'sepp', 'karjane']), home, carry: null, visitor: i >= Math.min(12, Math.ceil(res / 3)) });
  }
  // nimed on ainulaadsed
  const used = new Set(); for (const f of folk) { let k = 0; while (used.has(f.name) && k < 30) { f.name = FOLK_NAMES[(FOLK_NAMES.indexOf(f.name) + 1) % FOLK_NAMES.length]; k++ } used.add(f.name) }
  if (S.life.ev && S.life.ev.k === 'hirv' && S.life.ev.reg === S.view && !S.life.ev.caught) spawnDeer();
}
function spawnDeer() { if (!S || S.view !== (S.life.ev && S.life.ev.reg)) return; const p = randLand(); folk.push({ deer: true, x: Math.random() < .5 ? -.5 : W + .5, y: p.y, tx: p.x, ty: p.y, wait: 0, ph: 0, f: 1 }) }
function updateLife(dt) {
  if (!S || !S.life) return;
  if (folk._view !== S.view || folk._n !== S.buildings.length) { const v = S.view, n = S.buildings.length; spawnFolk(); folk._view = v; folk._n = n }
  const tiles = S.regions[S.view].tiles, sky = typeof skyState === 'function' ? skyState() : { dark: 0 }, nightOn = sky.dark > .55;
  const spots = []; S.buildings.forEach(b => { if (b.region === S.view) spots.push({ x: b.x + .5, y: Math.min(H - .2, b.y + 1.02) }) });
  for (const a of folk) {
    if (a.sayT > 0) a.sayT -= dt;
    if (a.deer) {
      if (a.leave) { a.tx = a.x < W / 2 ? -2 : W + 2; const dx = a.tx - a.x; a.x += Math.sign(dx) * 4 * dt; a.f = dx < 0 ? -1 : 1; a.ph += dt * 16; a.moving = true; if (a.x < -1.5 || a.x > W + 1.5) a.dead = true; continue }
      const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
      if (d < .1) { const p = randLand(); a.tx = p.x; a.ty = p.y; a.moving = false } else { const st = Math.min(d, 2.4 * dt); a.x += dx / d * st; a.y += dy / d * st; a.f = dx < 0 ? -1 : 1; a.ph += dt * 14; a.moving = true }
      continue;
    }
    // öösel lähevad elanikud koju (kaks jäävad laternaga valvama)
    const goHome = nightOn && a.home && folk.indexOf(a) > 1;
    if (goHome) { a.tx = a.home.x + .5; a.ty = Math.min(H - .1, a.home.y + 1.02) }
    if (a.wait > 0) { a.wait -= dt; a.moving = false; continue }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    a.inside = goHome && d < .15;
    if (d < .05) {
      if (goHome) { a.moving = false; continue }
      a.wait = rnd(1.5, 5); a.moving = false;
      if (a.carry) a.carry = null; else if (Math.random() < .4) a.carry = pick(['log', 'basket', 'bucket', 'sack']);
      if (Math.random() < .12 && !a.sayT) { a.say = pick(['♪', '♥', '…', '☺']); a.sayT = 2 }
      const target = spots.length && Math.random() < .55 ? pick(spots) : null;
      if (target) { a.tx = target.x + rnd(-.2, .2); a.ty = target.y }
      else for (let k = 0; k < 20; k++) { const nx = clamp(a.x + rnd(-3, 3), .3, W - .3), ny = clamp(a.y + rnd(-2.5, 2.5), .5, H - .15), t = tiles[Math.floor(ny) * W + Math.floor(nx)]; if (t && (t.t === 'grass' || t.t === 'stump' || t.t === 'bush')) { a.tx = nx; a.ty = ny; break } }
    } else {
      const sp = (S.weather.t === 'vihm' ? 1.5 : 1) * (a.carry ? .7 : 1) * .9, st = Math.min(d, sp * dt); a.x += dx / d * st; a.y += dy / d * st;
      if (Math.abs(dx) > .02) a.f = dx < 0 ? -1 : 1; a.ph += dt * 9; a.moving = true;
    }
  }
  folk = Object.assign(folk.filter(a => !a.dead), { _view: folk._view, _n: folk._n });
}
function drawFolk(c, a, x, y, s, night) {
  if (a.deer) return drawGoldDeer(c, a, x, y, s);
  if (a.inside) return;
  const u = s / 40, sw = a.moving ? Math.sin(a.ph) : 0, bob = a.moving ? Math.abs(Math.sin(a.ph)) * u * 1.2 : 0, f = a.f;
  c.save(); c.translate(x, y - bob); c.scale(f, 1);
  shadow(c, 0, bob, u * 6, u * 2);
  // jalad
  c.strokeStyle = shade(a.cloth, -.5); c.lineWidth = u * 2.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-u * 1.5, -u * 6); c.lineTo(-u * 1.5 + sw * u * 2.5, -u * .5); c.moveTo(u * 1.5, -u * 6); c.lineTo(u * 1.5 - sw * u * 2.5, -u * .5); c.stroke();
  ell(c, -u * 1.5 + sw * u * 2.5 + u * .6, -u * .4, u * 1.6, u * .9, '#3a2a1a'); ell(c, u * 1.5 - sw * u * 2.5 + u * .6, -u * .4, u * 1.6, u * .9, '#3a2a1a');
  // keha
  const g = c.createLinearGradient(-u * 4, 0, u * 4, 0); g.addColorStop(0, shade(a.cloth, .15)); g.addColorStop(1, shade(a.cloth, -.25));
  c.fillStyle = g; c.beginPath();
  if (a.dress) { c.moveTo(-u * 2.6, -u * 14); c.lineTo(u * 2.6, -u * 14); c.lineTo(u * 4.2, -u * 4.5); c.lineTo(-u * 4.2, -u * 4.5) } else { c.moveTo(-u * 3, -u * 14); c.lineTo(u * 3, -u * 14); c.lineTo(u * 3.2, -u * 6); c.lineTo(-u * 3.2, -u * 6) }
  c.closePath(); c.fill();
  if (!a.dress) rect(c, -u * 3.2, -u * 7.5, u * 6.4, u * 1.2, '#3a2a1a');
  else { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = u * .8; c.beginPath(); c.moveTo(-u * 3.8, -u * 6); c.lineTo(u * 3.8, -u * 6); c.stroke() }
  // käed ja kantav ese
  c.strokeStyle = a.skin; c.lineWidth = u * 1.8;
  const armF = a.carry ? -u * 3 : sw * u * 2.5;
  c.beginPath(); c.moveTo(u * 2.5, -u * 13); c.lineTo(u * 3.5 + (a.carry ? u * 1.5 : armF), a.carry ? -u * 10 : -u * 8); c.stroke();
  c.beginPath(); c.moveTo(-u * 2.5, -u * 13); c.lineTo(-u * 3.2 - armF * .6, -u * 8); c.stroke();
  if (a.carry === 'log') { rect(c, u * 1, -u * 12.5, u * 9, u * 2.6, '#8a5a30'); ell(c, u * 10, -u * 11.2, u * 1.2, u * 1.3, '#e2b27a') }
  else if (a.carry === 'basket') { c.fillStyle = '#b8864a'; c.beginPath(); c.moveTo(u * 2.5, -u * 11.5); c.lineTo(u * 8, -u * 11.5); c.lineTo(u * 7, -u * 8); c.lineTo(u * 3.5, -u * 8); c.fill(); circ(c, u * 4.2, -u * 12, u * 1, '#c8344f'); circ(c, u * 6, -u * 12.3, u * 1, '#e85a6a'); circ(c, u * 7.2, -u * 11.8, u * .9, '#c8344f') }
  else if (a.carry === 'bucket') { rect(c, u * 4, -u * 9.5, u * 3.6, u * 3.5, '#7a8a90'); rect(c, u * 4, -u * 9.5, u * 3.6, u * .9, '#9fdcf0') }
  else if (a.carry === 'sack') { ell(c, u * 5.5, -u * 11, u * 3, u * 3.4, '#c8b080'); rect(c, u * 4.8, -u * 14.5, u * 1.4, u * 1.4, '#8a7a50') }
  // pea
  circ(c, 0, -u * 17, u * 3.2, a.skin);
  c.fillStyle = a.hair; c.beginPath(); c.arc(0, -u * 17.6, u * 3.3, Math.PI * 1.05, Math.PI * 2.05); c.fill();
  if (a.dress && a.hat < 0) { ell(c, -u * 2.8, -u * 15.5, u * 1.2, u * 2.4, a.hair) }
  circ(c, u * 1.5, -u * 17.2, u * .45, '#2a1a10');
  if (a.hat === 0) { ell(c, 0, -u * 19.5, u * 4.6, u * 1.2, '#c8a050'); ell(c, 0, -u * 20.3, u * 2.6, u * 1.8, '#d8b060') }
  else if (a.hat === 1) { c.fillStyle = '#c83a2a'; c.beginPath(); c.arc(0, -u * 18.5, u * 3.3, Math.PI, 0); c.fill() }
  else if (a.hat === 2) { c.fillStyle = '#e8e0d0'; c.beginPath(); c.moveTo(-u * 3.4, -u * 18); c.quadraticCurveTo(0, -u * 22, u * 3.4, -u * 18); c.fill() }
  if (season().k === 'talv') { rect(c, -u * 2.8, -u * 14.6, u * 5.6, u * 1.6, '#c83a3a') }
  c.restore();
  // latern öösel
  if (night > .4 && !a.home || night > .4 && folk.indexOf(a) <= 1) { const lx = x + a.f * u * 5, ly = y - u * 8; circ(c, lx, ly, u * 1.4, '#ffd070'); c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(lx, ly, 0, lx, ly, s * .9); gl.addColorStop(0, `rgba(255,190,90,${.5 * night})`); gl.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = gl; c.fillRect(lx - s, ly - s, s * 2, s * 2); c.restore() }
  // soovi märk või jutumull
  const q = S.life.req.find(z => z.who === a.name);
  if (q) { const by = y - u * 26 + Math.sin(tnow * 3) * u; circ(c, x, by, u * 4, '#ffd060'); c.fillStyle = '#5a3a0a'; c.font = `900 ${Math.round(u * 6)}px system-ui`; c.textAlign = 'center'; c.fillText('!', x, by + u * 2.2) }
  else if (a.sayT > 0 && a.say) { c.font = `700 ${Math.max(10, Math.round(u * 5))}px system-ui`; const tw = c.measureText(a.say).width + u * 4, by = y - u * 27; c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.roundRect ? c.roundRect(x - tw / 2, by - u * 4.5, tw, u * 7, u * 3) : c.rect(x - tw / 2, by - u * 4.5, tw, u * 7); c.fill(); c.fillStyle = '#2a2a2a'; c.textAlign = 'center'; c.fillText(a.say, x, by + u * 1) }
}
function drawGoldDeer(c, a, x, y, s) {
  const u = s / 40, sw = a.moving ? Math.sin(a.ph) : 0;
  c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x, y - u * 12, 0, x, y - u * 12, s * 1.1); gl.addColorStop(0, 'rgba(255,220,120,.5)'); gl.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = gl; c.fillRect(x - s * 1.2, y - s * 1.6, s * 2.4, s * 2.4); c.restore();
  c.save(); c.translate(x, y); c.scale(a.f, 1); shadow(c, 0, 0, u * 9, u * 2.5);
  c.strokeStyle = '#c8901a'; c.lineWidth = u * 1.6; c.lineCap = 'round';
  for (const [lx, k] of [[-6, 1], [-3, -1], [5, 1], [8, -1]]) { c.beginPath(); c.moveTo(u * lx, -u * 9); c.lineTo(u * lx + sw * k * u * 2.5, 0); c.stroke() }
  const g = c.createLinearGradient(0, -u * 16, 0, -u * 8); g.addColorStop(0, '#fff0a0'); g.addColorStop(1, '#d89a20'); c.fillStyle = g;
  c.beginPath(); c.ellipse(u, -u * 11, u * 9, u * 4, 0, 0, 6.283); c.fill();
  c.beginPath(); c.moveTo(u * 7, -u * 13); c.lineTo(u * 11, -u * 20); c.lineTo(u * 14, -u * 18); c.lineTo(u * 10, -u * 11); c.fill();
  ell(c, u * 13.5, -u * 20, u * 3, u * 2, '#ffe080'); circ(c, u * 14.5, -u * 20.6, u * .6, '#3a2a10');
  c.strokeStyle = '#fff0b0'; c.lineWidth = u * 1.1; c.beginPath(); c.moveTo(u * 12, -u * 22); c.lineTo(u * 10, -u * 27); c.lineTo(u * 8, -u * 29); c.moveTo(u * 10, -u * 27); c.lineTo(u * 12, -u * 29); c.moveTo(u * 13.5, -u * 22); c.lineTo(u * 15, -u * 27); c.lineTo(u * 17, -u * 28); c.stroke();
  c.restore();
  for (let i = 0; i < 3; i++) { const k = (tnow * .8 + i / 3) % 1; c.fillStyle = `rgba(255,240,170,${1 - k})`; c.beginPath(); c.arc(x - a.f * u * (6 + k * 10), y - u * (8 + k * 8), u * (1.4 - k), 0, 6.283); c.fill() }
}
// tulekahju ja langenud täht kaardil
function drawLifeOverlay(c, s) {
  const ev = S.life && S.life.ev; if (!ev) return;
  if (ev.k === 'tuli' && ev.reg === S.view) for (const f of ev.fires) {
    const x = (f.i % W + .5) * s, y = (Math.floor(f.i / W) + .5) * s;
    c.save(); c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(x, y, 0, x, y, s * .9); gl.addColorStop(0, 'rgba(255,140,40,.55)'); gl.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = gl; c.fillRect(x - s, y - s, s * 2, s * 2);
    for (let i = 0; i < 6; i++) { const k = (tnow * 1.6 + i / 6) % 1, fx = x + Math.sin(i * 2.1 + tnow * 4) * s * .18, fy = y + s * .2 - k * s * .7; c.fillStyle = `rgba(${255},${Math.round(200 - k * 150)},40,${.9 * (1 - k)})`; c.beginPath(); c.ellipse(fx, fy, s * .09 * (1 - k * .5), s * .16 * (1 - k * .4), 0, 0, 6.283); c.fill() }
    c.restore();
    for (let i = 0; i < 3; i++) { const k = (tnow * .5 + i / 3) % 1; circ(c, x + Math.sin(k * 5 + i) * s * .2, y - s * .5 - k * s * .9, s * (.08 + k * .2), `rgba(80,80,80,${.45 * (1 - k)})`) }
    c.fillStyle = '#fff'; c.font = `900 ${Math.round(s * .3)}px system-ui`; c.textAlign = 'center'; c.fillText(Math.ceil(f.t) + '', x, y + s * .55);
  }
  if (ev.k === 'taht' && S.view === 'kodu') {
    const x = (ev.i % W + .5) * s, y = (Math.floor(ev.i / W) + .6) * s;
    c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x, y, 0, x, y, s * 1.2); gl.addColorStop(0, `rgba(160,220,255,${.5 + Math.sin(tnow * 3) * .15})`); gl.addColorStop(1, 'rgba(160,220,255,0)'); c.fillStyle = gl; c.fillRect(x - s * 1.3, y - s * 1.3, s * 2.6, s * 2.6); c.restore();
    ell(c, x, y + s * .1, s * .4, s * .12, 'rgba(40,30,20,.5)');
    c.beginPath(); c.moveTo(x - s * .3, y + s * .05); c.lineTo(x - s * .18, y - s * .3); c.lineTo(x + s * .1, y - s * .38); c.lineTo(x + s * .3, y - s * .1); c.lineTo(x + s * .25, y + s * .1); c.closePath();
    const g2 = c.createLinearGradient(x - s * .3, y - s * .4, x + s * .3, y + s * .1); g2.addColorStop(0, '#e8f6ff'); g2.addColorStop(.5, '#8ac8f0'); g2.addColorStop(1, '#3a6a9a'); c.fillStyle = g2; c.fill();
    for (let i = 0; i < 4; i++) { const k = (tnow * .6 + i / 4) % 1; c.fillStyle = `rgba(230,250,255,${1 - k})`; c.beginPath(); c.arc(x + Math.sin(i * 1.7) * s * .3, y - s * .3 - k * s * .5, s * .03, 0, 6.283); c.fill() }
  }
}

/* ---------- sündmuse riba kaardil ---------- */
function lifeHud() {
  let el = document.getElementById('evBanner');
  if (!el) { el = document.createElement('div'); el.id = 'evBanner'; el.className = 'evbanner'; const mw = document.getElementById('mapWrap'); if (mw) mw.appendChild(el) }
  const ev = S && S.life && S.life.ev;
  if (!ev) { el.hidden = true; el.dataset.k = ''; return }
  const E = EVENTS[ev.k], left = Math.max(0, (ev.until - Date.now()) / 1000);
  let btns = '';
  if (ev.k === 'saadik') btns = `<span class="evask">Palub: ${rewardHTML(ev.ask).replace(/\+/g, '')}</span><button class="btn sm" type="button" data-act="evAct" data-arg="give" ${canAfford(ev.ask) ? '' : 'disabled'}>Anna kingitus</button><button class="btn sm ghost" type="button" data-act="evAct" data-arg="no">Keeldu</button>`;
  else if (ev.k === 'laat' && !ev.done) btns = `<button class="btn sm" type="button" data-act="evAct" data-arg="pidu">Korralda laadapidu</button>`;
  else if (ev.k === 'muusik' && !ev.done) btns = `<button class="btn sm" type="button" data-act="evAct" data-arg="kuula">Kuula muusikuid</button>`;
  else if ((ev.k === 'tuli' || ev.k === 'hirv' || ev.k === 'taht') && ev.reg && ev.reg !== S.view) btns = `<button class="btn sm" type="button" data-act="evAct" data-arg="go">Mine: ${REGIONS[ev.reg].n}</button>`;
  const html = `<span class="evic">${E.ic}</span><div class="evtx"><b>${E.n}</b> <small>${ev.k === 'tuli' ? `${ev.fires.length} puud põleb · ` : ''}${fmtTime(left)}</small><small class="evd">${E.d}</small></div><div class="evbtn">${btns}</div>`;
  if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html }
  el.hidden = false;
}
setInterval(() => { if (S && S.life && typeof running !== 'undefined' && running) lifeHud() }, 500);

/* ---------- vahekaardid ---------- */
function rankEmblem(r) { return ['🏕️', '🏡', '🏘️', '🏙️', '🏰', '👑'][r] }
function lifeKingdomHtml() {
  const L = ensureLife(), r = L.rank, nx = RANKS[r + 1];
  let h = `<div class="card rankcard"><div class="rankhead"><span class="rankem">${rankEmblem(r)}</span><div><div class="sec-h" style="margin:0">${RANKS[r].n} <small>auaste ${r + 1} / ${RANKS.length}</small></div><p class="lead">${RANKS[r].d} Boonus: tootmine +${3 * r}%, kuulsus +${5 * r}%.</p></div></div>`;
  if (nx) { const reqs = rankReqs(r + 1); h += `<p class="lead" style="margin:6px 0 4px">Järgmine auaste: <b>${nx.n}</b></p><div class="rankreq">${reqs.map(x => `<span class="${x.ok ? 'ok' : ''}">${x.ok ? '✓' : '○'} ${x.t}${x.ok ? '' : ` (${fmt(x.v)}/${x.g})`}</span>`).join('')}</div>` }
  else h += '<p class="lead"><b>Sinu riik on jõudnud kõrgeima auastmeni!</b></p>';
  h += '</div>';
  const hp = Math.round(L.happy), face = hp >= 75 ? '😄' : hp >= 50 ? '🙂' : hp >= 30 ? '😐' : '😟';
  h += `<div class="card"><div class="sec-h" style="margin:0">Elanike soovid <small>${face} õnnelikkus ${hp}%</small></div><div class="bar ${hp >= 50 ? 'green' : ''}" style="margin:6px 0"><i style="width:${hp}%"></i></div>
    <p class="lead">Õnnelikud elanikud maksavad rohkem makse (praegu ${happyMult() >= 1 ? '+' : ''}${Math.round((happyMult() - 1) * 100)}%). Täida nende soove ja hoia toitu laos. Soovi esitajal on kaardil kollane hüüumärk.</p>`;
  if (!RATES.residents) h += '<p class="lead">Ehita elumaja, et kuningriiki tuleksid elanikud.</p>';
  else if (!L.req.length) h += `<p class="lead">Praegu pole kellelgi soove. Uus soov tuleb ${fmtTime(Math.max(0, L.nextReq - Date.now()) / 1000)} pärast.</p>`;
  else h += `<div class="cards">${L.req.map(q => { const ok = S.res[q.k] >= q.amt; return `<div class="card qcard ${ok ? 'done' : ''}"><div><h3>${esc(q.who)} ${q.txt}</h3><div class="rew">Vajab: ${ic(q.k)} ${q.amt} ${RES[q.k].g} · Tänu: ${rewardHTML(q.rew)}</div><small class="lead">Aega ${fmtTime((q.until - Date.now()) / 1000)}</small></div><button class="btn sm" type="button" data-act="reqGive" data-arg="${q.id}" ${ok ? '' : 'disabled'}>Aita</button></div>` }).join('')}</div>`;
  h += '</div>';
  const own = RELIC_ORDER.filter(k => L.relics[k]).length;
  h += `<div class="card"><div class="sec-h" style="margin:0">Varakamber <small>${own} / ${RELIC_ORDER.length}</small></div><p class="lead">Ekspeditsioonidelt ja sündmustelt leitud aarded. Iga aare annab kuningriigile püsiva boonuse.</p><div class="relics">${RELIC_ORDER.map(k => { const R = RELICS[k], has = L.relics[k]; return `<div class="relic ${has ? '' : 'no'}" style="--rc:${REL_COL[R.r]}" title="${has ? R.n + ': ' + R.d : 'Leidmata'}"><canvas data-relic="${k}" data-unk="${has ? 0 : 1}"></canvas><b>${has ? R.n : '???'}</b><small>${has ? R.d : REL_RN[R.r]}</small></div>` }).join('')}</div></div>`;
  return h;
}
function lifeExpHtml() {
  const L = ensureLife(), slots = expSlots();
  let h = `<div class="card adv"><div class="advhead"><span class="ic lg">${ICON.map}</span><div><h3>Ekspeditsioonid</h3><p class="lead">Saada maadeuurijad kaugetele retkedele. Nad on teel päriselt mitu minutit või tundi, ka siis, kui mäng on kinni, ja toovad tagasi kaupa, kulda, kuulsust ning haruldasi aardeid varakambrisse.</p></div></div>
    <dl class="stats"><dt>Maadeuurijaid</dt><dd>${slots}${slots < 3 ? ` <small class="lead">(+1 ${S.level < 8 ? '8.' : '15.'} tasemel)</small>` : ''}</dd><dt>Tehtud retki</dt><dd>${S.st.expDone}</dd></dl>`;
  if (L.exp.length) h += `<div class="cards">${L.exp.map((x, i) => { const E = EXPEDS.find(e => e.id === x.id), tot = x.end - x.start, left = x.end - Date.now(), pct = Math.min(100, (1 - left / tot) * 100); return `<div class="card qcard ${left <= 0 ? 'done' : ''}"><div class="expgo"><canvas data-exp="${E.id}"></canvas><div><h3>${esc(x.who)}: ${E.n}</h3><div class="bar green" style="margin:5px 0"><i style="width:${pct.toFixed(1)}%"></i></div><small class="lead">${left <= 0 ? 'Tagasi! Vaata, mida tõid.' : 'Tagasi ' + fmtTime(left / 1000) + ' pärast'}</small></div></div>${left <= 0 ? `<button class="btn sm" type="button" data-act="expClaim" data-arg="${i}">Vaata saaki</button>` : ''}</div>` }).join('')}</div>`;
  h += `<div class="sec-h">Sihtkohad</div><div class="cards">${EXPEDS.map(E => { const lock = S.level < E.lvl, busy = L.exp.length >= slots; return `<div class="card qcard ${lock ? 'locked' : ''}" style="${lock ? 'opacity:.6' : ''}"><div class="expgo"><canvas data-exp="${E.id}"></canvas><div><h3>${E.n} <small class="lead">${fmtTime(expDur(E) / 1000)}</small></h3><small class="lead">${E.d}</small><div class="rew">Toob umbes: ${rewardHTML(E.rew(S.level))}${E.rel ? ` · aare ${Math.round(E.rel * 100)}%` : ''}</div>${lock ? `<span class="lockmsg">${ic('lock')}Avaneb ${E.lvl}. tasemel</span>` : costHTML(E.cost)}</div></div>${lock ? '' : `<button class="btn sm" type="button" data-act="expStart" data-arg="${E.id}" ${!busy && canAfford(E.cost) ? '' : 'disabled'}>${busy ? 'Kõik on teel' : 'Saada teele'}</button>`}</div>` }).join('')}</div></div>`;
  return h;
}
{
  const _kr = TABS.kuningriik.r;
  TABS.kuningriik.r = () => { const base = _kr(), i = base.indexOf('<div class="card">'); return i < 0 ? base + lifeKingdomHtml() : base.slice(0, i) + lifeKingdomHtml() + base.slice(i) };
  if (TABS.seiklused) { const _ar = TABS.seiklused.r; TABS.seiklused.r = () => { const base = _ar(), i = base.indexOf('<div class="card adv">'); return i < 0 ? base + lifeExpHtml() : base.slice(0, i) + lifeExpHtml() + base.slice(i) } }
}
Object.assign(ACT, {
  reqGive: a => { deliverReq(+a); closeModal() },
  evAct: a => { evAction(a); lifeHud() },
  expStart: a => startExp(a),
  expClaim: a => claimExp(+a),
});

/* ---------- pisipildid: aarded, retked, elanik ---------- */
function drawRelic(c, w, h, id) {
  const R = RELICS[id], s = Math.min(w, h), x = w / 2, y = h / 2, col = REL_COL[R.r];
  const gl = c.createRadialGradient(x, y, 0, x, y, s * .6); gl.addColorStop(0, col + '55'); gl.addColorStop(1, col + '00'); c.fillStyle = gl; c.fillRect(0, 0, w, h);
  const mg = (a, b) => { const g = c.createLinearGradient(x - s * .3, y - s * .3, x + s * .3, y + s * .3); g.addColorStop(0, a); g.addColorStop(.5, '#ffffff'); g.addColorStop(.55, a); g.addColorStop(1, b); return g };
  const gold = mg('#e8b030', '#8a5a10'), silver = mg('#c8d0d8', '#5a6470'), r = s * .3;
  ell(c, x, y + r * 1.1, r * .9, r * .18, 'rgba(0,0,0,.3)');
  c.lineJoin = 'round';
  switch (id) {
    case 'kabi': ell(c, x, y, r * .5, r * .85, '#8a5a30'); c.strokeStyle = '#c8d0d8'; c.lineWidth = s * .02; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x - r * .45, y + i * r * .22); c.quadraticCurveTo(x, y + i * r * .22 - r * .15, x + r * .45, y + i * r * .22); c.stroke() } break;
    case 'sarv': c.beginPath(); c.moveTo(x - r, y + r * .3); c.quadraticCurveTo(x - r * .2, y - r * .9, x + r, y - r * .6); c.lineTo(x + r * .8, y - r * .2); c.quadraticCurveTo(x - r * .1, y - r * .3, x - r * .7, y + r * .6); c.closePath(); c.fillStyle = mg('#e8d8b0', '#8a6a3a'); c.fill(); rect(c, x - r * .15, y - r * .55, r * .12, r * .4, '#8a5a10'); break;
    case 'kruus': c.beginPath(); c.moveTo(x - r * .55, y - r * .7); c.lineTo(x + r * .45, y - r * .7); c.lineTo(x + r * .4, y + r * .8); c.lineTo(x - r * .5, y + r * .8); c.closePath(); c.fillStyle = mg('#c87a4a', '#7a3a1a'); c.fill(); c.strokeStyle = '#a05a30'; c.lineWidth = s * .05; c.beginPath(); c.arc(x + r * .55, y, r * .32, -1.3, 1.3); c.stroke(); break;
    case 'korv': c.beginPath(); c.moveTo(x - r, y - r * .2); c.lineTo(x + r, y - r * .2); c.lineTo(x + r * .75, y + r * .8); c.lineTo(x - r * .75, y + r * .8); c.closePath(); c.fillStyle = mg('#c8964a', '#7a5020'); c.fill(); c.strokeStyle = '#a07030'; c.lineWidth = s * .03; c.beginPath(); c.arc(x, y - r * .2, r * .8, Math.PI, 0); c.stroke(); for (let i = 0; i < 5; i++) circ(c, x - r * .6 + i * r * .3, y - r * .3, r * .18, i % 2 ? '#c8344f' : '#3a4ab0'); break;
    case 'kirves': c.save(); c.translate(x, y); c.rotate(-.5); rect(c, -r * .08, -r * .2, r * .16, r * 1.4, '#8a5a30'); c.beginPath(); c.moveTo(-r * .1, -r * .9); c.quadraticCurveTo(r * .9, -r * 1.1, r * .8, -r * .1); c.lineTo(-r * .1, -r * .3); c.closePath(); c.fillStyle = silver; c.fill(); c.restore(); break;
    case 'haamer': c.save(); c.translate(x, y); c.rotate(.4); rect(c, -r * .08, -r * .4, r * .16, r * 1.4, '#6a4a2a'); rect(c, -r * .6, -r * .8, r * 1.2, r * .5, '#6a7078'); rect(c, -r * .6, -r * .8, r * 1.2, r * .12, '#a8b0b8'); c.restore(); break;
    case 'mynt': c.beginPath(); c.arc(x, y, r * .85, 0, 6.283); c.fillStyle = gold; c.fill(); c.strokeStyle = '#8a5a10'; c.lineWidth = s * .02; c.beginPath(); c.arc(x, y, r * .65, 0, 6.283); c.stroke(); c.fillStyle = '#8a5a10'; c.font = `900 ${Math.round(r * .9)}px Georgia,serif`; c.textAlign = 'center'; c.fillText('♛', x, y + r * .32); break;
    case 'sulg': c.save(); c.translate(x, y); c.rotate(-.6); c.beginPath(); c.moveTo(0, r * 1.1); c.quadraticCurveTo(-r * .5, 0, 0, -r * 1.1); c.quadraticCurveTo(r * .5, 0, 0, r * 1.1); c.fillStyle = gold; c.fill(); c.strokeStyle = '#8a5a10'; c.lineWidth = s * .015; c.beginPath(); c.moveTo(0, r * 1.2); c.lineTo(0, -r); c.stroke(); c.restore(); break;
    case 'kompass': c.beginPath(); c.arc(x, y, r * .85, 0, 6.283); c.fillStyle = mg('#d8a040', '#7a5010'); c.fill(); circ(c, x, y, r * .68, '#f4ecd8'); poly(c, [x, y - r * .6, x + r * .12, y, x, y + r * .6, x - r * .12, y], '#c83a2a'); poly(c, [x, y + r * .6, x + r * .12, y, x - r * .12, y], '#3a4a5a'); circ(c, x, y, r * .08, '#7a5010'); break;
    case 'rull': rect(c, x - r * .8, y - r * .5, r * 1.6, r, '#efe0b8'); ell(c, x - r * .8, y, r * .15, r * .55, '#c8b080'); ell(c, x + r * .8, y, r * .15, r * .55, '#c8b080'); c.strokeStyle = 'rgba(90,60,30,.6)'; c.lineWidth = s * .012; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - r * .55, y - r * .25 + i * r * .25); c.lineTo(x + r * .5, y - r * .25 + i * r * .25); c.stroke() } rect(c, x - r * .06, y - r * .55, r * .12, r * 1.1, '#c83a2a'); break;
    case 'amulett': c.strokeStyle = '#c8a050'; c.lineWidth = s * .015; c.beginPath(); c.arc(x, y - r * .5, r * .7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.arc(x, y + r * .15, r * .55, 0, 6.283); c.fillStyle = gold; c.fill(); c.beginPath(); c.arc(x, y + r * .15, r * .38, 0, 6.283); c.fillStyle = mg('#5ae0a0', '#1a6a4a'); c.fill(); break;
    case 'karikas': c.beginPath(); c.moveTo(x - r * .7, y - r * .8); c.lineTo(x + r * .7, y - r * .8); c.quadraticCurveTo(x + r * .65, y, x + r * .1, y + r * .15); c.lineTo(x + r * .1, y + r * .6); c.lineTo(x + r * .45, y + r * .85); c.lineTo(x - r * .45, y + r * .85); c.lineTo(x - r * .1, y + r * .6); c.lineTo(x - r * .1, y + r * .15); c.quadraticCurveTo(x - r * .65, y, x - r * .7, y - r * .8); c.fillStyle = silver; c.fill(); break;
    case 'kilp': c.beginPath(); c.moveTo(x - r * .8, y - r * .8); c.lineTo(x + r * .8, y - r * .8); c.lineTo(x + r * .75, y + r * .1); c.quadraticCurveTo(x + r * .5, y + r * .7, x, y + r); c.quadraticCurveTo(x - r * .5, y + r * .7, x - r * .75, y + r * .1); c.closePath(); c.fillStyle = mg('#3a5ac8', '#10205a'); c.fill(); c.strokeStyle = '#e8b030'; c.lineWidth = s * .04; c.stroke(); c.fillStyle = '#e8b030'; c.font = `900 ${Math.round(r)}px Georgia,serif`; c.textAlign = 'center'; c.fillText('♛', x, y + r * .3); break;
    case 'kera': { const g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.4, '#9ad0ff'); g.addColorStop(1, '#2a3a8a'); c.beginPath(); c.arc(x, y, r * .8, 0, 6.283); c.fillStyle = g; c.fill(); for (let i = 0; i < 6; i++) circ(c, x + Math.cos(i * 1.1) * r * .45, y + Math.sin(i * 1.7) * r * .4, r * .05, '#fff'); rect(c, x - r * .4, y + r * .75, r * .8, r * .18, '#c8a050'); break }
    case 'kroon': c.beginPath(); c.moveTo(x - r * .9, y + r * .5); c.lineTo(x - r * .9, y - r * .5); c.lineTo(x - r * .45, y - r * .05); c.lineTo(x, y - r * .8); c.lineTo(x + r * .45, y - r * .05); c.lineTo(x + r * .9, y - r * .5); c.lineTo(x + r * .9, y + r * .5); c.closePath(); c.fillStyle = gold; c.fill(); for (const [px, cc] of [[-.5, '#e8304a'], [0, '#3a8af0'], [.5, '#3ac86a']]) circ(c, x + px * r, y + r * .2, r * .13, cc); for (const px of [-.9, 0, .9]) circ(c, x + px * r, y - (px ? r * .5 : r * .8), r * .1, '#fff0a0'); break;
    case 'muna': { const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r * 1.1); g.addColorStop(0, '#ffe8a0'); g.addColorStop(.5, '#c84a2a'); g.addColorStop(1, '#3a0a0a'); c.beginPath(); c.ellipse(x, y, r * .62, r * .85, 0, 0, 6.283); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,200,80,.5)'; c.lineWidth = s * .01; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x - r * .3 + (i % 3) * r * .3, y - r * .3 + Math.floor(i / 3) * r * .4, r * .15, 0, Math.PI); c.stroke() } break }
  }
}
function drawExpIcon(c, w, h, id) {
  const sky = { marja: ['#8fd0f0', '#d8f0c8'], kaljud: ['#9ab0c0', '#d0d8d8'], varemed: ['#c8a880', '#f0d8b0'], tundra: ['#a8c8e8', '#f0f8ff'], rabad: ['#5a7a6a', '#a8c0a8'], kadunud: ['#e8a860', '#ffe0a0'] }[id];
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const gy = h * .7;
  if (id === 'marja') { ell(c, w * .3, gy + h * .1, w * .5, h * .3, '#6aa84a'); ell(c, w * .8, gy + h * .15, w * .45, h * .28, '#5a9a3a'); for (let i = 0; i < 8; i++) circ(c, w * (.1 + i * .11), gy + h * (.05 + (i % 3) * .06), h * .04, '#e8304a') }
  if (id === 'kaljud') { poly(c, [0, h, w * .2, h * .3, w * .45, h * .55, w * .7, h * .2, w, h * .6, w, h], '#6a7078'); ell(c, w * .55, h * .78, w * .1, h * .12, '#1a1a1e') }
  if (id === 'varemed') { rect(c, 0, gy, w, h - gy, '#8a9a5a'); for (let i = 0; i < 4; i++) rect(c, w * (.12 + i * .22), h * (.3 + (i % 2) * .15), w * .08, gy - h * (.3 + (i % 2) * .15), '#c8b898'); rect(c, w * .1, h * .28, w * .4, h * .06, '#b8a888') }
  if (id === 'tundra') { rect(c, 0, gy, w, h - gy, '#f4f8ff'); poly(c, [0, gy, w * .3, h * .35, w * .55, gy], '#d8e4f0'); poly(c, [w * .4, gy, w * .75, h * .3, w, gy], '#e8f0f8'); c.strokeStyle = 'rgba(120,255,180,.6)'; c.lineWidth = h * .05; c.beginPath(); c.moveTo(0, h * .15); c.quadraticCurveTo(w * .5, h * .3, w, h * .1); c.stroke() }
  if (id === 'rabad') { rect(c, 0, gy, w, h - gy, '#4a6a4a'); ell(c, w * .5, gy + h * .1, w * .3, h * .08, '#3a5a6a'); for (let i = 0; i < 4; i++) { const gx = w * (.2 + i * .2), gy2 = h * (.4 + (i % 2) * .1); const gg = c.createRadialGradient(gx, gy2, 0, gx, gy2, h * .15); gg.addColorStop(0, 'rgba(200,255,200,.9)'); gg.addColorStop(1, 'rgba(200,255,200,0)'); c.fillStyle = gg; c.fillRect(gx - h * .15, gy2 - h * .15, h * .3, h * .3) } }
  if (id === 'kadunud') { rect(c, 0, gy, w, h - gy, '#c8a060'); rect(c, w * .25, h * .35, w * .5, gy - h * .35, '#e8c870'); poly(c, [w * .2, h * .35, w * .5, h * .12, w * .8, h * .35], '#d8a840'); for (let i = 0; i < 3; i++) rect(c, w * (.32 + i * .14), h * .45, w * .06, gy - h * .45, '#b8902a') }
}
function drawFolkPortrait(c, w, h, name) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a8a5a'); g.addColorStop(1, '#2a4a2a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const f = folk.find(a => a.name === name) || { skin: FOLK_SKIN[0], hair: FOLK_HAIR[0], cloth: FOLK_CLOTH[0], hat: -1, dress: false, f: 1, ph: 0 };
  drawFolk(c, Object.assign({}, f, { moving: false, carry: null, sayT: 0, inside: false, name: '' }), w / 2, h * .98, h * 1.9, 0);
}
{
  const _pt = paintThumbs;
  paintThumbs = function (root) {
    _pt(root);
    root.querySelectorAll('canvas[data-relic],canvas[data-exp],canvas[data-folk]').forEach(cv2 => {
      const w = cv2.clientWidth || 60, h = cv2.clientHeight || 60, d = 2; cv2.width = w * d; cv2.height = h * d; const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
      if (cv2.dataset.relic) { if (cv2.dataset.unk === '1') { c.filter = 'brightness(0) opacity(.5)' } drawRelic(c, w, h, cv2.dataset.relic); c.filter = 'none' }
      else if (cv2.dataset.exp) drawExpIcon(c, w, h, cv2.dataset.exp);
      else drawFolkPortrait(c, w, h, cv2.dataset.folk);
    });
  };
}
QUESTS.push(
  Q('q101', 'Täida 3 elaniku soovi', 3, s => s.st.reqDone || 0, { gold: 200, xp: 120 }),
  Q('q102', 'Saada maadeuurija esimesele ekspeditsioonile', 1, s => s.st.expDone || 0, { gold: 150, xp: 100 }),
  Q('q103', 'Kustuta 5 põlevat puud', 5, s => s.st.fires || 0, { gold: 300, fame: 20, xp: 150 }),
  Q('q104', 'Tule toime 5 sündmusega', 5, s => s.st.evDone || 0, { gold: 500, fame: 30, xp: 250 }),
  Q('q105', 'Tõsta kuningriik linna auastmeni', 3, s => (s.life && s.life.rank) || 0, { gold: 800, fame: 50, xp: 400 }),
  Q('q106', 'Täida 25 elaniku soovi', 25, s => s.st.reqDone || 0, { gold: 1500, fame: 60, xp: 800, map: 1 }),
  Q('q107', 'Tee 10 ekspeditsiooni', 10, s => s.st.expDone || 0, { gold: 2000, fame: 80, xp: 1000 }),
  Q('q108', 'Leia varakambrisse 8 aaret', 8, s => Object.keys((s.life && s.life.relics) || {}).length, { gold: 3000, fame: 120, xp: 1500 }),
);
ACH.push(
  { id: 'a40', n: 'Rahva lemmik', d: 'Hoia elanike õnnelikkus 90% peal', ok: s => s.life && s.life.happy >= 90, fame: 20 },
  { id: 'a41', n: 'Kuldse hirve sõber', d: 'Püüa kuldne hirv', ok: s => (s.st.deer || 0) >= 1, fame: 15 },
  { id: 'a42', n: 'Impeerium', d: 'Tõsta kuningriik impeeriumiks', ok: s => s.life && s.life.rank >= 5, fame: 100 },
  { id: 'a43', n: 'Varakambri valvur', d: 'Leia kõik 16 aaret', ok: s => s.life && Object.keys(s.life.relics || {}).length >= 16, fame: 100 },
);
