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
// varustuse pildid; keskel (0,0), laius ~S
function drawKit(c, S, kind, tier, t) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const sway = Math.sin(t * 1.6) * .03;
  if (kind === 'kahv') {
    const hc = tier === 1 ? '#8a5a2e' : tier === 2 ? '#b8c2c8' : '#2a2f33';
    c.strokeStyle = hc; c.lineWidth = S * .045; c.beginPath(); c.moveTo(-S * .44, S * .4); c.lineTo(S * .02, -S * .04); c.stroke();
    if (tier === 2) { c.strokeStyle = '#7d878e'; c.lineWidth = S * .055; [[-.3, .27], [-.14, .12]].forEach(([x, y]) => { c.beginPath(); c.moveTo(S * x, S * y); c.lineTo(S * (x + .03), S * (y - .03)); c.stroke() }) }
    if (tier !== 2) { c.strokeStyle = tier === 3 ? '#3f8a4a' : '#5a3a1a'; c.lineWidth = S * .06; c.beginPath(); c.moveTo(-S * .44, S * .4); c.lineTo(-S * .34, S * .31); c.stroke() }
    // võrgukott
    const hx = S * .2, hy = -S * .14;
    c.save(); c.translate(hx, hy); c.rotate(-.25 + sway);
    const bag = () => { c.beginPath(); c.moveTo(-S * .2, 0); c.bezierCurveTo(-S * .18, S * .28, S * .05, S * .42, S * .04, S * .44); c.bezierCurveTo(S * .1, S * .3, S * .2, S * .16, S * .2, 0); c.closePath() };
    bag(); c.fillStyle = tier === 3 ? 'rgba(60,90,70,.35)' : 'rgba(40,40,40,.25)'; c.fill(); c.save(); bag(); c.clip(); kvMesh(c, -S * .25, -S * .02, S * .25, S * .46, S * .045, tier === 3 ? 'rgba(120,190,130,.85)' : 'rgba(230,230,220,.7)', tier === 3 ? 1.5 : .8); c.restore();
    bag(); c.strokeStyle = tier === 3 ? 'rgba(120,190,130,.9)' : 'rgba(230,230,220,.7)'; c.lineWidth = 1; c.stroke();
    c.strokeStyle = tier === 1 ? '#6a6a6a' : tier === 2 ? '#d8dee2' : '#1e2326'; c.lineWidth = S * .025; c.beginPath(); c.ellipse(0, 0, S * .2, S * .07, 0, 0, 6.283); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -1, S * .2, S * .07, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.restore();
  } else if (kind === 'korv') {
    c.strokeStyle = 'rgba(230,230,220,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -S * .45); c.lineTo(0, -S * .28); c.stroke();
    c.save(); c.rotate(sway * 2);
    if (tier === 1) {
      const w = S * .26, h = S * .46, x = -w / 2, y = -S * .26;
      c.fillStyle = '#6a4a26'; for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(x + 4 + (i * 37 % (w - 8)), y + 6 + (i * 53 % (h - 12)), 2 + (i % 3), 0, 6.283); c.fill() }
      c.fillStyle = 'rgba(160,120,60,.55)'; c.fillRect(x + 3, y + h * .35, w - 6, h * .6);
      c.strokeStyle = '#c8ccd0'; c.lineWidth = 1.2; for (let i = 0; i <= 6; i++) { c.beginPath(); c.moveTo(x, y + i * h / 6); c.lineTo(x + w, y + i * h / 6); c.stroke() } for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(x + i * w / 4, y); c.lineTo(x + i * w / 4, y + h); c.stroke() }
      c.fillStyle = metalGrad(c, x, 0, x + w, 0, '#4a4f55'); c.fillRect(x - 2, y + h - S * .06, w + 4, S * .07);
      c.strokeStyle = '#d8dcdf'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, y - 4, 4, 0, 6.283); c.stroke();
    } else {
      c.fillStyle = '#2b2f33'; c.beginPath(); c.ellipse(0, 0, S * .2, S * .27, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#5a6066'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * S * .07, -S * .24); c.lineTo(i * S * .07, S * .24); c.stroke() }
      const g = c.createRadialGradient(-S * .05, -S * .06, 2, 0, 0, S * .2); g.addColorStop(0, '#f0d080'); g.addColorStop(1, '#a88430'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, S * .15, S * .2, 0, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(80,50,10,.35)'; for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(-S * .1 + (i * 37 % 20) * S * .01, -S * .14 + (i * 53 % 28) * S * .01, 1.4, 0, 6.283); c.fill() }
      c.fillStyle = '#ffd34a'; c.beginPath(); c.ellipse(S * .05, S * .3, S * .035, S * .045, 0, 0, 6.283); c.fill();
      c.strokeStyle = '#ccd'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(S * .02, S * .24); c.quadraticCurveTo(-S * .02, S * .36, S * .05, S * .38); c.stroke();
    }
    c.restore();
  } else if (kind === 'hoidja') {
    c.fillStyle = '#4a6a2e'; c.beginPath(); c.ellipse(0, S * .42, S * .48, S * .07, 0, 0, 6.283); c.fill();
    const rod = (x0, y0, x1, y1, col) => { c.strokeStyle = col; c.lineWidth = S * .025; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#1a1a1a'; c.lineWidth = S * .04; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (x1 - x0) * .2, y0 + (y1 - y0) * .2); c.stroke(); c.fillStyle = metalGrad(c, x0, y0, x0 + 8, y0, '#9aa'); c.beginPath(); c.arc(x0 + (x1 - x0) * .12, y0 + (y1 - y0) * .12 + S * .03, S * .045, 0, 6.283); c.fill() };
    if (tier === 1) {
      c.strokeStyle = '#8a8f94'; c.lineWidth = S * .03; c.beginPath(); c.moveTo(S * .05, S * .44); c.lineTo(S * .05, -S * .05); c.stroke();
      c.strokeStyle = '#5a5f64'; c.lineWidth = S * .025; c.beginPath(); c.moveTo(-S * .03, -S * .12); c.lineTo(S * .05, -S * .04); c.lineTo(S * .13, -S * .12); c.stroke();
      rod(-S * .42, S * .3, S * .46, -S * .38 + Math.sin(t * 1.3) * 2, '#2a3a4a');
    } else {
      c.strokeStyle = '#3a3f44'; c.lineWidth = S * .03; [[-.35, .44, -.1, -.1], [.35, .44, .1, -.1], [0, .46, 0, -.1]].forEach(([a, b, d2, e]) => { c.beginPath(); c.moveTo(S * a, S * b); c.lineTo(S * d2, S * e); c.stroke() });
      c.strokeStyle = '#5a5f64'; c.lineWidth = S * .025; c.beginPath(); c.moveTo(-S * .3, -S * .08); c.lineTo(S * .3, -S * .08); c.stroke();
      rod(-S * .46, S * .22, S * .4, -S * .42, '#3a2a4a'); rod(-S * .3, S * .3, S * .48, -S * .3, '#2a4a3a');
      [-.16, .16].forEach((x, i) => { c.fillStyle = '#1e2226'; c.fillRect(S * x - S * .05, -S * .16, S * .1, S * .07); const on = (Math.floor(t * 2) + i) % 3 === 0; c.fillStyle = on ? '#ff3a3a' : '#5a1a1a'; c.beginPath(); c.arc(S * x, -S * .125, S * .015, 0, 6.283); c.fill(); if (on) glowAt(c, S * x, -S * .125, S * .06, '#ff3a3a', .6) });
    }
  } else if (kind === 'sump') {
    const n = tier === 1 ? 5 : 7, len = S * (tier === 1 ? .8 : .92);
    c.save(); c.rotate(-.18);
    { const wg = c.createLinearGradient(0, S * .02, 0, S * .32); wg.addColorStop(0, 'rgba(90,170,200,.45)'); wg.addColorStop(1, 'rgba(90,170,200,0)'); c.fillStyle = wg; c.beginPath(); c.moveTo(-S * .5, S * .02); for (let x = -S * .5; x <= S * .5; x += 6) c.lineTo(x, S * .02 + Math.sin(x * .1 + t * 2) * 1.5); c.lineTo(S * .5, S * .32); c.lineTo(-S * .5, S * .32); c.fill() }
    for (let i = 0; i < 3; i++) { const x = -len / 2 + len * (.25 + i * .25) + Math.sin(t + i) * 4; c.save(); c.globalAlpha = .55; c.fillStyle = '#2a3a3a'; c.beginPath(); c.ellipse(x, S * .06 + i * 3, S * .07, S * .025, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(x + S * .06, S * .06 + i * 3); c.lineTo(x + S * .1, S * .03 + i * 3); c.lineTo(x + S * .1, S * .09 + i * 3); c.fill(); c.restore() }
    for (let i = 0; i < n; i++) { const x = -len / 2 + i * len / (n - 1), r = S * (.17 - i * .012); c.strokeStyle = tier === 1 ? '#e0e0d8' : '#c8d8e0'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, S * .05, r * .32, r, 0, 0, 6.283); c.stroke() }
    c.strokeStyle = tier === 1 ? 'rgba(40,80,40,.75)' : 'rgba(30,50,60,.75)'; c.lineWidth = 1;
    for (let k = -4; k <= 4; k++) { c.beginPath(); for (let i = 0; i < n; i++) { const x = -len / 2 + i * len / (n - 1), r = S * (.17 - i * .012); const y = S * .05 + r * k / 4.3; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke() }
    c.strokeStyle = 'rgba(200,240,255,.7)'; c.lineWidth = 1.5; c.beginPath(); for (let x = -S * .5; x <= S * .5; x += 6) { const y = S * .02 + Math.sin(x * .1 + t * 2) * 1.5; x === -S * .5 ? c.moveTo(x, y) : c.lineTo(x, y) } c.stroke();
    c.restore();
  } else if (kind === 'ammber') {
    const top = -S * .2, bot = S * .38, wt = S * .3, wb = S * .23, col = tier === 1 ? '#3a8a4a' : '#e8eef0';
    if (tier === 2) { c.strokeStyle = '#6a8090'; c.lineWidth = 2; c.beginPath(); c.moveTo(S * .42, S * .3); c.quadraticCurveTo(S * .42, -S * .3, S * .05, -S * .15); c.stroke(); c.fillStyle = '#2a3a4a'; c.fillRect(S * .33, S * .24, S * .16, S * .14); c.fillStyle = '#5ad0ff'; c.fillRect(S * .36, S * .27, S * .04, S * .02) }
    const g = c.createLinearGradient(-wt, 0, wt, 0); g.addColorStop(0, mixC(col, '#000000', .35)); g.addColorStop(.4, col); g.addColorStop(.7, mixC(col, '#ffffff', .25)); g.addColorStop(1, mixC(col, '#000000', .3)); c.fillStyle = g;
    c.beginPath(); c.moveTo(-wt, top); c.lineTo(wt, top); c.lineTo(wb, bot); c.lineTo(-wb, bot); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let i = 1; i <= 2; i++) { const y = top + (bot - top) * i / 3, ww = wt - (wt - wb) * i / 3; c.beginPath(); c.moveTo(-ww, y); c.lineTo(ww, y); c.stroke() }
    c.fillStyle = '#3a2a1a'; c.beginPath(); c.ellipse(0, top, wt, S * .06, 0, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(80,140,150,.85)'; c.beginPath(); c.ellipse(0, top + 2, wt * .9, S * .045, 0, 0, 6.283); c.fill();
    c.strokeStyle = '#e88a8a'; c.lineWidth = S * .022; for (let i = 0; i < 4; i++) { const x = -wt * .6 + i * wt * .4, ph = t * 3 + i * 1.7; c.beginPath(); c.moveTo(x, top + 2); c.bezierCurveTo(x + 6, top - 8 + Math.sin(ph) * 4, x + 12, top + 6, x + 16, top - 2 + Math.cos(ph) * 3); c.stroke() }
    if (tier === 2) { c.fillStyle = 'rgba(220,250,255,.8)'; for (let i = 0; i < 5; i++) { const p = (t * .8 + i / 5) % 1; c.beginPath(); c.arc(-wt * .3 + i * 6, top + 2 - p * 10, 1.4, 0, 6.283); c.fill() } }
    c.strokeStyle = tier === 1 ? '#2a5a32' : '#9aa6ae'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-wt * .95, top); c.quadraticCurveTo(0, top - S * .4, wt * .95, top); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-wt * .55, top + 6); c.lineTo(-wt * .4, top + 6); c.lineTo(-wb * .35, bot - 4); c.lineTo(-wb * .5, bot - 4); c.fill();
  } else if (kind === 'vork') {
    const n = tier === 1 ? 6 : 9, x0 = -S * .46, x1 = S * .46, y0 = -S * .22, y1 = S * .34;
    c.beginPath(); c.moveTo(x0, y0); for (let i = 0; i <= 10; i++) c.lineTo(x0 + (x1 - x0) * i / 10, y0 + Math.sin(t * 1.5 + i) * 2); c.lineTo(x1, y1); c.lineTo(x0, y1); c.closePath();
    c.fillStyle = 'rgba(30,60,60,.25)'; c.fill(); c.save(); c.clip(); kvMesh(c, x0, y0 - 4, x1, y1, S * .055, 'rgba(220,235,230,.65)', .8); c.restore();
    c.save(); c.translate(-S * .05, S * .08); c.rotate(.1); c.fillStyle = '#9aa9a4'; c.beginPath(); c.ellipse(0, 0, S * .1, S * .035, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(S * .09, 0); c.lineTo(S * .14, -S * .03); c.lineTo(S * .14, S * .03); c.fill(); c.restore();
    c.strokeStyle = '#d8d0b8'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.stroke(); c.strokeStyle = '#3a3a3a'; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x1, y1); c.stroke();
    for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + .5) / n; kvFloat(c, x, y0 + Math.sin(t * 1.5 + i) * 2, S * .03, i % 2 ? '#ff8a2a' : '#f4f4ec') }
    for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + .5) / n; c.fillStyle = '#2a2a2a'; c.beginPath(); c.ellipse(x, y1, S * .018, S * .012, 0, 0, 6.283); c.fill() }
  } else if (kind === 'mord') {
    const n = tier === 1 ? 5 : 6, x0 = -S * .2, x1 = S * .46;
    c.fillStyle = 'rgba(30,60,60,.2)'; c.beginPath(); c.moveTo(-S * .48, -S * .3); c.lineTo(x0, -S * .18); c.lineTo(x0, S * .18); c.lineTo(-S * .48, S * .3); c.closePath(); c.fill(); c.save(); c.clip(); kvMesh(c, -S * .5, -S * .32, x0, S * .32, S * .05, 'rgba(220,235,230,.55)'); c.restore();
    c.strokeStyle = '#d8d0b8'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-S * .48, -S * .3); c.lineTo(x0, -S * .18); c.moveTo(-S * .48, S * .3); c.lineTo(x0, S * .18); c.stroke();
    const rr = i => S * (.2 - i * (tier === 1 ? .025 : .022));
    for (let k = -4; k <= 4; k++) { c.strokeStyle = 'rgba(40,70,60,.7)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1), y = rr(i) * k / 4.4; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.stroke() }
    c.strokeStyle = 'rgba(240,240,230,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, -rr(0) * .6); c.lineTo(x0 + (x1 - x0) * .4, 0); c.lineTo(x0, rr(0) * .6); c.stroke();
    for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1); c.strokeStyle = tier === 1 ? '#c8a878' : '#9ab0b8'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(x, 0, rr(i) * .3, rr(i), 0, 0, 6.283); c.stroke() }
    c.strokeStyle = '#d8d0b8'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x1, 0); c.lineTo(x1 + S * .05, -S * .02); c.lineTo(x1 + S * .02, -S * .44); c.stroke(); kvFloat(c, x1 + S * .02, -S * .44 + Math.sin(t * 1.5) * 2, S * .045, '#ff6a2a');
  } else if (kind === 'katiska') {
    const box = (ox, oy, s2) => {
      const w = S * .58 * s2, h = S * .32 * s2, d2 = S * .14 * s2, x = ox - w / 2, y = oy - h / 2;
      c.fillStyle = 'rgba(30,50,50,.25)'; c.fillRect(x, y, w, h);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.strokeStyle = 'rgba(200,210,210,.8)'; c.lineWidth = .9; for (let i = 0; i <= w; i += S * .04) { c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y + h); c.stroke() } for (let i = 0; i <= h; i += S * .04) { c.beginPath(); c.moveTo(x, y + i); c.lineTo(x + w, y + i); c.stroke() }
      for (let i = 0; i < 3; i++) { const fx = x + w * (.3 + i * .2) + Math.sin(t * 1.5 + i) * 5; c.fillStyle = i === 1 ? '#7a8a6a' : '#9aa89a'; c.beginPath(); c.ellipse(fx, y + h * (.4 + i * .12), S * .045 * s2, S * .016 * s2, 0, 0, 6.283); c.fill() } c.restore();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + d2, y - d2 * .6); c.lineTo(x + w + d2, y - d2 * .6); c.lineTo(x + w, y); c.closePath(); c.fillStyle = 'rgba(200,210,210,.18)'; c.fill(); c.strokeStyle = 'rgba(220,230,230,.85)'; c.lineWidth = 1.4; c.stroke();
      c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w + d2, y - d2 * .6); c.lineTo(x + w + d2, y + h - d2 * .6); c.lineTo(x + w, y + h); c.closePath(); c.fillStyle = 'rgba(160,170,170,.2)'; c.fill(); c.stroke();
      c.strokeRect(x, y, w, h);
      [[x, y + h / 2], [x + w + d2 * .5, y + h / 2 - d2 * .3]].forEach(([fx, fy]) => { c.fillStyle = 'rgba(10,20,20,.6)'; c.beginPath(); c.ellipse(fx, fy, S * .025 * s2, h * .28, 0, 0, 6.283); c.fill(); c.strokeStyle = '#dde'; c.stroke() });
    };
    if (tier === 2) { box(-S * .06, -S * .14, .8); box(S * .02, S * .16, .8) } else box(0, S * .02, 1);
  } else if (kind === 'loks') {
    const trap = (ox, oy, s2, ph) => {
      const w = S * .66 * s2, r = S * .2 * s2;
      c.save(); c.translate(ox, oy);
      const bg = c.createLinearGradient(0, -r, 0, r); bg.addColorStop(0, 'rgba(70,110,110,.35)'); bg.addColorStop(1, 'rgba(20,40,40,.55)'); c.fillStyle = bg; c.fillRect(-w / 2, -r, w, r * 2);
      c.save(); c.beginPath(); c.rect(-w / 2, -r, w, r * 2); c.clip(); c.translate(Math.sin(t + ph) * 3, r * .15); drawCrayfish(c, w * .78, t + ph); c.restore();
      c.save(); c.beginPath(); c.rect(-w / 2, -r, w, r * 2); c.clip(); kvMesh(c, -w / 2, -r, w / 2, r, S * .045 * s2, 'rgba(25,30,28,.75)', .9); c.restore();
      c.strokeStyle = '#1e2422'; c.lineWidth = 2.2; c.strokeRect(-w / 2, -r, w, r * 2); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-w / 2 + 2, -r + 2); c.lineTo(w / 2 - 2, -r + 2); c.stroke();
      [-w / 2, w / 2].forEach(x => { c.fillStyle = '#1a1a1a'; c.beginPath(); c.ellipse(x, 0, r * .35, r, 0, 0, 6.283); c.fill(); c.fillStyle = 'rgba(80,120,130,.6)'; c.beginPath(); c.ellipse(x, 0, r * .12, r * .4, 0, 0, 6.283); c.fill() });
      c.restore();
    };
    if (tier === 2) { trap(-S * .14, -S * .2, .6, 0); trap(S * .16, -S * .02, .6, 1.3); trap(-S * .06, S * .24, .6, 2.6) } else trap(0, 0, 1, 0);
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
