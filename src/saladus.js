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
  6: 'See tükk on veel udu sees.',
  7: 'See tükk on veel udu sees.'
};
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
function secDrawWorld(c, w, h, caveOpen) {
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
}
function paintSecMap() {
  const cv = document.querySelector('canvas.sec-map'); if (!cv || !SEC.d) return;
  const w = cv.clientWidth || 340, h = cv.clientHeight || 212, dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const have = new Set((SEC.d.pieces || []).map(p => p.n));
  c.fillStyle = '#0d1a20'; c.fillRect(0, 0, w, h);
  const path = n => { c.beginPath(); SEC_GEO[n].forEach(([x, y], i) => i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h)); c.closePath() };
  for (let n = 1; n <= 7; n++) {
    if (have.has(n)) { c.save(); path(n); c.clip(); secDrawWorld(c, w, h, SEC.d.cave_open); c.restore(); path(n); c.strokeStyle = 'rgba(90,60,25,.9)'; c.lineWidth = 1.5; c.stroke() }
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
  const r = d.run, lan = '🏮'.repeat(Math.max(0, d.lanterns)) + '<span style="opacity:.25">' + '🏮'.repeat(Math.max(0, 3 - d.lanterns)) + '</span>';
  let h = `<div class="fv-card sec-cave"><h2>💎 Kristallikoobas</h2>
    <p class="lead">Iga päev on sul 3 laternat. Vali igal sammul üks kolmest käigust. Mida sügavamale, seda suurem saak, aga ka varinguoht. Varingu korral jääb alles pool kullast ja esemed kaovad. Kaarditükid jäävad alati sulle.</p>
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
  h += `<div class="fv-card"><h2>Salajased ülesanded</h2><p class="lead">Neid ülesandeid ei ole kuskil kirjas. Raamat annab ainult vihje – ülejäänu pead ise välja mõtlema.</p>
    <div class="sec-list">${sc.map(s => s.found
      ? `<div class="sec-s got"><b>🔮 ${esc(s.name)}</b><small>${esc(s.descr)}</small><small>Avastatud ${new Date(s.at).toLocaleDateString('et-EE')} · +${fmt(s.gold)} kulda${s.item ? ` · ${itemName(s.item)}${s.qty > 1 ? ' ×' + s.qty : ''}` : ''}</small></div>`
      : `<div class="sec-s"><b>❔ ???</b><small><i>„${esc(s.hint)}“</i></small></div>`).join('')}</div></div>`;
  return h;
}

/* ---------- avastuse teade ---------- */
function secShow(sec) {
  if (!sec || (!(sec.found || []).length && !(sec.pieces || []).length)) return;
  SEC.queue.push(sec); SEC.d = null; loadSec(false);
  clearTimeout(SEC.qT); SEC.qT = setTimeout(secShowNow, 700);
}
function secShowNow() {
  if (!SEC.queue.length) return;
  if (UI.modalView) { SEC.qT = setTimeout(secShowNow, 1200); return }
  const all = SEC.queue.splice(0), found = all.flatMap(s => s.found || []), pieces = all.flatMap(s => s.pieces || []), cave = all.some(s => s.cave);
  if (typeof sfx === 'function') sfx('levelup');
  showModal(() => `<div class="rays"></div>${Array.from({ length: 8 }, (_, i) => `<i class="mote" style="left:${8 + i * 11}%;top:${26 + (i * 43) % 54}%;animation-delay:${(i * .41) % 3}s"></i>`).join('')}
    <div class="ribbon">${found.length ? 'Avastasid saladuse!' : 'Leidsid kaarditüki!'}</div>
    <div class="emblem"><div class="emblem-in"><b style="font-size:46px">${found.length ? '🔮' : '🗺️'}</b><small>${found.length ? 'saladus' : 'tükk'}</small></div></div>
    ${found.map(f => `<h2>${esc(f.name)}</h2><p class="sub">${esc(f.descr)}</p>`).join('')}
    <div class="unlock-list">${found.map(f => `<span>+${fmt(f.gold)} kulda</span>${(f.items || []).map(x => `<span>${itemName(x.id)}${x.qty > 1 ? ' ×' + x.qty : ''}</span>`).join('')}`).join('')}${pieces.map(n => `<span>🗺️ Kaarditükk nr ${n}</span>`).join('')}</div>
    ${cave ? '<p class="sub"><b>Kaardile ilmus tee Kristallikoopasse!</b></p>' : ''}
    <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Edasi</button><button class="btn" type="button" data-sa="book">Ava Saladuste raamat</button></div>`, 'lvlup');
}

/* ---------- laiendused olemasolevatele funktsioonidele ---------- */
{
  const baseRpc = rpc;
  rpc = async function (fn, args) { const r = await baseRpc(fn, args); try { if (r && typeof r === 'object' && r.sec) secShow(r.sec) } catch (e) { } return r };
  const baseRender = renderFV;
  renderFV = function (force) { baseRender(force); try { paintSecMap() } catch (e) { } };
  const baseBadges = fvBadges;
  fvBadges = function () { const b = baseBadges(); if (SEC.d && SEC.d.cave_open && !SEC.d.run && SEC.d.lanterns > 0) b.saladus = SEC.d.lanterns; return b };
  const baseRefresh = refreshFS;
  refreshFS = async function () { const r = await baseRefresh(); if (!SEC.d && !SEC.loading) loadSec(false); return r };
  const baseNews = newsText;
  newsText = function (n) { if (n.kind === 'secret') return `<b>${esc(n.name)}</b>${n.title ? ` <small class="lead">${esc(n.title)}</small>` : ''} avastas Udukuninga saladuse! 🔮 (kokku ${(n.data || {}).n || 1})`; return baseNews(n) };
  NEWS_IC.secret = '🔮';
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
  if (el.dataset.fa === 'tab') { SEC.ev = null; loadSec(false); return }
  const a = el.dataset.sa;
  if (a === 'book') { closeModal(); openFishView('saladus'); return }
  if (SEC.busy) return; SEC.busy = true; renderFV(true);
  try {
    let r;
    if (a === 'start') { r = await rpc('secret_cave_start'); SEC.ev = null }
    else if (a === 'go') r = await rpc('secret_cave_go', { p_door: +el.dataset.arg });
    else if (a === 'leave') r = await rpc('secret_cave_leave');
    if (r) {
      SEC.ev = r.event || null; const { event, sec, levels, ach, ...st } = r; SEC.d = st;
      if (event && event.type === 'collapse' && typeof sfx === 'function') sfx('bad');
      if (event && event.type !== 'step') { await refreshFS(); afterLevels(levels); afterAch(ach) }
    }
  } catch (er) { toast(er.message, 'bad') }
  SEC.busy = false; renderFV(true);
});
