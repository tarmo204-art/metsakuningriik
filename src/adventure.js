/* ================= ADVENTURES: CAVE & TREASURE HUNT ================= */
const CW = 9, CH = 9;
ICON.map = '<svg viewBox="0 0 20 20"><path d="M3 4 L8 2.5 L12 4 L17 2.5 V16 L12 17.5 L8 16 L3 17.5Z" fill="#e8d3a2"/><path d="M8 2.5 V16 M12 4 V17.5" stroke="#b99a62" stroke-width="1"/><path d="M5 12 Q7 9 9 10 T13 7" stroke="#8a5a34" stroke-width="1.2" fill="none" stroke-dasharray="1.5 1.3"/><path d="M13 6 l2 2 M15 6 l-2 2" stroke="#c8473a" stroke-width="1.5"/></svg>';
ICON.torch = '<svg viewBox="0 0 20 20"><path d="M9 9 h2 l-.5 9 h-1Z" fill="#8a5a34"/><path d="M10 1.5 C13 5 13.5 7 12.5 8.5 C12 9.5 8 9.5 7.5 8.5 C6.5 7 7 5 10 1.5Z" fill="#ffb347"/><path d="M10 4.5 C11.5 6 11.6 7.2 11 8 C10.6 8.6 9.4 8.6 9 8 C8.4 7.2 8.5 6 10 4.5Z" fill="#ffe39a"/></svg>';
TOOL_ICON.kaeva = '<svg viewBox="0 0 20 20"><path d="M13 2 L18 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M15.5 4.5 L7 13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M8.5 11.5 L3 13 L2 18 L7 17 L8.5 11.5Z" fill="currentColor"/></svg>';
DAILY[2].map = 1; DAILY[6].map = 1;

const CAVE_SVG = {
  crystal: '<svg viewBox="0 0 20 20"><path d="M10 2 L14 8 L10 18 L6 8Z" fill="#7fd8f0"/><path d="M10 2 L14 8 L10 18Z" fill="#4fb4d8"/><path d="M4 10 L6.5 7 L8 15Z" fill="#a6ecff"/><path d="M16 10 L13.5 7.5 L12.5 15Z" fill="#5cc4e4"/></svg>',
  ore: '<svg viewBox="0 0 20 20"><path d="M3 16 L5 8 L10 5 L16 8 L17 16Z" fill="#8b9496"/><path d="M5 8 L10 5 L16 8 L10 10Z" fill="#b9c1c3"/><circle cx="8" cy="12" r="1.4" fill="#ffd24a"/><circle cx="12.5" cy="10.5" r="1.1" fill="#ffd24a"/><circle cx="11" cy="14" r="1" fill="#ffd24a"/></svg>',
  chest: '<svg viewBox="0 0 20 20"><rect x="3" y="8" width="14" height="9" rx="1" fill="#7a4a24"/><path d="M3 8 Q10 2 17 8Z" fill="#94592a"/><rect x="3" y="8" width="14" height="1.6" fill="#e0a83a"/><rect x="9" y="8" width="2" height="4" fill="#ffd060"/></svg>',
  bat: '<svg viewBox="0 0 20 20"><path d="M10 8 C8 6, 5 6, 2 5 C3 8, 4 10, 6 10 C7 11, 8 11, 10 12 C12 11, 13 11, 14 10 C16 10, 17 8, 18 5 C15 6, 12 6, 10 8Z" fill="#7a5ab0"/><circle cx="9" cy="9" r=".7" fill="#ffe36a"/><circle cx="11" cy="9" r=".7" fill="#ffe36a"/></svg>',
  rockfall: '<svg viewBox="0 0 20 20"><circle cx="7" cy="13" r="4" fill="#6f797b"/><circle cx="13" cy="14" r="3.4" fill="#8b9496"/><circle cx="10" cy="8" r="3" fill="#a9b1b3"/><path d="M10 2 L9 5 L11 6 L9.5 9" stroke="#3a3f40" stroke-width="1" fill="none"/></svg>',
  mushroom: '<svg viewBox="0 0 20 20"><circle cx="10" cy="9" r="8" fill="rgba(140,255,220,.18)"/><rect x="8.8" y="9" width="2.4" height="7" fill="#efe6d6"/><path d="M4 10 Q10 1 16 10Z" fill="#5fe0c0"/><circle cx="8" cy="7" r="1" fill="#e8fff8"/><circle cx="12" cy="6.5" r=".8" fill="#e8fff8"/></svg>',
  water: '<svg viewBox="0 0 20 20"><ellipse cx="10" cy="13" rx="7" ry="3.5" fill="#2f7898"/><ellipse cx="10" cy="12.5" rx="5" ry="2" fill="#4fa6c8"/><path d="M10 3 C12 6 13 7.5 13 9 A3 3 0 0 1 7 9 C7 7.5 8 6 10 3Z" fill="#86cde0"/></svg>',
  stairs: '<svg viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" rx="2" fill="#0a0a0c"/><path d="M4 16 H8 V12 H12 V8 H16 V4" stroke="#c9a46a" stroke-width="2" fill="none"/></svg>',
  map: ICON.map,
  relic: '<svg viewBox="0 0 20 20"><circle cx="10" cy="11" r="6" fill="#2f6b4f" stroke="#e0b04a" stroke-width="1.6"/><path d="M10 7 L11.2 10 L14 11 L11.2 12 L10 15 L8.8 12 L6 11 L8.8 10Z" fill="#a9f0d0"/><path d="M7 3 Q10 6 13 3" stroke="#e0b04a" stroke-width="1.2" fill="none"/></svg>',
  player: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="rgba(255,200,100,.25)"/><circle cx="10" cy="6" r="3" fill="#f0d0a0"/><path d="M5.5 17 C6 11, 14 11, 14.5 17Z" fill="#3f6b3a"/><path d="M14 9 v-2" stroke="#3a2a1a"/><rect x="13" y="9" width="3" height="4" rx=".8" fill="#ffd286" stroke="#8a5a34" stroke-width=".7"/></svg>',
};
const CAVE_NAMES = { crystal: 'kristall', ore: 'kullamaak', chest: 'laegas', bat: 'nahkhiired', rockfall: 'varing', mushroom: 'helendav seen', water: 'maa-alune allikas', stairs: 'trepp alla', map: 'aardekaart', relic: 'iidne amulett' };

function ensureAdventure() {
  if (S.maps === undefined) S.maps = 1;
  if (S.hunt === undefined) S.hunt = null;
  if (S.cave === undefined) S.cave = null;
  for (const k of ['caves', 'deepest', 'treasures', 'caveMaps', 'firstDig', 'digs']) if (S.st[k] === undefined) S.st[k] = 0;
  for (const rk of ['maed', 'pohjala']) {
    const R = S.regions[rk]; if (!R || R.tiles.some(t => t.t === 'cave')) continue;
    const opts = []; R.tiles.forEach((t, i) => { const x = i % W, y = Math.floor(i / W); if ((t.t === 'grass' || t.t === 'rock') && x > 1 && x < W - 2 && y > 0 && y < H - 2) opts.push(i) });
    const i = opts.length ? opts[hashStr(rk + S.created) % opts.length] : 20; R.tiles[i] = { t: 'cave' };
  }
}

/* ---------- cave ---------- */
const caveCost = () => ({ food: 20 + S.level * 2, wood: 30 + S.level * 3 });
function genCave(depth) {
  const g = Array.from({ length: CW * CH }, () => ({ t: 'wall', seen: false }));
  const at = (x, y) => g[y * CW + x];
  let x = 4, y = CH - 1; at(x, y).t = 'floor';
  const steps = 55 + depth * 3;
  for (let i = 0; i < steps; i++) {
    const d = pick([[1, 0], [-1, 0], [0, -1], [0, -1], [0, 1]]);
    x = clamp(x + d[0], 0, CW - 1); y = clamp(y + d[1], 0, CH - 1); at(x, y).t = 'floor';
    if (Math.random() < .08) { x = ri(1, CW - 2); y = ri(1, CH - 2); if (at(x, y).t !== 'floor') { x = 4; y = CH - 1 } }
  }
  // distances from start
  const dist = Array(CW * CH).fill(-1), q = [(CH - 1) * CW + 4]; dist[q[0]] = 0;
  while (q.length) { const c = q.shift(), cx = c % CW, cy = Math.floor(c / CW); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) continue; const n = ny * CW + nx; if (g[n].t === 'floor' && dist[n] < 0) { dist[n] = dist[c] + 1; q.push(n) } } }
  g.forEach((c, i) => { if (c.t === 'floor' && dist[i] < 0) c.t = 'wall' });
  let far = 0; dist.forEach((d, i) => { if (d > dist[far]) far = i });
  g[far].item = 'stairs';
  const floors = g.map((c, i) => i).filter(i => g[i].t === 'floor' && !g[i].item && dist[i] > 0).sort(() => Math.random() - .5);
  const items = ['crystal', 'crystal', 'crystal', 'ore', 'ore', 'ore', 'mushroom', 'mushroom', 'water', 'chest'];
  for (let i = 0; i < Math.min(4, 2 + Math.floor(depth / 2)); i++) items.push('bat');
  for (let i = 0; i < Math.min(3, 1 + Math.floor(depth / 3)); i++) items.push('rockfall');
  if (Math.random() < .3) items.push('map');
  if (depth >= 4 && Math.random() < .35) items.push('relic');
  if (depth >= 3) items.push('crystal', 'ore');
  items.forEach((it, k) => { if (floors[k] !== undefined) g[floors[k]].item = it });
  return g;
}
function caveReveal() {
  const c = S.cave;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = c.px + dx, y = c.py + dy; if (x >= 0 && y >= 0 && x < CW && y < CH) c.grid[y * CW + x].seen = true }
}
function startCave(region) {
  if (S.cave) { openCave(); return }
  const cost = caveCost();
  if (!canAfford(cost)) { toast(`Ekspeditsiooniks on vaja ${cost.food} toitu ja ${cost.wood} puitu tõrvikute jaoks.`, 'bad'); return }
  pay(cost);
  S.cave = { region, depth: 1, torch: 22 + upgRank('ehitajad') * 2, px: 4, py: CH - 1, bag: {}, log: 'Süütasid tõrviku ja astusid pimedusse. Otsi treppi, mis viib sügavamale.', grid: genCave(1) };
  caveReveal(); S.st.caves++; openCave();
}
const caveMult = () => (1 + .5 * (S.cave.depth - 1)) * (S.cave.region === 'pohjala' ? 1.6 : 1) * (1 + S.level * .04);
function bagAdd(r) { for (const k in r) S.cave.bag[k] = (S.cave.bag[k] || 0) + Math.round(r[k]) }
function caveMove(i) {
  const c = S.cave; if (!c) return;
  const tx = i % CW, ty = Math.floor(i / CW);
  if (Math.abs(tx - c.px) + Math.abs(ty - c.py) !== 1) return;
  const cell = c.grid[i]; if (cell.t !== 'floor') { c.log = 'Seal on kalju. Otsi teist teed.'; return }
  c.px = tx; c.py = ty; c.torch--; caveReveal();
  const m = caveMult(); let log = '';
  switch (cell.item) {
    case 'crystal': bagAdd({ gold: 15 * m, xp: 8 * m }); log = 'Kristall! Selle valgus muutub kullaks.'; break;
    case 'ore': bagAdd({ stone: 20 * m, gold: 6 * m }); log = 'Raiusid seinast kullamaaki.'; break;
    case 'chest': { const rk = pick(['wood', 'food', 'berries', 'water', 'stone']); bagAdd({ gold: 60 * m, [rk]: 40 * m, xp: 20 * m }); if (Math.random() < .5) { bagAdd({ map: 1 }); S.st.caveMaps++; log = 'Vana laegas! Selle põhjas oli ka aardekaart.' } else log = 'Leidsid tolmuse laeka täis varandust!'; break }
    case 'mushroom': c.torch += 4; log = 'Helendavad seened annavad valgust: +4 tõrvikut.'; break;
    case 'water': c.torch += 2; bagAdd({ water: 25 * m }); log = 'Maa-alune allikas. Jõid ja tõid vett: +2 tõrvikut.'; break;
    case 'bat': c.torch = Math.max(0, c.torch - 3); log = 'Nahkhiirte parv! Tõrvik leegitses ja põles kiiresti: −3.'; break;
    case 'rockfall': c.torch = Math.max(0, c.torch - 4); log = 'Varing! Pidid kive eest koristama: −4 tõrvikut.'; break;
    case 'map': bagAdd({ map: 1 }); S.st.caveMaps++; log = 'Seina pragu oli peidetud aardekaart!'; break;
    case 'relic': bagAdd({ fame: 20 * m, xp: 30 * m }); log = 'Iidne amulett! Selle lugu toob kuningriigile kuulsust.'; break;
    case 'stairs':
      c.depth++; c.torch += 6; c.grid = genCave(c.depth); c.px = 4; c.py = CH - 1; caveReveal();
      S.st.deepest = Math.max(S.st.deepest, c.depth);
      c.log = `Laskusid ${c.depth}. sügavusele. Siin on rikkam, kuid ka ohtlikum. +6 tõrvikut.`; return;
  }
  if (cell.item) { cell.item = null; c.flash = i }
  c.log = log || 'Pimedus. Ainult su sammude kaja.';
  if (c.torch <= 0) caveEnd(true);
}
function caveEnd(dark) {
  const c = S.cave; if (!c) return;
  const loot = {}; for (const k in c.bag) { const v = dark ? Math.floor(c.bag[k] / 2) : c.bag[k]; if (v > 0) loot[k] = v }
  if (loot.map) { S.maps += loot.map; delete loot.map }
  loot.xp = (loot.xp || 0) + c.depth * 10;
  give(loot);
  S.st.deepest = Math.max(S.st.deepest, c.depth);
  const mapsGot = dark ? Math.floor((c.bag.map || 0) / 2) : (c.bag.map || 0);
  S.cave = null;
  showModal(() => `<h2>${dark ? 'Tõrvik kustus!' : 'Tagasi päevavalguses'}</h2><p>${dark ? 'Pimeduses komistasid väljapääsuni ja kaotasid poole saagist.' : `Jõudsid ${c.depth}. sügavusele ja tõid kogu saagi turvaliselt koju.`}</p>
    <div class="cards"><div class="card"><div class="qcard" style="display:block"><div class="rew" style="font-size:14px;gap:6px 12px">${rewardHTML(loot)}${mapsGot ? `<span>${ic('map')}+${mapsGot} aardekaart</span>` : ''}</div></div></div></div>
    <p class="lead">Sügavaim koobas: ${S.st.deepest}. sügavus · Ekspeditsioone: ${S.st.caves}</p><div class="mbtns"><button class="btn" type="button" data-act="closeModal">Hästi</button></div>`);
}
function openCave() {
  showModal(() => {
    const c = S.cave; if (!c) return null;
    const ice = c.region === 'pohjala';
    const cells = c.grid.map((cell, i) => {
      const x = i % CW, y = Math.floor(i / CW), isP = x === c.px && y === c.py;
      const near = Math.max(Math.abs(x - c.px), Math.abs(y - c.py)) <= 1, adj = Math.abs(x - c.px) + Math.abs(y - c.py) === 1 && cell.t === 'floor';
      if (!cell.seen) return `<div class="cc unk"></div>`;
      const inner = isP ? CAVE_SVG.player : cell.item ? CAVE_SVG[cell.item] : '';
      const cls = `cc ${cell.t} ${near ? 'lit' : 'dim'} ${adj ? 'go' : ''} ${isP ? 'me' : ''}`;
      return adj ? `<button class="${cls}" type="button" data-act="caveMove" data-arg="${i}" aria-label="Liigu${cell.item ? ': ' + CAVE_NAMES[cell.item] : ''}">${inner}</button>` : `<div class="${cls}" ${cell.item ? `title="${CAVE_NAMES[cell.item]}"` : ''}>${inner}</div>`;
    }).join('');
    const tp = clamp(c.torch / 30, 0, 1);
    return `<div class="cavehead"><div><h2>${ice ? 'Jääkoobas' : 'Mäekoobas'} · ${c.depth}. sügavus</h2><p class="lead">Liigu klõpsuga (või nooleklahvidega). Iga samm kulutab tõrvikut. Trepp viib sügavamale, kus saak on suurem.</p></div></div>
      <div class="torch"><span class="ic">${ICON.torch}</span><div class="bar" style="flex:1"><i style="width:${(tp * 100).toFixed(0)}%;background:${c.torch <= 5 ? 'linear-gradient(90deg,#e2513f,#ff8a78)' : ''}"></i></div><b class="num">${c.torch}</b></div>
      <div class="cgrid ${ice ? 'ice' : ''}">${cells}</div>
      <p class="cavelog">${c.log}</p>
      <div class="bag"><span class="lead">Kotis:</span>${Object.keys(c.bag).length ? rewardHTML(c.bag) : '<span class="lead">veel tühi</span>'}</div>
      <div class="mbtns"><button class="btn" type="button" data-act="caveExit">Välju koos saagiga</button></div>`;
  }, 'cave');
}

function caveIntro(region) {
  if (S.cave) { openCave(); return }
  const cost = caveCost(), ice = region === 'pohjala';
  showModal(() => `<div class="mhead"><div class="treasure-emblem" style="width:64px;height:64px">${ICON.torch}</div><div><h2>${ice ? 'Jääkoobas' : 'Mäekoobas'}</h2><p class="lead">${ice ? 'Jäised käigud, kus saak on 1,6 korda suurem.' : 'Kitsad käigud viivad sügavale mäe sisse.'}</p></div></div>
    <p>Võta kaasa tõrvikud ja toidukott. Iga samm kulutab tõrvikut. Leia kristalle, maaki, laekaid ja aardekaarte. Trepid viivad sügavamale. Kui tõrvik kustub, pääsed küll välja, aga kaotad poole saagist.</p>
    <dl class="kv"><dt>Varustus</dt><dd>${costHTML(cost)}</dd><dt>Sügavaim</dt><dd>${S.st.deepest ? S.st.deepest + '. sügavus' : 'veel käimata'}</dd></dl>
    <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Hiljem</button><button class="btn" type="button" data-act="caveStart" data-arg="${region}" ${canAfford(cost) ? '' : 'disabled'}>Astu koopasse</button></div>`);
}

/* ---------- treasure hunt ---------- */
const mapPrice = () => 200 + S.level * 25;
function buyMap() { const p = mapPrice(); if (S.res.gold < p) { toast(`Aardekaart maksab ${p} kulda.`, 'bad'); return } S.res.gold -= p; S.maps++; toast('Ostsid vana pärgamendil aardekaardi.', 'good', 'map') }
function startHunt() {
  if (S.hunt || S.maps < 1) return;
  const regs = Object.keys(S.regions), rk = pick(regs), T = S.regions[rk].tiles;
  const opts = []; T.forEach((t, i) => { if (t.t !== 'water' && t.t !== 'b' && t.t !== 'cave') opts.push(i) });
  const i = pick(opts);
  S.maps--; S.hunt = { region: rk, x: i % W, y: Math.floor(i / W), digs: 8, dug: [] };
  toast(`Kaart viitab piirkonda ${REGIONS[rk].n}. Vali tööriist „Kaeva“ ja otsi!`, 'gold', 'map');
  setView(rk); setTool('kaeva');
  if (isMobile()) $('#mapWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function huntClue(h) { return (h.y < H / 2 ? (h.x < W / 2 ? 'loode' : 'kirde') : (h.x < W / 2 ? 'edela' : 'kagu')) + 'osas' }
function digAt(x, y) {
  const h = S.hunt; if (!h) { setTool('kogu'); return }
  if (S.view !== h.region) { info(`Aardekaart viitab piirkonda ${REGIONS[h.region].n}. Mine sinna kaevama.`); return }
  const t = S.regions[S.view].tiles[y * W + x];
  if (t.t === 'water') { info('Vette ei saa kaevata.'); return }
  if (h.dug.some(d => d.x === x && d.y === y)) { info('Siin oled juba kaevanud.'); return }
  h.digs--; S.st.digs++;
  const d = Math.abs(x - h.x) + Math.abs(y - h.y), cx = x + .5, cy = y + .5;
  dust(cx, cy);
  if (d === 0) {
    const tr = REGION_ORDER.indexOf(h.region) + 1, m = 1 + S.level * .05;
    const rk = pick(['wood', 'stone', 'food', 'berries', 'water']);
    const rew = { gold: Math.round((120 + 60 * tr) * m), [rk]: Math.round(60 * tr * m), xp: Math.round(60 * tr * m), fame: 5 + tr * 3 };
    if (Math.random() < .3) rew.map = 1;
    give(rew);
    S.st.treasures++; if (h.dug.length === 0) S.st.firstDig++;
    S.hunt = null; setTool('kogu', true);
    sparkle(cx, cy, '#ffd065', 40); sparkle(cx, cy, '#ffffff', 16);
    showModal(() => `<div style="display:grid;gap:12px;justify-items:center;text-align:center"><div class="treasure-emblem">${CAVE_SVG.chest}</div><h2>Aare on leitud!</h2><p>Labidas kõlksatas vastu raudset kaant. ${REGIONS[h.region].n} andis välja oma saladuse.</p><div class="gains" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${Object.keys(rew).map(k => `<span class="pill warn" style="font-size:13px">${ic(k)}+${fmt(rew[k])}</span>`).join('')}</div><button class="btn" type="button" data-act="closeModal">Imeline!</button></div>`);
    return;
  }
  const hint = d <= 1 ? ['Tuline! Aare on kohe siinsamas kõrval!', '#ff5a3a', 'Tuline!'] : d <= 2 ? ['Kuum! Väga lähedal.', '#ff8a3a', 'Kuum!'] : d <= 4 ? ['Soe. Õiges suunas.', '#ffc24a', 'Soe'] : d <= 7 ? ['Jahe. Aare on kaugemal.', '#9fd8f0', 'Jahe'] : ['Külm. Siin pole midagi lähedal.', '#6fa8ff', 'Külm'];
  h.dug.push({ x, y, c: hint[1] });
  floatText(cx, cy, hint[2], hint[1]);
  if (h.digs <= 0) {
    toast(`Kaevamised said otsa. Aare jäi ${REGIONS[h.region].n} mullasse peitu.`, 'bad');
    sparkle(h.x + .5, h.y + .5, '#ffd065', 20); S.hunt = null; setTool('kogu', true);
    info('Aare oli peidetud seal, kus sädemed lendasid. Järgmine kord läheb paremini!');
  } else info(`${hint[0]} Kaevamisi jäänud: ${h.digs}.`);
}
function drawHunt(c, s) {
  const h = S.hunt; if (!h || h.region !== S.view) return;
  for (const d of h.dug) {
    const x = d.x * s + s / 2, y = d.y * s + s * .62;
    ell(c, x, y, s * .22, s * .1, '#4a3220'); ell(c, x, y - s * .02, s * .16, s * .06, '#2a1a10');
    c.strokeStyle = '#3a2a1a'; c.lineWidth = Math.max(1, s * .03); c.beginPath(); c.moveTo(x + s * .22, y); c.lineTo(x + s * .22, y - s * .42); c.stroke();
    poly(c, [x + s * .22, y - s * .42, x + s * .42, y - s * .35, x + s * .22, y - s * .28], d.c);
  }
}

/* ---------- adventures tab ---------- */
TABS.seiklused = { n: 'Seiklused', r: renderAdvTab };
{ const o = {}; for (const k in TABS) { if (k === 'kuningriik') o.seiklused = TABS.seiklused; if (k !== 'seiklused') o[k] = TABS[k] } for (const k in TABS) delete TABS[k]; Object.assign(TABS, o) }
function renderAdvTab() {
  ensureAdventure();
  const caveRegs = ['maed', 'pohjala'].filter(r => S.regions[r]);
  const cost = caveCost();
  let h = `<h2>Seiklused</h2><p class="lead">Lasku koobaste sügavustesse või otsi aardekaardiga peidetud varandusi.</p>`;
  h += `<div class="card adv"><div class="advhead"><span class="ic lg">${ICON.torch}</span><div><h3>Koopaekspeditsioon</h3><p class="lead">Klõpsa kaardil koopa sissepääsul või alusta siit. Iga samm kulutab tõrvikut. Trepid viivad sügavamale, kus on suurem saak, kuid rohkem nahkhiiri ja varinguid. Kui tõrvik kustub, kaotad poole saagist.</p></div></div>
    <dl class="stats"><dt>Ekspeditsioone</dt><dd>${S.st.caves}</dd><dt>Sügavaim koobas</dt><dd>${S.st.deepest ? S.st.deepest + '. sügavus' : '—'}</dd></dl>`;
  if (S.cave) h += `<button class="btn" type="button" data-act="caveOpen">Jätka ekspeditsiooni (${S.cave.depth}. sügavus)</button>`;
  else if (!caveRegs.length) h += `<span class="lockmsg">${ic('lock')}Koopad asuvad Mäestikus (avaneb 5. tasemel) ja Põhjalas</span>`;
  else h += `<div class="act" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between">${costHTML(cost, '<span class="time">tõrvikud ja toidukott</span>')}<div style="display:flex;gap:6px;flex-wrap:wrap">${caveRegs.map(r => `<button class="btn sm" type="button" data-act="caveStart" data-arg="${r}" ${canAfford(cost) ? '' : 'disabled'}>${r === 'pohjala' ? 'Jääkoobas (saak ×1,6)' : 'Mäekoobas'}</button>`).join('')}</div></div>`;
  h += `</div>`;
  h += `<div class="card adv"><div class="advhead"><span class="ic lg">${ICON.map}</span><div><h3>Aardejaht</h3><p class="lead">Aardekaart näitab, millisesse piirkonda on varandus maetud. Kaeva labidaga: iga auk ütleb, kas oled aardele lähedal (tuline, kuum, soe) või kaugel (jahe, külm). Kaevamisi on 8.</p></div></div>
    <dl class="stats"><dt>Aardekaarte</dt><dd>${S.maps}</dd><dt>Leitud aardeid</dt><dd>${S.st.treasures}</dd></dl>`;
  if (S.hunt) h += `<div class="card qcard done" style="margin:0"><div><h3>Jaht käib: ${REGIONS[S.hunt.region].n}</h3><div class="rew">Kaardil on rist piirkonna ${huntClue(S.hunt)} · kaevamisi jäänud ${S.hunt.digs}</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="huntGo">Mine kohale ja kaeva</button><button class="btn sm ghost" type="button" data-act="huntQuit">Loobu jahist</button></div>`;
  else h += `<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="huntStart" ${S.maps > 0 ? '' : 'disabled'}>Alusta aardejahti (1 kaart)</button><button class="btn sm ghost" type="button" data-act="buyMap" ${S.res.gold >= mapPrice() ? '' : 'disabled'}>Osta aardekaart (${mapPrice()} kulda)</button></div><p class="lead">Kaarte leiab ka laekadest, koobastest, rändkaupmehelt ja päevapreemiast.</p>`;
  return h + '</div>';
}
Object.assign(ACT, {
  caveStart: a => startCave(a),
  caveOpen: () => openCave(),
  caveMove: a => caveMove(+a),
  caveExit: () => caveEnd(false),
  huntStart: () => startHunt(),
  huntGo: () => { if (S.hunt) { setView(S.hunt.region); setTool('kaeva'); if (isMobile()) $('#mapWrap').scrollIntoView({ behavior: 'smooth', block: 'center' }) } },
  huntQuit: () => { S.hunt = null; setTool('kogu'); toast('Panid aardekaardi kõrvale. Aare jäi leidmata.', 'info') },
  buyMap: () => buyMap(),
});
document.addEventListener('keydown', e => {
  if (!S || !S.cave || !UI.modalView || !$('#modalCard').classList.contains('cave')) return;
  const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key]; if (!d) return;
  e.preventDefault();
  const x = S.cave.px + d[0], y = S.cave.py + d[1]; if (x < 0 || y < 0 || x >= CW || y >= CH) return;
  caveMove(y * CW + x); if (S.cave) renderModal(true); hudUpdate();
});

QUESTS.push(
  Q('q71', 'Mine esimesele koopaekspeditsioonile', 1, s => s.st.caves || 0, { gold: 200, xp: 100 }),
  Q('q72', 'Leia esimene peidetud aare', 1, s => s.st.treasures || 0, { gold: 300, xp: 150, map: 1 }),
  Q('q73', 'Jõua koopas 3. sügavusele', 3, s => s.st.deepest || 0, { gold: 400, xp: 200 }),
  Q('q74', 'Leia koopast aardekaart', 1, s => s.st.caveMaps || 0, { xp: 200, fame: 20 }),
  Q('q75', 'Käi koopas 10 korda', 10, s => s.st.caves || 0, { gold: 1000, xp: 400, map: 1 }),
  Q('q76', 'Leia 5 peidetud aaret', 5, s => s.st.treasures || 0, { gold: 1500, fame: 50, xp: 500 }),
  Q('q77', 'Jõua koopas 6. sügavusele', 6, s => s.st.deepest || 0, { gold: 1500, fame: 50, xp: 500 }),
  Q('q78', 'Jõua koopas 10. sügavusele', 10, s => s.st.deepest || 0, { gold: 5000, fame: 100, xp: 1500, map: 2 }),
);
ACH.push(
  { id: 'a25', n: 'Koopauurija', d: 'Jõua koopas 8. sügavusele', ok: s => (s.st.deepest || 0) >= 8, fame: 25 },
  { id: 'a26', n: 'Varanduste isand', d: 'Leia 10 peidetud aaret', ok: s => (s.st.treasures || 0) >= 10, fame: 30 },
  { id: 'a27', n: 'Kuldne labidas', d: 'Leia aare juba esimese kaevamisega', ok: s => (s.st.firstDig || 0) >= 1, fame: 15 },
);
