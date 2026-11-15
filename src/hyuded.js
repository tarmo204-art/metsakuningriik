/* =====================================================================
   Suured hüüdsõnad püügivaate keskel: järjekord (korraga ainult üks), igal sündmusel oma värv,
   animatsioon, efekt ja heli. Kõik tulevad päris mängusündmusest ja päris väärtustest
   (fish_land / fish_hook vastus, Kalatunni kahju, saavutused). Efektide tugevust saab vähendada.
   ===================================================================== */
const SH = { q: [], cur: null, parts: [], lvl: 'full', bossDay: '' };
try { SH.lvl = localStorage.getItem('mk.fxLvl') || 'full' } catch (e) { }
const shLow = () => SH.lvl === 'low' || stReduce();
// tekstid, mida joonistab nüüd see süsteem (vana väike tekst jääb ära, et kaks ei tuleks korraga)
const SH_OWN = new Set(['TÄPNE!', 'HEA!', 'MÖÖDA!', 'PÄÄSES!', 'Püütud!', 'Ebatavaline!', 'HARULDANE!', 'EEPILINE!', 'LEGENDAARNE!', 'MÜÜTILINE!', 'REKORDSUURUS!', 'UUS LIIK KALARAAMATUS!', 'ISIKLIK REKORD!']);
const SH_GEAR = {
  '❤ Lemmiksööt!': ['SEE OLI KALA LEMMIKSÖÖT! ❤️', 'lemmik', 'Kasutasid kala lemmiksööta! Suurem võimalus soovitud kala tabamiseks.'],
  '🔔 TEINE ÕNG!': ['🔔 TEINE ÕNG!', 'teine', 'Sinu varuõng läks kasutusse! Kalapüük jätkub.'],
  '🥅 KAHV PÄÄSTIS!': ['🥅 KAHV PÄÄSTIS!', 'kahv', 'Kahv aitas kala turvaliselt kaldale tõmmata!'],
  '🪣 Sööt jäi alles': ['🪣 SÖÖT JÄI ALLES!', 'soot', 'Tänu sinu varustusele ei kulunud sööt selle püügikatsega ära.'],
  '🕶 Vees liigub kala…': ['🕶️ VEES LIIKUB KALA…', 'peek', 'Midagi liigub vee all. Ole tähelepanelik!'],
  '🕶 Suur vari läheneb!': ['🕶️ SUUR VARI LÄHENEB!', 'vari', 'Vee sügavusest läheneb midagi suurt. Valmistu tõeliseks võitluseks!']
};
{ const _ft = fxText; fxText = function (x, y, txt, col, size) { if (SH_OWN.has(txt)) return; const g = SH_GEAR[txt]; if (g) { shout(g[0], g[1], g[2]); return } return _ft(x, y, txt, col, size) } }

const SH_STYLE = {
  tapne: { col: '#5fe08a', hi: '#e8fff0', fx: 'flash', dur: 1.0, size: 1, sfx: 'tapne' },
  hea: { col: '#5ab8ff', hi: '#e6f4ff', fx: 'flash', dur: .9, size: .85, sfx: 'hea' },
  mooda: { col: '#ff8a4a', hi: '#ffe2cc', fx: 'shake', dur: .9, size: .85, sfx: 'mooda' },
  paases: { col: '#ff5a4a', hi: '#ffd8d2', fx: 'escape', dur: 1.4, size: 1, sfx: 'paases' },
  r1: { col: '#ffc84a', hi: '#fff6d0', fx: 'flash', dur: 1.3, size: 1, sfx: 'r1' },
  r2: { col: '#3fd8c8', hi: '#dafff8', fx: 'flash', dur: 1.4, size: 1, sfx: 'r2' },
  r3: { col: '#4a9cff', hi: '#e2f0ff', fx: 'sparkle', dur: 1.7, size: 1.08, sfx: 'r3' },
  r4: { col: '#b46aff', hi: '#f4e6ff', fx: 'burst', dur: 2.0, size: 1.15, sfx: 'r4' },
  r5: { col: '#ffbf2e', hi: '#fff8dc', fx: 'gold', dur: 2.4, size: 1.22, sfx: 'r5' },
  r6: { col: '#ff6ad8', hi: '#ffffff', fx: 'magic', dur: 3.0, size: 1.28, sfx: 'r6' },
  giant: { col: '#ffb02e', hi: '#fff2c8', fx: 'gold', dur: 1.8, size: 1.15, sfx: 'giant', shake: true },
  uusliik: { col: '#7ef0a0', hi: '#effff4', fx: 'book', dur: 2.0, size: .82, sfx: 'uusliik' },
  rekord: { col: '#ffc24a', hi: '#fff4d0', fx: 'sparkle', dur: 1.6, size: .9, sfx: 'rekord' },
  suurim: { col: '#ffd24a', hi: '#ffffff', fx: 'trophy', dur: 2.0, size: .9, sfx: 'rekord' },
  xp: { col: '#6ad0ff', hi: '#ffffff', fx: 'flash', dur: 1.5, size: 1, sfx: 'xp' },
  kuld: { col: '#ffcc3a', hi: '#fff6d0', fx: 'coins', dur: 1.5, size: 1, sfx: 'kuld' },
  punkt: { col: '#ff9a4a', hi: '#fff0e0', fx: 'flash', dur: 1.3, size: .9, sfx: 'hea' },
  ese: { col: '#c88aff', hi: '#f6eaff', fx: 'sparkle', dur: 1.6, size: .82, sfx: 'r3' },
  saavutus: { col: '#ffd86a', hi: '#fffaf0', fx: 'trophy', dur: 1.8, size: .82, sfx: 'saavutus' },
  tiitel: { col: '#ffe08a', hi: '#ffffff', fx: 'sparkle', dur: 1.8, size: .9, sfx: 'saavutus' },
  bosshook: { col: '#ff5a3a', hi: '#ffe0d8', fx: 'boss', dur: 1.6, size: .95, sfx: 'boss', shake: true },
  tabamus: { col: '#ff7a3a', hi: '#fff0e0', fx: 'boss', dur: 1.3, size: .95, sfx: 'tabamus', shake: true },
  kahju: { col: '#ff6a4a', hi: '#ffe8e0', fx: 'boss', dur: 1.4, size: .8, sfx: 'hea' },
  alistatud: { col: '#ffcf4a', hi: '#ffffff', fx: 'gold', dur: 2.6, size: 1.05, sfx: 'r5', shake: true },
  kogukond: { col: '#7fe0a0', hi: '#ffffff', fx: 'magic', dur: 2.4, size: .95, sfx: 'saavutus' },
  eriauhind: { col: '#ffcf4a', hi: '#ffffff', fx: 'coins', dur: 2.0, size: .85, sfx: 'kuld' },
  lemmik: { col: '#ff7eb6', hi: '#fff0f6', fx: 'sparkle', dur: 2.0, size: .62, sfx: 'hea' },
  teine: { col: '#ffd24a', hi: '#fffbe6', fx: 'coins', dur: 2.0, size: .7, sfx: 'kuld' },
  kahv: { col: '#6fe8c0', hi: '#effffa', fx: 'flash', dur: 2.0, size: .7, sfx: 'hea' },
  soot: { col: '#8ad4ff', hi: '#f0faff', fx: 'flash', dur: 2.0, size: .62, sfx: 'xp' },
  peek: { col: '#9fe6ff', hi: '#ffffff', fx: 'flash', dur: 2.0, size: .62, sfx: '' },
  vari: { col: '#4a8cff', hi: '#e8f2ff', fx: 'boss', dur: 2.2, size: .66, sfx: 'boss' },
  eriline: { col: '#3fe0d0', hi: '#effffd', fx: 'sparkle', dur: 2.0, size: .7, sfx: 'r3' },
  boonus: { col: '#ffe84a', hi: '#fffde6', fx: 'burst', dur: 2.0, size: .7, sfx: 'tapne' },
  hiiglane: { col: '#ff4a3a', hi: '#ffe4e0', fx: 'boss', dur: 2.4, size: .7, sfx: 'boss', shake: true }
};
function shout(txt, kind, sub) {
  const st = SH_STYLE[kind] || SH_STYLE.hea;
  if (SH.q.length > 14) SH.q.pop();
  SH.q.push({ txt, sub, st, kind, added: performance.now() });
}

/* ---------- helid ---------- */
function shSfx(k) {
  if (typeof sndOk !== 'function' || !sndOk()) return;
  const N = typeof NOTE === 'function' ? NOTE : n => 440 * Math.pow(2, (n - 69) / 12);
  const arp = (ns, gap, o = {}) => ns.forEach((n, i) => tone(N(n), o.d || .35, { vol: o.v || .1, at: i * gap, type: o.t || 'triangle' }));
  switch (k) {
    case 'tapne': arp([84, 88, 91, 96], .05, { v: .1 }); break;
    case 'hea': arp([79, 84], .06, { v: .09 }); break;
    case 'mooda': tone(220, .22, { to: 140, vol: .12, type: 'triangle' }); break;
    case 'paases': noise(.4, { f: 1200, to: 300, q: .7, vol: .2, type: 'lowpass' }); arp([67, 63, 58], .1, { v: .08 }); break;
    case 'r1': arp([72, 79], .07); break;
    case 'r2': arp([72, 76, 81], .07); break;
    case 'r3': arp([74, 78, 81, 86], .07, { v: .11 }); for (let i = 0; i < 6; i++) tone(N(96 + i), .08, { vol: .03, at: .3 + i * .04 }); break;
    case 'r4': noise(.5, { f: 400, to: 3000, q: .8, vol: .12 }); arp([69, 73, 76, 81, 85], .07, { v: .11 }); break;
    case 'r5': arp([60, 64, 67, 72, 76, 79, 84], .07, { v: .11 }); [72, 76, 79].forEach(n => tone(N(n + 12), 1.4, { vol: .05, at: .5 })); break;
    case 'r6': for (let i = 0; i < 12; i++) tone(N(72 + [0, 4, 7, 11, 14, 16, 19, 23, 24, 28, 31, 35][i]), .6, { vol: .06, at: i * .06, type: 'sine', vib: 6 }); noise(1.2, { f: 2000, to: 6000, q: .6, vol: .05, type: 'highpass' }); break;
    case 'giant': tone(110, .5, { to: 60, vol: .25, type: 'sawtooth', lp: 600 }); arp([67, 72, 76, 79], .08, { v: .1 }); break;
    case 'uusliik': noise(.25, { f: 3000, q: 1, vol: .06 }); arp([76, 81, 84, 88], .09, { v: .09, t: 'sine' }); break;
    case 'rekord': arp([72, 76, 79, 84, 88], .06, { v: .1 }); break;
    case 'xp': arp([84, 91], .05, { v: .07, t: 'sine' }); break;
    case 'kuld': for (let i = 0; i < 4; i++) { tone(N(88), .1, { vol: .08, at: i * .09, type: 'triangle' }); tone(N(95), .2, { vol: .07, at: i * .09 + .05, type: 'triangle' }) } break;
    case 'saavutus': arp([67, 72, 76, 79, 84], .08, { v: .11 }); tone(N(91), 1, { vol: .05, at: .45 }); break;
    case 'boss': tone(70, .6, { to: 45, vol: .3, type: 'sawtooth', lp: 400 }); noise(.5, { f: 200, q: .6, vol: .25, type: 'lowpass' }); break;
    case 'tabamus': noise(.25, { f: 600, q: .8, vol: .3, type: 'lowpass' }); tone(140, .25, { to: 70, vol: .2, type: 'square', lp: 700 }); break;
  }
}

/* ---------- joonistamine ---------- */
function shDraw(c, w, h, dt) {
  const now = performance.now();
  // aegunud järjekorra liikmed (nt kui püügivaadet ei näidatud) ära
  SH.q = SH.q.filter(x => now - x.added < 30000);
  if (!SH.cur && SH.q.length) {
    SH.cur = SH.q.shift(); SH.cur.t0 = now; SH.cur.fast = SH.q.length >= 2 ? .72 : 1; const st = SH.cur.st, low = shLow();
    shSfx(st.sfx);
    if ((st.shake || st.fx === 'shake') && !low) FX.shake = Math.max(FX.shake, st.fx === 'shake' ? .25 : .35);
    shSpawn(SH.cur, w, h, low);
  }
  // osakesed
  SH.parts = SH.parts.filter(p => (p.life -= dt) > 0);
  for (const p of SH.parts) {
    p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; const a = Math.min(1, p.life / (p.l0 * .5));
    c.save(); c.globalAlpha = a; if (p.glow) c.globalCompositeOperation = 'lighter';
    if (p.coin) { c.translate(p.x, p.y); c.scale(Math.cos(p.life * 9), 1); c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(0, 0, p.r, 0, 6.283); c.fill(); c.fillStyle = '#b8861a'; c.fillRect(-p.r * .25, -p.r * .55, p.r * .5, p.r * 1.1) }
    else { c.fillStyle = p.hue != null ? `hsl(${(p.hue + now / 6) % 360} 95% 70%)` : p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill() }
    c.restore();
  }
  const S = SH.cur; if (!S) return;
  const st = S.st, low = shLow(), dur = st.dur * (low ? .8 : 1) * (S.fast || 1), a = (now - S.t0) / 1000;
  if (a > dur) { SH.cur = null; return }
  const cx = w / 2, cy = h * .42, k = a / dur;
  // taustaefekt
  shBg(c, w, h, cx, cy, a, st, low);
  // tekst: kiire ilmumine, hetkeks suurem, sujuv kadumine
  const pop = a < .14 ? .35 + a / .14 * .95 : a < .26 ? 1.3 - (a - .14) / .12 * .3 : 1;
  const fade = k > .78 ? 1 - (k - .78) / .22 : 1, rise = k > .78 ? (k - .78) / .22 * h * .06 : 0;
  const fs = Math.min(w * .095, h * .19) * st.size;
  c.save(); c.globalAlpha = Math.max(0, fade); c.translate(cx, cy - rise); c.scale(pop, pop);
  c.font = `900 ${fs}px "Alegreya Sans", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  // liiga lai tekst tehakse väiksemaks
  const tw = c.measureText(S.txt).width, maxW = w * .9; if (tw > maxW) { const s2 = maxW / tw; c.scale(s2, s2) }
  const g = c.createLinearGradient(0, -fs * .5, 0, fs * .5); g.addColorStop(0, st.hi); g.addColorStop(.5, st.col); g.addColorStop(1, shDark(st.col));
  if (st.fx === 'magic') { const hg = c.createLinearGradient(-fs * 3, 0, fs * 3, 0); for (let i = 0; i <= 6; i++) hg.addColorStop(i / 6, `hsl(${(i * 60 + now / 5) % 360} 95% 72%)`); c.fillStyle = hg } else c.fillStyle = g;
  c.lineJoin = 'round'; c.lineWidth = fs * .13; c.strokeStyle = 'rgba(8,16,24,.9)'; c.strokeText(S.txt, 0, 0);
  c.shadowColor = st.col; c.shadowBlur = low ? fs * .15 : fs * .4; c.fillText(S.txt, 0, 0); c.shadowBlur = 0;
  c.restore();
  if (S.sub) { const sfs = Math.max(12, Math.min(w * .032, h * .07)); c.save(); c.globalAlpha = Math.max(0, fade) * Math.min(1, a / .2); c.font = `800 ${sfs}px "Alegreya Sans", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const sw = c.measureText(S.sub).width, sy = cy - rise + fs * .78; c.translate(cx, sy); if (sw > w * .92) c.scale(w * .92 / sw, w * .92 / sw);
    c.lineJoin = 'round'; c.lineWidth = sfs * .28; c.strokeStyle = 'rgba(8,16,24,.85)'; c.strokeText(S.sub, 0, 0); c.fillStyle = st.hi; c.fillText(S.sub, 0, 0); c.restore() }
}
function shDark(hex) { const n = parseInt(hex.slice(1), 16), r = (n >> 16) * .55, g = (n >> 8 & 255) * .55, b = (n & 255) * .55; return `rgb(${r | 0},${g | 0},${b | 0})` }
function shRgb(hex) { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${n >> 8 & 255},${n & 255}` }
function shSpawn(S, w, h, low) {
  const st = S.st, cx = w / 2, cy = h * .42, m = low ? .35 : 1, P = o => SH.parts.push(Object.assign({ l0: o.life }, o));
  if (st.fx === 'sparkle' || st.fx === 'trophy') for (let i = 0; i < 26 * m; i++) { const an = Math.random() * 6.283, v = 60 + Math.random() * 160; P({ x: cx, y: cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .6, life: .8 + Math.random() * .7, r: 1.4 + Math.random() * 2, col: st.hi, glow: true }) }
  if (st.fx === 'burst') for (let i = 0; i < 40 * m; i++) { const an = Math.random() * 6.283, v = 140 + Math.random() * 260; P({ x: cx, y: cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: .7 + Math.random() * .6, r: 1.8 + Math.random() * 2.6, col: st.col, glow: true }) }
  if (st.fx === 'gold') for (let i = 0; i < 46 * m; i++) P({ x: Math.random() * w, y: -10 - Math.random() * h * .3, vx: (Math.random() - .5) * 30, vy: 60 + Math.random() * 90, life: 1.8 + Math.random(), r: 1.6 + Math.random() * 2.2, col: Math.random() < .7 ? '#ffd86a' : '#fff6d0', glow: true });
  if (st.fx === 'magic') for (let i = 0; i < 70 * m; i++) { const an = Math.random() * 6.283, v = 40 + Math.random() * 220; P({ x: cx, y: cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .7, life: 1.2 + Math.random() * 1.2, r: 1.5 + Math.random() * 2.5, hue: Math.random() * 360, glow: true }) }
  if (st.fx === 'coins') for (let i = 0; i < 18 * m; i++) P({ x: cx + (Math.random() - .5) * 80, y: cy, vx: (Math.random() - .5) * 260, vy: -220 - Math.random() * 160, g: 520, life: 1.2 + Math.random() * .5, r: 5 + Math.random() * 2, coin: true });
  if (st.fx === 'escape') for (let i = 0; i < 18 * m; i++) P({ x: FX.bx, y: FX.by, vx: (Math.random() - .5) * 160, vy: -120 - Math.random() * 120, g: 480, life: .7 + Math.random() * .4, r: 1.5 + Math.random() * 2, col: 'rgba(230,246,255,.95)' });
  if (st.fx === 'boss') for (let i = 0; i < 22 * m; i++) { const an = Math.random() * 6.283, v = 100 + Math.random() * 200; P({ x: cx, y: cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v * .6, life: .6 + Math.random() * .5, r: 2 + Math.random() * 2, col: '#ff6a3a', glow: true }) }
}
function shBg(c, w, h, cx, cy, a, st, low) {
  const rgb = shRgb(st.col), lim = low ? .45 : 1;
  c.save();
  if (st.fx === 'flash' || st.fx === 'shake' || st.fx === 'boss' || st.fx === 'sparkle' || st.fx === 'trophy') {
    const k = Math.max(0, 1 - a / .7); if (k > 0) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(cx, cy, 0, cx, cy, w * .55); g.addColorStop(0, `rgba(${rgb},${.45 * k * lim})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, w, h) }
    if (st.fx === 'boss') { const p = .25 * Math.max(0, Math.sin(a * 9)) * lim; const vg = c.createRadialGradient(cx, cy, h * .2, cx, cy, w * .7); vg.addColorStop(0, 'rgba(255,40,20,0)'); vg.addColorStop(1, `rgba(255,40,20,${p})`); c.fillStyle = vg; c.globalCompositeOperation = 'source-over'; c.fillRect(0, 0, w, h) }
  }
  if (st.fx === 'burst' || st.fx === 'gold') {
    c.globalCompositeOperation = 'lighter'; const k = Math.max(0, 1 - a / st.dur);
    c.save(); c.translate(cx, cy); c.rotate(a * .5);
    for (let i = 0; i < 14; i++) { c.rotate(Math.PI * 2 / 14); const g = c.createLinearGradient(0, 0, w * .7, 0); g.addColorStop(0, `rgba(${rgb},${(st.fx === 'gold' ? .45 : .35) * k * lim})`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * .7, -16); c.lineTo(w * .7, 16); c.fill() }
    c.restore();
    if (st.fx === 'burst') { const rr = a * w * .9; c.strokeStyle = `rgba(${rgb},${Math.max(0, .7 - a) * lim})`; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, rr, 0, 6.283); c.stroke() }
    if (st.fx === 'gold') { const k2 = Math.max(0, 1 - a / 1.2); c.fillStyle = `rgba(255,220,120,${.28 * k2 * lim})`; c.fillRect(0, 0, w, h) }
  }
  if (st.fx === 'magic') {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const ph = (a * .8 + i * .25) % 1, rr = ph * w * .7; c.strokeStyle = `hsla(${(i * 90 + a * 160) % 360},95%,70%,${(1 - ph) * .55 * lim})`; c.lineWidth = 5 * (1 - ph) + 1; c.beginPath(); c.ellipse(cx, cy, rr, rr * .45, 0, 0, 6.283); c.stroke() }
    const k = Math.max(0, 1 - a / 1.4); const g = c.createRadialGradient(cx, cy, 0, cx, cy, w * .6); g.addColorStop(0, `rgba(255,180,255,${.35 * k * lim})`); g.addColorStop(1, 'rgba(160,120,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  if (st.fx === 'book' && a < 1.6) {
    // raamat avaneb teksti kohal
    const s = Math.min(w, h) * .12, open = Math.min(1, a / .45), by = cy - Math.min(w * .095, h * .19) * .95 - s * .4;
    c.translate(cx, by); c.globalCompositeOperation = 'lighter';
    const lg = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.6); lg.addColorStop(0, `rgba(160,255,190,${.45 * open * lim})`); lg.addColorStop(1, 'rgba(160,255,190,0)'); c.fillStyle = lg; c.fillRect(-s * 1.6, -s * 1.6, s * 3.2, s * 3.2);
    c.globalCompositeOperation = 'source-over';
    for (const sd of [-1, 1]) { c.save(); c.scale(sd * open, 1); c.fillStyle = '#f4ecd6'; c.beginPath(); c.moveTo(0, -s * .45); c.quadraticCurveTo(s * .45, -s * .6, s * .9, -s * .45); c.lineTo(s * .9, s * .4); c.quadraticCurveTo(s * .45, s * .25, 0, s * .4); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,90,50,.5)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(s * .15, -s * .3 + i * s * .16); c.lineTo(s * .75, -s * .3 + i * s * .16); c.stroke() } c.restore() }
    c.fillStyle = '#3a6a4a'; c.fillRect(-1.5, -s * .45, 3, s * .85);
  }
  if (st.fx === 'trophy' && a < 1.8) {
    const s = Math.min(w, h) * .1, by = cy - Math.min(w * .095, h * .19) * st.size * .9 - s * .5, pop = Math.min(1, a / .3);
    c.translate(cx, by); c.scale(pop, pop); c.fillStyle = '#ffd24a'; c.strokeStyle = '#8a5a10'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-s * .45, -s * .5); c.lineTo(s * .45, -s * .5); c.quadraticCurveTo(s * .45, s * .15, 0, s * .2); c.quadraticCurveTo(-s * .45, s * .15, -s * .45, -s * .5); c.fill(); c.stroke();
    c.fillRect(-s * .08, s * .2, s * .16, s * .2); c.fillRect(-s * .3, s * .38, s * .6, s * .12);
  }
  c.restore();
}

/* ---------- ühendused mängusündmustega ---------- */
{
  const _fx = drawFx; drawFx = function (c, w, h, dt, t) { _fx(c, w, h, dt, t); try { shDraw(c, w, h, dt) } catch (e) { } };
  const _hit = fxHit; fxHit = function (perfect) { _hit(perfect); shout(perfect ? 'TÄPNE!' : 'HEA!', perfect ? 'tapne' : 'hea') };
  const _miss = fxMiss; fxMiss = function () { _miss(); shout('MÖÖDA!', 'mooda') };
  const _lose = doLose; doLose = async function (msg) { if (!FV.loss || FV.loss.k !== 'release') shout('PÄÄSES!', 'paases'); return _lose.apply(this, arguments) };
  // kala pääses viimasel hetkel või murdis õnge (need ei käi läbi doLose)
  const _sp = setPhase; setPhase = function (p, msg) { const was = FV.phase; _sp(p, msg); if (p === 'lost' && FV.loss && (FV.loss.k === 'last' || FV.loss.k === 'gone') && was !== 'lost') shout('PÄÄSES!', 'paases');
    if (p === 'reel' && FV.hook && +FV.hook.est >= +FV.hook.strength * 1.5) shout('🐉 MIDAGI HIIGLASLIKKU!', 'hiiglane', 'Vee all liigub midagi, mida tavalise õngega püüda ei tasu!');
    if (p === 'reel' && typeof KT !== 'undefined' && KT.d && KT.d.active) { const day = new Date().toDateString(); if (SH.bossDay !== day) { SH.bossDay = day; shout('BOSS ON KONKSUS!', 'bosshook', 'Kalatund käib – iga kala teeb koletisele kahju') } } };
  const _land = fxLand;
  fxLand = function (r) {
    const prevBig = FS ? +FS.biggest || 0 : 0;
    _land(r);
    if (FX.leap) FX.leap.xp = 0; // kogemus tuleb nüüd järjekorras eraldi hüüdsõnana
    const list = [];
    if (r.kind === 'fish') {
      const rn = { 1: ['PÜÜTUD!', 'r1'], 2: ['EBATAVALINE!', 'r2'], 3: ['HARULDANE!', 'r3'], 4: ['EEPILINE!', 'r4'], 5: ['LEGENDAARNE!', 'r5'], 6: ['MÜÜTILINE!', 'r6'] }[r.rarity] || ['PÜÜTUD!', 'r1'];
      list.push([rn[0], rn[1], `${r.name} · ${fKg(+r.weight)}`]);
      if (r.giant) list.push(['REKORDSUURUS!', 'giant']);
      if (prevBig > 0 && +r.weight > prevBig) list.push(['SUURIM SAAGI KALA!', 'suurim', `Sinu kõigi aegade suurim: ${fKg(+r.weight)}`]);
      if (r.new_species) list.push(['UUS LIIK KALARAAMATUS!', 'uusliik', r.name]);
      else if (r.record) list.push(['ISIKLIK REKORD!', 'rekord', `${r.name}: ${fKg(+r.weight)}`]);
      if (+r.xp > 0) list.push([`+${fmt(+r.xp)} XP KOGEMUST!`, 'xp', r.x2 ? 'Õhtukuma ×2' : '']);
      if (r.kt && typeof r.kt === 'object') {
        if (+r.kt.pts > 0) list.push([`+${fmt(+r.kt.pts)} KALA-PUNKTI!`, 'punkt', 'Kalatund']);
        if (+r.kt.dmg >= 150) list.push(['SUUR TABAMUS!', 'tabamus', `−${fmt(+r.kt.dmg)} elu`]);
        else if (+r.kt.dmg > 0) list.push(['BOSSILE TEHTUD KAHJU!', 'kahju', `−${fmt(+r.kt.dmg)} elu`]);
        if (r.kt.killed) { list.push(['KOLETIS ON ALISTATUD!', 'alistatud', 'Järvekoletis on alistatud!']); list.push(['KOGUKONDLIK VÕIT!', 'kogukond', 'Auhinnad saab Kalatunni vahekaardilt']) }
      }
    } else if (r.kind === 'chest' && +r.gold > 0) list.push([`+${fmt(+r.gold)} KULDA!`, 'kuld', 'Veealune aardekirst']);
    else if (r.kind === 'junk' && +r.gold > 0) list.push([`+${fmt(+r.gold)} KULDA!`, 'kuld']);
    if (r.kind === 'fish' && r.rarity >= 2 && !r.fav) { const b = FD.bait && FD.bait[FS.bait]; if (b && +b.rarity_bonus > 0) list.push(['🧲 ERILINE SÖÖT!', 'eriline', 'Sinu sööt meelitas ligi ebatavalise kala.']) }
    if (r.kind === 'fish' && r.rarity >= 3 && FS.gear && (+FS.gear.upg > 0 || FS.gear.ench)) list.push(['⚡ VARUSTUSE BOONUS!', 'boonus', 'Sinu täiustatud varustus andis püügile lisaboonuse.']);
    for (const it of r.items || []) { const d = FD.item && FD.item[it.id]; if (d && d.rarity >= 3) list.push(['HARULDASE ESEME LEID!', 'ese', d.name]) }
    for (const a of r.ach || []) { list.push(['UUS SAAVUTUS AVATUD!', 'saavutus', a.name]); if (a.title) list.push(['TIITEL SAADUD!', 'tiitel', `„${a.title}“`]) }
    // kala hüppab veest välja ~2,3 s – hüüdsõnad tulevad maandumise hetkel järjest
    const delay = r.kind === 'fish' ? (shLow() ? 1800 : 2250) : 300;
    setTimeout(() => list.forEach(([t, k, s]) => shout(t, k, s)), delay);
  };
  // Kalatunni auhindade võtmine: bossi eriauhind
  const _rpc = rpc;
  rpc = async function (fn, args) { const r = await _rpc(fn, args); try { if (fn === 'fish_kt_claim' && r && (r.prizes || []).some(p => p.boss)) shout('BOSSILT SAADUD ERIAUHIND!', 'eriauhind') } catch (e) { } return r };
}

/* ---------- efektide tugevuse valik (Püük vahekaardil) ---------- */
{
  const _tp = tabPuuk;
  tabPuuk = function () { return _tp() + `<div class="sh-lvl"><span>✨ Hüüdsõnade ja efektide tugevus:</span><button type="button" class="${SH.lvl !== 'low' ? 'on' : ''}" data-shlvl="full">Täis</button><button type="button" class="${SH.lvl === 'low' ? 'on' : ''}" data-shlvl="low">Vähem</button></div>` };
  document.head.insertAdjacentHTML('beforeend', `<style>.sh-lvl{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;margin-top:4px;font-size:12.5px;color:#9fb8c2}
    .sh-lvl button{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#cfe0e6;border-radius:999px;padding:3px 11px;font-weight:800;font-size:12px;cursor:pointer}
    .sh-lvl button.on{background:#2a5a6c;color:#fff;border-color:rgba(140,210,235,.5)}</style>`);
  document.addEventListener('click', e => { const b = e.target.closest('[data-shlvl]'); if (!b) return; SH.lvl = b.dataset.shlvl; try { localStorage.setItem('mk.fxLvl', SH.lvl) } catch (er) { } renderFV(true); toast(SH.lvl === 'low' ? 'Efektid on nüüd tagasihoidlikumad.' : 'Efektid on täies hiilguses!', 'info') });
}
