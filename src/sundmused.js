/* =====================================================================
   Erisündmused: Haide väljakutse ja Sägaööd (iga nädalavahetus, vaheldumisi), eriülesanded ja edetabel,
   nädala kalastusretk ning reaalajas kahevõitlus teise mängijaga (5 minutit samas kohas, suurem kogukaal võidab).
   Server: schema.sql 2q ja 6p (event_state, event_quest_claim, event_prize_claim, journey_advance, duel_ping, duel_invite, duel_answer).
   ===================================================================== */
const EV = { d: null, loading: false, skew: 0, objs: [], raf: 0, busy: false };
const DU = { d: null, timer: 0, fast: false, seenInvite: 0, seenDone: 0, liveId: 0, pick: null, stake: 500, spot: null, busy: false };
const EV_INFO = {
  hai: { n: 'Haide väljakutse', ic: '🦈', col: '#4ac0e8', sp: ['ogahai', 'heeringahai'], where: 'Mereäär, Saarestik, Avameri ja Sügavik (heeringahai ainult paadiga kaugemal merel)',
    tip: 'Haid võtavad kõige paremini krevetti ja kuldvoblerit. Võta kaasa kahv – hai on tugev ja rebib tamiili kergesti katki.', title: 'Haikütt' },
  saga: { n: 'Sägaööd', ic: '🐟', col: '#b98bff', sp: ['saga'], where: 'Suur jõgi ja Kuninglik järv (alates 16. tasemest)',
    tip: 'Säga tuleb öösel (kell 21–5) kolm korda sagedamini ja sel nädalavahetusel kasvab ta eriti suureks.', title: 'Sägakuningas' }
};
FTABS.sundmused = '🎪 Sündmused';

document.head.insertAdjacentHTML('beforeend', `<style>
.ev-hero{position:relative;border-radius:20px;overflow:hidden;border:1px solid rgba(140,210,230,.25);box-shadow:0 18px 50px rgba(0,0,0,.45)}
.ev-hero canvas{display:block;width:100%;height:260px}
.ev-hero .ttl{position:absolute;left:16px;top:14px;right:16px;display:grid;gap:4px;pointer-events:none}
.ev-hero h2{margin:0;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:32px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.7)}
.ev-hero .cd{justify-self:start;padding:5px 12px;border-radius:999px;font-weight:800;background:rgba(0,0,0,.5);color:#fff;backdrop-filter:blur(3px)}
.ev-hero .live{background:linear-gradient(90deg,#e8463a,#ff8a4a);animation:evPulse 1.6s ease-in-out infinite}
@keyframes evPulse{50%{box-shadow:0 0 0 6px rgba(255,90,60,.2)}}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.ev-q{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.07)}
.ev-q.ok{border-color:rgba(127,209,106,.5)}
.ev-lb{display:grid;gap:4px;align-content:start}
.ev-lb div{display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:8px;align-items:center;padding:6px 10px;border-radius:10px;background:rgba(0,0,0,.18)}
.ev-lb div.me{background:rgba(242,181,82,.16);border:1px solid rgba(242,181,82,.4)}
.ev-lb .pl{font-weight:900;text-align:center}
.ev-prize{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px;border-radius:16px;background:linear-gradient(110deg,rgba(242,181,82,.22),rgba(40,30,10,.5));border:1px solid #f2b552}
.ev-prize .big{font-size:36px}
.jr-map canvas{display:block;width:100%;height:230px;border-radius:16px}
.jr-legs{display:grid;gap:6px;margin-top:10px}
.jr-leg{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 12px;border-radius:12px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.07)}
.jr-leg.done{opacity:.6}.jr-leg.cur{border-color:rgba(242,181,82,.6);background:rgba(242,181,82,.1)}
.jr-leg .n{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:900;background:rgba(255,255,255,.08)}
.jr-leg.done .n{background:#5cbf6a;color:#06200d}.jr-leg.cur .n{background:#f2b552;color:#2a1a05}
.du-list{display:grid;gap:6px}
.du-p{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 12px;border-radius:12px;background:rgba(0,0,0,.2)}
.bot-tag{display:inline-block;padding:1px 7px;border-radius:999px;font:800 10.5px system-ui;background:rgba(90,200,232,.16);border:1px solid rgba(90,200,232,.5);color:#bfefff;vertical-align:middle;white-space:nowrap}
.du-p.bot{background:rgba(90,200,232,.07)}
.du-p .dot.b{background:#5ac8e8;box-shadow:0 0 8px #5ac8e8}
.du-p small.d{display:block;opacity:.75;font-size:12px;margin-top:2px}
.du-p .dot{width:10px;height:10px;border-radius:50%;background:#5cbf6a;box-shadow:0 0 8px #5cbf6a}
.du-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px;border-radius:12px;background:rgba(242,181,82,.08);border:1px solid rgba(242,181,82,.3)}
.du-form select{padding:6px 8px;border-radius:9px;background:rgba(0,0,0,.35);color:inherit;border:1px solid rgba(255,255,255,.2)}
.du-off{padding:9px 12px;margin-bottom:8px;border-radius:12px;background:rgba(232,70,58,.18);border:1px solid #e8463a;font-size:13.5px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.du-hud{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;padding:10px 14px;margin-bottom:10px;border-radius:16px;
  background:linear-gradient(90deg,rgba(40,90,160,.92),rgba(14,24,40,.96) 45%,rgba(14,24,40,.96) 55%,rgba(170,50,50,.92));border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.du-hud .side{display:grid;gap:3px}.du-hud .side.r{text-align:right}
.du-hud b{font-size:15px}.du-hud .kg{font:900 22px system-ui;color:#fff}
.du-hud .bar{height:7px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}.du-hud .bar i{display:block;height:100%;background:#7ac8ff;transition:width .6s}
.du-hud .r .bar i{background:#ff8a7a;margin-left:auto}
.du-hud .mid{display:grid;justify-items:center;gap:2px;font-weight:900}
.du-hud .clock{font:900 24px system-ui;color:#ffe6a6}
.du-hud .vs{font-size:12px;opacity:.85}
.du-res canvas{width:100%;height:160px;display:block;border-radius:12px;background:rgba(0,0,0,.25)}
.du-res h2{text-align:center;margin:0;font-size:30px}
.du-res .cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.du-res .cols div{padding:10px;border-radius:12px;background:rgba(0,0,0,.2);font-size:13px;display:grid;gap:3px;align-content:start}
@media (max-width:620px){.ev-hero canvas{height:210px}.ev-hero h2{font-size:24px}.du-hud{grid-template-columns:1fr auto 1fr;padding:8px 10px}.du-hud .kg{font-size:17px}.du-hud .clock{font-size:19px}.ev-prize{grid-template-columns:auto minmax(0,1fr)}.ev-prize button{grid-column:1/-1}}
@media (prefers-reduced-motion:reduce){.ev-hero .live{animation:none}}
</style>`);

/* ---------- abi ---------- */
function evNow() { return Date.now() + EV.skew }
function evLeft(ms) { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return d ? `${d} p ${h} h` : h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m}:${String(x).padStart(2, '0')}` }
function evSpOk(id) { const p = FD.spot[id]; return p && p.min_level <= FS.level && (!p.boat || (FS.boats || []).includes(p.boat)) && !(typeof licMiss === 'function' && licMiss(id)) }
function evBestSpot(k) { const list = k === 'hai' ? ['sugavik', 'avameri', 'saarestik', 'meri'] : ['kuninglik', 'jogi']; return list.find(evSpOk) || null }
async function evLoad() {
  if (EV.loading || !CL.user) return; EV.loading = true;
  try { const d = await rpc('event_state'); EV.d = d; EV.skew = Date.parse(d.now) - Date.now() } catch (e) { }
  EV.loading = false; if (FV.open && FV.tab === 'sundmused') renderFV(true);
}

/* ---------- haid ---------- */
function drawShark(c, L, t, big) {
  const top = big ? '#33414f' : '#5f6e78', mid = big ? '#4a5a6a' : '#7a8892', bel = '#eef1f2', sw = Math.sin(t * 3) * L * .03;
  c.save(); c.lineJoin = 'round';
  // sabauim (ülemine sagar suurem)
  c.fillStyle = top; c.beginPath(); c.moveTo(L * .38, 0); c.quadraticCurveTo(L * .46, -L * .02, L * .56 + sw, -L * (big ? .2 : .16)); c.quadraticCurveTo(L * .52 + sw * .6, -L * .04, L * .5 + sw * .5, 0); c.quadraticCurveTo(L * .53 + sw, L * .03, L * .54 + sw, L * (big ? .13 : .08)); c.quadraticCurveTo(L * .45, L * .03, L * .38, 0); c.fill();
  // keha
  const g = c.createLinearGradient(0, -L * .1, 0, L * .1); g.addColorStop(0, mixC(top, '#000000', .2)); g.addColorStop(.45, mid); g.addColorStop(.62, mixC(bel, mid, .3)); g.addColorStop(1, bel); c.fillStyle = g;
  c.beginPath(); c.moveTo(-L * .5, L * .015); c.quadraticCurveTo(-L * .47, -L * .07, -L * .3, -L * (big ? .1 : .08)); c.quadraticCurveTo(-L * .02, -L * (big ? .13 : .1), L * .3, -L * .03); c.lineTo(L * .4, 0);
  c.lineTo(L * .3, L * .03); c.quadraticCurveTo(0, L * (big ? .11 : .085), -L * .3, L * .07); c.quadraticCurveTo(-L * .46, L * .05, -L * .5, L * .015); c.fill();
  if (big) { c.fillStyle = mixC(top, '#000000', .3); c.beginPath(); c.moveTo(L * .33, -L * .015); c.lineTo(L * .42, 0); c.lineTo(L * .33, L * .015); c.fill() }
  // seljauimed
  c.fillStyle = mixC(top, '#000000', .15); c.beginPath(); c.moveTo(-L * .1, -L * (big ? .115 : .095)); c.quadraticCurveTo(-L * .02, -L * (big ? .27 : .2), L * .05, -L * (big ? .25 : .19)); c.quadraticCurveTo(L * .03, -L * .14, L * .08, -L * .1); c.fill();
  c.beginPath(); c.moveTo(L * .22, -L * .05); c.quadraticCurveTo(L * .26, -L * .1, L * .29, -L * .1); c.lineTo(L * .29, -L * .04); c.fill();
  if (!big) { c.strokeStyle = '#e8e4d0'; c.lineWidth = Math.max(1, L * .008); c.beginPath(); c.moveTo(-L * .1, -L * .1); c.lineTo(-L * .085, -L * .16); c.moveTo(L * .22, -L * .05); c.lineTo(L * .235, -L * .09); c.stroke() }
  // rinnauim ja kõhuuimed
  c.fillStyle = mixC(top, '#000000', .1); c.beginPath(); c.moveTo(-L * .2, L * .05); c.quadraticCurveTo(-L * .12, L * (big ? .22 : .17), -L * .02, L * (big ? .2 : .15)); c.quadraticCurveTo(-L * .08, L * .09, -L * .08, L * .06); c.fill();
  c.beginPath(); c.moveTo(L * .14, L * .055); c.lineTo(L * .2, L * .1); c.lineTo(L * .22, L * .05); c.fill();
  // lõpusepilud, silm, ninasõõre, suu
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1, L * .005); for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-L * (.27 - i * .022), -L * .03); c.quadraticCurveTo(-L * (.28 - i * .022), L * .01, -L * (.27 - i * .022), L * .045); c.stroke() }
  c.fillStyle = '#0a0a0a'; c.beginPath(); c.ellipse(-L * .38, -L * .03, L * .014, L * .012, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-L * .384, -L * .034, L * .004, 0, 6.283); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, L * .006); c.beginPath(); c.moveTo(-L * .44, L * .04); c.quadraticCurveTo(-L * .38, L * .06, -L * .33, L * .045); c.stroke();
  if (!big) { c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(-L * .2 + i * L * .05, -L * (.05 + (i % 2) * .015), L * .006, 0, 6.283); c.fill() } }
  c.restore();
}
{
  const baseFishRealE = drawFishReal;
  drawFishReal = function (c, L, look, t, sid) { if (sid === 'ogahai' || sid === 'heeringahai') return drawShark(c, L, t, sid === 'heeringahai'); return baseFishRealE(c, L, look, t, sid) };
}

/* ---------- sündmuse stseen ---------- */
function evHeroDraw(c, w, h, t) {
  const ev = EV.d && EV.d.event, k = ev ? ev.kind : EV.d && EV.d.next ? EV.d.next.kind : 'hai', sY = h * .42;
  if (k === 'hai') {
    let g = c.createLinearGradient(0, 0, 0, sY); g.addColorStop(0, '#3a8ac8'); g.addColorStop(1, '#bfe6f6'); c.fillStyle = g; c.fillRect(0, 0, w, sY);
    c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, w * .8, h * .15, h * .3, '#fff4c0', .6); c.restore();
    g = c.createLinearGradient(0, sY, 0, h); g.addColorStop(0, '#1e6a9a'); g.addColorStop(1, '#06223a'); c.fillStyle = g; c.fillRect(0, sY, w, h - sY);
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const x = w * (i + .3) / 7 + Math.sin(t * .3 + i) * 30; const lg = c.createLinearGradient(x, sY, x + 30, h); lg.addColorStop(0, 'rgba(200,240,255,.14)'); lg.addColorStop(1, 'rgba(200,240,255,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(x - 10, sY); c.lineTo(x + 14, sY); c.lineTo(x + 70, h); c.lineTo(x + 30, h); c.fill() } c.restore();
    // vee all ujuv hai ja kalaparv
    for (let i = 0; i < 18; i++) { const a = t * .5 + i * .35, x = w * .7 + Math.cos(a) * w * .08 + (i % 4) * 6, y = sY + (h - sY) * .55 + Math.sin(a * 1.3) * 18 + (i % 3) * 7; c.fillStyle = 'rgba(200,220,230,.55)'; c.beginPath(); c.ellipse(x, y, 5, 1.8, Math.sin(a), 0, 6.283); c.fill() }
    const sx = ((t * .06) % 1.4 - .2) * w, sy = sY + (h - sY) * .55 + Math.sin(t * .7) * 10;
    c.save(); c.globalAlpha = .85; c.translate(sx, sy); c.scale(-1, 1); drawShark(c, Math.min(w * .32, 260), t, true); c.restore();
    // uim veepinnal tiirutab
    const fx = w * .3 + Math.cos(t * .4) * w * .18, fy = sY + 2, fdir = -Math.sin(t * .4) > 0 ? 1 : -1;
    c.fillStyle = '#2a3846'; c.beginPath(); c.moveTo(fx - 14 * fdir, fy); c.quadraticCurveTo(fx - 2 * fdir, fy - 34, fx + 10 * fdir, fy - 30); c.quadraticCurveTo(fx + 6 * fdir, fy - 14, fx + 14 * fdir, fy); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(fx, fy + 1, 26, 4, 0, 0, 6.283); c.stroke();
  } else {
    let g = c.createLinearGradient(0, 0, 0, sY); g.addColorStop(0, '#070c24'); g.addColorStop(1, '#1e2a50'); c.fillStyle = g; c.fillRect(0, 0, w, sY);
    for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(t + i))})`; c.fillRect((i * 97) % w, (i * 37) % sY, 1.6, 1.6) }
    c.fillStyle = '#f4f0d4'; c.beginPath(); c.arc(w * .78, h * .14, h * .07, 0, 6.283); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, w * .78, h * .14, h * .25, '#d8e0ff', .35); c.restore();
    c.fillStyle = '#0a1410'; c.beginPath(); c.moveTo(0, sY); for (let x = 0; x <= w; x += 12) c.lineTo(x, sY - 16 - Math.abs(Math.sin(x * .03)) * 22); c.lineTo(w, sY); c.fill();
    g = c.createLinearGradient(0, sY, 0, h); g.addColorStop(0, '#132840'); g.addColorStop(1, '#040a12'); c.fillStyle = g; c.fillRect(0, sY, w, h - sY);
    c.strokeStyle = 'rgba(240,240,210,.5)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = sY + 6 + i * 4, x = w * .78 + Math.sin(t * 2 + i) * 4; c.beginPath(); c.moveTo(x - 30 + i * 3, y); c.lineTo(x + 30 - i * 3, y); c.stroke() }
    const L = Math.min(w * .5, 380), x = w * .42 + Math.sin(t * .3) * w * .1, y = sY + (h - sY) * .6;
    c.save(); c.translate(x, y); c.globalAlpha = .9; const s = FD.sp.saga; if (s) drawLook(c, 0, 0, L, Object.assign({}, s.look || {}, { _id: 'saga' }), t, Math.cos(t * .3) > 0 ? 1 : -1); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 20; i++) { const p = (t * .05 + i * .13) % 1; c.fillStyle = `rgba(185,139,255,${Math.sin(p * Math.PI) * .5})`; c.beginPath(); c.arc((i * 131) % w, h - p * (h - sY), 1.5, 0, 6.283); c.fill() } c.restore();
  }
}
// retke kaart: peatused looklevas teekonnas, paat liigub praegusesse peatusesse
function jrMapDraw(c, w, h, t) {
  const j = EV.d && EV.d.journey; if (!j) return;
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d8c89a'); g.addColorStop(1, '#b8a272'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(120,90,50,.08)'; for (let i = 0; i < 80; i++) c.fillRect((i * 97) % w, (i * 53) % h, 2, 2);
  const n = j.legs.length, P = j.legs.map((l, i) => [w * (.08 + .84 * i / Math.max(1, n - 1)), h * (.55 + .22 * Math.sin(i * 1.7))]);
  // vesi peatuste ümber
  P.forEach(([x, y], i) => { const sp = j.legs[i].spot, sea = ['meri', 'saarestik', 'avameri', 'sugavik'].includes(sp); c.fillStyle = sp === 'jaa' ? '#dff0f6' : sea ? '#4a8ab0' : '#5aa0b8'; c.beginPath(); c.ellipse(x, y, w * .055, h * .13, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(40,60,70,.4)'; c.lineWidth = 1.5; c.stroke() });
  // teekond
  c.setLineDash([6, 6]); c.strokeStyle = '#7a4a22'; c.lineWidth = 2.5; c.beginPath(); P.forEach(([x, y], i) => i ? c.quadraticCurveTo((P[i - 1][0] + x) / 2, Math.min(P[i - 1][1], y) - h * .18, x, y) : c.moveTo(x, y)); c.stroke(); c.setLineDash([]);
  P.forEach(([x, y], i) => { const done = i < j.leg || j.finished, cur = i === j.leg && !j.finished; c.fillStyle = done ? '#3a8a4a' : cur ? '#e8a030' : '#8a7a5a'; c.beginPath(); c.arc(x, y, cur ? 13 : 10, 0, 6.283); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.font = '800 12px system-ui'; c.textAlign = 'center'; c.fillText(done ? '✓' : String(i + 1), x, y + 4);
    c.fillStyle = '#3a2a14'; c.font = '700 11px system-ui'; c.fillText(FD.spot[j.legs[i].spot] ? FD.spot[j.legs[i].spot].name : j.legs[i].spot, x, y + h * .19) });
  // lõpu-aardekirst
  const [ex, ey] = P[n - 1]; c.save(); c.translate(ex + w * .045, ey - h * .2); c.fillStyle = '#8a5a22'; c.fillRect(-12, -6, 24, 16); c.fillStyle = '#b8862a'; c.fillRect(-12, -10, 24, 6); c.fillStyle = '#f2d060'; c.fillRect(-2, -4, 4, 6); if (j.finished) { c.globalCompositeOperation = 'lighter'; glowAt(c, 0, 0, 30, '#ffd27a', .7) } c.restore();
  // paat
  const i0 = Math.min(j.leg, n - 1), [bx, by] = P[i0], bob = Math.sin(t * 2) * 2;
  c.save(); c.translate(bx, by - 22 + bob); c.fillStyle = '#6a3a1a'; c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(9, 7); c.lineTo(-9, 7); c.closePath(); c.fill(); c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -18); c.stroke(); c.fillStyle = '#f4f0e0'; c.beginPath(); c.moveTo(1, -17); c.lineTo(12, -4); c.lineTo(1, -4); c.fill(); c.restore();
  c.textAlign = 'left';
}
function evCv(o) { EV.objs.push(o); return `<canvas data-evcv="${EV.objs.length - 1}"></canvas>` }
function evPaint(ts) {
  const cvs = document.querySelectorAll('#fishView canvas[data-evcv]');
  if (!FV.open || !cvs.length) { EV.raf = 0; return }
  cvs.forEach(cv => { const o = EV.objs[+cv.dataset.evcv]; if (!o) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; const d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); o.draw(c, w, h, ts / 1000) });
  EV.raf = requestAnimationFrame(evPaint);
}

/* ---------- vaade ---------- */
function tabSundmused() {
  EV.objs = [];
  if (!EV.d) { evLoad(); duPing(); return '<div class="fv-card"><p class="lead">Laen sündmusi…</p></div>' }
  const d = EV.d, ev = d.event, nx = d.next, k = ev ? ev.kind : nx.kind, I = EV_INFO[k], now = evNow();
  let h = `<div class="ev-hero">${evCv({ draw: evHeroDraw })}<div class="ttl"><h2>${I.ic} ${I.n}</h2>
    ${ev ? `<span class="cd live" data-evcd="${Date.parse(ev.ends)}" data-pre="Käib! Lõpuni ">Käib! Lõpuni ${evLeft(Date.parse(ev.ends) - now)}</span>` : `<span class="cd" data-evcd="${Date.parse(nx.starts)}" data-pre="Algab ">Algab ${evLeft(Date.parse(nx.starts) - now)}</span>`}</div></div>`;
  if (d.prize) { const p = d.prize, P = EV_INFO[p.kind]; h += `<div class="ev-prize"><span class="big">${p.place <= 3 ? ['🥇', '🥈', '🥉'][p.place - 1] : '🎖️'}</span><div><b>${P.n}: sinu koht ${p.place}.</b><br><small>${p.place <= 3 ? `Preemia: kuld, kogemus, esemed ja tiitel „${P.title}“` : 'Preemia: kuld ja kogemus'}</small></div><button class="btn" type="button" data-ev="prize" ${EV.busy ? 'disabled' : ''}>Võta preemia</button></div>` }
  // sündmuse sisu
  const best = evBestSpot(k);
  h += `<div class="ev-grid"><div class="fv-card" style="margin:0"><h2>${ev ? 'Kuidas osaleda' : 'Mis tuleb'}</h2><p class="lead">${ev ? '' : `Järgmine sündmus algab reedel kell 0.00 ja kestab pühapäeva õhtuni. `}Kus: ${I.where}.</p><p class="lead">💡 ${I.tip}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${I.sp.map(id => FD.sp[id] ? `<button class="btn sm ghost" type="button" data-ev="card" data-arg="${id}">${esc(FD.sp[id].name)} – kuni ${fKg(FD.sp[id].max_w)}</button>` : '').join('')}</div>
    ${ev ? (best ? `<button class="btn" type="button" data-ev="go" data-arg="${best}" style="margin-top:10px">Mine püüdma: ${esc(FD.spot[best].name)}</button>` : `<p class="lead" style="color:#ffb3a0">${k === 'hai' ? 'Haide püüdmiseks on vaja vähemalt 18. taset (Mereäär).' : 'Säga püüdmiseks on vaja vähemalt 16. taset.'}</p>`) : ''}</div>`;
  if (ev) {
    h += `<div class="fv-card" style="margin:0"><h2>Eriülesanded</h2><div style="display:grid;gap:6px">${(ev.quests || []).map(q => { const ok = +q.progress >= +q.target;
      return `<div class="ev-q ${ok ? 'ok' : ''}"><div><b>${esc(q.text)}</b><div class="bar ${ok ? 'green' : ''}" style="margin:5px 0"><i style="width:${Math.min(100, q.progress / q.target * 100).toFixed(1)}%"></i></div><small class="num">${q.kg ? fKg(+q.progress) + ' / ' + fKg(+q.target) : fmt(Math.min(+q.progress, +q.target)) + ' / ' + fmt(+q.target)} · ${fmt(q.gold)} kulda, ${q.xp} kogemust</small></div>
        ${q.claimed ? '<span class="pill ok">Võetud</span>' : `<button class="btn sm" type="button" data-ev="q" data-arg="${q.q}" ${ok && !EV.busy ? '' : 'disabled'}>Võta</button>`}</div>` }).join('')}</div></div>`;
    h += `<div class="fv-card" style="margin:0"><h2>Edetabel <small class="lead">suurim kala</small></h2><div class="ev-lb">${(ev.top || []).length ? ev.top.map(r => `<div class="${r.me ? 'me' : ''}"><span class="pl">${r.bot ? '🎣' : r.place <= 3 ? ['🥇', '🥈', '🥉'][r.place - 1] : r.place}</span><span>${r.bot ? r.emoji + ' ' : ''}${esc(r.name)}${r.bot ? ' ' + duBotTag() : ''}<br><small>${esc(FD.sp[r.species] ? FD.sp[r.species].name : r.species)}</small></span><b>${fKg(+r.weight)}</b></div>`).join('') : '<p class="lead">Keegi pole veel ühtegi püüdnud – ole esimene!</p>'}
      ${ev.mine && ev.mine.place > 10 ? `<div class="me"><span class="pl">${ev.mine.place}</span><span>Sina</span><b>${fKg(+ev.mine.weight)}</b></div>` : ''}</div><p class="lead" style="margin-top:8px">Esikolmik saab tiitli „${I.title}“, kulda ja esemeid. Top 10 saab kulda.</p></div>`;
  }
  h += '</div>';
  // kalastusretk
  const j = d.journey;
  if (j) {
    const cur = j.legs[j.leg], ready = !j.finished && cur && j.progress >= cur.n;
    h += `<div class="fv-card"><h2>🗺️ Kalastusretk <small class="lead">uus retk ${evLeft(Date.parse(j.ends) - now)} pärast · läbitud kokku ${j.done_total}</small></h2>
      <div class="jr-map">${evCv({ draw: jrMapDraw })}</div><div class="jr-legs">${j.legs.map((l, i) => { const st = i < j.leg || j.finished ? 'done' : i === j.leg ? 'cur' : '', s = FD.sp[l.species];
        return `<div class="jr-leg ${st}"><span class="n">${st === 'done' ? '✓' : i + 1}</span><div><b>${esc(FD.spot[l.spot] ? FD.spot[l.spot].name : l.spot)}</b>: püüa ${l.n} × ${esc(s ? s.name.toLowerCase() : l.species)}<br><small>${st === 'cur' ? `Tehtud ${j.progress}/${l.n} · ` : ''}Preemia ${l.gold} kulda, ${l.xp} kogemust</small></div>
          ${st === 'cur' ? (ready ? `<button class="btn sm" type="button" data-ev="adv" ${EV.busy ? 'disabled' : ''}>${i === j.legs.length - 1 ? 'Ava aardekirst' : 'Liigu edasi'}</button>` : `<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${l.swapped ? '' : `<button class="btn sm ghost" type="button" data-ev="swap" title="Kui see kala ei taha võtta, vali selle asemel kala, kes praegu hästi võtab (üks kord peatuse kohta)" ${EV.busy ? 'disabled' : ''}>🔄 Vaheta kala</button>`}<button class="btn sm ghost" type="button" data-ev="go" data-arg="${l.spot}">Mine</button></span>`) : ''}</div>` }).join('')}</div>${bwJourneyLine()}
      ${j.finished ? '<p class="lead" style="margin-top:8px">🎉 Retk on läbitud! Uus retk algab esmaspäeval.</p>' : `<p class="lead" style="margin-top:8px">Lõpus ootab aardekirst: 2000 kulda, 600 kogemust ja 2 eset.</p>`}</div>`;
  }
  h += duSection();
  return h;
}

/* ---------- kahevõitlus ---------- */
// Järve kalurid (mängu tegelased) on alati märgitud
function duBotTag() { return '<span class="bot-tag" title="Mängu tegelane – mitte päris inimene">🎣 Järve kalur</span>' }
function duOpp(a) { const n = a.me_a ? a.b_name : a.a_name; return a.bot ? `${a.bot_emoji || ''} ${esc(n)} ${duBotTag()}` : esc(n) }
function duSpots(op) { return FD.spots.filter(p => evSpOk(p.id) && p.min_level <= op.level && (!p.boat || (op.boats || []).includes(p.boat))) }
function duSection() {
  const d = DU.d;
  let h = `<div class="fv-card"><h2>⚔️ Kahevõitlus${d && d.record ? ` <small class="lead">võite ${d.record.won} / ${d.record.played}</small>` : ''}</h2>
    <p class="lead">Kutsu mängus olev kalur kahevõitlusele. Mõlemad püüavad <b>5 minutit samas kohas</b> ja võidab see, kellel on rohkem punkte. <b>Punktid näitavad, kui suur kala oma liigi kohta on</b> (oma liigi suur isend = 100 p), nii et ka väike kala võib palju anda. Võitluses on mõlemal samad kalad – madalama taseme mängija järgi. Võitja saab mõlema panuse, viigi korral saavad mõlemad oma panuse tagasi.</p>`;
  if (!d) return h + '<p class="lead">Otsin mängus olevaid kalureid…</p></div>';
  const a = d.active;
  if (a && a.status === 'invited') {
    h += a.me_a ? `<div class="du-form"><span>⏳ Ootad, kas <b>${duOpp(a)}</b> võtab kutse vastu (${esc(FD.spot[a.spot] ? FD.spot[a.spot].name : a.spot)}, panus ${fmt(a.stake)} kulda)…</span><button class="btn sm ghost" type="button" data-du="no" data-arg="${a.id}">Tühista</button></div>`
      : `<div class="du-form"><span>⚔️ <b>${duOpp(a)}</b> kutsub sind kahevõitlusele: ${esc(FD.spot[a.spot] ? FD.spot[a.spot].name : a.spot)}, panus ${fmt(a.stake)} kulda.</span><button class="btn sm" type="button" data-du="yes" data-arg="${a.id}">Võta vastu</button><button class="btn sm ghost" type="button" data-du="no" data-arg="${a.id}">Keeldu</button></div>`;
  } else if (a && a.status === 'live') h += `<p class="lead">Kahevõitlus käib! Mine püügilehele.</p><button class="btn" type="button" data-ev="go" data-arg="${a.spot}">Püüdma</button>`;
  else {
    const on = d.online || [], bots = d.bots || [];
    h += `<div class="du-list">${on.length ? on.map(p => { const open = DU.pick === p.id, sp = duSpots(p);
      return `<div class="du-p"><span class="dot"></span><span><b>${esc(p.name)}</b> <small class="lead">${p.level}. tase${p.title ? ' · ' + esc(p.title) : ''}</small></span>${p.busy ? '<span class="pill">Võitluses</span>' : `<button class="btn sm ${open ? '' : 'ghost'}" type="button" data-du="pick" data-arg="${p.id}">⚔️ Kutsu</button>`}</div>
        ${open ? `<div class="du-form"><label>Koht <select id="duSpot">${sp.map(s => `<option value="${s.id}" ${s.id === (DU.spot || FV.spot) ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>
          <label>Panus <select id="duStake">${[0, 100, 500, 1000, 2500, 5000].map(v => `<option value="${v}" ${v === DU.stake ? 'selected' : ''} ${v > FS.gold ? 'disabled' : ''}>${v ? fmt(v) + ' kulda' : 'Ilma panuseta'}</option>`).join('')}</select></label>
          <button class="btn sm" type="button" data-du="invite" data-arg="${p.id}" ${DU.busy || !sp.length ? 'disabled' : ''}>Saada kutse</button></div>` : ''}` }).join('') : '<p class="lead">Praegu pole teisi päris mängijaid mängus.</p>'}
      ${bots.length ? `<h3 style="margin:10px 0 2px;font-size:15px">Vee ääres on ka Järve kalurid ${duBotTag()}</h3><p class="lead" style="margin:0 0 4px;font-size:12.5px">Mängu tegelased, kes käivad ja püüavad nagu inimesed – samade reeglite järgi. Nendega saab alati võistelda.</p>` : ''}
      ${bots.map(p => { const key = 'bot:' + p.bot, open = DU.pick === key, sp = FD.spots.filter(x => evSpOk(x.id) && x.min_level <= p.level);
        return `<div class="du-p bot"><span class="dot b"></span><span><b>${p.emoji} ${esc(p.name)}</b> ${duBotTag()} <small class="lead">${p.level}. tase · ${esc(FD.spot[p.spot] ? FD.spot[p.spot].name : p.spot)}</small><small class="d">${esc(p.descr)}</small></span><button class="btn sm ${open ? '' : 'ghost'}" type="button" data-du="pick" data-arg="${key}">⚔️ Kutsu</button></div>
        ${open ? `<div class="du-form"><label>Koht <select id="duSpot">${sp.map(x => `<option value="${x.id}" ${x.id === (sp.some(y => y.id === p.spot) ? p.spot : FV.spot) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
          <label>Panus <select id="duStake">${[0, 100, 500, 1000, 2500, 5000].map(v => `<option value="${v}" ${v === DU.stake ? 'selected' : ''} ${v > FS.gold ? 'disabled' : ''}>${v ? fmt(v) + ' kulda' : 'Ilma panuseta'}</option>`).join('')}</select></label>
          <button class="btn sm" type="button" data-du="invite" data-arg="${key}" ${DU.busy || !sp.length ? 'disabled' : ''}>Saada kutse</button></div>` : ''}` }).join('')}</div>`;
  }
  return h + '</div>';
}
function duHud() {
  const a = DU.d && DU.d.active; if (!a || a.status !== 'live') return '';
  const now = evNow(), st = Date.parse(a.start_at), en = Date.parse(a.end_at), sum = l => (l || []).reduce((t, x) => t + +(x.pts || 0), 0), kg = l => (l || []).reduce((t, x) => t + +x.weight, 0);
  const myL = a.me_a ? a.a_catch : a.b_catch, opL = a.me_a ? a.b_catch : a.a_catch, me = sum(myL), op = sum(opL), mx = Math.max(me, op, .001), opn = a.me_a ? a.b_name : a.a_name, off = FV.spot !== a.spot;
  const nMe = (a.me_a ? a.a_catch : a.b_catch).length, nOp = (a.me_a ? a.b_catch : a.a_catch).length, pre = now < st;
  return `${off ? `<div class="du-off">⚠ Oled vales kohas! Kahevõitluses lähevad arvesse ainult kalad kohast <b>${esc(FD.spot[a.spot] ? FD.spot[a.spot].name : a.spot)}</b>. <button class="btn sm" type="button" data-ev="go" data-arg="${a.spot}">Mine sinna</button></div>` : ''}<div class="du-hud" role="status"><div class="side"><b>Sina</b><span class="kg">${me} p</span><div class="bar"><i style="width:${(me / mx * 100).toFixed(0)}%"></i></div><small>${nMe} kala · ${fKg(kg(myL))}</small></div>
    <div class="mid"><span class="vs">⚔️ ${esc(FD.spot[a.spot] ? FD.spot[a.spot].name : a.spot)}${a.stake ? ' · ' + fmt(a.stake * 2) + ' 🪙' : ''}</span><span class="clock" data-ducd="${pre ? st : en}">${pre ? 'Algab ' + Math.ceil((st - now) / 1000) : evLeft(en - now)}</span>${FV.spot !== a.spot ? `<button class="btn sm" type="button" data-ev="go" data-arg="${a.spot}">Mine kohta</button>` : ''}</div>
    <div class="side r"><b>${a.bot ? (a.bot_emoji || '') + ' ' + esc(opn) + ' 🎣' : esc(opn)}</b><span class="kg">${op} p</span><div class="bar"><i style="width:${(op / mx * 100).toFixed(0)}%"></i></div><small>${nOp} kala · ${fKg(kg(opL))}</small></div></div>`;
}
async function duPing() {
  if (!CL.user || document.visibilityState === 'hidden') return;
  let d; try { d = await rpc('duel_ping') } catch (e) { return }
  const prev = DU.d; DU.d = d; if (d.now) EV.skew = Date.parse(d.now) - Date.now();
  const a = d.active;
  // uus kutse mulle
  if (a && a.status === 'invited' && !a.me_a && DU.seenInvite !== a.id) { DU.seenInvite = a.id; duInvitePopup(a) }
  // võitlus algas
  if (a && a.status === 'live' && DU.liveId !== a.id) { DU.liveId = a.id; if (UI.modalView) closeModal(); if (FV.open) { FV.tab = 'puuk'; if (evSpOk(a.spot)) { FV.spot = a.spot; FV.oddsKey = '' } } toast(`Kahevõitlus algab! ${FD.spot[a.spot] ? FD.spot[a.spot].name : ''} – 5 minutit.`, 'gold', 'fish'); if (typeof sfx === 'function') sfx('levelup') }
  // võitlus lõppes
  if (d.finished && DU.seenDone !== d.finished.id && (DU.liveId === d.finished.id || (prev && prev.active && prev.active.id === d.finished.id))) { DU.seenDone = d.finished.id; duResult(d.finished); refreshFS() }
  DU.fast = !!(a && a.status === 'live') || !!(a && a.status === 'invited');
  if (FV.open) {
    const live = !!(a && a.status === 'live'), hud = document.querySelector('#fishView .du-hud');
    // võitluse ajal hoia mängijat õiges kohas (kui ta parasjagu ei püüa)
    if (live && FV.spot !== a.spot && FV.phase === 'idle' && evSpOk(a.spot) && Date.now() - (DU.moved || 0) > 20000) { DU.moved = Date.now(); FV.spot = a.spot; FV.oddsKey = ''; FV.tab = 'puuk'; toast(`Kahevõitlus käib kohas ${FD.spot[a.spot] ? FD.spot[a.spot].name : a.spot} – viisin su sinna.`, 'info', 'fish'); renderFV(true); try { loadOdds() } catch (e) { } return }
    const off = document.querySelector('#fishView .du-off');
    if (FV.tab === 'puuk') { if (live && hud && !!off === (FV.spot !== a.spot)) hud.outerHTML = duHud().replace(/^[\s\S]*?(<div class="du-hud")/, '$1'); else if (live || hud) renderFV(true) }
    else if (FV.tab === 'sundmused' && !document.querySelector('#fishView #duSpot')) renderFV(true);
  }
}
function duInvitePopup(a) {
  if (!FV.open) return;
  showModal(() => `<div style="display:grid;gap:10px;text-align:center"><div style="font-size:54px">⚔️</div><h2 style="margin:0">Kahevõitluse kutse!</h2>
    <p class="lead"><b>${duOpp(a)}</b> kutsub sind kahevõitlusele.<br>Koht: <b>${esc(FD.spot[a.spot] ? FD.spot[a.spot].name : a.spot)}</b> · Panus: <b>${a.stake ? fmt(a.stake) + ' kulda' : 'ilma panuseta'}</b><br>5 minutit, rohkem punkte võidab (punktid = kui suur kala oma liigi kohta on).</p>
    <div class="mbtns" style="justify-content:center"><button class="btn ghost" type="button" data-du="no" data-arg="${a.id}">Keeldu</button><button class="btn" type="button" data-du="yes" data-arg="${a.id}">Võta vastu</button></div></div>`);
  if (typeof sfx === 'function') sfx('chime');
}
function duResult(f) {
  const sum = l => (l || []).reduce((t, x) => t + +(x.pts || 0), 0), kg = l => (l || []).reduce((t, x) => t + +x.weight, 0), me = f.me_a ? f.a_catch : f.b_catch, op = f.me_a ? f.b_catch : f.a_catch, opn = f.me_a ? f.b_name : f.a_name;
  const win = f.winner === 'me', tie = !f.winner;
  const list = l => l.length ? l.map(x => `<span>${esc(FD.sp[x.species] ? FD.sp[x.species].name : x.species)} · ${fKg(+x.weight)} · <b>${x.pts || 0} p</b></span>`).join('') : '<span class="lead">Ei ühtegi kala</span>';
  showModal(() => `<div class="du-res" style="display:grid;gap:10px"><div style="text-align:center;font-size:56px">${win ? '🏆' : tie ? '🤝' : '🎣'}</div><h2>${win ? 'Võitsid!' : tie ? 'Viik!' : `${f.bot ? (f.bot_emoji || '') + ' ' : ''}${esc(opn)} võitis`}</h2>${f.bot ? `<p style="text-align:center;margin:0">${duBotTag()}</p>` : ''}
    <p class="lead" style="text-align:center">Sina <b>${sum(me)} p</b> (${fKg(kg(me))}) · ${esc(opn)} <b>${sum(op)} p</b> (${fKg(kg(op))})${f.stake ? (win ? ` · +${fmt(f.stake * 2)} kulda` : tie ? ' · panused tagasi' : '') : ''}</p>
    <canvas class="du-cv"></canvas><div class="cols"><div><b>Sina</b>${list(me)}</div><div><b>${esc(opn)}</b>${list(op)}</div></div>
    <div class="mbtns"><button class="btn" type="button" data-act="closeModal">Sulge</button></div></div>`);
  if (win && typeof sfx === 'function') sfx('levelup');
  const st = Date.parse(f.start_at), en = Date.parse(f.end_at), t0 = performance.now();
  const loop = ts => { const cv = document.querySelector('#modalCard canvas.du-cv'); if (!cv) return; const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
    const k = Math.min(1, (ts - t0) / 1600), mx = Math.max(sum(me), sum(op), .1), X = tt => 10 + (w - 20) * (tt - st) / (en - st), Y = v => h - 14 - (h - 28) * v / mx;
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let i = 0; i <= 5; i++) { c.beginPath(); c.moveTo(X(st + (en - st) * i / 5), 8); c.lineTo(X(st + (en - st) * i / 5), h - 14); c.stroke() }
    [[me, '#7ac8ff'], [op, '#ff8a7a']].forEach(([l, col]) => { let acc = 0; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(X(st), Y(0)); l.forEach(x => { const tt = Date.parse(x.at); if (tt > st + (en - st) * k) return; c.lineTo(X(tt), Y(acc)); acc += +(x.pts || 0); c.lineTo(X(tt), Y(acc)) }); c.lineTo(X(st + (en - st) * k), Y(acc)); c.stroke() });
    c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '11px system-ui'; c.fillText('0:00', 8, h - 2); c.fillText('5:00', w - 34, h - 2);
    if (k < 1) requestAnimationFrame(loop) };
  requestAnimationFrame(loop);
}

/* ---------- tegevused ---------- */
async function evAct(a, el) {
  const arg = el.dataset.arg;
  if (a === 'go') { if (UI.modalView) closeModal(); FV.tab = 'puuk'; if (evSpOk(arg)) { FV.spot = arg; FV.oddsKey = ''; FV.result = null; FV.phase = 'idle' } else toast('Sinna sa veel ei pääse', 'bad'); renderFV(true); try { await loadOdds() } catch (e) { } renderFV(true); return }
  if (a === 'card') { if (typeof fishCard === 'function') fishCard(arg); return }
  if (EV.busy) return;
  const fn = { q: 'event_quest_claim', prize: 'event_prize_claim', adv: 'journey_advance', swap: 'journey_swap' }[a]; if (!fn) return;
  EV.busy = true; renderFV(true);
  try {
    const r = await rpc(fn, a === 'q' ? { p_q: +arg } : {}); const { claimed, won, advanced, swapped, lvlup, ach, ...st } = r; EV.d = st;
    if (swapped) { const a1 = FD.sp[swapped.from], a2 = FD.sp[swapped.to]; toast(`Peatuse kala vahetatud: ${a1 ? a1.name.toLowerCase() : swapped.from} → ${a2 ? a2.name.toLowerCase() : swapped.to}. See võtab praegu hästi!`, 'good', 'fish') }
    if (claimed) { toast(`${claimed.text}: +${fmt(claimed.gold)} kulda`, 'gold', 'gold'); if (typeof sfx === 'function') sfx('coin') }
    if (won) { toast(`${won.place}. koht! +${fmt(won.gold)} kulda${won.title ? ` ja tiitel „${won.title}“` : ''}${itemsTxt(won.items)}`, 'gold', 'fame'); if (typeof sfx === 'function') sfx('levelup') }
    if (advanced) { toast(advanced.finished ? `Retk läbitud! +${fmt(advanced.gold)} kulda${itemsTxt(advanced.items)}` : `Järgmine peatus! +${fmt(advanced.gold)} kulda`, 'gold', 'gold'); if (typeof sfx === 'function') sfx(advanced.finished ? 'levelup' : 'chime') }
    await refreshFS();
    if (lvlup && lvlup.length && typeof afterLevels === 'function') afterLevels(lvlup);
    if (ach && ach.length && typeof afterAch === 'function') afterAch(ach);
  } catch (e) { toast(e.message, 'bad') }
  EV.busy = false; renderFV(true);
}
async function duAct(a, el) {
  const arg = el.dataset.arg;
  if (a === 'pick') { DU.pick = DU.pick === arg ? null : arg; return renderFV(true) }
  if (DU.busy) return; DU.busy = true;
  try {
    let r;
    if (a === 'invite') { const sp = (document.getElementById('duSpot') || {}).value, stake = +((document.getElementById('duStake') || {}).value || 0); DU.spot = sp; DU.stake = stake; r = arg.startsWith('bot:') ? await rpc('duel_invite_bot', { p_bot: arg.slice(4), p_spot: sp, p_stake: stake }) : await rpc('duel_invite', { p_target: arg, p_spot: sp, p_stake: stake }); DU.pick = null; toast('Kutse saadetud! Ootan vastust (kuni 2 minutit).', 'info', 'fish') }
    if (a === 'yes' || a === 'no') { r = await rpc('duel_answer', { p_id: +arg, p_accept: a === 'yes' }); if (UI.modalView) closeModal(); if (a === 'no') toast('Kutse tühistatud', 'info') }
    if (r) { DU.d = r; await refreshFS() }
  } catch (e) { toast(e.message, 'bad') }
  DU.busy = false; renderFV(true); duPing();
}
document.addEventListener('click', e => { const el = e.target.closest('[data-ev]'); if (el && !el.disabled) return evAct(el.dataset.ev, el); const d2 = e.target.closest('[data-du]'); if (d2 && !d2.disabled) duAct(d2.dataset.du, d2) });
document.addEventListener('change', e => { if (e.target.id === 'duSpot') DU.spot = e.target.value; if (e.target.id === 'duStake') DU.stake = +e.target.value });

/* ---------- kellad ja ühendus ---------- */
setInterval(() => {
  // loendurid
  if (FV.open) { const now = evNow(); document.querySelectorAll('[data-evcd]').forEach(n => { n.textContent = n.dataset.pre + evLeft(+n.dataset.evcd - now) });
    document.querySelectorAll('[data-ducd]').forEach(n => { const v = +n.dataset.ducd - now, a = DU.d && DU.d.active; n.textContent = a && now < Date.parse(a.start_at) ? 'Algab ' + Math.max(0, Math.ceil(v / 1000)) : evLeft(v) }) }
}, 1000);
(function duLoop() { const go = CL.user && FV.open; if (go) duPing(); setTimeout(duLoop, DU.fast ? 2500 : 9000) })();
{
  FTAB_FN.sundmused = tabSundmused;
  const baseRenderE = renderFV;
  renderFV = function (force) { baseRenderE(force); if (FV.open && FV.tab === 'sundmused' && !EV.raf) EV.raf = requestAnimationFrame(evPaint) };
  const baseTabPuukE = tabPuuk;
  tabPuuk = function () { return duHud() + baseTabPuukE() };
  const baseNewsE = newsText;
  newsText = function (n) {
    const who = `<b>${esc(n.name)}</b>`, d = n.data || {};
    if (n.kind === 'event_win') return `${who} võitis sündmuse „${(EV_INFO[d.kind] || { n: '' }).n}“! ${(EV_INFO[d.kind] || { ic: '' }).ic}`;
    if (n.kind === 'retk') return `${who} läbis selle nädala kalastusretke ja avas aardekirstu! 🗺️`;
    if (n.kind === 'duel') return `${who} võitis kahevõitluses ${d.bot ? 'Järve kalurit' : 'mängijat'} ${esc(d.vs || '')}${d.stake ? ` (${fmt(d.stake * 2)} kulda)` : ''}! ⚔️`;
    if (n.kind === 'bot_level') return `${n.bot_emoji || ''} <b>${esc(n.name)}</b> ${duBotTag()} tõusis kalapüügis <b>${d.level}. tasemele</b>!`;
    if (n.kind === 'bot_catch') { const sp = FD.sp[d.species]; return `${n.bot_emoji || ''} <b>${esc(n.name)}</b> ${duBotTag()} püüdis kohas ${esc(FD.spot[d.spot] ? FD.spot[d.spot].name : d.spot || '')}: ${esc(sp ? sp.name.toLowerCase() : d.species || '')} ${fKg(+d.weight)}!` }
    return baseNewsE(n);
  };
  Object.assign(NEWS_IC, { event_win: '🏆', retk: '🗺️', duel: '⚔️', bot_catch: '🎣', bot_level: '⭐' });
  const baseBadgesE = fvBadges;
  fvBadges = function () { const b = baseBadgesE(); const d = EV.d; let n = 0;
    if (d) { if (d.prize) n++; if (d.event) n += (d.event.quests || []).filter(q => !q.claimed && +q.progress >= +q.target).length; const j = d.journey; if (j && !j.finished && j.legs[j.leg] && j.progress >= j.legs[j.leg].n) n++ }
    if (DU.d && DU.d.active && DU.d.active.status === 'invited' && !DU.d.active.me_a) n++;
    if (n) b.sundmused = n; return b };
  if (typeof remTodo === 'function') {
    const baseTodoE = remTodo;
    remTodo = function () { const r = baseTodoE(); const d = EV.d; if (!d) return r;
      if (d.event) { const I = EV_INFO[d.event.kind], open = (d.event.quests || []).filter(q => !q.claimed).length; r.T.unshift({ c: I.col, t: `${I.ic} ${I.n} käib!`, s: open ? `${open} eriülesannet ootab` : 'Püüa edetabelisse', tab: 'sundmused', b: 'Vaata' }) }
      const j = d.journey; if (j && !j.finished) { const cur = j.legs[j.leg]; r.total++; r.T.push({ c: '#d8a85a', claim: j.progress >= cur.n, t: 'Kalastusretk', s: j.progress >= cur.n ? 'Peatus tehtud – liigu edasi!' : `${FD.spot[cur.spot] ? FD.spot[cur.spot].name : cur.spot}: ${j.progress}/${cur.n} × ${FD.sp[cur.species] ? FD.sp[cur.species].name.toLowerCase() : ''}`, tab: 'sundmused', b: 'Ava', p: j.leg / j.legs.length }) }
      return r };
  }
  const baseRefreshE = refreshFS;
  refreshFS = async function () { const r = await baseRefreshE(); if (CL.user && !EV.loading && Date.now() - (EV.at || 0) > 20000) { EV.at = Date.now(); evLoad() } return r };
}
document.addEventListener('click', e => { const t = e.target.closest('[data-fa="tab"][data-arg="sundmused"]'); if (t) { evLoad(); duPing() } });
