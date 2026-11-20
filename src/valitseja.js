/* =====================================================================
   Sügavuste Valitseja – müütiline olend, kes võib ilmuda igal pool:
   - ilmasündmus „Valitseja ärkab“ (kõigile korraga, harva): siis võib ta näkata igas püügikohas
   - Sadama retkedel võib ta laeva kõrvale tõusta (valik: andam / väljakutse / põgene)
   - tema pilt joonistatakse koodiga (tume madu, sinised helendavad spiraalimärgid,
     kombitsataolised uimed ja helendavad silmad) ning on sama igal pool, kus kala on näha
   ===================================================================== */
const LEV = { raf: 0, last: 0 };
ARCH.abyss = Object.assign({}, ARCH.eel || {}, { eel: false, flat: true });
Object.assign(SP_ARCH, { sygavvalitseja: 'abyss' });
Object.assign(KI, {
  sygavvalitseja: ['Rex abyssi', 'Sügavuste Valitseja on iidne olend, kes elab kõigi vete all korraga. Kui ta ärkab, tumeneb vesi igas järves, jões ja meres.',
    ['Tema kehal helendavad sinised spiraalimärgid – vanad kalurid uskusid, et need on kõigi vete kaart.', 'Ta tõuseb vaid paariks minutiks ja vajub siis tagasi sügavusse.', 'Teda on nähtud nii väikeses metsajärves kui ka avamerel.', 'Kes ta kinni püüab, sellest räägitakse kogu kuningriigis.'], 1]
});
Object.assign(KI_GRP, { sygavvalitseja: 'angerjas' });
Object.assign(LU, { waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>' });

// --- olend: keskpunkt (0,0), pea vasakul (-x), L = pikkus ---
function levDraw(c, L, t, glow = 1) {
  const sw = t * 1.25, N = 56, P = [], Nn = [];
  const th = u => L * (.012 + .075 * Math.pow(Math.sin(Math.PI * Math.min(1, (u + .12) / 1.12)), .9));
  for (let i = 0; i <= N; i++) { const u = i / N, amp = L * (.025 + .085 * u); P.push([(-.36 + u * .86) * L, Math.sin(u * 5.4 - sw) * amp - L * .03]) }
  for (let i = 0; i <= N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; Nn.push([dy / d, -dx / d]) }
  const at = (u, off) => { const i = Math.round(u * N), w = th(u); return [P[i][0] + Nn[i][0] * w * off, P[i][1] + Nn[i][1] * w * off] };
  const pulse = k => .55 + .45 * Math.sin(t * 2.2 + k * 7);
  c.save(); c.lineJoin = c.lineCap = 'round';

  // kombitsataolised uimed (taga, enne keha)
  const tent = (u, below, len, ph, wid) => {
    const [ax, ay] = at(u, below ? -.8 : .8), dv = below ? 1 : -1, S = 24, pts = [];
    for (let i = 0; i <= S; i++) { const s = i / S, sway = Math.sin(t * 1.5 + ph + s * 3.2) * L * .05 * s; pts.push([ax + s * len * .8 + Math.sin(s * 2.6 + ph) * L * .025, ay + dv * (s * len * .5 + s * s * len * .25) + sway]) }
    const W = s => L * wid * Math.pow(1 - s, 1.15) + L * .0025, l = [], r = [];
    for (let i = 0; i <= S; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(S, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = W(i / S); l.push([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]); r.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]) }
    c.beginPath(); l.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); r.reverse().forEach(p => c.lineTo(p[0], p[1])); c.closePath();
    const g = c.createLinearGradient(ax, ay, pts[S][0], pts[S][1]); g.addColorStop(0, '#1e4868'); g.addColorStop(.7, '#12304a'); g.addColorStop(1, 'rgba(18,48,74,.4)'); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(110,200,240,.28)'; c.lineWidth = Math.max(.6, L * .0025); c.stroke();
    c.fillStyle = `rgba(95,224,255,${.7 * glow})`; for (let i = 3; i < S; i += 3) { c.beginPath(); c.arc(pts[i][0], pts[i][1], L * .0045, 0, 7); c.fill() }
    return pts;
  };
  // võrkuimed kahe kombitsa vahel (nagu tiivad)
  const web = (a, b) => { c.beginPath(); c.moveTo(a[0][0], a[0][1]); a.forEach(p => c.lineTo(p[0], p[1])); for (let i = b.length - 1; i >= 0; i--) c.lineTo(b[i][0], b[i][1]); c.closePath(); const g = c.createLinearGradient(a[0][0], a[0][1], a[a.length - 1][0], a[a.length - 1][1]); g.addColorStop(0, 'rgba(50,130,175,.42)'); g.addColorStop(1, 'rgba(50,130,175,.08)'); c.fillStyle = g; c.fill() };
  const d1 = tent(.07, false, L * .42, 4.2, .02), d2 = tent(.14, false, L * .32, 5, .015); web(d1, d2);
  const t1 = tent(.09, true, L * .6, 0, .03), t2 = tent(.17, true, L * .48, 1.3, .024); web(t1, t2);
  const t3 = tent(.32, true, L * .5, 2.4, .026), t4 = tent(.4, true, L * .38, 3.1, .02); web(t3, t4);

  // keha
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) { const w = th(i / N); top.push([P[i][0] + Nn[i][0] * w, P[i][1] + Nn[i][1] * w]); bot.push([P[i][0] - Nn[i][0] * w, P[i][1] - Nn[i][1] * w]) }
  // seljaogad
  c.fillStyle = '#081624';
  for (let i = 3; i < N - 6; i += 3) { const u = i / N, w = th(u), [x, y] = top[i], h = w * (.55 + .25 * Math.sin(i)); c.beginPath(); c.moveTo(x - Nn[i][1] * w * .4, y + Nn[i][0] * w * .4); c.lineTo(x + Nn[i][0] * h + L * .012, y + Nn[i][1] * h); c.lineTo(x + Nn[i][1] * w * .4, y - Nn[i][0] * w * .4); c.fill() }
  c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath();
  const bg = c.createLinearGradient(0, -L * .18, 0, L * .16); bg.addColorStop(0, '#24506f'); bg.addColorStop(.45, '#122c44'); bg.addColorStop(1, '#050d17'); c.fillStyle = bg; c.fill();
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = Math.max(1, L * .004); c.stroke();
  // soomuste kuma ja kõht
  c.save(); c.clip();
  c.strokeStyle = 'rgba(120,190,230,.10)'; c.lineWidth = Math.max(.6, L * .003);
  for (let i = 2; i < N; i += 2) { const w = th(i / N); c.beginPath(); c.arc(P[i][0], P[i][1], w * .9, -1.2, 1.2); c.stroke() }
  c.beginPath(); bot.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = 'rgba(70,150,190,.35)'; c.lineWidth = L * .012; c.stroke();
  c.restore();
  // helendavad spiraalimärgid
  c.shadowColor = '#4fd8ff'; c.shadowBlur = L * .03 * glow; c.strokeStyle = '#7ce8ff'; c.lineWidth = Math.max(.8, L * .0055);
  [.17, .28, .39, .5, .61, .72, .83].forEach((u, k) => {
    const [x, y] = at(u, .05), r = th(u) * .62; if (r < L * .006) return;
    c.globalAlpha = Math.min(1, glow * pulse(k)); c.beginPath();
    for (let a = 0; a <= Math.PI * 3.4; a += .2) { const rr = r * a / (Math.PI * 3.4), q = a * (k % 2 ? 1 : -1); a ? c.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr) : c.moveTo(x, y) }
    c.stroke();
    if (k < 6) { const [x2, y2] = at(u + .055, .05); c.beginPath(); c.arc(x2, y2, L * .004, 0, 7); c.fillStyle = '#9ff0ff'; c.fill() }
  });
  // helendavad täpid kõhul
  c.fillStyle = '#5fe0ff';
  for (let i = 6; i < N - 4; i += 3) { const u = i / N; c.globalAlpha = Math.min(1, glow * (.4 + .4 * Math.sin(t * 3 + i))); const [x, y] = at(u, -.72); c.beginPath(); c.arc(x, y, L * .0035, 0, 7); c.fill() }
  c.globalAlpha = 1; c.shadowBlur = 0;

  // pea
  const [hx, hy] = P[0], ang = Math.atan2(P[0][1] - P[2][1], P[0][0] - P[2][0]) - Math.PI;
  c.save(); c.translate(hx, hy); c.rotate(ang); c.scale(1.22, 1.22);
  const jaw = .35 + .25 * Math.sin(t * .9);
  // sarved/harjas taha
  c.fillStyle = '#081624';
  [[-.04, -.055, .1, -.11], [-.08, -.05, .03, -.12], [-.11, -.04, -.04, -.1]].forEach(([x0, y0, x1, y1]) => { c.beginPath(); c.moveTo(x0 * L, y0 * L); c.quadraticCurveTo((x0 + x1) / 2 * L, (y1 - .02) * L, x1 * L, y1 * L); c.lineTo((x0 + .035) * L, (y0 + .012) * L); c.fill() });
  // alalõug (avatud suu)
  c.beginPath(); c.moveTo(.01 * L, .03 * L); c.quadraticCurveTo(-.08 * L, (.06 + jaw * .02) * L, -.18 * L, (.02 + jaw * .045) * L); c.lineTo(-.17 * L, (.005 + jaw * .03) * L); c.quadraticCurveTo(-.08 * L, .03 * L, .0, .015 * L); c.closePath();
  c.fillStyle = '#0b1d2e'; c.fill();
  // suu sisemus
  c.beginPath(); c.moveTo(-.04 * L, .012 * L); c.lineTo(-.175 * L, .006 * L); c.lineTo(-.17 * L, (.006 + jaw * .03) * L); c.quadraticCurveTo(-.09 * L, .03 * L, -.04 * L, .02 * L); c.closePath(); c.fillStyle = '#1c0710'; c.fill();
  // ülalõug ja kolju
  c.beginPath(); c.moveTo(.03 * L, -.05 * L); c.quadraticCurveTo(-.06 * L, -.085 * L, -.15 * L, -.035 * L); c.quadraticCurveTo(-.205 * L, -.012 * L, -.2 * L, .004 * L); c.lineTo(-.04 * L, .012 * L); c.quadraticCurveTo(.02 * L, .03 * L, .04 * L, .03 * L); c.closePath();
  const hg = c.createLinearGradient(0, -.09 * L, 0, .03 * L); hg.addColorStop(0, '#2a5878'); hg.addColorStop(1, '#0b1d2e'); c.fillStyle = hg; c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(1, L * .004); c.stroke();
  // kihvad
  c.fillStyle = '#e6f6ff';
  for (let i = 0; i < 6; i++) { const x = (-.19 + i * .022) * L, h = (i % 2 ? .016 : .024) * L; c.beginPath(); c.moveTo(x, .005 * L); c.lineTo(x + .006 * L, .005 * L + h); c.lineTo(x + .012 * L, .006 * L); c.fill() }
  for (let i = 0; i < 4; i++) { const x = (-.165 + i * .026) * L, y = (.006 + jaw * .03) * L * (1 - i * .15) + .004 * L; c.beginPath(); c.moveTo(x, y); c.lineTo(x + .005 * L, y - .016 * L); c.lineTo(x + .011 * L, y); c.fill() }
  // tilkuvad kiud lõua alt
  c.strokeStyle = 'rgba(20,50,70,.85)'; c.lineWidth = Math.max(.7, L * .003);
  for (let i = 0; i < 4; i++) { const x = (-.15 + i * .04) * L, y = (.03 + jaw * .025) * L, len = (.04 + (i % 2) * .03) * L, s = Math.sin(t * 1.4 + i) * L * .01; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s, y + len * .6, x + s * 1.5, y + len); c.stroke(); c.fillStyle = 'rgba(95,224,255,.6)'; c.beginPath(); c.arc(x + s * 1.5, y + len, L * .003, 0, 7); c.fill() }
  // märk peal ja kulm
  c.shadowColor = '#4fd8ff'; c.shadowBlur = L * .025 * glow; c.strokeStyle = '#7ce8ff'; c.lineWidth = Math.max(.7, L * .0045); c.globalAlpha = Math.min(1, glow * pulse(9));
  c.beginPath(); for (let a = 0; a <= Math.PI * 3; a += .25) { const rr = L * .016 * a / (Math.PI * 3); a ? c.lineTo(-.045 * L + Math.cos(a) * rr, -.04 * L + Math.sin(a) * rr) : c.moveTo(-.045 * L, -.04 * L) } c.stroke();
  c.globalAlpha = 1; c.shadowBlur = 0;
  c.fillStyle = '#081624'; c.beginPath(); c.moveTo(-.16 * L, -.04 * L); c.quadraticCurveTo(-.12 * L, -.06 * L, -.085 * L, -.045 * L); c.lineTo(-.1 * L, -.035 * L); c.fill();
  // silmad
  const eg = .75 + .25 * Math.sin(t * 2.6);
  c.shadowColor = '#4fd8ff'; c.shadowBlur = L * .05 * glow * eg; c.fillStyle = '#dffbff';
  c.beginPath(); c.ellipse(-.125 * L, -.03 * L, .017 * L, .011 * L, -.2, 0, 7); c.fill();
  c.fillStyle = '#5fe0ff'; c.beginPath(); c.ellipse(-.127 * L, -.03 * L, .008 * L, .009 * L, 0, 0, 7); c.fill();
  c.shadowBlur = 0; c.fillStyle = '#02101c'; c.beginPath(); c.ellipse(-.127 * L, -.03 * L, .0025 * L, .008 * L, 0, 0, 7); c.fill();
  c.restore();
  c.restore();
}

// stseen sündmusekaardile ja Sadama valikule: sügav vesi, valguskiired, uppunud varemed ja Valitseja
function levScene(c, w, h, t, focusRight, dim) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b4466'); g.addColorStop(.45, '#062a44'); g.addColorStop(1, '#020c18'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  // valguskiired
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) { const x = w * (.25 + i * .2) + Math.sin(t * .3 + i) * w * .03, gr = c.createLinearGradient(0, 0, 0, h * .9); gr.addColorStop(0, 'rgba(120,200,255,.16)'); gr.addColorStop(1, 'rgba(120,200,255,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x - w * .03, 0); c.lineTo(x + w * .03, 0); c.lineTo(x + w * .11, h); c.lineTo(x - w * .05, h); c.fill() }
  c.restore();
  // varemed
  c.fillStyle = '#04182a';
  const col = (x, ww, hh) => { c.fillRect(x, h - hh, ww, hh); c.fillRect(x - ww * .2, h - hh, ww * 1.4, ww * .3) };
  col(w * .06, w * .03, h * .5); col(w * .16, w * .025, h * .32); col(w * .86, w * .035, h * .58); col(w * .94, w * .025, h * .36);
  c.beginPath(); c.moveTo(w * .62, h); c.lineTo(w * .62, h * .72); c.quadraticCurveTo(w * .7, h * .56, w * .78, h * .72); c.lineTo(w * .78, h); c.lineTo(w * .755, h); c.lineTo(w * .755, h * .75); c.quadraticCurveTo(w * .7, h * .64, w * .645, h * .75); c.lineTo(w * .645, h); c.fill();
  // vetikad
  c.strokeStyle = '#0a3a3a'; c.lineWidth = Math.max(2, w * .006);
  for (let i = 0; i < 9; i++) { const x = w * (i / 9 + .03), hh = h * (.12 + (i * 37 % 10) / 50); c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x + Math.sin(t + i) * w * .015, h - hh * .6, x + Math.sin(t * 1.2 + i) * w * .02, h - hh); c.stroke() }
  // osakesed
  c.fillStyle = 'rgba(170,230,255,.45)';
  for (let i = 0; i < 26; i++) { const x = ((i * 97) % 100) / 100 * w + Math.sin(t * .5 + i) * 6, y = h - (((t * 8 + i * 41) % (h + 20))); c.beginPath(); c.arc(x, y, 1 + (i % 3) * .5, 0, 7); c.fill() }
  // kuma ja olend
  const L = Math.min(w * (focusRight ? .62 : .78), h * (focusRight ? 1.75 : 1.45)), cx = focusRight ? w * .62 : w * .5, cy = h * (focusRight ? .45 : .5) + Math.sin(t * .6) * h * .025;
  const rg = c.createRadialGradient(cx, cy, 0, cx, cy, L * .6); rg.addColorStop(0, 'rgba(60,170,220,.22)'); rg.addColorStop(1, 'rgba(60,170,220,0)'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
  c.save(); if (dim) c.globalAlpha = .3; c.translate(cx + Math.sin(t * .35) * w * .02, cy + (dim ? h * .12 : 0)); levDraw(c, L, t, dim ? .5 : 1); c.restore();
  if (focusRight) { const fg = c.createLinearGradient(0, 0, w * .55, 0); fg.addColorStop(0, 'rgba(2,12,24,.88)'); fg.addColorStop(1, 'rgba(2,12,24,0)'); c.fillStyle = fg; c.fillRect(0, 0, w * .55, h) }
}
function levHtml(cls) { return `<canvas class="lev-cv ${cls || ''}" aria-hidden="true"></canvas>` }
function levLoop(ts) {
  const cvs = document.querySelectorAll('canvas.lev-cv');
  if (!cvs.length) { LEV.raf = 0; return }
  LEV.raf = requestAnimationFrame(levLoop);
  if (ts - LEV.last < 33 || document.hidden) return; LEV.last = ts;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, t = reduce ? 2 : ts / 1000;
  const sz = [...cvs].map(cv => { const r = cv.getBoundingClientRect(); return [cv.clientWidth, cv.clientHeight, r.bottom > -50 && r.top < innerHeight + 50] });
  cvs.forEach((cv, i) => {
    const [w, h, vis] = sz[i]; if (!w || !h || (!vis && cv.width)) return;
    const d = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) }
    const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); levScene(c, w, h, t, cv.classList.contains('right') && w > 520, cv.classList.contains('dim'));
  });
}
function levStart() { if (!LEV.raf && document.querySelector('canvas.lev-cv')) LEV.raf = requestAnimationFrame(levLoop) }

// kalapildid (püük, saak, raamat, kaardid): Valitseja joonistatakse oma kujuga
{
  const _dl = drawLook;
  drawLook = function (c, x, y, L, look, t = 0, dir = 1, junk) {
    if (junk || !look || look.fx !== 'abyss') return _dl.apply(this, arguments);
    c.save(); c.translate(x, y - L * .09); c.scale(dir, 1); levDraw(c, L * .68, t || 1.2, 1); c.restore();
  };
}

// ilmasündmus „Valitseja ärkab“
Object.assign(WV_INFO, {
  valitseja: { n: 'Sügavuste Valitseja', ic: 'crown', col: '#5fe0ff', wic: 'waves', wn: 'Vesi tumeneb', warn: 'Vesi tumeneb kõikjal…', wsub: 'Midagi iidset ärkab', wleft: 'ärkamiseni',
    on: 'Sügavuste Valitseja on ärganud!', done: 'Sügavuste Valitseja vajus tagasi sügavusse.', osub: 'Ta võib näkata igas püügikohas', art: 1,
    wfx: ['Sügavustest tõuseb midagi suurt', 'Pane tugevaim õng valmis'],
    ofx: ['Igas veekogus võib näkata Sügavuste Valitseja', 'Ainult 20. tasemest – ta on väga raske välja tõmmata'] }
});
Object.assign(WV_INFO.torm, { wic: 'cloud-lightning', wn: 'Torm tuleb', wsub: 'Torm jõuab kohale', wleft: 'tormini' });
TQ_RULES.unshift([/valitseja|vesi tumeneb/i, 'crown', 1]);
{
  const _r = renderFV;
  renderFV = function () { const r = _r.apply(this, arguments); levStart(); return r };
  const _m = renderModal;
  renderModal = function () { const r = _m.apply(this, arguments); levStart(); return r };
}
document.head.insertAdjacentHTML('beforeend', `<style>
.wv-card.wv-valitseja{min-height:150px;border-color:rgba(95,224,255,.55);background:#020c18}
.wv-card.wv-valitseja .wv-bg{background:#020c18}
.wv-card.wv-valitseja .lev-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
.wv-card.wv-valitseja .wv-tx h3{text-shadow:0 0 18px rgba(95,224,255,.6)}
.wv-card.wv-valitseja .wv-tx,.wv-card.wv-valitseja .wv-side{max-width:62%}
.wv-card.wv-valitseja .wv-side{max-width:none}
.sd-choice.lev{position:relative;overflow:hidden;background:#020c18;border-color:rgba(95,224,255,.55)}
.sd-choice.lev .lev-cv{display:block;width:calc(100% + 24px);height:170px;margin:-12px -12px 10px;border-bottom:1px solid rgba(95,224,255,.3)}
.sd-choice.lev h3{color:#bff4ff;text-shadow:0 0 14px rgba(95,224,255,.6)}
@media (max-width:560px){.wv-card.wv-valitseja{min-height:0;padding-top:120px}.wv-card.wv-valitseja .lev-cv{height:150px;bottom:auto}.wv-card.wv-valitseja .wv-tx{max-width:none}
  .wv-card.wv-valitseja .wv-bg::after{content:'';position:absolute;left:0;right:0;top:90px;height:60px;background:linear-gradient(180deg,rgba(2,12,24,0),#020c18)}}
</style>`);
