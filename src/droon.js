/* =====================================================================
   Kalapüügidroon – automaatne kalapüük
   Saada droon valitud püügikohta koos söödaga. Ta toob iga paari minuti järel ühe kala korvi,
   ka siis, kui mängust ära oled. Kui korv on täis (või sööt otsas), jääb droon ootama.
   Droon ei püüa legendaarseid ega müütilisi kalu ega liiga rasket kala sinu õnge jaoks.
   ===================================================================== */
const DR = { d: null, loading: false, err: '', busy: false, pick: { spot: '', bait: '' }, got: null, raf: 0, t0: performance.now() };
const DR_COL = ['', '#8fd0e8', '#7ae0b0', '#f2c060', '#ff8a6a', '#c49aff'];
document.head.insertAdjacentHTML('beforeend', `<style>
.dr-scene{position:relative;border-radius:14px;overflow:hidden;background:#0b2230}
.dr-scene canvas{display:block;width:100%;height:220px}
.dr-cap{position:absolute;left:12px;top:10px;display:grid;gap:1px;text-shadow:0 1px 4px rgba(0,0,0,.7)}
.dr-cap b{font-family:var(--f-head);font-size:19px;color:#f4ecd0}.dr-cap small{font-size:12.5px;color:#cfe3ea}
.dr-basket{position:absolute;right:12px;top:10px;display:grid;justify-items:end;gap:4px;text-shadow:0 1px 4px rgba(0,0,0,.7)}
.dr-basket b{font:800 22px/1 var(--f-body);color:#ffe2a0}.dr-basket small{font-size:12px;color:#cfe3ea}
.dr-bar{width:120px;height:7px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden}.dr-bar i{display:block;height:100%;background:linear-gradient(90deg,#5fd4c4,#ffe2a0);border-radius:4px}
.dr-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.dr-stat{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.dr-stat div{padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.22);display:grid;gap:2px}
.dr-stat small{font-size:11.5px;color:var(--muted)}.dr-stat b{font-size:15px;color:#eef4f0}
.dr-chips{display:flex;gap:6px;flex-wrap:wrap}
.dr-chips button{border:1px solid rgba(134,205,224,.22);background:rgba(0,0,0,.22);color:#dbe8ec;border-radius:999px;padding:7px 12px;font-size:13.5px;cursor:pointer}
.dr-chips button.on{background:linear-gradient(180deg,rgba(95,212,196,.3),rgba(95,212,196,.12));border-color:#5fd4c4;color:#fff}
.dr-chips button:disabled{opacity:.45;cursor:default}
.dr-lbl{font-size:13px;color:var(--lichen);font-weight:600}
.dr-got{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px}
.dr-got div{padding:7px 9px;border-radius:10px;background:rgba(0,0,0,.22);border-left:3px solid var(--rc,#8fd0e8);font-size:13px;display:grid}
.dr-got small{color:var(--muted)}
.dr-up{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
.dr-up p{margin:0;font-size:13.5px;color:var(--muted)}
.dr-warn{padding:8px 10px;border-radius:10px;background:rgba(255,170,80,.12);border:1px solid rgba(255,170,80,.3);font-size:13.5px;color:#ffd8a0}
@media (max-width:600px){.dr-stat{grid-template-columns:repeat(2,minmax(0,1fr))}.dr-scene canvas{height:190px}.dr-bar{width:90px}}
</style>`);

async function drLoad(force) {
  if (DR.loading || (!force && DR.d && Date.now() - DR.d._at < 30000)) return;
  DR.loading = true;
  try { DR.d = await rpc('drone_state'); DR.d._at = Date.now(); DR.d._skew = 0; DR.err = '' } catch (e) { DR.err = e.message }
  DR.loading = false; if (FV.open && FV.tab === 'droon') renderFV(true);
}
function drSpots() {
  return (FD.spots || []).filter(s => FS.level >= s.min_level && (!s.boat || (FS.boats || []).includes(s.boat)) && (s.id !== 'udulaht' || (FS.cabin || []).includes('sild')));
}
function drBaits() {
  const own = FS.baits || {};
  return (FD.baits || []).filter(b => b.consumable ? +own[b.id] > 0 : (+b.price === 0 || own[b.id]));
}
function drLeft(ms) { const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : m ? `${m} min ${s % 60} s` : `${s} s` }

/* ---------- joonis: droon hõljub vee kohal, nöör vees ---------- */
function drDraw(cv, t) {
  const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr) }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const d = DR.d || {}, lvl = d.lvl || 1, active = !!d.spot, cap = d.cfg ? +d.cfg.cap : 8, rdy = +d.ready || 0;
  const hr = new Date().getHours(), night = hr < 6 || hr >= 21;
  // taevas
  let g = c.createLinearGradient(0, 0, 0, H * .62);
  g.addColorStop(0, night ? '#08162a' : '#3d7fa6'); g.addColorStop(1, night ? '#1a3550' : '#a9d6e6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (night) { c.fillStyle = 'rgba(255,255,240,.8)'; for (let i = 0; i < 26; i++) { const x = (i * 97) % W, y = (i * 53) % (H * .5); c.globalAlpha = .4 + .4 * Math.sin(t * 1.5 + i); c.fillRect(x, y, 1.4, 1.4) } c.globalAlpha = 1 }
  // kauge kallas metsaga
  const hy = H * .6;
  c.fillStyle = night ? '#0c2230' : '#2f5f52';
  c.beginPath(); c.moveTo(0, hy); for (let x = 0; x <= W; x += 14) c.lineTo(x, hy - 10 - Math.abs(Math.sin(x * .07)) * 16 - ((x * 7) % 11)); c.lineTo(W, hy); c.fill();
  // vesi
  g = c.createLinearGradient(0, hy, 0, H); g.addColorStop(0, night ? '#14384a' : '#3f8fa8'); g.addColorStop(1, night ? '#071824' : '#1c5068'); c.fillStyle = g; c.fillRect(0, hy, W, H - hy);
  c.strokeStyle = 'rgba(220,245,255,.22)'; c.lineWidth = 1.2;
  for (let k = 0; k < 6; k++) { const y = hy + 10 + k * (H - hy) / 6; c.beginPath(); for (let x = 0; x <= W; x += 8) { const yy = y + Math.sin(x * .05 + t * (1 + k * .2) + k) * (1.5 + k * .4); x ? c.lineTo(x, yy) : c.moveTo(x, yy) } c.stroke() }
  // droon
  const dx = W * .5 + Math.sin(t * .6) * W * .08, dy = H * (W < 520 ? .42 : .3) + Math.sin(t * 1.7) * 5, sz = Math.min(W, 520) * .14, col = DR_COL[lvl] || '#8fd0e8';
  if (active) {
    // nöör vette ja ujuk
    const fx = dx + Math.sin(t * .6 + .5) * 6, fy = hy + 18 + Math.sin(t * 2.2) * 2;
    c.strokeStyle = 'rgba(240,240,240,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(dx, dy + sz * .2); c.quadraticCurveTo(dx + 6, (dy + fy) / 2, fx, fy); c.stroke();
    c.fillStyle = '#ff5a4a'; c.beginPath(); c.ellipse(fx, fy - 2, 3.5, 4.5, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(fx, fy - 5, 3.5, 2, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(fx, fy + 2, 8 + Math.sin(t * 3) * 2, 2.5, 0, 0, 7); c.stroke();
  }
  // vari vee peal
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(dx, hy + 26, sz * .9, 5, 0, 0, 7); c.fill();
  // korv kaladega (täitub)
  if (active || rdy) {
    const bx = dx, by = dy + sz * .52, bw = sz * .55, fill = Math.min(1, rdy / cap);
    c.strokeStyle = 'rgba(220,220,210,.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(dx - sz * .2, dy + sz * .16); c.lineTo(bx - bw / 2, by); c.moveTo(dx + sz * .2, dy + sz * .16); c.lineTo(bx + bw / 2, by); c.stroke();
    c.fillStyle = '#7a5530'; c.beginPath(); c.moveTo(bx - bw / 2, by); c.lineTo(bx + bw / 2, by); c.lineTo(bx + bw * .38, by + sz * .34); c.lineTo(bx - bw * .38, by + sz * .34); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,24,10,.6)'; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(bx - bw / 2 + i * bw / 4, by); c.lineTo(bx - bw * .38 + i * bw * .19, by + sz * .34); c.stroke() }
    for (let i = 0; i < Math.round(fill * 5); i++) { const fx2 = bx - bw * .3 + (i % 3) * bw * .3, fy2 = by - 2 - Math.floor(i / 3) * 4; c.fillStyle = ['#c8d8e0', '#e8c070', '#9ad0a0'][i % 3]; c.beginPath(); c.ellipse(fx2, fy2, bw * .16, 3, (i % 2 ? .4 : -.4), 0, 7); c.fill() }
  }
  // kere ja sõlmed
  const arm = sz * .75;
  c.strokeStyle = '#2b3a44'; c.lineWidth = Math.max(2, sz * .07); c.lineCap = 'round';
  c.beginPath(); c.moveTo(dx - arm, dy - sz * .08); c.lineTo(dx + arm, dy - sz * .08); c.stroke();
  for (const sx of [-1, 1]) {
    const px = dx + sx * arm, py = dy - sz * .16;
    c.fillStyle = '#1e2a32'; c.fillRect(px - 2, py, 4, sz * .1);
    // pöörlevad propellerid
    const sp = active ? 1 : .35, a = .5 + .5 * Math.sin(t * 40 * sp);
    c.fillStyle = `rgba(220,235,245,${.18 + .12 * a})`; c.beginPath(); c.ellipse(px, py, sz * .42, sz * .06, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(30,40,50,.7)'; c.lineWidth = 1.4; c.beginPath(); const L = sz * .42 * Math.cos(t * 30 * sp + sx); c.moveTo(px - L, py); c.lineTo(px + L, py); c.stroke();
  }
  g = c.createLinearGradient(0, dy - sz * .3, 0, dy + sz * .25); g.addColorStop(0, '#f4f7f8'); g.addColorStop(.5, col); g.addColorStop(1, '#2a4652');
  c.fillStyle = g; c.beginPath(); c.roundRect(dx - sz * .38, dy - sz * .24, sz * .76, sz * .4, sz * .14); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke();
  // kaamera-silm ja tuled
  c.fillStyle = '#0e1a20'; c.beginPath(); c.arc(dx, dy + sz * .02, sz * .09, 0, 7); c.fill();
  c.fillStyle = 'rgba(120,220,255,.85)'; c.beginPath(); c.arc(dx - sz * .025, dy - sz * .005, sz * .03, 0, 7); c.fill();
  const blink = Math.sin(t * 4) > .6;
  c.fillStyle = blink ? (active ? '#7aff9a' : '#ffbf5a') : 'rgba(80,90,90,.6)'; c.beginPath(); c.arc(dx + sz * .27, dy - sz * .12, sz * .035, 0, 7); c.fill();
  if (blink) { c.fillStyle = active ? 'rgba(122,255,154,.25)' : 'rgba(255,190,90,.25)'; c.beginPath(); c.arc(dx + sz * .27, dy - sz * .12, sz * .1, 0, 7); c.fill() }
  // taseme tähed kerel
  c.fillStyle = '#ffe2a0'; for (let i = 0; i < lvl; i++) { c.beginPath(); c.arc(dx - sz * .22 + i * sz * .06, dy + sz * .1, sz * .018, 0, 7); c.fill() }
}
function drLoop() {
  const cv = document.getElementById('drCv');
  if (!cv || !FV.open || FV.tab !== 'droon') { DR.raf = 0; return }
  const now = performance.now(); if (now - (DR.lastDraw || 0) > 32) { DR.lastDraw = now; drDraw(cv, (now - DR.t0) / 1000) } // ~30 kaadrit sekundis
  DR.raf = requestAnimationFrame(drLoop);
}

/* ---------- vahekaart ---------- */
function drTab() {
  if (!DR.d) { drLoad(); return `<div class="fv-card"><p class="lead">${DR.err ? esc(DR.err) : 'Laen drooni…'}</p></div>` }
  if (Date.now() - DR.d._at > 30000) drLoad();
  const d = DR.d;
  if (!d.have) {
    const n = d.next, can = FS.level >= n.need;
    return `<div class="fv-card" style="padding:12px"><div class="dr-scene"><canvas id="drCv" aria-label="Kalapüügidroon"></canvas><div class="dr-cap"><b>Kalapüügidroon</b><small>Püüab sinu eest ka siis, kui oled eemal</small></div></div>
      <p class="lead" style="margin:8px 4px 0">Saada droon püügikohta koos söödaga. Ta toob iga ${n.min} minuti järel kala korvi, kuni korv on täis. Tule tagasi, korja saak ära ja saada ta uuesti. Droon ei püüa legendaarseid ega müütilisi kalu – need jäävad sinu enda püüda.</p>
      <div class="dr-up"><p><b style="color:#eef4f0">Droon „${n.name}“</b> · korvi mahub ${n.cap} kala · ${can ? `hind ${fmt(n.cost)} kulda` : `avaneb kalapüügi ${n.need}. tasemel`}</p>
      <button class="btn" type="button" data-dr="buy" ${can && !DR.busy ? '' : 'disabled'}>Osta droon · ${fmt(n.cost)}</button></div></div>`;
  }
  const cfg = d.cfg, cap = +cfg.cap, rdy = +d.ready, sp = d.spot && FD.spot[d.spot], bt = d.bait && FD.bait[d.bait];
  const pct = Math.min(100, rdy / cap * 100);
  let h = `<div class="fv-card" style="padding:12px"><div class="dr-scene"><canvas id="drCv" aria-label="Droon ${esc(cfg.name)}"></canvas>
    <div class="dr-cap"><b>Droon „${esc(cfg.name)}“</b><small>${sp ? `Püüab: ${esc(sp.name)}${bt ? ` · ${esc(bt.name)}` : ''}` : 'Ootab sadamas'}</small></div>
    <div class="dr-basket"><b>${rdy}/${cap}</b><small>kala korvis</small><div class="dr-bar"><i style="width:${pct.toFixed(0)}%"></i></div></div></div>`;
  if (sp) {
    const full = rdy >= cap;
    h += `<div class="dr-stat">
      <div><small>Järgmine kala</small><b ${d.next_at ? `data-dr-next="${Date.parse(d.next_at)}"` : ''}>${d.next_at ? drLeft(Date.parse(d.next_at) - Date.now()) : full ? 'Korv on täis' : '—'}</b></div>
      <div><small>Üks kala</small><b>${Math.round(d.sec / 60)} min</b></div>
      <div><small>Sööta alles</small><b>${d.baits_left == null ? '∞' : Math.max(0, d.baits_left - rdy)}</b></div>
      <div><small>Kokku püütud</small><b>${fmt(d.total)}</b></div></div>
      ${d.stuck ? '<div class="dr-warn">🪱 Sööt on otsas – droon ei saa rohkem püüda. Korja saak ja saada ta uue söödaga.</div>' : full ? '<div class="dr-warn">🧺 Korv on täis – korja saak, et droon saaks edasi püüda.</div>' : ''}
      <div class="dr-row"><button class="btn" type="button" data-dr="collect" ${rdy && !DR.busy ? '' : 'disabled'}>🧺 Korja saak${rdy ? ` (${rdy})` : ''}</button>
      <button class="btn ghost" type="button" data-dr="recall" ${DR.busy ? 'disabled' : ''}>Kutsu tagasi</button></div>`;
  }
  h += '</div>';
  if (DR.got) {
    const g = DR.got;
    h += `<div class="fv-card"><h2>Droon tõi ${g.fish.length} kala</h2><div class="dr-got">${g.fish.map(f => `<div style="--rc:${DR_COL[f.rarity] || '#8fd0e8'}"><b>${esc(f.name)}</b><small>${fKg(+f.weight)}</small></div>`).join('')}</div>
      <p class="lead" style="margin:0">✨ +${fmt(g.xp)} kogemust · kalad on sinu saagis</p></div>`;
  }
  // saatmine
  const spots = drSpots(), baits = drBaits();
  if (!DR.pick.spot) DR.pick.spot = d.spot || FV.spot || (spots[0] && spots[0].id) || '';
  if (!DR.pick.bait || !baits.some(b => b.id === DR.pick.bait)) DR.pick.bait = (d.bait && baits.some(b => b.id === d.bait)) ? d.bait : (baits[0] && baits[0].id) || '';
  h += `<div class="fv-card"><h2>${sp ? 'Saada teise kohta' : 'Saada droon püüdma'}</h2>
    <div class="dr-lbl">Püügikoht</div><div class="dr-chips">${spots.map(s => `<button type="button" class="${DR.pick.spot === s.id ? 'on' : ''}" data-dr-spot="${s.id}">${esc(s.name)}</button>`).join('')}</div>
    <div class="dr-lbl">Sööt</div><div class="dr-chips">${baits.length ? baits.map(b => `<button type="button" class="${DR.pick.bait === b.id ? 'on' : ''}" data-dr-bait="${b.id}">${esc(b.name)}${b.consumable ? ` · ${(FS.baits || {})[b.id]}` : ''}</button>`).join('') : '<span class="lead">Sul pole sööta – osta seda poest.</span>'}</div>
    <div class="dr-row"><button class="btn" type="button" data-dr="send" ${DR.pick.spot && DR.pick.bait && !DR.busy ? '' : 'disabled'}>🛸 Saada droon</button>
    <small class="lead" style="font-size:12.5px">${sp ? 'Senine saak korjatakse enne automaatselt kokku.' : `Iga kala võtab ühe söödaühiku. Lant ei kulu.`}</small></div></div>`;
  // uuendus
  const n = d.next;
  h += `<div class="fv-card"><h2>Drooni uuendus</h2>${n ? `<div class="dr-up"><p><b style="color:#eef4f0">„${esc(n.name)}“</b>: üks kala ${n.min} min (praegu ${cfg.min}), korvi mahub ${n.cap} (praegu ${cap})${n.maxr > cfg.maxr ? `, püüab ka ${n.maxr === 3 ? 'haruldasi' : 'eepilisi'} kalu` : ''}.${FS.level < n.need ? ` Avaneb kalapüügi ${n.need}. tasemel.` : ''}</p>
    <button class="btn" type="button" data-dr="buy" ${FS.level >= n.need && !DR.busy ? '' : 'disabled'}>Uuenda · ${fmt(n.cost)}</button></div>` : '<p class="lead" style="margin:0">⭐ Sinu droon on parim, mis olemas on.</p>'}
    <p class="lead" style="margin:0;font-size:12.5px">💡 Oskuste puu oskus „Droonimeister“ teeb drooni veel kiiremaks.</p></div>`;
  return h;
}
async function drAct(a) {
  if (DR.busy) return; DR.busy = true; renderFV(true);
  try {
    let r;
    if (a === 'buy') { r = await rpc('drone_buy'); toast(`🛸 Droon „${r.bought.name}“ on sinu!`, 'good') }
    else if (a === 'send') { r = await rpc('drone_send', { p_spot: DR.pick.spot, p_bait: DR.pick.bait }); toast(`🛸 Droon lendas: ${FD.spot[r.sent] ? FD.spot[r.sent].name : r.sent}`, 'good'); if (r.collected) DR.got = r.collected }
    else if (a === 'recall') { r = await rpc('drone_recall'); toast('Droon tuli tagasi.', 'info'); if (r.collected) DR.got = r.collected }
    else if (a === 'collect') { r = await rpc('drone_collect'); DR.got = r.collected; toast(`🧺 Droon tõi ${r.collected.fish.length} kala (+${fmt(r.collected.xp)} kogemust)`, 'good') }
    DR.d = r; DR.d._at = Date.now();
    if (typeof refreshFS === 'function') { try { await refreshFS() } catch (e) { } }
  } catch (e) { toast(e.message, 'bad') }
  DR.busy = false; renderFV(true);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-dr],[data-dr-spot],[data-dr-bait]'); if (!b || b.disabled) return;
  if (b.dataset.drSpot) { DR.pick.spot = b.dataset.drSpot; renderFV(true) }
  else if (b.dataset.drBait) { DR.pick.bait = b.dataset.drBait; renderFV(true) }
  else drAct(b.dataset.dr);
});
FTABS.droon = 'Droon';
FTAB_FN.droon = drTab;
if (typeof FT_SVG !== 'undefined') FT_SVG.droon = '<rect x="9" y="10" width="6" height="4" rx="1.5"/><path d="M9 11H5M15 11h4"/><path d="M2.5 8.5h5M16.5 8.5h5"/><path d="M5 8.5V11M19 8.5V11"/><path d="M12 14v4"/><path d="M10.5 18h3"/>';
{
  const _r = renderFV;
  renderFV = function () { const r = _r.apply(this, arguments); if (FV.open && FV.tab === 'droon' && !DR.raf && document.getElementById('drCv')) DR.raf = requestAnimationFrame(drLoop); return r };
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); if (DR.d && DR.d.have && DR.d.spot) { const c = +DR.d.cfg.cap, r = +DR.d.ready; if (r >= c || DR.d.stuck) b.droon = r } return b };
}
// taimer: järgmine kala; kui aeg täis, värskenda olekut
setInterval(() => {
  if (!FV.open || FV.tab !== 'droon') return;
  let due = false;
  document.querySelectorAll('[data-dr-next]').forEach(el => { const ms = +el.dataset.drNext - Date.now(); el.textContent = ms <= 0 ? 'Kohe!' : drLeft(ms); if (ms <= -1500) due = true });
  if (due && !DR.loading && Date.now() - DR.d._at > 5000) drLoad(true);
}, 1000);
