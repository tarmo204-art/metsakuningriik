/* =====================================================================
   Kalurimaja ja Udulaht: vana kaluri Villemi maja udusel lahel. Taastad tuba-toa haaval
   (kuld kalurikassast, puit ja kivi kuningriigi laost), iga tuba annab kindla boonuse ja
   ühe lehe Villemi päevikust. Maja ümbruses saab puid raiuda, kive korjata ja marju noppida –
   saak läheb otse kuningriigi lattu (kuningriik ja kalapüük on üks majapidamine).
   Server: cabin_state, cabin_build, cabin_rush (schema 2v, 6u).
   ===================================================================== */
const CB = { d: null, loading: false, busy: false, raf: 0, parts: [], floats: [], nodes: null, lastHit: 0, hover: -1 };
FTABS.kalurimaja = '🏚 Kalurimaja';
FTAB_FN.kalurimaja = cbTab;

document.head.insertAdjacentHTML('beforeend', `<style>
.cb-scene{position:relative;border-radius:18px;overflow:hidden;border:1px solid rgba(200,220,210,.18);box-shadow:0 12px 30px rgba(0,0,0,.35)}
.cb-scene canvas{display:block;width:100%;height:340px;cursor:pointer;touch-action:manipulation}
.cb-scene .cap{position:absolute;left:14px;top:12px;display:grid;gap:2px;pointer-events:none}
.cb-scene .cap b{font-family:var(--f-display);font-weight:400;font-size:26px;color:#f4f0e6;text-shadow:0 2px 10px rgba(0,0,0,.55)}
.cb-scene .cap small{color:#e6eee8;text-shadow:0 1px 4px rgba(0,0,0,.7);font-weight:700}
.cb-res{position:absolute;right:12px;top:12px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;pointer-events:none}
.cb-res span{padding:5px 10px;border-radius:999px;background:rgba(10,20,18,.72);border:1px solid rgba(255,255,255,.14);color:#f2efe6;font-weight:800;font-size:13px;backdrop-filter:blur(4px)}
.cb-hint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgba(10,20,18,.7);color:#eaf2ec;font-size:12.5px;font-weight:700;white-space:nowrap;pointer-events:none}
.cb-rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.cb-room{position:relative;display:grid;gap:6px;padding:12px 14px;border-radius:16px;background:linear-gradient(180deg,rgba(60,48,34,.35),rgba(20,24,22,.5));border:1px solid rgba(220,190,140,.2)}
.cb-room.done{border-color:rgba(140,220,150,.45);background:linear-gradient(180deg,rgba(40,70,44,.4),rgba(18,30,22,.55))}
.cb-room.work{border-color:rgba(255,200,110,.55);box-shadow:0 0 0 1px rgba(255,200,110,.15),0 0 18px rgba(255,180,80,.12)}
.cb-room.lock{opacity:.62}
.cb-room.dmg{border-color:rgba(255,120,90,.55);background:linear-gradient(180deg,rgba(80,36,28,.45),rgba(30,18,16,.6));box-shadow:0 0 16px rgba(255,100,70,.12)}
.cb-dmg{padding:8px 10px;border-radius:10px;background:rgba(255,100,70,.12);color:#ffd8cc;font-size:13.5px;line-height:1.45}.cb-dmg small{color:#e8b8a8}
.cb-room .hd{display:flex;gap:10px;align-items:center}
.cb-room .ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:24px;background:rgba(0,0,0,.28);flex:none}
.cb-room h3{margin:0;font-size:16px}
.cb-room .bon{color:#a8e6b0;font-weight:700;font-size:13px}
.cb-cost{display:flex;gap:6px;flex-wrap:wrap}
.cb-cost span{padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.3);font-size:12.5px;font-weight:800}
.cb-cost span.no{color:#ff9a8a;box-shadow:inset 0 0 0 1px rgba(255,120,100,.45)}
.cb-bar{height:8px;border-radius:9px;background:rgba(0,0,0,.4);overflow:hidden}
.cb-bar i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#ffb84a,#ffe08a);box-shadow:0 0 10px rgba(255,190,90,.6)}
.cb-room .acts{display:flex;gap:6px;flex-wrap:wrap}
.cb-legend{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;align-items:center}
.cb-legend canvas{width:150px;height:76px}
.cb-legend .q{width:150px;height:76px;border-radius:12px;display:grid;place-items:center;font-size:34px;background:rgba(0,0,0,.3);color:#8a98a0}
.cb-page{position:relative;padding:22px 24px 18px;border-radius:14px;color:#3a2a18;background:radial-gradient(120% 100% at 30% 0%,#f6ead0,#e2cfa6);box-shadow:inset 0 0 30px rgba(120,80,30,.35)}
.cb-page p,.modal-card .cb-page p{color:#3a2a18;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:1.6;margin:0}
.cb-page small{display:block;margin-top:10px;text-align:right;font-family:Georgia,serif;color:#6a4a28}
@media (max-width:600px){.cb-scene canvas{height:270px}.cb-res{top:auto;bottom:10px;left:10px;right:10px;justify-content:center}.cb-hint{display:none}.cb-legend{grid-template-columns:1fr}.cb-res span{font-size:12px;padding:4px 8px}.cb-scene .cap b{font-size:21px}}
</style>`);

/* ---------- andmed ---------- */
async function cbLoad(force) {
  if (CB.loading || (!force && CB.d && Date.now() - CB.d._at < 20000)) return;
  CB.loading = true;
  try { CB.d = await rpc('cabin_state'); CB.d._at = Date.now(); CB.d._skew = Date.now() - Date.parse(CB.d.now) } catch (e) { CB.err = e.message }
  CB.loading = false; if (FV.open && FV.tab === 'kalurimaja') renderFV(true);
}
function cbNow() { return Date.now() - ((CB.d && CB.d._skew) || 0) }
function cbDone(id) { return !!(CB.d && CB.d.rooms.find(r => r.id === id && r.done && !r.damage)) }
function cbWork() { return CB.d && CB.d.rooms.find(r => r.started_at && !r.done) }
function cbSeen() { try { return JSON.parse(localStorage.getItem('mk.cbPages') || '[]') } catch (e) { return [] } }
function cbMarkSeen(id) { const a = cbSeen(); if (!a.includes(id)) { a.push(id); try { localStorage.setItem('mk.cbPages', JSON.stringify(a)) } catch (e) { } } }
function cbRes(k) { return S && S.res ? Math.floor(S.res[k] || 0) : 0 }

/* ---------- korjamine maja ümber (läheb kuningriigi lattu) ---------- */
const CB_NODES = [
  { k: 'tree', x: .045, y: .63, s: 1.15 }, { k: 'tree', x: .12, y: .6, s: 1 }, { k: 'tree', x: .2, y: .635, s: .9 }, { k: 'tree', x: .53, y: .6, s: .85 },
  { k: 'rock', x: .085, y: .74, s: 1 }, { k: 'rock', x: .25, y: .745, s: .8 }, { k: 'rock', x: .585, y: .72, s: .9 }, { k: 'rock', x: .79, y: .7, s: 1.1 },
  { k: 'bush', x: .16, y: .75, s: 1 }, { k: 'bush', x: .45, y: .735, s: .9 }
];
const CB_GIVE = { tree: ['wood', 5, 3, 8], rock: ['stone', 4, 3, 10], bush: ['berries', 4, 2, 6] }; // ressurss, kogus, mitu korda, taastumine minutites
function cbNodeState() {
  if (!CB.nodes) { try { CB.nodes = JSON.parse(localStorage.getItem('mk.cbNodes') || '{}') } catch (e) { CB.nodes = {} } }
  const now = Date.now();
  CB_NODES.forEach((n, i) => { const st = CB.nodes[i] || (CB.nodes[i] = { hp: CB_GIVE[n.k][2], until: 0 }); if (st.until && now >= st.until) { st.hp = CB_GIVE[n.k][2]; st.until = 0 } });
  return CB.nodes;
}
function cbHit(i, px, py) {
  const now = performance.now(); if (now - CB.lastHit < 320) return; CB.lastHit = now;
  const n = CB_NODES[i], st = cbNodeState()[i], [res, amt, , regrow] = CB_GIVE[n.k];
  if (!S) return;
  if (st.hp <= 0) { const m = Math.ceil((st.until - Date.now()) / 60000); CB.floats.push({ x: px, y: py, t: now, txt: `Kasvab tagasi ~${m} min`, col: '#d8e4dc' }); return }
  const cap = RATES && RATES.cap ? RATES.cap : 9999, room = Math.max(0, cap - S.res[res]), got = Math.min(room, amt);
  n.hitT = now;
  for (let k = 0; k < 10; k++) CB.parts.push({ x: px, y: py, vx: (Math.random() - .5) * 160, vy: -60 - Math.random() * 120, t: now, life: .8 + Math.random() * .4, col: n.k === 'tree' ? '#b88a52' : n.k === 'rock' ? '#a8b0b4' : '#e04a5a', r: 2 + Math.random() * 2.5 });
  if (!got) { CB.floats.push({ x: px, y: py, t: now, txt: 'Ladu täis', col: '#ff9a8a' }); return }
  S.res[res] += got; S.st.gathered[res] = (S.st.gathered[res] || 0) + got;
  st.hp--; if (st.hp <= 0) st.until = Date.now() + regrow * 60000;
  try { localStorage.setItem('mk.cbNodes', JSON.stringify(CB.nodes)) } catch (e) { }
  CB.floats.push({ x: px, y: py - 10, t: now, txt: `+${got} ${RES[res].g}`, col: RES[res].c });
  if (typeof sfx === 'function') sfx(n.k === 'tree' ? 'chop' : n.k === 'rock' ? 'stone' : 'pick');
  clearTimeout(CB.saveT); CB.saveT = setTimeout(() => { try { save() } catch (e) { } }, 800);
  cbResChips();
}
function cbResChips() { const el = document.getElementById('cbRes'); if (el) el.innerHTML = cbChipsHtml() }
function cbChipsHtml() { return `<span>🪵 ${fmt(cbRes('wood'))}</span><span>🪨 ${fmt(cbRes('stone'))}</span><span>🫐 ${fmt(cbRes('berries'))}</span><span>🪙 ${fmt(FS ? FS.gold : 0)}</span>` }

/* ---------- vahekaart ---------- */
function cbTab() {
  if (!CB.d) { cbLoad(); return '<div class="fv-card"><p class="lead">Laen Kalurimaja…</p></div>' }
  if (Date.now() - CB.d._at > 20000) cbLoad();
  const d = CB.d, rooms = d.rooms, nDone = rooms.filter(r => r.done).length, work = cbWork();
  let h = `<div class="fv-card" style="padding:12px"><div class="cb-scene"><canvas id="cbCv" aria-label="Kalurimaja Udulahe kaldal. Puuduta puid, kive ja põõsaid, et korjata."></canvas>
    <div class="cap"><b>Udulaht</b><small>Kalurimaja · taastatud ${nDone}/${rooms.length}</small></div><div class="cb-res" id="cbRes">${cbChipsHtml()}</div>
    <div class="cb-hint">🪓 Puuduta puid, kive ja põõsaid – saak läheb kuningriigi lattu</div></div>
    <p class="lead" style="margin:10px 4px 0">Siin elas kunagi vana kalur Villem. Taasta tema maja tuba-toa haaval: kuld tuleb kalurikassast, puit ja kivi sinu kuningriigi laost. Iga taastatud tuba annab püügile kindla boonuse ja ühe lehe Villemi päevikust.
    ${cbDone('sild') ? ` <button class="btn sm" type="button" data-cb="go">🎣 Püüa Udulahes</button>` : ''}</p></div>`;
  h += `<div class="fv-card"><h2>Maja taastamine</h2><div class="cb-rooms">${rooms.map((r, i) => cbRoomHtml(r, i, rooms, work)).join('')}</div></div>`;
  // legend
  const leg = FD.sp.hallhaug, open = cbDone('poonung');
  h += `<div class="fv-card"><h2>Udulahe legend</h2><div class="cb-legend">${open && leg ? `<canvas data-fl="hallhaug" data-r="5"></canvas>` : '<div class="q">?</div>'}
    <div>${open ? `<b>${esc(leg ? leg.name : 'Hallhaug')}</b><p class="lead" style="margin:4px 0">${esc(leg ? leg.descr : '')}</p><p class="lead" style="margin:0">${d.legend ? `🏆 Oled teda püüdnud <b>${d.legend}</b> korda!` : 'Püüa Udulahes udu ajal või öösel – siis on lootust kõige rohkem.'}</p>`
      : '<p class="lead" style="margin:0">Villemi päevikus on juttu millestki suurest, mis elab lahe põhjas… Taasta maja, et rohkem teada saada.</p>'}</div></div></div>`;
  return h;
}
function cbRoomHtml(r, i, rooms, work) {
  const prevOk = i === 0 || rooms[i - 1].done, lvlOk = FS.level >= r.min_level, building = r.started_at && !r.done;
  const w = cbRes('wood'), s = cbRes('stone'), g = FS.gold;
  const cost = `<div class="cb-cost"><span class="${g < r.gold ? 'no' : ''}">🪙 ${fmt(r.gold)}</span><span class="${w < r.wood ? 'no' : ''}">🪵 ${fmt(r.wood)}</span><span class="${s < r.stone ? 'no' : ''}">🪨 ${fmt(r.stone)}</span><span>⏱ ${r.hours} h</span></div>`;
  let st = '', cls = '';
  if (r.done && r.damage) { const D = r.damage, can = g >= D.gold && w >= D.wood && s >= D.stone;
    cls = 'dmg'; st = `<div class="cb-dmg">🌪️ <b>Tormikahju!</b> ${esc(D.what)}<br><small>Ruumi boonus ei tööta, kuni see on parandatud.</small></div>
      <div class="cb-cost"><span class="${g < D.gold ? 'no' : ''}">🪙 ${fmt(D.gold)}</span>${D.wood ? `<span class="${w < D.wood ? 'no' : ''}">🪵 ${fmt(D.wood)}</span>` : ''}${D.stone ? `<span class="${s < D.stone ? 'no' : ''}">🪨 ${fmt(D.stone)}</span>` : ''}</div>
      <div class="acts"><button class="btn sm" type="button" data-cb="repair" data-arg="${r.id}" ${!can || CB.busy ? 'disabled' : ''}>🔧 Paranda</button>${!can ? '<span class="lead" style="font-size:12.5px">Korja puitu ja kivi maja ümbert</span>' : ''}</div>` }
  else if (r.done) { cls = 'done'; st = `<div class="acts"><span class="pill ok">✓ Taastatud</span><button class="btn sm ghost" type="button" data-cb="page" data-arg="${r.id}">📜 Loe päevikut${cbSeen().includes(r.id) ? '' : ' •'}</button></div>` }
  else if (building) {
    cls = 'work'; const t0 = Date.parse(r.started_at), t1 = Date.parse(r.done_at), now = cbNow(), p = Math.min(1, (now - t0) / Math.max(1, t1 - t0)), left = Math.max(0, t1 - now), rush = Math.max(100, Math.ceil(left / 60000 * 40));
    st = `<div class="cb-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div><div class="acts"><span class="lead" style="font-size:13px">🔨 Töö käib · valmis ${cbLeft(left)} pärast</span><button class="btn sm ghost" type="button" data-cb="rush" ${g < rush || CB.busy ? 'disabled' : ''}>⚡ Kiirusta (${fmt(rush)} kulda)</button></div>`;
  } else if (!prevOk) { cls = 'lock'; st = `${cost}<span class="lead" style="font-size:13px">🔒 Taasta enne ${esc(rooms[i - 1].name.toLowerCase())}</span>` }
  else if (!lvlOk) { cls = 'lock'; st = `${cost}<span class="lead" style="font-size:13px">🔒 Avaneb kalapüügi ${r.min_level}. tasemel</span>` }
  else { const can = g >= r.gold && w >= r.wood && s >= r.stone && !work; st = `${cost}<div class="acts"><button class="btn sm" type="button" data-cb="build" data-arg="${r.id}" ${!can || CB.busy ? 'disabled' : ''}>🔨 Taasta</button>${work ? '<span class="lead" style="font-size:12.5px">Oota, kuni praegune töö valmib</span>' : !can ? '<span class="lead" style="font-size:12.5px">Korja puitu ja kivi maja ümbert või kuningriigist</span>' : ''}</div>` }
  return `<div class="cb-room ${cls}"><div class="hd"><span class="ic">${r.icon}</span><div><h3>${esc(r.name)}</h3><small class="lead">${esc(r.descr)}</small></div></div><div class="bon">✨ ${esc(r.bonus)}</div>${st}</div>`;
}
function cbLeft(ms) { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.max(1, m)} min` }

async function cbAct(a, arg) {
  if (a === 'go') { FV.tab = 'puuk'; FV.spot = 'udulaht'; FV.oddsKey = ''; renderFV(true); try { await loadOdds() } catch (e) { } renderFV(true); return }
  if (a === 'page') { const r = CB.d.rooms.find(x => x.id === arg); if (!r || !r.page) return; cbMarkSeen(arg); const n = CB.d.rooms.indexOf(r) + 1;
    showModal(() => `<h2>📜 Villemi päevik · ${n}. leht</h2><div class="cb-page"><p>${esc(r.page)}</p><small>— leitud: ${esc(r.name.toLowerCase())}</small></div><div class="mbtns"><button class="btn" type="button" data-act="closeModal">Sulge</button></div>`); renderFV(true); return }
  if (CB.busy) return; CB.busy = true; renderFV(true);
  try {
    if (a === 'build') {
      if (typeof cloudSave === 'function') await cloudSave(true); // server peab teadma kuningriigi praegust puitu ja kivi
      const r = await rpc('cabin_build', { p_room: arg });
      if (r.spent && S) { S.res.wood = Math.max(0, S.res.wood - r.spent.wood); S.res.stone = Math.max(0, S.res.stone - r.spent.stone); save(); if (typeof cloudSave === 'function') cloudSave(true) }
      CB.d = r; CB.d._at = Date.now(); CB.d._skew = Date.now() - Date.parse(r.now);
      const rm = r.rooms.find(x => x.id === arg); toast(`🔨 ${rm ? rm.name : 'Töö'}: taastamine algas! Valmib ${rm ? rm.hours : ''} tunni pärast.`, 'good', 'gold');
      cbBurst('#ffd28a');
    } else if (a === 'repair') {
      if (typeof cloudSave === 'function') await cloudSave(true);
      const r = await rpc('cabin_repair', { p_room: arg });
      if (r.spent && S) { S.res.wood = Math.max(0, S.res.wood - r.spent.wood); S.res.stone = Math.max(0, S.res.stone - r.spent.stone); save(); if (typeof cloudSave === 'function') cloudSave(true) }
      CB.d = r; CB.d._at = Date.now(); CB.d._skew = Date.now() - Date.parse(r.now);
      const rm = r.rooms.find(x => x.id === arg); toast(`🔧 ${rm ? rm.name : 'Ruum'} on jälle korras! Boonus töötab uuesti.`, 'good', 'gold'); cbBurst('#a8f0b0');
    } else if (a === 'rush') {
      const r = await rpc('cabin_rush'); CB.d = r; CB.d._at = Date.now(); CB.d._skew = Date.now() - Date.parse(r.now); toast(`⚡ Töö sai valmis! (${fmt(r.rushed)} kulda)`, 'gold', 'gold'); cbBurst('#a8f0b0');
    }
    await refreshFS();
  } catch (e) { toast(e.message, 'bad') }
  CB.busy = false; renderFV(true);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-cb]'); if (!b || b.disabled) return; cbAct(b.dataset.cb, b.dataset.arg) });
function cbBurst(col) { const cv = document.getElementById('cbCv'); if (!cv) return; const w = cv.clientWidth, h = cv.clientHeight, now = performance.now();
  for (let k = 0; k < 50; k++) CB.parts.push({ x: w * .34, y: h * .45, vx: (Math.random() - .5) * 300, vy: -80 - Math.random() * 200, t: now, life: 1 + Math.random() * .6, col, r: 2 + Math.random() * 3 }) }

/* ---------- maal ---------- */
function cbStart() {
  const cv = document.getElementById('cbCv'); if (!cv) return;
  if (!cv._wired) {
    cv._wired = true;
    const pick = (e, hit) => { const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left), y = (e.clientY - rc.top), w = rc.width, h = rc.height; let best = -1, bd = 1e9;
      CB_NODES.forEach((n, i) => { const d = Math.hypot(n.x * w - x, (n.y - (n.k === 'tree' ? .07 : .015)) * h - y); if (d < bd) { bd = d; best = i } });
      const ok = best >= 0 && bd < Math.max(34, w * .05); if (hit && ok) cbHit(best, x, y); return ok ? best : -1 };
    cv.addEventListener('click', e => pick(e, true));
    cv.addEventListener('mousemove', e => { CB.hover = pick(e, false); cv.style.cursor = CB.hover >= 0 ? 'pointer' : 'default' });
    cv.addEventListener('mouseleave', () => CB.hover = -1);
  }
  if (!CB.raf) CB.raf = requestAnimationFrame(cbPaint);
}
function cbPaint(ts) {
  const cv = document.getElementById('cbCv');
  if (!cv || !FV.open || FV.tab !== 'kalurimaja') { CB.raf = 0; return }
  CB.raf = requestAnimationFrame(cbPaint);
  const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; const d = Math.min(2, devicePixelRatio || 1);
  if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) }
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  cbScene(c, w, h, ts / 1000);
}
function cbScene(c, w, h, t) {
  const night = !!(FS && FS.is_night), R = id => cbDone(id), wl = h * .66;
  // taevas
  const sky = c.createLinearGradient(0, 0, 0, wl);
  if (night) { sky.addColorStop(0, '#0a1424'); sky.addColorStop(1, '#2a3a4c') } else { sky.addColorStop(0, '#9fb6c0'); sky.addColorStop(.7, '#d6dfdc'); sky.addColorStop(1, '#e8ebe2') }
  c.fillStyle = sky; c.fillRect(0, 0, w, wl + 2);
  if (night) { for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(255,255,240,${.3 + .4 * Math.abs(Math.sin(t * .7 + i))})`; c.fillRect((i * 137.5) % w, (i * 53) % (wl * .6), 1.4, 1.4) }
    const mg = c.createRadialGradient(w * .7, h * .14, 0, w * .7, h * .14, 60); mg.addColorStop(0, 'rgba(255,250,220,.5)'); mg.addColorStop(1, 'rgba(255,250,220,0)'); c.fillStyle = mg; c.fillRect(w * .7 - 60, h * .14 - 60, 120, 120);
    c.fillStyle = '#f4f0dc'; c.beginPath(); c.arc(w * .7, h * .14, 13, 0, 6.283); c.fill() }
  else { const sg = c.createRadialGradient(w * .72, h * .16, 0, w * .72, h * .16, 90); sg.addColorStop(0, 'rgba(255,248,220,.85)'); sg.addColorStop(1, 'rgba(255,248,220,0)'); c.fillStyle = sg; c.fillRect(w * .72 - 90, h * .16 - 90, 180, 180) }
  // kauged metsased künkad
  for (const [yy, col, a, f] of [[.48, night ? '#1c2a34' : '#8ea4a4', .9, .013], [.55, night ? '#16222a' : '#6e8a84', 1, .021]]) {
    c.fillStyle = col; c.globalAlpha = a; c.beginPath(); c.moveTo(0, wl);
    for (let x = 0; x <= w; x += 6) { const tr = (Math.sin(x * .9) * .5 + .5) * 6; c.lineTo(x, h * yy + Math.sin(x * f + yy * 9) * 10 - tr) } c.lineTo(w, wl); c.fill(); c.globalAlpha = 1 }
  // vesi
  const wg = c.createLinearGradient(0, wl, 0, h); wg.addColorStop(0, night ? '#22384a' : '#9cb4b8'); wg.addColorStop(1, night ? '#08141e' : '#4e6e74'); c.fillStyle = wg; c.fillRect(0, wl, w, h - wl);
  c.strokeStyle = night ? 'rgba(200,220,255,.12)' : 'rgba(255,255,255,.28)'; c.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const yy = wl + 6 + i * (h - wl) / 14, ph = t * .6 + i; c.beginPath(); for (let x = w * .3; x <= w; x += 14) { const xx = x + Math.sin(ph + x * .02) * 6; c.moveTo(xx, yy); c.lineTo(xx + 7, yy) } c.stroke() }
  if (night) { c.fillStyle = 'rgba(255,250,220,.15)'; for (let i = 0; i < 8; i++) c.fillRect(w * .7 - 14 + Math.sin(t + i) * 4, wl + 8 + i * 9, 28 - i * 2, 2) }
  // kallas (vasakul) ja kaljunukk (paremal)
  const gg = c.createLinearGradient(0, h * .56, 0, h); gg.addColorStop(0, night ? '#24361e' : '#6e8a4a'); gg.addColorStop(1, night ? '#121c10' : '#3e5428'); c.fillStyle = gg;
  c.beginPath(); c.moveTo(0, h * .6); c.bezierCurveTo(w * .2, h * .56, w * .45, h * .6, w * .62, h * .66); c.bezierCurveTo(w * .66, h * .74, w * .55, h * .82, w * .4, h * .86); c.lineTo(0, h * .9); c.closePath(); c.fill();
  c.fillStyle = night ? '#2a2e30' : '#7a8084'; c.beginPath(); c.moveTo(w * .72, wl + 6); c.lineTo(w * .76, h * .6); c.lineTo(w * .86, h * .55); c.lineTo(w * .95, h * .58); c.lineTo(w, h * .6); c.lineTo(w, wl + 14); c.closePath(); c.fill();
  c.fillStyle = night ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(w * .76, h * .6); c.lineTo(w * .86, h * .55); c.lineTo(w * .84, h * .6); c.closePath(); c.fill();
  // roostik
  c.strokeStyle = night ? '#2a3a1e' : '#7a8a40'; c.lineWidth = 1.6;
  for (let i = 0; i < 26; i++) { const rx = w * (.5 + i * .008) + Math.sin(i * 3.1) * 6, ry = h * (.69 + (i % 4) * .01), sw = Math.sin(t * 1.2 + i) * 3; c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo(rx + sw * .5, ry - 16, rx + sw, ry - 24 - (i % 3) * 6); c.stroke() }
  // majakas
  cbLighthouse(c, w * .875, h * .56, h * .3, R('majakas'), night, t);
  // sild ja paat
  cbPier(c, w, h, R('sild'), t, night);
  // võrguait
  cbNetShed(c, w * .47, h * .62, h * .16, R('aidake'), night);
  // maja
  cbHouse(c, w * .33, h * .64, Math.min(w * .2, h * .52), t, night);
  // korjatavad asjad
  const st = cbNodeState(), now = performance.now();
  CB_NODES.forEach((n, i) => { const x = n.x * w, y = n.y * h, s = n.s * h * .0052, ok = st[i].hp > 0, shake = n.hitT && now - n.hitT < 260 ? Math.sin((now - n.hitT) / 20) * 3 : 0;
    c.save(); c.translate(x + shake, y);
    if (n.k === 'tree') cbTree(c, s, ok, st[i].hp, night); else if (n.k === 'rock') cbRock(c, s, ok, night); else cbBush(c, s, ok, night);
    if (CB.hover === i && ok) { c.strokeStyle = 'rgba(255,240,180,.7)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(0, 2, 22 * s, 7 * s, 0, 0, 6.283); c.stroke(); c.setLineDash([]) }
    c.restore() });
  // udu
  for (let i = 0; i < 6; i++) { const mx = ((t * (6 + i * 2) + i * 230) % (w + 400)) - 200, my = h * (.5 + i * .06);
    const mgr = c.createRadialGradient(mx, my, 0, mx, my, 180); mgr.addColorStop(0, night ? 'rgba(180,200,220,.12)' : 'rgba(255,255,255,.35)'); mgr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = mgr; c.beginPath(); c.ellipse(mx, my, 180, 34, 0, 0, 6.283); c.fill() }
  // osakesed ja tekstid
  const nowp = performance.now();
  CB.parts = CB.parts.filter(p => { const a = (nowp - p.t) / 1000; if (a > p.life) return false; const x = p.x + p.vx * a, y = p.y + p.vy * a + 260 * a * a; c.globalAlpha = 1 - a / p.life; c.fillStyle = p.col; c.beginPath(); c.arc(x, y, p.r, 0, 6.283); c.fill(); c.globalAlpha = 1; return true });
  CB.floats = CB.floats.filter(f => { const a = (nowp - f.t) / 1000; if (a > 1.4) return false; c.globalAlpha = 1 - a / 1.4; c.font = '900 15px system-ui'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(f.txt, f.x, f.y - a * 34); c.fillStyle = f.col; c.fillText(f.txt, f.x, f.y - a * 34); c.globalAlpha = 1; c.textAlign = 'left'; return true });
}
function cbTree(c, s, ok, hp, night) {
  c.fillStyle = night ? '#2a1e14' : '#5a3e24'; c.fillRect(-3 * s, -8 * s, 6 * s, 9 * s);
  if (!ok) { c.fillStyle = night ? '#4a3a2a' : '#a88a62'; c.beginPath(); c.ellipse(0, -8 * s, 3.4 * s, 1.4 * s, 0, 0, 6.283); c.fill(); return }
  const g = night ? ['#122416', '#1a3020'] : ['#1f4a2c', '#2e6238'];
  for (let k = 0; k < 4; k++) { const yy = -8 * s - k * 9 * s, ww = (16 - k * 3.2) * s; c.fillStyle = g[k % 2]; c.beginPath(); c.moveTo(-ww, yy); c.lineTo(0, yy - 15 * s); c.lineTo(ww, yy); c.closePath(); c.fill() }
  if (hp < 3) { c.strokeStyle = '#d8b07a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-3 * s, -4 * s); c.lineTo(1 * s, -2 * s); c.stroke() }
}
function cbRock(c, s, ok, night) {
  if (!ok) { c.fillStyle = night ? '#3a3e40' : '#8a9094'; for (const [a, b] of [[-5, 0], [3, 1], [0, -2]]) { c.beginPath(); c.arc(a * s, b * s, 2.4 * s, 0, 6.283); c.fill() } return }
  c.fillStyle = night ? '#3e4446' : '#8e969a'; c.beginPath(); c.moveTo(-14 * s, 2 * s); c.lineTo(-10 * s, -9 * s); c.lineTo(-2 * s, -13 * s); c.lineTo(9 * s, -10 * s); c.lineTo(14 * s, 2 * s); c.closePath(); c.fill();
  c.fillStyle = night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(-10 * s, -9 * s); c.lineTo(-2 * s, -13 * s); c.lineTo(-3 * s, -6 * s); c.closePath(); c.fill();
  c.fillStyle = 'rgba(70,110,50,.6)'; c.beginPath(); c.ellipse(-6 * s, -9 * s, 4 * s, 2 * s, -.3, 0, 6.283); c.fill();
}
function cbBush(c, s, ok, night) {
  c.fillStyle = night ? '#16301a' : '#3a7034'; for (const [a, b, r] of [[-8, -5, 8], [0, -9, 9], [8, -5, 8]]) { c.beginPath(); c.arc(a * s, b * s, r * s, 0, 6.283); c.fill() }
  if (ok) { c.fillStyle = '#d8344a'; for (const [a, b] of [[-8, -7], [-2, -12], [4, -6], [9, -9], [0, -4], [-5, -2]]) { c.beginPath(); c.arc(a * s, b * s, 1.8 * s, 0, 6.283); c.fill() } }
}
function cbHouse(c, x, y, W2, t, night) {
  const R = id => cbDone(id), lit = R('laternatuba'), roofOk = R('poonung'), H2 = W2 * .52, work = cbWork();
  c.save(); c.translate(x, y);
  // vari
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 4, W2 * .62, 7, 0, 0, 6.283); c.fill();
  // korsten ja suits
  const chx = W2 * .22, chTop = -H2 - W2 * .38;
  c.fillStyle = night ? '#3a3230' : '#7a6058'; if (R('suitsukoda')) c.fillRect(chx - 7, chTop, 14, W2 * .3); else { c.beginPath(); c.moveTo(chx - 7, chTop + 18); c.lineTo(chx - 7, chTop + W2 * .3); c.lineTo(chx + 7, chTop + W2 * .3); c.lineTo(chx + 7, chTop + 10); c.lineTo(chx, chTop + 22); c.closePath(); c.fill() }
  if (R('suitsukoda')) for (let k = 0; k < 6; k++) { const a = ((t * .35 + k / 6) % 1), sx = chx + Math.sin(a * 6 + k) * 8 + a * 26, sy = chTop - a * 60; c.fillStyle = `rgba(${night ? '120,130,140' : '230,232,230'},${.5 * (1 - a)})`; c.beginPath(); c.arc(sx, sy, 5 + a * 12, 0, 6.283); c.fill() }
  // seinad (palgid)
  const wall = night ? (lit ? '#4a3626' : '#2e241c') : (R('sild') ? '#8a6240' : '#6a5440');
  c.fillStyle = wall; c.fillRect(-W2 / 2, -H2, W2, H2);
  c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.2; for (let k = 1; k < 7; k++) { const yy = -H2 + k * H2 / 7; c.beginPath(); c.moveTo(-W2 / 2, yy); c.lineTo(W2 / 2, yy); c.stroke() }
  for (const sx of [-1, 1]) { c.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(sx * W2 / 2, -H2 + (k + .5) * H2 / 7, 3, 0, 6.283); c.fill() } }
  if (!R('aidake')) { c.fillStyle = 'rgba(70,100,50,.55)'; for (const [a, b, r] of [[-.4, -.12, 10], [-.15, -.05, 8], [.35, -.08, 9]]) { c.beginPath(); c.ellipse(a * W2, b * H2, r, r * .55, 0, 0, 6.283); c.fill() } c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(W2 * .12, -H2 * .55, W2 * .1, 4); c.fillRect(-W2 * .42, -H2 * .32, W2 * .14, 4) }
  // aknad
  for (const wx of [-W2 * .3, W2 * .18]) { const ww = W2 * .17, wh = H2 * .36, wy = -H2 * .72;
    c.fillStyle = '#3a2a1a'; c.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    if (lit) { const lg = c.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww * (night ? 2.6 : 1.4)); lg.addColorStop(0, night ? 'rgba(255,200,110,.55)' : 'rgba(255,210,130,.25)'); lg.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = lg; c.fillRect(wx - ww * 2, wy - wh * 2, ww * 5, wh * 5);
      c.fillStyle = night ? '#ffcf78' : '#f2d090'; c.fillRect(wx, wy, ww, wh); c.fillStyle = '#b8402e'; c.fillRect(wx, wy, ww * .22, wh); c.fillRect(wx + ww * .78, wy, ww * .22, wh) }
    else { c.fillStyle = '#141a1c'; c.fillRect(wx, wy, ww, wh); c.strokeStyle = 'rgba(200,220,230,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(wx + 2, wy + 3); c.lineTo(wx + ww * .6, wy + wh * .5); c.lineTo(wx + ww * .4, wy + wh - 2); c.stroke();
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(wx - 2, wy); c.lineTo(wx + ww + 2, wy + wh); c.moveTo(wx + ww + 2, wy); c.lineTo(wx - 2, wy + wh); c.stroke() }
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke() }
  // uks ja latern
  const dx = -W2 * .04, dw = W2 * .15, dh = H2 * .62; c.save(); c.translate(dx, 0); if (!R('sild')) c.rotate(-.06);
  c.fillStyle = night ? '#2a1c12' : '#5a3a20'; c.fillRect(0, -dh, dw, dh); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(k * dw / 4, -dh); c.lineTo(k * dw / 4, 0); c.stroke() }
  c.fillStyle = '#d8b060'; c.beginPath(); c.arc(dw * .8, -dh * .5, 2, 0, 6.283); c.fill(); c.restore();
  if (lit) { const lx = dx + dw + 8, ly = -dh * .85, fl = .85 + .15 * Math.sin(t * 9) * Math.sin(t * 3.3); const lg = c.createRadialGradient(lx, ly, 0, lx, ly, 46); lg.addColorStop(0, `rgba(255,200,100,${(night ? .7 : .35) * fl})`); lg.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = lg; c.fillRect(lx - 46, ly - 46, 92, 92); c.fillStyle = '#2a2018'; c.fillRect(lx - 4, ly - 8, 8, 12); c.fillStyle = '#ffd88a'; c.fillRect(lx - 2.5, ly - 6, 5, 8) }
  // trepp
  c.fillStyle = night ? '#3a2a1c' : '#7a5a3a'; c.fillRect(dx - 4, -3, dw + 8, 4); c.fillRect(dx - 8, 0, dw + 16, 4);
  // katus
  const rg = c.createLinearGradient(0, -H2 - W2 * .42, 0, -H2); rg.addColorStop(0, night ? '#2a2420' : '#5a4434'); rg.addColorStop(1, night ? '#1a1612' : '#3a2c22'); c.fillStyle = rg;
  c.beginPath(); c.moveTo(-W2 * .6, -H2 + 4); c.lineTo(0, -H2 - W2 * .42); c.lineTo(W2 * .6, -H2 + 4); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; for (let k = 1; k < 6; k++) { const f = k / 6; c.beginPath(); c.moveTo(-W2 * .6 * (1 - f), -H2 + 4 - W2 * .42 * f); c.lineTo(W2 * .6 * (1 - f), -H2 + 4 - W2 * .42 * f); c.stroke() }
  if (!roofOk) { c.fillStyle = '#0c0e10'; for (const [a, b, r] of [[-.22, -.18, 9], [.12, -.3, 7], [.3, -.1, 8]]) { c.beginPath(); c.moveTo(a * W2 - r, -H2 + b * W2); c.lineTo(a * W2 - r * .2, -H2 + b * W2 - r * .9); c.lineTo(a * W2 + r, -H2 + b * W2 - r * .3); c.lineTo(a * W2 + r * .4, -H2 + b * W2 + r * .5); c.closePath(); c.fill() } }
  else { const ax = 0, ay = -H2 - W2 * .2, ar = W2 * .055; c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(ax, ay, ar + 2.5, 0, 6.283); c.fill(); c.fillStyle = lit ? '#ffcf78' : '#283034'; c.beginPath(); c.arc(ax, ay, ar, 0, 6.283); c.fill() }
  // tellingud, kui töö käib
  if (work) { c.strokeStyle = '#b08a5a'; c.lineWidth = 2.5; for (const sx of [-W2 * .62, W2 * .62]) { c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, -H2 - 16); c.stroke() } for (let k = 0; k < 3; k++) { const yy = -k * H2 * .45 - 6; c.beginPath(); c.moveTo(-W2 * .64, yy); c.lineTo(W2 * .64, yy); c.stroke() }
    if (Math.sin(t * 6) > .6) { c.fillStyle = '#ffe08a'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(W2 * .45 + Math.random() * 8, -H2 * .5 + Math.random() * 8, 1.6, 0, 6.283); c.fill() } } }
  c.restore();
}
function cbPier(c, w, h, ok, t, night) {
  const x0 = w * .5, x1 = w * .7, y0 = h * .7;
  if (!ok) { c.strokeStyle = night ? '#2a1e14' : '#5a4028'; c.lineWidth = 4; for (const [px, tilt] of [[.53, .2], [.58, -.15], [.64, .3]]) { c.beginPath(); c.moveTo(w * px, y0 + 14); c.lineTo(w * px + tilt * 10, y0 - 4); c.stroke() } return }
  c.fillStyle = night ? '#2a2016' : '#6a4a2c'; for (let px = x0; px <= x1; px += (x1 - x0) / 4) c.fillRect(px - 2, y0 - 2, 4, 20);
  c.fillStyle = night ? '#4a3824' : '#a8824e'; c.fillRect(x0 - 6, y0 - 5, x1 - x0 + 12, 6); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; for (let px = x0; px <= x1; px += 7) { c.beginPath(); c.moveTo(px, y0 - 5); c.lineTo(px, y0 + 1); c.stroke() }
  // paat
  const bx = x1 - w * .04, by = y0 + 16 + Math.sin(t * 1.4) * 2, bw = w * .07; c.save(); c.translate(bx, by); c.rotate(Math.sin(t * 1.1) * .03);
  c.fillStyle = night ? '#3a2a1e' : '#7a4a2a'; c.beginPath(); c.moveTo(-bw, -4); c.lineTo(bw, -4); c.quadraticCurveTo(bw * .9, 6, bw * .6, 7); c.lineTo(-bw * .7, 7); c.quadraticCurveTo(-bw * 1.05, 2, -bw, -4); c.fill();
  c.fillStyle = night ? '#5a4030' : '#b06a3a'; c.fillRect(-bw, -5, bw * 2, 2); c.restore();
  c.strokeStyle = 'rgba(220,210,180,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y0); c.quadraticCurveTo(x1 - 4, y0 + 10, bx - bw * .6, by - 3); c.stroke();
}
function cbNetShed(c, x, y, s, ok, night) {
  if (!ok) { c.fillStyle = night ? '#2a2016' : '#5a4028'; c.save(); c.translate(x, y); for (const [a, b, r] of [[-12, -2, .3], [-2, -4, -.5], [8, -1, .15]]) { c.save(); c.translate(a, b); c.rotate(r); c.fillRect(-12, -2, 24, 4); c.restore() } c.restore(); return }
  c.save(); c.translate(x, y);
  c.fillStyle = night ? '#3a2a1c' : '#7a5a38'; c.fillRect(-s * .4, -s * .6, s * .8, s * .6);
  c.fillStyle = night ? '#221a14' : '#4a3424'; c.beginPath(); c.moveTo(-s * .5, -s * .58); c.lineTo(0, -s * .9); c.lineTo(s * .5, -s * .58); c.closePath(); c.fill();
  // võrgud kuivamas
  c.strokeStyle = night ? '#4a4a3a' : '#8a7a5a'; c.lineWidth = 2; for (const px of [s * .55, s * 1.05]) { c.beginPath(); c.moveTo(px, 0); c.lineTo(px, -s * .7); c.stroke() }
  c.beginPath(); c.moveTo(s * .55, -s * .66); c.lineTo(s * 1.05, -s * .66); c.stroke();
  c.strokeStyle = night ? 'rgba(200,200,180,.25)' : 'rgba(250,245,225,.6)'; c.lineWidth = .8;
  for (let k = 0; k <= 6; k++) { const px = s * .57 + k * s * .08; c.beginPath(); c.moveTo(px, -s * .66); c.quadraticCurveTo(px + 3, -s * .4, px, -s * .15); c.stroke() }
  for (let k = 0; k < 5; k++) { const py = -s * .6 + k * s * .1; c.beginPath(); c.moveTo(s * .57, py); c.quadraticCurveTo(s * .8, py + 4, s * 1.03, py); c.stroke() }
  c.restore();
}
function cbLighthouse(c, x, y, s, ok, night, t) {
  c.save(); c.translate(x, y);
  if (!ok) { c.fillStyle = night ? '#4a4a48' : '#a8a49a'; c.beginPath(); c.moveTo(-s * .09, 0); c.lineTo(-s * .07, -s * .32); c.lineTo(-s * .02, -s * .36); c.lineTo(s * .05, -s * .3); c.lineTo(s * .09, 0); c.closePath(); c.fill(); c.restore(); return }
  const tw = s * .1;
  for (let k = 0; k < 5; k++) { const y0 = -k * s * .14, y1 = y0 - s * .14, f0 = 1 - k * .08, f1 = 1 - (k + 1) * .08; c.fillStyle = k % 2 ? '#c8382c' : '#f2efe6'; if (night) c.fillStyle = k % 2 ? '#7a2420' : '#a8a49a';
    c.beginPath(); c.moveTo(-tw * f0, y0); c.lineTo(-tw * f1, y1); c.lineTo(tw * f1, y1); c.lineTo(tw * f0, y0); c.closePath(); c.fill() }
  const ly = -s * .76; c.fillStyle = '#2a2a2a'; c.fillRect(-tw * .7, ly - s * .06, tw * 1.4, s * .06); c.beginPath(); c.moveTo(-tw * .75, ly - s * .06); c.lineTo(0, ly - s * .13); c.lineTo(tw * .75, ly - s * .06); c.fill();
  c.fillStyle = '#fff2b0'; c.fillRect(-tw * .5, ly - s * .055, tw, s * .045);
  // pöörlev valguskiir
  const ang = t * .9, len = s * (night ? 3.2 : 2), spread = .12;
  c.save(); c.globalCompositeOperation = 'lighter'; const a = night ? .55 : .25;
  for (const dir of [ang, ang + Math.PI]) { const cx = Math.cos(dir); if (Math.abs(cx) < .15) continue;
    const bg = c.createLinearGradient(0, ly, cx * len, ly); bg.addColorStop(0, `rgba(255,240,180,${a})`); bg.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = bg;
    c.beginPath(); c.moveTo(0, ly - s * .03); c.lineTo(cx * len, ly - len * spread); c.lineTo(cx * len, ly + len * spread); c.closePath(); c.fill() }
  const gl = c.createRadialGradient(0, ly, 0, 0, ly, s * .3); gl.addColorStop(0, `rgba(255,240,180,${night ? .8 : .4})`); gl.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = gl; c.fillRect(-s * .3, ly - s * .3, s * .6, s * .6);
  c.restore(); c.restore();
}

/* ---------- ühendused ülejäänud mänguga ---------- */
{
  const _r = renderFV;
  renderFV = function (force) { const r = _r(force); if (FV.open && FV.tab === 'kalurimaja') cbStart(); return r };
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); if (CB.d) { const n = CB.d.rooms.filter(r => r.done && !cbSeen().includes(r.id)).length; if (n) b.kalurimaja = n } return b };
}
// töö valmimise teade
setInterval(() => {
  if (!CB.d || !FV.open) return; const w = cbWork(); if (!w) return;
  if (cbNow() >= Date.parse(w.done_at)) { toast(`🏚 ${w.name} on taastatud! Päevikus on uus leht.`, 'gold', 'gold'); cbLoad(true); refreshFS().then(() => renderFV(true)) }
  else if (FV.tab === 'kalurimaja') { const bar = document.querySelector('.cb-room.work .cb-bar i'); if (bar) { const p = Math.min(1, (cbNow() - Date.parse(w.started_at)) / (Date.parse(w.done_at) - Date.parse(w.started_at))); bar.style.width = (p * 100).toFixed(1) + '%' } }
}, 5000);
// menüüsse Kalurimaja
MN_ITEMS.splice(3, 0, ['kalurimaja', '🏚', 'Kalurimaja']);
{
  const _w = mnWhere; mnWhere = function () { return FV.open && FV.tab === 'kalurimaja' ? 'kalurimaja' : _w() };
  const _mb = mnBadges; mnBadges = function () { const b = _mb(); try { const fb = FS ? fvBadges() : {}; b.kalurimaja = +fb.kalurimaja || 0; if (b.puuk) b.puuk = Math.max(0, b.puuk - b.kalurimaja) } catch (e) { } return b };
}
