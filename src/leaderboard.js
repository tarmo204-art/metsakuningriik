/* ================= SHARED LEADERBOARD ================= */
const LB = { db: null, uid: null, rows: [], state: 'loading', canWrite: null, readOnly: false, lastSig: '', writing: false, err: '' };
async function initLeaderboard() {
  try {
    if (!window.claude || !window.claude.use) { LB.state = 'off'; return }
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db) { LB.state = 'off'; return }
    LB.db = db;
    if (user) { LB.uid = await user.id(); LB.canWrite = await user.can('data.write') }
    const timer = setTimeout(() => { if (LB.state === 'loading') LB.state = 'slow' }, 10000);
    db.collection('leaderboard').orderBy('score', 'desc').limit(50).onSnapshot(snap => {
      clearTimeout(timer);
      LB.rows = snap.docs.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() }));
      LB.state = 'ok';
    }, e => { clearTimeout(timer); LB.state = 'error'; LB.err = (e && e.code) || '' });
    pushScore(true);
  } catch (e) { LB.state = 'off' }
}
const lbScore = () => S.level * 100000 + Math.floor(S.fame);
async function pushScore(force) {
  if (!S || !LB.db || !LB.uid || LB.canWrite === false || LB.readOnly || LB.writing) return;
  const ref = LB.db.doc('leaderboard/' + LB.uid);
  if (S.lbHidden) {
    if (LB.lastSig === 'hidden') return;
    LB.writing = true; try { await ref.delete(); LB.lastSig = 'hidden' } catch (e) { } finally { LB.writing = false } return;
  }
  const d = { kingdom: String(S.kingdom).slice(0, 24), ruler: String(S.name).slice(0, 20), level: S.level, fame: Math.floor(S.fame), regions: Object.keys(S.regions).length, buildings: S.buildings.length, tamed: S.st.tamedTotal, treasures: S.st.treasures || 0, deepest: S.st.deepest || 0, day: dayNum(), score: lbScore(), updated: Date.now() };
  const sig = [d.kingdom, d.ruler, d.level, d.fame, d.regions, d.buildings, d.tamed, d.treasures, d.deepest].join('|');
  if (sig === LB.lastSig && !force) return;
  LB.writing = true;
  try { await ref.set(d); LB.lastSig = sig }
  catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'permission_denied' || e.code === 'not_granted')) LB.readOnly = true }
  finally { LB.writing = false }
}
setInterval(() => { if (S && running) pushScore(false) }, 45000);

TABS.edetabel = { n: 'Edetabel', r: renderLbTab };
{ const o = {}; for (const k in TABS) { if (k === 'kuningriik') o.edetabel = TABS.edetabel; if (k !== 'edetabel') o[k] = TABS[k] } for (const k in TABS) delete TABS[k]; Object.assign(TABS, o) }
function renderLbTab() {
  let h = `<h2>Edetabel</h2><p class="lead">Kõik, kes mängivad sama lingi kaudu, näevad siin üksteise kuningriike. Järjestus on taseme ja seejärel kuulsuse järgi.</p>`;
  h += renderLiveSection();
  h += `<div class="sec-h">Kõigi aegade tabel</div>`;
  if (LB.state === 'off') return h + `<div class="card"><p class="lead">Edetabel töötab, kui mäng on avatud claude.ai lingi kaudu ja oled sisse logitud. Mäng ise töötab ka ilma selleta.</p></div>`;
  if (LB.state === 'loading' || LB.state === 'slow') return h + `<div class="card"><p class="lead">${LB.state === 'slow' ? 'Edetabel laadib aeglaselt. Proovi hiljem uuesti.' : 'Laadin edetabelit…'}</p></div>`;
  if (LB.state === 'error') return h + `<div class="card"><p class="lead">Edetabelit ei õnnestunud laadida${LB.err ? ' (' + esc(LB.err) + ')' : ''}. Mäng töötab edasi tavapäraselt.</p></div>`;
  if (LB.readOnly || LB.canWrite === false) h += `<div class="card qcard done"><div><h3>Sinu tulemust ei saa veel tabelisse lisada</h3><div class="rew">Sinu kuningriik on näha nimekirjas „Praegu mängimas“, kui mäng on lahti. Püsivasse tabelisse lisamiseks on vaja õigust „Contributor“ (kaastöötaja).</div></div></div>`;
  if (!LB.rows.length) h += `<div class="card"><p class="lead">Edetabel on veel tühi. Sinu kuningriik ilmub siia peagi.</p></div>`;
  else {
    h += `<div class="lbwrap"><table class="lb"><thead><tr><th>#</th><th>Kuningriik</th><th>Tase</th><th>Kuulsus</th><th title="Piirkondi">Alad</th><th title="Leitud aardeid">Aardeid</th></tr></thead><tbody>`;
    LB.rows.forEach((r, i) => {
      const me = r.id === LB.uid;
      h += `<tr class="${me ? 'me' : ''}"><td class="rk">${i < 3 ? `<span class="medal m${i + 1}">${i + 1}</span>` : i + 1}</td><td><b>${esc(r.kingdom || 'Nimetu riik')}</b><small>${esc(r.ruler || '')}${me ? ' · sina' : ''}</small></td><td class="num">${r.level | 0}</td><td class="num">${fmt(r.fame || 0)}</td><td class="num">${r.regions | 0}</td><td class="num">${r.treasures | 0}</td></tr>`;
    });
    h += `</tbody></table></div>`;
  }
  if (LIVE.on || (LB.uid && !LB.readOnly && LB.canWrite !== false)) h += `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-act="lbToggle">${S.lbHidden ? 'Näita mind edetabelis' : 'Peida mind edetabelist'}</button><span class="lead" style="font-size:12.5px">${S.lbHidden ? 'Sinu kuningriik on edetabelist peidetud.' : 'Tabelis näidatakse sinu kuningriigi ja valitseja nime.'}</span></div>`;
  return h;
}
ACT.lbToggle = () => { S.lbHidden = !S.lbHidden; LB.lastSig = ''; save(); pushScore(true); setLivePresence(true) };
initLeaderboard();

/* ---------- live "now playing" via room presence ---------- */
const LIVE = { room: null, peers: [], sig: '', on: false };
async function initLive() {
  try {
    if (!window.claude || !window.claude.use) return;
    const room = await window.claude.use('room'); if (!room) return;
    LIVE.room = room; LIVE.on = true;
    room.onPeers(ch => { LIVE.peers = ch.peers || [] }, () => { });
    setLivePresence(true);
  } catch (e) { }
}
function setLivePresence(force) {
  if (!LIVE.room || !S || !running) return;
  const p = S.lbHidden ? { k: null, r: null, l: null, f: null, g: null, t: null, v: null } :
    { k: String(S.kingdom).slice(0, 24), r: String(S.name).slice(0, 20), l: S.level, f: Math.floor(S.fame), g: Object.keys(S.regions).length, t: S.st.treasures || 0, v: REGIONS[S.view].n };
  const sig = JSON.stringify(p); if (sig === LIVE.sig && !force) return;
  LIVE.sig = sig; LIVE.room.presence(p).catch(() => { });
}
setInterval(() => setLivePresence(false), 4000);
function livePlayers() {
  const out = [], seenMe = new Set();
  for (const pe of LIVE.peers) {
    if (pe.kind !== 'viewer') continue;
    const p = pe.presence || {}; if (!p.k) continue;
    if (pe.isMe) { if (seenMe.size) continue; seenMe.add(1) }
    out.push({ me: pe.isMe, guest: pe.guest, k: String(p.k).slice(0, 24), r: String(p.r || '').slice(0, 20), l: Math.max(0, p.l | 0), f: Math.max(0, +p.f || 0), g: Math.max(0, p.g | 0), t: Math.max(0, p.t | 0), v: String(p.v || '').slice(0, 30) });
  }
  return out.sort((a, b) => b.l - a.l || b.f - a.f);
}
function renderLiveSection() {
  if (!LIVE.on) return '';
  const ps = livePlayers();
  let h = `<div class="sec-h">Praegu mängimas <small>${ps.length} ${ps.length === 1 ? 'mängija' : 'mängijat'}</small></div>`;
  if (!ps.length) return h + `<p class="lead">Kui sõbrad avavad mängu samal ajal, ilmuvad nad siia kohe.</p>`;
  h += `<div class="lbwrap"><table class="lb"><thead><tr><th></th><th>Kuningriik</th><th>Tase</th><th>Kuulsus</th><th>Alad</th></tr></thead><tbody>`;
  ps.forEach(p => { h += `<tr class="${p.me ? 'me' : ''}"><td class="rk"><span class="livedot"></span></td><td><b>${esc(p.k)}</b><small>${esc(p.r)}${p.me ? ' · sina' : ''}${p.v ? ' · ' + esc(p.v) : ''}</small></td><td class="num">${p.l}</td><td class="num">${fmt(p.f)}</td><td class="num">${p.g}</td></tr>` });
  return h + `</tbody></table></div>`;
}
initLive();
