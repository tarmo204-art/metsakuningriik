/* =====================================================================
   SADAM: laevastik ja ekspeditsioonid
   Laevad (4 klassi, 6 näitajat), laevatöökoda (7 osa – iga täiustus muudab laeva välimust),
   meeskond, 5 järk-järgult avanevat piirkonda (oma maastik, kalad, ressursid, paigad ja boss),
   retked serveri taimeriga, juhuslikud sündmused (osa valikuga), logiraamat ja auhinnad.
   Kõik arvutused ja auhinnad teeb server (fleet_* funktsioonid).
   ===================================================================== */
const SD = { d: null, at: 0, loading: false, busy: false, sub: 'laevad', ship: null, region: 'metsajarv', res: null, off: 0 };
const SD_SUBS = [['laevad', 'ship', 'Laevad'], ['kaart', 'map', 'Merekaart'], ['tookoda', 'wrench', 'Laevatöökoda'], ['meeskond', 'users', 'Meeskond'], ['logi', 'scroll-text', 'Logiraamat']];
const SD_STATS = [['spd', 'gauge', 'Kiirus'], ['vast', 'shield-check', 'Vastupidavus'], ['cap', 'package', 'Lastiruum'], ['avast', 'compass', 'Avastamisoskus'], ['kaitse', 'shield', 'Kaitsevõime'], ['pyuk', 'fish', 'Kalapüük']];
const SD_KIND = { avasta: ['Avastusretk', 'compass', 'Otsi piirkonnast uus paik. Avastamisoskus aitab.'], pyuk: ['Püügiretk', 'fish', 'Laev püüab võrkudega kala. Lastiruum ja võrgud loevad.'], boss: ['Bossi jaht', 'skull', 'Rünnak piirkonna bossile. Kaitsevõime ja vastupidavus loevad.'] };
const SD_CREW = { kapten: ['Kapten', 'Kaitsevõime +4% ja vastupidavus +3% iga taseme kohta.', 'shield'], tuurimees: ['Tüürimees', 'Kiirus ja avastamisoskus +4% iga taseme kohta.', 'compass'], kalur: ['Vanem kalur', 'Kalapüük +5% ja lastiruum +3% iga taseme kohta.', 'fish'] };
const SD_REG = { // piirkondade värvid ja meeleolu
  metsajarv: { a: '#5fbf8f', sky: ['#9fd6c8', '#2f6d6a'], water: ['#2d7f86', '#0f3a44'] },
  sugavjarv: { a: '#5a8fe0', sky: ['#5c7ea8', '#1a2c4a'], water: ['#1d3f78', '#050f24'] },
  udusoo: { a: '#a4c08a', sky: ['#9aa79a', '#3c4a44'], water: ['#3f5a4c', '#17241e'] },
  kulmajarv: { a: '#9fe0ff', sky: ['#cfe8f6', '#6f9ab8'], water: ['#6aaed0', '#1d4664'] },
  tulejarv: { a: '#ff8a3c', sky: ['#5a1c14', '#1a0806'], water: ['#b8441c', '#3a0e06'] }
};
Object.assign(LU, {
  anchor: '<path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><circle cx="12" cy="5" r="3"/>',
  compass: '<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>',
  wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  ship: '<path d="M12 10.189V14"/><path d="M12 2v3"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-8.188-3.639a2 2 0 0 0-1.624 0L3 14a11.6 11.6 0 0 0 2.81 7.76"/><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  'scroll-text': '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  skull: '<path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>'
});
function sdT(t) { return (SD.d && SD.d.types || []).find(x => x.id === t) || {} }
function sdReg(id) { return (SD.d && SD.d.regions || []).find(r => r.id === id) || {} }
function sdN(id, k) { const N = SD.d && SD.d.names || {}; return (N[k || 'mats'] || {})[id] || (N.items || {})[id] || (N.baits || {})[id] || id }
function sdIt(id) { return typeof gearCv === 'function' ? gearCv('item', id, 'gi') : '' }
function sdHave(id, k) { return ((SD.d && SD.d.stock && SD.d.stock[k]) || {})[id] || 0 }
function sdNow() { return Date.now() + SD.off }
function sdLeft(ms) { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m}:${String(s).padStart(2, '0')}` }
function sdLvl(s) { return 1 + Object.values(s.parts || {}).reduce((a, b) => a + (+b || 0), 0) }
function sdCostTxt(c) {
  if (!c) return '';
  const p = [];
  if (c.gold) p.push(`<span class="sd-c g ${SD.d.gold < c.gold ? 'no' : ''}">${luc('coins')}${fmt(c.gold)}</span>`);
  if (c.food) p.push(`<span class="sd-c">${ic('food')}${fmt(c.food)} toitu</span>`);
  if (c.wood) p.push(`<span class="sd-c ${(SD.d.res || {}).wood < c.wood ? 'no' : ''}">${ic('wood')}${fmt(c.wood)} puitu</span>`);
  for (const [k, v] of Object.entries(c.mats || {})) p.push(`<span class="sd-c ${sdHave(k, 'mats') < v ? 'no' : ''}" title="Sul on ${sdHave(k, 'mats')}">${typeof matIc === 'function' ? matIc(k, 18) : ''}${v} ${esc(sdN(k, 'mats').toLowerCase())}</span>`);
  for (const [k, v] of Object.entries(c.items || {})) p.push(`<span class="sd-c ${sdHave(k, 'items') < v ? 'no' : ''}" title="Sul on ${sdHave(k, 'items')}">${sdIt(k)}${v} ${esc(sdN(k, 'items').toLowerCase())}</span>`);
  return `<div class="sd-cost">${p.join('')}</div>`;
}

/* ---------- laeva joonistus: klass + iga osa tase muudavad välimust ---------- */
function sdShip(type, parts, o) {
  o = o || {}; const P = k => +((parts || {})[k] || 0), rank = sdT(type).rank || { kaluripaat: 1, avastaja: 2, ekspeditsioon: 3, kuninglik: 4 }[type] || 1;
  const uid = 'sh' + Math.random().toString(36).slice(2, 7), W = 260, wl = 150;
  const L = [0, 120, 150, 172, 196][rank], x0 = (W - L) / 2, x1 = x0 + L, dh = [0, 26, 30, 38, 44][rank], dy = wl - dh + 8;
  const kere = P('kere'), puri = P('puri'), moot = P('mootor'), last = P('lastiruum'), komp = P('kompass'), vork = P('vorgud'), kai = P('kaitse');
  const sailCol = puri >= 4 ? ['#f4f0e6', '#2f6fb8'] : puri >= 2 ? ['#f1e6c8', '#b8402c'] : ['#e9e0c8', '#e9e0c8'], gold = kere >= 5 || rank === 4;
  let s = `<svg viewBox="0 0 ${W} 190" class="sd-ship${o.sail ? ' sail' : ''}" aria-hidden="true"><defs>
    <linearGradient id="${uid}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${rank === 4 ? '#6a3a20' : '#8a5a34'}"/><stop offset="1" stop-color="${rank === 4 ? '#3a1c0c' : '#4a2c14'}"/></linearGradient>
    <linearGradient id="${uid}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sailCol[0]}"/><stop offset="1" stop-color="#cfc4a8"/></linearGradient>
    <linearGradient id="${uid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6206"/><stop offset=".5" stop-color="#ffe7a0"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs><g class="sd-bob">`;
  // mastid ja purjed
  const masts = [[0, [], [.5]], [1, [.5]], [2, [.35, .68]], [2, [.32, .62]], [3, [.25, .5, .74]]][rank][1] || [.5];
  const sc = .8 + puri * .06;
  masts.forEach((m, i) => {
    const mx = x0 + L * m, mh = (70 + rank * 8 + (i === Math.floor(masts.length / 2) ? 14 : 0)) * (0.95 + puri * .02), top = dy - mh;
    s += `<rect x="${mx - 2}" y="${top}" width="4" height="${mh + 6}" fill="#4a2c14"/>`;
    const sw = (26 + rank * 4) * sc, sh = mh * .78;
    for (let k = 0; k < (rank >= 3 ? 2 : 1); k++) {
      const yy = top + 8 + k * sh * .52, hh = rank >= 3 ? sh * .46 : sh * .82;
      s += `<path d="M${mx - sw / 2} ${yy} Q${mx} ${yy + 6} ${mx + sw / 2} ${yy} L${mx + sw / 2 + 3} ${yy + hh} Q${mx} ${yy + hh + 8} ${mx - sw / 2 - 3} ${yy + hh} Z" fill="url(#${uid}s)" stroke="rgba(0,0,0,.25)" class="sd-sl"/>`;
      if (puri >= 2) s += `<path d="M${mx - sw / 2 + 2} ${yy + hh * .45} h${sw - 4}" stroke="${sailCol[1]}" stroke-width="${puri >= 4 ? 6 : 4}" opacity=".85"/>`;
      if (puri >= 5 && k === 0 && i === Math.floor(masts.length / 2)) s += `<circle cx="${mx}" cy="${yy + hh * .45}" r="7" fill="url(#${uid}g)" stroke="#6a4a10"/>`;
    }
    s += `<path d="M${mx} ${top} l${rank === 4 ? 18 : 12} 4 l-${rank === 4 ? 18 : 12} 4z" fill="${rank === 4 ? '#c8302a' : sailCol[1] === '#e9e0c8' ? '#3a8a6a' : sailCol[1]}" class="sd-flag"/>`;
    if (komp >= 3 && i === masts.length - 1) s += `<rect x="${mx - 7}" y="${top + 16}" width="14" height="6" rx="2" fill="#4a2c14"/>`;
  });
  // korsten (mootor 3+), aerud (mootor 1–2)
  if (moot >= 3) { const cx = x0 + L * (rank === 1 ? .78 : .86); s += `<rect x="${cx - 6}" y="${dy - 26}" width="12" height="28" rx="2" fill="#2a2e32"/><rect x="${cx - 8}" y="${dy - 30}" width="16" height="6" rx="2" fill="${moot >= 5 ? `url(#${uid}g)` : '#3a3e42'}"/>${o.sail ? `<g class="sd-smoke">${[0, 1, 2].map(k => `<circle cx="${cx}" cy="${dy - 34}" r="${5 + k * 2}" fill="#9aa4a8" style="animation-delay:${k * .6}s"/>`).join('')}</g>` : ''}` }
  // lastiruumi kastid ja tünnid tekil
  for (let k = 0; k < last; k++) { const bx = x0 + L * .18 + k * 12; s += k % 2 ? `<rect x="${bx}" y="${dy - 9}" width="10" height="9" fill="#a8763a" stroke="#5a3a14"/>` : `<ellipse cx="${bx + 5}" cy="${dy - 5}" rx="5" ry="5.5" fill="#8a5a2a" stroke="#4a2c10"/>` }
  // kere
  const stern = rank >= 3 ? 16 : 6;
  s += `<path d="M${x0 - 8} ${dy - stern} L${x0 + 16} ${dy} L${x1 - 6} ${dy} L${x1 + 14} ${dy - 10} L${x1 - 4} ${wl + 6} L${x0 + 14} ${wl + 6} Z" fill="url(#${uid}h)" stroke="rgba(0,0,0,.5)" stroke-width="1.5"/>`;
  if (rank >= 3) s += `<rect x="${x0 - 6}" y="${dy - stern - 10}" width="${L * .2}" height="12" fill="#5a3418" stroke="rgba(0,0,0,.4)"/>`;
  for (let k = 0; k < Math.min(4, kere); k++) s += `<path d="M${x0 + 10} ${dy + 6 + k * 5} H${x1 - 6}" stroke="${kere >= 5 ? `url(#${uid}g)` : '#3a3a3a'}" stroke-width="2" opacity=".85"/>`;
  if (kere >= 3) s += `<path d="M${x0 + 16} ${wl + 2} H${x1 - 6}" stroke="#2f8f6a" stroke-width="6" opacity=".85"/>`;
  if (gold) s += `<path d="M${x0 - 8} ${dy - stern} L${x0 + 16} ${dy} L${x1 - 6} ${dy} L${x1 + 14} ${dy - 10}" stroke="url(#${uid}g)" stroke-width="2.5" fill="none"/>`;
  // kaitse: kilbid ja kahurid
  for (let k = 0; k < kai; k++) s += `<circle cx="${x0 + 26 + k * (L - 50) / 5}" cy="${dy + 4}" r="5" fill="${k % 2 ? '#2f6fb8' : '#b8402c'}" stroke="#e8d6a0" stroke-width="1.2"/>`;
  if (kai >= 3) for (let k = 0; k < Math.min(3, rank); k++) s += `<rect x="${x0 + 40 + k * 34}" y="${dy + 12}" width="9" height="6" rx="1.5" fill="#1a1a1a"/>`;
  if (kai >= 5) s += `<path d="M${x1 + 8} ${dy - 14} l18 -8" stroke="#3a3e42" stroke-width="4" stroke-linecap="round"/><path d="M${x1 + 24} ${dy - 24} l8 -2 -6 6z" fill="#c8c8c8"/>`;
  // võrgud ahtris
  if (vork) { const nx = x0 + 4, nl = 14 + vork * 6; s += `<path d="M${nx} ${dy - 4} q-${nl / 2} ${nl / 2} -${nl * .4} ${nl + 10}" stroke="#c8b88a" fill="none" stroke-width="1.5"/><path d="M${nx - 2} ${dy} l-${nl * .5} ${nl} m${nl * .1} -${nl * .9} l-${nl * .3} ${nl}" stroke="rgba(220,210,170,.6)" stroke-width="1"/>${vork >= 3 ? `<circle cx="${nx - nl * .45}" cy="${dy + nl + 6}" r="3" fill="#e8582a"/>` : ''}` }
  // kompass: latern ahtris, 5. tasemel säde
  if (komp >= 1) s += `<rect x="${x0 - 3}" y="${dy - stern - (rank >= 3 ? 24 : 14)}" width="7" height="9" rx="2" fill="${o.sail ? '#ffd86a' : '#d8b860'}" class="${o.sail ? 'sd-lamp' : ''}"/>`;
  if (komp >= 5) s += `<path d="M${x1 + 2} ${dy - 30} l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill="#ffe27a" class="sd-glint"/>`;
  s += `</g><path d="M0 ${wl + 4} q16 -6 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 V190 H0z" fill="rgba(40,140,160,.35)" class="sd-wave"/>
    <path d="M0 ${wl + 10} q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V190 H0z" fill="rgba(20,90,110,.45)" class="sd-wave b"/></svg>`;
  return s;
}
/* ---------- piirkonna maastik ---------- */
function sdScene(id, extra) {
  const R = SD_REG[id] || SD_REG.metsajarv, u = 'sc' + id;
  let land = '', fx = '';
  if (id === 'metsajarv') land = [...Array(14)].map((_, i) => { const x = i * 24 - 6, h = 30 + (i * 37 % 26); return `<path d="M${x} 112 l12 -${h} l12 ${h}z" fill="#1d4a3a"/>` }).join('');
  if (id === 'sugavjarv') land = `<path d="M0 112 L0 40 L40 30 L70 60 L100 46 L100 112z" fill="#1a2438"/><path d="M220 112 L230 50 L270 36 L320 70 L320 112z" fill="#141c2e"/>`;
  if (id === 'udusoo') { land = [...Array(30)].map((_, i) => `<path d="M${i * 11} 116 q2 -${16 + i % 5 * 4} ${4 - i % 3} -${26 + i % 4 * 5}" stroke="#4a5a3a" stroke-width="2" fill="none"/>`).join(''); fx = `<rect x="-40" y="50" width="400" height="40" fill="rgba(220,230,220,.25)" class="sd-fog"/><rect x="-60" y="80" width="420" height="30" fill="rgba(220,230,220,.18)" class="sd-fog b"/>` }
  if (id === 'kulmajarv') { land = `<path d="M0 112 L30 40 L60 70 L100 20 L150 80 L190 50 L240 90 L290 30 L320 60 L320 112z" fill="#e8f4fb"/><path d="M100 20 L112 40 L92 44z M290 30 L300 46 L282 48z" fill="#fff"/>`; fx = [...Array(14)].map((_, i) => `<circle cx="${i * 23 + 8}" cy="${(i * 31) % 100}" r="1.6" fill="#fff" class="sd-snow" style="animation-delay:${i * .37}s"/>`).join('') + `<path d="M60 130 l30 -6 l24 4 l-12 6z M210 140 l26 -4 l18 6 l-20 4z" fill="#f4fbff" opacity=".9"/>` }
  if (id === 'tulejarv') { land = `<path d="M90 112 L140 30 L180 30 L230 112z" fill="#2a0c06"/><path d="M140 30 L160 44 L180 30" fill="#ff7a2a" class="sd-lava"/><path d="M0 112 L40 80 L70 112z M260 112 L300 70 L320 112z" fill="#1a0604"/>`; fx = [...Array(12)].map((_, i) => `<circle cx="${130 + i * 6}" cy="40" r="1.8" fill="#ffb04a" class="sd-ember" style="animation-delay:${i * .3}s;--dx:${(i % 2 ? 1 : -1) * (6 + i * 3)}px"/>`).join('') + `<path d="M40 150 q30 -6 60 0 M180 160 q40 -8 80 0" stroke="#ffb04a" stroke-width="2" fill="none" opacity=".7"/>` }
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" class="sd-scene" aria-hidden="true"><defs>
    <linearGradient id="${u}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${R.sky[0]}"/><stop offset="1" stop-color="${R.sky[1]}"/></linearGradient>
    <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${R.water[0]}"/><stop offset="1" stop-color="${R.water[1]}"/></linearGradient></defs>
    <rect width="320" height="120" fill="url(#${u}a)"/>${land}<rect y="110" width="320" height="70" fill="url(#${u}b)"/>
    <path d="M0 118 q20 -3 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="rgba(255,255,255,.18)" fill="none"/>${fx}${extra || ''}</svg>`;
}

async function sdLoad(silent) {
  if (SD.loading) return; SD.loading = true;
  try { sdSet(await rpc('fleet_state')) } catch (e) { if (!silent) toast('Sadamat ei õnnestunud laadida: ' + e.message, 'bad') }
  SD.loading = false; if (FV.open && FV.tab === 'sadam') renderFV(true);
}
function sdSet(d) { SD.d = d; SD.at = Date.now(); SD.off = Date.parse(d.now) - Date.now(); if (!SD.ship || !(d.ships || []).some(s => s.id === SD.ship)) SD.ship = d.ships && d.ships[0] ? d.ships[0].id : null }
function sdShipById(id) { return (SD.d.ships || []).find(s => s.id === id) }

function sdTab() {
  if (!SD.d || Date.now() - SD.at > 60000) sdLoad(true);
  if (!SD.d) return '<div class="fv-card"><p class="lead">Laen sadamat…</p></div>';
  const D = SD.d;
  if (D.level < D.min_level) return `<div class="fv-card sd-lock">${sdScene('metsajarv')}<div><h2>${luc('anchor')} Sadam</h2><p class="lead">Sadam avaneb kalapüügi <b>${D.min_level}. tasemel</b>. Siis saad ehitada esimese laeva ja saata selle avastama kaugeid järvi.</p></div></div>`;
  const ready = (D.ships || []).filter(s => s.voyage && Date.parse(s.voyage.ready_at) <= sdNow()).length;
  let h = `<div class="sd-nav" role="tablist">${SD_SUBS.map(([k, icn, n]) => `<button type="button" role="tab" aria-selected="${SD.sub === k}" class="${SD.sub === k ? 'on' : ''}" data-sd="sub" data-arg="${k}">${luc(icn)}<span>${n}</span>${k === 'laevad' && ready ? `<i>${ready}</i>` : ''}</button>`).join('')}</div>`;
  if (SD.sub === 'laevad') h += sdShips();
  else if (SD.sub === 'kaart') h += sdMap();
  else if (SD.sub === 'tookoda') h += sdYard();
  else if (SD.sub === 'meeskond') h += sdCrew();
  else h += sdLog();
  return h;
}
function sdStatsHtml(st, prev) {
  const max = { spd: 40, vast: 250, cap: 80, avast: 80, kaitse: 90, pyuk: 80 };
  return `<div class="sd-stats">${SD_STATS.map(([k, icn, n]) => `<div><span class="sd-si">${luc(icn)}</span><small>${n}</small><b>${st[k]}${prev && prev[k] !== st[k] ? `<em>+${st[k] - prev[k]}</em>` : ''}</b><i style="--w:${Math.min(100, st[k] / max[k] * 100).toFixed(0)}%"></i></div>`).join('')}</div>`;
}
function sdVoyageBar(s) {
  const v = s.voyage; if (!v) return '';
  const a = Date.parse(v.started_at), b = Date.parse(v.ready_at), t = sdNow(), done = t >= b, R = sdReg(v.region);
  return `<div class="sd-voy ${done ? 'done' : ''}" style="--ra:${(SD_REG[v.region] || {}).a || '#7ec8e3'}">
    <div class="sd-vt">${luc(SD_KIND[v.kind][1])}<span><b>${SD_KIND[v.kind][0]}</b> · ${esc(R.name || '')}</span><b class="sd-vtime" data-sdt="${b}">${done ? 'Tagasi!' : sdLeft(b - t)}</b></div>
    <div class="sd-track"><i data-sdp="${a}|${b}" style="width:${Math.min(100, (t - a) / (b - a) * 100).toFixed(1)}%"></i><span class="sd-mini" data-sdm="${a}|${b}" style="left:${Math.min(100, (t - a) / (b - a) * 100).toFixed(1)}%">${luc('ship')}</span></div>
    ${done ? `<button class="btn sm sd-open" type="button" data-sd="collect" data-arg="${v.id}">${luc('scroll-text')} ${v.status === 'choice' ? 'Kapten ootab otsust' : 'Ava logiraamat'}</button>` : ''}</div>`;
}
function sdShips() {
  const D = SD.d, own = D.ships || [];
  let h = '';
  if (own.length) {
    h += own.map(s => {
      const T = sdT(s.type), atSea = !!s.voyage;
      return `<div class="fv-card sd-card ${atSea ? 'sea' : ''}"><div class="sd-pic">${sdShip(s.type, s.parts, { sail: atSea })}</div>
        <div class="sd-info"><div class="sd-ttl"><h2>${esc(T.name)}</h2><span class="sd-lv">Tase ${sdLvl(s)}</span></div>
          <div class="sd-cond"><small>Seisukord</small><div class="sd-bar ${s.cond < 25 ? 'bad' : s.cond < 60 ? 'mid' : ''}"><i style="width:${s.cond}%"></i></div><b>${s.cond}%</b></div>
          ${sdStatsHtml(s.stats)}
          ${atSea ? sdVoyageBar(s) : `<div class="kt-act"><button class="btn sm" type="button" data-sd="go" data-arg="${s.id}">${luc('map')} Saada retkele</button>
            <button class="btn sm ghost" type="button" data-sd="yard" data-arg="${s.id}">${luc('wrench')} Täiusta</button>
            ${s.cond < 100 ? `<button class="btn sm ghost" type="button" data-sd="repair" data-arg="${s.id}" ${SD.busy ? 'disabled' : ''}>${luc('hammer')} Remondi (${fmt(s.repair)} kulda)</button>` : ''}</div>`}
        </div></div>`;
    }).join('');
  }
  const rest = (D.types || []).filter(t => !own.some(s => s.type === t.id));
  if (rest.length) h += `<div class="fv-card"><h2>${luc('anchor')} Laevaehitus</h2><p class="lead">Iga laevaklass on eri tugevustega. Ehitatud laeva saad Laevatöökojas täiustada – iga täiustus on laeval ka näha.</p>
    <div class="sd-build">${rest.map(t => { const lock = D.level < t.min_level;
      return `<div class="sd-bt ${lock ? 'lock' : ''}">${sdShip(t.id, {}, {})}<h3>${esc(t.name)}</h3><small class="lead">${esc(t.descr)}</small>
        ${sdStatsHtml(t)}
        ${lock ? `<span class="sd-req">${luc('lock')} Kalapüügi ${t.min_level}. tase</span>` : `<button class="btn" type="button" data-sd="buy" data-arg="${t.id}" ${SD.busy ? 'disabled' : ''}>${luc('hammer')} Ehita – ${fmt(t.price)} kulda</button>`}</div>` }).join('')}</div></div>`;
  return h;
}
function sdMap() {
  const D = SD.d, R = sdReg(SD.region), RC = SD_REG[R.id] || {}, open = R.open;
  const sites = R.sites || [], found = R.found || [], allFound = found.length >= sites.length;
  const atSea = (D.ships || []).filter(s => s.voyage && s.voyage.region === R.id);
  // paikade sõlmed kaardil (rada vasakult paremale), laev liigub raja peal
  const pts = [[30, 140], [105, 118], [180, 135], [255, 108], [298, 130]];
  const path = 'M' + pts.map(p => p.join(' ')).join(' L');
  let ext = `<path d="${path}" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-dasharray="4 5" fill="none"/>`;
  ext += `<g transform="translate(30 140)"><circle r="9" fill="#0d2228" stroke="#e8b65a" stroke-width="2"/><path d="M-3 -1 l3 -5 3 5 -3 4z" fill="#e8b65a"/></g>`;
  sites.forEach((st, i) => { const f = found.includes(st.id), [x, y] = pts[i + 1]; ext += `<g transform="translate(${x} ${y})" class="${f ? 'sd-node on' : 'sd-node'}"><circle r="11" fill="${f ? RC.a : 'rgba(10,20,24,.75)'}" stroke="#fff" stroke-width="${f ? 2 : 1}" stroke-opacity="${f ? 1 : .4}"/><text y="4" text-anchor="middle" font-size="11" font-weight="800" fill="${f ? '#0d2228' : '#cfe0e4'}">${f ? i + 1 : '?'}</text></g>` });
  const [bx, by] = pts[4];
  ext += `<g transform="translate(${bx} ${by})" class="sd-node boss ${R.boss_dead ? 'dead' : allFound ? 'on' : ''}"><circle r="13" fill="${R.boss_dead ? '#3a3a3a' : allFound ? '#b8302a' : 'rgba(10,20,24,.75)'}" stroke="#ffd27a" stroke-width="2"/><g transform="translate(-8 -8) scale(.68)" stroke="#fff" fill="none" stroke-width="2">${LU.skull}</g></g>`;
  atSea.forEach((s, i) => { const v = s.voyage, a = Date.parse(v.started_at), b = Date.parse(v.ready_at); ext += `<g class="sd-boat" data-sdb="${a}|${b}|${v.kind}|${found.length}" style="--d:${i}">${sdBoatMark()}</g>` });
  let h = `<div class="sd-regs">${D.regions.map(r => `<button type="button" class="sd-rg ${r.id === SD.region ? 'on' : ''} ${r.open ? '' : 'lock'}" data-sd="reg" data-arg="${r.id}" style="--ra:${(SD_REG[r.id] || {}).a}">${r.open ? '' : luc('lock')}<b>${r.ord}. ${esc(r.name)}</b>${r.boss_dead ? `<small>${luc('crown')} võidetud</small>` : r.open ? `<small>${r.found.length}/${r.sites.length} paika</small>` : '<small>suletud</small>'}</button>`).join('')}</div>`;
  h += `<div class="fv-card sd-region" style="--ra:${RC.a}"><div class="sd-sc">${sdScene(R.id, open ? ext : '')}${open ? '' : `<div class="sd-locked">${luc('lock')}<b>Suletud piirkond</b><span>Võida enne „${esc((D.regions.find(x => x.ord === R.ord - 1) || {}).boss ? D.regions.find(x => x.ord === R.ord - 1).boss.name : '')}“ eelmises piirkonnas. Vaja ka laeva: ${esc((D.types.find(t => t.rank === R.min_rank) || {}).name || '')} või tugevam.</span></div>`}
    <div class="sd-rt"><h2>${esc(R.name)}</h2><span class="sd-diff" title="Raskus">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= R.diff ? 'on' : ''}"></i>`).join('')}</span></div></div>
    <p class="lead" style="margin:10px 0">${esc(R.descr)}</p>
    <div class="sd-cols"><div><h3>${luc('fish')} Kalaliigid</h3><div class="sd-fish">${R.species.map(id => { const sp = D.spnames[id] || {}; return `<span title="${esc(sp.name || id)}"><canvas data-fl="${id}" data-r="${sp.rarity || 1}" data-nobg="1"></canvas><small>${esc(sp.name || id)}</small></span>` }).join('')}</div></div>
      <div><h3>${luc('gem')} Ressursid ja leiud</h3><div class="sd-res">${Object.keys(R.res.mats || {}).map(k => `<span>${typeof matIc === 'function' ? matIc(k, 20) : ''}${esc(sdN(k, 'mats'))}</span>`).join('')}${Object.keys(R.res.items || {}).map(k => `<span class="r">${sdIt(k)}${esc(sdN(k, 'items'))}</span>`).join('')}${Object.keys(R.res.baits || {}).map(k => `<span class="b">${luc('bug')}${esc(sdN(k, 'baits'))}</span>`).join('')}</div></div></div>
    <h3 style="margin-top:12px">${luc('map-pin')} Paigad</h3><div class="sd-sites">${sites.map((st, i) => found.includes(st.id) ? `<div class="on"><b>${i + 1}. ${esc(st.name)}</b><small>${esc(st.descr)}</small></div>` : `<div><b>${i + 1}. ???</b><small>Avastamata. Saada laev avastusretkele.</small></div>`).join('')}</div>
    <div class="sd-boss ${R.boss_dead ? 'dead' : allFound ? 'ready' : ''}"><span class="sd-bi">${luc(R.boss_dead ? 'crown' : 'skull')}</span><div><b>${esc(R.boss.name)}</b><small>${esc(R.boss.descr)}</small>
      <div class="sd-hp"><i style="width:${(R.boss_hp / R.boss.hp * 100).toFixed(1)}%"></i><span>${R.boss_dead ? 'Võidetud!' : `${fmt(R.boss_hp)} / ${fmt(R.boss.hp)} elu`}</span></div>
      <small>${R.boss_dead ? 'Võit avas järgmise piirkonna.' : allFound ? 'Bossi pesa on leitud – saada laev bossi jahile!' : 'Bossi pesa leiad, kui kõik 3 paika on avastatud.'} Auhind: ${fmt(R.boss.reward.gold)} kulda, haruldased materjalid, erisööt ja legendaarne kala.</small></div></div>
    ${open ? sdSend(R, allFound) : ''}</div>`;
  return h;
}
function sdBoatMark() { return `<g transform="translate(-10 -14)"><path d="M2 14 h16 l-3 5 h-10z" fill="#5a3418"/><path d="M10 0 v14" stroke="#3a2010" stroke-width="1.5"/><path d="M10 1 l7 11 h-7z" fill="#f4ecd8"/></g>` }
function sdSend(R, allFound) {
  const D = SD.d, free = (D.ships || []).filter(s => !s.voyage);
  if (!free.length) return `<p class="lead sd-note">${(D.ships || []).length ? 'Kõik laevad on praegu retkel.' : 'Sul pole veel laeva. Ehita see vahekaardil „Laevad“.'}</p>`;
  if (!SD.sendShip || !free.some(s => s.id === SD.sendShip)) SD.sendShip = free[0].id;
  const s = sdShipById(SD.sendShip), T = sdT(s.type), okRank = T.rank >= R.min_rank;
  const kinds = ['avasta', 'pyuk', 'boss'].filter(k => k !== 'boss' || (allFound && !R.boss_dead)).filter(k => k !== 'avasta' || !allFound);
  const mins = k => Math.max(3, Math.round(R.minutes * ({ pyuk: 1.2, boss: .8 }[k] || 1) * 16 / Math.max(5, s.stats.spd)));
  return `<div class="sd-send"><h3>${luc('ship')} Saada retkele</h3>
    <div class="sd-pick">${free.map(x => `<button type="button" class="${x.id === SD.sendShip ? 'on' : ''}" data-sd="pick" data-arg="${x.id}">${sdShip(x.type, x.parts, {})}<b>${esc(sdT(x.type).name)}</b><small>${x.cond}% korras</small></button>`).join('')}</div>
    ${okRank ? '' : `<p class="sd-warn">${luc('triangle-alert')} ${esc(R.name)} on selle laeva jaoks liiga ohtlik – vaja vähemalt: ${esc((D.types.find(t => t.rank === R.min_rank) || {}).name)}.</p>`}
    ${s.cond < 25 ? `<p class="sd-warn">${luc('triangle-alert')} Laev on liiga katki. Remondi see enne.</p>` : ''}
    <div class="sd-kinds">${kinds.map(k => `<button type="button" class="sd-k ${k}" data-sd="send" data-arg="${k}" ${!okRank || s.cond < 25 || SD.busy ? 'disabled' : ''}>${luc(SD_KIND[k][1])}<b>${SD_KIND[k][0]}</b><small>${SD_KIND[k][2]}</small>
      <span class="sd-kf">${luc('timer')} ${mins(k)} min · ${ic('food')} ${Math.round(R.food * (k === 'boss' ? 1.5 : 1))}${+(s.parts || {}).mootor >= 1 ? ` · ${typeof matIc === 'function' ? matIc('kask', 16) : ''}${R.ord * 2} kaske` : ''}</span></button>`).join('')}</div>
    <small class="lead">Proviant (toit) võetakse kuningriigi laost. Mootoriga laev vajab ka küttepuid (kask). Retk kulgeb ka siis, kui oled mängust eemal.</small></div>`;
}
function sdYard() {
  const D = SD.d, own = D.ships || [];
  if (!own.length) return '<div class="fv-card"><p class="lead">Laevatöökojas saad laeva täiustada, kui oled esimese laeva ehitanud.</p></div>';
  const s = sdShipById(SD.ship) || own[0], T = sdT(s.type), atSea = !!s.voyage;
  return `<div class="sd-pick top">${own.map(x => `<button type="button" class="${x.id === s.id ? 'on' : ''}" data-sd="ship" data-arg="${x.id}">${sdShip(x.type, x.parts, {})}<b>${esc(sdT(x.type).name)}</b><small>Tase ${sdLvl(x)}</small></button>`).join('')}</div>
    <div class="fv-card sd-yard"><div class="sd-pic big">${sdShip(s.type, s.parts, { sail: true })}</div><div><div class="sd-ttl"><h2>${esc(T.name)}</h2><span class="sd-lv">Tase ${sdLvl(s)}</span></div>${sdStatsHtml(s.stats, SD.prevStats && SD.prevStats.id === s.id ? SD.prevStats.st : null)}
      ${atSea ? `<p class="sd-warn">${luc('anchor')} Laev on retkel – täiustada saab siis, kui ta on sadamas.</p>` : ''}</div></div>
    <div class="sd-parts">${D.parts.map(p => { const l = +(s.parts || {})[p.id] || 0, c = s.costs[p.id];
      return `<div class="fv-card sd-part"><div class="sd-ph"><span class="sd-pi">${luc({ puri: 'wind', kere: 'shield-check', mootor: 'gauge', lastiruum: 'package', kompass: 'compass', vorgud: 'fish', kaitse: 'shield' }[p.id])}</span><div><b>${esc(p.name)}</b><small>${esc(p.descr)}</small></div></div>
        <div class="sd-pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= l ? 'on' : ''}"></i>`).join('')}<span>+${p.per * (p.id === 'lastiruum' ? T.rank : 1)} ${(SD_STATS.find(x => x[0] === p.stat) || [])[2]?.toLowerCase()}</span></div>
        ${c ? `${sdCostTxt(c)}<button class="btn sm" type="button" data-sd="upg" data-arg="${p.id}" ${atSea || SD.busy ? 'disabled' : ''}>${luc('hammer')} Täiusta tasemele ${l + 1}</button>` : `<span class="sd-max">${luc('crown')} Parim</span>`}</div>` }).join('')}</div>`;
}
function sdCrew() {
  const D = SD.d;
  return `<div class="fv-card"><h2>${luc('users')} Meeskond</h2><p class="lead">Meeskond töötab kõigil laevadel. Iga retk annab kogemust – mida rohkem retki, seda kõrgemale saad meeskonda koolitada. Retki tehtud: <b>${D.voyages}</b>.</p>
    <div class="sd-crew">${Object.entries(SD_CREW).map(([k, [n, d, icn]]) => { const l = +D.crew[k] || 1, need = l * 2, ok = D.voyages >= need;
      return `<div class="sd-cm"><span class="sd-av">${luc(icn)}<b>${l}</b></span><div><h3>${n}</h3><small class="lead">${d}</small>
        <div class="sd-pips">${[...Array(10)].map((_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>
        ${l >= 10 ? `<span class="sd-max">${luc('crown')} Meister</span>` : ok ? `<button class="btn sm" type="button" data-sd="crew" data-arg="${k}" ${SD.busy ? 'disabled' : ''}>Koolita – ${fmt(D.crew_cost[k])} kulda</button>` : `<small class="sd-req">${luc('lock')} Vaja veel ${need - D.voyages} retke</small>`}</div></div>` }).join('')}</div></div>`;
}
function sdLog() {
  const L = SD.d.log || [];
  if (!L.length) return '<div class="fv-card"><p class="lead">Logiraamat on veel tühi. Siia kirjutatakse iga retke lugu.</p></div>';
  return L.map(v => `<div class="fv-card sd-logc" style="--ra:${(SD_REG[v.region] || {}).a}"><div class="sd-lh">${luc(SD_KIND[v.kind][1])}<b>${SD_KIND[v.kind][0]} · ${esc(sdReg(v.region).name || '')}</b><small>${new Date(v.taken_at).toLocaleString('et-EE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div>
    <ul class="sd-ll">${(v.log || []).map(e => `<li class="${e.tone || ''}">${luc(e.ic)}<span>${esc(e.t)}</span></li>`).join('')}</ul>
    ${v.sum ? `<div class="sd-sum"><span>${luc('fish')} ${v.sum.fish} kala</span><span>${luc('coins')} ${fmt(v.sum.gold)} kulda</span><span>${luc('zap')} ${v.sum.xp} kogemust</span><span>${luc('shield-check')} laev ${v.sum.cond}%</span></div>` : ''}</div>`).join('');
}
/* ---------- logiraamatu aken (retke lõpp) ---------- */
function sdResult(vg) {
  const a = vg.result || {}, R = sdReg(vg.region), ch = !vg.done && a.choice;
  const fish = (a.fish || []), items = Object.entries(a.items || {}), mats = Object.entries(a.mats || {}), baits = Object.entries(a.baits || {});
  const epic = a.boss_dead || fish.some(f => f.rarity >= 5 || f.boss);
  return `<div class="sd-rs ${epic ? 'epic' : ''}" style="--ra:${(SD_REG[vg.region] || {}).a}"><div class="sd-rh">${sdScene(vg.region)}<div><small>${luc('scroll-text')} Logiraamat</small><h2>${SD_KIND[vg.kind][0]} · ${esc(R.name || '')}</h2></div></div>
    <ul class="sd-ll anim">${(a.log || []).map((e, i) => `<li class="${e.tone || ''}" style="animation-delay:${(i * .35).toFixed(2)}s">${luc(e.ic)}<span>${esc(e.t)}</span></li>`).join('')}</ul>
    ${ch ? `<div class="sd-choice"><h3>${esc(ch.title)}</h3><p>${esc(ch.text)}</p><div>${ch.opts.map(o => `<button class="btn" type="button" data-sd="choose" data-arg="${vg.id}|${o.id}"><b>${esc(o.t)}</b><small>${esc(o.d)}</small></button>`).join('')}</div></div>`
      : `${a.boss_dead ? `<div class="sd-bossdead">${luc('crown')}<b>${esc(R.boss.name)} on alistatud!</b></div>` : a.boss_dmg ? `<div class="sd-hp big"><i style="width:${(a.boss_hp / a.boss_max * 100).toFixed(1)}%"></i><span>${esc(R.boss.name)}: ${fmt(a.boss_hp)} / ${fmt(a.boss_max)} elu (−${a.boss_dmg})</span></div>` : ''}
      ${fish.length ? `<h3>${luc('fish')} Saak (${fish.length})</h3><div class="sd-fish got">${fish.map(f => `<span class="${f.rarity >= 4 || f.boss ? 'rare' : ''}"><canvas data-fl="${f.species}" data-r="${f.rarity}" data-nobg="1"></canvas><small>${esc((SD.d.spnames[f.species] || FD.sp[f.species] || {}).name || f.species)}</small><b>${fKg(+f.weight)}</b></span>`).join('')}</div>` : ''}
      <div class="sd-sum">${a.gold ? `<span class="g">${luc('coins')} +${fmt(a.gold)} kulda</span>` : ''}${a.sum ? `<span>${luc('zap')} +${a.sum.xp} kogemust</span>` : ''}${items.map(([k, v]) => `<span class="r">${sdIt(k)}${v} × ${esc(sdN(k, 'items'))}</span>`).join('')}${mats.map(([k, v]) => `<span>${typeof matIc === 'function' ? matIc(k, 18) : ''}${v} × ${esc(sdN(k, 'mats'))}</span>`).join('')}${baits.map(([k, v]) => `<span class="b">${luc('bug')}${v} × ${esc(sdN(k, 'baits'))}</span>`).join('')}${a.sum ? `<span>${luc('shield-check')} laev ${a.sum.cond}%</span>` : ''}</div>
      <div class="mbtns" style="justify-content:center"><button class="btn" type="button" data-act="closeModal">Suurepärane!</button></div>`}</div>`;
}
async function sdAct(a, arg) {
  if (a === 'sub') { SD.sub = arg; renderFV(true); return }
  if (a === 'reg') { SD.region = arg; renderFV(true); return }
  if (a === 'pick') { SD.sendShip = +arg; renderFV(true); return }
  if (a === 'ship') { SD.ship = +arg; renderFV(true); return }
  if (a === 'go') { SD.sendShip = +arg; SD.sub = 'kaart'; const open = SD.d.regions.filter(r => r.open); if (!sdReg(SD.region).open) SD.region = open[open.length - 1].id; renderFV(true); return }
  if (a === 'yard') { SD.ship = +arg; SD.sub = 'tookoda'; renderFV(true); return }
  if (SD.busy) return; SD.busy = true; renderFV(true);
  try {
    if (a === 'buy') { const d = await rpc('fleet_buy', { p_type: arg }); sdSet(d); SD.ship = (d.ships.find(s => s.type === arg) || {}).id; toast(`${d.built} on vette lastud!`, 'gold', 'fish'); if (typeof sfx === 'function') sfx('build') }
    else if (a === 'upg') {
      const s = sdShipById(SD.ship); SD.prevStats = { id: s.id, st: s.stats };
      if (typeof cloudSave === 'function') await cloudSave(true);
      const d = await rpc('fleet_upgrade', { p_ship: SD.ship, p_part: arg }); sdSet(d);
      if (d.spent && d.spent.wood && S && S.res) { S.res.wood = Math.max(0, S.res.wood - d.spent.wood); save() }
      toast(`${(d.parts.find(p => p.id === arg) || {}).name} täiustatud tasemele ${d.upgraded.lvl}!`, 'good', 'gold'); if (typeof sfx === 'function') sfx('build');
      setTimeout(() => { SD.prevStats = null }, 4000);
    }
    else if (a === 'repair') { const d = await rpc('fleet_repair', { p_ship: +arg }); sdSet(d); toast(`Laev on remonditud (−${fmt(d.repaired)} kulda).`, 'good', 'gold') }
    else if (a === 'crew') { const d = await rpc('fleet_crew', { p_role: arg }); sdSet(d); toast(`${SD_CREW[arg][0]} koolitatud – tase ${d.crew[arg]}!`, 'gold', 'fame') }
    else if (a === 'send') {
      if (typeof cloudSave === 'function') await cloudSave(true);
      const d = await rpc('fleet_send', { p_ship: SD.sendShip, p_region: SD.region, p_kind: arg }); sdSet(d);
      if (d.sent.cost && d.sent.cost.food && S && S.res) { S.res.food = Math.max(0, S.res.food - d.sent.cost.food); save() }
      toast(`Laev lahkus sadamast: ${SD_KIND[arg][0].toLowerCase()}, ${d.sent.region}. Tagasi umbes ${d.sent.minutes} minuti pärast.`, 'good', 'fish');
    }
    else if (a === 'collect' || a === 'choose') {
      const [id, c] = String(arg).split('|');
      const d = await rpc('fleet_collect', c ? { p_voyage: +id, p_choice: c } : { p_voyage: +id }); sdSet(d); SD.res = d.voyage;
      if (d.voyage.done) await refreshFS();
      showModal(() => sdResult(SD.res), 'sdmodal');
      setTimeout(() => { const mc = document.getElementById('modalCard'); if (mc) { paintFishCanvases(mc); paintGear(mc) } }, 40);
      if (d.voyage.done && typeof sfx === 'function') sfx(d.voyage.result.boss_dead ? 'levelup' : 'chime');
    }
  } catch (e) { toast(e.message, 'bad') }
  SD.busy = false; renderFV(true);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-sd]'); if (!b || b.disabled) return; sdAct(b.dataset.sd, b.dataset.arg) });
// vahekaart Kalurimaja järele
FTABS.sadam = 'Sadam';
{
  const e = Object.entries(FTABS).filter(([k]) => k !== 'sadam'); for (const k of Object.keys(FTABS)) delete FTABS[k];
  for (const [k, v] of e) { FTABS[k] = v; if (k === 'kalurimaja') FTABS.sadam = 'Sadam' }
  if (!FTABS.sadam) FTABS.sadam = 'Sadam';
}
FTAB_FN.sadam = sdTab;
if (typeof FT_SVG !== 'undefined') FT_SVG.sadam = LU.anchor;
{
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); if (FS && FS.fleet_ready > 0) b.sadam = (b.sadam || 0) + FS.fleet_ready; return b };
}
// taimerid ja laevade liikumine kaardil
setInterval(() => {
  const t = sdNow(); let back = false;
  document.querySelectorAll('[data-sdt]').forEach(el => { const ms = +el.dataset.sdt - t; el.textContent = ms <= 0 ? 'Tagasi!' : sdLeft(ms); if (ms <= 0 && !el.dataset.done) { el.dataset.done = 1; back = true } });
  document.querySelectorAll('[data-sdp]').forEach(el => { const [a, b] = el.dataset.sdp.split('|').map(Number); el.style.width = Math.min(100, (t - a) / (b - a) * 100).toFixed(1) + '%' });
  document.querySelectorAll('[data-sdm]').forEach(el => { const [a, b] = el.dataset.sdm.split('|').map(Number); el.style.left = Math.min(100, (t - a) / (b - a) * 100).toFixed(1) + '%' });
  // kaardil: laev sõidab sadamast sihtkohta ja tagasi
  document.querySelectorAll('[data-sdb]').forEach(el => {
    const [a, b, k, nf] = el.dataset.sdb.split('|'), p = Math.max(0, Math.min(1, (t - +a) / (+b - +a)));
    const pts = [[30, 140], [105, 118], [180, 135], [255, 108], [298, 130]], target = k === 'boss' ? 4 : k === 'avasta' ? Math.min(3, +nf + 1) : Math.max(1, Math.min(3, +nf || 1));
    const q = p < .5 ? p * 2 : (1 - p) * 2, f = q * target, i = Math.min(target - 1, Math.floor(f)), r = f - i, A = pts[i], B = pts[Math.min(4, i + 1)];
    const x = A[0] + (B[0] - A[0]) * r, y = A[1] + (B[1] - A[1]) * r - 4;
    el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${p < .5 ? 1 : -1} 1)`);
  });
  if (back && FV.open && FV.tab === 'sadam') renderFV(true);
}, 1000);
document.head.insertAdjacentHTML('beforeend', `<style>
.sd-nav{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:2px}
.sd-nav button{position:relative;flex:none;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:12px;border:1px solid rgba(134,205,224,.18);background:rgba(255,255,255,.04);color:#dfeaec;font:inherit;font-weight:700;cursor:pointer}
.sd-nav button .lu{width:17px;height:17px;color:#7ec8e3}.sd-nav button.on{background:linear-gradient(180deg,#2f9a96,#1d6a6c);border-color:rgba(130,245,230,.7);color:#fff}.sd-nav button.on .lu{color:#fff}
.sd-nav button i{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e4574a;color:#fff;font:800 11px/18px system-ui;font-style:normal;text-align:center}
.sd-ship{width:100%;height:auto;display:block;overflow:visible}
.sd-ship.sail .sd-bob{animation:sdBob 3.2s ease-in-out infinite;transform-origin:50% 80%}.sd-ship .sd-wave{animation:sdWave 4s ease-in-out infinite}.sd-ship .sd-wave.b{animation-duration:5.5s;animation-direction:reverse}
.sd-ship.sail .sd-flag{animation:sdFlag 1.2s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
.sd-smoke circle{opacity:0;animation:smSmoke 2.6s ease-out infinite}.sd-lamp{animation:smFire 1.3s ease-in-out infinite alternate}.sd-glint{animation:wvPulse 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.sd-card{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:16px;align-items:center}
.sd-pic{border-radius:16px;background:linear-gradient(180deg,#244a58,#0e2a34 62%,#0b2a36);box-shadow:inset 0 0 0 1px rgba(134,205,224,.14);padding:6px 6px 0;overflow:hidden}
.sd-pic.big{max-width:520px}
.sd-ttl{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sd-ttl h2{margin:0}.sd-lv{font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;background:rgba(232,182,90,.18);color:#ffd27a}
.sd-cond{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;margin:8px 0}.sd-cond small{color:#a9c4c8}
.sd-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.sd-bar i{display:block;height:100%;background:linear-gradient(90deg,#4ac08a,#8fe0a8)}.sd-bar.mid i{background:linear-gradient(90deg,#d8a030,#f2c66a)}.sd-bar.bad i{background:linear-gradient(90deg,#c83a2a,#ff7a5a)}
.sd-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:6px 0 10px}
.sd-stats div{position:relative;display:grid;grid-template-columns:24px minmax(0,1fr);column-gap:7px;align-items:center;padding:6px 8px 9px;border-radius:10px;background:rgba(0,0,0,.22);overflow:hidden}
.sd-si{grid-row:span 2;color:#7ec8e3}.sd-si .lu{width:18px;height:18px}.sd-stats small{color:#a9c4c8;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sd-stats b{font-size:15px;font-variant-numeric:tabular-nums}
.sd-stats b em{font-style:normal;font-size:12px;color:#8fe0a8;margin-left:4px;animation:tqPop .5s cubic-bezier(.3,1.8,.4,1)}
.sd-stats i{position:absolute;left:0;bottom:0;height:3px;width:var(--w);background:linear-gradient(90deg,#2f9a96,#7ee8d8)}
.sd-voy{display:grid;gap:8px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--ra) 14%,rgba(0,0,0,.3));border:1px solid color-mix(in srgb,var(--ra) 35%,transparent)}
.sd-vt{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center}.sd-vt .lu{width:18px;height:18px;color:var(--ra)}.sd-vtime{font-variant-numeric:tabular-nums;font-size:16px}
.sd-track{position:relative;height:10px;border-radius:999px;background:rgba(255,255,255,.08);margin:6px 8px 4px}.sd-track > i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,color-mix(in srgb,var(--ra) 60%,#000),var(--ra));transition:width 1s linear}
.sd-mini{position:absolute;top:50%;transform:translate(-50%,-62%);color:#fff;transition:left 1s linear;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}.sd-mini .lu{width:20px;height:20px}
.sd-voy.done{animation:sdGlow 1.6s ease-in-out infinite}.sd-open{justify-self:start}
.sd-build{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.sd-bt{display:grid;gap:6px;padding:10px;border-radius:14px;background:rgba(0,0,0,.2);border:1px solid rgba(134,205,224,.14)}.sd-bt h3{margin:0}.sd-bt.lock{opacity:.6}.sd-bt .sd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sd-bt .sd-ship{background:linear-gradient(180deg,#244a58,#0e2a34);border-radius:10px}
.sd-req{display:inline-flex;align-items:center;gap:5px;color:#ffcf9a;font-weight:700;font-size:13px}.sd-req .lu{width:15px;height:15px}
.sd-regs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:10px}
.sd-rg{display:grid;gap:2px;justify-items:start;padding:9px 10px;border-radius:12px;border:1px solid rgba(134,205,224,.16);border-bottom:3px solid var(--ra);background:rgba(255,255,255,.04);color:#e6efec;font:inherit;text-align:left;cursor:pointer}
.sd-rg b{font-size:13px}.sd-rg small{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:#a9c4c8}.sd-rg small .lu{width:13px;height:13px;color:#ffd27a}.sd-rg > .lu{width:14px;height:14px;color:#a9c4c8}
.sd-rg.on{background:color-mix(in srgb,var(--ra) 22%,#0c1d24);border-color:var(--ra)}.sd-rg.lock{opacity:.6}
.sd-region{border-color:color-mix(in srgb,var(--ra) 40%,transparent)}
.sd-sc{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:16/9;max-height:360px;width:100%}.sd-scene{width:100%;height:100%;display:block}
.sd-rt{position:absolute;left:14px;top:10px;display:grid;gap:4px}.sd-rt h2{margin:0;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.sd-diff{display:flex;gap:3px}.sd-diff i{width:16px;height:5px;border-radius:3px;background:rgba(255,255,255,.25)}.sd-diff i.on{background:var(--ra)}
.sd-locked{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:6px;padding:20px;text-align:center;background:rgba(6,14,18,.62);backdrop-filter:blur(3px)}.sd-locked .lu{width:30px;height:30px;color:#ffd27a}.sd-locked span{color:#cfe0e4;max-width:44ch}
.sd-node.on circle{filter:drop-shadow(0 0 6px var(--ra))}.sd-node.boss.on circle{animation:sdBoss 1.4s ease-in-out infinite}
.sd-boat{transition:transform 1s linear;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}
.sd-fog{animation:wvFog 12s ease-in-out infinite alternate}.sd-fog.b{animation-duration:17s;animation-direction:alternate-reverse}
.sd-snow{animation:sdSnow 6s linear infinite}.sd-ember{animation:sdEmber 2.6s ease-out infinite}.sd-lava{animation:smFire 1s ease-in-out infinite alternate}
.sd-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.sd-cols h3,.sd-region h3{display:flex;align-items:center;gap:7px;margin:0 0 6px;font-size:15px}.sd-region h3 .lu{width:17px;height:17px;color:var(--ra)}
.sd-fish{display:flex;flex-wrap:wrap;gap:6px}.sd-fish span{display:grid;justify-items:center;width:78px;padding:4px;border-radius:10px;background:rgba(0,0,0,.2)}.sd-fish canvas{width:66px;height:36px}.sd-fish small{font-size:11px;text-align:center;color:#cfe0e4;line-height:1.2}
.sd-fish.got span{width:92px}.sd-fish.got b{font-size:12px}.sd-fish span.rare{background:radial-gradient(circle,rgba(255,210,122,.25),rgba(0,0,0,.2));box-shadow:inset 0 0 0 1px rgba(255,210,122,.5)}
.sd-res{display:flex;flex-wrap:wrap;gap:6px}.sd-res span{display:inline-flex;align-items:center;gap:5px;padding:4px 10px 4px 6px;border-radius:999px;background:rgba(0,0,0,.25);font-size:12.5px}.sd-res span.r{box-shadow:inset 0 0 0 1px rgba(197,140,255,.5)}.sd-res span.b{box-shadow:inset 0 0 0 1px rgba(143,240,200,.4)}.sd-res .lu{width:15px;height:15px}
.sd-sites{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.sd-sites div{padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.2);border:1px dashed rgba(255,255,255,.15)}.sd-sites div.on{border:1px solid color-mix(in srgb,var(--ra) 60%,transparent);background:color-mix(in srgb,var(--ra) 12%,rgba(0,0,0,.2))}.sd-sites small{display:block;color:#a9c4c8;font-size:12px}
.sd-boss{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;margin-top:12px;padding:12px;border-radius:14px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.1)}
.sd-boss.ready{border-color:#e4574a;background:radial-gradient(120% 100% at 0% 50%,rgba(228,87,74,.22),rgba(0,0,0,.25))}.sd-boss.dead{border-color:rgba(255,210,122,.5)}
.sd-bi{display:grid;place-items:center;width:52px;height:52px;border-radius:14px;background:rgba(228,87,74,.18);color:#ff9a8a}.sd-bi .lu{width:28px;height:28px}.sd-boss.dead .sd-bi{background:rgba(255,210,122,.18);color:#ffd27a}.sd-boss.ready .sd-bi{animation:sdBoss 1.4s ease-in-out infinite}
.sd-boss small{display:block;color:#a9c4c8;font-size:12.5px}
.sd-hp{position:relative;height:16px;margin:6px 0;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.sd-hp i{display:block;height:100%;background:linear-gradient(90deg,#8a1a14,#e4574a);transition:width .8s}.sd-hp span{position:absolute;inset:0;display:grid;place-items:center;font:800 11px system-ui;color:#fff}
.sd-hp.big{height:22px}
.sd-send{margin-top:14px;padding-top:12px;border-top:1px solid rgba(134,205,224,.14);display:grid;gap:10px}.sd-send h3{margin:0}
.sd-pick{display:flex;gap:8px;overflow-x:auto}.sd-pick button{flex:none;width:140px;display:grid;justify-items:center;gap:2px;padding:6px;border-radius:12px;border:1px solid rgba(134,205,224,.16);background:rgba(255,255,255,.04);color:#e6efec;font:inherit;cursor:pointer}
.sd-pick button.on{border-color:rgba(130,245,230,.8);background:rgba(70,208,198,.14)}.sd-pick small{color:#a9c4c8;font-size:11.5px}.sd-pick.top{margin-bottom:10px}
.sd-kinds{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.sd-k{display:grid;gap:3px;text-align:left;padding:11px 12px;border-radius:12px;border:1px solid rgba(134,205,224,.2);background:rgba(255,255,255,.05);color:#e6efec;font:inherit;cursor:pointer}
.sd-k > .lu{width:22px;height:22px;color:#7ec8e3}.sd-k.boss{border-color:rgba(228,87,74,.6);background:rgba(228,87,74,.12)}.sd-k.boss > .lu{color:#ff9a8a}.sd-k small{color:#a9c4c8;font-size:12px}
.sd-k:hover:not(:disabled),.sd-k:focus-visible{border-color:rgba(130,245,230,.7);background:rgba(70,208,198,.14)}.sd-k:disabled{opacity:.5;cursor:not-allowed}
.sd-kf{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:4px;font-size:12px;font-weight:700;color:#e6efec}.sd-kf .lu,.sd-kf .ic{width:14px;height:14px}
.sd-warn{display:flex;align-items:center;gap:6px;margin:0;color:#ffcf9a}.sd-warn .lu{width:16px;height:16px}.sd-note{margin-top:12px}
.sd-yard{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:center}
.sd-parts{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.sd-part{display:grid;gap:8px;margin:0}.sd-ph{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center}.sd-ph small{display:block;color:#a9c4c8;font-size:12px}
.sd-pi{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:rgba(126,200,227,.14);color:#7ec8e3}.sd-pi .lu{width:22px;height:22px}
.sd-pips{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.sd-pips i{width:18px;height:7px;border-radius:3px;background:rgba(255,255,255,.12)}.sd-pips i.on{background:linear-gradient(90deg,#d8a030,#ffd27a)}.sd-pips span{margin-left:6px;font-size:12px;color:#a9c4c8}
.sd-cost{display:flex;flex-wrap:wrap;gap:5px}.sd-c{display:inline-flex;align-items:center;gap:4px;padding:3px 9px 3px 6px;border-radius:999px;background:rgba(0,0,0,.25);font-size:12px;font-weight:700}.sd-c .lu,.sd-c .ic{width:14px;height:14px}.sd-c.g{color:#ffd27a}.sd-c.no{color:#ffb4a0;box-shadow:inset 0 0 0 1px rgba(255,120,100,.45)}.sd-c canvas,.sd-res canvas,.sd-sum canvas{width:18px;height:18px}
.sd-max{display:inline-flex;align-items:center;gap:5px;color:#ffd27a;font-weight:800}.sd-max .lu{width:16px;height:16px}
.sd-crew{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.sd-cm{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:12px;border-radius:14px;background:rgba(0,0,0,.2)}.sd-cm h3{margin:0}
.sd-av{position:relative;display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#3a8a96,#14363e);color:#fff;box-shadow:0 0 0 2px rgba(232,182,90,.5)}.sd-av .lu{width:26px;height:26px}
.sd-av b{position:absolute;right:-4px;bottom:-4px;min-width:22px;height:22px;border-radius:999px;background:#e8b65a;color:#2a1a06;font-size:12px;display:grid;place-items:center}
.sd-cm .sd-pips i{width:12px}
.sd-logc .sd-lh{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;margin-bottom:6px}.sd-lh .lu{width:18px;height:18px;color:var(--ra)}.sd-lh small{color:#a9c4c8}
.sd-ll{list-style:none;margin:0;padding:0;display:grid;gap:5px}.sd-ll li{display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start;padding:6px 9px;border-radius:9px;background:rgba(0,0,0,.18);font-size:13.5px;line-height:1.4}
.sd-ll li .lu{width:17px;height:17px;margin-top:1px;color:#7ec8e3}.sd-ll li.good .lu{color:#8fe0a8}.sd-ll li.bad .lu{color:#ff9a8a}.sd-ll li.bad{background:rgba(200,60,40,.12)}
.sd-ll li.epic{background:linear-gradient(90deg,rgba(242,181,82,.22),rgba(0,0,0,.18));box-shadow:inset 0 0 0 1px rgba(255,210,122,.35)}.sd-ll li.epic .lu{color:#ffd27a}.sd-ll li.boss .lu,.sd-ll li.choice .lu{color:#ff9a8a}
.sd-ll.anim li{animation:sdLine .5s cubic-bezier(.2,1.2,.4,1) backwards}
.sd-sum{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.sd-sum span{display:inline-flex;align-items:center;gap:5px;padding:4px 10px 4px 7px;border-radius:999px;background:rgba(0,0,0,.25);font-size:12.5px;font-weight:700}.sd-sum .lu{width:15px;height:15px;color:#7ec8e3}.sd-sum .g{color:#ffd27a}.sd-sum .r{box-shadow:inset 0 0 0 1px rgba(197,140,255,.5)}
.sd-rs{display:grid;gap:10px}.sdmodal{max-width:640px}
.sd-rh{position:relative;border-radius:14px;overflow:hidden;height:120px}.sd-rh .sd-scene{position:absolute;inset:0}.sd-rh > div{position:absolute;left:14px;bottom:10px}.sd-rh small{display:inline-flex;align-items:center;gap:5px;color:#fff;text-shadow:0 1px 4px #000}.sd-rh small .lu{width:15px;height:15px}.sd-rh h2{margin:0;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7)}
.sd-rs.epic .sd-rh{box-shadow:0 0 0 2px #ffd27a,0 0 30px rgba(255,210,122,.4)}
.sd-choice{padding:12px;border-radius:14px;background:rgba(228,87,74,.12);border:1px solid rgba(228,87,74,.5);animation:sdLine .5s 1s backwards}.sd-choice h3{margin:0}.sd-choice p{margin:4px 0 10px;color:#dfeaec}
.sd-choice > div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sd-choice .btn{display:grid;gap:2px;text-align:left;height:auto;padding:10px 12px}.sd-choice .btn small{font-weight:500;opacity:.85;font-size:12px}
.sd-bossdead{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px;border-radius:14px;background:linear-gradient(90deg,rgba(242,181,82,.3),rgba(197,140,255,.25));font-size:18px;animation:tqPop .7s cubic-bezier(.3,1.8,.4,1)}.sd-bossdead .lu{width:28px;height:28px;color:#ffd27a}
.sd-lock{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:center}.sd-lock h2{display:flex;align-items:center;gap:8px}
@keyframes sdBob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(3px) rotate(1deg)}}
@keyframes sdWave{0%,100%{transform:translateX(0)}50%{transform:translateX(-14px)}}
@keyframes sdFlag{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.7)}}
@keyframes sdGlow{0%,100%{box-shadow:0 0 0 0 rgba(130,245,230,0)}50%{box-shadow:0 0 18px 2px rgba(130,245,230,.35)}}
@keyframes sdBoss{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes sdSnow{from{transform:translateY(-20px)}to{transform:translateY(200px)}}
@keyframes sdEmber{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),-50px)}}
@keyframes sdLine{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
@media (max-width:700px){.sd-card,.sd-yard,.sd-lock{grid-template-columns:1fr}.sd-regs{grid-template-columns:repeat(5,minmax(120px,1fr));overflow-x:auto}.sd-cols,.sd-sites{grid-template-columns:1fr}.sd-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sd-choice > div{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.sd-bob,.sd-wave,.sd-flag,.sd-smoke circle,.sd-lamp,.sd-glint,.sd-fog,.sd-snow,.sd-ember,.sd-lava,.sd-ll.anim li,.sd-voy.done,.sd-node.boss.on circle,.sd-bi{animation:none!important}}
</style>`);
