/* ================= KUNINGRIIKIDE KOOSTÖÖ (veebiversioon): monument, külastused ja sõprusekingid ================= */
const CO = { mon: null, monAt: 0, list: null, listAt: 0, busy: false };
const MON_STAGES = ['Vundament', 'Sambad', 'Kaared', 'Kuppel', 'Kuldne kroon'];
const MON_RES = { wood: 'Puit', stone: 'Kivi', gold: 'Kuld', food: 'Toit' };
function giftKey() { return 'mk.gifts.' + dateKey() }
function giftsToday() { try { return JSON.parse(localStorage.getItem(giftKey()) || '[]') } catch (e) { return [] } }
function markGift(id) { const g = giftsToday(); g.push(id); try { localStorage.setItem(giftKey(), JSON.stringify(g)) } catch (e) { } }
async function loadCoop(force) {
  if (!CL.user) return;
  const now = Date.now();
  try {
    if (force || !CO.mon || now - CO.monAt > 30000) { CO.monAt = now; CO.mon = await rpc('monument_state') }
    if (force || !CO.list || now - CO.listAt > 60000) { CO.listAt = now; CO.list = await rpc('kingdom_leaderboard') }
  } catch (e) { CO.err = e.message }
  if (UI.tab === 'sobrad') renderPanel(true);
}
function drawMonument(c, w, h, done, frac, t) {
  const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#6fa8c8'); sky.addColorStop(1, '#e8d8b0'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
  c.fillStyle = '#5a8a4a'; c.fillRect(0, h * .82, w, h * .18); ell(c, w / 2, h * .84, w * .42, h * .06, '#6a9a52');
  const cyc = Math.floor(done / 5), st = done % 5, cx = w / 2, base = h * .82, S0 = Math.min(w, h * 1.4);
  const stone = (x, y, ww, hh, col = '#d8d0c0') => { const g = c.createLinearGradient(x, y, x + ww, y); g.addColorStop(0, shade(col, -.15)); g.addColorStop(.4, shade(col, .12)); g.addColorStop(1, shade(col, -.3)); c.fillStyle = g; c.fillRect(x, y, ww, hh) };
  const built = n => st > n || cyc > 0, part = n => st === n ? frac : built(n) ? 1 : 0;
  // vundament
  const fw = S0 * .62, fh = h * .08;
  if (part(0) > 0) { const k = part(0); stone(cx - fw / 2, base - fh * k, fw, fh * k, '#b8b0a0'); if (k >= 1) { stone(cx - fw * .45, base - fh * 1.6, fw * .9, fh * .6, '#c8c0b0') } }
  // sambad
  const top = base - fh * 1.6, ph = h * .32;
  if (part(1) > 0) for (let i = 0; i < 5; i++) { const x = cx - fw * .4 + i * fw * .2, k = Math.min(1, part(1) * 5 - i); if (k > 0) { stone(x - S0 * .018, top - ph * k, S0 * .036, ph * k, '#ece4d4'); if (k >= 1) { rect(c, x - S0 * .025, top - ph - h * .015, S0 * .05, h * .015, '#d0c8b8') } } }
  // kaared
  const at = top - ph - h * .015;
  if (part(2) > 0) { c.save(); c.globalAlpha = Math.max(.25, part(2)); stone(cx - fw * .46, at - h * .05, fw * .92, h * .05, '#e0d8c8'); c.strokeStyle = '#c8c0b0'; c.lineWidth = S0 * .012; for (let i = 0; i < 4; i++) { const x = cx - fw * .3 + i * fw * .2; c.beginPath(); c.arc(x, top - ph * .25, fw * .085, Math.PI, 0); c.stroke() } c.restore() }
  // kuppel
  if (part(3) > 0) { c.save(); c.globalAlpha = Math.max(.25, part(3)); const g = c.createRadialGradient(cx - fw * .1, at - h * .18, 2, cx, at - h * .05, fw * .4); g.addColorStop(0, '#f0f4f8'); g.addColorStop(1, '#8aa8c0'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, at - h * .05, fw * .3, h * .17, 0, Math.PI, 0); c.fill(); c.restore() }
  // kuldne kroon
  if (part(4) > 0) { const y = at - h * .23, r = S0 * .055, a = Math.max(.25, part(4)); c.save(); c.globalAlpha = a; const gl = c.createRadialGradient(cx, y, 0, cx, y, r * 4); gl.addColorStop(0, `rgba(255,220,120,${.6 + Math.sin(t * 2) * .15})`); gl.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = gl; c.fillRect(cx - r * 4, y - r * 4, r * 8, r * 8);
    c.beginPath(); c.moveTo(cx - r, y + r * .5); c.lineTo(cx - r, y - r * .4); c.lineTo(cx - r * .5, y); c.lineTo(cx, y - r * .8); c.lineTo(cx + r * .5, y); c.lineTo(cx + r, y - r * .4); c.lineTo(cx + r, y + r * .5); c.closePath(); c.fillStyle = '#ffc840'; c.fill(); c.restore() }
  // tellingud pooleli etapil
  if (frac < 1 && cyc * 5 + st < 1000) { const y0 = st === 0 ? base - fh * 2 : st === 1 ? top - ph : at - h * .2; c.strokeStyle = 'rgba(120,80,40,.8)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const x = cx - fw * .45 + i * fw * .3; c.beginPath(); c.moveTo(x, base); c.lineTo(x, y0); c.stroke() } for (let y = base - h * .08; y > y0; y -= h * .08) { c.beginPath(); c.moveTo(cx - fw * .45, y); c.lineTo(cx + fw * .45, y); c.stroke() } }
  // lipud
  for (const s of [-1, 1]) { const fx = cx + s * fw * .48; rect(c, fx - 1, base - h * .5, 2, h * .5, '#5a4030'); poly(c, [fx + 1, base - h * .5, fx + 1 + s * 18 + Math.sin(t * 3 + s) * 2, base - h * .46, fx + 1, base - h * .42], s < 0 ? '#c83a2a' : '#2a5ac8') }
  if (cyc) { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(8, 8, 120, 22); c.fillStyle = '#ffd286'; c.font = '700 13px system-ui'; c.textAlign = 'left'; c.fillText(`Monument nr ${cyc + 1}`, 14, 24) }
}
function renderCoopTab() {
  if (!CL.user) return '<h2>Sõbrad</h2><p class="lead">Logi sisse, et teiste kuningriikidega koostööd teha.</p>';
  if (!CO.mon || !CO.list) loadCoop();
  const M = CO.mon;
  let h = `<h2>Sõbrad ja koostöö</h2><p class="lead">Kõik kuningriigid ehitavad koos suurt sõpruse monumenti. Külasta teiste kuningriike ja saada neile sõprusekinke.</p>`;
  if (!M) h += `<div class="card"><p class="lead">${CO.err ? esc(CO.err) : 'Laadin…'}</p></div>`;
  else {
    const st = (M.stage - 1) % 5, needK = Object.keys(M.need), tot = needK.reduce((a, k) => a + +M.need[k], 0), have = needK.reduce((a, k) => a + Math.min(+M.need[k], +(M.have[k] || 0)), 0), frac = tot ? have / tot : 0;
    h += `<div class="card monument"><div class="sec-h" style="margin:0">Sõpruse monument <small>${M.stage}. etapp: ${MON_STAGES[st]}</small></div>
      <canvas class="moncv" data-mon="${M.done}:${frac.toFixed(3)}"></canvas>
      <p class="lead">Valmis etappe: <b>${M.done}</b>. Kui etapp valmib, saavad kõik panustajad kulda, kuulsust ja kogemust. Mida rohkem panustad, seda suurem on preemia. Sinu panus selles etapis: <b>${fmt(M.mine)}</b>. Täna saad veel anda <b>${fmt(Math.max(0, M.cap - M.today))}</b>.</p>
      ${needK.map(k => { const n = +M.need[k], hv = Math.min(n, +(M.have[k] || 0)), left = n - hv, can = Math.max(0, Math.min(Math.floor(S.res[k]), left, M.cap - M.today)); return `<div class="monrow"><div class="monres">${ic(k)}<b>${MON_RES[k]}</b><small class="num">${fmt(hv)} / ${fmt(n)}</small></div><div class="bar ${hv >= n ? 'green' : ''}"><i style="width:${(hv / n * 100).toFixed(1)}%"></i></div><div class="monbtn">${hv >= n ? '<span class="pill ok">Valmis</span>' : [100, 500].map(a => `<button class="btn sm ghost" type="button" data-act="monGive" data-arg="${k}:${a}" ${can >= a && !CO.busy ? '' : 'disabled'}>+${a}</button>`).join('') + `<button class="btn sm" type="button" data-act="monGive" data-arg="${k}:${can}" ${can > 0 && !CO.busy ? '' : 'disabled'}>Anna ${fmt(can)}</button>`}</div></div>` }).join('')}
      ${M.top.length ? `<div class="sec-h">Suurimad panustajad <small>${M.contributors} kuningriiki</small></div><ol class="montop">${M.top.map(x => `<li class="${x.me ? 'me' : ''}"><span>${esc(x.kingdom)}</span><b class="num">${fmt(x.total)}</b></li>`).join('')}</ol>` : '<p class="lead">Ole esimene, kes selle etapi heaks midagi annab!</p>'}</div>`;
  }
  const gifts = giftsToday();
  h += `<div class="card"><div class="sec-h" style="margin:0">Kuningriigid <small>kinke täna ${gifts.length}/3</small></div><p class="lead">Külasta teisi kuningriike ja vaata, kuidas nad elavad. Sõprusekink annab saajale kulda, marju, toitu ja kuulsust ning sulle kuulsust ja kogemust. Päevas saad saata 3 kinki.</p>`;
  if (!CO.list) h += '<p class="lead">Laadin…</p>';
  else { const others = CO.list.filter(x => !x.me); h += others.length ? `<div class="klist">${others.map(x => `<div class="krow"><div><b>${esc(x.kingdom)}</b><small class="lead">${esc(x.name)} · tase ${x.level} · ${fmt(x.fame)} kuulsust</small></div><div class="kbtn"><button class="btn sm ghost" type="button" data-act="visitK" data-arg="${x.id}">Külasta</button><button class="btn sm" type="button" data-act="giftK" data-arg="${x.id}" ${gifts.includes(x.id) || gifts.length >= 3 || CO.busy ? 'disabled' : ''}>${gifts.includes(x.id) ? 'Kingitud ✓' : '🎁 Kingi'}</button></div></div>`).join('')}</div>` : '<p class="lead">Teisi kuningriike veel pole. Kutsu sõbrad mängima!</p>' }
  return h + '</div>';
}
async function monGive(arg) {
  if (CO.busy) return; const [k, a] = arg.split(':'), amt = +a; if (!amt) return;
  CO.busy = true; renderPanel(true);
  try {
    await cloudSave(true); // server peab teadma kuningriigi praegust varu
    const r = await rpc('monument_contribute', { p_res: k, p_amt: amt });
    S.res[k] = Math.max(0, S.res[k] - r.amount); save();
    toast(`Andsid monumendile ${fmt(r.amount)} ${RES[k].g}. Aitäh!`, 'good', 'fame');
    if (r.stage_done) { toast('Monumendi etapp sai valmis! Kõik panustajad saavad preemia.', 'gold', 'fame'); setTimeout(() => claimInbox(), 1500) }
    await cloudSave(true);
  } catch (e) { toast(e.message, 'bad') }
  CO.busy = false; await loadCoop(true);
}
async function giftK(id) {
  if (CO.busy) return; CO.busy = true; renderPanel(true);
  try { const r = await rpc('kingdom_gift_send', { p_user: id }); markGift(id); toast('Sõprusekink on teele saadetud! Said ise ka kuulsust.', 'good', 'fame'); setTimeout(() => claimInbox(), 1200) }
  catch (e) { toast(e.message, 'bad'); if (/juba/.test(e.message)) markGift(id) }
  CO.busy = false; renderPanel(true); if (UI.modalView) renderModal(true);
}
async function visitK(id) {
  let v; try { v = await rpc('kingdom_visit', { p_user: id }) } catch (e) { toast(e.message, 'bad'); return }
  CO.visit = v;
  showModal(() => { const x = CO.visit; if (!x) return null; const gifted = giftsToday().includes(x.user) || x.gifted;
    const tamed = Object.entries(x.tamed || {}).filter(([, n]) => n > 0).map(([k, n]) => `${ANIMALS[k] ? ANIMALS[k].n : k} ×${n}`).join(', ');
    return `<h2>${esc(x.kingdom)}</h2><p class="lead">${typeof rankEmblem === 'function' ? rankEmblem(x.rank) + ' ' + RANKS[x.rank].n + ' · ' : ''}valitseja ${esc(x.name)} · tase ${x.level} · ${fmt(x.fame)} kuulsust · ${x.regions} piirkonda</p>
      <canvas class="visitcv" data-visit="1"></canvas>
      <dl class="stats"><dt>Hooneid Kodumetsas</dt><dd>${x.buildings.length}</dd><dt>Aardeid varakambris</dt><dd>${x.relics}</dd><dt>Loomasõbrad</dt><dd>${tamed || '—'}</dd></dl>
      <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Tagasi koju</button>${x.me ? '' : `<button class="btn" type="button" data-act="giftK" data-arg="${x.user}" ${gifted || giftsToday().length >= 3 ? 'disabled' : ''}>${gifted ? 'Kingitud ✓' : '🎁 Saada sõprusekink'}</button>`}</div>` }, 'wide');
}
function drawVisit(cv2) {
  const x = CO.visit; if (!x || !x.tiles) return;
  const w = cv2.clientWidth || 600, s = w / W, h = s * H, d = Math.min(2, devicePixelRatio || 1); cv2.width = w * d; cv2.height = h * d; cv2.style.height = h + 'px';
  const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const [g1, g2] = REGIONS.kodu.ground;
  c.fillStyle = g1; c.fillRect(0, 0, W * s, H * s); c.globalAlpha = .35; for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if ((xx * 7 + yy * 3) % 5 === 0) { c.fillStyle = g2; c.fillRect(xx * s, yy * s, s + 1, s + 1) } c.globalAlpha = 1;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const t = x.tiles[yy * W + xx]; if (!t) continue; if (t.t === 'water') { c.fillStyle = '#3a86a8'; c.fillRect(xx * s, yy * s, s + 1, s + 1) } }
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) { const t = x.tiles[yy * W + xx]; if (!t || t.t === 'b' || t.t === 'water') continue; try { drawTile(c, t, xx * s, yy * s, s, 0) } catch (e) { } }
    for (const b of x.buildings) if (b.y === yy) { try { drawBuilding(c, b.type, b.x * s, b.y * s, s, { lvl: b.lvl }) } catch (e) { } }
  }
}
{
  const _pt = paintThumbs;
  paintThumbs = function (root) {
    _pt(root);
    root.querySelectorAll('canvas[data-mon]').forEach(cv2 => { const w = cv2.clientWidth || 400, h = cv2.clientHeight || 220, d = 2; cv2.width = w * d; cv2.height = h * d; const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); const [dn, fr] = cv2.dataset.mon.split(':'); drawMonument(c, w, h, +dn, +fr, performance.now() / 1000) });
    root.querySelectorAll('canvas[data-visit]').forEach(drawVisit);
  };
  TABS.sobrad = { n: 'Sõbrad', r: renderCoopTab };
  const o = {}; for (const k in TABS) { if (k !== 'sobrad') o[k] = TABS[k]; if (k === 'edetabel') o.sobrad = TABS.sobrad } if (!o.sobrad) o.sobrad = TABS.sobrad;
  for (const k in TABS) delete TABS[k]; Object.assign(TABS, o);
  Object.assign(ACT, { monGive: a => monGive(a), giftK: a => giftK(a), visitK: a => visitK(a) });
  const _bd = badges;
  badges = function () { const b = _bd(); if (CL.user && CO.list && giftsToday().length < 3 && CO.list.some(x => !x.me)) b.sobrad = 3 - giftsToday().length; return b };
}
setInterval(() => { if (typeof running !== 'undefined' && running && CL.user && UI.tab === 'sobrad') loadCoop() }, 30000);
setTimeout(() => { if (CL.user) loadCoop() }, 8000);
