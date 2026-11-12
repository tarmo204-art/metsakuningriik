/* =====================================================================
   Udukuninga saladus – 1. osa
   Saladuste raamat, 7 kaarditükki (1. osas saab kätte 5), 10 salajast ülesannet ja Kristallikoobas.
   Kõik leiud annab ja kontrollib server (supabase/schema.sql jaotis 6h).
   ===================================================================== */
const SEC = { d: null, loading: false, ev: null, busy: false, queue: [], qT: 0 };
const SEC_PIECES = {
  1: 'Veealused aardekirstud peidavad vahel midagi enamat kui kulda.',
  2: 'Kes avastab kaks saladust, leiab ka selle tüki.',
  3: 'Vanad kalurid annavad täidetud ülesannete eest vahel midagi kummalist.',
  4: 'Kristallikoopas, kuuendast sügavusest allpool, on salakäik.',
  5: 'Kristallikoopa põhjas, kaheteistkümnendast sügavusest allpool.',
  6: 'Merel – saarestikus või kaugemal – jääb vahel õnge otsa pudel, milles on kiri.',
  7: 'Kalatunni ajal (kell 20–21) näkkab vahel midagi, mida ükski kalur pole näinud.'
};
const SEC_HALLS = [
  ['varav', '🚪', 'Väravasaal', 'Roostes värav avaneb ainult kulla ja kristallivalguse peale.', 'udukroon'],
  ['peegel', '🪞', 'Peeglisaal', 'Suur peegel räägib mõistatustes. Vale vastuse korral tumeneb see tunniks.', 'hobesarv'],
  ['raamatukogu', '📚', 'Raamatukogu', 'Vana raamatukoguhoidja vajab kalaraamatu jaoks näidiseid. Ta võtab igast haruldusest su saagi kõige väiksema kala.', 'varjuvork'],
  ['kristall', '💠', 'Kristallisaal', 'Uks avaneb ainult neile, kes on käinud Kristallikoopa sügavuses.', 'kristallsuda']
];
const SEC_WEAK = { udu: ['udu', 'udu'], vihm: ['vihm', 'vihma'], pilves: ['pilvine ilm', 'pilvist ilma'], paike: ['päike', 'päikest'] };
const MYTH_IC = { udukroon: '👑', hobesarv: '📯', varjuvork: '🥅', kristallsuda: '💠', kuuong: '🌙', hobesoomus: '🛡️', parijasormus: '💍' };
const ANIMAL_IC = { valgehirv: '🦌', kuldrebane: '🦊', lendorav: '🐿️', kristallkonn: '🐸', udukull: '🦉' };
const SEC_KIND = {
  vesi: ['💧', 'Kuuled vett', 'Kõige ohutum. Vees võib leida esemeid.', '#5ac8e8'],
  tuul: ['🌬️', 'Tunned tuuletõmmet', 'Viib kaks sammu sügavamale, aga on ohtlikum.', '#b8d8c8'],
  kristall: ['💎', 'Kristallid helendavad', 'Palju kulda ja koopakristalle.', '#c79bff']
};
ITEM_IC.koopakristall = '🔮';
FTABS.saladus = '📜 Saladused';

document.head.insertAdjacentHTML('beforeend', `<style>
.sec-intro{background:radial-gradient(120% 90% at 0% 0%,rgba(150,120,200,.22),transparent 60%),rgba(14,32,40,.75)}
.sec-intro p{margin:0;color:#cfdcd6;line-height:1.5}
.sec-prog{display:flex;gap:8px;flex-wrap:wrap}.sec-prog span{padding:5px 10px;border-radius:9px;background:rgba(0,0,0,.3);font-weight:700;font-size:13px}
.sec-map{width:100%;aspect-ratio:1.6;display:block;border-radius:12px}
.sec-pl{display:grid;gap:6px}.sec-pl div{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:center;font-size:13px;color:#b8cdd4}
.sec-pl b.n{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.35);color:#7f9aa4;font-size:12px}
.sec-pl .got b.n{background:linear-gradient(180deg,#f3dfae,#c99a52);color:#3a2408}.sec-pl .got{color:#eadfc4}
.sec-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.sec-s{border-radius:12px;padding:10px 12px;background:rgba(0,0,0,.25);border:1px dashed rgba(180,160,220,.3);display:grid;gap:3px}
.sec-s b{font-size:14px}.sec-s small{color:#9cb2ba;line-height:1.4}.sec-s i{color:#c8b8e8}
.sec-s.got{border:1px solid rgba(255,210,122,.45);background:linear-gradient(160deg,rgba(255,210,122,.12),rgba(0,0,0,.2))}
.sec-cave{position:relative;overflow:hidden;background:radial-gradient(90% 70% at 50% 110%,rgba(160,110,255,.25),transparent 70%),linear-gradient(180deg,#141a26,#0c1018);border-color:rgba(199,155,255,.3)}
.sec-depth{display:flex;gap:8px;flex-wrap:wrap}.sec-depth span{padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.06);font-size:13px}
.sec-doors{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.sec-door{border:0;cursor:pointer;color:#eee;border-radius:60px 60px 12px 12px;padding:22px 8px 12px;display:grid;gap:4px;justify-items:center;text-align:center;
  background:radial-gradient(70% 60% at 50% 35%,#000 0%,#0a0d14 55%,transparent 56%),linear-gradient(180deg,#3a3550,#221f30);box-shadow:inset 0 -6px 0 rgba(0,0,0,.35),0 0 0 2px var(--dc)}
.sec-door:disabled{opacity:.5;cursor:default}.sec-door .e{font-size:26px;filter:drop-shadow(0 0 8px var(--dc))}.sec-door b{font-size:13px}.sec-door small{font-size:11px;color:#b8b0cc;line-height:1.3}
.sec-door:not(:disabled):hover{transform:translateY(-2px)}
.sec-ev{padding:9px 12px;border-radius:10px;background:rgba(0,0,0,.35);font-size:14px;line-height:1.45}
.sec-ev.bad{background:rgba(255,120,100,.15);color:#ffc0b0}.sec-ev.good{background:rgba(151,217,131,.12)}
.sec-lan{letter-spacing:2px;font-size:18px}
.sec-castle{background:radial-gradient(100% 80% at 50% 0%,rgba(200,210,240,.16),transparent 65%),linear-gradient(180deg,#1c2533,#121822);border-color:rgba(200,210,240,.25)}
.sec-halls{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.sec-hall{border-radius:12px;padding:12px;background:rgba(0,0,0,.28);border:1px solid rgba(200,210,240,.15);display:grid;gap:6px;align-content:start}
.sec-hall.done{border-color:rgba(255,210,122,.5);background:linear-gradient(160deg,rgba(255,210,122,.1),rgba(0,0,0,.25))}
.sec-hall h3{margin:0;font-size:15px;display:flex;gap:6px;align-items:center}.sec-hall small{color:#a8b8c8;line-height:1.4}
.sec-req{font-size:12px}.sec-req .y{color:var(--ok)}.sec-req .n{color:var(--bad)}
.sec-rid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.sec-rid button{padding:8px 6px}
.sec-q{font-style:italic;color:#e8e0ff;font-family:Georgia,serif;font-size:15px;line-height:1.4}
.sec-boss{background:radial-gradient(80% 70% at 50% 0%,rgba(120,60,160,.35),transparent 70%),linear-gradient(180deg,#1a1424,#0e0b14);border-color:rgba(190,140,255,.35)}
.sec-hp{height:16px;border-radius:9px;background:rgba(0,0,0,.5);overflow:hidden;border:1px solid rgba(190,140,255,.35)}
.sec-hp i{display:block;height:100%;background:linear-gradient(90deg,#7a3ac8,#d48cff);transition:width .5s}
.sec-weak{padding:7px 11px;border-radius:10px;font-size:13px;background:rgba(255,255,255,.06)}.sec-weak.on{background:rgba(151,217,131,.16);color:#c8f0b8;font-weight:700}
.sec-top{display:grid;gap:3px;font-size:13px}.sec-top div{display:flex;justify-content:space-between;padding:4px 8px;border-radius:8px;background:rgba(0,0,0,.25)}.sec-top .me{background:rgba(255,210,122,.15)}
.sec-myths{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.sec-myth{border-radius:12px;padding:10px;text-align:center;display:grid;gap:3px;justify-items:center;background:rgba(0,0,0,.3);border:1px dashed rgba(200,184,232,.25)}
.sec-myth .e{font-size:30px;filter:grayscale(1) brightness(.4)}.sec-myth.own .e{filter:drop-shadow(0 0 10px rgba(255,214,120,.7))}
.sec-myth.own{border:1px solid rgba(255,210,122,.55);background:radial-gradient(90% 80% at 50% 20%,rgba(255,210,122,.16),rgba(0,0,0,.3))}
.sec-chron{background:radial-gradient(90% 80% at 100% 0%,rgba(255,200,120,.15),transparent 60%),rgba(20,26,30,.85);border-color:rgba(255,200,120,.25)}
.sec-scroll{padding:12px 14px;border-radius:10px;background:linear-gradient(180deg,#efdcb0,#dcc08a);color:#3a2408;font-family:Georgia,serif;font-size:15px;line-height:1.55;display:grid;gap:4px}
.sec-scroll i{color:#7a5a30;font-size:13px}
.sec-animals{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.sec-an{border-radius:12px;padding:10px;display:grid;gap:3px;justify-items:center;text-align:center;background:rgba(0,0,0,.28);border:1px dashed rgba(150,200,150,.25)}
.sec-an .e{font-size:34px;filter:brightness(0) opacity(.45)}.sec-an.own{border:1px solid rgba(151,217,131,.5);background:radial-gradient(90% 80% at 50% 20%,rgba(151,217,131,.14),rgba(0,0,0,.28))}
.sec-an.own .e{filter:drop-shadow(0 0 8px rgba(200,255,180,.4))}.sec-an b{font-size:13px}.sec-an small{font-size:11px;color:#a8b8b0;line-height:1.35}
.sec-visit{display:grid;grid-template-columns:56px minmax(0,1fr);gap:10px;align-items:center;padding:12px;border-radius:12px;background:linear-gradient(120deg,rgba(151,217,131,.2),rgba(255,210,122,.12));border:1px solid rgba(151,217,131,.5)}
.sec-visit .e{font-size:44px;animation:pop .6s cubic-bezier(.2,1.6,.4,1) both}
.sec-myth b{font-size:13px}.sec-myth small{font-size:11px;color:#a8b2c4;line-height:1.35}
@media (max-width:560px){.sec-door small.d{display:none}.sec-door{padding:18px 4px 10px}}
</style>`);

async function loadSec(draw) {
  if (SEC.loading || !CL.user) return; SEC.loading = true;
  try { SEC.d = await rpc('secret_state') } catch (e) { if (draw) toast(e.message, 'bad') }
  SEC.loading = false;
  if (FV.open) renderFV(FV.tab === 'saladus');
}

/* ---------- kaart (7 rebenenud tükki) ---------- */
const SEC_GEO = (() => {
  const top = [0, .27, .52, .76, 1], bot = [0, .36, .68, 1];
  const mid = x => .5 + Math.sin(x * 17.3) * .05;
  const xs = [...new Set([...top, ...bot])].sort((a, b) => a - b);
  const edge = (a, b) => { // rebenenud serv; sama serv on mõlemal naabril täpselt sama
    const flip = a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]); const [p, q] = flip ? [b, a] : [a, b];
    const pts = [], n = 7, dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < n; i++) { const t = i / n, j = Math.sin((p[0] * 31 + p[1] * 57 + i) * 12.9898) * .012; pts.push([p[0] + dx * t - dy / len * j, p[1] + dy * t + dx / len * j]) }
    return flip ? pts.reverse() : pts;
  };
  const poly = c => { const o = []; for (let i = 0; i < c.length; i++) { o.push(c[i]); o.push(...edge(c[i], c[(i + 1) % c.length])) } return o };
  const midLine = (x0, x1) => xs.filter(x => x >= x0 && x <= x1).map(x => [x, mid(x)]);
  const P = {};
  top.slice(0, -1).forEach((x0, i) => { const x1 = top[i + 1]; P[i + 1] = poly([[x0, 0], [x1, 0], ...midLine(x0, x1).reverse()]) });
  bot.slice(0, -1).forEach((x0, i) => { const x1 = bot[i + 1]; P[i + 5] = poly([...midLine(x0, x1), [x1, 1], [x0, 1]]) });
  return P;
})();
function secDrawWorld(c, w, h, caveOpen, castle) {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#efdcb0'); g.addColorStop(1, '#d6b77e'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(90,60,25,.55)'; c.fillStyle = 'rgba(90,60,25,.55)'; c.lineWidth = 1.4;
  // mäed
  for (let i = 0; i < 6; i++) { const x = w * (.05 + i * .055), y = h * (.18 + (i % 2) * .06), s = w * .04; c.beginPath(); c.moveTo(x - s, y + s * .8); c.lineTo(x, y - s * .6); c.lineTo(x + s, y + s * .8); c.stroke() }
  // jõgi
  c.beginPath(); c.moveTo(w * .02, h * .62); c.bezierCurveTo(w * .2, h * .5, w * .3, h * .8, w * .48, h * .66); c.bezierCurveTo(w * .6, h * .56, w * .66, h * .7, w * .72, h * .62); c.strokeStyle = 'rgba(60,110,140,.7)'; c.lineWidth = 2.4; c.stroke();
  // järv ja saar
  c.beginPath(); c.ellipse(w * .84, h * .74, w * .13, h * .17, -.2, 0, Math.PI * 2); c.fillStyle = 'rgba(80,140,170,.45)'; c.fill(); c.strokeStyle = 'rgba(50,90,120,.7)'; c.lineWidth = 1.5; c.stroke();
  c.beginPath(); c.ellipse(w * .86, h * .76, w * .035, h * .045, 0, 0, Math.PI * 2); c.fillStyle = '#c9a868'; c.fill();
  // puud
  c.fillStyle = 'rgba(70,95,45,.65)';
  for (let i = 0; i < 26; i++) { const x = w * (.1 + ((i * 37) % 60) / 100), y = h * (.3 + ((i * 53) % 50) / 100); if (Math.hypot(x / w - .84, y / h - .74) < .17) continue; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x - 4, y + 3); c.lineTo(x + 4, y + 3); c.fill() }
  // küla
  c.fillStyle = 'rgba(120,60,30,.8)'; c.fillRect(w * .16, h * .82, 9, 7); c.fillRect(w * .19, h * .85, 9, 7);
  c.font = `italic ${Math.max(10, w * .028)}px Georgia,serif`; c.fillStyle = 'rgba(70,45,20,.85)'; c.fillText('Sinu kuningriik', w * .1, h * .96);
  // kristallikoobas
  if (caveOpen) {
    c.setLineDash([5, 5]); c.strokeStyle = 'rgba(150,40,40,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * .2, h * .82); c.bezierCurveTo(w * .3, h * .55, w * .42, h * .35, w * .6, h * .24); c.stroke(); c.setLineDash([]);
    c.font = `${Math.max(16, w * .05)}px system-ui`; c.fillText('💎', w * .58, h * .28);
    c.font = `italic ${Math.max(10, w * .028)}px Georgia,serif`; c.fillStyle = 'rgba(70,45,20,.9)'; c.fillText('Kristallikoobas', w * .5, h * .36);
  }
  c.font = `${Math.max(14, w * .045)}px Georgia,serif`; c.fillStyle = 'rgba(70,45,20,.8)'; c.fillText('✦', w * .92, h * .1);
  if (castle) {
    const x = w * .86, y = h * .755, s = w * .03; c.fillStyle = 'rgba(70,60,80,.9)';
    c.fillRect(x - s, y - s * 1.2, s * 2, s * 1.2); c.fillRect(x - s * 1.3, y - s * 2, s * .6, s * 2); c.fillRect(x + s * .7, y - s * 2, s * .6, s * 2); c.fillRect(x - s * .3, y - s * 2.6, s * .6, s * 1.4);
    c.font = `italic ${Math.max(10, w * .028)}px Georgia,serif`; c.fillStyle = 'rgba(70,45,20,.9)'; c.fillText('Udulinn', w * .79, h * .55);
  }
}
function paintSecMap() {
  const cv = document.querySelector('canvas.sec-map'); if (!cv || !SEC.d) return;
  const w = cv.clientWidth || 340, h = cv.clientHeight || 212, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const have = new Set((SEC.d.pieces || []).map(p => p.n));
  c.fillStyle = '#0d1a20'; c.fillRect(0, 0, w, h);
  const path = n => { c.beginPath(); SEC_GEO[n].forEach(([x, y], i) => i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h)); c.closePath() };
  for (let n = 1; n <= 7; n++) {
    if (have.has(n)) { c.save(); path(n); c.clip(); secDrawWorld(c, w, h, SEC.d.cave_open, have.size === 7); c.restore(); path(n); c.strokeStyle = 'rgba(90,60,25,.9)'; c.lineWidth = 1.5; c.stroke() }
    else {
      c.save(); path(n); c.fillStyle = 'rgba(30,40,55,.55)'; c.fill(); c.setLineDash([4, 4]); c.strokeStyle = 'rgba(180,160,220,.45)'; c.lineWidth = 1.2; c.stroke(); c.restore();
      const pts = SEC_GEO[n], cx = pts.reduce((a, p) => a + p[0], 0) / pts.length * w, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length * h;
      c.fillStyle = 'rgba(200,184,232,.55)'; c.font = `700 ${Math.max(14, w * .05)}px Georgia,serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, cx, cy); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    }
  }
}

/* ---------- vahekaart ---------- */
function secRisk(k, d) { return Math.min(.55, k === 'tuul' ? .10 + .03 * d : k === 'kristall' ? .07 + .025 * d : .05 + .02 * d) }
function secEvText(e) {
  if (!e) return '';
  if (e.type === 'step') { const K = SEC_KIND[e.kind] || ['', 'käik']; return `<div class="sec-ev good">${K[0]} Läksid käiku „${K[1].toLowerCase()}“ ja jõudsid <b>${e.depth}. sügavusele</b>: +${fmt(e.gold)} kulda${e.item ? ` ja ${itemName(e.item)}` : ''}.</div>` }
  if (e.type === 'collapse') return `<div class="sec-ev bad">💥 Varing ${e.depth}. sügavusel! Pääsesid napilt välja. Kaasa jäi ${fmt(e.gold)} kulda${e.lost ? `, ${e.lost} eset jäi kivide alla` : ''}.</div>`;
  if (e.type === 'leave') return `<div class="sec-ev good">🏕️ Tulid koopast välja ${e.depth}. sügavuselt: +${fmt(e.gold)} kulda kalurikassasse${e.xp ? `, +${fmt(e.xp)} kogemust` : ''}${(e.items || []).length ? '. Kotti: ' + itemsTxt(e.items, true) : ''}.</div>`;
  return '';
}
function secCave() {
  const d = SEC.d;
  if (!d.cave_open) return `<div class="fv-card sec-cave"><h2>🔒 Kristallikoobas</h2><p class="lead">Kui leiad kolm esimest kaarditükki, näitab kaart teed Kristallikoopasse.</p></div>`;
  const r = d.run, mx = d.lanterns_max || 3, lan = '🏮'.repeat(Math.max(0, d.lanterns)) + '<span style="opacity:.25">' + '🏮'.repeat(Math.max(0, mx - d.lanterns)) + '</span>';
  let h = `<div class="fv-card sec-cave"><h2>💎 Kristallikoobas</h2>
    <p class="lead">Iga päev on sul ${mx} laternat. Vali igal sammul üks kolmest käigust. Mida sügavamale, seda suurem saak, aga ka varinguoht. Varingu korral jääb alles pool kullast ja esemed kaovad. Kaarditükid jäävad alati sulle.</p>
    <div class="sec-depth"><span>Laternad: <span class="sec-lan">${lan}</span></span><span>Sügavaim: <b>${d.best_depth}</b></span><span>Retki: ${d.cave_runs}</span></div>`;
  h += SEC.ev ? secEvText(SEC.ev) : '';
  if (r) {
    const items = r.items || [];
    h += `<div class="sec-depth"><span>Sügavus: <b>${r.depth}</b></span><span>Saak: <b>${fmt(r.gold)}</b> kulda</span>${items.length ? `<span>${items.map(i => ITEM_IC[i] || '✨').join(' ')}</span>` : ''}</div>
      <div class="sec-doors">${(r.doors || []).map((k, i) => { const K = SEC_KIND[k]; return `<button class="sec-door" type="button" style="--dc:${K[3]}" data-sa="go" data-arg="${i}" ${SEC.busy ? 'disabled' : ''}><span class="e">${K[0]}</span><b>${K[1]}</b><small class="d">${K[2]}</small><small>Varinguoht ~${Math.round(secRisk(k, r.depth) * 100)}%</small></button>` }).join('')}</div>
      <div><button class="btn" type="button" data-sa="leave" ${SEC.busy ? 'disabled' : ''}>Lahku koopast ja võta saak kaasa</button></div>`;
  } else h += `<div><button class="btn" type="button" data-sa="start" ${SEC.busy || d.lanterns <= 0 ? 'disabled' : ''}>${d.lanterns > 0 ? 'Süüta latern ja astu koopasse' : 'Laternad on täna otsas – uued kesköösel'}</button></div>`;
  return h + '</div>';
}
function secHalls(ca) {
  const halls = ca.halls || [], myth = {}; (ca.myths || []).forEach(m => myth[m.id] = m);
  const cr = (FS.items || {}).koopakristall || 0, inv = (FS.inventory || []).filter(x => !x.trophy);
  const R = (ok, t) => `<span class="${ok ? 'y' : 'n'}">${t}</span>`;
  return `<div class="sec-halls">${SEC_HALLS.map(([id, ic, name, descr, my]) => {
    const done = halls.includes(id), m = myth[my] || {};
    let req = '', btn = '';
    if (done) return `<div class="sec-hall done"><h3>${ic} ${name}</h3><small>Avatud. Said siit: <b>${MYTH_IC[my] || ''} ${esc(m.name || '')}</b></small></div>`;
    if (id === 'varav') { const ok = FS.gold >= 3000 && cr >= 5; req = `${R(FS.gold >= 3000, '3000 kulda')} · ${R(cr >= 5, `koopakristall ${Math.min(cr, 5)}/5`)}`; btn = `<button class="btn sm" type="button" data-sa="hall" data-arg="varav" ${ok && !SEC.busy ? '' : 'disabled'}>Ava värav</button>` }
    if (id === 'peegel') {
      if (ca.riddle_wait) req = `Peegel on tume kuni ${new Date(ca.riddle_wait).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' })}.`;
      else if (ca.riddle) btn = `<div class="sec-q">„${esc(ca.riddle.q)}“</div><div class="sec-rid">${ca.riddle.o.map((o, i) => `<button class="btn ghost sm" type="button" data-sa="riddle" data-arg="${i}" ${SEC.busy ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>`;
    }
    if (id === 'raamatukogu') { const has = [1, 2, 3, 4, 5].map(r => inv.some(x => x.rarity === r)); req = has.map((h, i) => R(h, (RAR2[i + 1] || [''])[0])).join(' · '); const ok = has.every(Boolean);
      btn = `<button class="btn sm" type="button" data-sa="hall" data-arg="raamatukogu" ${ok && !SEC.busy ? '' : 'disabled'}>${SEC.confirm === 'raamatukogu' ? 'Kinnita: anna 5 kala' : 'Anna kalad'}</button>` }
    if (id === 'kristall') { const ok = (SEC.d.best_depth || 0) >= 12 && cr >= 10; req = `${R((SEC.d.best_depth || 0) >= 12, `koopas 12. sügavus (sinu parim ${SEC.d.best_depth || 0})`)} · ${R(cr >= 10, `koopakristall ${Math.min(cr, 10)}/10`)}`; btn = `<button class="btn sm" type="button" data-sa="hall" data-arg="kristall" ${ok && !SEC.busy ? '' : 'disabled'}>Ava kristalliuks</button>` }
    return `<div class="sec-hall"><h3>${ic} ${name}</h3><small>${descr}</small><small>Preemia: <b>${MYTH_IC[my] || ''} ${esc(m.name || '')}</b> – ${esc(m.descr || '')}</small>${req ? `<div class="sec-req">${req}</div>` : ''}${btn}</div>`;
  }).join('')}</div>`;
}
function secBoss(b) {
  const pct = Math.max(0, Math.min(100, b.hp / Math.max(1, b.max_hp) * 100)), weakNow = FS.weather === b.weak;
  let h = `<div class="fv-card sec-boss"><h2>👤 Troonisaal: ${esc(b.name)}</h2><p class="lead">${esc(b.descr)} Kuninga Vari on kõigi mängijate ühine vastane ja tuleb iga nädal tagasi uue kujuga. Igaüks saab lüüa 5 korda päevas. Kui Vari langeb, saavad kõik lööjad preemia – ja esimesel korral müütilise <b>Kuuõnge</b>.</p>
    <div class="sec-weak ${weakNow ? 'on' : ''}">${weakNow ? `⚡ Praegu on ${(SEC_WEAK[b.weak] || [b.weak])[0]} – Vari on nõrk ja löögid teevad topelt kahju!` : `Nõrk koht: ta kardab ${(SEC_WEAK[b.weak] || [, b.weak])[1]}. Siis teevad löögid topelt kahju.`}</div>
    <div class="sec-hp"><i style="width:${pct.toFixed(1)}%"></i></div>
    <div class="sec-depth"><span>Elu: <b>${fmt(Math.max(0, b.hp))}</b> / ${fmt(b.max_hp)}</span><span>Sinu kahju: <b>${fmt(b.my_dmg)}</b></span><span>Löögid täna: <b>${'⚔️'.repeat(Math.max(0, b.left))}${b.left <= 0 ? '0' : ''}</b></span></div>`;
  if (SEC.atk) { const a = SEC.atk; h += `<div class="sec-ev ${a.killed ? 'good' : ''}">⚔️ Sinu löök: <b>−${fmt(a.dmg)}</b> elu${a.weak ? ' · nõrk koht ×2!' : ''}${a.storm ? ' · tormi jõud ×1,5' : ''}${a.killed ? ' · <b>VARI ON ALISTATUD!</b>' : ''}</div>` }
  if (b.killed) h += `<div class="sec-ev good">🏆 Sel nädalal on Vari alistatud${b.killer ? ` – viimase löögi andis <b>${esc(b.killer)}</b>` : ''}. Uus Vari ilmub esmaspäeval.</div>`;
  else h += `<div><button class="btn" type="button" data-sa="attack" ${b.left > 0 && !SEC.busy ? '' : 'disabled'}>${b.left > 0 ? 'Löö Varju' : 'Tänased löögid on tehtud'}</button></div>`;
  if (b.claim > 0) h += `<div><button class="btn" type="button" data-sa="claim" ${SEC.busy ? 'disabled' : ''}>🎁 Võta Varju preemia</button></div>`;
  if ((b.top || []).length) h += `<div class="sec-top">${b.top.map((t, i) => `<div class="${t.me ? 'me' : ''}"><span>${i + 1}. ${esc(t.name || 'Kalur')}</span><b>${fmt(t.dmg)}</b></div>`).join('')}</div>`;
  return h + '</div>';
}
function secCastle() {
  const d = SEC.d, ca = d.castle || {}, n = (d.pieces || []).length;
  if (!ca.open) return `<div class="fv-card sec-castle"><h2>🏰 Udulinn</h2><p class="lead">${ca.need_boat ? 'Kõik seitse tükki on koos! Kaart näitab Udulinna järvesaarel. Sinna pääsemiseks osta Töökojast paat.' : `Udulinn on veel udu sees. Kui kõik seitse kaarditükki on koos (sul on ${n}), ilmub see kaardile.`}</p></div>`;
  const myths = ca.myths || [], own = myths.filter(m => m.own).length;
  return `<div class="fv-card sec-castle"><h2>🏰 Udulinn</h2><p class="lead">Udu hajus ja järvesaarel seisab Udukuninga linnus. Igas saalis on üks müütiline ese. Esemed toimivad kohe ja jäävad sulle igaveseks.</p>${secHalls(ca)}</div>
    ${secBoss(ca.boss || {})}
    <div class="fv-card"><h2>Müütilised esemed <small class="lead">${own} / 7</small></h2><div class="sec-myths">${myths.map(m => `<div class="sec-myth ${m.own ? 'own' : ''}"><span class="e">${MYTH_IC[m.id] || '✨'}</span><b>${m.own ? esc(m.name) : '???'}</b><small>${m.own ? esc(m.descr) : 'Leia: ' + esc(m.src)}</small></div>`).join('')}
      </div>${d.ring_ready ? `<div class="sec-ev good">💍 Kõik kuus eset on koos ja Pärija sõrmus ärkas! <button class="btn sm" type="button" data-sa="ring" ${SEC.busy ? 'disabled' : ''}>Pane sõrmus sõrme</button></div>` : ''}</div>`;
}
function secChron() {
  const c = SEC.d.chron; if (!c) return '';
  const next = c.done ? '' : c.stage === 1 ? 'Järgmine rida ilmub kolmapäeval.' : c.stage === 2 ? 'Viimane rida ilmub reedel.' : '';
  return `<div class="fv-card sec-chron"><h2>📖 Kalurite kroonika</h2>
    <p class="lead">Igal esmaspäeval ilmub vanasse kroonikasse uus mõistatus: mis kala, kus, mis ilmaga ja mis ajal. Kes selle kala täpselt nii püüab, saab 2500 kulda ja 2 koopakristalli. Esimesel korral annab kroonika ka müütilise eseme <b>Hõbesoomus</b>.</p>
    <div class="sec-scroll">${(c.hints || []).map(t => `<span>${esc(t)}</span>`).join('')}${next ? `<i>${next}</i>` : ''}</div>
    ${c.done && c.answer ? `<div class="sec-ev good">✅ Lahendatud! Püüdsid <b>${esc(c.answer.name)}</b> (${fKg(+c.answer.weight)}) paigas ${esc(c.answer.spot)}.</div>` : ''}
    <div class="sec-depth"><span>Sel nädalal lahendanud: <b>${c.solvers}</b></span><span>Sinu lahendatud nädalaid: <b>${c.weeks}</b></span></div></div>`;
}
function secAnimals() {
  const d = SEC.d, list = d.animals || [], v = d.visitor; if (!list.length) return '';
  let h = `<div class="fv-card"><h2>🐾 Haruldased loomad <small class="lead">${list.filter(a => a.own).length} / ${list.length}</small></h2>
    <p class="lead">Salajastes paikades võid kohata haruldast looma. Kui annad talle, mida ta soovib, kolib ta sinu kuningriiki ja toob iga päev kingituse.</p>`;
  if (v) {
    const a = list.find(x => x.id === v.id) || { name: v.id, wants: {} }, wants = Object.entries(a.wants || {}), ok = wants.every(([k, q]) => ((FS.items || {})[k] || 0) >= q);
    h += `<div class="sec-visit"><span class="e">${ANIMAL_IC[v.id] || '🐾'}</span><div style="display:grid;gap:5px"><b>${esc(a.name)} ootab sind!</b>
      <small>Ta soovib: ${wants.map(([k, q]) => { const have = (FS.items || {})[k] || 0; return `<span style="color:${have >= q ? 'var(--ok)' : 'var(--bad)'}">${itemName(k)} ${Math.min(have, q)}/${q}</span>` }).join(', ')} · lahkub ${new Date(v.until).toLocaleString('et-EE', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</small>
      <div><button class="btn sm" type="button" data-sa="tame" ${ok && !SEC.busy ? '' : 'disabled'}>Anna ja kutsu kuningriiki</button></div></div></div>`;
  }
  if (d.gift_ready) h += `<div><button class="btn" type="button" data-sa="gifts" ${SEC.busy ? 'disabled' : ''}>🎁 Võta loomade tänased kingitused</button></div>`;
  h += `<div class="sec-animals">${list.map(a => `<div class="sec-an ${a.own ? 'own' : ''}"><span class="e">${ANIMAL_IC[a.id] || '🐾'}</span><b>${a.own ? esc(a.name) : '???'}</b><small>${a.own ? esc(a.gift) : esc(a.where)}</small></div>`).join('')}</div></div>`;
  return h;
}
function tabSaladus() {
  if (!SEC.d) { loadSec(true); return '<div class="fv-card"><p class="lead">Avan Saladuste raamatut…</p></div>' }
  const d = SEC.d, pc = d.pieces || [], have = {}, sc = d.secrets || [];
  pc.forEach(p => have[p.n] = p);
  const nFound = sc.filter(s => s.found).length;
  let h = `<div class="fv-card sec-intro"><h2>📜 Udukuninga saladus</h2>
    <p>Ammu enne sinu kuningriiki valitses neid metsi Udukuningas. Tema loss vajus udu sisse ja kadus kaardilt. Kuningas rebis oma aardekaardi seitsmeks tükiks ja peitis need üle maa. Kes kõik tükid kokku saab, leiab lossi.</p>
    <div class="sec-prog"><span>🗺️ Kaarditükke ${pc.length} / 7</span><span>🔮 Saladusi ${nFound} / ${sc.length}</span></div></div>`;
  h += `<div class="fv-card"><h2>Aardekaart</h2><canvas class="sec-map" aria-label="Aardekaart"></canvas>
    <div class="sec-pl">${[1, 2, 3, 4, 5, 6, 7].map(n => `<div class="${have[n] ? 'got' : ''}"><b class="n">${n}</b><span>${have[n] ? `<b>Leitud:</b> ${esc(have[n].src)}` : SEC_PIECES[n]}</span></div>`).join('')}</div></div>`;
  h += secCave();
  h += secChron();
  h += secAnimals();
  h += secCastle();
  h += `<div class="fv-card"><h2>Salajased ülesanded</h2><p class="lead">Neid ülesandeid ei ole kuskil kirjas. Raamat annab ainult vihje – ülejäänu pead ise välja mõtlema.</p>
    <div class="sec-list">${sc.map(s => s.found
      ? `<div class="sec-s got"><b>🔮 ${esc(s.name)}</b><small>${esc(s.descr)}</small><small>Avastatud ${new Date(s.at).toLocaleDateString('et-EE')} · +${fmt(s.gold)} kulda${s.item ? ` · ${itemName(s.item)}${s.qty > 1 ? ' ×' + s.qty : ''}` : ''}</small></div>`
      : `<div class="sec-s"><b>❔ ???</b><small><i>„${esc(s.hint)}“</i></small></div>`).join('')}</div></div>`;
  return h;
}

/* ---------- avastuse teade ---------- */
function secShow(sec) {
  if (!sec || (!(sec.found || []).length && !(sec.pieces || []).length && !sec.chron && !sec.animal)) return;
  SEC.queue.push(sec); SEC.d = null; loadSec(false);
  clearTimeout(SEC.qT); SEC.qT = setTimeout(secShowNow, 700);
}
function secShowNow() {
  if (!SEC.queue.length) return;
  if (UI.modalView) { SEC.qT = setTimeout(secShowNow, 1200); return }
  const all = SEC.queue.splice(0), found = all.flatMap(s => s.found || []), pieces = all.flatMap(s => s.pieces || []), cave = all.some(s => s.cave), castle = all.some(s => s.castle), chron = all.map(s => s.chron).find(Boolean), animal = all.map(s => s.animal).find(Boolean);
  const title = found.length ? 'Avastasid saladuse!' : chron ? 'Kroonika lahendatud!' : pieces.length ? 'Leidsid kaarditüki!' : 'Haruldane külaline!',
    icon = found.length ? '🔮' : chron ? '📖' : pieces.length ? '🗺️' : (ANIMAL_IC[animal && animal.id] || '🐾'), sm = found.length ? 'saladus' : chron ? 'kroonika' : pieces.length ? 'tükk' : 'külaline';
  if (typeof sfx === 'function') sfx('levelup');
  showModal(() => `<div class="rays"></div>${Array.from({ length: 8 }, (_, i) => `<i class="mote" style="left:${8 + i * 11}%;top:${26 + (i * 43) % 54}%;animation-delay:${(i * .41) % 3}s"></i>`).join('')}
    <div class="ribbon">${title}</div>
    <div class="emblem"><div class="emblem-in"><b style="font-size:46px">${icon}</b><small>${sm}</small></div></div>
    ${chron ? `<h2>Kroonika kala on püütud!</h2><p class="sub">Vana kroonika lehel süttis sinu nimi.</p>` : ''}
    ${found.map(f => `<h2>${esc(f.name)}</h2><p class="sub">${esc(f.descr)}</p>`).join('')}
    <div class="unlock-list">${found.map(f => `<span>+${fmt(f.gold)} kulda</span>${(f.items || []).map(x => `<span>${itemName(x.id)}${x.qty > 1 ? ' ×' + x.qty : ''}</span>`).join('')}`).join('')}${pieces.map(n => `<span>🗺️ Kaarditükk nr ${n}</span>`).join('')}${chron ? `<span>+${fmt(chron.gold)} kulda</span>${(chron.items || []).map(x => `<span>${itemName(x.id)} ×${x.qty}</span>`).join('')}${chron.myth ? '<span>🛡️ Müütiline ese: Hõbesoomus</span>' : ''}` : ''}</div>
    ${animal ? `<p class="sub"><b>${esc(animal.name)}</b> ilmus sinu lähedale! Ta soovib: ${Object.entries(animal.wants || {}).map(([k, q]) => itemName(k) + ' ×' + q).join(', ')}. Ta ootab 48 tundi.</p>` : ''}
    ${cave ? '<p class="sub"><b>Kaardile ilmus tee Kristallikoopasse!</b></p>' : ''}${castle ? '<p class="sub"><b>Kõik seitse tükki on koos! Kaardile ilmus Udulinn.</b></p>' : ''}
    <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Edasi</button><button class="btn" type="button" data-sa="book">Ava Saladuste raamat</button></div>`, 'lvlup');
}

function secMythModal(id) {
  const m = ((SEC.d && SEC.d.castle && SEC.d.castle.myths) || []).find(x => x.id === id) || { name: id, descr: '' };
  if (typeof sfx === 'function') sfx('levelup');
  const show = () => { if (UI.modalView) { setTimeout(show, 1200); return }
    showModal(() => `<div class="rays"></div><div class="ribbon">Müütiline ese</div><div class="emblem"><div class="emblem-in"><b style="font-size:48px">${MYTH_IC[id] || '✨'}</b><small>müüt</small></div></div>
      <h2>${esc(m.name)}</h2><p class="sub">${esc(m.descr)}</p><p class="nextl">Ese toimib kohe ja jääb sulle igaveseks.</p>
      <button class="btn" type="button" data-act="closeModal">Imeline!</button>`, 'lvlup') };
  setTimeout(show, 300);
}

/* ---------- laiendused olemasolevatele funktsioonidele ---------- */
{
  const baseRpc = rpc;
  rpc = async function (fn, args) { const r = await baseRpc(fn, args); try { if (r && typeof r === 'object' && r.sec) secShow(r.sec) } catch (e) { } return r };
  const baseRender = renderFV;
  renderFV = function (force) { baseRender(force); try { paintSecMap() } catch (e) { } };
  const baseBadges = fvBadges;
  fvBadges = function () { const b = baseBadges(); if (SEC.d) { const bo = SEC.d.castle && SEC.d.castle.open && SEC.d.castle.boss || {}; const n = (SEC.d.cave_open && !SEC.d.run ? SEC.d.lanterns : 0) + (bo.killed ? 0 : Math.max(0, bo.left || 0)) + (bo.claim || 0) + (SEC.d.gift_ready ? 1 : 0) + (SEC.d.visitor ? 1 : 0) + (SEC.d.ring_ready ? 1 : 0); if (n > 0) b.saladus = n } return b };
  const baseRefresh = refreshFS;
  refreshFS = async function () { const r = await baseRefresh(); if (!SEC.d && !SEC.loading) loadSec(false); return r };
  const baseNews = newsText;
  newsText = function (n) {
    const who = `<b>${esc(n.name)}</b>${n.title ? ` <small class="lead">${esc(n.title)}</small>` : ''}`, d = n.data || {};
    if (n.kind === 'myth') return `${who} leidis Udulinnast müütilise eseme: <b style="color:#ffd27a">${esc(d.myth || '')}</b>!`;
    if (n.kind === 'kroonika') return `${who} lahendas selle nädala Kalurite kroonika mõistatuse! 📖`;
    if (n.kind === 'animal') return `${who} sõbrunes haruldase loomaga: <b>${esc(d.name || '')}</b>! 🐾`;
    if (n.kind === 'parija') return `${who} pani sõrme Pärija sõrmuse ja on nüüd <b style="color:#ffd27a">Udukuninga pärija</b>! 💍`;
    if (n.kind === 'vari') return `${who} andis Kuninga Varjule (${esc(d.name || '')}) viimase löögi! Vari on sel nädalal alistatud. ⚔️`;
    if (n.kind === 'secret') return `<b>${esc(n.name)}</b>${n.title ? ` <small class="lead">${esc(n.title)}</small>` : ''} avastas Udukuninga saladuse! 🔮 (kokku ${(n.data || {}).n || 1})`; return baseNews(n) };
  NEWS_IC.secret = '🔮'; NEWS_IC.myth = '👑'; NEWS_IC.vari = '⚔️'; NEWS_IC.kroonika = '📖'; NEWS_IC.animal = '🐾'; NEWS_IC.parija = '💍';
  const baseAdv = TABS.seiklused.r;
  TABS.seiklused.r = () => {
    const h = baseAdv();
    const c = `<div class="card adv"><div class="advhead"><span class="ic lg" style="font-size:26px;display:grid;place-items:center">📜</span><div><h3>Udukuninga saladus</h3><p class="lead">Rebenenud aardekaart, salajased ülesanded ja Kristallikoobas. Kes leiab kõik seitse tükki?</p></div></div>
      <div><button class="btn sm" type="button" data-act="openSecrets">Ava Saladuste raamat</button></div></div>`;
    return h.replace(/<\/div>$/, '') + c + '</div>';
  };
  ACT.openSecrets = () => openFishView('saladus');
  FTAB_FN.saladus = tabSaladus;
}
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-sa],[data-fa="tab"][data-arg="saladus"]'); if (!el || el.disabled) return;
  if (el.dataset.fa === 'tab') { SEC.ev = null; SEC.atk = null; SEC.confirm = null; loadSec(false); return }
  const a = el.dataset.sa;
  if (a === 'book') { closeModal(); openFishView('saladus'); return }
  if (SEC.busy) return; SEC.busy = true; renderFV(true);
  try {
    let r;
    if (a === 'start') { r = await rpc('secret_cave_start'); SEC.ev = null }
    else if (a === 'go') r = await rpc('secret_cave_go', { p_door: +el.dataset.arg });
    else if (a === 'leave') r = await rpc('secret_cave_leave');
    else if (a === 'hall') {
      if (el.dataset.arg === 'raamatukogu' && SEC.confirm !== 'raamatukogu') { SEC.confirm = 'raamatukogu'; SEC.busy = false; renderFV(true); return }
      SEC.confirm = null; r = await rpc('secret_castle_hall', { p_hall: el.dataset.arg });
    }
    else if (a === 'riddle') r = await rpc('secret_castle_hall', { p_hall: 'peegel', p_answer: +el.dataset.arg });
    else if (a === 'attack') r = await rpc('secret_boss_attack');
    else if (a === 'claim') r = await rpc('secret_boss_claim');
    else if (a === 'tame' || a === 'gifts' || a === 'ring') {
      r = await rpc(a === 'tame' ? 'secret_animal_tame' : a === 'gifts' ? 'secret_animal_gifts' : 'secret_ring');
      const { tamed, gifts, ring, sec, ach, ...st } = r; SEC.d = st;
      if (tamed) toast(`${ANIMAL_IC[tamed.id] || ''} ${tamed.name} kolis sinu kuningriiki! Homsest toob ta kingitusi.`, 'gold', 'fame');
      if (gifts) { const k = gifts.kingdom || {}; toast(`Loomad tõid kingitusi: ${[k.gold ? `+${fmt(k.gold)} kulda` : '', k.food ? `+${fmt(k.food)} toitu` : '', k.fame ? `+${fmt(k.fame)} kuulsust` : '', k.map ? `+${k.map} aardekaart` : '', (gifts.items || []).length ? itemsTxt(gifts.items, true) : ''].filter(Boolean).join(', ')}`, 'gold', 'fame'); if (typeof claimInbox === 'function') setTimeout(claimInbox, 500) }
      if (ring) { secMythModal('parijasormus'); if (typeof claimInbox === 'function') setTimeout(claimInbox, 500) }
      await refreshFS(); afterAch(ach); r = null;
    }
    if (r && (a === 'hall' || a === 'riddle' || a === 'attack' || a === 'claim')) {
      const { hall_result, attack, prizes, myth, sec, levels, ach, ...st } = r; SEC.d = st;
      if (attack) { SEC.atk = attack; if (typeof sfx === 'function') sfx(attack.killed ? 'levelup' : 'pop') }
      if (hall_result && !hall_result.ok) toast('Vale vastus! Peegel tumenes. Uus mõistatus ilmub tunni aja pärast.', 'bad');
      if (hall_result && hall_result.ok) secMythModal(hall_result.myth);
      (prizes || []).forEach(p => toast(`Kuninga Vari: ${p.killed ? `${p.place}. koht lööjate seas` : 'Vari jäi alistamata, aga sa võitlesid'}! +${fmt(p.gold)} kulda${itemsTxt(p.items)}`, 'gold', 'fame'));
      if (myth) secMythModal('kuuong');
      await refreshFS(); afterLevels(levels); afterAch(ach);
      r = null;
    }
    if (r) {
      SEC.ev = r.event || null; const { event, sec, levels, ach, ...st } = r; SEC.d = st;
      if (event && event.type === 'collapse' && typeof sfx === 'function') sfx('bad');
      if (event && event.type !== 'step') { await refreshFS(); afterLevels(levels); afterAch(ach) }
    }
  } catch (er) { toast(er.message, 'bad') }
  SEC.busy = false; renderFV(true);
});
