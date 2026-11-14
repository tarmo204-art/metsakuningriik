/* =====================================================================
   Kalamehe varustus ja püünised.
   Abivahendid (mõjuvad päriselt püügile, server: fx_kit_v):
     kahv – vähem põgenemisi ja katkiminekuid · söödakorv – kiirem näkkamine, rohkem rahulikke kalu
     ridvahoidja – teine õng, vahel kaks kala korraga · kalasump – parem müügihind · söödaämber – sööt ei kulu alati
   Püünised (töötavad ise, tühjendad hiljem): nakkevõrk (vajab kalastuskaarti), mõrd, katiska, vähimõrd (jõevähk).
   Server: schema.sql jaotised 2o ja 6n (gear_state, gear_buy, license_buy, trap_set, trap_lift, trap_collect).
   ===================================================================== */
const KV = { d: null, loading: false, conf: null, pick: {}, netAt: 0, bellAt: 0, saveAt: 0, objs: [], raf: 0, skew: 0, busy: false };
const KV_KIND = {
  kahv: { ic: '🥅', n: 'Kahv', job: 'Suur kala ei pääse viimasel hetkel minema ega rebi tamiili katki.' },
  korv: { ic: '🧺', n: 'Söödakorv', job: 'Peibutussööt meelitab kalad kohale: näkkab kiiremini, latikat ja karpkala tuleb rohkem.' },
  hoidja: { ic: '🎣', n: 'Ridvahoidja', job: 'Teine õng on vees – vahel tuleb kaks kala korraga.' },
  sump: { ic: '🪣', n: 'Kalasump', job: 'Kala püsib elus ja värske – müües saad parema hinna.' },
  ammber: { ic: '🪱', n: 'Söödaämber', job: 'Elussööt püsib ämbris elus – iga vise ei kuluta sööta.' },
  vork: { ic: '🕸️', n: 'Nakkevõrk', job: 'Pane vette ja tule paari tunni pärast saaki välja võtma. Vajab kalastuskaarti.', trap: 1 },
  mord: { ic: '🪤', n: 'Mõrd', job: 'Suur püünis haugile, latikale, linaskile ja angerjale.', trap: 1 },
  katiska: { ic: '📦', n: 'Katiska', job: 'Soome traatmõrd väikestele kaladele: ahven, särg, kiisk.', trap: 1 },
  loks: { ic: '🦞', n: 'Vähimõrd', job: 'Püüab jõevähke – neid õngega ei saa.', trap: 1 }
};
const KV_HELP = ['kahv', 'korv', 'hoidja', 'sump', 'ammber'], KV_TRAPS = ['vork', 'mord', 'katiska', 'loks'];
FTABS.puunised = '🪤 Püünised';

document.head.insertAdjacentHTML('beforeend', `<style>
.kv-grp{display:grid;gap:8px;padding:12px;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(0,0,0,.12));border:1px solid rgba(255,255,255,.07)}
.kv-grp h3{margin:0;font-size:16px;display:flex;gap:8px;align-items:center}
.kv-grp .job{margin:0;font-size:13px;opacity:.85;line-height:1.4}
.kv-tiers{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.kv-item{position:relative;display:grid;grid-template-rows:auto 1fr;gap:8px;align-content:start;padding:10px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.08)}
.kv-item.own{border-color:rgba(127,209,106,.55);box-shadow:inset 0 0 0 1px rgba(127,209,106,.15)}
.kv-item.best{background:radial-gradient(120% 120% at 0% 0%,rgba(127,209,106,.14),rgba(0,0,0,.22))}
.kv-item.locked{opacity:.55}
.kv-item canvas.kitcv{width:100%;height:118px;border-radius:12px}
.kv-item b{display:block;font-size:14.5px}
.kv-item small{display:block;font-size:12.5px;opacity:.85;line-height:1.38;margin:3px 0 6px}
.kv-item .tier{position:absolute;top:8px;left:8px;padding:1px 7px;border-radius:999px;font:800 11px system-ui;background:rgba(0,0,0,.55);color:#ffe6a6}
.kv-eff{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px}.kv-eff span{padding:2px 8px;border-radius:999px;font-size:11.5px;font-weight:700;background:rgba(90,200,232,.14);color:#cdf3ff;border:1px solid rgba(90,200,232,.3)}
.kv-hero{position:relative;border-radius:20px;overflow:hidden;border:1px solid rgba(140,210,230,.25);box-shadow:0 18px 50px rgba(0,0,0,.4)}
.kv-hero canvas{display:block;width:100%;height:280px}
.kv-hero .ttl{position:absolute;left:16px;top:12px;pointer-events:none}
.kv-hero .ttl h2{margin:0;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:28px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6)}
.kv-hero .ttl small{color:#e2f4f8;font-weight:700;text-shadow:0 1px 3px #000}
.kv-traps{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.kv-trap{display:grid;gap:8px;padding:12px;border-radius:16px;background:linear-gradient(180deg,rgba(20,60,74,.65),rgba(8,24,32,.85));border:1px solid rgba(140,210,230,.22)}
.kv-trap.ready{border-color:#ffd27a;box-shadow:0 0 24px rgba(255,200,90,.3);background:linear-gradient(180deg,rgba(80,64,20,.55),rgba(20,18,8,.85))}
.kv-trap .top{display:grid;grid-template-columns:84px minmax(0,1fr);gap:10px;align-items:center}
.kv-trap canvas.kitcv{width:84px;height:72px;border-radius:12px}
.kv-trap b{font-size:15px}.kv-trap small{display:block;opacity:.85;font-size:12.5px;line-height:1.35}
.kv-bar{height:9px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden}.kv-bar i{display:block;height:100%;background:linear-gradient(90deg,#4ac0d8,#9ff0c8);transition:width .9s linear}
.kv-trap.ready .kv-bar i{background:linear-gradient(90deg,#ffd27a,#fff0b8)}
.kv-spots{display:flex;gap:5px;flex-wrap:wrap}
.kv-spots button{border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:inherit;border-radius:999px;padding:4px 10px;font-size:12.5px;cursor:pointer}
.kv-spots button.on{border-color:#ffd27a;background:rgba(255,210,122,.16);color:#fff}
.kv-spots button:disabled{opacity:.4;cursor:default}
.kv-lic{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;border-radius:16px;overflow:hidden;
  background:linear-gradient(120deg,#e9f1e4,#cfe0c8 60%,#b9d2b2);color:#1d3326;border:1px solid #8fb08a;box-shadow:inset 0 0 0 4px rgba(255,255,255,.35)}
.kv-lic::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.18) 0 2px,transparent 2px 9px);pointer-events:none}
.kv-lic .em{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;font-size:28px;background:radial-gradient(circle at 35% 30%,#fff,#9cc29a);border:2px solid #4d7a52}
.kv-lic h3{margin:0;font-family:Georgia,serif;letter-spacing:.06em;font-size:17px;color:#1d3a26}
.kv-lic p{margin:2px 0 0;font-size:13px;color:#2c4a35}
.kv-lic .st{font-weight:800}.kv-lic .st.ok{color:#1d6b2e}.kv-lic .st.no{color:#9a2a1a}
.kv-lic > *{position:relative;z-index:1}
.kv-res{display:grid;gap:10px}
.kv-res canvas{width:100%;height:190px;border-radius:14px;display:block}
.kv-res h2{margin:0;text-align:center}
.kv-fish{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}
.kv-fish div{display:grid;justify-items:center;gap:2px;padding:6px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);text-align:center;font-size:12.5px;opacity:0;animation:kvPop .45s cubic-bezier(.2,1.4,.4,1) forwards}
.kv-fish canvas{width:100%;height:50px}
.kv-fish b{font-size:13px}
@keyframes kvPop{from{opacity:0;transform:translateY(10px) scale(.85)}to{opacity:1;transform:none}}
@media (max-width:620px){.kv-hero canvas{height:220px}.kv-lic{grid-template-columns:auto minmax(0,1fr)}.kv-lic > button{grid-column:1/-1}}
@media (prefers-reduced-motion:reduce){.kv-fish div{animation:none;opacity:1}}
</style>`);

/* ---------- andmed ---------- */
async function kvLoad() {
  if (KV.loading || !CL.user) return; KV.loading = true;
  try { kvSet(await rpc('gear_state')) } catch (e) { }
  KV.loading = false; if (FV.open && (FV.tab === 'puunised' || FV.tab === 'pood')) renderFV(true);
}
function kvSet(d) { KV.d = d; if (d && d.now) KV.skew = Date.parse(d.now) - Date.now() }
function kvNow() { return Date.now() + KV.skew }
function kvKit(k) { return KV.d && KV.d.kit ? KV.d.kit[k] : null }
function kvGear(id) { return KV.d ? (KV.d.gear || []).find(g => g.id === id) : null }
function kvLic() { const u = KV.d && KV.d.license_until; return u && Date.parse(u) > kvNow() ? u : null }
function kvLeft(ms) { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h} h ${String(m).padStart(2, '0')} min` : m ? `${m} min ${String(x).padStart(2, '0')} s` : `${x} s` }
function kvEff(g) {
  const p = v => Math.round(v * 100) + '%';
  switch (g.kind) {
    case 'kahv': return [`−${p(g.val)} põgenemisi`, `−${p(g.val2)} katkiminekuid`];
    case 'korv': return [`${p(g.val)} kiirem näkkamine`, `rahulikke kalu ${String(g.val2).replace('.', ',')}×`];
    case 'hoidja': return [`${p(g.val)} viskest teine kala`];
    case 'sump': return [`+${p(g.val)} müügihind`];
    case 'ammber': return [`${p(g.val)} viskest sööt ei kulu`];
    default: return [`⏱ ${String(g.val).replace('.', ',')} h`, `kuni ${g.val2} ${g.kind === 'loks' ? 'vähki' : 'kala'}`];
  }
}

/* ---------- joonistused ---------- */
function kvMesh(c, x0, y0, x1, y1, step, col, lw = .8) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  for (let x = x0 - (y1 - y0); x < x1; x += step) { c.moveTo(x, y0); c.lineTo(x + (y1 - y0), y1); c.moveTo(x + (y1 - y0), y0); c.lineTo(x, y1) }
  c.stroke(); c.restore();
}
function kvFloat(c, x, y, r, col) { const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r * 1.2); g.addColorStop(0, '#fff'); g.addColorStop(.35, col); g.addColorStop(1, mixC(col, '#000000', .4)); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 1.25, r, 0, 0, 6.283); c.fill() }
// jõevähk (pea vasakul), sobib drawFishReal'i asemele
function drawCrayfish(c, L, t = 0) {
  const sh = '#5a4128', dk = '#3a2a18', lt = '#8a6a42', wig = Math.sin(t * 3) * .04;
  c.save(); c.lineCap = 'round';
  // jalad
  c.strokeStyle = dk; c.lineWidth = Math.max(1, L * .012);
  for (let i = 0; i < 4; i++) { const x = -L * .12 + i * L * .07, k = Math.sin(t * 6 + i) * L * .01; c.beginPath(); c.moveTo(x, L * .03); c.lineTo(x - L * .03, L * .1 + k); c.lineTo(x - L * .05, L * .13 + k); c.stroke() }
  // tundlad
  c.lineWidth = Math.max(.8, L * .006); [[-1, .9], [1, .7]].forEach(([s2, k]) => { c.beginPath(); c.moveTo(-L * .3, -L * .02); c.bezierCurveTo(-L * .5, -L * (.12 + s2 * .02), -L * .7, -L * (.18 + wig), -L * (.6 + .25 * k), -L * (.08 + s2 * .06)); c.stroke() });
  // sõrad
  [[-1, -.06], [1, .05]].forEach(([s2, oy]) => {
    const ax = -L * .28, ay = L * oy, a = Math.sin(t * 2 + s2) * .08;
    c.save(); c.translate(ax, ay); c.rotate(s2 * .18 + a);
    c.fillStyle = sh; c.beginPath(); c.ellipse(-L * .08, 0, L * .09, L * .025, 0, 0, 6.283); c.fill();
    const g = c.createLinearGradient(-L * .3, -L * .06, -L * .3, L * .06); g.addColorStop(0, lt); g.addColorStop(1, dk); c.fillStyle = g;
    c.beginPath(); c.moveTo(-L * .15, -L * .035); c.quadraticCurveTo(-L * .3, -L * .08, -L * .38, -L * .02); c.lineTo(-L * .27, -L * .005); c.lineTo(-L * .37, L * .02); c.quadraticCurveTo(-L * .28, L * .06, -L * .15, L * .035); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke(); c.restore();
  });
  // saba lülid
  for (let i = 5; i >= 0; i--) { const x = L * .06 + i * L * .065, r = L * (.075 - i * .006); const g = c.createLinearGradient(x, -r, x, r); g.addColorStop(0, lt); g.addColorStop(.5, sh); g.addColorStop(1, dk); c.fillStyle = g; c.beginPath(); c.ellipse(x, 0, L * .045, r, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.stroke() }
  // sabalehvik
  c.fillStyle = sh; c.beginPath(); c.moveTo(L * .42, 0); c.lineTo(L * .52, -L * .07); c.quadraticCurveTo(L * .56, 0, L * .52, L * .07); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke();
  // seljakilp
  const g = c.createLinearGradient(0, -L * .08, 0, L * .08); g.addColorStop(0, lt); g.addColorStop(.45, sh); g.addColorStop(1, dk); c.fillStyle = g;
  c.beginPath(); c.ellipse(-L * .1, 0, L * .19, L * .085, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-L * .22, -L * .045); c.quadraticCurveTo(-L * .1, -L * .075, L * .04, -L * .05); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-L * .2 + i * L * .045, (i % 2 ? 1 : -1) * L * .02, L * .008, 0, 6.283); c.fill() }
  c.fillStyle = '#111'; c.beginPath(); c.arc(-L * .27, -L * .035, L * .012, 0, 6.283); c.fill();
  c.restore();
}
// abijoonistused: materjalid ja detailid
function kvTube(c, x0, y0, x1, y1, w, base, hi = .35) { // silinder (vars, toru) valgusega
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2;
  const g = c.createLinearGradient(x0 + nx, y0 + ny, x0 - nx, y0 - ny); g.addColorStop(0, mixC(base, '#000000', .45)); g.addColorStop(.35, mixC(base, '#ffffff', hi)); g.addColorStop(.55, base); g.addColorStop(1, mixC(base, '#000000', .55));
  c.strokeStyle = g; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
}
function kvReel(c, x, y, s, rot = 0, col = '#2a2e33') { // spinningrull: pool, kaar, vänt, jalg
  c.save(); c.translate(x, y); c.rotate(rot);
  kvTube(c, 0, 0, 0, s * .45, s * .12, '#3a3e44');
  const bg = c.createLinearGradient(-s * .4, 0, s * .4, 0); bg.addColorStop(0, mixC(col, '#000000', .5)); bg.addColorStop(.4, mixC(col, '#ffffff', .25)); bg.addColorStop(1, mixC(col, '#000000', .45));
  c.fillStyle = bg; c.beginPath(); c.ellipse(0, s * .62, s * .36, s * .26, 0, 0, 6.283); c.fill();
  const sp = c.createLinearGradient(-s * .3, 0, s * .3, 0); sp.addColorStop(0, '#6a7078'); sp.addColorStop(.45, '#e8eef2'); sp.addColorStop(1, '#5a6068'); c.fillStyle = sp; c.fillRect(-s * .3, s * .74, s * .6, s * .22);
  c.strokeStyle = 'rgba(220,230,240,.55)'; c.lineWidth = .8; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-s * .28, s * (.77 + i * .04)); c.lineTo(s * .28, s * (.77 + i * .04)); c.stroke() }
  c.strokeStyle = '#c8ced4'; c.lineWidth = s * .04; c.beginPath(); c.arc(0, s * .86, s * .38, Math.PI * .05, Math.PI * .95); c.stroke();
  c.strokeStyle = '#1e2226'; c.lineWidth = s * .06; c.beginPath(); c.moveTo(s * .34, s * .6); c.lineTo(s * .62, s * .46); c.stroke(); c.fillStyle = '#c8a24a'; c.beginPath(); c.ellipse(s * .66, s * .44, s * .07, s * .1, .4, 0, 6.283); c.fill();
  c.restore();
}
function kvRod(c, x0, y0, x1, y1, s, col, reel = true) { // õngeritv: korgist käepide, rõngad, ritv, rull
  const a = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0), px = k => x0 + (x1 - x0) * k, py = k => y0 + (y1 - y0) * k;
  kvTube(c, px(.24), py(.24), x1, y1, Math.max(1.4, s * .035), col, .5);
  kvTube(c, x0, y0, px(.24), py(.24), s * .085, '#b0805a', .25); // kork
  c.strokeStyle = 'rgba(80,50,30,.35)'; c.lineWidth = .7; for (let k = .02; k < .23; k += .025) { c.beginPath(); c.arc(px(k), py(k), s * .04, a + 1.2, a + 2); c.stroke() }
  kvTube(c, px(.11), py(.11), px(.15), py(.15), s * .1, '#2a2a2a');
  for (const k of [.36, .5, .63, .75, .86, .95]) { const r = s * (.06 - k * .04); c.strokeStyle = '#d8dee4'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(px(k) + Math.cos(a + 1.57) * r * 1.2, py(k) + Math.sin(a + 1.57) * r * 1.2, r, r * .6, a, 0, 6.283); c.stroke() }
  if (reel) kvReel(c, px(.12), py(.12) + s * .02, s * .2, a - Math.PI / 2 + .1);
}

// varustuse pildid; keskel (0,0), laius ~S
function drawKit(c, S, kind, tier, t) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const sway = Math.sin(t * 1.6) * .03;
  if (kind === 'kahv') {
    // vars (puit / teleskoopalumiinium / süsinik) + EVA käepide, Y-ühendus, kaar, sõlmedeta võrk
    const hx0 = -S * .46, hy0 = S * .42, hx1 = S * .02, hy1 = -S * .04;
    if (tier === 1) kvTube(c, hx0, hy0, hx1, hy1, S * .045, '#9a6a3a', .3);
    else if (tier === 2) { kvTube(c, hx0, hy0, hx1, hy1, S * .04, '#b8c2ca', .5); [[.3], [.55], [.78]].forEach(([k]) => kvTube(c, hx0 + (hx1 - hx0) * k, hy0 + (hy1 - hy0) * k, hx0 + (hx1 - hx0) * (k + .03), hy0 + (hy1 - hy0) * (k + .03), S * .055, '#6a747c')) }
    else { kvTube(c, hx0, hy0, hx1, hy1, S * .042, '#24282c', .45); c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = .7; for (let k = .2; k < 1; k += .04) { const x = hx0 + (hx1 - hx0) * k, y = hy0 + (hy1 - hy0) * k; c.beginPath(); c.moveTo(x - 2, y - 2); c.lineTo(x + 2, y + 2); c.stroke() } }
    kvTube(c, hx0, hy0, hx0 + (hx1 - hx0) * .22, hy0 + (hy1 - hy0) * .22, S * .065, tier === 3 ? '#3f8a4a' : '#2a2a2a', .2);
    kvTube(c, hx1 - S * .02, hy1 + S * .02, hx1 + S * .03, hy1 - S * .03, S * .07, '#3a3e44', .4);
    c.save(); c.translate(S * .2, -S * .15); c.rotate(-.35 + sway);
    const bag = () => { c.beginPath(); c.moveTo(-S * .22, 0); c.bezierCurveTo(-S * .2, S * .3, S * .02, S * .46, S * .03, S * .47); c.bezierCurveTo(S * .1, S * .32, S * .22, S * .16, S * .22, 0); c.closePath() };
    bag(); const ng = c.createLinearGradient(0, 0, 0, S * .46); ng.addColorStop(0, 'rgba(10,20,20,.15)'); ng.addColorStop(1, tier === 3 ? 'rgba(40,80,50,.55)' : 'rgba(10,20,20,.45)'); c.fillStyle = ng; c.fill();
    c.save(); bag(); c.clip(); kvMesh(c, -S * .26, -S * .02, S * .26, S * .5, S * (tier === 3 ? .05 : .035), tier === 3 ? 'rgba(130,200,140,.9)' : 'rgba(225,225,215,.7)', tier === 3 ? 1.6 : .7);
    const sh = c.createRadialGradient(S * .05, S * .25, 2, S * .02, S * .25, S * .3); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = sh; c.fillRect(-S * .3, 0, S * .6, S * .5); c.restore();
    bag(); c.strokeStyle = tier === 3 ? 'rgba(130,200,140,.9)' : 'rgba(225,225,215,.6)'; c.lineWidth = 1; c.stroke();
    // kaar: kaks haru ja kumer esiosa
    const fr = tier === 1 ? '#7a8086' : tier === 2 ? '#dfe5ea' : '#1c2024';
    const rg = c.createLinearGradient(0, -S * .08, 0, S * .08); rg.addColorStop(0, mixC(fr, '#ffffff', .4)); rg.addColorStop(1, mixC(fr, '#000000', .4));
    c.strokeStyle = rg; c.lineWidth = S * .028; c.beginPath(); c.ellipse(0, 0, S * .22, S * .075, 0, 0, 6.283); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -1, S * .22, S * .075, 0, Math.PI * 1.05, Math.PI * 1.9); c.stroke();
    c.restore();
  } else if (kind === 'korv') {
    // tamiil, pöörel, karabiin
    c.strokeStyle = 'rgba(235,235,225,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -S * .5); c.lineTo(0, -S * .36); c.stroke();
    c.strokeStyle = '#c8ced4'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, -S * .34, S * .015, S * .03, 0, 0, 6.283); c.stroke(); c.beginPath(); c.moveTo(0, -S * .31); c.lineTo(-S * .02, -S * .27); c.lineTo(S * .02, -S * .24); c.lineTo(0, -S * .22); c.stroke();
    c.save(); c.rotate(sway * 2);
    if (tier === 1) {
      const w = S * .3, h = S * .44, x = -w / 2, y = -S * .2;
      // sisu: peibutussööt
      const gb = c.createLinearGradient(x, y, x + w, y); gb.addColorStop(0, '#5a3e1e'); gb.addColorStop(.5, '#9a6e38'); gb.addColorStop(1, '#4a3418'); c.fillStyle = gb; c.fillRect(x + 2, y + h * .2, w - 4, h * .7);
      for (let i = 0; i < 40; i++) { c.fillStyle = ['#c89a50', '#6a4a22', '#e8c070', '#3a2a12'][i % 4]; c.beginPath(); c.arc(x + 3 + (i * 37 % (w - 6)), y + h * .22 + (i * 53 % (h * .66)), .8 + (i % 3) * .6, 0, 6.283); c.fill() }
      // traatvõrk silindrina
      const wire = (x2, y2, x3, y3) => { c.beginPath(); c.moveTo(x2, y2); c.lineTo(x3, y3); c.stroke() };
      c.strokeStyle = '#9aa2aa'; c.lineWidth = 1.1; for (let i = 0; i <= 7; i++) wire(x, y + i * h / 7, x + w, y + i * h / 7);
      for (let i = 0; i <= 5; i++) { const xx = x + w * (.5 - .5 * Math.cos(i / 5 * Math.PI)); c.strokeStyle = i % 5 === 0 ? '#6a7078' : '#c8d0d6'; wire(xx, y, xx, y + h) }
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.4; wire(x + w * .25, y + 2, x + w * .25, y + h - 2);
      c.fillStyle = '#d8dee2'; c.beginPath(); c.ellipse(0, y, w / 2, S * .025, 0, 0, 6.283); c.fill(); c.strokeStyle = '#7a8288'; c.lineWidth = 1; c.stroke();
      // valatud tinapõhi
      const lg = c.createLinearGradient(x, 0, x + w, 0); lg.addColorStop(0, '#3a3e42'); lg.addColorStop(.4, '#8a9096'); lg.addColorStop(1, '#2a2e32'); c.fillStyle = lg;
      c.beginPath(); c.moveTo(x - 2, y + h); c.lineTo(x + w + 2, y + h); c.lineTo(x + w - 2, y + h + S * .07); c.quadraticCurveTo(0, y + h + S * .1, x + 2, y + h + S * .07); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; c.font = `700 ${S * .045}px system-ui`; c.textAlign = 'center'; c.fillText('30g', 0, y + h + S * .06);
    } else {
      // method-feeder: roheline plastraam, tinaplaat, pressitud sööt + mais juuksereaktsioonil
      c.fillStyle = '#2a2e32'; c.beginPath(); c.ellipse(0, S * .02, S * .2, S * .28, 0, 0, 6.283); c.fill();
      const ge = c.createRadialGradient(-S * .06, -S * .08, 2, 0, 0, S * .22); ge.addColorStop(0, '#f2d890'); ge.addColorStop(.6, '#c89a48'); ge.addColorStop(1, '#8a6428'); c.fillStyle = ge; c.beginPath(); c.ellipse(0, 0, S * .16, S * .23, 0, 0, 6.283); c.fill();
      for (let i = 0; i < 26; i++) { c.fillStyle = ['#e85a2a', '#ffd34a', '#6a3a1a', '#fff0b0'][i % 4]; c.beginPath(); c.arc(-S * .12 + (i * 37 % 24) * S * .01, -S * .18 + (i * 53 % 36) * S * .01, S * (.008 + (i % 3) * .004), 0, 6.283); c.fill() }
      const fg = c.createLinearGradient(-S * .2, 0, S * .2, 0); fg.addColorStop(0, '#1e5a2a'); fg.addColorStop(.4, '#4aa05a'); fg.addColorStop(1, '#1a4a22');
      c.strokeStyle = fg; c.lineWidth = S * .035; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * S * .065, -S * .26 + Math.abs(i) * S * .03); c.lineTo(i * S * .065, S * .26 - Math.abs(i) * S * .03); c.stroke() }
      c.beginPath(); c.ellipse(0, 0, S * .2, S * .28, 0, 0, 6.283); c.lineWidth = S * .03; c.stroke();
      c.strokeStyle = '#d8dee2'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(S * .02, S * .27); c.quadraticCurveTo(S * .1, S * .36, S * .02, S * .4); c.stroke();
      c.strokeStyle = '#3a3e44'; c.lineWidth = 1.8; c.beginPath(); c.arc(S * .05, S * .4, S * .04, Math.PI * .1, Math.PI * 1.2); c.stroke();
      const mz = c.createRadialGradient(S * .08, S * .45, 1, S * .09, S * .46, S * .05); mz.addColorStop(0, '#fff2a0'); mz.addColorStop(1, '#e8a81a'); c.fillStyle = mz; c.beginPath(); c.ellipse(S * .09, S * .47, S * .035, S * .045, .3, 0, 6.283); c.fill();
    }
    c.restore();
  } else if (kind === 'hoidja') {
    // muru
    const gg = c.createLinearGradient(0, S * .36, 0, S * .5); gg.addColorStop(0, '#5a8a3a'); gg.addColorStop(1, '#2a4a1e'); c.fillStyle = gg; c.beginPath(); c.ellipse(0, S * .44, S * .5, S * .07, 0, 0, 6.283); c.fill();
    c.strokeStyle = '#6aa04a'; c.lineWidth = 1; for (let i = 0; i < 24; i++) { const x = -S * .45 + i * S * .04; c.beginPath(); c.moveTo(x, S * .44); c.lineTo(x + Math.sin(t + i) * 2, S * .4 - (i % 3) * 2); c.stroke() }
    if (tier === 1) {
      // teleskoop-bankstick + kummist V-hoidja + ritv rulliga
      kvTube(c, S * .06, S * .46, S * .06, -S * .02, S * .035, '#9aa2aa', .5); kvTube(c, S * .06, S * .2, S * .06, S * .24, S * .05, '#3a3e44');
      c.fillStyle = '#1e2226'; c.beginPath(); c.moveTo(-S * .03, -S * .12); c.lineTo(S * .015, -S * .02); c.lineTo(S * .105, -S * .02); c.lineTo(S * .15, -S * .12); c.lineTo(S * .12, -S * .12); c.lineTo(S * .085, -S * .045); c.lineTo(S * .035, -S * .045); c.lineTo(0, -S * .12); c.closePath(); c.fill();
      kvRod(c, -S * .46, S * .3, S * .48, -S * .44 + Math.sin(t * 1.3) * 1.5, S, '#2a3a4a');
    } else {
      // rod pod: raam, kaks signaliseerijat LED-iga, swingerid, kaks ritva
      c.strokeStyle = '#2a2e32'; c.lineWidth = S * .025; [[-.38, .46, -.18, .02], [.38, .46, .18, .02], [-.05, .46, -.12, .02], [.05, .46, .12, .02]].forEach(([a, b, d2, e]) => { kvTube(c, S * a, S * b, S * d2, S * e, S * .028, '#3a3e44', .35) });
      kvTube(c, -S * .3, S * .02, S * .3, S * .02, S * .035, '#4a4e54', .45);
      kvRod(c, -S * .48, S * .26, S * .42, -S * .46, S * .85, '#3a2a4a'); kvRod(c, -S * .34, S * .34, S * .5, -S * .34, S * .85, '#2a4a3a');
      [-.2, .16].forEach((x, i) => { const bx = S * x, by = -S * .03;
        const ag = c.createLinearGradient(bx - S * .06, by - S * .1, bx + S * .06, by); ag.addColorStop(0, '#4a4e54'); ag.addColorStop(1, '#14161a'); c.fillStyle = ag; c.beginPath(); c.roundRect ? c.roundRect(bx - S * .06, by - S * .1, S * .12, S * .08, 3) : c.rect(bx - S * .06, by - S * .1, S * .12, S * .08); c.fill();
        const on = (Math.floor(t * 2) + i) % 4 === 0; c.fillStyle = on ? (i ? '#3aff5a' : '#ff3a3a') : (i ? '#1a5a24' : '#5a1a1a'); c.beginPath(); c.arc(bx + S * .035, by - S * .06, S * .014, 0, 6.283); c.fill(); if (on) glowAt(c, bx + S * .035, by - S * .06, S * .07, i ? '#3aff5a' : '#ff3a3a', .7);
        c.strokeStyle = '#9aa2aa'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx - S * .01, by - S * .02); c.lineTo(bx - S * .02 + Math.sin(t * 2 + i) * 2, by + S * .14); c.stroke(); c.fillStyle = i ? '#2aa0ff' : '#ff8a2a'; c.beginPath(); c.arc(bx - S * .02 + Math.sin(t * 2 + i) * 2, by + S * .15, S * .02, 0, 6.283); c.fill() });
    }
  } else if (kind === 'sump') {
    // kalasump: terasrõngad, tume sõlmedeta võrk, ülemine rõngas nurgalukuga, pool vees
    const n = tier === 1 ? 5 : 7, len = S * (tier === 1 ? .78 : .92);
    c.save(); c.rotate(-.16);
    { const wg = c.createLinearGradient(0, S * .02, 0, S * .34); wg.addColorStop(0, 'rgba(70,150,180,.55)'); wg.addColorStop(1, 'rgba(30,80,100,0)'); c.fillStyle = wg; c.beginPath(); c.moveTo(-S * .5, S * .02); for (let x = -S * .5; x <= S * .5; x += 6) c.lineTo(x, S * .02 + Math.sin(x * .1 + t * 2) * 1.5); c.lineTo(S * .5, S * .34); c.lineTo(-S * .5, S * .34); c.fill() }
    const rx = i => -len / 2 + i * len / (n - 1), rr = i => S * (.17 - i * .009);
    c.save(); c.beginPath(); for (let i = 0; i < n; i++) c.ellipse(rx(i), S * .05, rr(i) * .3, rr(i), 0, 0, 6.283); c.restore();
    // võrgu kest
    c.beginPath(); c.moveTo(rx(0), S * .05 - rr(0)); for (let i = 1; i < n; i++) c.lineTo(rx(i), S * .05 - rr(i)); for (let i = n - 1; i >= 0; i--) c.lineTo(rx(i), S * .05 + rr(i)); c.closePath();
    c.fillStyle = tier === 1 ? 'rgba(20,40,25,.45)' : 'rgba(15,25,35,.5)'; c.fill();
    c.save(); c.clip(); for (let i = 0; i < 3; i++) { const x = rx(1) + i * len * .2 + Math.sin(t + i) * 4; c.fillStyle = 'rgba(160,170,150,.5)'; c.beginPath(); c.ellipse(x, S * .06 + i * 4 - 4, S * .07, S * .022, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(x + S * .06, S * .06 + i * 4 - 4); c.lineTo(x + S * .1, S * .03 + i * 4 - 4); c.lineTo(x + S * .1, S * .09 + i * 4 - 4); c.fill() }
    kvMesh(c, -S * .5, -S * .2, S * .5, S * .3, S * .03, tier === 1 ? 'rgba(60,90,60,.75)' : 'rgba(50,60,70,.75)', .8); c.restore();
    for (let i = 0; i < n; i++) { const g2 = c.createLinearGradient(rx(i) - rr(i) * .3, 0, rx(i) + rr(i) * .3, 0); g2.addColorStop(0, '#6a7078'); g2.addColorStop(.5, '#e8eef2'); g2.addColorStop(1, '#5a6068'); c.strokeStyle = g2; c.lineWidth = 2.4; c.beginPath(); c.ellipse(rx(i), S * .05, rr(i) * .3, rr(i), 0, 0, 6.283); c.stroke() }
    kvTube(c, rx(0) - S * .02, S * .05 - rr(0), rx(0) - S * .1, -S * .4, S * .03, '#9aa2aa', .5); c.fillStyle = '#1e2226'; c.fillRect(rx(0) - S * .07, S * .05 - rr(0) - S * .06, S * .06, S * .05);
    c.strokeStyle = 'rgba(220,245,255,.75)'; c.lineWidth = 1.4; c.beginPath(); for (let x = -S * .5; x <= S * .5; x += 6) { const y = S * .02 + Math.sin(x * .1 + t * 2) * 1.5; x === -S * .5 ? c.moveTo(x, y) : c.lineTo(x, y) } c.stroke();
    c.restore();
  } else if (kind === 'ammber') {
    if (tier === 1) {
      // söödakarp/ämber: roheline plastik, mullaga ussid, pooleldi avatud kaas
      const top = -S * .16, bot = S * .38, wt = S * .3, wb = S * .25, col = '#2f7a3e';
      const g = c.createLinearGradient(-wt, 0, wt, 0); g.addColorStop(0, mixC(col, '#000000', .45)); g.addColorStop(.3, mixC(col, '#ffffff', .2)); g.addColorStop(.55, col); g.addColorStop(1, mixC(col, '#000000', .4)); c.fillStyle = g;
      c.beginPath(); c.moveTo(-wt, top); c.lineTo(wt, top); c.lineTo(wb, bot); c.quadraticCurveTo(0, bot + S * .04, -wb, bot); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (const k of [.15, .85]) { const y = top + (bot - top) * k, ww = wt - (wt - wb) * k; c.beginPath(); c.moveTo(-ww, y); c.quadraticCurveTo(0, y + 3, ww, y); c.stroke() }
      c.fillStyle = '#2a1a0e'; c.beginPath(); c.ellipse(0, top, wt * .96, S * .06, 0, 0, 6.283); c.fill();
      for (let i = 0; i < 30; i++) { c.fillStyle = ['#4a2e18', '#3a2210', '#6a4426'][i % 3]; c.beginPath(); c.arc(-wt * .8 + (i * 37 % 100) / 100 * wt * 1.6, top - S * .03 + (i * 53 % 6), 1.5 + (i % 2), 0, 6.283); c.fill() }
      for (let i = 0; i < 5; i++) { const x = -wt * .65 + i * wt * .32, ph = t * 2.6 + i * 1.7; const wg = c.createLinearGradient(x, 0, x + 16, 0); wg.addColorStop(0, '#d87a7a'); wg.addColorStop(1, '#a84a5a'); c.strokeStyle = wg; c.lineWidth = S * .024; c.beginPath(); c.moveTo(x, top); c.bezierCurveTo(x + 5, top - 9 + Math.sin(ph) * 4, x + 12, top + 4, x + 17, top - 4 + Math.cos(ph) * 3); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.stroke() }
      c.save(); c.translate(wt * .9, top - S * .02); c.rotate(-.9); const lg = c.createLinearGradient(0, -S * .02, 0, S * .03); lg.addColorStop(0, '#4a9a5a'); lg.addColorStop(1, '#1e5a2a'); c.fillStyle = lg; c.fillRect(-wt * .1, -S * .02, wt * 1.4, S * .045); c.restore();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.moveTo(-wt * .62, top + 8); c.lineTo(-wt * .5, top + 8); c.lineTo(-wb * .45, bot - 6); c.lineTo(-wb * .58, bot - 6); c.fill();
      c.strokeStyle = '#1e4a26'; c.lineWidth = 2; c.beginPath(); c.moveTo(-wt * .97, top + 4); c.quadraticCurveTo(-wt * .3, top - S * .34, wt * .4, top - S * .14); c.stroke();
    } else {
      // õhupumbaga söödaämber: valge ämber, sinine kaas avaga, pump külje peal, voolik, mullid, kalakesed
      const top = -S * .2, bot = S * .38, wt = S * .3, wb = S * .25, col = '#eef2f4';
      kvTube(c, S * .36, S * .26, S * .36, S * .14, S * .02, '#7a8a96'); c.strokeStyle = '#8aa0b0'; c.lineWidth = 2; c.beginPath(); c.moveTo(S * .36, S * .14); c.quadraticCurveTo(S * .4, -S * .32, S * .04, -S * .2); c.stroke();
      const pg2 = c.createLinearGradient(S * .3, 0, S * .48, 0); pg2.addColorStop(0, '#1e2a36'); pg2.addColorStop(.5, '#3a4a5a'); pg2.addColorStop(1, '#141c24'); c.fillStyle = pg2; c.fillRect(S * .3, S * .24, S * .18, S * .15); c.fillStyle = '#5ad0ff'; c.fillRect(S * .33, S * .27, S * .04, S * .02); if (Math.sin(t * 6) > 0) glowAt(c, S * .35, S * .28, 6, '#5ad0ff', .6);
      const g = c.createLinearGradient(-wt, 0, wt, 0); g.addColorStop(0, '#9aa4aa'); g.addColorStop(.3, '#ffffff'); g.addColorStop(.6, col); g.addColorStop(1, '#8a949a'); c.fillStyle = g;
      c.beginPath(); c.moveTo(-wt, top); c.lineTo(wt, top); c.lineTo(wb, bot); c.quadraticCurveTo(0, bot + S * .04, -wb, bot); c.closePath(); c.fill();
      c.fillStyle = 'rgba(60,130,170,.25)'; c.beginPath(); c.moveTo(-wt * .97, top + S * .1); c.lineTo(wt * .97, top + S * .1); c.lineTo(wb * .97, bot - 2); c.lineTo(-wb * .97, bot - 2); c.fill();
      const lid = c.createLinearGradient(0, top - S * .05, 0, top + S * .05); lid.addColorStop(0, '#5aa0e0'); lid.addColorStop(1, '#1e5aa0'); c.fillStyle = lid; c.beginPath(); c.ellipse(0, top, wt * 1.02, S * .065, 0, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(30,70,90,.9)'; c.beginPath(); c.ellipse(-wt * .25, top, wt * .38, S * .035, 0, 0, 6.283); c.fill();
      for (let i = 0; i < 6; i++) { const p = (t * .9 + i / 6) % 1; c.fillStyle = `rgba(220,250,255,${.9 - p * .6})`; c.beginPath(); c.arc(-wt * .4 + (i * 7) % 20, top - p * 12, 1.5, 0, 6.283); c.fill() }
      for (let i = 0; i < 2; i++) { const fx2 = -wt * .35 + Math.sin(t * 1.5 + i * 2) * wt * .1, fy2 = top - 1; c.fillStyle = '#c8d0c8'; c.beginPath(); c.ellipse(fx2 + i * 8, fy2, 4, 1.5, 0, 0, 6.283); c.fill() }
      c.strokeStyle = '#9aa6ae'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-wt * .98, top); c.quadraticCurveTo(0, top - S * .4, wt * .98, top); c.stroke();
    }
  } else if (kind === 'vork') {
    // nakkevõrk: piklikud vahtujukid, tinanöör, peen silm, lõpustesse jäänud kala
    const n = tier === 1 ? 6 : 9, x0 = -S * .47, x1 = S * .47, y0 = -S * .22, y1 = S * .34;
    const net = () => { c.beginPath(); c.moveTo(x0, y0); for (let i = 0; i <= 12; i++) c.lineTo(x0 + (x1 - x0) * i / 12, y0 + Math.sin(t * 1.5 + i * .8) * 1.5); for (let i = 12; i >= 0; i--) c.lineTo(x0 + (x1 - x0) * i / 12, y1 - Math.sin(i / 12 * Math.PI) * S * .05); c.closePath() };
    net(); c.fillStyle = 'rgba(20,50,50,.18)'; c.fill(); c.save(); net(); c.clip(); kvMesh(c, x0, y0 - 6, x1, y1, S * (tier === 1 ? .045 : .035), 'rgba(225,235,230,.55)', .6);
    c.save(); c.translate(-S * .05, S * .06); c.rotate(.18); const fg = c.createLinearGradient(0, -S * .04, 0, S * .04); fg.addColorStop(0, '#5a6a5a'); fg.addColorStop(.5, '#c8d0c4'); fg.addColorStop(1, '#e8ece4'); c.fillStyle = fg;
    c.beginPath(); c.ellipse(0, 0, S * .12, S * .04, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(S * .11, 0); c.lineTo(S * .17, -S * .04); c.lineTo(S * .17, S * .04); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(-S * .08, -S * .008, 1.5, 0, 6.283); c.fill(); c.restore();
    kvMesh(c, -S * .2, -S * .02, S * .12, S * .14, S * .045, 'rgba(225,235,230,.7)', .6); c.restore();
    c.strokeStyle = '#e8e0c8'; c.lineWidth = 1.8; c.beginPath(); for (let i = 0; i <= 12; i++) { const x = x0 + (x1 - x0) * i / 12, y = y0 + Math.sin(t * 1.5 + i * .8) * 1.5; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke();
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 2.2; c.beginPath(); for (let i = 0; i <= 12; i++) { const x = x0 + (x1 - x0) * i / 12; i ? c.lineTo(x, y1 - Math.sin(i / 12 * Math.PI) * S * .05) : c.moveTo(x, y1) } c.stroke();
    for (let i = 0; i < n; i++) { const k = (i + .5) / n, x = x0 + (x1 - x0) * k, y = y0 + Math.sin(t * 1.5 + k * 12 * .8) * 1.5; const fg2 = c.createLinearGradient(x, y - S * .03, x, y + S * .03); const fc = i % 2 ? '#ff8a2a' : '#f4f4ea'; fg2.addColorStop(0, mixC(fc, '#ffffff', .4)); fg2.addColorStop(1, mixC(fc, '#000000', .35)); c.fillStyle = fg2; c.beginPath(); c.ellipse(x, y, S * .045, S * .022, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = .8; c.stroke() }
    for (let i = 0; i < n + 2; i++) { const k = (i + .5) / (n + 2), x = x0 + (x1 - x0) * k, y = y1 - Math.sin(k * Math.PI) * S * .05; const lg = c.createLinearGradient(x, y - 3, x, y + 3); lg.addColorStop(0, '#9aa0a6'); lg.addColorStop(1, '#2a2e32'); c.fillStyle = lg; c.beginPath(); c.ellipse(x, y, S * .018, S * .014, 0, 0, 6.283); c.fill() }
  } else if (kind === 'mord') {
    // mõrd: rohelise võrguga rõngad, sees lehtrid, tiivad, vaiad, poi
    const n = tier === 1 ? 5 : 6, x0 = -S * .18, x1 = S * .44, rr = i => S * (.21 - i * (tier === 1 ? .026 : .023)), rx = i => x0 + (x1 - x0) * i / (n - 1);
    kvTube(c, -S * .49, -S * .36, -S * .47, S * .4, S * .025, '#7a5a3a', .2); kvTube(c, -S * .49, S * .36, -S * .47, -S * .3, S * .02, '#6a4a2a', .2);
    const wing = () => { c.beginPath(); c.moveTo(-S * .48, -S * .34); c.lineTo(x0, -rr(0)); c.lineTo(x0, rr(0)); c.lineTo(-S * .48, S * .36); c.closePath() };
    wing(); c.fillStyle = 'rgba(30,60,40,.22)'; c.fill(); c.save(); wing(); c.clip(); kvMesh(c, -S * .5, -S * .36, x0, S * .38, S * .045, 'rgba(110,150,110,.65)', .7); c.restore();
    c.strokeStyle = '#d8d0b0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-S * .48, -S * .34); c.lineTo(x0, -rr(0)); c.moveTo(-S * .48, S * .36); c.lineTo(x0, rr(0)); c.stroke();
    const body = () => { c.beginPath(); c.moveTo(rx(0), -rr(0)); for (let i = 1; i < n; i++) c.lineTo(rx(i), -rr(i)); for (let i = n - 1; i >= 0; i--) c.lineTo(rx(i), rr(i)); c.closePath() };
    body(); c.fillStyle = 'rgba(20,50,35,.35)'; c.fill(); c.save(); body(); c.clip(); kvMesh(c, x0, -S * .25, x1, S * .25, S * .035, 'rgba(110,160,110,.7)', .7);
    c.strokeStyle = 'rgba(200,220,190,.45)'; c.lineWidth = 1; for (let j = 0; j < 2; j++) { const fx0 = rx(j * 2), fx1 = rx(j * 2 + 1.4 > n - 1 ? n - 1 : j * 2 + 1.4); c.beginPath(); c.moveTo(fx0, -rr(j * 2) * .9); c.lineTo(fx0 + (rx(1) - rx(0)) * 1.3, 0); c.lineTo(fx0, rr(j * 2) * .9); c.stroke() }
    c.fillStyle = 'rgba(150,160,130,.6)'; c.beginPath(); c.ellipse(rx(n - 2) + Math.sin(t) * 3, 0, S * .05, S * .018, 0, 0, 6.283); c.fill(); c.restore();
    for (let i = 0; i < n; i++) { const g2 = c.createLinearGradient(rx(i) - rr(i) * .3, 0, rx(i) + rr(i) * .3, 0); const rc2 = tier === 1 ? '#b08858' : '#8aa0a8'; g2.addColorStop(0, mixC(rc2, '#000000', .4)); g2.addColorStop(.5, mixC(rc2, '#ffffff', .3)); g2.addColorStop(1, mixC(rc2, '#000000', .45)); c.strokeStyle = g2; c.lineWidth = 2.8; c.beginPath(); c.ellipse(rx(i), 0, rr(i) * .3, rr(i), 0, 0, 6.283); c.stroke() }
    c.strokeStyle = '#d8d0b0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x1, 0); c.lineTo(x1 + S * .04, 0); c.quadraticCurveTo(x1 + S * .06, -S * .2, x1 + S * .02, -S * .42); c.stroke();
    { const bx = x1 + S * .02, by = -S * .44 + Math.sin(t * 1.5) * 2, bg = c.createRadialGradient(bx - 3, by - 3, 1, bx, by, S * .06); bg.addColorStop(0, '#ffb08a'); bg.addColorStop(1, '#c8301a'); c.fillStyle = bg; c.beginPath(); c.arc(bx, by, S * .045, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(bx - S * .015, by - S * .015, S * .012, 0, 6.283); c.fill() }
  } else if (kind === 'katiska') {
    // katiska: tsingitud traatvõrgust kast, lehtrid mõlemas otsas, luuk, ahvenad sees
    const box = (ox, oy, s2) => {
      const w = S * .58 * s2, h = S * .3 * s2, d2 = S * .15 * s2, x = ox - w / 2, y = oy - h / 2, dx = d2, dy = -d2 * .55;
      const face = (pts, fill) => { c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fillStyle = fill; c.fill() };
      face([[x, y], [x + dx, y + dy], [x + w + dx, y + dy], [x + w, y]], 'rgba(200,210,215,.14)');
      face([[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]], 'rgba(120,130,135,.18)');
      face([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 'rgba(30,50,55,.3)');
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      for (let i = 0; i < 3; i++) { const fx2 = x + w * (.28 + i * .2) + Math.sin(t * 1.5 + i) * 4, fy2 = y + h * (.4 + i * .14); const pg3 = c.createLinearGradient(0, fy2 - 4, 0, fy2 + 4); pg3.addColorStop(0, '#6a7a3a'); pg3.addColorStop(1, '#d8d0a0'); c.fillStyle = pg3; c.beginPath(); c.ellipse(fx2, fy2, S * .05 * s2, S * .018 * s2, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(30,40,20,.6)'; c.lineWidth = 1; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(fx2 + k * S * .02 * s2, fy2 - S * .015 * s2); c.lineTo(fx2 + k * S * .02 * s2, fy2 + S * .012 * s2); c.stroke() } c.fillStyle = '#e85a2a'; c.beginPath(); c.moveTo(fx2 + S * .045 * s2, fy2); c.lineTo(fx2 + S * .07 * s2, fy2 - 3); c.lineTo(fx2 + S * .07 * s2, fy2 + 3); c.fill() }
      c.restore();
      const grid = (ax, ay, bx2, by2, cx2, cy2, n1, n2) => { c.beginPath(); for (let i = 0; i <= n1; i++) { const k = i / n1; c.moveTo(ax + (bx2 - ax) * k, ay + (by2 - ay) * k); c.lineTo(ax + (bx2 - ax) * k + (cx2 - ax), ay + (by2 - ay) * k + (cy2 - ay)) } for (let i = 0; i <= n2; i++) { const k = i / n2; c.moveTo(ax + (cx2 - ax) * k, ay + (cy2 - ay) * k); c.lineTo(ax + (cx2 - ax) * k + (bx2 - ax), ay + (cy2 - ay) * k + (by2 - ay)) } c.stroke() };
      c.strokeStyle = 'rgba(205,215,220,.75)'; c.lineWidth = .8; grid(x, y, x + w, y, x, y + h, 14, 7); grid(x, y, x + w, y, x + dx, y + dy, 14, 3); grid(x + w, y, x + w + dx, y + dy, x + w, y + h, 3, 7);
      c.strokeStyle = '#e8eef2'; c.lineWidth = 1.8; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + dy); c.lineTo(x + w + dx, y + dy); c.lineTo(x + w + dx, y + h + dy); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x + w + dx, y + dy); c.stroke();
      c.strokeStyle = '#c8a24a'; c.lineWidth = 1.6; c.strokeRect(x + w * .35 + dx * .3, y + dy * .3, w * .25, -dy * .4);
      [[x + w * .02, y + h / 2, 1], [x + w + dx * .5, y + h / 2 + dy * .5, -1]].forEach(([fx2, fy2, s3]) => { const fr = c.createRadialGradient(fx2, fy2, 1, fx2, fy2, h * .35); fr.addColorStop(0, 'rgba(0,10,10,.85)'); fr.addColorStop(1, 'rgba(160,170,175,.3)'); c.fillStyle = fr; c.beginPath(); c.ellipse(fx2, fy2, S * .03 * s2, h * .32, 0, 0, 6.283); c.fill(); c.strokeStyle = '#e8eef2'; c.lineWidth = 1.2; c.stroke(); c.strokeStyle = 'rgba(200,210,215,.5)'; c.lineWidth = .7; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(fx2, fy2 + k * h * .13); c.lineTo(fx2 + s3 * w * .14, fy2 + k * h * .03); c.stroke() } });
    };
    if (tier === 2) { box(-S * .07, -S * .15, .78); box(S * .03, S * .17, .78) } else box(0, S * .02, 1);
  } else if (kind === 'loks') {
    // vähimõrd: kokkupandav rõngastega võrgusilinder, lehtrid otstes, kalatükk söödaks, vähid sees
    const trap = (ox, oy, s2, ph) => {
      const w = S * .66 * s2, r = S * .2 * s2;
      c.save(); c.translate(ox, oy);
      const bg = c.createLinearGradient(0, -r, 0, r); bg.addColorStop(0, 'rgba(70,110,100,.35)'); bg.addColorStop(1, 'rgba(15,35,30,.6)'); c.fillStyle = bg; c.beginPath(); c.ellipse(-w / 2, 0, r * .3, r, 0, Math.PI / 2, Math.PI * 1.5); c.lineTo(w / 2, -r); c.ellipse(w / 2, 0, r * .3, r, 0, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = '#c8b8a8'; c.beginPath(); c.ellipse(0, r * .55, w * .07, r * .14, .2, 0, 6.283); c.fill(); c.fillStyle = '#e8d8c8'; c.beginPath(); c.ellipse(-w * .015, r * .5, w * .04, r * .07, .2, 0, 6.283); c.fill();
      c.save(); c.translate(-w * .12 + Math.sin(t * .8 + ph) * 3, r * .15); drawCrayfish(c, w * .5, t + ph); c.restore();
      c.save(); c.translate(w * .2 - Math.sin(t * .7 + ph) * 3, r * .4); c.scale(-1, 1); drawCrayfish(c, w * .38, t + ph + 1); c.restore();
      kvMesh(c, -w / 2, -r, w / 2, r, S * .04 * s2, 'rgba(20,30,25,.75)', .8); c.restore();
      [-.5, -.17, .17, .5].forEach(k => { c.strokeStyle = '#1a1e1c'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(k * w, 0, r * .3, r, 0, 0, 6.283); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.beginPath(); c.ellipse(k * w, 0, r * .3, r, 0, Math.PI * 1.1, Math.PI * 1.6); c.stroke() });
      [-.5, .5].forEach(k => { c.fillStyle = 'rgba(10,15,12,.75)'; c.beginPath(); c.ellipse(k * w, 0, r * .12, r * .35, 0, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(160,180,170,.5)'; c.lineWidth = .7; for (let j = -2; j <= 2; j++) { c.beginPath(); c.moveTo(k * w + Math.sign(k) * r * .25, j * r * .4); c.lineTo(k * w, j * r * .14); c.stroke() } });
      c.strokeStyle = '#d8c8a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(S * .04, -r - S * .12, S * .02, -r - S * .2); c.stroke();
      c.restore();
    };
    if (tier === 2) { trap(-S * .15, -S * .2, .58, 0); trap(S * .16, -S * .02, .58, 1.3); trap(-S * .06, S * .24, .58, 2.6) } else trap(0, S * .05, 1, 0);
  }
  c.restore();
}
{
  const baseDrawGearK = drawGear;
  drawGear = function (c, x, y, S, kind, id, t = 1, ex) {
    if (kind !== 'kit') return baseDrawGearK(c, x, y, S, kind, id, t, ex);
    const m = /^([a-z]+)(\d)$/.exec(id || ''); if (!m) return; c.save(); c.translate(x, y); drawKit(c, S * .95, m[1], +m[2], t); c.restore();
  };
  const basePaintK = paintGear;
  paintGear = function (root) { basePaintK(root); root.querySelectorAll('canvas.kitcv').forEach(cv2 => animGear.add(cv2)) };
  const baseFishRealK = drawFishReal;
  drawFishReal = function (c, L, look, t, sid) { if (sid === 'vahk') return drawCrayfish(c, L * 1.1, t); return baseFishRealK(c, L, look, t, sid) };
}

/* ---------- püüniste vaate stseen ---------- */
function kvHeroDraw(c, w, h, t) {
  const sY = h * .3, bY = h * .9, night = FS && FS.is_night;
  let g = c.createLinearGradient(0, 0, 0, sY); g.addColorStop(0, night ? '#0a1430' : '#8ec8e8'); g.addColorStop(1, night ? '#1e2e50' : '#d8eef4'); c.fillStyle = g; c.fillRect(0, 0, w, sY);
  c.fillStyle = night ? '#0e1e1a' : '#2f5a32'; c.beginPath(); c.moveTo(0, sY); for (let x = 0; x <= w; x += 14) c.lineTo(x, sY - 10 - Math.abs(Math.sin(x * .05)) * 14 - (x % 42 < 14 ? 10 : 0)); c.lineTo(w, sY); c.fill();
  g = c.createLinearGradient(0, sY, 0, h); g.addColorStop(0, night ? '#123048' : '#2f7a94'); g.addColorStop(.6, night ? '#081a28' : '#164a5e'); g.addColorStop(1, '#0a2430'); c.fillStyle = g; c.fillRect(0, sY, w, h - sY);
  // valguskiired
  c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const x = w * (i + .3) / 6 + Math.sin(t * .4 + i) * 20; const lg = c.createLinearGradient(x, sY, x + 40, bY); lg.addColorStop(0, 'rgba(200,240,255,.12)'); lg.addColorStop(1, 'rgba(200,240,255,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(x - 10, sY); c.lineTo(x + 12, sY); c.lineTo(x + 60, bY); c.lineTo(x + 20, bY); c.fill() } c.restore();
  // põhi
  c.fillStyle = '#5a4a32'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, bY); for (let x = 0; x <= w; x += 10) c.lineTo(x, bY + Math.sin(x * .04) * 4); c.lineTo(w, h); c.fill();
  for (let i = 0; i < 14; i++) { const x = (i * 97) % w, hh = h * (.08 + (i % 4) * .03); c.strokeStyle = i % 2 ? '#3a7a4a' : '#2f6a3e'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, bY + 2); for (let k = 1; k <= 5; k++) c.lineTo(x + Math.sin(t * 1.2 + i + k * .6) * k * 1.4, bY + 2 - hh * k / 5); c.stroke() }
  // veepind
  c.strokeStyle = 'rgba(230,250,255,.55)'; c.lineWidth = 1.5; c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = sY + Math.sin(x * .04 + t * 1.6) * 1.8; x ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke();
  // ujuvad kalad
  for (let i = 0; i < 7; i++) { const sp = .03 + (i % 3) * .015, x = ((t * sp + i * .17) % 1.2 - .1) * w, y = sY + (h - sY) * (.25 + (i * .11) % .5); c.save(); c.globalAlpha = .45; c.fillStyle = '#0c2a30'; c.beginPath(); c.ellipse(x, y, 9 + i % 3 * 3, 3 + i % 2, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(x - 9 - i % 3 * 3, y); c.lineTo(x - 15 - i % 3 * 3, y - 4); c.lineTo(x - 15 - i % 3 * 3, y + 4); c.fill(); c.restore() }
  const traps = (KV.d && KV.d.traps) || [], now = kvNow();
  KV_TRAPS.forEach((k, i) => {
    const x = w * (.14 + i * .24), tr = traps.find(q => q.kind === k), kit = kvKit(k), S = Math.min(w * .2, (h - sY) * .55);
    if (!tr) { if (kit) { c.save(); c.globalAlpha = .28; drawKit(c, S, k, kit.tier, t); c.restore() } c.save(); c.globalAlpha = kit ? .35 : .18; c.translate(x, bY - S * .36); drawKit(c, S, k, kit ? kit.tier : 1, t); c.restore(); return }
    const ready = Date.parse(tr.ready_at) <= now, by = sY + Math.sin(t * 1.5 + i) * 2.5;
    c.strokeStyle = 'rgba(230,220,190,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + S * .3, by); c.quadraticCurveTo(x + S * .4, (by + bY) / 2, x + S * .2, bY - S * .4); c.stroke();
    if (k === 'vork') { for (let j = 0; j < 5; j++) kvFloat(c, x - S * .4 + j * S * .2, by + Math.sin(t * 1.5 + j) * 1.5, S * .035, j % 2 ? '#ff8a2a' : '#f4f4ec') }
    else { kvFloat(c, x + S * .3, by, S * .05, k === 'mord' ? '#ff5a2a' : k === 'loks' ? '#ffd02a' : '#f4f4ec'); c.strokeStyle = '#333'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + S * .3, by - S * .05); c.lineTo(x + S * .3, by - S * .2); c.stroke(); c.fillStyle = k === 'mord' ? '#ff3a2a' : '#2a6aff'; c.beginPath(); c.moveTo(x + S * .3, by - S * .2); c.lineTo(x + S * .42, by - S * .16); c.lineTo(x + S * .3, by - S * .12); c.fill() }
    c.save(); c.translate(x, bY - S * .36); if (ready) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, 0, 0, S * .8, '#ffd27a', .35 + .15 * Math.sin(t * 3)); c.restore() } drawKit(c, S, k, kit ? kit.tier : 1, t); c.restore();
    if (ready) { c.save(); c.font = `800 ${Math.max(12, S * .16)}px system-ui`; c.textAlign = 'center'; c.fillStyle = '#ffe6a6'; c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText('Valmis!', x, bY - S * .82 + Math.sin(t * 3) * 2); c.restore() }
  });
}
function kvCv(o) { KV.objs.push(o); return `<canvas data-kvcv="${KV.objs.length - 1}"></canvas>` }
function kvPaint(ts) {
  const cvs = document.querySelectorAll('#fishView canvas[data-kvcv]');
  if (!FV.open || !cvs.length) { KV.raf = 0; return }
  cvs.forEach(cv => { const o = KV.objs[+cv.dataset.kvcv]; if (!o) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; const d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); o.draw(c, w, h, ts / 1000) });
  KV.raf = requestAnimationFrame(kvPaint);
}

/* ---------- vaated ---------- */
function kvItemCard(g, best) {
  const lock = FS.level < g.min_level;
  return `<div class="kv-item ${g.own ? 'own' : ''} ${best ? 'best' : ''} ${lock && !g.own ? 'locked' : ''}"><span class="tier">${'★'.repeat(g.tier)}</span>${gearCv('kit', g.id, 'kitcv')}
    <div><b>${esc(g.name)}</b><small>${esc(g.descr)}</small><div class="kv-eff">${kvEff(g).map(x => `<span>${x}</span>`).join('')}</div>
    ${g.own ? `<span class="pill ok">${best ? 'Kasutusel' : 'Sinu oma'}</span>` : lock ? `<span class="pill">🔒 ${g.min_level}. tasemel</span>`
      : `<button class="btn sm" type="button" data-kv="buy" data-arg="${g.id}" ${FS.gold >= g.price && !KV.busy ? '' : 'disabled'}>${KV.conf === 'buy' + g.id ? `Kinnita: ${fmt(g.price)} kulda` : `Osta · ${fmt(g.price)} 🪙`}</button>`}</div></div>`;
}
function kvShopHtml() {
  if (!KV.d) { kvLoad(); return '<div class="fv-card"><h2>🧰 Kalamehe varustus</h2><p class="lead">Laen varustust…</p></div>' }
  const grp = k => { const list = KV.d.gear.filter(g => g.kind === k), kit = kvKit(k), K = KV_KIND[k];
    return `<div class="kv-grp"><h3>${K.ic} ${K.n}${kit ? ' <span class="pill ok">Olemas</span>' : ''}</h3><p class="job"><b>Ülesanne:</b> ${K.job}</p><div class="kv-tiers">${list.map(g => kvItemCard(g, kit && kit.id === g.id)).join('')}</div></div>` };
  return `<div class="fv-card"><h2>🧰 Kalamehe varustus</h2><p class="lead">Päris kalamehe abivahendid. Igaüks teeb kindlat tööd ja mõjub püügile kohe pärast ostmist. Kui sul on sama asja mitu, kasutatakse kõige paremat.</p><div style="display:grid;gap:10px">${KV_HELP.map(grp).join('')}</div></div>
    <div class="fv-card"><h2>🪤 Püünised</h2><p class="lead">Püünis töötab ise: pane vette, tee vahepeal muid asju ja tule saaki välja võtma vahekaardil „Püünised“. Igat liiki püünist saab korraga vees olla üks.</p><div style="display:grid;gap:10px">${KV_TRAPS.map(grp).join('')}</div></div>`;
}
function tabPuunised() {
  KV.objs = [];
  if (!KV.d) { kvLoad(); return '<div class="fv-card"><p class="lead">Laen püüniseid…</p></div>' }
  const d = KV.d, now = kvNow(), lic = kvLic();
  let h = `<div class="kv-hero">${kvCv({ draw: kvHeroDraw })}<div class="ttl"><h2>Püünised</h2><small>${(d.traps || []).length}/4 vees · jõevähke püütud ${d.vahk}</small></div></div>`;
  h += `<div class="kv-lic"><span class="em">🐟</span><div><h3>KALASTUSKAART</h3><p>Nakkevõrguga püüdmiseks on vaja kehtivat kalastuskaarti – nii nagu päris elus. Kehtib 7 päeva.</p>
    <p class="st ${lic ? 'ok' : 'no'}">${lic ? `✓ Kehtib kuni ${new Date(lic).toLocaleString('et-EE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : '✗ Kalastuskaarti pole'}</p></div>
    <button class="btn sm" type="button" data-kv="lic" ${FS.gold >= d.license_price && !KV.busy && !(lic && Date.parse(lic) - now > 7 * 864e5) ? '' : 'disabled'}>${lic ? 'Pikenda' : 'Osta'} · ${d.license_price} 🪙</button></div>`;
  h += `<div class="fv-card"><h2>Sinu püünised</h2><p class="lead">Vali koht, pane püünis vette ja tule hiljem tagasi. Püünisest tulnud kalad lähevad saaki ja kalaraamatusse, aga ülesannete püügiarvestusse lähevad ainult õngega püütud kalad.</p><div class="kv-traps">${KV_TRAPS.map(k => {
    const K = KV_KIND[k], kit = kvKit(k), tr = (d.traps || []).find(q => q.kind === k);
    if (!kit) { const g1 = KV.d.gear.find(g => g.kind === k && g.tier === 1); return `<div class="kv-trap"><div class="top">${gearCv('kit', g1.id, 'kitcv')}<div><b>${K.ic} ${K.n}</b><small>${K.job}</small></div></div><button class="btn sm ghost" type="button" data-kv="shop">Osta poest · ${fmt(g1.price)} 🪙 (${g1.min_level}. tase)</button></div>` }
    if (tr) { const t0 = Date.parse(tr.set_at), t1 = Date.parse(tr.ready_at), ready = now >= t1, p = Math.min(1, (now - t0) / Math.max(1, t1 - t0));
      return `<div class="kv-trap ${ready ? 'ready' : ''}" data-kvt="${tr.id}" data-t0="${t0}" data-t1="${t1}"><div class="top">${gearCv('kit', kit.id, 'kitcv')}<div><b>${K.ic} ${esc(kvGear(kit.id).name)}</b><small>📍 ${esc(FD.spot[tr.spot] ? FD.spot[tr.spot].name : tr.spot)}</small><small data-kvl>${ready ? '✓ Saak ootab!' : 'Valmis ' + kvLeft(t1 - now) + ' pärast'}</small></div></div>
        <div class="kv-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
        ${ready ? `<button class="btn" type="button" data-kv="collect" data-arg="${tr.id}" ${KV.busy ? 'disabled' : ''}>Tõmba välja</button>` : `<button class="btn sm ghost" type="button" data-kv="lift" data-arg="${tr.id}">${KV.conf === 'lift' + tr.id ? 'Kinnita: võta tühjalt välja' : 'Võta tühjalt välja'}</button>`}</div>` }
    const spots = d.spots[k] || [], sel = KV.pick[k] && spots.includes(KV.pick[k]) ? KV.pick[k] : spots.includes(FV.spot) && FD.spot[FV.spot] && FD.spot[FV.spot].min_level <= FS.level ? FV.spot : spots.find(x => FD.spot[x] && FD.spot[x].min_level <= FS.level);
    const needLic = k === 'vork' && !lic;
    return `<div class="kv-trap"><div class="top">${gearCv('kit', kit.id, 'kitcv')}<div><b>${K.ic} ${esc(kvGear(kit.id).name)}</b><small>${kvEff(kvGear(kit.id)).join(' · ')}</small></div></div>
      <div class="kv-spots">${spots.map(x => { const ok = FD.spot[x] && FD.spot[x].min_level <= FS.level; return `<button type="button" class="${x === sel ? 'on' : ''}" data-kv="spot" data-kind="${k}" data-arg="${x}" ${ok ? '' : 'disabled'}>${ok ? '' : '🔒 '}${esc(FD.spot[x] ? FD.spot[x].name : x)}</button>` }).join('')}</div>
      ${needLic ? '<small style="color:#ffb3a0">Võrgu jaoks osta enne kalastuskaart.</small>' : ''}
      <button class="btn" type="button" data-kv="set" data-kind="${k}" data-arg="${sel || ''}" ${sel && !needLic && !KV.busy ? '' : 'disabled'}>Pane vette</button></div>`;
  }).join('')}</div></div>`;
  return h;
}

/* ---------- tühjendamise animatsioon ---------- */
function kvCollectShow(col) {
  const fish = col.fish || [], kind = col.kind, kit = kvKit(kind), tier = kit ? kit.tier : 1, t0 = performance.now();
  const title = !fish.length ? 'Seekord jäi püünis tühjaks' : kind === 'loks' ? (fish.filter(f => f.species === 'vahk').length >= 5 ? 'Mõrd on vähke täis!' : 'Vähid käes!') : fish.length >= 5 ? 'Rikkalik saak!' : 'Püünis tühjendatud!';
  showModal(() => `<div class="kv-res"><canvas class="kv-rcv"></canvas><h2>${title}</h2><p class="lead" style="text-align:center">${esc(KV_KIND[kind].n)} · ${esc(FD.spot[col.spot] ? FD.spot[col.spot].name : col.spot)} · +${col.xp} kogemust</p>
    <div class="kv-fish">${fish.map((f, i) => `<div style="animation-delay:${(1.3 + i * .15).toFixed(2)}s"><canvas data-fl="${f.species}" data-r="${f.rarity}" data-unk="0"></canvas><b>${esc(f.name)}</b><span>${fKg(+f.weight)}</span></div>`).join('')}</div>
    <div class="mbtns"><button class="btn ghost" type="button" data-kv="again" data-kind="${kind}" data-arg="${col.spot}">Pane uuesti vette</button><button class="btn" type="button" data-act="closeModal">Valmis</button></div></div>`);
  setTimeout(() => { const mc = document.querySelector('#modalCard'); if (mc) paintFishCanvases(mc) }, 30);
  const loop = ts => { const cv = document.querySelector('#modalCard canvas.kv-rcv'); if (!cv) return; const w = cv.clientWidth, h = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    const t = ts / 1000, k = Math.min(1, (ts - t0) / 1300), e = 1 - Math.pow(1 - k, 3), sY = h * .55;
    let g = c.createLinearGradient(0, 0, 0, sY); g.addColorStop(0, '#9ad0e8'); g.addColorStop(1, '#e0f2f6'); c.fillStyle = g; c.fillRect(0, 0, w, sY);
    g = c.createLinearGradient(0, sY, 0, h); g.addColorStop(0, '#2f7a94'); g.addColorStop(1, '#0e3444'); c.fillStyle = g; c.fillRect(0, sY, w, h - sY);
    const S = Math.min(w * .5, h * .9), y = h * 1.05 - e * (h * 1.05 - h * .4);
    c.save(); c.translate(w / 2, y); drawKit(c, S, kind, tier, t); c.restore();
    // vesi tilgub ja pritsib
    if (k > .55) { for (let i = 0; i < 18; i++) { const p = ((t * 1.3 + i / 18) % 1); c.fillStyle = `rgba(200,240,255,${(1 - p) * .8})`; c.beginPath(); c.arc(w / 2 - S * .4 + (i * 53 % 100) / 100 * S * .8, h * .4 + S * .2 + p * (sY - h * .4), 1.6, 0, 6.283); c.fill() } }
    const ring = Math.min(1, Math.max(0, (k - .35) / .65)); if (ring > 0 && ring < 1) { c.strokeStyle = `rgba(255,255,255,${1 - ring})`; c.lineWidth = 2; c.beginPath(); c.ellipse(w / 2, sY, S * (.3 + ring * .6), 6 + ring * 10, 0, 0, 6.283); c.stroke() }
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5; c.beginPath(); for (let x = 0; x <= w; x += 8) { const yy = sY + Math.sin(x * .05 + t * 2) * 2; x ? c.lineTo(x, yy) : c.moveTo(x, yy) } c.stroke();
    if (k >= 1 && fish.length) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const a = t * 1.5 + i * .4, r = S * .45 + Math.sin(t * 3 + i) * 6; c.fillStyle = 'rgba(255,230,150,.7)'; c.beginPath(); c.arc(w / 2 + Math.cos(a) * r, h * .4 + Math.sin(a) * r * .4, 1.8, 0, 6.283); c.fill() } c.restore() }
    requestAnimationFrame(loop) };
  requestAnimationFrame(loop);
}

/* ---------- püügistseen: püünised vees, varustus kaldal, efektid ---------- */
{
  const baseBackK = drawBackdrop;
  drawBackdrop = function (c, w, h, t, night, d, wTop, wBot) {
    baseBackK(c, w, h, t, night, d, wTop, wBot);
    const traps = (KV.d && KV.d.traps || []).filter(q => q.spot === FV.spot); if (!traps.length) return;
    const pos = { vork: [.14, .4], mord: [.52, .37], katiska: [.68, .4], loks: [.94, .47] };
    traps.forEach((q, i) => { const [px, py] = pos[q.kind] || [.5, .4], x = w * px, y = h * py + Math.sin(t * 1.4 + i) * 1.5, r = Math.max(2.5, w * .006);
      if (q.kind === 'vork') { for (let j = 0; j < 6; j++) kvFloat(c, x + j * r * 3.4, y + Math.sin(t * 1.4 + j) * 1, r, j % 2 ? '#ff8a2a' : '#f4f4ec') }
      else { kvFloat(c, x, y, r * 1.4, q.kind === 'mord' ? '#ff5a2a' : q.kind === 'loks' ? '#ffd02a' : '#f4f4ec'); c.strokeStyle = '#222'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x, y - r * 5); c.stroke(); c.fillStyle = q.kind === 'mord' ? '#ff3a2a' : '#2a6aff'; c.beginPath(); c.moveTo(x, y - r * 5); c.lineTo(x + r * 3, y - r * 4); c.lineTo(x, y - r * 3); c.fill() }
      if (Date.parse(q.ready_at) <= kvNow()) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, x, y, r * 6, '#ffd27a', .35 + .2 * Math.sin(t * 3)); c.restore() } });
  };
  const baseFxK = drawFx;
  drawFx = function (c, w, h, dt, t) {
    const now = performance.now(), sc = Math.min(1, w / 700);
    // ridvahoidja + teine õng (paremal)
    const ho = kvKit('hoidja');
    if (ho) {
      const bell = now - KV.bellAt < 1600, bx = w * .97, by = h * .99, tip = [w * .74 + (bell ? Math.sin(t * 30) * 4 : 0), h * .26 + (bell ? 10 + Math.sin(t * 25) * 6 : 0)];
      c.save(); c.lineCap = 'round'; c.strokeStyle = '#6a6f74'; c.lineWidth = 3 * sc + 1; c.beginPath(); c.moveTo(w * .9, h * 1.02); c.lineTo(w * .9, h * .8); c.stroke();
      c.strokeStyle = '#2a3a4a'; c.lineWidth = 4 * sc + 1; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(w * .86, h * .6, tip[0], tip[1]); c.stroke();
      c.strokeStyle = 'rgba(240,240,240,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(w * .76, h * .42, w * .8, h * .55); c.stroke();
      kvFloat(c, w * .8, h * .55 + Math.sin(t * 2) * 1.5 + (bell ? Math.sin(t * 30) * 3 : 0), 3 * sc + 1.5, '#ff4a2a');
      c.fillStyle = '#d8b040'; c.beginPath(); c.arc(tip[0] + 3, tip[1] + 5, 3.5 * sc + 1.5, 0, 6.283); c.fill();
      if (bell) { c.globalCompositeOperation = 'lighter'; glowAt(c, tip[0] + 3, tip[1] + 5, 18, '#ffe08a', .6); }
      c.restore();
    }
    // ämber ja kahv kaldal
    const am = kvKit('ammber'); if (am) { c.save(); c.translate(w * .86, h * .93); drawKit(c, h * .18, 'ammber', am.tier, t); c.restore() }
    const kh = kvKit('kahv'), net = now - KV.netAt < 1500;
    if (kh) { c.save(); if (net) { const p = (now - KV.netAt) / 1500, a = Math.sin(p * Math.PI); c.translate(w * .72 - a * w * .1, h * .86 - a * h * .3); c.rotate(-a * .6) } else { c.translate(w * .74, h * .86); c.rotate(.35) } drawKit(c, h * .34, 'kahv', kh.tier, t); c.restore() }
    const su = kvKit('sump'); if (su) { c.save(); c.globalAlpha = .85; c.translate(w * .62, h * .97); drawKit(c, h * .28, 'sump', su.tier, t); c.restore() }
    baseFxK(c, w, h, dt, t);
  };
  const baseLandK2 = fxLand;
  fxLand = function (r) {
    baseLandK2(r);
    if (!r || r.kind !== 'fish') return;
    if (r.net) { KV.netAt = performance.now(); fxText(FX.w / 2, FX.h * .3, '🥅 KAHV PÄÄSTIS!', '#9ff0c8', 24); if (typeof sfx === 'function') sfx('chime') }
    if (r.second) { setTimeout(() => { KV.bellAt = performance.now(); fxText(FX.w * .75, FX.h * .22, '🔔 TEINE ÕNG!', '#ffe27a', 22); fxDrops(FX.w * .8, FX.h * .55, 14); if (typeof sfx === 'function') sfx('coin');
      toast(`Teise õnge otsa tuli ka ${r.second.name.toLowerCase()}: ${fKg(+r.second.weight)}!`, 'good', 'fish') }, 1600) }
  };
  const baseRpcK = rpc;
  rpc = async function (fn, args) {
    const r = await baseRpcK(fn, args);
    try { if (fn === 'fish_cast' && r && r.bait_saved) { KV.saveAt = performance.now(); setTimeout(() => fxText(FX.w * .86, FX.h * .7, '🪣 Sööt jäi alles', '#cdf3ff', 15), 200) } } catch (e) { }
    return r;
  };
  const baseTabPoodK = tabPood;
  tabPood = function () { return baseTabPoodK() + kvShopHtml() };
  FTAB_FN.puunised = tabPuunised;
  const baseRenderK = renderFV;
  renderFV = function (force) { baseRenderK(force); if (FV.open && FV.tab === 'puunised' && !KV.raf) KV.raf = requestAnimationFrame(kvPaint) };
  const baseBadgesK = fvBadges;
  fvBadges = function () { const b = baseBadgesK(); const n = KV.d ? (KV.d.traps || []).filter(q => Date.parse(q.ready_at) <= kvNow()).length : 0; if (n) b.puunised = n; return b };
  if (typeof remTodo === 'function') {
    const baseTodoK = remTodo;
    remTodo = function () {
      const r = baseTodoK(); if (!KV.d) return r;
      const tr = KV.d.traps || [], rd = tr.filter(q => Date.parse(q.ready_at) <= kvNow()).length, owned = KV_TRAPS.filter(k => kvKit(k)).length;
      if (rd) r.T.unshift({ c: '#ffd27a', claim: true, t: rd === 1 ? 'Püünis on valmis – tõmba välja' : `${rd} püünist on valmis`, tab: 'puunised', b: 'Vaata' });
      else if (owned > tr.length) r.T.push({ c: '#4ac0d8', t: 'Püünised', s: `${owned - tr.length} püünist ootab vettepanekut`, tab: 'puunised', b: 'Ava' });
      return r;
    };
  }
  const baseRefreshK = refreshFS;
  refreshFS = async function () { const r = await baseRefreshK(); if (!KV.d && !KV.loading && CL.user) kvLoad(); return r };
}

/* ---------- tegevused ---------- */
async function kvAct(a, el) {
  const arg = el.dataset.arg, kind = el.dataset.kind;
  if (a === 'spot') { KV.pick[kind] = arg; return renderFV(true) }
  if (a === 'shop') { FV.tab = 'pood'; renderFV(true); setTimeout(() => { const g = document.querySelector('#fishView .kv-grp:nth-of-type(1)'); const t2 = [...document.querySelectorAll('#fishView .fv-card h2')].find(x => x.textContent.includes('Püünised')); if (t2) t2.scrollIntoView({ block: 'start' }) }, 80); return }
  if ((a === 'buy' || a === 'lift') && KV.conf !== a + arg) { KV.conf = a + arg; return renderFV(true) }
  if (KV.busy) return;
  const fn = { buy: 'gear_buy', lic: 'license_buy', set: 'trap_set', again: 'trap_set', lift: 'trap_lift', collect: 'trap_collect' }[a]; if (!fn) return;
  const args = a === 'buy' ? { p_id: arg } : a === 'set' || a === 'again' ? { p_kind: kind, p_spot: arg } : a === 'lic' ? {} : { p_id: +arg };
  if (a === 'again') closeModal();
  KV.busy = true; renderFV(true);
  try {
    const r = await rpc(fn, args); const { bought, collected, lvlup, ach, license, set, ...st } = r; kvSet(st); KV.conf = null;
    if (bought) { const g = kvGear(bought); toast(`Ostsid: ${g ? g.name : bought}`, 'good', 'fish'); if (typeof sfx === 'function') sfx('coin') }
    if (license) { toast('Kalastuskaart on olemas! Nüüd võid võrgu vette panna.', 'good', 'fish'); if (typeof sfx === 'function') sfx('chime') }
    if (set) { toast(`${KV_KIND[set].n} on vees. Tule hiljem tagasi!`, 'info', 'fish'); if (typeof sfx === 'function') sfx('pop') }
    if (collected) { kvCollectShow(collected); if (typeof sfx === 'function') sfx(collected.fish.length ? 'levelup' : 'pop') }
    await refreshFS();
    if (lvlup && lvlup.length && typeof afterLevels === 'function') afterLevels(lvlup);
    if (ach && ach.length && typeof afterAch === 'function') afterAch(ach);
  } catch (e) { toast(e.message, 'bad') }
  KV.busy = false; renderFV(true);
}
document.addEventListener('click', e => { const el = e.target.closest('[data-kv]'); if (!el || el.disabled) return; kvAct(el.dataset.kv, el) });
document.addEventListener('click', e => { const t = e.target.closest('[data-fa="tab"][data-arg="puunised"],[data-fa="tab"][data-arg="pood"]'); if (t) kvLoad() });
setInterval(() => {
  if (!KV.d || !(KV.d.traps || []).length) return;
  const now = kvNow();
  if ((KV.d.traps || []).some(q => !q.ready && Date.parse(q.ready_at) <= now)) { KV.d.traps.forEach(q => { if (Date.parse(q.ready_at) <= now) q.ready = true }); if (FV.open) renderFV(true); return }
  if (!FV.open || FV.tab !== 'puunised') return;
  document.querySelectorAll('[data-kvt]').forEach(n => { const t0 = +n.dataset.t0, t1 = +n.dataset.t1, b = n.querySelector('.kv-bar i'), l = n.querySelector('[data-kvl]'); if (b) b.style.width = (Math.min(1, (now - t0) / Math.max(1, t1 - t0)) * 100).toFixed(1) + '%'; if (l && now < t1) l.textContent = 'Valmis ' + kvLeft(t1 - now) + ' pärast' });
}, 1000);
