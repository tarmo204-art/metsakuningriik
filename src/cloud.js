/* ================= CLOUD: KONTOD, PILVESALVESTUS, EDETABEL ================= */
const SUPA_URL = window.MK_SUPA_URL || 'https://marevpuolbeblrpwclms.supabase.co';
const SUPA_KEY = window.MK_SUPA_KEY || 'sb_publishable_4ZpBQe3T4AccPQGgnJqgxw_rWqF3q29';
const GUEST_KEY = 'metsakuningriik.v1';
const CL = { sb: null, user: null, guest: false, mode: 'login', busy: false, msg: '', msgKind: '', lastCloud: 0, saving: false, pending: false, presence: null, peers: [], lb: null, lbAt: 0, recovery: false };

try { CL.sb = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) } catch (e) { CL.sb = null }

const ERR_ET = [
  [/invalid login credentials/i, 'Vale e-post või parool.'],
  [/user already registered|already been registered/i, 'Selle e-postiga konto on juba olemas. Logi sisse.'],
  [/password should be at least|password.*(short|length)/i, 'Parool peab olema vähemalt 6 tähemärki pikk.'],
  [/email not confirmed/i, 'Kinnita esmalt oma e-post. Vaata postkasti (ka rämpsposti kausta).'],
  [/rate limit|too many/i, 'Liiga palju katseid järjest. Oota natuke ja proovi uuesti.'],
  [/invalid.*email|email.*invalid|unable to validate email/i, 'E-posti aadress ei sobi. Kontrolli, kas see on õigesti kirjutatud.'],
  [/failed to fetch|network/i, 'Serveriga ei saanud ühendust. Kontrolli internetiühendust.'],
  [/jwt|not authenticated|logi sisse/i, 'Sessioon aegus. Palun logi uuesti sisse.'],
];
function etError(e) { const m = (e && (e.message || e.error_description || e.msg)) || String(e || ''); for (const [re, t] of ERR_ET) if (re.test(m)) return t; return m || 'Midagi läks valesti.' }
async function rpc(fn, args) {
  if (!CL.sb || !CL.user) throw new Error('Palun logi sisse');
  const { data, error } = await CL.sb.rpc(fn, args || {});
  if (error) throw new Error(etError(error));
  return data;
}

/* ---------- stiilid ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.auth{display:grid;gap:10px}
.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:12px;background:rgba(0,0,0,.28)}
.auth-tabs button{border:0;background:transparent;color:var(--muted);border-radius:9px;padding:8px;font-weight:700}
.auth-tabs button.on{background:var(--fern);color:var(--birch)}
.auth form{display:grid;gap:10px;margin:0}
.authmsg{font-size:13.5px;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.25)}
.authmsg.bad{color:var(--bad)} .authmsg.good{color:var(--ok)}
.linkbtn{border:0;background:none;color:var(--lichen);text-decoration:underline;padding:2px;font-size:13px;justify-self:start}
.who-box{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--lichen);padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.22)}
.who-box b{color:var(--birch);word-break:break-all}
.importbox{width:100%;min-height:110px;font:12px ui-monospace,monospace;background:rgba(0,0,0,.3);color:var(--birch);border:1px solid var(--line);border-radius:10px;padding:8px}
.cloudstate{font-size:12px;color:var(--faint)}
</style>`);

/* ---------- avaleht ---------- */
$('#contBox').insertAdjacentHTML('beforebegin', '<div class="auth" id="authBox"></div>');
function renderAuth() {
  const box = $('#authBox');
  const msg = CL.msg ? `<div class="authmsg ${CL.msgKind}">${esc(CL.msg)}</div>` : '';
  if (!CL.sb) { box.innerHTML = '<div class="authmsg bad">Serveriga ühendamine ei õnnestunud. Saad mängida ilma kontota.</div>'; return }
  if (CL.user) {
    box.innerHTML = `<div class="who-box"><span>Sisse logitud: <b>${esc(CL.user.email || '')}</b></span><button class="linkbtn" type="button" data-cl="logout">Logi välja</button></div>${msg}
      <button class="linkbtn" type="button" data-cl="import">Too kuningriik claude.ai mängust</button>`;
    return;
  }
  if (CL.guest) {
    box.innerHTML = `<div class="who-box"><span>Mängid ilma kontota. Areng salvestub ainult selles brauseris ja kalapüük pole saadaval.</span><button class="linkbtn" type="button" data-cl="toLogin">Logi sisse</button></div>${msg}`;
    return;
  }
  const reg = CL.mode === 'register', forgot = CL.mode === 'forgot';
  box.innerHTML = `${forgot ? '' : `<div class="auth-tabs"><button type="button" class="${reg ? '' : 'on'}" data-cl="mode" data-arg="login">Logi sisse</button><button type="button" class="${reg ? 'on' : ''}" data-cl="mode" data-arg="register">Loo konto</button></div>`}
    <form id="authForm" autocomplete="on">
      <div class="field"><label for="authEmail">E-post</label><input id="authEmail" type="email" autocomplete="email" required></div>
      ${forgot ? '' : `<div class="field"><label for="authPass">Parool</label><input id="authPass" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required></div>`}
      ${reg ? `<div class="field"><label for="authName">Valitseja nimi</label><input id="authName" maxlength="20" placeholder="nt Metsaema Liis" required></div>
        <div class="field"><label for="authKingdom">Kuningriigi nimi</label><input id="authKingdom" maxlength="24" placeholder="nt Sõnajalgade kuningriik"></div>` : ''}
      <button class="btn wide" type="submit" ${CL.busy ? 'disabled' : ''}>${CL.busy ? 'Oota…' : forgot ? 'Saada parooli taastamise link' : reg ? 'Loo konto ja alusta' : 'Logi sisse'}</button>
    </form>${msg}
    <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
      ${forgot ? '<button class="linkbtn" type="button" data-cl="mode" data-arg="login">Tagasi sisselogimisse</button>' : '<button class="linkbtn" type="button" data-cl="mode" data-arg="forgot">Unustasid parooli?</button>'}
      <button class="linkbtn" type="button" data-cl="guest">Mängi ilma kontota</button></div>`;
  $('#authForm').addEventListener('submit', onAuthSubmit);
}
const _showStart = showStart;
showStart = function () {
  _showStart();
  renderAuth();
  const allow = !!CL.user || CL.guest || !CL.sb;
  if (!allow) { $('#contBox').hidden = true; $('#newDivider').hidden = true; $('#newForm').hidden = true }
  else $('#newForm').hidden = false;
};
async function onAuthSubmit(e) {
  e.preventDefault(); if (CL.busy) return;
  const email = $('#authEmail').value.trim(), pass = $('#authPass') ? $('#authPass').value : '';
  const regName = $('#authName') ? $('#authName').value.trim() : '', regKingdom = $('#authKingdom') ? $('#authKingdom').value.trim() : '';
  CL.busy = true; CL.msg = ''; renderAuth(); $('#authEmail').value = email;
  try {
    if (CL.mode === 'forgot') {
      const { error } = await CL.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      if (error) throw error;
      CL.msg = 'Saatsime sulle e-kirja parooli taastamise lingiga.'; CL.msgKind = 'good'; CL.mode = 'login';
    } else if (CL.mode === 'register') {
      const name = regName || 'Valitseja', kingdom = regKingdom || name + ' kuningriik';
      const { data, error } = await CL.sb.auth.signUp({ email, password: pass, options: { data: { name, kingdom }, emailRedirectTo: location.origin + location.pathname } });
      if (error) throw error;
      CL.pendingNew = { name, kingdom };
      if (!data.session) { CL.msg = 'Konto on loodud! Kinnita see e-kirjas oleva lingiga ja logi siis sisse.'; CL.msgKind = 'good'; CL.mode = 'login' }
    } else {
      const { error } = await CL.sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
    }
  } catch (err) { CL.msg = etError(err); CL.msgKind = 'bad' }
  CL.busy = false;
  if (!CL.user) { renderAuth(); if ($('#authEmail')) $('#authEmail').value = email }
}
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-cl]'); if (!el) return;
  const a = el.dataset.cl;
  if (a === 'mode') { CL.mode = el.dataset.arg; CL.msg = ''; renderAuth() }
  else if (a === 'guest') { CL.guest = true; CL.msg = ''; SAVE_KEY = GUEST_KEY; showStart() }
  else if (a === 'toLogin') { CL.guest = false; CL.mode = 'login'; showStart() }
  else if (a === 'logout') {
    try { if (S) save(); await cloudSave(true) } catch (e2) { }
    try { await CL.sb.auth.signOut({ scope: 'local' }) } catch (e2) { }
    onSignedOut(true);
  }
  else if (a === 'import') showImport();
  else if (a === 'doImport') doImport();
  else if (a === 'setPass') setNewPassword();
});

/* ---------- sessioon ---------- */
async function onSignedIn(user) {
  const first = !CL.user || CL.user.id !== user.id;
  CL.user = user; CL.guest = false; CL.msg = '';
  if (!first) return;
  clientReset(); S = null; running = false;
  SAVE_KEY = 'metsakuningriik.v1.u.' + user.id;
  await pullCloud();
  const meta = user.user_metadata || {};
  if (CL.pendingNew || (!loadSave() && meta.name)) {
    const pn = CL.pendingNew || { name: meta.name, kingdom: meta.kingdom || meta.name + ' kuningriik' };
    CL.pendingNew = null;
    if (!loadSave()) { $('#playerName').value = pn.name; $('#kingdomName').value = pn.kingdom }
  }
  if (!S) showStart();
  startPresence();
}
// kõik eelmise mängija mälus olevad andmed maha (sama arvuti, teine kasutaja)
function clientReset() {
  try { $('#playerName').value = ''; $('#kingdomName').value = '' } catch (e) { }
  CL.cloudCopy = null; CL.cloudUid = null; CL.trust = null; CL.lb = null; CL.lbAt = 0; CL.peers = []; CL.pending = false;
  try { if (typeof FS !== 'undefined') FS = null } catch (e) { }
  try { if (typeof FMK !== 'undefined') Object.assign(FMK, { list: null, mine: null, newSold: 0, confirm: null }) } catch (e) { }
  try { if (typeof KT !== 'undefined') Object.assign(KT, { d: null, at: 0, wasActive: null }) } catch (e) { }
  try { if (typeof NEWS !== 'undefined') Object.assign(NEWS, { list: null, at: 0, unread: 0 }) } catch (e) { }
  try { if (typeof AQ !== 'undefined') Object.assign(AQ, { list: null, visit: null }) } catch (e) { }
  try { if (typeof FV !== 'undefined') Object.assign(FV, { comps: null, orders: null, quests: null, sel: new Set(), result: null, cast: null, hook: null, phase: 'idle' }) } catch (e) { }
}
function onSignedOut(force) {
  const was = !!CL.user || force;
  CL.user = null; stopPresence(); clientReset();
  if (was) { running = false; S = null; closeModal(); if (typeof FV !== 'undefined') closeFishView(); SAVE_KEY = GUEST_KEY; CL.msg = 'Logisid välja.'; CL.msgKind = 'good' }
  showStart();
}
if (CL.sb) {
  CL.sb.auth.onAuthStateChange((ev, session) => {
    setTimeout(() => {
      if (ev === 'PASSWORD_RECOVERY') { CL.recovery = true; showPassModal() }
      if (session && session.user) onSignedIn(session.user); else if (ev === 'SIGNED_OUT' || !session) onSignedOut();
    }, 0);
  });
}
function showPassModal() {
  showModal(() => `<h2>Uus parool</h2><p>Sisesta oma kontole uus parool.</p><div class="field"><label for="newPass">Uus parool</label><input id="newPass" type="password" minlength="6" autocomplete="new-password"></div>
    <div class="mbtns"><button class="btn" type="button" data-cl="setPass">Salvesta parool</button></div>`);
}
async function setNewPassword() {
  const p = $('#newPass').value;
  const { error } = await CL.sb.auth.updateUser({ password: p });
  if (error) { toast(etError(error), 'bad'); return }
  CL.recovery = false; closeModal(); toast('Parool on muudetud.', 'good');
}

/* ---------- pilvesalvestus ---------- */
async function pullCloud() {
  try {
    const { data, error } = await CL.sb.from('saves').select('data, updated_at').eq('user_id', CL.user.id).maybeSingle();
    if (error) throw error;
    const local = loadSave();
    if (data && data.data && data.data.res && (!local || (data.data.last || 0) > (local.last || 0))) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data.data)) } catch (e) { }
      CL.cloudCopy = data.data; CL.cloudUid = CL.user.id;
    }
    CL.lastCloud = Date.now();
  } catch (e) { CL.msg = 'Pilvesalvestust ei saanud laadida: ' + etError(e); CL.msgKind = 'bad' }
}
const _loadSave = loadSave;
loadSave = function () {
  let v = _loadSave(); if (v && CL.user && v.uid && v.uid !== CL.user.id) v = null; // võõra konto salvestus: ära kasuta
  if (!v && CL.user && CL.cloudCopy && CL.cloudUid === CL.user.id) return JSON.parse(JSON.stringify(CL.cloudCopy)); return v
};
// iga kuningriik teab, kellele ta kuulub
setInterval(() => { if (S && CL.user && !S.uid && running) S.uid = CL.user.id }, 1000);
async function cloudSave(force) {
  if (!CL.sb || !CL.user || !S) return;
  if (!force && Date.now() - CL.lastCloud < 20000) { CL.pending = true; return }
  if (CL.saving) { CL.pending = true; return }
  CL.saving = true; CL.pending = false;
  try {
    if (S.uid && S.uid !== CL.user.id) { CL.saving = false; running = false; S = null; toast('Mäng peatati: see kuningriik kuulub teisele kontole. Logi uuesti sisse.', 'bad'); showStart(); return }
    if (!S.uid) S.uid = CL.user.id;
    CL.trust = await rpc('save_kingdom', { p_data: S });
    CL.lastCloud = Date.now(); CL.cloudCopy = null; CL.cloudOk = true;
  } catch (e) { CL.cloudOk = false; CL.cloudErr = etError(e) }
  CL.saving = false;
}
const _save = save;
save = function () { _save(); if (CL.user && S) cloudSave(false) };
setInterval(() => { if (CL.pending && CL.user && S && Date.now() - CL.lastCloud >= 20000) cloudSave(false) }, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden && CL.user && S) cloudSave(true) });
const _wipe = wipeSave;
wipeSave = function () { _wipe(); CL.cloudCopy = null; if (CL.sb && CL.user) CL.sb.from('saves').delete().eq('user_id', CL.user.id).then(() => { }) };

/* uue mängu ja jätkamise juures uuendame profiili */
const _doNewGame = doNewGame;
doNewGame = function () { _doNewGame(); if (CL.user) { rpc('set_profile', { p_name: S.name, p_kingdom: S.kingdom }).catch(() => { }); cloudSave(true) } };
$('#btnContinue').addEventListener('click', () => { if (CL.user && S) { rpc('set_profile', { p_name: S.name, p_kingdom: S.kingdom }).catch(() => { }); setTimeout(claimInbox, 1500) } });

/* ---------- kuningriigi postkast (preemiad kalapüügist) ---------- */
async function claimInbox() {
  if (!CL.user || !S) return;
  try {
    const items = await rpc('kingdom_claim');
    if (!items || !items.length) return;
    const tot = {}; const why = new Set();
    for (const it of items) { give(it.p); for (const k in it.p) tot[k] = (tot[k] || 0) + it.p[k]; why.add(it.why) }
    toast(`Kuningriik sai: ${rewardText(tot)} (${[...why].join(', ')})`, 'gold', tot.gold ? 'gold' : 'fame');
    RATES = computeRates(); hudUpdate(); save(); cloudSave(true);
  } catch (e) { }
}
setInterval(() => { if (running) claimInbox() }, 60000);

/* ---------- kolimine claude.ai mängust ---------- */
function showImport() {
  showModal(() => `<h2>Too kuningriik üle</h2><p>Ava claude.ai-s vana Metsakuningriik, mine vahekaardile „Kuningriik“ ja vajuta „Kopeeri kolimiskood“. Kleebi kood siia.</p>
    <textarea class="importbox" id="importCode" placeholder="MK2:…"></textarea>
    <p class="lead">Kalapüügi areng algab uues mängus otsast, sest seda hoiab nüüd server.</p>
    <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Loobu</button><button class="btn" type="button" data-cl="doImport">Too kuningriik üle</button></div>`);
}
const BADCODE = 'Kood on poolik või muutunud. Vajuta vanas mängus uuesti „Kopeeri kolimiskood“ ja kleebi see siia tervikuna, ilma midagi lisamata.';
async function decodeCode(t) {
  t = (t || '').replace(/\s+/g, '');
  const i = Math.max(t.indexOf('MK1:'), t.indexOf('MK2:'));
  if (i < 0) throw new Error('See ei ole Metsakuningriigi kolimiskood. Kood algab tähtedega MK1: või MK2:');
  const ver = t.slice(i, i + 3); t = t.slice(i + 4).replace(/[^A-Za-z0-9+/=]/g, '');
  let json;
  try {
    const bin = atob(t);
    if (ver === 'MK2') {
      const u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
      const st = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
      json = await new Response(st).text();
    } else json = decodeURIComponent(escape(bin));
  } catch (e) { throw new Error(BADCODE) }
  let o; try { o = JSON.parse(json) } catch (e) { throw new Error(BADCODE) }
  if (!o || !o.res || !o.regions || !o.st) throw new Error(BADCODE);
  return o;
}
async function doImport() {
  let o; try { o = await decodeCode($('#importCode').value) } catch (e) { toast(e.message || BADCODE, 'bad'); return }
  delete o.fish; o.last = Date.now();
  if (o.cave) o.cave = null;
  S = migrate(o); S.uid = CL.user ? CL.user.id : undefined; closeModal(); save(); cloudSave(true);
  if (CL.user) rpc('set_profile', { p_name: S.name, p_kingdom: S.kingdom }).catch(() => { });
  enterGame(); toast(`Tere tulemast tagasi, ${S.name}! ${S.kingdom} kolis edukalt.`, 'gold', 'fame');
}

/* ---------- praegu mängimas (Supabase Realtime) ---------- */
function presencePayload() {
  if (!S) return { k: null };
  return S.lbHidden ? { k: null } : { k: String(S.kingdom).slice(0, 24), r: String(S.name).slice(0, 20), l: S.level, f: Math.floor(S.fame), g: Object.keys(S.regions).length, v: REGIONS[S.view] ? REGIONS[S.view].n : '', fl: (S.fishCache && S.fishCache.level) || 0 };
}
function startPresence() {
  if (!CL.sb || !CL.user || CL.presence) return;
  try {
    const ch = CL.sb.channel('mangijad', { config: { presence: { key: CL.user.id } } });
    ch.on('presence', { event: 'sync' }, () => {
      const st = ch.presenceState(); const out = [];
      for (const key in st) { const p = st[key][0]; if (p && p.k) out.push({ ...p, uid: key, me: key === CL.user.id }) }
      CL.peers = out.sort((a, b) => (b.l || 0) - (a.l || 0) || (b.f || 0) - (a.f || 0));
    });
    ch.subscribe(st => { if (st === 'SUBSCRIBED') { CL.presenceOn = true; CL.lastPres = ''; trackPresence() } });
    CL.presence = ch;
  } catch (e) { }
}
function trackPresence() {
  if (!CL.presence || !CL.presenceOn) return;
  const p = presencePayload(), sig = JSON.stringify(p);
  if (sig === CL.lastPres) return; CL.lastPres = sig;
  CL.presence.track(p).catch(() => { });
}
function stopPresence() { if (CL.presence) { try { CL.sb.removeChannel(CL.presence) } catch (e) { } } CL.presence = null; CL.presenceOn = false; CL.peers = [] }
setInterval(trackPresence, 8000);

/* ---------- edetabel ---------- */
async function loadLb() {
  if (!CL.user || CL.lbLoading) return; CL.lbLoading = true;
  try { CL.lb = await rpc('kingdom_leaderboard'); CL.lbAt = Date.now(); CL.lbErr = '' } catch (e) { CL.lbErr = e.message }
  CL.lbLoading = false;
}
TABS.edetabel = { n: 'Edetabel', r: renderLbWeb };
{ const o = {}; for (const k in TABS) { if (k === 'kuningriik') o.edetabel = TABS.edetabel; if (k !== 'edetabel') o[k] = TABS[k] } for (const k in TABS) delete TABS[k]; Object.assign(TABS, o) }
function renderLbWeb() {
  let h = `<h2>Edetabel</h2><p class="lead">Kõik mängijad ühes tabelis. Järjestus on taseme ja seejärel kuulsuse järgi. Tabelis on ainult serveri kontrollitud numbrid.</p>`;
  if (!CL.user) return h + `<div class="card"><p class="lead">Edetabel on nähtav, kui oled sisse logitud.</p></div>`;
  if (Date.now() - CL.lbAt > 60000) loadLb();
  h += `<div class="sec-h">Praegu mängimas <small>${CL.peers.length} ${CL.peers.length === 1 ? 'mängija' : 'mängijat'}</small></div>`;
  if (!CL.peers.length) h += `<p class="lead">Kui sõbrad on samal ajal mängus, ilmuvad nad siia.</p>`;
  else {
    const byId = {}; (CL.lb || []).forEach(r => byId[r.id] = r);
    h += lbHtml({ who: 'Kuningriik', cols: ['Tase', 'Kuulsus', 'Alad'], main: 1, rows: CL.peers.map(p => { const v = byId[p.uid]; return { place: 0, live: true, name: p.k, sub: (p.r || '') + (p.v ? ' · ' + p.v : ''), me: p.me, vals: [v ? v.level : '–', v ? fmt(v.fame) : '–', v ? v.regions : '–'] } }) });
  }
  h += `<div class="sec-h">Kõigi aegade tabel</div>`;
  if (CL.lbErr) h += `<div class="card"><p class="lead">Edetabelit ei saanud laadida: ${esc(CL.lbErr)}</p></div>`;
  else if (!CL.lb) h += `<div class="card"><p class="lead">Laadin edetabelit…</p></div>`;
  else if (!CL.lb.length) h += `<div class="card"><p class="lead">Edetabel on veel tühi. Sinu kuningriik ilmub siia peagi.</p></div>`;
  else h += lbHtml({ who: 'Kuningriik', cols: ['Tase', 'Kuulsus', 'Alad', 'Aardeid'], main: 1, hideM: [2, 3], podium: true, rows: CL.lb.map((r, i) => ({ place: i + 1, name: r.kingdom, sub: 'Valitseja ' + r.name, me: r.me, vals: [r.level, fmt(r.fame), r.regions, r.treasures] })) });
  if (typeof newsHtml === 'function') { if (!NEWS.list || Date.now() - NEWS.at > 60000) { NEWS.at = Date.now(); loadNews() } h += `<div class="sec-h">Kuningriigi uudised <small>kalapüügi erakordsed hetked</small></div><div class="card fvnews">${newsHtml(8)}</div>` }
  h += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-act="lbHide">${S.lbHidden ? 'Näita mind edetabelis' : 'Peida mind edetabelist'}</button><span class="lead" style="font-size:12.5px">${S.lbHidden ? 'Sinu kuningriik on edetabelist peidetud.' : 'Teised näevad sinu kuningriigi ja valitseja nime.'}</span></div>`;
  return h;
}
ACT.lbHide = () => { S.lbHidden = !S.lbHidden; save(); rpc('set_profile', { p_name: S.name, p_kingdom: S.kingdom, p_hidden: !!S.lbHidden }).then(loadLb).catch(e => toast(e.message, 'bad')); CL.lastPres = ''; trackPresence() };

/* ---------- konto info kuningriigi vahekaardil ---------- */
{
  const base = TABS.kuningriik.r;
  TABS.kuningriik.r = () => {
    const h = base();
    const acc = CL.user
      ? `<div class="card"><div class="sec-h" style="margin:0">Konto</div><p class="lead">Sisse logitud: <b>${esc(CL.user.email || '')}</b>. Kuningriik salvestub serverisse ja jätkub igas seadmes.</p><p class="cloudstate">${CL.cloudOk === false ? 'Viimane pilvesalvestus ebaõnnestus: ' + esc(CL.cloudErr || '') : CL.lastCloud ? 'Pilve salvestatud ' + new Date(CL.lastCloud).toLocaleTimeString('et-EE') : ''}</p>
      ${CL.trust ? `<p class="lead" style="font-size:13px">Edetabelis kinnitatud: tase ${CL.trust.level}, kuulsus ${fmt(CL.trust.fame)}, ${CL.trust.regions} ala.${CL.trust.trusted ? '' : ' Server kontrollib veel sinu viimaseid edusamme. Sinu areng on salvestatud ja edetabel jõuab järele, kui kõik on korras.'}</p>` : ''}<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-cl="logout">Logi välja</button><button class="btn sm ghost" type="button" data-cl="import">Too kuningriik claude.ai mängust</button></div></div>`
      : `<div class="card"><div class="sec-h" style="margin:0">Konto</div><p class="lead">Mängid ilma kontota. Logi sisse, et kuningriik salvestuks serverisse ja et saaksid kalastada.</p></div>`;
    return h + acc;
  };
}
const _enterGame = enterGame;
enterGame = function () { _enterGame(); if (CL.user) { setTimeout(claimInbox, 1200); loadLb(); trackPresence() } };

/* käivitus */
(async () => {
  if (!CL.sb) { showStart(); return }
  try { const { data } = await CL.sb.auth.getSession(); if (data && data.session) await onSignedIn(data.session.user); else showStart() } catch (e) { showStart() }
})();
