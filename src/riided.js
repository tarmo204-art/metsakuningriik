/* =====================================================================
   Kaluri riietus ilma järgi. Mäng soovitab ilmale sobivat riietust, aga sundida ei sunni:
   riietu ise, ühe nupuga („Riietu ilma järgi“) või lase mängul riided ise vahetada (auto_dress).
   Õigesti riides: +10% kogemust, kala võtab 10% kiiremini, pääseb 20% harvemini (server fx_fit, fish_cast/fish_land).
   Eriomadused: prillid (päike/pilves) näitavad kala varju, vest laiendab rohelist ala, kindad – parem haare,
   kahlajad – Suurel jõel rohkem jõekalu. Server: schema.sql 2p ja 6o.
   ===================================================================== */
const RD = { d: null, loading: false, key: '', conf: null, busy: false, objs: [], raf: 0, peek: null, castAt: 0, sel: null };
const RD_SLOT = [['pea', 'Müts', '🧢'], ['silmad', 'Prillid', '🕶️'], ['keha', 'Jope', '🧥'], ['vest', 'Vest', '🦺'], ['pyksid', 'Püksid', '👖'], ['jalad', 'Jalanõud', '🥾'], ['kaed', 'Kindad', '🧤']];
const RD_TAG = { sun: ['☀️', 'päikese vastu'], rain: ['🌧️', 'vihmakindel'], wind: ['🌬️', 'tuulekindel'], cold: ['❄️', 'soe'], grip: ['✋', 'kindel haare'], wade: ['🌊', 'kahlamine'], polar: ['🐟', 'näed kalade varje'], pockets: ['👜', 'taskud'] };
const RD_COND = { paike: ['☀️', 'Päike'], pilves: ['☁️', 'Pilves'], vihm: ['🌧️', 'Vihm'], udu: ['🌫️', 'Udu'], torm: ['⛈️', 'Torm'], kylm: ['❄️', 'Külm'] };
FTABS.riided = '👕 Riided';

document.head.insertAdjacentHTML('beforeend', `<style>
.rd-top{display:grid;grid-template-columns:minmax(260px,340px) minmax(0,1fr);gap:12px}
.rd-av{position:relative;border-radius:20px;overflow:hidden;border:1px solid rgba(140,210,230,.25);box-shadow:0 18px 50px rgba(0,0,0,.4)}
.rd-av canvas{display:block;width:100%;height:440px}
.rd-av .tag{position:absolute;left:12px;bottom:12px;padding:4px 10px;border-radius:999px;font-weight:800;font-size:13px;background:rgba(0,0,0,.5);color:#fff;backdrop-filter:blur(3px)}
.rd-wx{display:grid;gap:10px;align-content:start}
.rd-conds{display:flex;gap:6px;flex-wrap:wrap}
.rd-conds span{padding:6px 12px;border-radius:999px;font-weight:800;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.rd-meter{height:14px;border-radius:8px;background:rgba(255,255,255,.08);overflow:hidden}.rd-meter i{display:block;height:100%;border-radius:8px;transition:width .5s}
.rd-req{display:grid;gap:6px}
.rd-req div{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.07)}
.rd-req div.ok{border-color:rgba(127,209,106,.45)}.rd-req div.no{border-color:rgba(255,170,90,.45)}
.rd-req small{display:block;opacity:.8}
.rd-eff{margin:0;padding:10px 12px;border-radius:12px;font-size:13.5px;line-height:1.45;background:rgba(127,209,106,.1);border:1px solid rgba(127,209,106,.3)}
.rd-eff.idle{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12)}
.rd-sw{display:flex;gap:10px;align-items:center;cursor:pointer;font-weight:700;font-size:14px}
.rd-sw input{appearance:none;width:44px;height:24px;border-radius:12px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;transition:background .2s;flex:none}
.rd-sw input::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s}
.rd-sw input:checked{background:#5cbf6a}.rd-sw input:checked::after{left:23px}
.rd-sw input:focus-visible{outline:2px solid #ffd27a;outline-offset:2px}
.rd-slots{display:grid;gap:10px}
.rd-slot h3{margin:0 0 6px;font-size:15px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.rd-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.rd-it{position:relative;display:grid;gap:5px;padding:10px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.08)}
.rd-it.on{border-color:rgba(127,209,106,.7);background:radial-gradient(120% 120% at 0% 0%,rgba(127,209,106,.14),rgba(0,0,0,.22))}
.rd-it.rec{box-shadow:0 0 0 1px rgba(255,210,122,.6),0 0 18px rgba(255,200,90,.2)}
.rd-it.locked{opacity:.55}
.rd-it canvas{width:100%;height:92px;border-radius:10px;background:linear-gradient(180deg,#24566a,#122e3a)}
.rd-it b{font-size:14px}.rd-it small{font-size:12px;opacity:.85;line-height:1.35}
.rd-it .rec-b{position:absolute;top:6px;right:6px;padding:1px 8px;border-radius:999px;font:800 11px system-ui;background:#ffd27a;color:#2a1a05}
.rd-tags{display:flex;gap:4px;flex-wrap:wrap}.rd-tags span{padding:1px 7px;border-radius:999px;font-size:11.5px;font-weight:700;background:rgba(255,255,255,.08)}
.rd-cols{display:flex;gap:6px}.rd-cols button{width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.25);cursor:pointer;padding:0}
.rd-cols button.on{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.35)}
.rd-ban{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;margin-bottom:10px;
  background:linear-gradient(110deg,rgba(255,200,90,.14),rgba(20,50,60,.6));border:1px solid rgba(255,210,122,.4)}
.rd-ban.good{background:linear-gradient(110deg,rgba(127,209,106,.14),rgba(20,50,60,.6));border-color:rgba(127,209,106,.4)}
.rd-ban .ic{font-size:28px}.rd-ban b{display:block}.rd-ban small{opacity:.85}
.rd-ban .acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
@media (max-width:720px){.rd-top{grid-template-columns:1fr}.rd-av canvas{height:360px}.rd-ban{grid-template-columns:auto minmax(0,1fr)}.rd-ban .acts{grid-column:1/-1}}
</style>`);

/* ---------- andmed ---------- */
function rdKey() { return FS ? [FS.weather, FS.is_night, FS.is_winter, FV.spot].join('|') : '' }
async function rdLoad(force) {
  if (!CL.user || (RD.loading && !force)) return; RD.loading = true; RD.key = rdKey();
  try { RD.d = await rpc('wear_state', { p_spot: FV.spot || 'metsajarv' }) } catch (e) { }
  RD.loading = false; if (FV.open && ['riided', 'puuk'].includes(FV.tab)) renderFV(true);
}
function rdItem(id) { return RD.d ? (RD.d.items || []).find(x => x.id === id) : null }
function rdWorn(slot) { const id = RD.d && RD.d.outfit ? RD.d.outfit[slot] : null, it = id && rdItem(id); return it && it.own ? it : null }
function rdLook() { const o = {}; RD_SLOT.forEach(([s]) => { const it = rdWorn(s); if (it) o[s] = { id: it.id, col: it.color } }); return o }
// soovitus: iga nõutud koha jaoks parim ese (omatud eelistatud), mille sildid sobivad
function rdRec(slot) {
  const f = RD.d && RD.d.fit, need = f && f.req && f.req[slot]; if (!need) return null;
  const fit = (RD.d.items || []).filter(i => i.slot === slot && i.tags.some(t => need.includes(t)));
  return fit.sort((a, b) => (b.own - a.own) || (b.tags.filter(t => need.includes(t)).length - a.tags.filter(t => need.includes(t)).length) || (a.price - b.price))[0] || null;
}

/* ---------- joonistused ---------- */
// kalamehe kuju (eestvaade), jalad maas y=h*.93
function drawAngler(c, w, h, look, t, fx) {
  const H = h * .84, cx = w * .48, top = h * .93 - H, sk = '#e8b896', br = Math.sin(t * 1.6) * .006, shiver = fx && fx.tier === 'halb' ? Math.sin(t * 40) * 1.2 : 0;
  const Y = k => top + H * k, X = k => cx + H * k + shiver, L = look || {};
  const col = (s, d) => (L[s] && L[s].col) || d;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(cx, Y(1) + 4, H * .22, H * .035, 0, 0, 6.283); c.fill();
  // õng paremas käes
  c.strokeStyle = '#3a2a1a'; c.lineWidth = H * .016; c.beginPath(); c.moveTo(X(.18), Y(.62)); c.lineTo(X(.5), Y(-.02) + Math.sin(t) * 3); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(X(.5), Y(-.02) + Math.sin(t) * 3); c.quadraticCurveTo(X(.56), Y(.4), X(.54), Y(.85)); c.stroke();
  const shade = (x0, y0, x1, y1, base) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, mixC(base, '#ffffff', .18)); g.addColorStop(.55, base); g.addColorStop(1, mixC(base, '#000000', .35)); return g };
  const jalad = L.jalad && L.jalad.id, pyk = L.pyksid && L.pyksid.id, keha = L.keha && L.keha.id;
  // jalad (püksid)
  const pc = col('pyksid', '#3a4a6a');
  [-1, 1].forEach(s => { c.fillStyle = shade(X(s * .09 - .05), 0, X(s * .09 + .05), 0, pc); c.beginPath(); c.moveTo(X(s * .02), Y(.54)); c.lineTo(X(s * .13), Y(.54)); c.lineTo(X(s * .12), Y(.95)); c.lineTo(X(s * .04), Y(.95)); c.closePath(); c.fill() });
  if (pyk === 'talvepyksid') { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let k = .6; k < .95; k += .06) { c.beginPath(); c.moveTo(X(-.13), Y(k)); c.lineTo(X(-.03), Y(k)); c.moveTo(X(.03), Y(k)); c.lineTo(X(.13), Y(k)); c.stroke() } }
  // jalanõud
  if (jalad === 'kahlajad') {
    const wc = col('jalad', '#4a5a3a'); c.fillStyle = shade(X(-.17), 0, X(.17), 0, wc);
    c.beginPath(); c.moveTo(X(-.15), Y(.34)); c.lineTo(X(.15), Y(.34)); c.lineTo(X(.15), Y(.56)); c.lineTo(X(.13), Y(.97)); c.lineTo(X(.03), Y(.97)); c.lineTo(X(.02), Y(.6)); c.lineTo(X(-.02), Y(.6)); c.lineTo(X(-.03), Y(.97)); c.lineTo(X(-.13), Y(.97)); c.lineTo(X(-.15), Y(.56)); c.closePath(); c.fill();
    c.fillStyle = mixC(wc, '#000000', .45); [-1, 1].forEach(s => c.fillRect(X(s * .085 - .05), Y(.93), H * .1, H * .05));
  } else {
    const bh = jalad === 'kummikud' ? .72 : jalad === 'talvesaapad' ? .82 : .9, bc = jalad ? col('jalad', '#2f6a3a') : '#6a6a6a';
    [-1, 1].forEach(s => { c.fillStyle = shade(X(s * .085 - .055), 0, X(s * .085 + .055), 0, bc); c.beginPath(); c.moveTo(X(s * .085 - .052), Y(bh)); c.lineTo(X(s * .085 + .052), Y(bh)); c.lineTo(X(s * .085 + .055), Y(.97)); c.quadraticCurveTo(X(s * .085 + s * .09), Y(.985), X(s * .085 + s * .085), Y(.995)); c.lineTo(X(s * .085 - .055), Y(.995)); c.closePath(); c.fill();
      if (jalad === 'kummikud') { c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(X(s * .085 - .035), Y(bh + .02), H * .012, H * .18) }
      if (jalad === 'talvesaapad') { c.fillStyle = '#e8dcc8'; c.beginPath(); c.ellipse(X(s * .085), Y(bh), H * .062, H * .025, 0, 0, 6.283); c.fill() } });
  }
  // keha: särk
  c.save(); c.translate(cx, Y(.42)); c.scale(1, 1 + br); c.translate(-cx, -Y(.42));
  const shirt = '#c8d0d8', jc = keha ? col('keha', '#f2c02a') : shirt;
  c.fillStyle = shade(X(-.17), 0, X(.17), 0, jc);
  c.beginPath(); c.moveTo(X(-.16), Y(.29)); c.quadraticCurveTo(X(0), Y(.26), X(.16), Y(.29)); c.lineTo(X(keha ? .17 : .14), Y(keha ? .6 : .56)); c.lineTo(X(keha ? -.17 : -.14), Y(keha ? .6 : .56)); c.closePath(); c.fill();
  if (keha) {
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(0), Y(.29)); c.lineTo(X(0), Y(.6)); c.stroke();
    if (keha === 'tormijope') { c.strokeStyle = mixC(jc, '#000000', .3); c.lineWidth = 2; c.beginPath(); c.moveTo(X(-.16), Y(.4)); c.lineTo(X(.16), Y(.4)); c.stroke(); c.fillStyle = mixC(jc, '#ffffff', .25); c.fillRect(X(-.13), Y(.44), H * .07, H * .015) }
    else { c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(X(-.08), Y(.38), H * .025, H * .08, -.2, 0, 6.283); c.fill() }
    if (fx && fx.wet) { c.fillStyle = 'rgba(220,240,255,.7)'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(X(-.12 + (i * .037) % .24), Y(.33 + (i * .07) % .24), 1.4, 0, 6.283); c.fill() } }
  }
  // vest
  if (L.vest) { const vc = col('vest', '#5a6a3a'); c.fillStyle = shade(X(-.15), 0, X(.15), 0, vc); c.beginPath(); c.moveTo(X(-.15), Y(.3)); c.lineTo(X(-.05), Y(.3)); c.lineTo(X(-.02), Y(.55)); c.lineTo(X(-.15), Y(.55)); c.closePath(); c.moveTo(X(.15), Y(.3)); c.lineTo(X(.05), Y(.3)); c.lineTo(X(.02), Y(.55)); c.lineTo(X(.15), Y(.55)); c.closePath(); c.fill();
    c.fillStyle = mixC(vc, '#000000', .25); [[-.13, .36], [-.13, .45], [.07, .36], [.07, .45]].forEach(([a, b]) => { c.fillRect(X(a), Y(b), H * .06, H * .06); c.fillStyle = mixC(vc, '#ffffff', .15); c.fillRect(X(a), Y(b), H * .06, H * .012); c.fillStyle = mixC(vc, '#000000', .25) }) }
  // traksid
  if (pyk === 'vpyksid' && jalad !== 'kahlajad') { c.strokeStyle = pc; c.lineWidth = H * .02; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(X(s * .07), Y(.54)); c.lineTo(X(s * .09), Y(.3)); c.stroke() }) }
  if (jalad === 'kahlajad') { c.strokeStyle = mixC(col('jalad', '#4a5a3a'), '#000000', .3); c.lineWidth = H * .016; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(X(s * .1), Y(.35)); c.lineTo(X(s * .1), Y(.29)); c.stroke() }) }
  c.restore();
  // käed
  const slv = keha ? jc : sk, hand = L.kaed ? col('kaed', '#3a3a3a') : sk;
  c.strokeStyle = shade(0, 0, 0, 0, slv); c.strokeStyle = slv; c.lineWidth = H * .055;
  c.beginPath(); c.moveTo(X(-.15), Y(.31)); c.quadraticCurveTo(X(-.21), Y(.43), X(-.19), Y(.55)); c.stroke();
  c.beginPath(); c.moveTo(X(.15), Y(.31)); c.quadraticCurveTo(X(.22), Y(.42), X(.18), Y(.56)); c.stroke();
  if (!keha) { c.strokeStyle = shirt; c.beginPath(); c.moveTo(X(-.15), Y(.31)); c.lineTo(X(-.18), Y(.38)); c.moveTo(X(.15), Y(.31)); c.lineTo(X(.19), Y(.38)); c.stroke() }
  c.fillStyle = hand; [[-.19, .57], [.18, .58]].forEach(([a, b]) => { c.beginPath(); c.ellipse(X(a), Y(b), H * .032, H * .036, 0, 0, 6.283); c.fill() });
  // kael ja pea
  c.fillStyle = sk; c.fillRect(X(-.03), Y(.23), H * .06, H * .06);
  if (keha === 'vihmajope') { c.fillStyle = mixC(jc, '#000000', .15); c.beginPath(); c.ellipse(X(0), Y(.27), H * .11, H * .05, 0, 0, 6.283); c.fill() }
  if (keha === 'tormijope') { c.fillStyle = mixC(jc, '#000000', .2); c.fillRect(X(-.06), Y(.24), H * .12, H * .06) }
  const hy = Y(.16), hr = H * .075;
  c.fillStyle = shade(X(-.08), hy, X(.08), hy, sk); c.beginPath(); c.ellipse(X(0), hy, hr * .9, hr, 0, 0, 6.283); c.fill();
  c.fillStyle = 'rgba(80,50,30,.35)'; c.beginPath(); c.ellipse(X(0), hy + hr * .55, hr * .75, hr * .45, 0, 0, Math.PI); c.fill();
  c.fillStyle = '#5a3a22'; c.beginPath(); c.ellipse(X(0), hy - hr * .55, hr * .9, hr * .5, 0, Math.PI, 0); c.fill();
  // nägu
  const happy = !fx || fx.tier !== 'halb';
  if (!L.silmad) { c.fillStyle = '#222'; [-1, 1].forEach(s => { c.beginPath(); c.arc(X(s * .028), hy - hr * .05, H * .007, 0, 6.283); c.fill() }) }
  c.strokeStyle = '#7a3a2a'; c.lineWidth = 1.6; c.beginPath(); if (happy) c.arc(X(0), hy + hr * .25, hr * .3, .2, Math.PI - .2); else c.arc(X(0), hy + hr * .6, hr * .3, Math.PI + .3, -.3); c.stroke();
  if (fx && fx.tier === 'halb') { c.fillStyle = 'rgba(120,170,255,.35)'; c.beginPath(); c.arc(X(.045), hy + hr * .05, H * .012, 0, 6.283); c.fill() }
  if (L.silmad) { const gc = col('silmad', '#1a1a1a'); c.fillStyle = '#111'; c.fillRect(X(-.055), hy - hr * .18, H * .11, H * .008); [-1, 1].forEach(s => { const g = c.createLinearGradient(X(s * .03 - .02), hy - hr * .2, X(s * .03 + .02), hy + hr * .15); g.addColorStop(0, mixC(gc, '#6aa0c8', .5)); g.addColorStop(1, gc); c.fillStyle = g; c.beginPath(); c.ellipse(X(s * .03), hy - hr * .04, H * .024, H * .018, 0, 0, 6.283); c.fill() });
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X(-.04), hy - hr * .14); c.lineTo(X(-.025), hy - hr * .1); c.stroke() }
  // müts
  const hat = L.pea && L.pea.id, hc = col('pea', '#2f5a8a');
  if (hat === 'nokamuts') { c.fillStyle = shade(X(-.07), 0, X(.07), 0, hc); c.beginPath(); c.ellipse(X(0), hy - hr * .45, hr * .95, hr * .7, 0, Math.PI, 0); c.fill(); c.fillStyle = mixC(hc, '#000000', .25); c.beginPath(); c.ellipse(X(0), hy - hr * .42, hr * 1.15, hr * .2, 0, 0, Math.PI); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(X(0), hy - hr * 1.12, 2, 0, 6.283); c.fill() }
  if (hat === 'vihmakubar') { c.fillStyle = shade(X(-.1), 0, X(.1), 0, hc); c.beginPath(); c.ellipse(X(0), hy - hr * .35, hr * 1.55, hr * .32, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(X(0), hy - hr * .55, hr * .9, hr * .65, 0, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(X(-.03), hy - hr * .85, hr * .3, hr * .12, -.3, 0, 6.283); c.fill() }
  if (hat === 'kootud') { c.fillStyle = shade(X(-.07), 0, X(.07), 0, hc); c.beginPath(); c.ellipse(X(0), hy - hr * .4, hr * .95, hr * .85, 0, Math.PI, 0); c.fill(); c.fillStyle = mixC(hc, '#ffffff', .2); c.fillRect(X(-.072), hy - hr * .55, hr * 1.9, hr * .3); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(X(i * .011), hy - hr * .55); c.lineTo(X(i * .011), hy - hr * .25); c.stroke() } c.fillStyle = '#f4f0e6'; c.beginPath(); c.arc(X(0), hy - hr * 1.28, hr * .28, 0, 6.283); c.fill() }
  c.restore();
}
// riideesemete pildid kapis
function drawCloth(c, S, id, col, t) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const g = (x0, x1, base) => { const gr = c.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, mixC(base, '#000000', .3)); gr.addColorStop(.45, mixC(base, '#ffffff', .15)); gr.addColorStop(1, mixC(base, '#000000', .35)); return gr };
  const sw = Math.sin(t * 1.5) * .02;
  c.rotate(sw);
  if (id === 'nokamuts') { c.fillStyle = g(-S * .3, S * .3, col); c.beginPath(); c.ellipse(0, S * .05, S * .3, S * .25, 0, Math.PI, 0); c.fill(); c.fillStyle = mixC(col, '#000000', .3); c.beginPath(); c.ellipse(S * .18, S * .07, S * .26, S * .06, .1, 0, 6.283); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -S * .2, 3, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(0, -S * .2); c.lineTo(0, S * .05); c.stroke() }
  if (id === 'vihmakubar') { c.fillStyle = g(-S * .4, S * .4, col); c.beginPath(); c.ellipse(0, S * .1, S * .42, S * .1, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(0, S * .05, S * .24, S * .24, 0, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-S * .08, -S * .1, S * .08, S * .03, -.4, 0, 6.283); c.fill() }
  if (id === 'kootud') { c.fillStyle = g(-S * .26, S * .26, col); c.beginPath(); c.ellipse(0, S * .12, S * .26, S * .32, 0, Math.PI, 0); c.fill(); c.fillStyle = mixC(col, '#ffffff', .2); c.fillRect(-S * .27, S * .04, S * .54, S * .1); c.strokeStyle = 'rgba(0,0,0,.18)'; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * S * .04, S * .04); c.lineTo(i * S * .04, S * .14); c.stroke() } c.fillStyle = '#f4f0e6'; c.beginPath(); c.arc(0, -S * .24, S * .08, 0, 6.283); c.fill() }
  if (id === 'prillid') { c.strokeStyle = '#111'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-S * .42, -S * .04); c.lineTo(-S * .3, -S * .02); c.moveTo(S * .42, -S * .04); c.lineTo(S * .3, -S * .02); c.moveTo(-S * .06, -S * .01); c.quadraticCurveTo(0, -S * .06, S * .06, -S * .01); c.stroke();
    [-1, 1].forEach(s => { const gr = c.createLinearGradient(s * S * .18, -S * .1, s * S * .18, S * .1); gr.addColorStop(0, mixC(col, '#6aa0c8', .55)); gr.addColorStop(1, col); c.fillStyle = gr; c.beginPath(); c.ellipse(s * S * .18, S * .02, S * .13, S * .1, 0, 0, 6.283); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s * S * .18 - S * .07, -S * .03); c.lineTo(s * S * .18 - S * .02, -S * .07); c.stroke() }) }
  if (id === 'vest' || id === 'vihmajope' || id === 'tormijope') {
    const jac = id !== 'vest';
    c.strokeStyle = '#8a8a8a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-S * .12, -S * .36); c.quadraticCurveTo(0, -S * .46, S * .12, -S * .36); c.moveTo(0, -S * .42); c.lineTo(0, -S * .48); c.stroke();
    c.fillStyle = g(-S * .3, S * .3, col); c.beginPath(); c.moveTo(-S * .12, -S * .36); c.lineTo(-S * .28, -S * .3); c.lineTo(jac ? -S * .44 : -S * .28, jac ? S * .2 : -S * .1); c.lineTo(jac ? -S * .34 : -S * .28, jac ? S * .22 : S * .38); c.lineTo(-S * .26, S * .38); c.lineTo(S * .26, S * .38); c.lineTo(jac ? S * .34 : S * .28, jac ? S * .22 : S * .38); c.lineTo(jac ? S * .44 : S * .28, jac ? S * .2 : -S * .1); c.lineTo(S * .28, -S * .3); c.lineTo(S * .12, -S * .36); c.quadraticCurveTo(0, -S * .26, -S * .12, -S * .36); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -S * .3); c.lineTo(0, S * .38); c.stroke();
    if (id === 'vest') { c.fillStyle = mixC(col, '#000000', .25); [[-.24, -.12], [-.24, .1], [.08, -.12], [.08, .1]].forEach(([a, b]) => { c.fillRect(a * S, b * S, S * .15, S * .14); c.fillStyle = mixC(col, '#ffffff', .2); c.fillRect(a * S, b * S, S * .15, S * .03); c.fillStyle = mixC(col, '#000000', .25) }) }
    if (id === 'vihmajope') { c.fillStyle = mixC(col, '#000000', .18); c.beginPath(); c.ellipse(0, -S * .38, S * .16, S * .06, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(-S * .15, -S * .05, S * .04, S * .18, -.15, 0, 6.283); c.fill() }
    if (id === 'tormijope') { c.strokeStyle = mixC(col, '#000000', .35); c.lineWidth = 2.5; c.beginPath(); c.moveTo(-S * .28, 0); c.lineTo(S * .28, 0); c.stroke(); c.fillStyle = mixC(col, '#000000', .25); c.fillRect(-S * .08, -S * .4, S * .16, S * .08); c.fillStyle = '#d8dee2'; c.fillRect(-S * .22, S * .06, S * .1, S * .02) }
  }
  if (id === 'vpyksid' || id === 'talvepyksid') {
    c.fillStyle = g(-S * .25, S * .25, col); c.beginPath(); c.moveTo(-S * .22, -S * .3); c.lineTo(S * .22, -S * .3); c.lineTo(S * .24, S * .42); c.lineTo(S * .06, S * .42); c.lineTo(0, -S * .02); c.lineTo(-S * .06, S * .42); c.lineTo(-S * .24, S * .42); c.closePath(); c.fill();
    if (id === 'vpyksid') { c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.moveTo(-S * .14, -S * .3); c.lineTo(-S * .16, -S * .48); c.moveTo(S * .14, -S * .3); c.lineTo(S * .16, -S * .48); c.stroke(); c.fillStyle = '#c8c8c8'; c.fillRect(-S * .17, -S * .33, S * .06, S * .04); c.fillRect(S * .11, -S * .33, S * .06, S * .04) }
    else { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let k = -.2; k < .42; k += .08) { c.beginPath(); c.moveTo(-S * .23, k * S); c.lineTo(S * .23, k * S); c.stroke() } }
  }
  if (id === 'kummikud' || id === 'talvesaapad' || id === 'kahlajad') {
    if (id === 'kahlajad') { c.fillStyle = g(-S * .3, S * .3, col); c.beginPath(); c.moveTo(-S * .26, -S * .44); c.lineTo(S * .26, -S * .44); c.lineTo(S * .26, -S * .1); c.lineTo(S * .24, S * .36); c.lineTo(S * .04, S * .36); c.lineTo(S * .02, 0); c.lineTo(-S * .02, 0); c.lineTo(-S * .04, S * .36); c.lineTo(-S * .24, S * .36); c.lineTo(-S * .26, -S * .1); c.closePath(); c.fill(); c.fillStyle = mixC(col, '#000000', .45); c.fillRect(-S * .27, S * .32, S * .25, S * .1); c.fillRect(S * .02, S * .32, S * .25, S * .1); c.strokeStyle = mixC(col, '#000000', .3); c.lineWidth = 3; c.beginPath(); c.moveTo(-S * .18, -S * .44); c.lineTo(-S * .2, -S * .52); c.moveTo(S * .18, -S * .44); c.lineTo(S * .2, -S * .52); c.stroke() }
    else { const tall = id === 'kummikud' ? .46 : .26; [-1, 1].forEach(s => { const x = s * S * .17; c.fillStyle = g(x - S * .1, x + S * .1, col); c.beginPath(); c.moveTo(x - S * .09, S * (.38 - tall * 1.6)); c.lineTo(x + S * .09, S * (.38 - tall * 1.6)); c.lineTo(x + S * .09, S * .32); c.quadraticCurveTo(x + s * S * .22, S * .34, x + s * S * .2, S * .42); c.lineTo(x - S * .1, S * .42); c.closePath(); c.fill();
      if (id === 'talvesaapad') { c.fillStyle = '#e8dcc8'; c.beginPath(); c.ellipse(x, S * (.38 - tall * 1.6), S * .11, S * .045, 0, 0, 6.283); c.fill() } else { c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - S * .06, S * (.4 - tall * 1.6), S * .025, S * .5) } }) }
  }
  if (id === 'sormikud' || id === 'talvekindad') {
    [-1, 1].forEach(s => { c.save(); c.translate(s * S * .18, 0); c.scale(s, 1); c.fillStyle = g(-S * .14, S * .14, col); c.beginPath(); c.moveTo(-S * .12, S * .36); c.lineTo(-S * .13, -S * .02); c.quadraticCurveTo(-S * .12, -S * .22, 0, -S * .22); c.quadraticCurveTo(S * .12, -S * .22, S * .12, -S * .02); c.lineTo(S * .2, -S * .08); c.quadraticCurveTo(S * .25, -S * .02, S * .14, S * .1); c.lineTo(S * .12, S * .36); c.closePath(); c.fill();
      if (id === 'sormikud') { c.fillStyle = '#e8b896'; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-S * .09 + i * S * .06, -S * .24, S * .025, S * .045, 0, 0, 6.283); c.fill() } } else { c.fillStyle = mixC(col, '#ffffff', .4); c.fillRect(-S * .13, S * .26, S * .26, S * .08) }
      c.restore() });
  }
  c.restore();
}
// püügistseen: kalamehe käsi õnge käepidemel, prillidega kala vari
function rdDrawHand(c, w, h, t) {
  const look = rdLook(), x0 = w * .035, y0 = h * .97, x1 = w * .34, y1 = h * .07, k = .1, hx = x0 + (x1 - x0) * k, hy = y0 + (y1 - y0) * k, sc = Math.max(.6, Math.min(1.2, w / 700));
  const slv = look.keha ? look.keha.col : '#c8d0d8', hand = look.kaed ? look.kaed.col : '#e8b896';
  c.save(); c.lineCap = 'round';
  c.strokeStyle = mixC(slv, '#000000', .15); c.lineWidth = 34 * sc; c.beginPath(); c.moveTo(-w * .02, h * 1.12); c.quadraticCurveTo(hx - 10 * sc, hy + 40 * sc, hx - 6 * sc, hy + 14 * sc); c.stroke();
  if (!look.keha) { c.strokeStyle = '#e8b896'; c.lineWidth = 24 * sc; c.beginPath(); c.moveTo(hx - 14 * sc, hy + 42 * sc); c.lineTo(hx - 6 * sc, hy + 14 * sc); c.stroke() }
  else { c.strokeStyle = mixC(slv, '#000000', .35); c.lineWidth = 3; c.beginPath(); c.moveTo(hx - 22 * sc, hy + 20 * sc); c.lineTo(hx + 8 * sc, hy + 14 * sc); c.stroke() }
  const g = c.createRadialGradient(hx - 4 * sc, hy - 4 * sc, 2, hx, hy, 18 * sc); g.addColorStop(0, mixC(hand, '#ffffff', .2)); g.addColorStop(1, mixC(hand, '#000000', .25)); c.fillStyle = g;
  c.beginPath(); c.ellipse(hx, hy, 15 * sc, 12 * sc, -.9, 0, 6.283); c.fill();
  c.strokeStyle = mixC(hand, '#000000', .35); c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(hx + (i - 1) * 6 * sc + 4 * sc, hy - 8 * sc + i * 2); c.lineTo(hx + (i - 1) * 6 * sc - 2 * sc, hy + 6 * sc + i * 2); c.stroke() }
  c.restore();
}

/* ---------- vaated ---------- */
function rdCv(o) { RD.objs.push(o); return `<canvas data-rdcv="${RD.objs.length - 1}"></canvas>` }
function rdPaint(ts) {
  const cvs = document.querySelectorAll('#fishView canvas[data-rdcv]');
  if (!FV.open || !cvs.length) { RD.raf = 0; return }
  cvs.forEach(cv => { const o = RD.objs[+cv.dataset.rdcv]; if (!o) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; const d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); o.draw(c, w, h, ts / 1000) });
  RD.raf = requestAnimationFrame(rdPaint);
}
function rdAvDraw(c, w, h, t) {
  const d = RD.d || {}, f = d.fit || {}, conds = f.conds || [], wx = conds[0] || 'pilves', cold = conds.includes('kylm'), night = FS && FS.is_night;
  let g = c.createLinearGradient(0, 0, 0, h);
  const sky = { paike: ['#7ec4f0', '#d8f0fa'], pilves: ['#8a9aa8', '#c8d2d8'], vihm: ['#4a5a6a', '#8a98a4'], udu: ['#a8b2b4', '#d8dcdc'], torm: ['#2a3442', '#5a6a78'] }[wx] || ['#7ec4f0', '#d8f0fa'];
  g.addColorStop(0, night ? '#0a1430' : sky[0]); g.addColorStop(.7, night ? '#1a2a48' : sky[1]); g.addColorStop(1, night ? '#142030' : '#4a6a3a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  if (wx === 'paike' && !night) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, w * .82, h * .12, h * .25, '#fff2b0', .7); c.translate(w * .82, h * .12); c.rotate(t * .1); for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = 'rgba(255,240,170,.18)'; c.fillRect(h * .06, -2, h * .12, 4) } c.restore() }
  if (night) { c.fillStyle = '#f4f0d8'; c.beginPath(); c.arc(w * .82, h * .12, h * .04, 0, 6.283); c.fill(); for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(255,255,255,${.4 + .4 * Math.sin(t * 2 + i)})`; c.fillRect((i * 97) % w, (i * 53) % (h * .5), 1.5, 1.5) } }
  // vesi ja kallas
  c.fillStyle = night ? '#16304a' : '#3a7a94'; c.fillRect(0, h * .72, w, h * .1); c.fillStyle = night ? '#1a2a1a' : '#4a6a2e'; c.fillRect(0, h * .82, w, h * .18);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h * .74 + Math.sin(x * .05 + t * 2) * 1.5; x ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke();
  drawAngler(c, w, h, rdLook(), t, { tier: f.tier, wet: ['vihm', 'torm', 'udu'].includes(wx) });
  // ilm kuju ümber
  if (wx === 'vihm' || wx === 'torm') { c.strokeStyle = 'rgba(210,230,255,.55)'; c.lineWidth = 1; for (let i = 0; i < (wx === 'torm' ? 90 : 55); i++) { const x = ((i * 61 + t * (wx === 'torm' ? 160 : 60)) % (w + 40)) - 20, y = ((i * 97 + t * 500) % h); c.beginPath(); c.moveTo(x, y); c.lineTo(x - (wx === 'torm' ? 8 : 3), y + 12); c.stroke() } }
  if (wx === 'torm') { if (Math.sin(t * 1.3) > .985) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, 0, w, h) } c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const y = h * (.2 + i * .12), x = ((t * 300 + i * 170) % (w + 200)) - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60, y - 4); c.stroke() } }
  if (wx === 'udu') { c.fillStyle = 'rgba(230,236,234,.35)'; c.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(240,244,244,.25)'; c.beginPath(); c.ellipse((t * 12 + i * 120) % (w + 200) - 100, h * (.3 + i * .15), 140, 30, 0, 0, 6.283); c.fill() } }
  if (cold) { c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const x = (i * 71 + Math.sin(t + i) * 20) % w, y = (i * 43 + t * 30) % h; c.beginPath(); c.arc(x, y, 1.4 + (i % 3) * .5, 0, 6.283); c.fill() } const vg = c.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .8); vg.addColorStop(0, 'rgba(180,220,255,0)'); vg.addColorStop(1, 'rgba(180,220,255,.25)'); c.fillStyle = vg; c.fillRect(0, 0, w, h) }
  // mullid: mis puudu, kas on hästi
  if (f.tier === 'halb') { c.save(); c.font = `800 ${Math.max(14, h * .045)}px system-ui`; c.textAlign = 'center'; const y = h * .1 + Math.sin(t * 3) * 3; c.fillStyle = 'rgba(255,255,255,.92)'; const txt = cold ? 'Brrr… külm!' : 'Uhh, märjaks sain!'; const tw = c.measureText(txt).width + 22; c.beginPath(); c.roundRect ? c.roundRect(w * .48 - tw / 2, y - h * .04, tw, h * .065, 12) : c.rect(w * .48 - tw / 2, y - h * .04, tw, h * .065); c.fill(); c.fillStyle = '#2a3a4a'; c.fillText(txt, w * .48, y + 2); c.restore() }
  if (f.tier === 'hea' && f.need) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, w * .48, h * .55, h * .4, '#7fd16a', .12 + .05 * Math.sin(t * 2)); c.restore() }
}
function rdItemCard(it) {
  const worn = RD.d.outfit && RD.d.outfit[it.slot] === it.id && it.own, rec = rdRec(it.slot), isRec = rec && rec.id === it.id && !worn, lock = FS.level < it.min_level;
  return `<div class="rd-it ${worn ? 'on' : ''} ${isRec ? 'rec' : ''} ${lock && !it.own ? 'locked' : ''}">${isRec ? '<span class="rec-b">Soovitame</span>' : ''}${rdCv({ draw: (c, w, h, t) => { c.save(); c.translate(w / 2, h / 2 + 4); drawCloth(c, Math.min(w * .8, h * .95), it.id, it.color, t); c.restore() } })}
    <b>${esc(it.name)}</b><div class="rd-tags">${it.tags.map(tg => `<span>${RD_TAG[tg][0]} ${RD_TAG[tg][1]}</span>`).join('')}</div><small>${esc(it.descr)}</small>
    ${it.own ? `<div class="rd-cols">${it.colors.map(cc => `<button type="button" class="${cc === it.color ? 'on' : ''}" style="background:${cc}" data-rd="color" data-arg="${it.id}" data-col="${cc}" aria-label="Värv ${cc}"></button>`).join('')}</div>` : ''}
    ${it.own ? (worn ? `<button class="btn sm ghost" type="button" data-rd="off" data-slot="${it.slot}">✓ Seljas · võta ära</button>` : `<button class="btn sm" type="button" data-rd="wear" data-slot="${it.slot}" data-arg="${it.id}">Pane selga</button>`)
      : lock ? `<span class="pill">🔒 ${it.min_level}. tasemel</span>` : `<button class="btn sm" type="button" data-rd="buy" data-arg="${it.id}" ${FS.gold >= it.price && !RD.busy ? '' : 'disabled'}>${RD.conf === 'buy' + it.id ? `Kinnita: ${fmt(it.price)} kulda` : `Osta · ${fmt(it.price)} 🪙`}</button>`}</div>`;
}
function rdFitHtml(compact) {
  const d = RD.d, f = d.fit || {}, req = f.req || {}, slots = RD_SLOT.filter(([s]) => req[s]);
  const pct = Math.round((+f.pct || 0) * 100), colr = f.tier === 'hea' ? '#7fd16a' : f.tier === 'halb' ? '#ff9a6a' : '#ffd27a';
  return `<div class="rd-conds">${(f.conds || []).map(k => `<span>${RD_COND[k][0]} ${RD_COND[k][1]}</span>`).join('')}${(f.conds || []).includes('kylm') ? `<small style="align-self:center;opacity:.8">${FS.is_night ? 'öö' : FS.is_winter ? 'talv' : 'jääl'}</small>` : ''}</div>
    ${slots.length ? `<div><div style="display:flex;justify-content:space-between;font-weight:800;margin-bottom:4px"><span>Ilmale vastav riietus</span><span style="color:${colr}">${pct}%</span></div><div class="rd-meter"><i style="width:${pct}%;background:${colr}"></i></div></div>
      <div class="rd-req">${slots.map(([s, n, ic]) => { const ok = f.ok && f.ok[s], w = rdWorn(s), rec = rdRec(s);
        return `<div class="${ok ? 'ok' : 'no'}"><span style="font-size:20px">${ic}</span><span><b>${n}:</b> ${req[s].map(tg => RD_TAG[tg][1]).join(' või ')}<small>${ok ? '✓ ' + esc(w.name) : w ? `Seljas ${esc(w.name)} – ei sobi` : 'Puudub'}</small></span>
          ${ok ? '' : rec ? (rec.own ? `<button class="btn sm" type="button" data-rd="wear" data-slot="${s}" data-arg="${rec.id}">Pane: ${esc(rec.name)}</button>` : `<button class="btn sm ghost" type="button" data-rd="goto" data-arg="${s}">Soovitus: ${esc(rec.name)}</button>`) : ''}</div>` }).join('')}</div>`
      : '<p class="lead" style="margin:0">Praegu on mõnus ilm – erilist riietust pole vaja.</p>'}
    <p class="rd-eff ${f.tier === 'hea' && f.need ? '' : 'idle'}">${f.tier === 'hea' && f.need ? '✓ Oled ilma järgi riides: <b>+10% kogemust</b>, kala võtab 10% kiiremini ja pääseb 20% harvemini.' : 'Soovitus: ilma järgi riides kalur saab <b>+10% kogemust</b>, kala võtab kiiremini ja pääseb harvemini. Riietumine on vabatahtlik.'}</p>
    ${compact ? '' : `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn" type="button" data-rd="auto" ${RD.busy ? 'disabled' : ''}>👕 Riietu ilma järgi</button>
      <label class="rd-sw"><input type="checkbox" data-rd="autoset" ${d.auto_dress ? 'checked' : ''}> Vaheta riided ise ilma järgi</label></div>`}`;
}
function tabRiided() {
  RD.objs = [];
  if (!RD.d) { rdLoad(); return '<div class="fv-card"><p class="lead">Avan riidekappi…</p></div>' }
  if (RD.key !== rdKey() && !RD.loading) setTimeout(() => rdLoad(), 0);
  const f = RD.d.fit || {};
  let h = `<div class="rd-top"><div class="rd-av">${rdCv({ draw: rdAvDraw })}<span class="tag">${f.tier === 'hea' && f.need ? '✓ Valmis selleks ilmaks' : f.tier === 'halb' ? '🥶 Riided ei sobi ilmaga' : '🎣 Kalamees'}</span></div>
    <div class="fv-card rd-wx" style="margin:0"><h2 style="margin:0">Ilm ja riietus</h2><p class="lead" style="margin:0">Ilm vahetub iga 3 tunni järel. Mäng soovitab, mis selga panna – kas paned, otsustad ise.</p>${rdFitHtml(false)}</div></div>`;
  h += `<div class="fv-card"><h2>Riidekapp <small class="lead">${(RD.d.items || []).filter(i => i.own).length}/${(RD.d.items || []).length}</small></h2><div class="rd-slots">${RD_SLOT.map(([s, n, ic]) => {
    const list = (RD.d.items || []).filter(i => i.slot === s), need = f.req && f.req[s];
    return `<div class="rd-slot" id="rdslot-${s}"><h3>${ic} ${n}${need ? ` <span class="pill" style="background:${f.ok[s] ? 'rgba(127,209,106,.2)' : 'rgba(255,170,90,.2)'}">Praegu vaja: ${need.map(tg => RD_TAG[tg][0] + ' ' + RD_TAG[tg][1]).join(' või ')}</span>` : ''}</h3><div class="rd-items">${list.map(rdItemCard).join('')}</div></div>` }).join('')}</div></div>`;
  return h;
}
// püügilehel soovitusbänner (ainult kui ilm nõuab midagi)
function rdBanner() {
  if (!RD.d || !RD.d.fit || !RD.d.fit.need || !CL.user) return '';
  const f = RD.d.fit, wx = RD_COND[f.conds[0]] || ['🌤', ''], cold = f.conds.includes('kylm');
  if (f.tier === 'hea') return `<div class="rd-ban good"><span class="ic">${wx[0]}</span><div><b>Oled ilma järgi riides</b><small>${wx[1]}${cold ? ' ja külm' : ''}: +10% kogemust, kala võtab kiiremini.</small></div><div class="acts"><button class="btn sm ghost" type="button" data-rd="tab">Riidekapp</button></div></div>`;
  const miss = RD_SLOT.filter(([s]) => f.req[s] && !f.ok[s]).map(([s]) => { const r = rdRec(s); return r ? r.name.toLowerCase() : RD_SLOT.find(x => x[0] === s)[1].toLowerCase() });
  const canAuto = RD_SLOT.some(([s]) => f.req[s] && !f.ok[s] && rdRec(s) && rdRec(s).own);
  return `<div class="rd-ban"><span class="ic">${wx[0]}</span><div><b>${wx[1]}${cold ? ' ja külm' : ''} – soovitame riietust</b><small>Selga sobiks: ${miss.join(', ')}. Ilma järgi riides saad +10% kogemust ja kala pääseb harvemini.</small></div>
    <div class="acts">${canAuto ? `<button class="btn sm" type="button" data-rd="auto">Riietu ilma järgi</button>` : ''}<button class="btn sm ghost" type="button" data-rd="tab">Riidekapp</button></div></div>`;
}

/* ---------- tegevused ---------- */
async function rdAct(a, el) {
  const arg = el.dataset.arg;
  if (a === 'tab') { FV.tab = 'riided'; return renderFV(true) }
  if (a === 'goto') { const n = document.getElementById('rdslot-' + arg); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); return }
  if (a === 'buy' && RD.conf !== 'buy' + arg) { RD.conf = 'buy' + arg; return renderFV(true) }
  if (RD.busy) return;
  const sp = FV.spot || 'metsajarv';
  const call = { buy: ['clothes_buy', { p_id: arg, p_spot: sp }], wear: ['clothes_wear', { p_slot: el.dataset.slot, p_id: arg, p_spot: sp }], off: ['clothes_wear', { p_slot: el.dataset.slot, p_id: null, p_spot: sp }],
    auto: ['clothes_auto', { p_spot: sp }], autoset: ['clothes_autoset', { p_on: !!el.checked, p_spot: sp }], color: ['clothes_color', { p_id: arg, p_color: el.dataset.col, p_spot: sp }] }[a];
  if (!call) return;
  RD.busy = true;
  try {
    const r = await rpc(call[0], call[1]); const { bought, ach, auto, ...st } = r; const was = RD.d && RD.d.fit && RD.d.fit.tier; RD.d = st; RD.key = rdKey(); RD.conf = null;
    if (bought) { toast(`Ostsid: ${rdItem(bought).name} – see on kohe seljas`, 'good', 'fish'); await refreshFS() }
    if (a === 'autoset') toast(st.auto_dress ? 'Nüüd vahetab mäng riided ise ilma järgi.' : 'Riided vahetad nüüd ise.', 'info', 'fish');
    if (st.fit && st.fit.tier === 'hea' && st.fit.need && was !== 'hea') { toast('Oled ilma järgi riides! +10% kogemust', 'good', 'fame'); if (typeof sfx === 'function') sfx('chime') }
    else if (typeof sfx === 'function') sfx('pop');
    if (ach && ach.length && typeof afterAch === 'function') afterAch(ach);
  } catch (e) { toast(e.message, 'bad') }
  RD.busy = false; renderFV(true);
}
document.addEventListener('click', e => { const el = e.target.closest('[data-rd]'); if (!el || el.disabled || el.dataset.rd === 'autoset') return; rdAct(el.dataset.rd, el) });
document.addEventListener('change', e => { const el = e.target.closest('[data-rd="autoset"]'); if (el) rdAct('autoset', el) });

/* ---------- ühendus ---------- */
{
  FTAB_FN.riided = tabRiided;
  const baseRenderR = renderFV;
  renderFV = function (force) { baseRenderR(force); if (FV.open && FV.tab === 'riided' && !RD.raf) RD.raf = requestAnimationFrame(rdPaint); if (FV.open && RD.d && RD.key !== rdKey() && !RD.loading) rdLoad() };
  const baseTabPuukR = tabPuuk;
  tabPuuk = function () { return rdBanner() + baseTabPuukR() };
  const baseRefreshR = refreshFS;
  refreshFS = async function () { const r = await baseRefreshR(); if (CL.user && (!RD.d || RD.key !== rdKey()) && !RD.loading) rdLoad(); return r };
  const baseFxR = drawFx;
  drawFx = function (c, w, h, dt, t) {
    // prillidega näeb kala varju, mis ujub ujuki juurde
    if (RD.peek && FV.phase === 'waiting' && FV.biteAt) {
      const now = performance.now(), k = Math.max(0, Math.min(1, (now - RD.castAt) / Math.max(1, FV.biteAt - RD.castAt))), L = 26 + 90 * RD.peek;
      const x = FX.bx + (1 - k) * w * .3 + Math.sin(now / 400) * 6, y = FX.by + h * .14 + (1 - k) * h * .08;
      c.save(); c.globalAlpha = .18 + .22 * k; c.filter = 'brightness(0) blur(1px)'; drawLook(c, x, y, L, {}, now / 1000, 1); c.restore();
    }
    baseFxR(c, w, h, dt, t);
    if (CL.user && RD.d) rdDrawHand(c, w, h, t);
  };
  const baseRpcR = rpc;
  rpc = async function (fn, args) {
    const r = await baseRpcR(fn, args);
    try { if (fn === 'fish_cast' && r) { RD.peek = r.peek ? +r.peek : null; RD.castAt = performance.now(); if (r.peek && Math.random() < .3) setTimeout(() => fxText(FX.w / 2, FX.h * .32, r.peek > .6 ? '🕶 Suur vari läheneb!' : '🕶 Vees liigub kala…', '#cdf3ff', 16), 600) } } catch (e) { }
    return r;
  };
  if (typeof remTodo === 'function') {
    const baseTodoR2 = remTodo;
    remTodo = function () { const r = baseTodoR2(); const f = RD.d && RD.d.fit; if (f && f.need && f.tier !== 'hea' && !RD.d.auto_dress && RD_SLOT.some(([s]) => f.req[s] && !f.ok[s] && rdRec(s) && rdRec(s).own)) r.T.push({ c: '#7fd16a', t: 'Riietu ilma järgi', s: `${(RD_COND[f.conds[0]] || ['', ''])[1]}: sul on sobivad riided kapis`, tab: 'riided', b: 'Ava' }); return r };
  }
}
document.addEventListener('click', e => { const t = e.target.closest('[data-fa="tab"][data-arg="riided"]'); if (t) rdLoad(true) });
