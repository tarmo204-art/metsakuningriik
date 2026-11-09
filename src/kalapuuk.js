/* ================= KALAPÜÜK (serveri kontrollitud) ================= */
ICON.fish = '<svg viewBox="0 0 20 20"><path d="M2 10 C5 4.5, 12 4.5, 15 10 C12 15.5, 5 15.5, 2 10Z" fill="#7fbcd2"/><path d="M14 10 L19 6 L18 10 L19 14Z" fill="#5a9ab4"/><circle cx="5.5" cy="9" r="1" fill="#1a1a1a"/><path d="M8 7 Q9.5 10 8 13" stroke="#4f8aa4" stroke-width="1" fill="none"/></svg>';
TOOL_ICON.pyua = '<svg viewBox="0 0 20 20"><path d="M3 18 L15 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 3 Q18 9 16 15" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="16" cy="15.5" r="1.8" fill="currentColor"/></svg>';
const RAR2 = { 1: ['Tavaline', '#c3d3a4'], 2: ['Ebatavaline', '#8fd17a'], 3: ['Haruldane', '#6cb8ff'], 4: ['Eepiline', '#c58cff'], 5: ['Legendaarne', '#ffb347'], 6: ['Müütiline', '#ff6b9a'] };
const JUNK2 = { saabas: ['Vana saabas', 'Keegi on siin kunagi märjaks saanud.'], purk: ['Plekkpurk', 'Purgi põhjas kõlises 3 kuldmünti.'], kepp: ['Triivpuu', 'Lihtsalt üks märg oks. Vähemalt said harjutada.'], pudel: ['Pudelipost', 'Pudelis oli aardekaart! See saadeti sinu kuningriiki.'] };
const WTH2 = { paike: ['Päike', 'kalad võtavad aeglasemalt'], pilves: ['Pilves', 'tavaline püügiilm'], vihm: ['Vihm', 'kalad võtavad kiiremini, haruldasi rohkem'], udu: ['Udu', 'haruldasi kalu veidi rohkem'], torm: ['Torm', 'palju haruldasi kalu, aga õng murdub kergemini'] };
const FD = { loaded: false, spots: [], species: [], rods: [], baits: [], achs: [], sp: {}, rod: {}, bait: {}, spot: {} };
let FS = null;
const FV = { open: false, tab: 'puuk', spot: null, phase: 'idle', msg: '', cast: null, hook: null, result: null, sel: new Set(), market: null, comps: null, orders: null, busy: false, odds: null, oddsKey: '' };
function ensureFish() { }

/* ---------- stiilid ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.fv{position:fixed;inset:0;z-index:20;overflow-y:auto;background:radial-gradient(120% 60% at 50% 0%,#17394a 0%,var(--spruce) 60%);padding-top:env(safe-area-inset-top,0px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 20px)}
.fv-in{max-width:1100px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:12px;padding-block:12px}
.fv-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.fv-top h1{font-family:var(--f-display);font-weight:400;font-size:clamp(24px,5vw,34px);color:#eaf6fa;margin-right:auto}
.fv-lvl{display:flex;align-items:center;gap:10px;min-width:0}
.fv-badge{width:52px;height:56px;display:grid;place-items:center;align-content:center;border-radius:12px 12px 24px 24px;background:radial-gradient(circle at 50% 30%,#2f6a84,#173a4a);border:2px solid #86cde0;line-height:1;flex:none}
.fv-badge b{font-family:var(--f-head);font-size:21px;color:#d8f4ff}.fv-badge small{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#9cc8d8}
.fv-xp{width:170px;height:8px;border-radius:9px;background:rgba(0,0,0,.4);overflow:hidden}.fv-xp i{display:block;height:100%;background:linear-gradient(90deg,#5ac8e8,#c8f2ff);border-radius:9px;transition:width .4s}
.fv-purse{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(0,0,0,.3);border:1px solid rgba(242,181,82,.4);font-weight:800}
.fv-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
.fv-stat{padding:9px 11px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(134,205,224,.15);min-width:0}
.fv-stat small{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8fb4c2}
.fv-stat b{font-size:15px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fv-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:5px;border-radius:14px;background:rgba(0,0,0,.3)}
.fv-tabs button{position:relative;border:0;background:transparent;color:#a8c4ce;border-radius:10px;padding:8px 12px;font-weight:700;font-size:14px}
.fv-tabs button.on{background:#2a5a6c;color:#fff}
.fv-tabs .dot{position:absolute;top:2px;right:2px;min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:var(--berry);color:#fff;font-size:10px;line-height:16px;text-align:center}
.fv-body{display:grid;gap:12px}
.fv-card{background:rgba(14,32,40,.75);border:1px solid rgba(134,205,224,.16);border-radius:16px;padding:14px;display:grid;gap:10px;min-width:0}
.fv-card h2{font-family:var(--f-head);font-size:20px;color:#eaf6fa}
.fv-card h3{font-size:15.5px}
.spots{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.spot{border:1px solid rgba(134,205,224,.2);background:rgba(0,0,0,.25);color:inherit;border-radius:12px;padding:9px 10px;text-align:left;display:grid;gap:2px;min-width:0}
.spot b{font-size:14px}.spot small{font-size:12px;color:#9cb8c4}
.spot.on{border-color:#86cde0;background:rgba(134,205,224,.16);box-shadow:0 0 0 1px #86cde0 inset}
.spot.locked{opacity:.5}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.3);font-size:12.5px;font-weight:700;color:#cfe6ee}
.odds{display:flex;height:12px;border-radius:9px;overflow:hidden;background:rgba(0,0,0,.4)}
.odds i{display:block;height:100%}
.oddleg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:#a8c4ce}
.oddleg span{display:inline-flex;align-items:center;gap:5px}.oddleg em{width:9px;height:9px;border-radius:3px;display:inline-block}
#fvScene{display:block;width:100%;border-radius:14px;cursor:pointer;touch-action:manipulation;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.fvmsg{min-height:44px;font-size:15px;font-weight:700;color:#eaf6fa;background:rgba(0,0,0,.3);padding:10px 12px;border-radius:12px}
.bigbtn{width:100%;padding:16px;font-size:19px;border-radius:14px}
.bigbtn.pull{background:#ff7a4a;color:#2a0e05;box-shadow:0 3px 0 #b84a22,0 0 30px rgba(255,140,80,.5);animation:pulse .5s infinite alternate}
@keyframes pulse{to{transform:scale(1.02)}}
.ctrl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end}
.ctrl select{width:100%;padding:10px;border-radius:10px;background:rgba(0,0,0,.3);border:1px solid var(--line);color:var(--birch)}
.result{display:grid;grid-template-columns:170px minmax(0,1fr);gap:14px;align-items:center;padding:12px;border-radius:14px;background:rgba(0,0,0,.28);border:1px solid var(--rc,#86cde0);box-shadow:0 0 30px -10px var(--rc,#86cde0)}
.result canvas{width:170px;height:110px;border-radius:12px}
.result h3{font-size:22px;font-family:var(--f-head)}
.result .acts{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px}
.rpill{justify-self:start;display:inline-block;padding:2px 9px;border-radius:99px;font-size:11.5px;font-weight:800;background:rgba(0,0,0,.35)}
.inv{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.fcell{position:relative;display:grid;gap:3px;padding:8px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(134,205,224,.12);min-width:0;cursor:pointer}
.fcell.sel{border-color:#86cde0;background:rgba(134,205,224,.14)}
.fcell canvas{width:100%;height:62px;border-radius:8px}
.fcell b{font-size:13.5px}.fcell small{font-size:12px;color:#9cb8c4}
.fcell .tro{position:absolute;top:6px;right:6px;font-size:11px;background:#f2b552;color:#2a1a05;border-radius:6px;padding:1px 6px;font-weight:800}
.shop{display:grid;gap:8px}
.srow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:10px;border-radius:12px;background:rgba(0,0,0,.22)}
.srow.locked{opacity:.55}
.srow small{display:block;color:#9cb8c4;font-size:12.5px}
.book{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.bcell{display:grid;gap:2px;padding:8px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid transparent;min-width:0}
.bcell canvas{width:100%;height:56px;border-radius:8px}
.bcell b{font-size:13.5px}.bcell small{font-size:11.5px;color:#9cb8c4}
.achl{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.achc{padding:9px;border-radius:12px;background:rgba(0,0,0,.22);display:grid;gap:2px;border:1px solid transparent}
.achc.got{border-color:rgba(242,181,82,.5);background:linear-gradient(135deg,rgba(242,181,82,.14),rgba(0,0,0,.2))}
.achc b{font-size:13.5px}.achc small{font-size:12px;color:#9cb8c4}
.ctable{width:100%;border-collapse:collapse;font-size:13px}
.ctable td,.ctable th{padding:6px 5px;border-top:1px solid rgba(134,205,224,.1);text-align:left}
.ctable th{color:#8fb4c2;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-top:0}
.ctable td.n{text-align:right;font-variant-numeric:tabular-nums}
.ctable tr.me td{background:rgba(242,181,82,.12)}
.comps{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:12px}
@media (max-width:560px){.result{grid-template-columns:110px minmax(0,1fr)}.result canvas{width:110px;height:76px}.fv-xp{width:120px}.ctrl{grid-template-columns:1fr}}
</style>`);
document.body.insertAdjacentHTML('beforeend', '<section class="fv" id="fishView" hidden aria-label="Kalapüük"><div class="fv-in" id="fvIn"></div></section>');
const sceneCv = document.createElement('canvas'); sceneCv.id = 'fvScene'; sceneCv.setAttribute('aria-label', 'Püügikoht');

/* ---------- andmed ---------- */
async function loadFD() {
  if (FD.loaded) return;
  const q = async t => { const { data, error } = await CL.sb.from(t).select('*').order('sort'); if (error) throw new Error(etError(error)); return data };
  const [spots, species, rods, baits, achs] = await Promise.all([q('fish_spots'), q('fish_species'), q('fish_rods'), q('fish_baits'), q('fish_achievements')]);
  Object.assign(FD, { spots, species, rods, baits, achs, loaded: true });
  spots.forEach(x => FD.spot[x.id] = x); species.forEach(x => { x.min_w = +x.min_w; x.max_w = +x.max_w; FD.sp[x.id] = x }); rods.forEach(x => FD.rod[x.id] = x); baits.forEach(x => FD.bait[x.id] = x);
}
async function refreshFS() {
  FS = await rpc('fish_state');
  if (S) S.fishCache = { level: FS.level, total: FS.total };
  if (!FV.spot || (FD.spot[FV.spot] && FD.spot[FV.spot].min_level > FS.level)) FV.spot = 'metsajarv';
  if (FS.inbox > 0) claimInbox();
  return FS;
}
async function loadOdds() {
  const key = FV.spot + '|' + FS.bait + '|' + FS.rod + '|' + FS.level + '|' + FS.weather + '|' + FS.is_night + '|' + FS.luck;
  if (key === FV.oddsKey) return; FV.oddsKey = key;
  try { FV.odds = (await rpc('fish_odds', { p_spot: FV.spot, p_bait: FS.bait })).map(Number) } catch (e) { FV.odds = null }
}

/* ---------- avamine ---------- */
async function openFishView(tab) {
  if (!CL.user) {
    showModal(() => `<h2>Kalapüük vajab kontot</h2><p>Kalapüüki hoiab ja kontrollib server, seepärast pead olema sisse logitud.</p><div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Sulge</button><button class="btn" type="button" data-act="fvLogin">Logi sisse</button></div>`);
    return;
  }
  FV.open = true; if (tab) FV.tab = tab;
  $('#fishView').hidden = false; document.body.style.overflow = 'hidden';
  $('#fvIn').innerHTML = '<div class="fv-card"><p class="lead">Laadin kalapüüki…</p></div>';
  try { await loadFD(); await refreshFS(); await loadOdds(); FV.market = await rpc('fish_market').catch(() => null); FV.comps = null; FV.orders = null; loadSide() } catch (e) { $('#fvIn').innerHTML = `<div class="fv-card"><h2>Kalapüüki ei saanud avada</h2><p class="lead">${esc(e.message)}</p><div><button class="btn" type="button" data-fa="close">Tagasi kuningriiki</button></div></div>`; return }
  renderFV(true);
  requestAnimationFrame(sceneLoop);
}
function closeFishView() {
  if (['casting', 'waiting', 'bite', 'hooking', 'reel', 'landing'].includes(FV.phase) && FV.cast) rpc('fish_lose', { p_cast: FV.cast.cast_id }).catch(() => { });
  FV.open = false; FV.phase = 'idle'; FV.cast = null; $('#fishView').hidden = true; document.body.style.overflow = '';
  if (S) { hudUpdate(); renderPanel(true) }
}
async function loadSide() {
  try { FV.orders = await rpc('fish_orders_today') } catch (e) { }
  try { FV.comps = await rpc('fish_competitions') } catch (e) { }
  if (FV.open) renderFV();
}

/* ---------- joonistamine ---------- */
function drawLook(c, x, y, L, look, t = 0, dir = 1, junk) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  if (junk) {
    if (junk === 'saabas') { poly(c, [-L * .3, -L * .35, -L * .05, -L * .35, -L * .05, L * .05, L * .35, L * .1, L * .35, L * .25, -L * .3, L * .25], '#5a3e2a'); rect(c, -L * .3, L * .18, L * .65, L * .07, '#2a1a10') }
    else if (junk === 'pudel') { ell(c, 0, 0, L * .3, L * .12, 'rgba(140,200,170,.75)'); rect(c, L * .26, -L * .05, L * .14, L * .1, 'rgba(140,200,170,.75)'); rect(c, L * .38, -L * .055, L * .05, L * .11, '#8a5a34'); rect(c, -L * .15, -L * .06, L * .3, L * .12, '#e8d3a2') }
    else if (junk === 'purk') { rect(c, -L * .15, -L * .25, L * .3, L * .45, '#a9b1b3'); ell(c, 0, -L * .25, L * .15, L * .05, '#d0d6d8'); rect(c, -L * .15, -L * .1, L * .3, L * .12, '#c8473a') }
    else if (junk === 'kepp') { c.strokeStyle = '#6b4528'; c.lineWidth = L * .07; c.lineCap = 'round'; c.beginPath(); c.moveTo(-L * .4, L * .1); c.lineTo(L * .4, -L * .08); c.moveTo(0, 0); c.lineTo(L * .12, -L * .2); c.stroke() }
    else { rect(c, -L * .35, -L * .15, L * .7, L * .35, '#5a3e22'); poly(c, [-L * .35, -L * .15, -L * .3, -L * .3, L * .3, -L * .3, L * .35, -L * .15], '#6a4a2a'); rect(c, -L * .35, -L * .16, L * .7, L * .05, '#e0a83a'); rect(c, -L * .04, -L * .17, L * .08, L * .12, '#ffd060') }
    c.restore(); return;
  }
  look = look || {}; const [body, back, belly, fin] = look.c || ['#9fb4bc', '#4a6a7a', '#eef4f6', '#7a9aaa'];
  const hh = ({ n: .2, l: .15, e: .08, d: .3, f: .26 }[look.s] || .2) * L, wig = Math.sin(t * 6) * L * .04;
  if (look.g) { const g = c.createRadialGradient(0, 0, 0, 0, 0, L * .7); g.addColorStop(0, look.g + '88'); g.addColorStop(1, look.g + '00'); c.fillStyle = g; c.fillRect(-L, -L, L * 2, L * 2) }
  if (look.s === 'e') { c.beginPath(); c.moveTo(L * .3, 0); c.quadraticCurveTo(L * .45, -hh + wig, L * .55, wig); c.quadraticCurveTo(L * .45, hh + wig, L * .3, 0); c.fillStyle = fin; c.fill() }
  else poly(c, [L * .38, 0, L * .55, -hh * 1.1 + wig, L * .5, wig, L * .55, hh * 1.1 + wig], fin);
  poly(c, [-L * .05, -hh * .85, L * .12, -hh * 1.45, L * .22, -hh * .75], fin);
  poly(c, [L * .05, hh * .8, L * .15, hh * 1.25, L * .22, hh * .7], fin);
  c.beginPath(); c.moveTo(-L * .45, 0); c.bezierCurveTo(-L * .35, -hh * 1.3, L * .25, -hh * 1.2, L * .4, 0); c.bezierCurveTo(L * .25, hh * 1.2, -L * .35, hh * 1.3, -L * .45, 0); c.closePath();
  const g = c.createLinearGradient(0, -hh, 0, hh); g.addColorStop(0, back); g.addColorStop(.45, body); g.addColorStop(1, belly); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  if (look.st) for (let i = 0; i < look.st; i++) rect(c, -L * .3 + i * L * .1, -hh * 1.2, L * .035, hh * 1.4, 'rgba(30,40,20,.35)');
  if (look.b) rect(c, -L * .4, -hh * .15, L * .8, hh * .3, look.b + 'aa');
  if (look.sp) for (let i = 0; i < 9; i++) circ(c, -L * .3 + th(i, 1, L) * L * .6, -hh * .8 + th(i, 2, L) * hh * 1.2, L * .018, 'rgba(30,30,20,.4)');
  c.restore();
  circ(c, -L * .32, -hh * .2, Math.max(1, L * .035), '#f6f2e8'); circ(c, -L * .325, -hh * .2, Math.max(.8, L * .02), '#111');
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, L * .012); c.beginPath(); c.moveTo(-L * .22, -hh * .7); c.quadraticCurveTo(-L * .16, 0, -L * .22, hh * .7); c.stroke();
  if (look.w) { c.beginPath(); c.moveTo(-L * .43, 0); c.quadraticCurveTo(-L * .55, hh * .4, -L * .6, hh * .9); c.moveTo(-L * .43, -hh * .05); c.quadraticCurveTo(-L * .56, -hh * .2, -L * .62, -hh * .1); c.stroke() }
  c.restore();
}
function paintFishCanvases(root) {
  root.querySelectorAll('canvas[data-fl]').forEach(cv2 => {
    const w = cv2.clientWidth || 140, h = cv2.clientHeight || 60, d = 2; cv2.width = w * d; cv2.height = h * d;
    const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    const r = +cv2.dataset.r || 1, col = (RAR2[r] || RAR2[1])[1];
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#24566a'); g.addColorStop(1, '#122e3a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const rg = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * .6); rg.addColorStop(0, col + '40'); rg.addColorStop(1, col + '00'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
    const sp = FD.sp[cv2.dataset.fl], junk = cv2.dataset.junk;
    const L = Math.min(w * .8, h * 2.2);
    if (cv2.dataset.unk === '1') { c.filter = 'brightness(0)'; c.globalAlpha = .85 }
    drawLook(c, w / 2, h / 2, L, sp && sp.look, 0, 1, junk);
    c.filter = 'none'; c.globalAlpha = 1;
  });
}

/* ---------- vaate kujundus ---------- */
function fvHeader() {
  const need = FS.xp_need || 1, pct = FS.level >= 50 ? 100 : Math.min(100, FS.xp / need * 100);
  const big = FS.biggest_species && FD.sp[FS.biggest_species] ? `${FD.sp[FS.biggest_species].name} ${fmt1(+FS.biggest)} kg` : '—';
  const rod = FD.rod[FS.rod], bait = FD.bait[FS.bait];
  const baitCnt = bait && bait.consumable ? ` (${(FS.baits || {})[bait.id] || 0})` : '';
  const rare = [3, 4, 5, 6].reduce((a, r) => a + ((FS.by_rarity || {})[r] || 0), 0);
  return `<div class="fv-top"><button class="btn ghost sm" type="button" data-fa="close">← Kuningriik</button><h1>Kalapüük</h1>
      <div class="fv-purse" title="Kalurikassa: kuld, mille teenid kalapüügiga">${ic('gold')}<span class="num">${fmt(FS.gold)}</span></div></div>
    <div class="fv-top" style="gap:14px"><div class="fv-lvl"><div class="fv-badge"><b>${FS.level}</b><small>tase</small></div><div style="display:grid;gap:3px;min-width:0">
      <b style="font-size:15px">${FS.title ? esc(FS.title) : 'Kalur'}</b><div class="fv-xp"><i style="width:${pct.toFixed(1)}%"></i></div>
      <small class="num" style="color:#9cb8c4">${FS.level >= 50 ? 'Maksimaalne tase!' : `${fmt(FS.xp)} / ${fmt(need)} kogemust · järgmise tasemeni ${fmt(need - FS.xp)}`}</small></div></div>
      <div class="chips" style="margin-left:auto">${weatherChips()}</div></div>
    <div class="fv-stats">
      <div class="fv-stat"><small>Püütud kalu</small><b class="num">${fmt(FS.total)}</b></div>
      <div class="fv-stat"><small>Suurim kala</small><b>${big}</b></div>
      <div class="fv-stat"><small>Haruldasi kalu</small><b class="num">${fmt(rare)}</b></div>
      <div class="fv-stat"><small>Õngeritv</small><b>${rod ? rod.name : ''} ${FS.rod_broken ? '<span style="color:var(--bad)">· katki</span>' : ''}</b></div>
      <div class="fv-stat"><small>Sööt</small><b>${bait ? bait.name + baitCnt : ''}</b></div></div>`;
}
function weatherChips() {
  const w = WTH2[FS.weather] || ['', ''];
  return `<span class="chip" title="${w[1]}">${w[0]}</span>${FS.is_night ? '<span class="chip" title="Öised kalad on väljas">🌙 Öö</span>' : '<span class="chip">☀️ Päev</span>'}${FS.is_winter ? '<span class="chip" title="Talvised kalad on väljas">❄️ Talv</span>' : ''}${FS.luck ? `<span class="chip" title="Kuldkala õnnistus">🍀 Õnn ${FS.luck}</span>` : ''}`;
}
const FTABS = { puuk: 'Püük', saak: 'Saak', pood: 'Pood', raamat: 'Kalaraamat', voistlus: 'Võistlused', tellimus: 'Tellimused' };
function fvBadges() {
  const b = {};
  b.saak = (FS.inventory || []).filter(x => !x.trophy).length || 0;
  if (FV.orders) b.tellimus = FV.orders.filter(o => !o.done && o.have >= o.qty).length;
  if (FV.comps) b.voistlus = ['big', 'rare', 'most'].filter(k => { const c = FV.comps[k]; return c && !c.claimed && (c.last || []).some(r => r.me && r.place <= 3) }).length;
  return b;
}
function renderFV(force) {
  if (!FV.open || !FS) return;
  if (!force && FV.busyUI) return;
  const b = fvBadges();
  const html = fvHeader() + `<nav class="fv-tabs">${Object.keys(FTABS).map(k => `<button type="button" class="${FV.tab === k ? 'on' : ''}" data-fa="tab" data-arg="${k}">${FTABS[k]}${b[k] ? `<span class="dot">${b[k] > 99 ? '99+' : b[k]}</span>` : ''}</button>`).join('')}</nav><div class="fv-body">${{ puuk: tabPuuk, saak: tabSaak, pood: tabPood, raamat: tabRaamat, voistlus: tabVoistlus, tellimus: tabTellimus }[FV.tab]()}</div>`;
  const root = $('#fvIn'), st = $('#fishView').scrollTop;
  root.innerHTML = html;
  const slot = root.querySelector('#fvSceneSlot'); if (slot) slot.replaceWith(sceneCv);
  paintFishCanvases(root);
  $('#fishView').scrollTop = st;
}

/* ---------- Püük ---------- */
function tabPuuk() {
  const spot = FD.spot[FV.spot];
  const owned = FD.baits.filter(b => b.price === 0 || (b.consumable ? ((FS.baits || {})[b.id] || 0) > 0 : (FS.baits || {})[b.id] !== undefined) || b.id === FS.bait);
  const odds = FV.odds;
  const active = !['idle', 'result', 'lost'].includes(FV.phase);
  let h = `<div class="fv-card"><h2>Püügikohad</h2><div class="spots">${FD.spots.map(s => { const lock = FS.level < s.min_level; return `<button type="button" class="spot ${s.id === FV.spot ? 'on' : ''} ${lock ? 'locked' : ''}" data-fa="spot" data-arg="${s.id}" ${active ? 'disabled' : ''}><b>${lock ? '🔒 ' : ''}${s.name}</b><small>${lock ? `Avaneb ${s.min_level}. tasemel` : `Raskus ${'●'.repeat(s.difficulty)}${'○'.repeat(5 - s.difficulty)}`}</small></button>` }).join('')}</div>
    <p class="lead">${spot ? esc(spot.descr) : ''}</p></div>`;
  h += `<div class="fv-card"><div id="fvSceneSlot"></div>
    <p class="fvmsg" id="fvMsg" aria-live="polite">${esc(FV.msg || phaseMsg())}</p>
    ${mainButton()}
    ${FV.phase === 'result' && FV.result ? resultCard() : ''}
    <div class="ctrl"><div class="field"><label for="fvBait">Sööt või peibutis</label><select id="fvBait" data-fa="bait" ${active ? 'disabled' : ''}>${owned.map(b => `<option value="${b.id}" ${b.id === FS.bait ? 'selected' : ''}>${b.name}${b.consumable ? ` (${(FS.baits || {})[b.id] || 0} tk)` : b.price ? ' (peibutis)' : ''}</option>`).join('')}</select></div>
      <button class="btn ghost sm" type="button" data-fa="tab" data-arg="pood">Osta sööta</button></div>
    ${odds ? `<div><div class="lead" style="font-size:12.5px;margin-bottom:5px">Võimalused selles kohas praeguse õnge, sööda, ilma ja kellaajaga (kokku 100%):</div><div class="odds">${odds.map((p, i) => p > 0 ? `<i style="width:${p}%;background:${RAR2[i + 1][1]}" title="${RAR2[i + 1][0]} ${fmt1(p)}%"></i>` : '').join('')}</div>
      <div class="oddleg">${odds.map((p, i) => `<span><em style="background:${RAR2[i + 1][1]}"></em>${RAR2[i + 1][0]} ${p >= 10 ? Math.round(p) : (Math.round(p * 10) / 10).toString().replace('.', ',')}%</span>`).join('')}</div>
      <p class="lead" style="font-size:12px">Lisaks võib õnge otsa sattuda naljakaid esemeid (5%) või veealune aardekirst (1,5%).</p></div>` : ''}
  </div>`;
  return h;
}
function phaseMsg() {
  switch (FV.phase) {
    case 'idle': return FS.rod_broken ? 'Sinu õng on katki. Paranda see poes.' : 'Vali püügikoht ja sööt ning vajuta „Viska õng“.';
    case 'casting': return 'Viskad õnge…';
    case 'waiting': return 'Ujuk hõljub vees. Oota, kuni kala näkkab…';
    case 'bite': return 'KALA NÄKKAS! Vajuta kohe „Tõmba!“';
    case 'hooking': return 'Haagid…';
    case 'reel': return 'Kala on konksus! Vajuta, kui valge joon on rohelisel alal.';
    case 'landing': return 'Tood kala välja…';
    default: return '';
  }
}
function mainButton() {
  if (FS.rod_broken && ['idle', 'result', 'lost'].includes(FV.phase)) return `<button class="btn bigbtn" type="button" data-fa="repair">Paranda õng (${repairCost2()} kulda)</button>`;
  if (['idle', 'result', 'lost'].includes(FV.phase)) return `<button class="btn bigbtn" type="button" data-fa="cast" ${FV.busy ? 'disabled' : ''}>Viska õng <small style="font-weight:500;opacity:.7;font-size:12px">(tühik)</small></button>`;
  if (FV.phase === 'waiting' || FV.phase === 'bite') return `<button class="btn bigbtn ${FV.phase === 'bite' ? 'pull' : ''}" type="button" data-fa="pull" id="fvPull">${FV.phase === 'bite' ? 'TÕMBA!' : 'Tõmba!'}</button>`;
  if (FV.phase === 'reel') return `<div style="display:grid;grid-template-columns:1fr auto;gap:8px"><button class="btn bigbtn pull" type="button" data-fa="pull" id="fvPull">Tõmba!</button><button class="btn ghost" type="button" data-fa="cut">Lase lahti</button></div>`;
  return `<button class="btn bigbtn" type="button" disabled>…</button>`;
}
function repairCost2() { const r = FD.rod[FS.rod]; return Math.max(10, Math.round((r ? r.price : 0) * 0.2)) }
function setMsg(m) { FV.msg = m; const el = $('#fvMsg'); if (el) el.textContent = m }
function setPhase(p, msg) { FV.phase = p; FV.msg = msg || ''; renderFV(true) }

/* põhitegevused */
async function doCast() {
  if (FV.busy || !['idle', 'result', 'lost'].includes(FV.phase)) return;
  if (FS.level < FD.spot[FV.spot].min_level) { toast('See koht on veel lukus.', 'bad'); return }
  FV.busy = true; FV.result = null; setPhase('casting');
  try {
    const r = await rpc('fish_cast', { p_spot: FV.spot, p_bait: FS.bait });
    FV.cast = r; FV.castAt = performance.now(); FV.biteAt = FV.castAt + r.wait_ms;
    const b = FD.bait[FS.bait]; if (b && b.consumable) FS.baits[b.id] = Math.max(0, ((FS.baits || {})[b.id] || 1) - 1);
    setPhase('waiting');
  } catch (e) { toast(e.message, 'bad'); setPhase('idle') }
  FV.busy = false;
}
async function doPull() {
  if (FV.phase === 'reel') { reelHit(); return }
  if (FV.phase !== 'waiting' && FV.phase !== 'bite' || FV.busy) return;
  FV.busy = true; const early = FV.phase === 'waiting'; setPhase('hooking');
  try {
    const r = await rpc('fish_hook', { p_cast: FV.cast.cast_id });
    if (!r.ok) {
      FS.lost++;
      setPhase('lost', r.reason === 'early' || early ? 'Liiga vara! Kala ehmus ära. Oota, kuni ujuk vee alla tõmbub.' : 'Liiga hilja! Kala jõudis minema ujuda.');
    } else {
      FV.hook = { ...r, at: performance.now(), hits: 0, misses: 0, maxMiss: 2 + Math.floor(FD.rods.findIndex(x => x.id === FS.rod) / 3), zc: rnd(.25, .75), zw: +r.zone, sp: +r.speed, t0: performance.now(), flash: 0 };
      const over = +r.est > +r.strength;
      setPhase('reel', over ? `Raske kala, umbes ${fmt1(+r.est)} kg! Sinu õng kannab ${fmt1(+r.strength)} kg. See võib murduda: tõmba või lase lahti.` : `Kala on konksus (umbes ${fmt1(+r.est)} kg)! Vajuta ${r.need} korda, kui valge joon on rohelisel alal.`);
    }
  } catch (e) { toast(e.message, 'bad'); setPhase('idle') }
  FV.busy = false;
}
function reelHit() {
  const h = FV.hook; if (!h || FV.busy) return;
  const lo = h.zc - h.zw / 2, hi = h.zc + h.zw / 2, nd = h.needle || 0;
  if (nd >= lo && nd <= hi) {
    h.hits++; h.flash = .25;
    if (h.hits >= h.need) { doLand(); return }
    h.zc = rnd(.18, .82); h.zw = Math.max(.07, h.zw * .93); h.sp *= 1.07;
    setMsg(['Hea! Kala väsib.', 'Veel natuke!', 'Tõmba, tõmba!'][h.hits % 3]);
  } else {
    h.misses++;
    if (h.misses >= h.maxMiss) { doLose('Nöör läks lõdvaks ja kala rebis end lahti.'); return }
    setMsg(`Mööda! Nöör on pingul. Vigu veel lubatud: ${h.maxMiss - h.misses}.`);
  }
}
async function doLose(msg) {
  const c = FV.cast; FV.hook = null; FS.lost++;
  setPhase('lost', msg);
  if (c) rpc('fish_lose', { p_cast: c.cast_id }).catch(() => { });
}
async function doLand() {
  FV.busy = true; const h = FV.hook;
  const minT = Math.max(.6, h.need * .45 - .3) * 1000 + 300, el = performance.now() - h.at;
  setPhase('landing');
  if (el < minT) await new Promise(r => setTimeout(r, minT - el));
  try {
    const r = await rpc('fish_land', { p_cast: FV.cast.cast_id });
    FV.hook = null;
    if (!r.ok) {
      if (r.reason === 'broken') { setPhase('lost', `Krõks! ${esc(r.name)} (${fmt1(+r.weight)} kg) oli liiga raske ja õng murdus. Paranda õng või osta tugevam.`); sparkleScene('#ff8a78'); }
      else if (r.reason === 'escaped') setPhase('lost', `Viimasel hetkel pääses ${r.name} õnge otsast!`);
      else setPhase('lost', 'Kala pääses minema.');
      await refreshFS(); afterAch(r.ach); renderFV(true);
    } else {
      FV.result = r; sparkleScene(r.kind === 'fish' ? RAR2[r.rarity][1] : '#ffd065');
      await refreshFS(); FV.market = await rpc('fish_market').catch(() => FV.market); FV.oddsKey = ''; loadOdds().then(() => FV.phase === 'result' && renderFV());
      setPhase('result', resultMsg(r));
      afterLevels(r.levels); afterAch(r.ach);
      FV.orders = null; loadSide();
    }
  } catch (e) { toast(e.message, 'bad'); setPhase('idle') }
  FV.busy = false;
}
function resultMsg(r) {
  if (r.kind === 'junk') return `Õnge otsas oli ${JUNK2[r.junk][0].toLowerCase()}! ${JUNK2[r.junk][1]}`;
  if (r.kind === 'chest') return `Veealune aardekirst! Said ${r.gold} kulda${r.map ? ' ja aardekaardi (saadeti kuningriiki)' : ''}.`;
  return `${r.giant ? 'REKORDILISELT SUUR! ' : ''}Püüdsid: ${r.name}, ${fmt1(+r.weight)} kg!${r.new_species ? ' Uus liik kalaraamatus!' : r.record ? ' Uus isiklik rekord!' : ''}`;
}
function estPrice(id) {
  const c = (FS.inventory || []).find(x => x.id === id); if (!c) return 0;
  const s = FD.sp[c.species], m = FV.market && FV.market[c.species] ? FV.market[c.species] : { mult: 1, sold: 0 };
  const avg = (s.min_w + s.max_w) / 2;
  return Math.max(1, Math.round(s.price * m.mult * Math.min(2, .6 + .4 * c.weight / avg) / (1 + m.sold / 15)));
}
function resultCard() {
  const r = FV.result;
  if (r.kind !== 'fish') return `<div class="result" style="--rc:#ffd065"><canvas data-fl="" data-junk="${r.kind === 'chest' ? 'chest' : r.junk}" data-r="1"></canvas><div><span class="rpill" style="color:#ffd065">${r.kind === 'chest' ? 'Aare' : 'Leid'}</span><h3>${r.kind === 'chest' ? 'Veealune aardekirst' : JUNK2[r.junk][0]}</h3><p class="lead">+${r.xp} kogemust${r.gold ? ` · +${r.gold} kulda` : ''}</p></div></div>`;
  const [rn, rc] = RAR2[r.rarity], inInv = (FS.inventory || []).some(x => x.id === r.catch_id), sp = FD.sp[r.species];
  return `<div class="result" style="--rc:${rc}"><canvas data-fl="${r.species}" data-r="${r.rarity}"></canvas><div style="display:grid;gap:4px"><span class="rpill" style="color:${rc}">${rn}</span><h3>${esc(r.name)}</h3>
    <p class="lead">${fmt1(+r.weight)} kg · +${r.xp} kogemust${r.giant ? ' · <b style="color:var(--amber-2)">rekordsuurus!</b>' : ''}${r.new_species ? ' · <b style="color:var(--ok)">uus liik!</b>' : r.record ? ' · <b style="color:var(--ok)">isiklik rekord!</b>' : ''}</p>
    <p class="lead" style="font-size:12.5px">${esc(sp ? sp.descr : '')}</p></div>
    ${inInv ? `<div class="acts"><button class="btn sm" type="button" data-fa="use" data-arg="sell:${r.catch_id}">Müü (~${estPrice(r.catch_id)} kulda)</button><button class="btn sm ghost" type="button" data-fa="use" data-arg="cook:${r.catch_id}">Toiduks</button><button class="btn sm ghost" type="button" data-fa="use" data-arg="release:${r.catch_id}">Lase vabaks</button><button class="btn sm ghost" type="button" data-fa="use" data-arg="trophy:${r.catch_id}">Trofeeriiulile</button>${r.rarity >= 4 ? `<button class="btn sm ghost" type="button" data-fa="exch" data-arg="${r.catch_id}">${r.species === 'kuldkala' ? 'Soovi midagi' : 'Vaheta preemia vastu'}</button>` : ''}<span class="lead" style="font-size:12px;align-self:center">või jäta saagi hulka</span></div>` : '<div class="acts"><span class="lead">Kala on kasutatud.</span></div>'}</div>`;
}

/* ---------- stseen ---------- */
const SCN = { metsajarv: ['#3f7a3a', '#3a7a94', '#163848'], jogi: ['#4a7a3a', '#4a8aa4', '#1a4050'], kuninglik: ['#3a6a3a', '#2f6a8a', '#0e2e44'], meri: ['#c8b884', '#2a6a8a', '#0e2e44'], jaa: ['#e8f2f6', '#2a5a70', '#0e2a38'], salajane: ['#3a4a5a', '#4a3a7a', '#140e2a'] };
let sparks = [];
function sparkleScene(col) { for (let i = 0; i < 40; i++) sparks.push({ x: .6, y: .5, vx: rnd(-.4, .4), vy: rnd(-.6, .1), life: rnd(.6, 1.2), col }) }
let lastSc = 0;
function sceneLoop(ts) {
  if (!FV.open) return;
  requestAnimationFrame(sceneLoop);
  const dt = Math.min(.05, (ts - lastSc) / 1000 || 0); lastSc = ts; const t = ts / 1000;
  // ajastused
  if (FV.phase === 'waiting' && performance.now() >= FV.biteAt) { FV.phase = 'bite'; FV.biteShown = performance.now(); renderFV(true) }
  if (FV.phase === 'bite' && performance.now() - FV.biteShown > 1150 && !FV.busy) doLose('Liiga hilja! Kala sõi sööda ära ja ujus minema.');
  if (FV.phase === 'reel' && FV.hook) { const h = FV.hook; h.needle = (Math.sin((performance.now() - h.t0) / 1000 * h.sp * Math.PI) + 1) / 2; if (h.flash > 0) h.flash -= dt }
  if (!sceneCv.isConnected) return;
  const w = sceneCv.clientWidth || 600, hgt = Math.round(Math.min(340, Math.max(200, w * .42))), d = Math.min(2, devicePixelRatio || 1);
  if (sceneCv.width !== Math.round(w * d) || sceneCv.height !== Math.round(hgt * d)) { sceneCv.width = Math.round(w * d); sceneCv.height = Math.round(hgt * d); sceneCv.style.height = hgt + 'px' }
  const c = sceneCv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const [shore, wTop, wBot] = SCN[FV.spot] || SCN.metsajarv, night = FS && FS.is_night, h = hgt;
  const sg = c.createLinearGradient(0, 0, 0, h * .32); sg.addColorStop(0, night ? '#0b1530' : FV.spot === 'salajane' ? '#5a4a8a' : '#8fc8e4'); sg.addColorStop(1, night ? '#1e2c58' : FV.spot === 'salajane' ? '#a898c8' : '#d6ecf2');
  c.fillStyle = sg; c.fillRect(0, 0, w, h * .32);
  if (night) for (let i = 0; i < 40; i++) circ(c, th(i, 1, 3) * w, th(i, 2, 3) * h * .28, th(i, 3, 3) * 1.3 + .3, `rgba(255,255,240,${.4 + .4 * Math.abs(Math.sin(t + i))})`);
  if (night) circ(c, w * .82, h * .1, 12, '#f2ecd0');
  // kallas ja taust
  if (FV.spot === 'kuninglik') { c.fillStyle = night ? '#1a2238' : '#6a7a8a'; c.fillRect(w * .62, h * .12, w * .2, h * .16); for (let i = 0; i < 4; i++) c.fillRect(w * .62 + i * w * .055, h * .09, w * .03, h * .04); c.fillRect(w * .66, h * .02, w * .04, h * .12); poly(c, [w * .655, h * .02, w * .68, -h * .04, w * .705, h * .02], '#3a5f8c') }
  if (FV.spot === 'jogi' || FV.spot === 'metsajarv' || FV.spot === 'salajane') for (let i = 0; i < 18; i++) { const x = i / 18 * w + th(i, 4, 1) * 20, hh = h * (.1 + th(i, 5, 1) * .08); poly(c, [x - 14, h * .3, x + 14, h * .3, x, h * .3 - hh], night ? '#0e2018' : FV.spot === 'salajane' ? '#3a3a5a' : '#2b5a3a') }
  if (FV.spot === 'jaa') for (let i = 0; i < 6; i++) poly(c, [i * w / 5 - 40, h * .3, i * w / 5 + 60, h * .3, i * w / 5 + 10, h * .12], '#c8dae2');
  rect(c, 0, h * .26, w, h * .07, shore);
  const wg = c.createLinearGradient(0, h * .32, 0, h); wg.addColorStop(0, wTop); wg.addColorStop(1, wBot); c.fillStyle = wg; c.fillRect(0, h * .32, w, h * .68);
  if (FV.spot === 'jaa') { c.fillStyle = '#e8f4f8'; c.fillRect(0, h * .32, w, h * .68); c.beginPath(); c.ellipse(w * .6, h * .56, w * .17, h * .13, 0, 0, 6.29); c.fillStyle = '#1f4e62'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke() }
  const flow = FV.spot === 'jogi' ? 70 : FV.spot === 'meri' ? 30 : 14;
  for (let i = 0; i < 9; i++) { const yy = h * (.38 + i * .07) + Math.sin(t * 1.3 + i) * 2, xx = ((t * flow * (i % 2 ? 1 : .6) + i * 97) % (w + 80)) - 40; c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 40, yy); c.stroke() }
  if (FV.spot === 'salajane') for (let i = 0; i < 3; i++) { const fx = ((t * 12 * (i + 1) + i * 200) % (w + 300)) - 150, g = c.createRadialGradient(fx, h * .5, 0, fx, h * .5, 160); g.addColorStop(0, 'rgba(220,200,255,.22)'); g.addColorStop(1, 'rgba(220,200,255,0)'); c.fillStyle = g; c.fillRect(fx - 160, h * .5 - 160, 320, 320) }
  // ilm
  if (FS && (FS.weather === 'vihm' || FS.weather === 'torm')) { c.strokeStyle = 'rgba(210,230,255,.45)'; c.lineWidth = 1; for (let i = 0; i < (FS.weather === 'torm' ? 120 : 70); i++) { const x = (th(i, 7, 1) * w + t * 60) % w, y = (th(i, 8, 1) * h + t * 400 * (.8 + th(i, 9, 1) * .4)) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4, y + 12); c.stroke() } }
  if (FS && FS.weather === 'udu') { c.fillStyle = 'rgba(230,236,234,.22)'; c.fillRect(0, 0, w, h) }
  if (night) { c.fillStyle = 'rgba(8,16,44,.35)'; c.fillRect(0, 0, w, h) }
  // õng, nöör, ujuk
  const bx = w * .6, by = h * .55; let bob = Math.sin(t * 2.2) * 2;
  const casting = ['idle', 'casting', 'result', 'lost'].includes(FV.phase);
  if (FV.phase === 'bite') bob = 9 + Math.sin(t * 32) * 5;
  if (FV.phase === 'reel') bob = 4 + Math.sin(t * 14) * 3;
  c.strokeStyle = '#6b4528'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, h * .98); c.lineTo(w * .32, h * .07); c.stroke();
  if (!casting || FV.phase === 'casting') {
    c.strokeStyle = 'rgba(240,240,240,.85)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * .32, h * .07); c.quadraticCurveTo(w * .5, h * .2, bx, by + bob - 6); c.stroke();
    if (FV.phase === 'bite' || FV.phase === 'reel') for (let i = 0; i < 3; i++) { c.strokeStyle = `rgba(255,255,255,${.55 - i * .15})`; c.beginPath(); c.ellipse(bx, by + 6, 10 + ((t * 30 + i * 10) % 28), 4 + ((t * 10 + i * 4) % 9), 0, 0, 6.29); c.stroke() }
    circ(c, bx, by + bob, 7, '#e8412e'); c.beginPath(); c.arc(bx, by + bob, 7, Math.PI, 0); c.fillStyle = '#fff'; c.fill(); rect(c, bx - 1, by + bob - 15, 2, 8, '#3a2a1a');
  }
  if (FV.phase === 'bite') {
    c.save(); c.font = `900 ${Math.max(22, w * .055)}px "Alegreya Sans", system-ui, sans-serif`; c.textAlign = 'center';
    const s = 1 + Math.sin(t * 18) * .05; c.translate(w / 2, h * .2); c.scale(s, s);
    c.lineWidth = 6; c.strokeStyle = 'rgba(40,10,0,.8)'; c.strokeText('KALA NÄKKAS!', 0, 0); c.fillStyle = '#ffd286'; c.fillText('KALA NÄKKAS!', 0, 0); c.restore();
  }
  if (FV.phase === 'reel' && FV.hook) {
    const hk = FV.hook, fx = bx + Math.sin(t * 2.4) * w * .12, L = Math.min(w * .3, 50 + (+hk.est) * 3);
    c.globalAlpha = .35; c.filter = 'brightness(0)'; drawLook(c, fx, h * .8, L, {}, t, Math.cos(t * 2.4) > 0 ? -1 : 1); c.filter = 'none'; c.globalAlpha = 1;
    const x0 = w * .06, bw = w * .88, yb = h * .9, bh = 16;
    rect(c, x0 - 2, yb - 2, bw + 4, bh + 4, 'rgba(0,0,0,.6)'); rect(c, x0, yb, bw, bh, '#24343a');
    rect(c, x0 + (hk.zc - hk.zw / 2) * bw, yb, hk.zw * bw, bh, hk.flash > 0 ? '#d8ff9a' : '#7fd16a');
    rect(c, x0 + (hk.needle || 0) * bw - 2, yb - 6, 4, bh + 12, '#fff4d8');
    for (let i = 0; i < hk.need; i++) circ(c, w - 18 - i * 18, 18, 7, i < hk.hits ? '#ffd286' : 'rgba(255,255,255,.25)');
    for (let i = 0; i < hk.maxMiss; i++) circ(c, 18 + i * 16, 18, 5, i < hk.misses ? '#ff8a78' : 'rgba(255,255,255,.2)');
    const over = +hk.est > +hk.strength, txt = `~${fmt1(+hk.est)} kg / õng ${fmt1(+hk.strength)} kg`;
    c.font = '800 13px "Alegreya Sans", system-ui, sans-serif'; c.textAlign = 'center'; const tw = c.measureText(txt).width + 18;
    rect(c, w / 2 - tw / 2, yb - 30, tw, 20, over ? 'rgba(170,30,20,.9)' : 'rgba(0,0,0,.55)'); c.fillStyle = over ? '#ffd8d0' : '#eaf6fa'; c.fillText(txt, w / 2, yb - 15);
  }
  for (const p of sparks) { p.life -= dt; p.vy += dt * .5; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)); circ(c, p.x * w, p.y * h, 3, p.col); c.globalAlpha = 1 }
  sparks = sparks.filter(p => p.life > 0);
}

/* ---------- Saak ---------- */
function tabSaak() {
  const inv = FS.inventory || [], kept = inv.filter(x => !x.trophy), tro = inv.filter(x => x.trophy);
  FV.sel = new Set([...FV.sel].filter(id => kept.some(x => x.id === id)));
  const selN = FV.sel.size;
  const cell = x => { const s = FD.sp[x.species] || { name: x.species }, [rn, rc] = RAR2[x.rarity]; return `<div class="fcell ${FV.sel.has(x.id) ? 'sel' : ''}" data-fa="${x.trophy ? 'untro' : 'pick'}" data-arg="${x.id}" role="button" tabindex="0" style="border-color:${FV.sel.has(x.id) ? '' : rc + '44'}">${x.trophy ? '<span class="tro">Trofee</span>' : ''}<canvas data-fl="${x.species}" data-r="${x.rarity}"></canvas><b>${esc(s.name)}</b><small style="color:${rc}">${rn}${x.giant ? ' · rekordsuurus' : ''}</small><small>${fmt1(+x.weight)} kg${x.trophy ? '' : ` · ~${estPrice(x.id)} kulda`}</small></div>` };
  let h = `<div class="fv-card"><h2>Saak</h2><p class="lead">Klõpsa kaladel, et neid valida. Müümisel saad kulda kalurikassasse. Toit ja kuulsus lähevad sinu kuningriiki. Turuhinnad muutuvad iga päev ja kui müüd ühel päeval palju sama kala, langeb selle hind.</p>
    <div class="chips"><span class="chip">${kept.length} kala saagis</span><span class="chip">Valitud: ${selN}</span></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="btn sm" type="button" data-fa="bulk" data-arg="sell" ${selN ? '' : 'disabled'}>Müü valitud</button>
      <button class="btn sm ghost" type="button" data-fa="bulk" data-arg="cook" ${selN ? '' : 'disabled'}>Valitud toiduks</button>
      <button class="btn sm ghost" type="button" data-fa="bulk" data-arg="release" ${selN ? '' : 'disabled'}>Lase valitud vabaks</button>
      <button class="btn sm ghost" type="button" data-fa="bulk" data-arg="trophy" ${selN === 1 ? '' : 'disabled'}>Trofeeriiulile</button>
      <button class="btn sm ghost" type="button" data-fa="exchSel" ${selN === 1 && kept.find(x => FV.sel.has(x.id) && x.rarity >= 4) ? '' : 'disabled'}>Vaheta preemia vastu</button>
      <button class="btn sm ghost" type="button" data-fa="selnone" ${selN ? '' : 'disabled'}>Tühista valik</button></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-fa="sellall" data-arg="1" ${kept.some(x => x.rarity === 1) ? '' : 'disabled'}>Müü kõik tavalised</button><button class="btn sm ghost" type="button" data-fa="sellall" data-arg="2" ${kept.some(x => x.rarity <= 2) ? '' : 'disabled'}>Müü kõik tavalised ja ebatavalised</button></div>
    ${kept.length ? `<div class="inv">${kept.slice(0, 150).map(cell).join('')}</div>${kept.length > 150 ? `<p class="lead">Näidatakse 150 väärtuslikumat kala, kokku on ${kept.length}.</p>` : ''}` : '<p class="lead">Saak on tühi. Mine püüki!</p>'}</div>`;
  h += `<div class="fv-card"><h2>Trofeeriiul <small class="lead">${tro.length} / 12</small></h2><p class="lead">Trofeed jäävad sinu kollektsiooni igaveseks ja neid ei müüda kogemata maha. Klõpsa trofeel, et see riiulilt tagasi võtta.</p>${tro.length ? `<div class="inv">${tro.map(cell).join('')}</div>` : '<p class="lead">Riiul on veel tühi. Pane siia oma uhkeim saak.</p>'}</div>`;
  h += `<div class="fv-card"><h2>Kalurikassa</h2><p class="lead">Kalapüügiga teenitud kuld on kalurikassas: <b>${fmt(FS.gold)} kulda</b>. Selle eest saad osta õngi ja sööta. Kulda saad saata ka oma kuningriigi varakambrisse, aga tagasi kalurikassasse seda tuua ei saa.</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${[100, 500, 2000].map(n => `<button class="btn sm ghost" type="button" data-fa="transfer" data-arg="${n}" ${FS.gold >= n ? '' : 'disabled'}>Saada ${n} kuningriiki</button>`).join('')}<button class="btn sm ghost" type="button" data-fa="transfer" data-arg="${FS.gold}" ${FS.gold > 0 ? '' : 'disabled'}>Saada kõik (${fmt(FS.gold)})</button></div></div>`;
  return h;
}

/* ---------- Pood ---------- */
function tabPood() {
  let h = '';
  if (FS.rod_broken) h += `<div class="fv-card" style="border-color:var(--bad)"><h2>Õng on katki</h2><p class="lead">${FD.rod[FS.rod].name} murdus. Parandus maksab ${repairCost2()} kulda. Võid ka mõne teise oma õnge kasutusele võtta.</p><div><button class="btn" type="button" data-fa="repair" ${FS.gold >= repairCost2() ? '' : 'disabled'}>Paranda õng</button></div></div>`;
  h += `<div class="fv-card"><h2>Õngeridvad</h2><p class="lead">Tugevus näitab, kui raske kala õng välja kannab. Püügiboonus suurendab haruldaste kalade võimalust ja väljatoomise boonus teeb rohelise ala laiemaks.</p><div class="shop">${FD.rods.map(r => {
    const own = (FS.rods || []).includes(r.id), on = FS.rod === r.id, lock = FS.level < r.min_level;
    return `<div class="srow ${lock && !own ? 'locked' : ''}"><div><b>${r.name}</b>${on ? ' <span class="pill ok">Kasutusel</span>' : own ? ' <span class="pill">Sinu oma</span>' : ''}<small>Tugevus ${fmt1(+r.strength)} kg · püügiboonus +${Math.round(r.catch_bonus * 100)}% · väljatoomine +${Math.round(r.reel_bonus * 100)}%</small><small>${own ? '' : lock ? `🔒 Avaneb kalapüügi ${r.min_level}. tasemel · ` : ''}${own ? '' : `Hind ${fmt(r.price)} kulda`}</small></div>
      ${on ? '' : own ? `<button class="btn sm ghost" type="button" data-fa="rod" data-arg="${r.id}">Võta kasutusele</button>` : `<button class="btn sm" type="button" data-fa="rod" data-arg="${r.id}" ${!lock && FS.gold >= r.price ? '' : 'disabled'}>Osta</button>`}</div>`;
  }).join('')}</div></div>`;
  h += `<div class="fv-card"><h2>Söödad ja peibutised</h2><p class="lead">Sööt kulub iga viskega. Peibutis ostetakse üks kord ja see ei kulu kunagi. Parem sööt toob kala kiiremini ja suurendab haruldaste kalade võimalust.</p><div class="shop">${FD.baits.map(b => {
    const lock = FS.level < b.min_level, cnt = (FS.baits || {})[b.id] || 0, ownLure = !b.consumable && (b.price === 0 || (FS.baits || {})[b.id] !== undefined), on = FS.bait === b.id;
    return `<div class="srow ${lock ? 'locked' : ''}"><div><b>${b.name}</b>${on ? ' <span class="pill ok">Kasutusel</span>' : ''}<small>${esc(b.descr)}</small><small>Ootamine ${Math.round((1 - b.wait_mult) * 100)}% kiirem · haruldased +${Math.round(b.rarity_bonus * 100)}%${b.consumable ? ` · sul on ${cnt} tk · ${b.price} kulda tükk` : b.price ? (ownLure ? ' · sinu oma' : ` · ${fmt(b.price)} kulda`) : ' · tasuta'}</small>${lock ? `<small>🔒 Avaneb ${b.min_level}. tasemel</small>` : ''}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">${lock ? '' : b.consumable ? `<button class="btn sm" type="button" data-fa="bait10" data-arg="${b.id}" ${FS.gold >= b.price * 10 ? '' : 'disabled'}>10 tk (${b.price * 10})</button><button class="btn sm ghost" type="button" data-fa="bait50" data-arg="${b.id}" ${FS.gold >= b.price * 50 ? '' : 'disabled'}>50 tk (${b.price * 50})</button>${cnt && !on ? `<button class="btn sm ghost" type="button" data-fa="baitUse" data-arg="${b.id}">Kasuta</button>` : ''}` : ownLure ? (on ? '' : `<button class="btn sm ghost" type="button" data-fa="baitUse" data-arg="${b.id}">Kasuta</button>`) : `<button class="btn sm" type="button" data-fa="lure" data-arg="${b.id}" ${FS.gold >= b.price ? '' : 'disabled'}>Osta</button>`}</div></div>`;
  }).join('')}</div></div>`;
  return h;
}

/* ---------- Kalaraamat ---------- */
function tabRaamat() {
  const book = FS.book || {}, caught = FD.species.filter(s => book[s.id]).length;
  let h = `<div class="fv-card"><h2>Kalaraamat</h2><p class="lead">Püütud ${caught} / ${FD.species.length} liiki. Kõigi kalade leidmine annab tiitli „Kalakuningas“ ja suure preemia.</p><div class="bar green"><i style="width:${(caught / FD.species.length * 100).toFixed(1)}%"></i></div>`;
  for (let r = 1; r <= 6; r++) {
    const list = FD.species.filter(s => s.rarity === r), [rn, rc] = RAR2[r];
    h += `<div class="sec-h" style="color:${rc}">${rn} <small>${list.filter(s => book[s.id]).length} / ${list.length}</small></div><div class="book">${list.map(s => {
      const b = book[s.id]; const where = s.spots.map(x => FD.spot[x] ? FD.spot[x].name : x).join(', ');
      return `<div class="bcell" style="border-color:${b ? rc + '66' : 'transparent'}"><canvas data-fl="${s.id}" data-r="${s.rarity}" data-unk="${b ? 0 : 1}"></canvas><b>${b ? esc(s.name) : '???'}</b><small>${b ? `Püütud ${b.n}× · rekord ${fmt1(+b.max)} kg` : `${fmt1(s.min_w)}–${fmt1(s.max_w)} kg`}</small><small>${esc(where)}${s.night_only ? ' · öösel' : ''}${s.winter_only ? ' · talvel' : ''}${s.min_level > FS.level ? ` · tase ${s.min_level}` : ''}</small></div>`;
    }).join('')}</div>`;
  }
  h += '</div>';
  const got = FS.ach || {};
  h += `<div class="fv-card"><h2>Saavutused ja tiitlid</h2><p class="lead">Avatud ${Object.keys(got).length} / ${FD.achs.length}. Mõned saavutused annavad tiitli, mida näevad ka teised mängijad.</p>
    <div class="ctrl"><div class="field"><label for="fvTitle">Sinu tiitel</label><select id="fvTitle" data-fa="title"><option value="">Ilma tiitlita</option>${(FS.titles || []).map(t => `<option ${t === FS.title ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div></div>
    <div class="achl">${FD.achs.map(a => `<div class="achc ${got[a.id] ? 'got' : ''}"><b>${got[a.id] ? '★ ' : ''}${esc(a.name)}</b><small>${esc(a.descr)}</small><small>${a.reward_gold ? `+${a.reward_gold} kulda ` : ''}${a.reward_xp ? `+${a.reward_xp} kogemust` : ''}${a.title ? ` · tiitel „${esc(a.title)}“` : ''}</small></div>`).join('')}</div></div>`;
  const br = FS.by_rarity || {};
  h += `<div class="fv-card"><h2>Statistika</h2><dl class="stats">${[1, 2, 3, 4, 5, 6].map(r => `<dt>${RAR2[r][0]} kalu</dt><dd>${br[r] || 0}</dd>`).join('')}
    <dt>Öösel püütud</dt><dd>${FS.night}</dd><dt>Naljakaid leide</dt><dd>${FS.junk}</dd><dt>Aardekirste</dt><dd>${FS.chests}</dd><dt>Pääsenud kalu</dt><dd>${FS.lost}</dd><dt>Murtud õngi</dt><dd>${FS.broken}</dd><dt>Täidetud tellimusi</dt><dd>${FS.orders_done}</dd><dt>Võistlusvõite</dt><dd>${FS.comp_wins}</dd></dl></div>`;
  return h;
}

/* ---------- Võistlused ---------- */
const COMPN = { big: ['Päeva suurim kala', 'Kes püüab täna kõige raskema kala?', 'Päeva hiidkala püüdja'], rare: ['Nädala haruldaseim kala', 'Kõige haruldasem kala sel nädalal. Võrdsuse korral loeb kaal.', 'Haruldaste jahtija'], most: ['Nädala usinaim kalur', 'Kes püüab sel nädalal kõige rohkem kalu?', 'Nädala kalur'] };
function tabVoistlus() {
  const C = FV.comps;
  if (!C) return '<div class="fv-card"><p class="lead">Laadin võistlusi…</p></div>';
  const unclaimed = ['big', 'rare', 'most'].some(k => !C[k].claimed && (C[k].last || []).some(r => r.me && r.place <= 3));
  let h = `<div class="fv-card"><h2>Võistlused</h2><p class="lead">Tulemused tulevad serverist. Kolm parimat saavad kulda ja kogemust, võitja ka tiitli. Preemia saad võtta pärast võistluse lõppu.</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn ${unclaimed ? '' : 'ghost'}" type="button" data-fa="claim">${unclaimed ? 'Võta võidupreemiad!' : 'Kontrolli võidupreemiaid'}</button><button class="btn ghost sm" type="button" data-fa="reloadComp">Värskenda</button></div></div><div class="comps">`;
  for (const k of ['big', 'rare', 'most']) {
    const c = C[k], [nm, ds] = COMPN[k], ends = new Date(new Date(c.ends).getTime() - 60000);
    const val = r => k === 'most' ? `${r.cnt} kala` : `${esc(FD.sp[r.species] ? FD.sp[r.species].name : r.species)} ${fmt1(+r.weight)} kg`;
    h += `<div class="fv-card"><h3>${nm}</h3><p class="lead" style="font-size:12.5px">${ds} Lõpeb ${k === 'big' ? 'täna' : ends.toLocaleDateString('et-EE', { weekday: 'long', timeZone: 'Europe/Tallinn' })} kell 23:59.</p>
      ${c.top.length ? `<table class="ctable"><thead><tr><th>#</th><th>Kalur</th><th>${k === 'most' ? 'Kalu' : 'Kala'}</th></tr></thead><tbody>${c.top.map(r => `<tr class="${r.me ? 'me' : ''}"><td>${r.place}</td><td><b>${esc(r.name)}</b>${r.title ? `<br><small class="lead">${esc(r.title)}</small>` : ''}</td><td class="n" style="color:${k === 'most' ? '' : RAR2[r.rarity][1]}">${val(r)}</td></tr>`).join('')}</tbody></table>` : '<p class="lead">Keegi pole veel osalenud. Ole esimene!</p>'}
      ${c.mine ? `<p class="lead">Sinu koht: <b>${c.mine.place}.</b> (${val(c.mine)})</p>` : ''}
      ${c.last.length ? `<p class="lead" style="font-size:12.5px">Eelmine kord: ${c.last.map(r => `${r.place}. ${esc(r.name)}${r.me ? ' (sina)' : ''}`).join(', ')}</p>` : ''}</div>`;
  }
  h += `</div><div class="fv-card"><h2>Kuningriigi kalapüügi edetabel</h2>${C.leaderboard.length ? `<table class="ctable"><thead><tr><th>#</th><th>Kalur</th><th>Tase</th><th>Kalu</th><th>Suurim</th></tr></thead><tbody>${C.leaderboard.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td><b>${esc(r.name)}</b>${r.title ? `<br><small class="lead">${esc(r.title)}</small>` : ''}</td><td class="n">${r.level}</td><td class="n">${fmt(r.total)}</td><td class="n">${fmt1(+r.biggest)} kg</td></tr>`).join('')}</tbody></table>` : '<p class="lead">Edetabel on veel tühi.</p>'}</div>`;
  return h;
}

/* ---------- Tellimused ---------- */
function tabTellimus() {
  const O = FV.orders;
  let h = `<div class="fv-card"><h2>Kuningliku köögi tellimused</h2><p class="lead">Lossi kokk vajab iga päev värsket kala. Täidetud tellimus toob kulda kalurikassasse ning kuulsust ja toitu sinu kuningriiki. Rohkem tellimusi avaneb kalapüügi 5., 12. ja 20. tasemel. Uued tellimused tulevad iga päev kesköösel.</p>`;
  if (!O) return h + '<p class="lead">Laadin tellimusi…</p></div>';
  if (!O.length) return h + '<p class="lead">Täna tellimusi pole.</p></div>';
  h += `<div class="shop">${O.map(o => { const s = FD.sp[o.species], [rn, rc] = RAR2[s.rarity]; return `<div class="srow" style="${o.done ? 'opacity:.6' : ''}"><div style="display:grid;grid-template-columns:90px minmax(0,1fr);gap:10px;align-items:center"><canvas data-fl="${s.id}" data-r="${s.rarity}" data-unk="${FS.book[s.id] ? 0 : 1}" style="width:90px;height:50px;border-radius:8px"></canvas><div><b>${o.qty} × ${esc(s.name)}</b> <span class="rpill" style="color:${rc}">${rn}</span><small>Saagis: ${Math.min(o.have, o.qty)} / ${o.qty} · ${esc(s.spots.map(x => FD.spot[x].name).join(', '))}</small><small>Preemia: ${o.gold} kulda, ${o.xp} kogemust, ${o.fame} kuulsust ja ${o.qty * 4} toitu kuningriiki</small></div></div>
    ${o.done ? '<span class="pill ok">Täidetud</span>' : `<button class="btn sm" type="button" data-fa="deliver" data-arg="${o.idx}" ${o.have >= o.qty ? '' : 'disabled'}>Anna kokale</button>`}</div>` }).join('')}</div></div>`;
  return h;
}

/* ---------- preemiad ja tasemed ---------- */
function afterAch(list) { (list || []).forEach(a => toast(`Kalapüügi saavutus: ${a.name}${a.title ? ` · uus tiitel „${a.title}“` : ''}${a.gold ? ` · +${a.gold} kulda` : ''}`, 'gold', 'fame')) }
function afterLevels(lv) {
  if (!lv || !lv.length) return;
  const to = Math.max(...lv), from = Math.min(...lv);
  const u = [];
  FD.spots.filter(s => s.min_level >= from && s.min_level <= to).forEach(s => u.push(['Püügikoht', s.name]));
  FD.rods.filter(s => s.min_level >= from && s.min_level <= to).forEach(s => u.push(['Õng', s.name]));
  FD.baits.filter(s => s.min_level >= from && s.min_level <= to).forEach(s => u.push([s.consumable ? 'Sööt' : 'Peibutis', s.name]));
  FD.species.filter(s => s.min_level >= from && s.min_level <= to && s.min_level > 1).forEach(s => u.push(['Uus kala', '???']));
  [5, 12, 20].filter(l => l >= from && l <= to).forEach(() => u.push(['Eriülesanne', 'Uus köögitellimus']));
  showModal(() => `<div class="rays"></div>${Array.from({ length: 8 }, (_, i) => `<i class="mote" style="left:${10 + i * 11}%;top:${30 + (i * 37) % 50}%;animation-delay:${(i * .37) % 3}s"></i>`).join('')}
    <div class="ribbon">Kalapüügi tase tõusis</div><div class="emblem"><div class="emblem-in"><b>${to}</b><small>kalur</small></div></div>
    <h2>Osav kalur!</h2><p class="sub">Järvede vaimud on sinu oskusi märganud.</p>
    ${u.length ? `<div class="ulabel">Avanes</div><div class="unlock-list">${u.map(x => `<span>${x[0]}: ${esc(x[1])}</span>`).join('')}</div>` : '<p class="nextl">Jätka püüki, et avada uusi kohti ja õngi.</p>'}
    <button class="btn" type="button" data-act="closeModal">Edasi püüki</button>`, 'lvlup');
}

/* ---------- tegevused ---------- */
async function fUse(action, ids, choice) {
  if (FV.busy) return; FV.busy = true;
  try {
    const r = await rpc('fish_use', { p_ids: ids, p_action: action, p_choice: choice || null });
    const parts = [];
    if (r.gold) parts.push(`+${r.gold} kulda kalurikassasse`); if (r.food) parts.push(`+${r.food} toitu kuningriiki`); if (r.fame) parts.push(`+${r.fame} kuulsust kuningriiki`);
    if (r.map) parts.push(`+${r.map} aardekaart kuningriiki`); if (r.xp) parts.push(`+${r.xp} kogemust`); if (r.luck) parts.push('kaluriõnn +1'); if (r.kingdom_gold) parts.push(`+${r.kingdom_gold} kulda kuningriiki`); if (r.bait) parts.push(`+${r.qty} ${FD.bait[r.bait].name.toLowerCase()}`);
    toast({ sell: 'Müüdud', cook: 'Valmistasid kalarooga', release: 'Lasid vabaks', trophy: 'Trofeeriiulil', untrophy: 'Võetud riiulilt', exchange: 'Vahetatud' }[action] + (parts.length ? ': ' + parts.join(', ') : '.'), 'good', 'fish');
    ids.forEach(id => FV.sel.delete(id));
    await refreshFS(); FV.market = await rpc('fish_market').catch(() => FV.market);
    afterLevels(r.levels); afterAch(r.ach);
  } catch (e) { toast(e.message, 'bad') }
  FV.busy = false; closeModalIfExch(); renderFV(true);
}
function closeModalIfExch() { if (UI.modalView && UI.modalView.exch) closeModal() }
function showExchange(id) {
  const c = (FS.inventory || []).find(x => x.id === id); if (!c) return;
  const s = FD.sp[c.species], gold = s.id === 'kuldkala';
  const v = () => (gold ? `<h2>Kuldkala räägib!</h2><p>„Lase mind vabaks ja ma täidan ühe su soovi!“</p><div class="wishes" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:rikkus">Rikkus<br><small>+${fmt(3000 + FS.level * 100)} kulda kalurikassasse</small></button>
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:kuningriik">Kuningriigile<br><small>+${fmt(4000 + FS.level * 100)} kulda varakambrisse</small></button>
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:tarkus">Tarkus<br><small>+${fmt(1500 + FS.level * 100)} kogemust</small></button>
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:onn" ${FS.luck >= 5 ? 'disabled' : ''}>Kaluriõnn<br><small>püsivalt rohkem haruldasi (${FS.luck}/5)</small></button></div>`
    : `<h2>Vaheta: ${esc(s.name)}</h2><p>Kuninglik kollektsionäär pakub selle ${RAR2[s.rarity][0].toLowerCase()} kala eest:</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:kaart">${s.rarity - 3} aardekaart${s.rarity - 3 > 1 ? 'i' : ''}<br><small>saadetakse kuningriiki</small></button>
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:kuulsus">Kuulsus<br><small>+${s.rarity * s.rarity * 12} kuningriigile</small></button>
      <button class="btn" type="button" data-fa="exDo" data-arg="${id}:sööt">Söödapakk<br><small>${s.rarity * 6} tk parimat sööta</small></button></div>`) + `<div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Loobu</button></div>`;
  v.exch = true; showModal(v);
}
async function fShop(kind, id, qty) {
  if (FV.busy) return; FV.busy = true;
  try {
    const r = await rpc('fish_shop', { p_kind: kind, p_id: id, p_qty: qty || 1 });
    if (r.bought) toast(`Ostsid: ${(FD.rod[r.bought] || FD.bait[r.bought]).name}${r.qty ? ' × ' + r.qty : ''} (−${fmt(r.cost)} kulda)`, 'good', 'fish');
    else if (r.equipped) toast(`Kasutusel: ${(FD.rod[r.equipped] || FD.bait[r.equipped]).name}`, 'info', 'fish');
    else if (r.repaired) toast(`Õng on parandatud (−${r.cost} kulda).`, 'good', 'fish');
    else if (r.transferred) { toast(`${fmt(r.transferred)} kulda saadeti kuningriigi varakambrisse.`, 'good', 'gold'); claimInbox() }
    await refreshFS(); FV.oddsKey = ''; await loadOdds();
  } catch (e) { toast(e.message, 'bad') }
  FV.busy = false; renderFV(true);
}
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-fa]'); if (!el || el.disabled) return;
  if (el.tagName === 'SELECT') return;
  const a = el.dataset.fa, arg = el.dataset.arg;
  switch (a) {
    case 'close': closeFishView(); break;
    case 'tab': FV.tab = arg; renderFV(true); if (arg === 'voistlus' || arg === 'tellimus') loadSide(); break;
    case 'spot': if (FS.level < FD.spot[arg].min_level) { toast(`${FD.spot[arg].name} avaneb kalapüügi ${FD.spot[arg].min_level}. tasemel.`, 'bad'); return } FV.spot = arg; FV.result = null; FV.phase = 'idle'; FV.msg = ''; renderFV(true); await loadOdds(); renderFV(true); break;
    case 'cast': doCast(); break;
    case 'pull': if (Date.now() - (FV.pdAt || 0) < 600) break; doPull(); break;
    case 'cut': if (FV.phase === 'reel') doLose('Lasid kala lahti. Õng jäi terveks.'); break;
    case 'repair': fShop('repair', null); break;
    case 'use': { const [act, id] = arg.split(':'); fUse(act, [+id]); break }
    case 'exch': showExchange(+arg); break;
    case 'exSel': case 'exchSel': { const id = [...FV.sel][0]; if (id) showExchange(id); break }
    case 'exDo': { const [id, ch] = arg.split(':'); fUse('exchange', [+id], ch); break }
    case 'pick': { const id = +arg; FV.sel.has(id) ? FV.sel.delete(id) : FV.sel.add(id); renderFV(true); break }
    case 'untro': fUse('untrophy', [+arg]); break;
    case 'selnone': FV.sel.clear(); renderFV(true); break;
    case 'bulk': if (FV.sel.size) fUse(arg, [...FV.sel]); break;
    case 'sellall': if (FV.busy) return; FV.busy = true; try { const r = await rpc('fish_sell_all', { p_max_rarity: +arg }); toast(`Müüsid ${r.n} kala ja said ${r.gold} kulda.`, 'good', 'gold'); FV.sel.clear(); await refreshFS(); FV.market = await rpc('fish_market').catch(() => FV.market); afterAch(r.ach) } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); break;
    case 'transfer': fShop('transfer', null, +arg); break;
    case 'rod': fShop('rod', arg); break;
    case 'bait10': fShop('bait', arg, 10); break;
    case 'bait50': fShop('bait', arg, 50); break;
    case 'lure': fShop('bait', arg); break;
    case 'baitUse': fShop('equip_bait', arg); break;
    case 'deliver': if (FV.busy) return; FV.busy = true; try { const r = await rpc('fish_order_deliver', { p_idx: +arg }); toast(`Kokk on õnnelik! +${r.gold} kulda, +${r.xp} kogemust, +${r.fame} kuulsust ja +${r.food} toitu kuningriiki.`, 'gold', 'fish'); await refreshFS(); FV.orders = await rpc('fish_orders_today'); afterLevels(r.levels); afterAch(r.ach) } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); break;
    case 'claim': if (FV.busy) return; FV.busy = true; try { const r = await rpc('fish_claim_prizes'); if (!r.prizes.length) toast('Uusi võidupreemiaid pole. Ole parim ja proovi uuesti!', 'info'); r.prizes.forEach(p => toast(`${COMPN[p.comp][0]}: ${p.place}. koht! +${p.gold} kulda, +${p.xp} kogemust${p.title ? `, tiitel „${p.title}“` : ''}`, 'gold', 'fame')); await refreshFS(); FV.comps = await rpc('fish_competitions'); afterLevels(r.levels); afterAch(r.ach) } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); break;
    case 'reloadComp': FV.comps = null; renderFV(true); loadSide(); break;
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'fvBait') fShop('equip_bait', el.value);
  if (el.id === 'fvTitle') fShop('title', el.value || null);
});
document.addEventListener('keydown', e => {
  if (!FV.open || UI.modalView) return;
  if (e.key === 'Escape') { closeFishView(); return }
  if (e.key !== ' ' || FV.tab !== 'puuk' || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  e.preventDefault();
  if (['idle', 'result', 'lost'].includes(FV.phase)) { if (!FS.rod_broken) doCast() } else doPull();
});
sceneCv.addEventListener('pointerdown', e => { if (['waiting', 'bite', 'reel'].includes(FV.phase)) { e.preventDefault(); doPull() } });
document.addEventListener('pointerdown', e => { const b = e.target.closest('#fvPull'); if (b && FV.phase === 'reel') { e.preventDefault(); FV.pdAt = Date.now(); reelHit() } }, true);
setInterval(() => { if (FV.open && !['waiting', 'bite', 'reel', 'landing', 'hooking', 'casting'].includes(FV.phase)) { const nowNight = (() => { const h = +new Date().toLocaleString('en-GB', { timeZone: 'Europe/Tallinn', hour: '2-digit', hour12: false }); return h >= 21 || h < 5 })(); if (FS && nowNight !== FS.is_night) refreshFS().then(() => { FV.oddsKey = ''; return loadOdds() }).then(() => renderFV()) } }, 60000);

/* ---------- ühendus kuningriigiga ---------- */
ACT.fvLogin = () => { closeModal(); running = false; save(); S = null; showStart() };
{
  const baseTool = ACT.tool;
  ACT.tool = a => { if (a === 'pyua') openFishView('puuk'); else baseTool(a) };
}
function startFishing() { openFishView('puuk') }
{
  const base = TABS.seiklused.r;
  TABS.seiklused.r = () => {
    const h = base();
    const c = `<div class="card adv"><div class="advhead"><span class="ic lg">${ICON.fish}</span><div><h3>Kalapüük</h3><p class="lead">Kuus püügikohta, ${FD.loaded ? FD.species.length : '40+'} kalaliiki, õngeridvad, söödad, kalaraamat ja võistlused teiste mängijatega. Kalapüügil on oma tase 1–50.</p></div></div>
      ${S && S.fishCache ? `<dl class="stats"><dt>Kalapüügi tase</dt><dd>${S.fishCache.level}</dd><dt>Püütud kalu</dt><dd>${S.fishCache.total}</dd></dl>` : ''}
      <div><button class="btn sm" type="button" data-act="openFish">Ava kalapüük</button></div></div>`;
    return h.replace(/<\/div>$/, '') + c + '</div>';
  };
}
ACT.openFish = () => openFishView();
QUESTS.push(
  Q('q90', 'Saavuta kalapüügi 5. tase', 5, s => (s.fishCache && s.fishCache.level) || 0, { gold: 300, xp: 150 }),
  Q('q91', 'Püüa kokku 50 kala', 50, s => (s.fishCache && s.fishCache.total) || 0, { food: 150, xp: 250 }),
  Q('q92', 'Saavuta kalapüügi 15. tase', 15, s => (s.fishCache && s.fishCache.level) || 0, { gold: 1500, fame: 40, xp: 600 }),
  Q('q93', 'Saavuta kalapüügi 30. tase', 30, s => (s.fishCache && s.fishCache.level) || 0, { gold: 5000, fame: 100, xp: 1500 }),
);
