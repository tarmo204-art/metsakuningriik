/* ================= KALAPÜÜK (serveri kontrollitud) ================= */
ICON.fish = '<svg viewBox="0 0 20 20"><path d="M2 10 C5 4.5, 12 4.5, 15 10 C12 15.5, 5 15.5, 2 10Z" fill="#7fbcd2"/><path d="M14 10 L19 6 L18 10 L19 14Z" fill="#5a9ab4"/><circle cx="5.5" cy="9" r="1" fill="#1a1a1a"/><path d="M8 7 Q9.5 10 8 13" stroke="#4f8aa4" stroke-width="1" fill="none"/></svg>';
TOOL_ICON.pyua = '<svg viewBox="0 0 20 20"><path d="M3 18 L15 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 3 Q18 9 16 15" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="16" cy="15.5" r="1.8" fill="currentColor"/></svg>';
const RAR2 = { 1: ['Tavaline', '#c3d3a4'], 2: ['Ebatavaline', '#8fd17a'], 3: ['Haruldane', '#6cb8ff'], 4: ['Eepiline', '#c58cff'], 5: ['Legendaarne', '#ffb347'], 6: ['Müütiline', '#ff6b9a'] };
const JUNK2 = { saabas: ['Vana saabas', 'Keegi on siin kunagi märjaks saanud.'], purk: ['Plekkpurk', 'Purgi põhjas kõlises 3 kuldmünti.'], kepp: ['Triivpuu', 'Lihtsalt üks märg oks. Vähemalt said harjutada.'], pudel: ['Pudelipost', 'Pudelis oli aardekaart! See saadeti sinu kuningriiki.'], karp: ['Merekarp', 'Põhjamudast tuli ilus karp. See läks sinu kotti.'] };
const CHEST2 = { puu: ['Puidust kirst', '#c8955a'], hobe: ['Hõbekirst', '#d8e4ec'], kuld: ['Kuldne kirst', '#ffd060'] };
const ITEM_IC = { karp: '🐚', parl: '⚪', merevaik: '🟠', ruun: '🪨', sormus: '💍', mustparl: '⚫', kristall: '💎', soomus: '🐉' };
const WFISH = { paike: 'Päikesega ujub Päikesekarp.', pilves: 'Pilvise ilmaga ujub Pilvekala.', vihm: 'Vihmaga ujuvad Vihmaforell ja Vikerkaarekala!', udu: 'Udus ilmub Uduhõbe.', torm: 'Tormiga tulevad Tormihaug ja Välgukala!' };
const WNAME = { paike: 'päikesega', pilves: 'pilvise ilmaga', vihm: 'vihmaga', udu: 'uduga', torm: 'tormiga' };
const BADGE_T = ['', 'Pronks', 'Hõbe', 'Kuld'], BADGE_C = ['#5a6a70', '#d0905a', '#d8e4ec', '#ffd060'];
const BADGE_IC = { puudja: '🎣', haruldased: '💠', hiid: '🐋', koguja: '📖', usin: '📜', aare: '🗝️', oo: '🌙', voitja: '🏆' };
const WTH2 = { paike: ['Päike', 'kalad võtavad aeglasemalt'], pilves: ['Pilves', 'tavaline püügiilm'], vihm: ['Vihm', 'kalad võtavad kiiremini, haruldasi rohkem'], udu: ['Udu', 'haruldasi kalu veidi rohkem'], torm: ['Torm', 'palju haruldasi kalu, aga õng murdub kergemini'] };
const FD = { loaded: false, spots: [], species: [], rods: [], baits: [], achs: [], items: [], sp: {}, rod: {}, bait: {}, spot: {}, item: {}, house: {} };
let FS = null;
const FV = { quests: null, news: null, open: false, tab: 'puuk', spot: null, phase: 'idle', msg: '', cast: null, hook: null, result: null, sel: new Set(), market: null, comps: null, orders: null, busy: false, odds: null, oddsKey: '' };
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
.badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}
.bdg{padding:10px;border-radius:12px;background:rgba(0,0,0,.22);display:grid;gap:3px;justify-items:center;text-align:center;border:1px solid color-mix(in srgb,var(--bc) 45%,transparent)}
.bdg.t0{opacity:.62}.bdg.t3{background:linear-gradient(160deg,rgba(255,208,96,.18),rgba(0,0,0,.22))}
.bdg .bi{font-size:24px;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:rgba(0,0,0,.3);box-shadow:0 0 0 2px var(--bc)}
.bdg b{font-size:13px}.bdg small{font-size:11.5px;color:#9cb8c4}.bdg small:nth-of-type(1){color:var(--bc);font-weight:700}.bdg .bar{width:100%}
.itemrow{display:flex;gap:5px;flex-wrap:wrap}.itm{font-size:12.5px;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.25);border:1px solid}
.news{display:grid;gap:6px}.newsi{display:grid;grid-template-columns:30px minmax(0,1fr);gap:8px;align-items:start;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.2);font-size:13.5px;line-height:1.4}
.newsi.me{background:rgba(242,181,82,.12)}.newsi .ni{font-size:20px;line-height:1}.newsi small{font-size:11.5px}
.housecv{width:100%;max-width:560px;aspect-ratio:2.1/1;height:auto;border-radius:12px;display:block;margin:0 auto}
.chip.wfish{max-width:100%;white-space:normal}
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
  const [spots, species, rods, baits, achs, items] = await Promise.all([q('fish_spots'), q('fish_species'), q('fish_rods'), q('fish_baits'), q('fish_achievements'), q('fish_items').catch(() => [])]);
  Object.assign(FD, { spots, species, rods, baits, achs, items, loaded: true });
  items.forEach(x => FD.item[x.id] = x);
  try { const { data } = await CL.sb.from('fish_house_levels').select('*').order('level'); (data || []).forEach(x => { ['sell_bonus', 'xp_bonus', 'bait_save'].forEach(k => x[k] = +x[k]); FD.house[x.level] = x }) } catch (e) { }
  spots.forEach(x => FD.spot[x.id] = x); species.forEach(x => { x.min_w = +x.min_w; x.max_w = +x.max_w; x.look = x.look || {}; x.look._id = x.id; FD.sp[x.id] = x }); rods.forEach(x => FD.rod[x.id] = x); baits.forEach(x => FD.bait[x.id] = x);
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
  try { FV.quests = await rpc('fish_quests') } catch (e) { }
  loadNews();
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
    else if (junk === 'karp') { c.beginPath(); c.moveTo(0, L * .2); c.lineTo(-L * .3, -L * .1); c.quadraticCurveTo(0, -L * .4, L * .3, -L * .1); c.closePath(); c.fillStyle = '#f0c8b0'; c.fill(); c.strokeStyle = '#c08a70'; c.lineWidth = Math.max(1, L * .02); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, L * .2); c.lineTo(i * L * .12, -L * .22); c.stroke() } }
    else if (junk === 'kepp') { c.strokeStyle = '#6b4528'; c.lineWidth = L * .07; c.lineCap = 'round'; c.beginPath(); c.moveTo(-L * .4, L * .1); c.lineTo(L * .4, -L * .08); c.moveTo(0, 0); c.lineTo(L * .12, -L * .2); c.stroke() }
    else { const t = junk.split('_')[1], body = t === 'kuld' ? '#c8901a' : t === 'hobe' ? '#7a8a96' : '#5a3e22', lid = t === 'kuld' ? '#e0a830' : t === 'hobe' ? '#9aaab6' : '#6a4a2a', band = t === 'kuld' ? '#fff0a0' : t === 'hobe' ? '#e8f0f4' : '#e0a83a';
      if (t === 'kuld') { const g = c.createRadialGradient(0, 0, 0, 0, 0, L * .7); g.addColorStop(0, '#ffe08088'); g.addColorStop(1, '#ffe08000'); c.fillStyle = g; c.fillRect(-L, -L, L * 2, L * 2) }
      rect(c, -L * .35, -L * .15, L * .7, L * .35, body); poly(c, [-L * .35, -L * .15, -L * .3, -L * .3, L * .3, -L * .3, L * .35, -L * .15], lid); rect(c, -L * .35, -L * .16, L * .7, L * .05, band); rect(c, -L * .04, -L * .17, L * .08, L * .12, '#ffd060') }
    c.restore(); return;
  }
  look = look || {};
  drawFishReal(c, L, look, t, look._id);
  c.restore();
}
/* ---------- Realistlikud kalad ---------- */
// Iga liik saab päris kala ehituse: keha kuju, uimed, saba, soomused, muster, silm ja vurrud.
const ARCH = {
  perch: { H: .155, p: .38, ped: .28, hump: 1.22, belly: .92, head: 1.15, tail: 'fork', dors: 'perch', anal: 'short', scale: .045, eye: '#e8b030', eyeR: .034 },
  zander: { H: .115, p: .38, ped: .33, hump: 1.05, belly: .95, head: 1.35, tail: 'fork', dors: 'perch2', anal: 'short', scale: .03, eye: '#e8ecd0', eyeR: .03, teeth: 1 },
  cypr: { H: .14, p: .42, ped: .28, hump: 1.1, belly: 1.02, head: 1.05, tail: 'fork', dors: 'single', anal: 'short', scale: .052, eye: '#e0a040', eyeR: .036 },
  herring: { H: .11, p: .45, ped: .26, hump: .95, belly: 1.05, head: 1.1, tail: 'fork', dors: 'single', anal: 'short', scale: .04, eye: '#e0e8e8', eyeR: .04, noLat: 1 },
  bream: { H: .22, p: .45, ped: .18, hump: 1.3, belly: .95, head: 1.35, tail: 'fork', dors: 'tall', anal: 'long', scale: .042, eye: '#d8c080', eyeR: .03 },
  carp: { H: .175, p: .42, ped: .3, hump: 1.25, belly: .98, head: .95, tail: 'fork', dors: 'long', anal: 'short', scale: .07, eye: '#d8a030', eyeR: .028, barbel: 1 },
  gold: { H: .19, p: .42, ped: .28, hump: 1.2, belly: 1.05, head: .85, tail: 'veil', dors: 'long', anal: 'short', scale: .06, eye: '#e8d8a0', eyeR: .04 },
  tench: { H: .145, p: .42, ped: .4, hump: 1.08, belly: 1, head: .95, tail: 'round', dors: 'round', anal: 'round', scale: .018, eye: '#e04030', eyeR: .024, pelvBig: 1 },
  pike: { H: .095, p: .58, ped: .42, hump: .85, belly: 1, head: 1.9, tail: 'fork2', dors: 'back', anal: 'back', scale: .022, eye: '#e8c840', eyeR: .026, jaw: .13, flatTop: 1 },
  salmon: { H: .125, p: .44, ped: .28, hump: 1.05, belly: 1, head: 1.25, tail: 'fork', dors: 'single', anal: 'short', scale: .03, eye: '#c8c0a0', eyeR: .03, adip: 1 },
  grayling: { H: .125, p: .44, ped: .28, hump: 1.05, belly: 1, head: 1.3, tail: 'fork', dors: 'sail', anal: 'short', scale: .04, eye: '#d0c0a0', eyeR: .034, adip: 1 },
  cod: { H: .135, p: .36, ped: .2, hump: 1.05, belly: 1.1, head: 1.05, tail: 'trunc', dors: 'cod', anal: 'cod', scale: .022, eye: '#c8b080', eyeR: .034, chin: 1, palelat: 1 },
  catfish: { H: .11, p: .22, ped: .22, hump: .8, belly: 1.1, head: .45, tail: 'round', dors: 'tiny', anal: 'catfish', scale: 0, eye: '#b0a070', eyeR: .016, whiskers: 1 },
  sturgeon: { H: .085, p: .36, ped: .17, hump: 1, belly: .9, head: 2.4, tail: 'hetero', dors: 'back', anal: 'back', scale: 0, eye: '#a8a8a0', eyeR: .018, scutes: 1, under: 1 },
  angel: { H: .25, p: .47, ped: .16, hump: 1.1, belly: 1.1, head: 1.2, tail: 'veil', dors: 'trail', anal: 'trail', scale: .03, eye: '#f0e0ff', eyeR: .04 },
  monster: { H: .15, p: .38, ped: .26, hump: 1.15, belly: 1.05, head: .95, tail: 'lunate', dors: 'single', anal: 'short', scale: .065, eye: '#ffd040', eyeR: .03, teeth: 1, jaw: .1 },
  eel: { eel: 1, H: .052, eye: '#c8c0a0', eyeR: .018 },
  burbot: { eel: 1, H: .075, eye: '#c8b080', eyeR: .02, chin: 1, burbot: 1 },
  serpent: { eel: 1, H: .07, eye: '#ffe060', eyeR: .022, crest: 1 },
  flat: { flat: 1, eye: '#d8c080', eyeR: .03 },
};
const SP_ARCH = {
  ahven: 'perch', jaaahven: 'perch', kuldahven: 'perch', kristallahven: 'perch', kiisk: 'perch', koha: 'zander',
  sarg: 'cypr', roosarg: 'cypr', teib: 'cypr', sainas: 'cypr', tint: 'herring', kuusarg: 'cypr', pilvekala: 'cypr', uduhobe: 'cypr', udukala: 'cypr', raim: 'herring',
  latikas: 'bream', paikesekarp: 'bream', karpkala: 'carp', kuningkarp: 'carp', kuldkala: 'gold', linask: 'tench',
  haug: 'pike', jaahaug: 'pike', tormihaug: 'pike', joekuningas: 'pike',
  siig: 'salmon', raabis: 'salmon', vikerforell: 'salmon', meriforell: 'salmon', lohe: 'salmon', paalia: 'salmon', vihmaforell: 'salmon',
  virmaliskala: 'salmon', vikerkaarekala: 'salmon', igijaavaim: 'salmon', merivaim: 'salmon', harjus: 'grayling',
  tursk: 'cod', lest: 'flat', angerjas: 'eel', kuuangerjas: 'eel', valgukala: 'eel', jarvelohe: 'serpent', luts: 'burbot',
  saga: 'catfish', tuur: 'sturgeon', haldjakala: 'angel', leviaatan: 'monster',
};
const SP_PAT = { lohe: 'xspots', meriforell: 'xspots', vikerforell: 'trout', vihmaforell: 'trout', paalia: 'char', kuningkarp: 'koi', haug: 'pikespots', jaahaug: 'pikespots', tormihaug: 'pikespots', joekuningas: 'pikespots', tursk: 'mottle', luts: 'mottle', saga: 'mottle', lest: 'flatspots', kiisk: 'mottle', linask: 'none', harjus: 'grayspots', jarvelohe: 'scales2' };
const GHOST = { igijaavaim: 1, merivaim: 1, udukala: 1, uduhobe: 1, kristallahven: 1 };
function hexA(h, a) { if (!h || h[0] !== '#') return h; if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})` }
function mixC(a2, b2, k) { if (!a2 || !b2 || a2.length < 7 || b2.length < 7) return a2; return '#' + [1, 3, 5].map(i => Math.round(parseInt(a2.slice(i, i + 2), 16) * (1 - k) + parseInt(b2.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('') }
function fishFit(look) { const a = ARCH[SP_ARCH[look && look._id]] || ARCH[{ l: 'pike', e: 'eel', d: 'bream', f: 'flat' }[look && look.s]] || ARCH.cypr; return a.flat ? .55 : a.eel ? .3 : a.H * (a.hump + a.belly) + a.H * (a.dors === 'sail' ? 1.3 : a.dors === 'trail' ? 1.1 : a.dors === 'tall' ? .7 : .75) - (a.H > .2 ? a.H * .35 : 0) }
function shade(h, k) { if (!h || h[0] !== '#' || h.length < 7) return h; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return '#' + [1, 3, 5].map(i => f(parseInt(h.slice(i, i + 2), 16)).toString(16).padStart(2, '0')).join('') }
function finShape(c, pts, col, alpha, rays, base) {
  // pts: [x,y,...] äärejoon; base: [x0,y0,x1,y1] uime alus (kiirte algus)
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length - 2; i += 2) { const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2; c.quadraticCurveTo(pts[i], pts[i + 1], mx, my) }
  c.lineTo(pts[pts.length - 2], pts[pts.length - 1]); c.closePath();
  const bx = base ? (base[0] + base[2]) / 2 : pts[0], by = base ? (base[1] + base[3]) / 2 : pts[1];
  let far = 0, fx = bx, fy = by; for (let i = 0; i < pts.length; i += 2) { const d = Math.hypot(pts[i] - bx, pts[i + 1] - by); if (d > far) { far = d; fx = pts[i]; fy = pts[i + 1] } }
  const g = c.createLinearGradient(bx, by, fx, fy); g.addColorStop(0, hexA(col, alpha)); g.addColorStop(1, hexA(shade(col, .15), alpha * .55));
  c.fillStyle = g; c.fill();
  if (rays && base) {
    c.save(); c.clip(); c.strokeStyle = hexA(shade(col, -.45), .45); c.lineWidth = Math.max(.6, far * .025); c.beginPath();
    const n = rays; for (let i = 0; i <= n; i++) { const k = i / n, sx = base[0] + (base[2] - base[0]) * k, sy = base[1] + (base[3] - base[1]) * k; const j = Math.round(k * (pts.length / 2 - 1)) * 2; c.moveTo(sx, sy); c.lineTo(sx + (pts[j] - sx) * 1.1, sy + (pts[j + 1] - sy) * 1.1) }
    c.stroke(); c.restore();
  }
}
function drawFishReal(c, L, look, t, sid) {
  const a = ARCH[SP_ARCH[sid]] || ARCH[{ l: 'pike', e: 'eel', d: 'bream', f: 'flat' }[look.s]] || ARCH.cypr;
  const [body, back, belly, fin] = look.c || ['#9fb4bc', '#4a6a7a', '#eef4f6', '#7a9aaa'];
  const pat = SP_PAT[sid] || (look.st ? 'bars' : look.sp ? 'spots' : 'none'), detail = L >= 44, lw = Math.max(.7, L * .008);
  const ghost = GHOST[sid];
  if (look.g) { const g = c.createRadialGradient(0, 0, 0, 0, 0, L * .7); g.addColorStop(0, look.g + '77'); g.addColorStop(1, look.g + '00'); c.fillStyle = g; c.fillRect(-L, -L, L * 2, L * 2) }
  if (a.flat) return drawFlat(c, L, a, body, back, belly, fin, t, detail, lw);
  if (a.eel) return drawEel(c, L, a, body, back, belly, fin, t, detail, lw, look, sid);
  if (ghost) c.globalAlpha *= .82;
  const hh = a.H * L, xs = -L * .47, xp = L * .3, bl = xp - xs, wig = Math.sin(t * 6) * L * .035;
  const prof = u => { if (u < a.p) { const v = u / a.p; return .04 + .96 * Math.pow(Math.sin(v * Math.PI / 2), a.head * .85) } const v = (u - a.p) / (1 - a.p); return a.ped + (1 - a.ped) * Math.pow(Math.cos(v * Math.PI / 2), 1.25) };
  const topY = u => -hh * prof(u) * (a.flatTop ? .92 : a.hump) + (a.flatTop ? 0 : hh * .04 * Math.sin(u * Math.PI));
  const botY = u => hh * prof(u) * a.belly;
  const X = u => xs + bl * u;
  const finC = fin, dorsC = /^(perch|zander|cypr|salmon|herring|monster)$/.test(SP_ARCH[sid] || '') ? mixC(shade(back, .2), fin, .35) : fin, tailH = Math.max(hh * a.ped * 1.1, hh * (a.tail === 'veil' ? 1.5 : a.tail === 'lunate' ? 1.25 : 1.05));
  // --- saba ---
  const ty0 = topY(1), ty1 = botY(1), tl = L * (a.tail === 'veil' ? .28 : .2);
  let tp;
  switch (a.tail) {
    case 'round': tp = [xp, ty0, xp + tl * .55, -tailH * .9 + wig, xp + tl * .95, -tailH * .35 + wig, xp + tl, wig, xp + tl * .95, tailH * .35 + wig, xp + tl * .55, tailH * .9 + wig, xp, ty1]; break;
    case 'trunc': tp = [xp, ty0, xp + tl * .85, -tailH + wig, xp + tl * .82, wig, xp + tl * .85, tailH + wig, xp, ty1]; break;
    case 'fork2': tp = [xp, ty0, xp + tl * .9, -tailH + wig, xp + tl * .62, wig, xp + tl * .9, tailH + wig, xp, ty1]; break;
    case 'lunate': tp = [xp, ty0, xp + tl * 1.05, -tailH * 1.1 + wig, xp + tl * .55, wig * .6, xp + tl * 1.05, tailH * 1.1 + wig, xp, ty1]; break;
    case 'hetero': tp = [xp, ty0, xp + tl * 1.25, -tailH * 1.5 + wig, xp + tl * .5, wig * .5, xp + tl * .6, tailH * .6 + wig, xp, ty1]; break;
    case 'veil': { const w2 = Math.sin(t * 3) * L * .03; tp = [xp, ty0, xp + tl * .5, -tailH * 1.1 + wig, xp + tl * 1.0, -tailH * .9 + wig + w2, xp + tl * .75, -tailH * .25 + wig, xp + tl * .55, wig, xp + tl * .8, tailH * .3 + wig, xp + tl * 1.05, tailH * .95 + wig - w2, xp + tl * .5, tailH * 1.1 + wig, xp, ty1]; break }
    default: tp = [xp, ty0, xp + tl * .95, -tailH * 1.05 + wig, xp + tl * .48, wig * .6, xp + tl * .95, tailH * 1.05 + wig, xp, ty1];
  }
  const finA = a.tail === 'veil' ? .7 : .92;
  finShape(c, tp, finC, finA, detail ? 12 : 0, [xp, ty0, xp, ty1]);
  // --- selja- ja pärakuuimed (keha taga) ---
  const fins = [];
  const dorsal = (u0, u1, h, sweep, opt = {}) => { const x0 = X(u0), y0 = topY(u0) + hh * .06, x1 = X(u1), y1 = topY(u1) + hh * .06, n = opt.spiny || 0, pts = [x0, y0];
    if (opt.round) pts.push(x0 + (x1 - x0) * .1, y0 - h * .8, x0 + (x1 - x0) * .5 + sweep * .3, Math.min(y0, y1) - h, x1 + sweep * .5, y1 - h * .7);
    else if (n) for (let i = 0; i <= n; i++) { const k = i / n, bx = x0 + (x1 - x0) * k, by = y0 + (y1 - y0) * k, hk = h * (1 - Math.pow(k - .25, 2) * 1.2); pts.push(bx + sweep * .3, by - hk, bx + (x1 - x0) / n * .5 + sweep * .2, by - hk * .72) }
    else pts.push(x0 + (x1 - x0) * .3 + sweep * .4, Math.min(y0, y1) - h, x0 + (x1 - x0) * .7 + sweep, Math.min(y0, y1) - h * (opt.trail ? 1.05 : .55), x1 + sweep * (opt.trail ? 1.3 : .6), y1 - h * (opt.trail ? .5 : .12));
    pts.push(x1, y1); fins.push([pts, opt.col || dorsC, opt.alpha || .9, opt.rays ?? (n || 9), [x0, y0, x1, y1], opt.spot]) };
  const anal = (u0, u1, h, sweep, opt = {}) => { const x0 = X(u0), y0 = botY(u0) - hh * .06, x1 = X(u1), y1 = botY(u1) - hh * .06, pts = [x0, y0];
    if (opt.round) pts.push(x0 + (x1 - x0) * .2, y0 + h, x1 + sweep * .5, y1 + h * .8);
    else pts.push(x0 + (x1 - x0) * .35 + sweep * .4, Math.max(y0, y1) + h, x1 + sweep * (opt.trail ? 1.3 : .7), y1 + h * (opt.trail ? .6 : .2));
    pts.push(x1, y1); fins.push([pts, opt.col || finC, opt.alpha || .9, 8, [x0, y0, x1, y1]]) };
  switch (a.dors) {
    case 'perch': dorsal(.26, .5, hh * .75, L * .02, { spiny: 9, spot: 1 }); dorsal(.53, .7, hh * .55, L * .03); break;
    case 'perch2': dorsal(.25, .48, hh * .7, L * .02, { spiny: 10 }); dorsal(.51, .72, hh * .6, L * .03); break;
    case 'tall': dorsal(.4, .55, hh * .85, L * .05); break;
    case 'long': dorsal(.3, .72, hh * .45, L * .03); break;
    case 'round': dorsal(.42, .6, hh * .6, L * .02, { round: 1 }); break;
    case 'back': dorsal(.72, .86, hh * (a.scutes ? .9 : 1.1), L * .03); break;
    case 'sail': dorsal(.24, .62, hh * 1.25, L * .06, { round: 1, col: shade(finC, .1), spot: 2, rays: 16 }); break;
    case 'cod': dorsal(.26, .4, hh * .6, L * .015, { round: 1 }); dorsal(.43, .62, hh * .5, L * .015, { round: 1 }); dorsal(.65, .84, hh * .45, L * .015, { round: 1 }); break;
    case 'tiny': dorsal(.28, .34, hh * .45, L * .01); break;
    case 'trail': dorsal(.3, .58, hh * 1.3, L * .14, { trail: 1, alpha: .75 }); break;
    default: dorsal(.38, .56, hh * .75, L * .035);
  }
  if (a.adip) dorsal(.8, .86, hh * .25, L * .01, { round: 1, rays: 0 });
  switch (a.anal) {
    case 'long': anal(.52, .86, hh * .5, L * .02); break;
    case 'back': anal(.73, .86, hh * .7, L * .03); break;
    case 'round': anal(.66, .8, hh * .5, L * .02, { round: 1 }); break;
    case 'catfish': anal(.42, .96, hh * .4, L * .01); break;
    case 'cod': anal(.42, .62, hh * .5, L * .015, { round: 1 }); anal(.65, .84, hh * .45, L * .015, { round: 1 }); break;
    case 'trail': anal(.5, .7, hh * 1.1, L * .12, { trail: 1, alpha: .75 }); break;
    default: anal(.66, .8, hh * .55, L * .025);
  }
  // kõhuuim
  { const u = a.anal === 'catfish' ? .3 : .42, x0 = X(u), y0 = botY(u) - hh * .1; fins.push([[x0, y0, x0 + L * .05, y0 + hh * (a.pelvBig ? .7 : .5), x0 + L * .1, y0 + hh * .32, x0 + L * .08, y0], finC, .85, 6, [x0, y0, x0 + L * .08, y0]]) }
  for (const f of fins) { finShape(c, f[0], f[1], f[2], detail ? f[3] : 0, f[4]); if (f[5] === 1 && detail) { const b2 = f[4]; ell(c, b2[0] + (b2[2] - b2[0]) * .8, b2[1] + (b2[3] - b2[1]) * .8 - hh * .2, L * .016, hh * .13, 'rgba(10,10,20,.72)') } if (f[5] === 2 && detail) for (let i = 0; i < 7; i++) circ(c, f[4][0] + (f[4][2] - f[4][0]) * (i / 7 + .05), f[4][1] - hh * (.3 + th(i, 3, 5) * .6), L * .012, hexA('#ff6a8a', .7)) }
  // --- keha ---
  const N = 26; c.beginPath(); c.moveTo(X(0), (topY(0) + botY(0)) / 2);
  for (let i = 1; i <= N; i++) c.lineTo(X(i / N), topY(i / N));
  for (let i = N; i >= 1; i--) c.lineTo(X(i / N), botY(i / N));
  c.closePath();
  const g = c.createLinearGradient(0, -hh * a.hump, 0, hh * a.belly); g.addColorStop(0, back); g.addColorStop(.42, body); g.addColorStop(.62, shade(body, .1)); g.addColorStop(1, belly); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  // muster
  const rnd = (i, k) => th(i, k, L > 0 ? 7 : 7);
  if (pat === 'bars') { const n = look.st || 6; for (let i = 0; i < n; i++) { const u = .3 + i / n * .62, x = X(u); c.fillStyle = hexA(shade(back, -.35), .42); c.beginPath(); c.moveTo(x - L * .02, topY(u) - 2); c.quadraticCurveTo(x + L * .012, 0, x - L * .002, botY(u) * .45); c.lineTo(x + L * .022, botY(u) * .35); c.quadraticCurveTo(x + L * .035, 0, x + L * .022, topY(u) - 2); c.fill() } }
  if (pat === 'koi') { for (let i = 0; i < 5; i++) { const u = .12 + rnd(i, 1) * .7; ell(c, X(u), topY(u) * (.3 + rnd(i, 2) * .5), L * (.06 + rnd(i, 3) * .07), hh * (.35 + rnd(i, 4) * .3), hexA(back, .95)) } }
  if (pat === 'pikespots') { for (let i = 0; i < 26; i++) { const u = .25 + rnd(i, 1) * .7, yy = topY(u) * (.85 - rnd(i, 2) * 1.5); ell(c, X(u), yy, L * .016, hh * .07, hexA(shade(belly, .2), .55)) } }
  if (pat === 'xspots') { c.strokeStyle = 'rgba(20,20,30,.55)'; c.lineWidth = Math.max(.8, L * .007); c.beginPath(); for (let i = 0; i < 22; i++) { const u = .15 + rnd(i, 1) * .75, yy = topY(u) * (.25 + rnd(i, 2) * .65), s2 = L * .008; c.moveTo(X(u) - s2, yy - s2); c.lineTo(X(u) + s2, yy + s2); c.moveTo(X(u) + s2, yy - s2); c.lineTo(X(u) - s2, yy + s2) } c.stroke() }
  if (pat === 'trout' || pat === 'char' || pat === 'spots' || pat === 'grayspots') { const red = pat === 'trout' || pat === 'char'; for (let i = 0; i < 30; i++) { const u = .12 + rnd(i, 1) * .82, yy = topY(u) * (1 - rnd(i, 2) * 1.3); circ(c, X(u), yy, L * (pat === 'char' ? .011 : .009), pat === 'char' ? 'rgba(255,240,200,.65)' : red && i % 4 === 0 ? 'rgba(220,60,50,.8)' : 'rgba(20,20,20,.5)') } }
  if (pat === 'mottle') for (let i = 0; i < 18; i++) { const u = .05 + rnd(i, 1) * .9; ell(c, X(u), topY(u) * (1 - rnd(i, 2) * 1.2), L * (.02 + rnd(i, 3) * .03), hh * (.1 + rnd(i, 4) * .15), hexA(shade(back, -.3), .35)) }
  if (look.b) { c.fillStyle = hexA(look.b, .55); c.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N; c.lineTo(X(u), topY(u) * .12 - hh * .05) } for (let i = N; i >= 0; i--) { const u = i / N; c.lineTo(X(u), topY(u) * -.12 + hh * .14) } c.fill() }
  // soomused
  if (detail && a.scale) { const s = L * a.scale; c.lineWidth = Math.max(.5, L * .0045); c.beginPath(); let row = 0; for (let y = -hh * 1.3; y < hh * 1.3; y += s * .62, row++) for (let x = X(.2) + (row % 2) * s * .45; x < xp + s; x += s * .9) { c.moveTo(x + s * .5 * Math.cos(-1.2), y + s * .5 * Math.sin(-1.2)); c.arc(x, y, s * .5, -1.2, 1.2) } c.strokeStyle = 'rgba(0,0,0,.13)'; c.stroke(); c.save(); c.translate(-s * .08, -s * .06); c.strokeStyle = 'rgba(255,255,255,.12)'; c.stroke(); c.restore() }
  // valgus ja vari (keha tundub ümar)
  const lg = c.createLinearGradient(0, -hh * 1.2, 0, hh * 1.2); lg.addColorStop(0, 'rgba(0,0,0,.25)'); lg.addColorStop(.18, 'rgba(255,255,255,0)'); lg.addColorStop(.32, 'rgba(255,255,255,.28)'); lg.addColorStop(.46, 'rgba(255,255,255,0)'); lg.addColorStop(.85, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = lg; c.fillRect(xs, -hh * 1.5, bl + L * .05, hh * 3);
  // pea veidi tumedam ja läikivam
  const hg = c.createLinearGradient(X(0), 0, X(.25), 0); hg.addColorStop(0, 'rgba(0,0,0,.18)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = hg; c.fillRect(X(0), -hh * 1.5, bl * .25, hh * 3);
  // külgjoon
  if (!a.noLat && detail) { c.strokeStyle = a.palelat ? 'rgba(255,255,240,.5)' : 'rgba(30,30,30,.28)'; c.lineWidth = Math.max(.6, L * .005); c.beginPath(); for (let i = 0; i <= 20; i++) { const u = .2 + i / 20 * .78; c.lineTo(X(u), topY(u) * .38 + hh * .02) } c.stroke() }
  // lõpused
  const gu = a.whiskers ? .16 : .2, gx = X(gu);
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = Math.max(.7, L * .007); c.beginPath(); c.moveTo(gx - L * .01, topY(gu) * .8); c.quadraticCurveTo(gx + L * .035, 0, gx - L * .01, botY(gu) * .85); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.moveTo(gx - L * .022, topY(gu) * .7); c.quadraticCurveTo(gx + L * .02, 0, gx - L * .022, botY(gu) * .75); c.stroke();
  if (a.scutes) { for (const r of [.55, 0, -.1]) for (let i = 0; i < 13; i++) { const u = .22 + i * .055, yy = r === .55 ? topY(u) * .85 : r === 0 ? topY(u) * .1 : botY(u) * .6; poly(c, [X(u) - L * .012, yy, X(u), yy - L * .012, X(u) + L * .012, yy, X(u), yy + L * .012], hexA(shade(body, .25), .7)) } }
  c.restore();
  // kontuur
  c.strokeStyle = hexA(shade(back, -.5), .55); c.lineWidth = lw; c.stroke();
  // rinnauim (keha peal, poolläbipaistev)
  { const x0 = X(gu) + L * .03, y0 = hh * .25, sw = Math.sin(t * 5) * L * .01; finShape(c, [x0, y0 - hh * .08, x0 + L * .08 + sw, y0 + hh * .05, x0 + L * .11 + sw, y0 + hh * .3, x0 + L * .05, y0 + hh * .32, x0, y0 + hh * .12], finC, .62, detail ? 6 : 0, [x0, y0 - hh * .08, x0, y0 + hh * .12]) }
  // suu
  const mx = X(0), my = (topY(0) + botY(0)) / 2 + hh * (a.under ? .35 : a.whiskers ? .05 : .08);
  c.strokeStyle = 'rgba(20,10,10,.6)'; c.lineWidth = Math.max(.8, L * .009); c.lineCap = 'round'; c.beginPath();
  if (a.under) { c.moveTo(X(.12), botY(.12) * .8); c.lineTo(X(.17), botY(.17) * .8) }
  else { c.moveTo(mx + L * .004, my - hh * .02); c.quadraticCurveTo(mx + L * (a.jaw || .04) * .5, my + hh * .03, mx + L * (a.jaw || .04), my + hh * .07) }
  c.stroke();
  if (a.teeth && detail) { c.fillStyle = '#fffbea'; for (let i = 0; i < 4; i++) { const tx = mx + L * (.015 + i * .018); poly(c, [tx, my - .5, tx + L * .006, my + L * .012, tx + L * .012, my - .5], '#fffbea') } }
  // vurrud
  c.strokeStyle = hexA(shade(back, -.2), .9); c.lineWidth = Math.max(.8, L * .008);
  const sway = Math.sin(t * 2) * L * .02;
  if (a.whiskers || look.w) { c.beginPath(); c.moveTo(mx + L * .02, my - hh * .05); c.bezierCurveTo(mx - L * .05, my - hh * .5, mx - L * .1, my + hh * .2 + sway, mx - L * .14, my + hh * 1.1 + sway); c.moveTo(mx + L * .03, my); c.bezierCurveTo(mx - L * .02, my + hh * .5, mx + L * .02, my + hh * .9, mx - L * .03, my + hh * 1.4 + sway * .6); c.stroke(); c.lineWidth = Math.max(.6, L * .004); c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(mx + L * (.04 + i * .012), botY(.06)); c.lineTo(mx + L * (.03 + i * .014), botY(.06) + hh * .35) } c.stroke() }
  if (a.barbel) { c.beginPath(); c.moveTo(mx + L * .012, my + hh * .02); c.quadraticCurveTo(mx + L * .01, my + hh * .25, mx + L * .03, my + hh * .32 + sway * .2); c.stroke() }
  if (a.chin) { c.beginPath(); const cx2 = X(.05); c.moveTo(cx2, botY(.05) * .9); c.quadraticCurveTo(cx2 - L * .005, botY(.05) + hh * .25, cx2 + L * .01, botY(.05) + hh * .35 + sway * .2); c.stroke() }
  if (a.under) { c.beginPath(); for (let i = 0; i < 4; i++) { const bx = X(.04 + i * .018), by = botY(.05) * .9; c.moveTo(bx, by); c.lineTo(bx - L * .004, by + hh * .4 + sway * .2) } c.stroke() }
  // silm
  const eu = a.whiskers ? .07 : a.head > 1.5 ? .14 : .09, ex = X(eu), ey = topY(eu) * (a.whiskers ? .45 : .45), er = Math.max(1.2, L * a.eyeR);
  circ(c, ex, ey, er * 1.12, 'rgba(0,0,0,.35)'); circ(c, ex, ey, er, a.eye); const ig = c.createRadialGradient(ex, ey, er * .3, ex, ey, er); ig.addColorStop(0, 'rgba(0,0,0,0)'); ig.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = ig; c.beginPath(); c.arc(ex, ey, er, 0, 6.283); c.fill();
  circ(c, ex - er * .05, ey, er * .58, '#0a0a0e'); circ(c, ex - er * .3, ey - er * .3, Math.max(.6, er * .22), 'rgba(255,255,255,.9)');
  if (ghost) c.globalAlpha /= .82;
}
function drawEel(c, L, a, body, back, belly, fin, t, detail, lw, look, sid) {
  const hh = a.H * L, x0 = -L * .48, len = L * .98, N = 34, ph = t * 4;
  const cy = u => Math.sin(u * 7 - ph) * L * .035 * (.25 + u);
  const th2 = u => hh * (u < .08 ? Math.sqrt(u / .08) * .9 + .1 : u < .6 ? 1 : Math.max(.08, 1 - (u - .6) / .4 * .92));
  // pidev selja- ja pärakuuim
  const finPts = side => { const pts = []; for (let i = 0; i <= N; i++) { const u = i / N; if (u < (a.burbot ? .35 : .3)) continue; const ext = hh * (a.crest ? .9 : .4) * Math.min(1, (u - .3) * 4) * (u > .95 ? (1 - u) * 20 : 1); pts.push(x0 + len * u, cy(u) + side * (th2(u) + ext)) } for (let i = N; i >= 0; i--) { const u = i / N; if (u < (a.burbot ? .35 : .3)) continue; pts.push(x0 + len * u, cy(u) + side * th2(u) * .8) } return pts };
  for (const side of [-1, 1]) { const p = finPts(side); c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fillStyle = hexA(shade(fin, .15), .55); c.fill() }
  if (a.crest && detail) { c.fillStyle = hexA(fin, .95); for (let i = 0; i < 9; i++) { const u = .12 + i * .05, x = x0 + len * u, y = cy(u) - th2(u); poly(c, [x - L * .012, y + 1, x + L * .01, y - hh * 1.1, x + L * .02, y + 1], hexA(fin, .95)) } }
  c.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N; c.lineTo(x0 + len * u, cy(u) - th2(u)) } for (let i = N; i >= 0; i--) { const u = i / N; c.lineTo(x0 + len * u, cy(u) + th2(u)) } c.closePath();
  const g = c.createLinearGradient(0, -hh, 0, hh); g.addColorStop(0, back); g.addColorStop(.45, body); g.addColorStop(1, belly); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  if (SP_PAT[sid] === 'mottle' || look.sp) for (let i = 0; i < 26; i++) { const u = .05 + th(i, 1, 9) * .9; ell(c, x0 + len * u, cy(u) - hh * (th(i, 2, 9) - .3), L * .014, hh * .3, hexA(shade(back, -.35), .4)) }
  if (SP_PAT[sid] === 'scales2' && detail) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .7; c.beginPath(); for (let u = .1; u < .95; u += .025) { const x = x0 + len * u; c.moveTo(x, cy(u) - th2(u)); c.arc(x - hh * .4, cy(u), hh * .5, -.9, .9) } c.stroke() }
  const lg = c.createLinearGradient(0, -hh * 1.3, 0, hh * 1.3); lg.addColorStop(0, 'rgba(0,0,0,.2)'); lg.addColorStop(.3, 'rgba(255,255,255,.25)'); lg.addColorStop(.5, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = lg; c.fillRect(x0 - 5, -L * .3, len + 10, L * .6);
  c.restore();
  c.strokeStyle = hexA(shade(back, -.5), .5); c.lineWidth = lw; c.stroke();
  // rinnauim, lõpus, suu, silm
  const gx = x0 + len * .1; c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = Math.max(.7, L * .007); c.beginPath(); c.moveTo(gx, cy(.1) - hh * .7); c.quadraticCurveTo(gx + L * .015, cy(.1), gx, cy(.1) + hh * .7); c.stroke();
  finShape(c, [gx + L * .01, cy(.11) + hh * .1, gx + L * .05, cy(.11) + hh * .2, gx + L * .05, cy(.11) + hh * .8, gx + L * .01, cy(.11) + hh * .6], fin, .7, 0);
  c.strokeStyle = 'rgba(20,10,10,.6)'; c.beginPath(); c.moveTo(x0 + L * .005, cy(0) + hh * .25); c.lineTo(x0 + L * .045, cy(.04) + hh * .2); c.stroke();
  if (a.chin) { c.strokeStyle = hexA(shade(back, -.2), .9); c.beginPath(); c.moveTo(x0 + L * .03, cy(.03) + hh * .7); c.quadraticCurveTo(x0 + L * .025, cy(.03) + hh * 1.3, x0 + L * .04, cy(.03) + hh * 1.6); c.stroke() }
  const ex = x0 + len * .045, ey = cy(.045) - hh * .3, er = Math.max(1.1, L * a.eyeR);
  circ(c, ex, ey, er, a.eye); circ(c, ex, ey, er * .6, '#0a0a0e'); circ(c, ex - er * .3, ey - er * .3, Math.max(.5, er * .25), 'rgba(255,255,255,.9)');
}
function drawFlat(c, L, a, body, back, belly, fin, t, detail, lw) {
  const rx = L * .33, ry = L * .2, wig = Math.sin(t * 5) * L * .02;
  // ääreuimed
  c.beginPath(); for (let i = 0; i <= 40; i++) { const an = i / 40 * Math.PI * 2, r = 1.14 + Math.sin(an * 14 + t * 6) * .02; c.lineTo(Math.cos(an) * rx * r - L * .03, Math.sin(an) * ry * (r + .1)) } c.fillStyle = hexA(fin, .8); c.fill();
  poly(c, [rx * .85, -ry * .3, rx * 1.55, -ry * .75 + wig, rx * 1.45, wig, rx * 1.55, ry * .75 + wig, rx * .85, ry * .3], hexA(fin, .9));
  c.beginPath(); c.ellipse(-L * .03, 0, rx, ry, 0, 0, 6.283); const g = c.createRadialGradient(-L * .1, -ry * .3, 2, 0, 0, rx); g.addColorStop(0, shade(body, .15)); g.addColorStop(1, back); c.fillStyle = g; c.fill();
  c.save(); c.clip(); for (let i = 0; i < 16; i++) circ(c, -rx + th(i, 1, 4) * rx * 2, -ry + th(i, 2, 4) * ry * 2, L * (.012 + th(i, 3, 4) * .012), i % 3 ? 'rgba(40,30,20,.35)' : 'rgba(230,120,50,.7)'); c.restore();
  c.strokeStyle = hexA(shade(back, -.5), .55); c.lineWidth = lw; c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.moveTo(-rx * .45, -ry * .7); c.quadraticCurveTo(-rx * .3, 0, -rx * .45, ry * .7); c.stroke();
  for (const [ex, ey] of [[-rx * .72, -ry * .32], [-rx * .58, -ry * .55]]) { const er = Math.max(1.1, L * .022); circ(c, ex, ey, er * 1.2, 'rgba(0,0,0,.3)'); circ(c, ex, ey, er, a.eye); circ(c, ex, ey, er * .55, '#0a0a0e'); circ(c, ex - er * .3, ey - er * .3, er * .25, '#fff') }
  c.strokeStyle = 'rgba(20,10,10,.6)'; c.beginPath(); c.moveTo(-rx * 1.0, ry * .05); c.quadraticCurveTo(-rx * .9, ry * .2, -rx * .82, ry * .12); c.stroke();
}

function paintFishCanvases(root) {
  root.querySelectorAll('canvas[data-fl]').forEach(cv2 => {
    const w = cv2.clientWidth || 140, h = cv2.clientHeight || 60, d = 2; cv2.width = w * d; cv2.height = h * d;
    const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    const r = +cv2.dataset.r || 1, col = (RAR2[r] || RAR2[1])[1];
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#24566a'); g.addColorStop(1, '#122e3a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const rg = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * .6); rg.addColorStop(0, col + '40'); rg.addColorStop(1, col + '00'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
    const sp = FD.sp[cv2.dataset.fl], junk = cv2.dataset.junk;
    const L = Math.min(w * .8, h * .82 / fishFit(sp && sp.look));
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
  return `<span class="chip" title="${w[1]}">${w[0]}</span>${WFISH[FS.weather] ? `<span class="chip wfish" title="Need kalad ujuvad ainult selle ilmaga">🌦️ ${WFISH[FS.weather]}</span>` : ''}${FS.is_night ? '<span class="chip" title="Öised kalad on väljas">🌙 Öö</span>' : '<span class="chip">☀️ Päev</span>'}${FS.is_winter ? '<span class="chip" title="Talvised kalad on väljas">❄️ Talv</span>' : ''}${FS.luck ? `<span class="chip" title="Kuldkala õnnistus">🍀 Õnn ${FS.luck}</span>` : ''}`;
}
const FTABS = { puuk: 'Püük', saak: 'Saak', maja: 'Kalamaja', tellimus: 'Ülesanded', pood: 'Pood', raamat: 'Kalaraamat', voistlus: 'Võistlused', uudised: 'Uudised' };
function fvBadges() {
  const b = {};
  b.saak = (FS.inventory || []).filter(x => !x.trophy).length || 0;
  b.tellimus = (FV.orders ? FV.orders.filter(o => !o.done && o.have >= o.qty).length : 0) + (FV.quests ? [...FV.quests.daily, ...FV.quests.weekly].filter(q => !q.done && +q.progress >= +q.target).length : 0);
  b.uudised = NEWS.unread;
  b.maja = FS.aq_pending >= 50 ? 1 : 0;
  if (FV.comps) b.voistlus = ['big', 'rare', 'most'].filter(k => { const c = FV.comps[k]; return c && !c.claimed && (c.last || []).some(r => r.me && r.place <= 3) }).length;
  return b;
}
function renderFV(force) {
  if (!FV.open || !FS) return;
  if (!force && FV.busyUI) return;
  const b = fvBadges();
  const html = fvHeader() + `<nav class="fv-tabs">${Object.keys(FTABS).map(k => `<button type="button" class="${FV.tab === k ? 'on' : ''}" data-fa="tab" data-arg="${k}">${FTABS[k]}${b[k] ? `<span class="dot">${b[k] > 99 ? '99+' : b[k]}</span>` : ''}</button>`).join('')}</nav><div class="fv-body">${{ puuk: tabPuuk, saak: tabSaak, pood: tabPood, raamat: tabRaamat, voistlus: tabVoistlus, tellimus: tabUlesanded, uudised: tabUudised, maja: tabMaja }[FV.tab]()}</div>`;
  const root = $('#fvIn'), st = $('#fishView').scrollTop;
  root.innerHTML = html;
  const slot = root.querySelector('#fvSceneSlot'); if (slot) slot.replaceWith(sceneCv);
  const aslot = root.querySelector('#fvAqSlot'); if (aslot) aslot.replaceWith(aqCv);
  paintFishCanvases(root); paintHouses(root);
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
      <p class="lead" style="font-size:12px">Lisaks võib õnge otsa sattuda naljakaid leide (5%) või veealune aardekirst (1,5%): puidust, hõbedane või väga harva kuldne. Vahel leiad kala kõhust midagi väärtuslikku.</p></div>` : ''}
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
  if (['idle', 'result', 'lost'].includes(FV.phase)) return `<button class="btn bigbtn" type="button" data-fa="cast">Viska õng <small style="font-weight:500;opacity:.7;font-size:12px">(tühik)</small></button>`;
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
      FV.busy = false; setPhase('result', resultMsg(r));
      afterLevels(r.levels); afterAch(r.ach);
      FV.orders = null; loadSide();
    }
  } catch (e) { toast(e.message, 'bad'); setPhase('idle') }
  FV.busy = false;
}
function resultMsg(r) {
  if (r.kind === 'junk') return `Õnge otsas oli ${JUNK2[r.junk][0].toLowerCase()}! ${JUNK2[r.junk][1]}`;
  if (r.kind === 'chest') return `${(CHEST2[r.tier] || CHEST2.puu)[0]}! Said ${r.gold} kulda${r.map ? ' ja aardekaardi (saadeti kuningriiki)' : ''}${itemsTxt(r.items)}.`;
  return `${r.giant ? 'REKORDILISELT SUUR! ' : ''}Püüdsid: ${r.name}, ${fmt1(+r.weight)} kg!${r.new_species ? ' Uus liik kalaraamatus!' : r.record ? ' Uus isiklik rekord!' : ''}${r.items && r.items.length ? ` Kala kõhust leidsid: ${itemsTxt(r.items, true)}!` : ''}`;
}
function itemName(id) { return (ITEM_IC[id] || '✨') + ' ' + (FD.item[id] ? FD.item[id].name : id) }
function itemsTxt(list, bare) { if (!list || !list.length) return ''; const t = list.map(x => itemName(x.id) + (x.qty > 1 ? ' ×' + x.qty : '')).join(', '); return bare ? t : ' ning kotti: ' + t }
function itemsRow(list) { return list && list.length ? `<div class="itemrow">${list.map(x => { const it = FD.item[x.id]; return `<span class="itm" style="border-color:${RAR2[it ? it.rarity : 1][1]}88">${itemName(x.id)}${x.qty > 1 ? ' ×' + x.qty : ''}</span>` }).join('')}</div>` : '' }
function estPrice(id) {
  const c = (FS.inventory || []).find(x => x.id === id); if (!c) return 0;
  const s = FD.sp[c.species], m = FV.market && FV.market[c.species] ? FV.market[c.species] : { mult: 1, sold: 0 };
  const avg = (s.min_w + s.max_w) / 2;
  return Math.max(1, Math.round(s.price * m.mult * Math.min(2, .6 + .4 * c.weight / avg) / (1 + m.sold / 15)));
}
function resultCard() {
  const r = FV.result;
  if (r.kind !== 'fish') { const ch = CHEST2[r.tier] || CHEST2.puu, col = r.kind === 'chest' ? ch[1] : '#ffd065';
    return `<div class="result" style="--rc:${col}"><canvas data-fl="" data-junk="${r.kind === 'chest' ? 'chest_' + (r.tier || 'puu') : r.junk}" data-r="1"></canvas><div style="display:grid;gap:4px"><span class="rpill" style="color:${col}">${r.kind === 'chest' ? 'Aare' : 'Leid'}</span><h3>${r.kind === 'chest' ? ch[0] : JUNK2[r.junk][0]}</h3><p class="lead">+${r.xp} kogemust${r.gold ? ` · +${r.gold} kulda` : ''}${r.map ? ' · aardekaart kuningriiki' : ''}</p>${itemsRow(r.items)}</div></div>` }
  const [rn, rc] = RAR2[r.rarity], inInv = (FS.inventory || []).some(x => x.id === r.catch_id), sp = FD.sp[r.species];
  return `<div class="result" style="--rc:${rc}"><canvas data-fl="${r.species}" data-r="${r.rarity}"></canvas><div style="display:grid;gap:4px"><span class="rpill" style="color:${rc}">${rn}</span><h3>${esc(r.name)}</h3>
    <p class="lead">${fmt1(+r.weight)} kg · +${r.xp} kogemust${r.giant ? ' · <b style="color:var(--amber-2)">rekordsuurus!</b>' : ''}${r.new_species ? ' · <b style="color:var(--ok)">uus liik!</b>' : r.record ? ' · <b style="color:var(--ok)">isiklik rekord!</b>' : ''}</p>
    <p class="lead" style="font-size:12.5px">${esc(sp ? sp.descr : '')}</p>${r.items && r.items.length ? '<small class="lead">Kala kõhust leitud:</small>' + itemsRow(r.items) : ''}</div>
    ${inInv ? `<div class="acts"><button class="btn sm" type="button" data-fa="use" data-arg="sell:${r.catch_id}">Müü (~${estPrice(r.catch_id)} kulda)</button><button class="btn sm ghost" type="button" data-fa="use" data-arg="cook:${r.catch_id}">Toiduks</button><button class="btn sm ghost" type="button" data-fa="use" data-arg="release:${r.catch_id}">Lase vabaks</button><button class="btn sm ghost" type="button" data-fa="use" data-arg="trophy:${r.catch_id}">Trofeeriiulile</button>${FS.house ? `<button class="btn sm ghost" type="button" data-fa="aqput" data-arg="${r.catch_id}">Akvaariumi</button>` : ''}${r.rarity >= 4 ? `<button class="btn sm ghost" type="button" data-fa="exch" data-arg="${r.catch_id}">${r.species === 'kuldkala' ? 'Soovi midagi' : 'Vaheta preemia vastu'}</button>` : ''}<span class="lead" style="font-size:12px;align-self:center">või jäta saagi hulka</span></div>` : '<div class="acts"><span class="lead">Kala on kasutatud.</span></div>'}</div>`;
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
  if (aqCv.isConnected) drawAquarium(t);
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
      ${FS.house ? `<button class="btn sm ghost" type="button" data-fa="aqputSel" ${selN === 1 ? '' : 'disabled'}>Akvaariumi</button>` : ''}
      <button class="btn sm ghost" type="button" data-fa="exchSel" ${selN === 1 && kept.find(x => FV.sel.has(x.id) && x.rarity >= 4) ? '' : 'disabled'}>Vaheta preemia vastu</button>
      <button class="btn sm ghost" type="button" data-fa="selnone" ${selN ? '' : 'disabled'}>Tühista valik</button></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-fa="sellall" data-arg="1" ${kept.some(x => x.rarity === 1) ? '' : 'disabled'}>Müü kõik tavalised</button><button class="btn sm ghost" type="button" data-fa="sellall" data-arg="2" ${kept.some(x => x.rarity <= 2) ? '' : 'disabled'}>Müü kõik tavalised ja ebatavalised</button></div>
    ${kept.length ? `<div class="inv">${kept.slice(0, 150).map(cell).join('')}</div>${kept.length > 150 ? `<p class="lead">Näidatakse 150 väärtuslikumat kala, kokku on ${kept.length}.</p>` : ''}` : '<p class="lead">Saak on tühi. Mine püüki!</p>'}</div>`;
  h += `<div class="fv-card"><h2>Trofeeriiul <small class="lead">${tro.length} / 12</small></h2><p class="lead">Trofeed jäävad sinu kollektsiooni igaveseks ja neid ei müüda kogemata maha. Klõpsa trofeel, et see riiulilt tagasi võtta.</p>${tro.length ? `<div class="inv">${tro.map(cell).join('')}</div>` : '<p class="lead">Riiul on veel tühi. Pane siia oma uhkeim saak.</p>'}</div>`;
  const its = FD.items.filter(it => (FS.items || {})[it.id] > 0);
  h += `<div class="fv-card"><h2>Kott <small class="lead">${its.reduce((a, it) => a + FS.items[it.id], 0)} eset</small></h2><p class="lead">Aardekirstudest, karpidest, kalade kõhust ja ülesannetest leitud väärtuslikud asjad. Neid saab müüa kalurikassasse. Hiljem läheb osa neist vaja ka õngede võlumiseks, seega ära kõike kohe maha müü.</p>
    ${its.length ? `<div class="shop">${its.map(it => `<div class="srow"><div><b>${itemName(it.id)} × ${FS.items[it.id]}</b> <span class="rpill" style="color:${RAR2[it.rarity][1]}">${RAR2[it.rarity][0]}</span><small>${esc(it.descr)} · ${fmt(it.price)} kulda tükk</small></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end"><button class="btn sm ghost" type="button" data-fa="isell" data-arg="${it.id}:1">Müü 1</button>${FS.items[it.id] > 1 ? `<button class="btn sm ghost" type="button" data-fa="isell" data-arg="${it.id}:${FS.items[it.id]}">Müü kõik (${fmt(it.price * FS.items[it.id])})</button>` : ''}</div></div>`).join('')}</div>` : '<p class="lead">Kott on tühi. Leia aardekirste ja merekarpe!</p>'}</div>`;
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
  let h = badgesCard() + `<div class="fv-card"><h2>Kalaraamat</h2><p class="lead">Püütud ${caught} / ${FD.species.length} liiki. Kõigi kalade leidmine annab tiitli „Kalakuningas“ ja suure preemia.</p><div class="bar green"><i style="width:${(caught / FD.species.length * 100).toFixed(1)}%"></i></div>`;
  for (let r = 1; r <= 6; r++) {
    const list = FD.species.filter(s => s.rarity === r), [rn, rc] = RAR2[r];
    h += `<div class="sec-h" style="color:${rc}">${rn} <small>${list.filter(s => book[s.id]).length} / ${list.length}</small></div><div class="book">${list.map(s => {
      const b = book[s.id]; const where = s.spots.map(x => FD.spot[x] ? FD.spot[x].name : x).join(', ');
      return `<div class="bcell" style="border-color:${b ? rc + '66' : 'transparent'}"><canvas data-fl="${s.id}" data-r="${s.rarity}" data-unk="${b ? 0 : 1}"></canvas><b>${b ? esc(s.name) : '???'}</b><small>${b ? `Püütud ${b.n}× · rekord ${fmt1(+b.max)} kg` : `${fmt1(s.min_w)}–${fmt1(s.max_w)} kg`}</small><small>${esc(where)}${s.night_only ? ' · öösel' : ''}${s.winter_only ? ' · talvel' : ''}${s.weather ? ' · ainult ' + s.weather.map(w => WNAME[w] || w).join(', ') : ''}${s.min_level > FS.level ? ` · tase ${s.min_level}` : ''}</small></div>`;
    }).join('')}</div>`;
  }
  h += '</div>';
  const got = FS.ach || {};
  h += `<div class="fv-card"><h2>Saavutused ja tiitlid</h2><p class="lead">Avatud ${Object.keys(got).length} / ${FD.achs.length}. Mõned saavutused annavad tiitli, mida näevad ka teised mängijad.</p>
    <div class="ctrl"><div class="field"><label for="fvTitle">Sinu tiitel</label><select id="fvTitle" data-fa="title"><option value="">Ilma tiitlita</option>${(FS.titles || []).map(t => `<option ${t === FS.title ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div></div>
    <div class="achl">${FD.achs.map(a => `<div class="achc ${got[a.id] ? 'got' : ''}"><b>${got[a.id] ? '★ ' : ''}${esc(a.name)}</b><small>${esc(a.descr)}</small><small>${a.reward_gold ? `+${a.reward_gold} kulda ` : ''}${a.reward_xp ? `+${a.reward_xp} kogemust` : ''}${a.title ? ` · tiitel „${esc(a.title)}“` : ''}</small></div>`).join('')}</div></div>`;
  const br = FS.by_rarity || {};
  h += `<div class="fv-card"><h2>Statistika</h2><dl class="stats">${[1, 2, 3, 4, 5, 6].map(r => `<dt>${RAR2[r][0]} kalu</dt><dd>${br[r] || 0}</dd>`).join('')}
    <dt>Öösel püütud</dt><dd>${FS.night}</dd><dt>Naljakaid leide</dt><dd>${FS.junk}</dd><dt>Aardekirste</dt><dd>${FS.chests}</dd><dt>Pääsenud kalu</dt><dd>${FS.lost}</dd><dt>Murtud õngi</dt><dd>${FS.broken}</dd><dt>Täidetud tellimusi</dt><dd>${FS.orders_done}</dd><dt>Täidetud ülesandeid</dt><dd>${FS.quests_done || 0}</dd><dt>Võistlusvõite</dt><dd>${FS.comp_wins}</dd></dl></div>`;
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

/* ---------- Märgid ---------- */
function badgesCard() {
  const B = FS.badges || []; if (!B.length) return '';
  return `<div class="fv-card"><h2>Kalamehe märgid</h2><p class="lead">Igal märgil on kolm astet: pronks, hõbe ja kuld. Märke kontrollib server sinu päris püükide põhjal.</p><div class="badges">${B.map(b => `<div class="bdg t${b.tier}" style="--bc:${BADGE_C[b.tier]}"><span class="bi">${BADGE_IC[b.id] || '★'}</span><b>${esc(b.name)}</b><small>${b.tier ? BADGE_T[b.tier] : 'Pole veel'}</small><small class="num">${esc(b.what)}: ${fmt(Math.floor(+b.value))}${b.next ? ' / ' + fmt(b.next) : ' ✓'}</small>${b.next ? `<div class="bar"><i style="width:${Math.min(100, +b.value / b.next * 100).toFixed(1)}%"></i></div>` : ''}</div>`).join('')}</div></div>`;
}

/* ---------- Ülesanded ---------- */
function questText(q) {
  const t = fmt(+q.target);
  switch (q.kind) {
    case 'count': return `Püüa ${t} kala`;
    case 'rarity': return `Püüa ${t} kala, mis on vähemalt „${RAR2[+q.param][0].toLowerCase()}“`;
    case 'spot': return `Püüa ${t} kala kohas ${FD.spot[q.param] ? FD.spot[q.param].name : q.param}`;
    case 'species': return `Püüa ${t} × ${FD.sp[q.param] ? FD.sp[q.param].name : q.param}`;
    case 'weight': return `Püüa kokku ${t} kg kala`;
    case 'night': return `Püüa öösel ${t} kala`;
    case 'weather': return `Püüa ${t} ilmakala (kala, kes ujub ainult kindla ilmaga)`;
    case 'chest': return `Leia ${t} veealust aardekirstu`;
  }
  return q.kind;
}
function questRow(q, per) {
  const prog = +q.progress, tgt = +q.target, ok = prog >= tgt;
  return `<div class="srow" style="${q.done ? 'opacity:.6' : ''}"><div><b>${questText(q)}</b><div class="bar ${ok ? 'green' : ''}" style="margin:5px 0"><i style="width:${Math.min(100, prog / tgt * 100).toFixed(1)}%"></i></div>
    <small class="num">${q.kind === 'weight' ? fmt1(prog) : fmt(prog)} / ${fmt(tgt)} · Preemia: ${fmt(q.gold)} kulda, ${fmt(q.xp)} kogemust${q.item && q.qty ? ', ' + itemName(q.item) : ''}</small></div>
    ${q.done ? '<span class="pill ok">Tehtud</span>' : `<button class="btn sm" type="button" data-fa="qclaim" data-arg="${per}:${q.idx}" ${ok ? '' : 'disabled'}>Võta preemia</button>`}</div>`;
}
function timeLeft(iso) { const ms = new Date(iso) - Date.now(); if (ms <= 0) return 'kohe'; const h = Math.floor(ms / 3600000), d = Math.floor(h / 24); return d ? `${d} p ${h % 24} h` : h ? `${h} h ${Math.floor(ms / 60000) % 60} min` : `${Math.max(1, Math.floor(ms / 60000))} min` }
function tabUlesanded() {
  const Q = FV.quests;
  let h = `<div class="fv-card"><h2>Igapäevased ülesanded</h2><p class="lead">Server loeb edenemist sinu päris püükidest. Uued ülesanded tulevad iga päev kesköösel${Q ? ` (veel ${timeLeft(Q.day_ends)})` : ''}.</p>`;
  h += Q ? `<div class="shop">${Q.daily.map(q => questRow(q, 'd')).join('')}</div>` : '<p class="lead">Laadin ülesandeid…</p>';
  h += `</div><div class="fv-card"><h2>Iganädalased ülesanded</h2><p class="lead">Suuremad ülesanded suurema preemiaga. Uued tulevad esmaspäeval${Q ? ` (veel ${timeLeft(Q.week_ends)})` : ''}.</p>`;
  h += Q ? `<div class="shop">${Q.weekly.map(q => questRow(q, 'w')).join('')}</div>` : '<p class="lead">Laadin ülesandeid…</p>';
  return h + '</div>' + tabTellimus();
}

/* ---------- Kuningriigi uudised ---------- */
const NEWS = { list: null, last: 0, unread: 0, seen: 0, at: 0 };
try { NEWS.seen = +localStorage.getItem('mk.newsSeen') || 0 } catch (e) { }
function newsText(n) {
  const d = n.data || {}, sp = FD.sp[d.species], fn = sp ? sp.name : (d.species || 'kala'), w = d.weight ? ` (${fmt1(+d.weight)} kg)` : '', who = `<b>${esc(n.name)}</b>${n.title ? ` <small class="lead">${esc(n.title)}</small>` : ''}`;
  switch (n.kind) {
    case 'first': return `${who} püüdis kuningriigi esimesena liigi <b style="color:${RAR2[d.rarity || 3][1]}">${esc(fn)}</b>${w}!`;
    case 'catch': return `${who} püüdis ${({ 3: 'haruldase', 4: 'eepilise', 5: 'legendaarse', 6: 'müütilise' })[d.rarity || 5] || 'haruldase'} kala: <b style="color:${RAR2[d.rarity || 5][1]}">${esc(fn)}</b>${w}!`;
    case 'giant': return `${who} püüdis rekordsuure kala: <b>${esc(fn)}</b>${w}!`;
    case 'chest': return `${who} leidis kuldse aardekirstu ja ${fmt(d.gold || 0)} kulda!`;
    case 'comp': return `${who} võitis võistluse „${COMPN[d.comp] ? COMPN[d.comp][0] : d.comp}“!`;
    case 'level': return `${who} jõudis kalapüügi ${d.level}. tasemele!`;
    case 'house': return `${who} täiendas kalamaja: nüüd on tal ${esc(d.name || '')} (tase ${d.level})!`;
  }
  return who;
}
const NEWS_IC = { house: '🏠', first: '📖', catch: '✨', giant: '🐋', chest: '👑', comp: '🏆', level: '⭐' };
function newsAgo(at) { const m = Math.floor((Date.now() - new Date(at)) / 60000); if (m < 1) return 'just nüüd'; if (m < 60) return m + ' min tagasi'; const h = Math.floor(m / 60); if (h < 24) return h + ' h tagasi'; return new Date(at).toLocaleDateString('et-EE', { day: 'numeric', month: 'long' }) }
function newsHtml(max) {
  if (!NEWS.list) return '<p class="lead">Laadin uudiseid…</p>';
  if (!NEWS.list.length) return '<p class="lead">Uudiseid veel pole. Püüa midagi erakordset ja sinust räägib kogu kuningriik!</p>';
  return `<div class="news">${NEWS.list.slice(0, max || 40).map(n => `<div class="newsi ${n.me ? 'me' : ''}"><span class="ni">${NEWS_IC[n.kind] || '📣'}</span><div><div>${newsText(n)}</div><small class="lead">${newsAgo(n.at)}</small></div></div>`).join('')}</div>`;
}
function tabUudised() {
  if (NEWS.unread) { NEWS.unread = 0; NEWS.seen = NEWS.last; try { localStorage.setItem('mk.newsSeen', NEWS.seen) } catch (e) { } setTimeout(() => renderFV(), 0) }
  return `<div class="fv-card"><h2>Kuningriigi uudised</h2><p class="lead">Siin kuulutatakse välja kõigi mängijate erakordsed püügid: esimesed haruldased liigid, legendaarsed kalad, kuldsed kirstud ja võistluste võitjad.</p>${newsHtml()}</div>`;
}
async function loadNews(silent) {
  if (!CL.user) return;
  try {
    if (!FD.loaded) await loadFD();
    const fresh = await rpc('kingdom_news', { p_after: 0 });
    const first = NEWS.list === null; NEWS.at = Date.now();
    const newer = fresh.filter(n => n.id > NEWS.last);
    NEWS.list = fresh; if (fresh.length) NEWS.last = Math.max(NEWS.last, fresh[0].id);
    NEWS.unread = fresh.filter(n => n.id > NEWS.seen && !n.me).length;
    if (!first && silent) newer.filter(n => !n.me).slice(0, 2).forEach(n => toast('Kuningriigi uudis: ' + newsText(n).replace(/<[^>]+>/g, ''), 'gold', 'fish'));
    if (FV.open) renderFV(); else if (typeof renderPanel === 'function' && S && UI.tab === 'edetabel') renderPanel(true);
  } catch (e) { }
}
setInterval(() => { if (CL.user && running && !['waiting', 'bite', 'reel', 'landing', 'hooking'].includes(FV.phase)) loadNews(true) }, 45000);

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

/* ---------- Kalamaja ja akvaarium ---------- */
const aqCv = document.createElement('canvas'); aqCv.id = 'fvAq'; aqCv.setAttribute('aria-label', 'Akvaarium'); aqCv.style.cssText = 'width:100%;display:block;border-radius:12px';
const AQ = { list: null, visit: null, fish: [] };
function aqScore(f) { return f.rarity * f.rarity * 2 + (f.giant ? 10 : 0) }
function houseRow(l) { return FD.house[l] }
function drawHouse(c, w, h, lvl, t = 0) {
  const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#2c5a72'); sky.addColorStop(.62, '#7fb0c0'); sky.addColorStop(.62, '#2f6a86'); sky.addColorStop(1, '#173a4c');
  c.fillStyle = sky; c.fillRect(0, 0, w, h);
  const wy = h * .62;
  ell(c, w * .5, wy + 2, w * .55, h * .1, '#3f6e3a'); rect(c, 0, wy - h * .05, w, h * .07, '#4a7a3a');
  for (let i = 0; i < 5; i++) { const x = w * (.08 + i * .22), s = h * (.18 + (i % 2) * .06); poly(c, [x - s * .35, wy - h * .03, x, wy - h * .03 - s, x + s * .35, wy - h * .03], i % 2 ? '#2f5a34' : '#295030') }
  if (!lvl) {
    const x = w * .5, y = wy - h * .04;
    rect(c, x - 2, y - h * .2, 4, h * .2, '#6b4528'); rect(c, x - w * .1, y - h * .26, w * .2, h * .09, '#c8955a');
    c.fillStyle = '#3a2410'; c.font = `700 ${Math.max(10, h * .055)}px system-ui`; c.textAlign = 'center'; c.fillText('Ehitusplats', x, y - h * .2);
    return;
  }
  const big = Math.min(1, .45 + lvl * .055), bw = w * .34 * big, floors = 1 + (lvl >= 5) + (lvl >= 9), fh = h * .13, x0 = w * .5 - bw / 2, base = wy - h * .03;
  const wall = lvl >= 9 ? '#cfe6ee' : lvl >= 6 ? '#e8d8b8' : lvl >= 3 ? '#b8875a' : '#9a6a42', roof = lvl >= 8 ? '#e0a830' : lvl >= 6 ? '#8a3a2a' : lvl >= 3 ? '#5a3a24' : '#6a5a3a';
  if (lvl >= 4) { rect(c, w * .5 + bw * .2, base - 2, w * .3, h * .03, '#7a5434'); for (let i = 0; i < 4; i++) rect(c, w * .5 + bw * .25 + i * w * .07, base, 3, h * .1, '#5a3a24') }
  if (lvl >= 7) { const bx = w * .82 + Math.sin(t) * 3, by = wy + h * .05; poly(c, [bx - 22, by, bx + 22, by, bx + 14, by + 10, bx - 14, by + 10], '#8a5a34'); rect(c, bx - 1, by - 26, 2, 26, '#5a3a24'); poly(c, [bx + 1, by - 25, bx + 16, by - 6, bx + 1, by - 6], '#f0e8d8') }
  if (lvl >= 2) rect(c, x0 - bw * .38, base - fh * .7, bw * .34, fh * .7, '#7a5a3a');
  for (let f = 0; f < floors; f++) {
    const y = base - fh * (f + 1); rect(c, x0, y, bw, fh, wall);
    for (let i = 0; i < 3; i++) { const wx = x0 + bw * (.15 + i * .3); rect(c, wx, y + fh * .28, bw * .12, fh * .38, lvl >= 9 ? '#9ad8f0' : '#ffd890'); rect(c, wx, y + fh * .45, bw * .12, 2, wall) }
  }
  if (floors === 1) rect(c, x0 + bw * .44, base - fh * .62, bw * .12, fh * .62, '#4a2e1a');
  const top = base - fh * floors;
  if (lvl >= 10) { ell(c, w * .5, top, bw * .32, fh * .9, roof); rect(c, w * .5 - 1, top - fh * 1.3, 2, fh * .5, '#c89020'); circ(c, w * .5, top - fh * 1.3, 4, '#ffe080') }
  else poly(c, [x0 - bw * .08, top, w * .5, top - fh * (.9 + lvl * .03), x0 + bw * 1.08, top], roof);
  if (lvl >= 9) for (const s of [-1, 1]) { const tx = w * .5 + s * bw * .62; rect(c, tx - bw * .08, base - fh * (floors + .4), bw * .16, fh * (floors + .4), wall); poly(c, [tx - bw * .1, base - fh * (floors + .4), tx, base - fh * (floors + 1.1), tx + bw * .1, base - fh * (floors + .4)], roof) }
  if (lvl >= 3) { rect(c, x0 + bw * .72, top - fh * .55, bw * .08, fh * .4, '#5a4a3a'); for (let i = 0; i < 3; i++) { const p = (t * .4 + i / 3) % 1; circ(c, x0 + bw * .76 + Math.sin(p * 6 + i) * 4, top - fh * .6 - p * h * .25, 3 + p * 6, `rgba(230,236,240,${.5 * (1 - p)})`) } }
  if (lvl >= 6) { const fx = x0 + bw * .1, fy = top - fh * .2; rect(c, fx, fy - h * .14, 2, h * .14, '#3a2a1a'); poly(c, [fx + 2, fy - h * .14, fx + 18 + Math.sin(t * 4) * 2, fy - h * .12, fx + 2, fy - h * .1], lvl >= 8 ? '#3a6ad0' : '#c84a3a') }
  for (let i = 0; i < 6; i++) { const p = (t * .15 + i / 6) % 1; rect(c, w * p, wy + h * .04 + (i % 3) * h * .07, w * .05, 1.5, 'rgba(255,255,255,.18)') }
}
function drawAquarium(t) {
  const w = aqCv.clientWidth || 600, hgt = Math.round(Math.min(300, Math.max(190, w * .4))), d = Math.min(2, devicePixelRatio || 1);
  if (aqCv.width !== Math.round(w * d) || aqCv.height !== Math.round(hgt * d)) { aqCv.width = Math.round(w * d); aqCv.height = Math.round(hgt * d); aqCv.style.height = hgt + 'px' }
  const c = aqCv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); const h = hgt;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3a8aa8'); g.addColorStop(1, '#0f3446'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); const x = w * (.1 + i * .25) + Math.sin(t * .5 + i) * 20; c.moveTo(x, 0); c.lineTo(x + 40, 0); c.lineTo(x + 90, h); c.lineTo(x + 30, h); c.fill() }
  ell(c, w * .5, h + 6, w * .7, h * .14, '#c8b07a'); ell(c, w * .2, h, w * .2, h * .08, '#b09a68');
  for (let i = 0; i < 7; i++) { const x = w * (.06 + i * .15), hh = h * (.25 + (i % 3) * .1); c.strokeStyle = i % 2 ? '#3a8a4a' : '#2a6a3a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x + Math.sin(t + i) * 12, h - hh / 2, x + Math.sin(t * 1.3 + i) * 8, h - hh); c.stroke() }
  ell(c, w * .78, h - 10, 22, 12, '#7a8a8a'); ell(c, w * .72, h - 6, 14, 8, '#8a9a9a');
  const F = AQ.fish;
  if (!F.length) { c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '600 14px system-ui'; c.textAlign = 'center'; c.fillText('Akvaarium on tühi', w / 2, h / 2) }
  F.forEach((f, i) => {
    const sp = FD.sp[f.species]; if (!sp) return;
    const L = Math.min(w * .2, Math.max(44, w * .085) * (1 + f.rarity * .12) * (f.giant ? 1.12 : 1) / Math.max(.7, fishFit(sp.look) / .26)), lane = h * (.18 + ((i * .37) % .62)), spd = .25 + ((i * 17) % 10) / 40, ph = i * 1.7;
    const x = w / 2 + Math.sin(t * spd + ph) * (w / 2 - L * .7), dir = Math.cos(t * spd + ph) >= 0 ? -1 : 1, y = lane + Math.sin(t * 1.3 + i) * 6;
    drawLook(c, x, y, L, sp.look, t + i, dir);
  });
  for (let i = 0; i < 10; i++) { const p = (t * .25 + i / 10) % 1; circ(c, w * (.15 + (i * .37) % .7) + Math.sin(p * 8 + i) * 4, h - p * h, 1.5 + (i % 3), 'rgba(255,255,255,.35)') }
  c.strokeStyle = 'rgba(200,230,240,.35)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
}
function paintHouses(root) {
  root.querySelectorAll('canvas[data-house]').forEach(cv2 => { const w = cv2.clientWidth || 300, h = cv2.clientHeight || 170, d = 2; cv2.width = w * d; cv2.height = h * d; const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); drawHouse(c, w, h, +cv2.dataset.house, 1) });
}
function bonusTxt(hr) { return hr ? `müük +${Math.round(hr.sell_bonus * 100)}% · kogemus +${Math.round(hr.xp_bonus * 100)}% · sööta säästab ${Math.round(hr.bait_save * 100)}% · akvaariumis ${hr.slots} kohta` : 'boonuseid pole' }
function tabMaja() {
  if (AQ.visit) return visitHtml();
  const L = FS.house || 0, cur = houseRow(L), nx = houseRow(L + 1);
  let h = `<div class="fv-card"><h2>${cur ? esc(cur.name) : 'Sinu kalamaja'} <small class="lead">${L ? `tase ${L} / 10` : 'veel ehitamata'}</small></h2>
    <canvas data-house="${L}" class="housecv"></canvas>
    <p class="lead">${cur ? esc(cur.descr) + ' ' : 'Ehita kalamaja, et saada püsivaid boonuseid ja oma akvaarium. '}Praegu: <b>${bonusTxt(cur)}</b>.</p>`;
  if (nx) {
    const items = Object.entries(nx.items || {}), lvlOk = FS.level >= nx.min_fish_level, goldOk = FS.gold >= nx.gold, itOk = items.every(([k, q]) => ((FS.items || {})[k] || 0) >= q);
    h += `<div class="srow"><div><b>${L ? 'Täienda' : 'Ehita'}: ${esc(nx.name)}</b><small>Annab: ${bonusTxt(nx)}</small>
      <small><span style="color:${lvlOk ? 'var(--ok)' : 'var(--bad)'}">kalapüügi tase ${nx.min_fish_level}</span> · <span style="color:${goldOk ? 'var(--ok)' : 'var(--bad)'}">${fmt(nx.gold)} kulda</span>${items.map(([k, q]) => { const have = (FS.items || {})[k] || 0; return ` · <span style="color:${have >= q ? 'var(--ok)' : 'var(--bad)'}">${itemName(k)} ${Math.min(have, q)}/${q}</span>` }).join('')}</small></div>
      <button class="btn" type="button" data-fa="house" ${lvlOk && goldOk && itOk ? '' : 'disabled'}>${L ? 'Täienda' : 'Ehita'}</button></div>`;
  } else h += '<p class="lead"><b>Sinu kalamaja on kõige kõrgemal tasemel!</b></p>';
  h += '</div>';
  if (L) {
    const aq = FS.aquarium || [], slots = cur.slots, perDay = (FS.aq_score || 0) * 3;
    AQ.fish = aq;
    h += `<div class="fv-card"><h2>Akvaarium <small class="lead">${aq.length} / ${slots}</small></h2><div id="fvAqSlot"></div>
      <p class="lead">Ilu <b>${FS.aq_score || 0}</b> · külastajad toovad <b>${fmt(perDay)} kulda päevas</b> (kogub kuni 2 päeva) · imetlusi ${FS.aq_likes || 0}. Haruldased ja rekordsuured kalad on ilusamad. Akvaariumis olevat kala ei saa müüa.</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><button class="btn sm" type="button" data-fa="aqcollect" ${FS.aq_pending > 0 ? '' : 'disabled'}>Korja ${fmt(FS.aq_pending || 0)} kulda</button></div>
      ${aq.length ? `<div class="inv">${aq.map(f => { const s = FD.sp[f.species] || { name: f.species }, [rn, rc] = RAR2[f.rarity]; return `<div class="fcell" data-fa="aqtake" data-arg="${f.id}" role="button" tabindex="0" title="Võta akvaariumist välja" style="border-color:${rc}44"><canvas data-fl="${f.species}" data-r="${f.rarity}"></canvas><b>${esc(s.name)}</b><small style="color:${rc}">${rn} · ilu ${aqScore(f)}</small><small>${fmt1(+f.weight)} kg · võta välja</small></div>` }).join('')}</div>` : ''}`;
    const cand = (FS.inventory || []).slice().sort((a, b) => aqScore(b) - aqScore(a) || b.weight - a.weight).slice(0, 12);
    h += aq.length < slots ? `<div class="sec-h">Lisa akvaariumi <small>sinu ilusaimad kalad</small></div>${cand.length ? `<div class="inv">${cand.map(f => { const s = FD.sp[f.species] || { name: f.species }, [rn, rc] = RAR2[f.rarity]; return `<div class="fcell" data-fa="aqput" data-arg="${f.id}" role="button" tabindex="0" style="border-color:${rc}44">${f.trophy ? '<span class="tro">Trofee</span>' : ''}<canvas data-fl="${f.species}" data-r="${f.rarity}"></canvas><b>${esc(s.name)}</b><small style="color:${rc}">${rn} · ilu ${aqScore(f)}</small><small>${fmt1(+f.weight)} kg · pane sisse</small></div>` }).join('')}</div>` : '<p class="lead">Saak on tühi. Püüa kalu, et neid akvaariumi panna.</p>'}` : '<p class="lead">Akvaarium on täis. Täienda kalamaja, et saada rohkem kohti, või võta mõni kala välja.</p>';
    h += '</div>';
  }
  h += `<div class="fv-card"><h2>Teiste mängijate akvaariumid</h2><p class="lead">Külasta teisi kalureid ja imetle nende akvaariumi. Iga imetlus toob omanikule 15 kulda (üks kord päevas iga akvaariumi kohta).</p>`;
  if (!AQ.list) { h += '<p class="lead">Laadin…</p>'; loadAqList() }
  else if (!AQ.list.filter(a => !a.me).length) h += '<p class="lead">Teistel mängijatel pole veel akvaariumi. Ole esimene!</p>';
  else h += `<table class="ctable"><thead><tr><th>#</th><th>Kalur</th><th>Ilu</th><th></th></tr></thead><tbody>${AQ.list.map((a, i) => `<tr class="${a.me ? 'me' : ''}"><td>${i + 1}</td><td><b>${esc(a.name)}</b><br><small class="lead">${houseRow(a.house) ? esc(houseRow(a.house).name) : ''} · ${a.n} kala · ${a.likes} imetlust</small></td><td class="n">${a.score}</td><td>${a.me ? '<small class="lead">sina</small>' : `<button class="btn sm ghost" type="button" data-fa="aqvisit" data-arg="${a.id}">Külasta</button>`}</td></tr>`).join('')}</tbody></table>`;
  return h + '</div>';
}
function visitHtml() {
  const v = AQ.visit; AQ.fish = v.fish;
  return `<div class="fv-card"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn ghost sm" type="button" data-fa="aqback">← Tagasi</button><h2 style="margin:0">Akvaarium: ${esc(v.name)}</h2></div>
    <p class="lead">${v.title ? esc(v.title) + ' · ' : ''}kalapüügi tase ${v.level} · ${esc(v.house_name || '')} · ilu ${v.score} · ${v.likes} imetlust</p>
    <canvas data-house="${v.house}" class="housecv"></canvas>
    <div id="fvAqSlot"></div>
    ${v.fish.length ? `<div class="inv">${v.fish.map(f => { const s = FD.sp[f.species] || { name: f.species }, [rn, rc] = RAR2[f.rarity]; return `<div class="fcell" style="border-color:${rc}44"><canvas data-fl="${f.species}" data-r="${f.rarity}"></canvas><b>${esc(s.name)}</b><small style="color:${rc}">${rn}${f.giant ? ' · rekordsuurus' : ''}</small><small>${fmt1(+f.weight)} kg</small></div>` }).join('')}</div>` : '<p class="lead">Akvaarium on veel tühi.</p>'}
    <div><button class="btn" type="button" data-fa="aqlike" data-arg="${v.user}" ${v.liked || v.me ? 'disabled' : ''}>${v.liked ? 'Imetlesid täna ✓' : '❤ Imetle (+15 kulda omanikule)'}</button></div></div>`;
}
async function loadAqList() { if (AQ.loading) return; AQ.loading = true; try { AQ.list = await rpc('fish_aquariums') } catch (e) { AQ.list = [] } AQ.loading = false; if (FV.open && FV.tab === 'maja') renderFV() }
async function aqCall(fn, args, okMsg) {
  if (FV.busy) return; FV.busy = true;
  try { const r = await rpc(fn, args); if (okMsg) toast(okMsg(r), 'good', 'fish'); await refreshFS(); AQ.list = null; afterAch(r.ach); FV.busy = false; return r } catch (e) { toast(e.message, 'bad') }
  FV.busy = false;
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
    case 'tab': FV.tab = arg; if (arg === 'maja') { AQ.visit = null; AQ.list = null } renderFV(true); if (arg === 'voistlus' || arg === 'tellimus' || arg === 'uudised') loadSide(); break;
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
    case 'house': { const r = await aqCall('fish_house_upgrade', {}, r => `Valmis: ${r.name}! Kalamaja tase ${r.level}.`); renderFV(true); break }
    case 'aqput': { const r = await aqCall('fish_aquarium_put', { p_catch: +arg }, () => 'Kala ujub nüüd sinu akvaariumis.'); if (r && FV.tab === 'puuk') FV.result = null; renderFV(true); break }
    case 'aqputSel': { const id = [...FV.sel][0]; if (!id) break; const r = await aqCall('fish_aquarium_put', { p_catch: id }, () => 'Kala ujub nüüd sinu akvaariumis.'); if (r) FV.sel.delete(id); renderFV(true); break }
    case 'aqtake': await aqCall('fish_aquarium_take', { p_catch: +arg }, () => 'Kala on tagasi saagis.'); renderFV(true); break;
    case 'aqcollect': await aqCall('fish_aquarium_collect', {}, r => `Akvaariumi külastajad tõid ${fmt(r.gold)} kulda!`); renderFV(true); break;
    case 'aqvisit': if (FV.busy) return; FV.busy = true; try { AQ.visit = await rpc('fish_aquarium_view', { p_user: arg }) } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); $('#fishView').scrollTop = 0; break;
    case 'aqback': AQ.visit = null; renderFV(true); break;
    case 'aqlike': if (FV.busy) return; FV.busy = true; try { await rpc('fish_aquarium_like', { p_user: arg }); toast('Imetlesid akvaariumi! Omanik sai 15 kulda.', 'good', 'fish'); AQ.visit = await rpc('fish_aquarium_view', { p_user: arg }); AQ.list = null } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); break;
    case 'qclaim': { if (FV.busy) return; FV.busy = true; const [per, idx] = arg.split(':'); try { const r = await rpc('fish_quest_claim', { p_period: per, p_idx: +idx }); toast(`Ülesanne täidetud! +${fmt(r.gold)} kulda, +${fmt(r.xp)} kogemust${itemsTxt(r.items, false).replace(' ning kotti:', ', kotti:')}`, 'gold', 'fish'); await refreshFS(); FV.quests = await rpc('fish_quests'); afterLevels(r.levels); afterAch(r.ach) } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); break }
    case 'isell': { if (FV.busy) return; FV.busy = true; const [it, q] = arg.split(':'); try { const r = await rpc('fish_item_sell', { p_item: it, p_qty: +q }); toast(`Müüsid ${itemName(it)} × ${r.qty} ja said ${fmt(r.gold)} kulda.`, 'good', 'gold'); await refreshFS() } catch (er) { toast(er.message, 'bad') } FV.busy = false; renderFV(true); break }
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
