/* =====================================================================
   Hübriidkalade joonistamine (geneetikalabor)
   Keha tuleb mängu kalajoonistajast (drawFishReal) pärandatud kehatüübiga; värvid tulevad
   elementidest ja vanemate värvidest. Kahe elemendiga kala on kahevärviline (eest ühe, tagant
   teise elemendi värvides). Peale tulevad elemendiefektid, helendavad silmad ja harulduse aura.
   ===================================================================== */
const HY_EL = {
  tuli: { n: 'Tuli', ic: '🔥', pal: ['#ff8a3a', '#a8220c', '#ffd9a0', '#ff5a1a'], eye: '#ffb12a', glow: '#ff7a2a', pat: 'koi', ab: 'tarkus' },
  'jää': { n: 'Jää', ic: '❄️', pal: ['#c4ecff', '#3f7fbf', '#ffffff', '#8fd3ff'], eye: '#a8f4ff', glow: '#8fd8ff', pat: 'scales2', ab: 'kaitse' },
  vesi: { n: 'Vesi', ic: '💧', pal: ['#3fb0dc', '#0c4775', '#cdf2ff', '#62d6f2'], eye: '#b4f2ff', glow: '#45c3f2', pat: 'char', ab: 'onn' },
  'välk': { n: 'Välk', ic: '⚡', pal: ['#26357f', '#070b24', '#9fdcff', '#3ff0ff'], eye: '#d6ffff', glow: '#5ee6ff', pat: 'mackerel', ab: 'tarkus' },
  vari: { n: 'Vari', ic: '🌑', pal: ['#3d2c5e', '#100820', '#8e7cad', '#8048d0'], eye: '#c97aff', glow: '#8a52ff', pat: 'mottle', ab: 'kuld' },
  valgus: { n: 'Valgus', ic: '✨', pal: ['#ffe293', '#c48d22', '#fff9e6', '#ffd257'], eye: '#fff4b0', glow: '#ffe088', pat: 'photo', ab: 'kuld' },
  loodus: { n: 'Loodus', ic: '🌿', pal: ['#5fbf5c', '#1b5628', '#dcf3b6', '#a2e46f'], eye: '#e6ff86', glow: '#8cf273', pat: 'trout', ab: 'onn' }
};
const HY_RAR = [null, ['Tavaline', '#c8d4d8'], ['Ebatavaline', '#6fd47f'], ['Haruldane', '#52adff'], ['Eepiline', '#c27aff'], ['Müütiline', '#ffc444']];
const HY_AB = { tarkus: ['📘', 'Tarkus', 'kogemust kalapüügist'], kuld: ['💰', 'Kullasoomus', 'kalade müügihinnale'], onn: ['🍀', 'Õnn', 'haruldaste kalade võimalusele'], kaitse: ['🛡️', 'Kaitse', 'õnge murdumise vastu'] };
const HY_HID = { retsessiivne: ['🧬', 'Varjatud element', 'Kannab peidetud elementi, mis võib järglastes välja tulla'], kiirkasv: ['🌱', 'Kiirkasv', 'Kasvas 20% suuremaks'], kuldsoomus: ['🪙', 'Kuldsoomus', 'Väärtus +25%'], helendus: ['💡', 'Helendus', 'Helendab pimedas tugevamalt'], vastupidav: ['💪', 'Vastupidav', 'Võime on +1% tugevam'], '?': ['❔', 'Peidetud geen', 'Avastamiseks on vaja geneetilist analüsaatorit (labori 3. tase)'] };
const HY_BODY = { ahven: 'perch', karp: 'carp', haug: 'pike', angerjas: 'eel' };
const HY_LEG = { l_draakoniahven: 'perch', l_kuldsuvahaug: 'pike', l_jaaleegimonarh: 'carp', l_tormilohe: 'serpent', l_kuukuningas: 'carp', l_soovihaldjas: 'angel', l_sugavusteisand: 'serpent', l_taevalaotus: 'grayling' };
const HY_CREST = { l_draakoniahven: '#ffc44a', l_tormilohe: '#5ee6ff', l_sugavusteisand: '#8a52ff' };

function hyRand(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 } }
function hyPal(p, q, k) { return p.map((c, i) => (q && q[i] ? mixC(c, q[i], k) : c)) }
function hyArch(f) { const g = f.genes || {}; return ARCH[g.arch] ? g.arch : HY_LEG[f.species] || HY_BODY[f.body] || 'cypr' }
function hyFit(arch) { const a = ARCH[arch] || ARCH.cypr; return a.flat ? .55 : a.eel ? .3 : a.H * (a.hump + a.belly) + a.H * (a.dors === 'sail' ? 1.3 : a.dors === 'trail' ? 1.1 : a.dors === 'tall' ? .7 : .75) - (a.H > .2 ? a.H * .35 : 0) }
// joonistaja võtmed: oma kehatüüp elemendi silmavärviga ja elemendi muster
function hyKey(arch, e, pat) {
  const ak = 'hy:' + arch + ':' + e, sid = ak + ':' + pat;
  if (!ARCH[ak]) ARCH[ak] = Object.assign({}, ARCH[arch], { eye: HY_EL[e].eye, eyeR: (ARCH[arch].eyeR || .03) * 1.12 });
  SP_ARCH[sid] = ak; SP_PAT[sid] = pat; return sid;
}
// kala geomeetria (sama valem mis drawFishReal / drawEel): keskjoon, selg, kõht ja silm
function hyGeom(a, L, t) {
  if (a.eel) {
    const hh = a.H * L, x0 = -L * .48, len = L * .98, ph = t * 4, cy = u => Math.sin(u * 7 - ph) * L * .035 * (.25 + u);
    const th2 = u => hh * (u < .08 ? Math.sqrt(u / .08) * .9 + .1 : u < .6 ? 1 : Math.max(.08, 1 - (u - .6) / .4 * .92));
    return { hh, X: u => x0 + len * u, top: u => cy(u) - th2(u), bot: u => cy(u) + th2(u), eye: [x0 + len * .045, cy(.045) - hh * .3, Math.max(1.1, L * a.eyeR)], tail: x0 + len };
  }
  if (a.flat) { const rx = L * .42, ry = L * .26; return { hh: ry, X: u => -rx + u * rx * 2, top: u => -ry * Math.sin(Math.PI * Math.min(1, u)) * .9, bot: u => ry * Math.sin(Math.PI * Math.min(1, u)) * .9, eye: null, tail: rx * 1.2 } }
  const hh = a.H * L, xs = -L * .47 + (a.bill ? a.bill * L * .75 : 0), xp = L * .3, bl = xp - xs;
  const prof = u => { if (u < a.p) { const v = u / a.p; return .04 + .96 * Math.pow(Math.sin(v * Math.PI / 2), a.head * .85) } const v = (u - a.p) / (1 - a.p); return a.ped + (1 - a.ped) * Math.pow(Math.cos(v * Math.PI / 2), 1.25) };
  const top = u => -hh * prof(u) * (a.flatTop ? .92 : a.hump) + (a.flatTop ? 0 : hh * .04 * Math.sin(u * Math.PI)), bot = u => hh * prof(u) * a.belly, X = u => xs + bl * u;
  const eu = a.whiskers ? .07 : a.head > 1.5 ? .14 : .09;
  return { hh, X, top, bot, eye: [X(eu), top(eu) * .45, Math.max(1.2, L * a.eyeR)], tail: xp + L * .2 };
}

/* ---------- elemendiefektid ---------- */
function hyFx(c, L, G, el, t, seed, n, u0, u1) {
  const R = hyRand(seed), U = () => u0 + R() * (u1 - u0), hh = Math.max(G.hh, L * .045);
  c.save(); c.globalCompositeOperation = 'lighter';
  switch (el) {
    case 'tuli': {
      for (let k = 0; k < n; k++) { // leegid seljal
        const u = U(), x = G.X(u), yt = G.top(u), w = L * (.018 + R() * .02), h = hh * (.7 + R() * .8) * (.75 + .25 * Math.sin(t * 9 + k * 1.7)), sw = Math.sin(t * 6 + k) * w * .8;
        const gr = c.createLinearGradient(x, yt, x, yt - h); gr.addColorStop(0, 'rgba(255,90,20,.75)'); gr.addColorStop(.55, 'rgba(255,170,40,.5)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
        c.fillStyle = gr; c.beginPath(); c.moveTo(x - w, yt + 1); c.quadraticCurveTo(x - w * .4 + sw * .5, yt - h * .55, x + sw, yt - h); c.quadraticCurveTo(x + w * .5 + sw * .4, yt - h * .5, x + w, yt + 1); c.fill();
      }
      for (let k = 0; k < n * 1.5; k++) { // sädemed
        const u = U(), p = (t * (.35 + R() * .3) + R()) % 1, x = G.X(u) + Math.sin(t * 2 + k) * L * .03, y = G.top(u) - p * hh * 3.2;
        c.fillStyle = `rgba(255,${150 + (k % 4) * 25},60,${(1 - p) * .9})`; c.beginPath(); c.arc(x, y, Math.max(.6, L * .006 * (1 - p * .5)), 0, 6.283); c.fill();
      }
      break;
    }
    case 'jää': {
      c.globalCompositeOperation = 'source-over';
      for (let k = 0; k < n; k++) { // jääkristallid seljal
        const u = U(), x = G.X(u), yt = G.top(u) + 1, w = L * (.012 + R() * .014), h = hh * (.45 + R() * .7), lean = (R() - .5) * w * 1.5;
        c.fillStyle = 'rgba(214,244,255,.78)'; c.beginPath(); c.moveTo(x - w, yt); c.lineTo(x + lean, yt - h); c.lineTo(x + w, yt); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = Math.max(.5, L * .003); c.stroke();
        c.strokeStyle = 'rgba(120,190,240,.7)'; c.beginPath(); c.moveTo(x + lean * .3, yt - 1); c.lineTo(x + lean * .9, yt - h * .9); c.stroke();
      }
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < n; k++) { // härmatähed
        const u = U(), a2 = Math.max(0, Math.sin(t * 2.6 + k * 2.1)), x = G.X(u) + (R() - .5) * L * .1, y = (R() > .5 ? G.top(u) - hh * R() * 1.2 : G.bot(u) + hh * R()), r = L * .016 * a2;
        if (r > .4) { c.strokeStyle = `rgba(230,250,255,${a2})`; c.lineWidth = Math.max(.5, L * .003); c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke() }
      }
      break;
    }
    case 'vesi': {
      for (let k = 0; k < 3; k++) { // voolav lint ümber keha
        c.strokeStyle = `rgba(110,215,255,${.16 - k * .045})`; c.lineWidth = Math.max(.6, L * (.005 - k * .0012)); c.beginPath();
        for (let i = 0; i <= 30; i++) { const u = u0 + (u1 - u0) * i / 30, x = G.X(u), y = (G.top(u) + G.bot(u)) / 2 + Math.sin(u * 12 + t * 3 + k * 2) * hh * (1.25 + k * .2); i ? c.lineTo(x, y) : c.moveTo(x, y) }
        c.stroke();
      }
      for (let k = 0; k < n; k++) { // mullid
        const u = U(), p = (t * (.25 + R() * .25) + R()) % 1, x = G.X(u) + Math.sin(t * 2 + k) * L * .02, y = G.top(u) - p * hh * 3.5, r = Math.max(.8, L * (.008 + R() * .008));
        c.strokeStyle = `rgba(210,250,255,${(1 - p) * .8})`; c.lineWidth = Math.max(.5, L * .003); c.beginPath(); c.arc(x, y, r, 0, 6.283); c.stroke();
      }
      break;
    }
    case 'välk': {
      const fr = Math.floor(t * 9);
      for (let k = 0; k < Math.max(2, n * .6); k++) { // elektrikaared
        const r2 = hyRand(seed * 31 + fr * 977 + k * 7919); if (r2() < .35) continue;
        const ua = u0 + r2() * (u1 - u0), ub = Math.min(u1, ua + .12 + r2() * .25), up = r2() < .5, ya = up ? G.top(ua) : G.bot(ua), yb = up ? G.top(ub) : G.bot(ub);
        const pts = []; for (let i = 0; i <= 7; i++) { const s = i / 7, x = G.X(ua + (ub - ua) * s), y = ya + (yb - ya) * s + (up ? -1 : 1) * Math.sin(s * Math.PI) * hh * (.6 + r2() * .7) + (r2() - .5) * hh * .5; pts.push([x, y]) }
        for (const [lw, col] of [[L * .016, 'rgba(70,200,255,.25)'], [L * .007, 'rgba(140,235,255,.6)'], [L * .0028, 'rgba(240,255,255,.95)']]) { c.strokeStyle = col; c.lineWidth = Math.max(.5, lw); c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke() }
      }
      for (let k = 0; k < n; k++) { const u = U(), a2 = (Math.sin(t * 13 + k * 3) + 1) / 2; if (a2 < .6) continue; c.fillStyle = `rgba(200,250,255,${a2})`; c.beginPath(); c.arc(G.X(u) + (R() - .5) * L * .08, G.top(u) - R() * hh * 1.5, Math.max(.5, L * .005), 0, 6.283); c.fill() }
      break;
    }
    case 'vari': {
      c.globalCompositeOperation = 'source-over';
      for (let k = 0; k < n; k++) { // tumedad suitsujoad sabast taha
        const p = (t * (.18 + R() * .12) + R()) % 1, u = u0 + (u1 - u0) * (.4 + R() * .6), x = G.X(u) + p * L * .45, y = (G.top(u) + G.bot(u)) / 2 + (R() - .5) * hh * 2 - p * hh * .6, r = hh * (.5 + p * 1.1);
        const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(36,10,64,${.42 * (1 - p)})`); gr.addColorStop(1, 'rgba(36,10,64,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
      }
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < n; k++) { const u = U(), p = (t * .3 + R()) % 1; c.fillStyle = `rgba(190,120,255,${(1 - p) * .8})`; c.beginPath(); c.arc(G.X(u) + p * L * .2, G.bot(u) + (R() - .3) * hh * 1.4 - p * hh, Math.max(.5, L * .005), 0, 6.283); c.fill() }
      break;
    }
    case 'valgus': {
      for (let k = 0; k < n * 1.4; k++) { // kuldsed tähekesed
        const u = U(), p = (t * (.15 + R() * .15) + R()) % 1, a2 = Math.sin(p * Math.PI), x = G.X(u) + (R() - .5) * L * .12, y = (R() > .5 ? G.top(u) : G.bot(u)) + (R() - .5) * hh * 2.4 - p * hh;
        if (typeof gSparkle === 'function') gSparkle(c, x, y, L * .014 * a2, `rgba(255,236,170,${a2})`);
      }
      break;
    }
    case 'loodus': {
      c.globalCompositeOperation = 'source-over';
      for (let k = 0; k < Math.max(2, n * .6); k++) { // lehed tiirlevad kala ümber
        const ph2 = t * (.35 + R() * .2) + R() * 6.28, u = u0 + (u1 - u0) * ((Math.sin(ph2) + 1) / 2), x = G.X(u), y = (G.top(u) + G.bot(u)) / 2 + Math.cos(ph2) * hh * 1.8, s = L * (.022 + R() * .012), rot = ph2 * 1.5;
        c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = .55 + .4 * Math.cos(ph2);
        const gr = c.createLinearGradient(-s, 0, s, 0); gr.addColorStop(0, '#2f8a3a'); gr.addColorStop(1, '#a8e870'); c.fillStyle = gr;
        c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * .7, s, 0); c.quadraticCurveTo(0, s * .7, -s, 0); c.fill();
        c.strokeStyle = 'rgba(230,255,200,.6)'; c.lineWidth = Math.max(.4, s * .08); c.beginPath(); c.moveTo(-s * .8, 0); c.lineTo(s * .8, 0); c.stroke(); c.restore();
      }
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < n; k++) { const u = U(), p = (t * .2 + R()) % 1; c.fillStyle = `rgba(190,255,140,${Math.sin(p * Math.PI) * .8})`; c.beginPath(); c.arc(G.X(u) + Math.sin(t + k) * L * .04, G.top(u) - p * hh * 2.5, Math.max(.5, L * .005), 0, 6.283); c.fill() }
      break;
    }
  }
  c.restore();
}

/* ---------- aura kala taga (haruldus) ---------- */
function hyAura(c, L, G, f, t, A, B) {
  const r = f.rarity || 1, hid = f.genes && f.genes.hidden && f.genes.hidden.id === 'helendus', k = [0, .1, .2, .3, .42, .55][r] + (hid ? .15 : 0);
  c.save(); c.globalCompositeOperation = 'lighter';
  if (k > 0) {
    const cx = (G.X(.1) + G.X(.9)) / 2, pulse = 1 + Math.sin(t * 2) * .06;
    const gA = c.createRadialGradient(cx - L * .12, 0, 0, cx - L * .12, 0, L * .55 * pulse); gA.addColorStop(0, hexA(A.glow, k)); gA.addColorStop(1, hexA(A.glow, 0)); c.fillStyle = gA; c.fillRect(-L, -L, L * 2, L * 2);
    if (B !== A) { const gB = c.createRadialGradient(cx + L * .15, 0, 0, cx + L * .15, 0, L * .5 * pulse); gB.addColorStop(0, hexA(B.glow, k * .9)); gB.addColorStop(1, hexA(B.glow, 0)); c.fillStyle = gB; c.fillRect(-L, -L, L * 2, L * 2) }
  }
  if (f.e1 === 'valgus' || f.e2 === 'valgus' || r === 5) { // pöörlevad valguskiired
    const n = 14, rr = L * .62; c.save(); c.rotate(t * .15);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283; const gr = c.createLinearGradient(0, 0, Math.cos(a) * rr, Math.sin(a) * rr); gr.addColorStop(0, `rgba(255,230,150,${r === 5 ? .22 : .12})`); gr.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, rr, a - .07, a + .07); c.fill() }
    c.restore();
  }
  if (r >= 4) { // energiaring
    const ry = Math.max(G.hh * 2.4, L * .16), col = r === 5 ? '255,205,90' : '200,140,255';
    c.save(); c.rotate(-.08); c.setLineDash([L * .05, L * .025]); c.lineDashOffset = -t * L * .12;
    c.strokeStyle = `rgba(${col},.55)`; c.lineWidth = Math.max(.8, L * .007); c.beginPath(); c.ellipse(0, 0, L * .62, ry, 0, 0, 6.283); c.stroke();
    if (r === 5) { c.lineDashOffset = t * L * .08; c.strokeStyle = 'rgba(255,240,190,.35)'; c.beginPath(); c.ellipse(0, 0, L * .7, ry * 1.18, 0, 0, 6.283); c.stroke() }
    c.restore();
  }
  c.restore();
}
function hyFront(c, L, G, f, t, A, B, a) {
  const r = f.rarity || 1;
  c.save(); c.globalCompositeOperation = 'lighter';
  if (G.eye) { const [ex, ey, er] = G.eye, gr = c.createRadialGradient(ex, ey, 0, ex, ey, er * 3.4); gr.addColorStop(0, hexA(A.eye, .85)); gr.addColorStop(.35, hexA(A.eye, .35)); gr.addColorStop(1, hexA(A.eye, 0)); c.fillStyle = gr; c.beginPath(); c.arc(ex, ey, er * 3.4, 0, 6.283); c.fill() }
  if (r === 5) { // kuldne läige jookseb üle keha
    c.save(); c.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; c.lineTo(G.X(u), G.top(u)) } for (let i = 24; i >= 0; i--) { const u = i / 24; c.lineTo(G.X(u), G.bot(u)) } c.closePath(); c.clip();
    const sx = ((t * .35) % 1.6 - .3) * L * 1.4 - L * .55, gr = c.createLinearGradient(sx - L * .1, 0, sx + L * .1, 0); gr.addColorStop(0, 'rgba(255,230,160,0)'); gr.addColorStop(.5, 'rgba(255,240,190,.45)'); gr.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = gr; c.fillRect(-L, -L, L * 2, L * 2); c.restore();
  }
  c.restore();
  if (HY_CREST[f.species] && !a.eel) { // legendaarne hari seljal
    const col = HY_CREST[f.species]; c.save();
    for (let i = 0; i < 9; i++) { const u = .16 + i * .055, x = G.X(u), y = G.top(u) + 1, h = G.hh * (.55 + Math.sin(i / 8 * Math.PI) * .55); const gr = c.createLinearGradient(x, y, x, y - h); gr.addColorStop(0, col); gr.addColorStop(1, fShade(col, .55)); c.fillStyle = gr; c.beginPath(); c.moveTo(x - L * .016, y); c.lineTo(x + L * .006, y - h); c.lineTo(x + L * .02, y); c.closePath(); c.fill(); c.strokeStyle = 'rgba(60,20,0,.35)'; c.lineWidth = Math.max(.4, L * .002); c.stroke() }
    c.restore();
  }
}

/* ---------- põhifunktsioon ---------- */
// f: { species, e1, e2, rarity, legend, genes: { arch, col, col2, seed, hidden } }
// o: { sil: true } = avastamata kala siluett, { fx: false } = ilma efektideta (väike pilt)
function drawHybrid(c, x, y, L, f, t = 0, dir = 1, o = {}) {
  const g = f.genes || {}, arch = hyArch(f), a = ARCH[arch] || ARCH.cypr, A = HY_EL[f.e1] || HY_EL.vesi, B = HY_EL[f.e2] || A, seed = g.seed || 7;
  const pat = (seed % 2 ? A : B).pat, G = hyGeom(a, L, t);
  c.save(); c.translate(x, y); c.scale(dir, 1);
  if (o.sil) { c.filter = 'brightness(0)'; c.globalAlpha = .55; drawFishReal(c, L, { c: A.pal }, t, hyKey(arch, f.e1 || 'vesi', 'none')); c.restore(); return }
  const fx = o.fx !== false, n = [0, 3, 5, 7, 10, 13][f.rarity || 1];
  if (fx) hyAura(c, L, G, f, t, A, B);
  if (fx && (f.e1 === 'vari' || f.e2 === 'vari')) hyFx(c, L, G, 'vari', t, seed + 5, Math.ceil(n * .7), f.e1 === 'vari' ? .2 : .55, 1);
  const pA = hyPal(A.pal, g.col, .18), pB = hyPal(B.pal, g.col2, .18);
  drawFishReal(c, L, { c: pA, sp: f.e1 === 'loodus' }, t, hyKey(arch, f.e1, pat));
  if (B !== A) { // kahevärviline keha: tagumine osa teise elemendi värvides, laineline piir
    c.save(); c.beginPath(); const top = -L, bot = L, N = 16;
    for (let i = 0; i <= N; i++) { const yy = top + (bot - top) * i / N; c.lineTo(L * .02 + Math.sin(yy / L * 10 + t * 1.6) * L * .03, yy) }
    c.lineTo(L * 1.6, bot); c.lineTo(L * 1.6, top); c.closePath(); c.clip();
    drawFishReal(c, L, { c: pB }, t, hyKey(arch, f.e1, (seed % 2 ? B : A).pat)); c.restore();
    if (fx) { // helendav geneetiline õmblus elementide piiril (ainult keha sees)
      c.save(); c.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24; c.lineTo(G.X(u), G.top(u)) } for (let i = 24; i >= 0; i--) { const u = i / 24; c.lineTo(G.X(u), G.bot(u)) } c.closePath(); c.clip();
      c.globalCompositeOperation = 'lighter';
      const seam = () => { c.beginPath(); for (let i = 0; i <= N; i++) { const yy = top + (bot - top) * i / N; c.lineTo(L * .02 + Math.sin(yy / L * 10 + t * 1.6) * L * .03, yy) } };
      const sg = c.createLinearGradient(0, -G.hh, 0, G.hh); sg.addColorStop(0, hexA(A.glow, .9)); sg.addColorStop(1, hexA(B.glow, .9));
      c.strokeStyle = hexA(mixC(A.glow, B.glow, .5), .28); c.lineWidth = Math.max(1.5, L * .03); seam(); c.stroke();
      c.strokeStyle = sg; c.lineWidth = Math.max(.7, L * .008); seam(); c.stroke(); c.restore();
    }
  }
  if (fx) {
    const dual = B !== A;
    for (const [el, u0, u1, s] of dual ? [[f.e1, .04, .55, 11], [f.e2, .5, 1, 23]] : [[f.e1, .04, 1, 11]]) if (el !== 'vari') hyFx(c, L, G, el, t, seed + s, n, u0, u1);
    hyFront(c, L, G, f, t, A, B, a);
  }
  c.restore();
}
// kala mahutamine lõuendile (efektid ulatuvad kehast välja)
function hyFitL(f, w, h, k = 1) { const ar = hyArch(f), a = ARCH[ar] || ARCH.cypr, fit = hyFit(ar); return Math.min(w * (a.eel ? .74 : .6), h * .56 / fit) * k }
