/* =====================================================================
   Äripartnerid: 8 ettevõtet, usaldus 1–10, serveri loodud juhuslikud tellimused tähtaegadega,
   erisündmused, 24 h ja 7 päeva lepingud ning eripakkumised. Tellimusi haldab server (biz_*):
   kaupa kontrollitakse ja eemaldatakse serveris, iga tellimuse saab täita ainult ühe korra.
   ===================================================================== */
const BZ = { d: null, at: 0, loading: false, busy: false, seen: 0 };
try { BZ.seen = +localStorage.getItem('mk.bizSeen') || 0 } catch (e) { }
const BZ_EV = { double: ['💰', 'Topelthind'], rare: ['💎', 'Haruldane'], royal: ['👑', 'Kuninglik'], mutant: ['🧬', 'Mutant'], bulk: ['📦', 'Suur kogus'], record: ['🏆', 'Rekord'] };
const BZ_UNLOCK = [[2, 'Suuremad tellimused ja parem tasu'], [4, 'Lisaauhinnad: haruldased esemed'], [5, '24 tunni lepingud'], [6, 'Igapäevane eripakkumine'], [8, '7 päeva lepingud ja paremad eripakkumised'], [10, 'Parimad tasud ja ainulaadsed esemed']];
const BZ_OFFER = { tarbed: 'Erisööda pakk', alkeemik: 'Kuldsed soomused', gild: 'Iidne luu', korts: 'Erisööt ja meremeeste lood', muuseum: 'Muuseumi tänukiri' };

FTABS.biz = 'Äripartnerid';
{ // vahekaart Turu järele
  const e = Object.entries(FTABS).filter(([k]) => k !== 'biz'); for (const k of Object.keys(FTABS)) delete FTABS[k];
  for (const [k, v] of e) { FTABS[k] = v; if (k === 'turg') FTABS.biz = 'Äripartnerid' }
  if (!FTABS.biz) FTABS.biz = 'Äripartnerid';
}
FTAB_FN.biz = bzTab;
if (typeof FT_SVG !== 'undefined') FT_SVG.biz = '<path d="M3 11l4-4 4 3 3-2 4 3 3-1"/><path d="M7 7l-4 4 6 6c1 1 2.4 1 3.4 0l5.6-5.6"/><path d="M11 15l1.5 1.5M13.5 12.5l2 2"/><path d="M8.5 13.5l1.5 1.5"/>';

function bzCrest(c, size) {
  const s = size || 54, id = 'cr' + c.id + s;
  return `<svg class="bz-crest" viewBox="0 0 64 72" width="${s}" height="${Math.round(s * 1.125)}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.color}"/><stop offset="1" stop-color="#0d2228"/></linearGradient></defs>
    <path d="M32 3 L59 12 L59 34 C59 52 46 64 32 69 C18 64 5 52 5 34 L5 12 Z" fill="url(#${id})" stroke="#e8b65a" stroke-width="2.5"/>
    <path d="M32 8 L54 15.5 L54 34" stroke="#ffffff" stroke-opacity=".25" stroke-width="1.5" fill="none"/>
    <text x="32" y="44" text-anchor="middle" font-size="26">${c.icon}</text></svg>`;
}
function bzComp(id) { return (BZ.d && BZ.d.companies || []).find(c => c.id === id) || { id, name: id, icon: '🏢', color: '#557' } }
function bzLeft(iso) { const ms = Date.parse(iso) - (Date.now() + (BZ.off || 0)); if (ms <= 0) return 'aegunud'; const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60, ss = Math.floor(ms / 1000) % 60;
  return d ? `${d} p ${h} h` : h ? `${h} h ${String(mm).padStart(2, '0')} min` : `${mm} min ${String(ss).padStart(2, '0')} s` }
function bzWant(o) {
  const w = o.want, chips = [];
  if (w.minw) chips.push(`⚖️ vähemalt ${fKg(+w.minw)}`);
  if (w.rmin && w.type === 'fish') chips.push(`💎 ${RAR2[w.rmin][0]} või haruldasem`);
  if (w.fresh) chips.push(`❄ värskus ≥ ${Math.round(w.fresh * 100)}%`);
  if (w.amin != null && typeof AGE_CLS !== 'undefined' && AGE_CLS[w.amin]) chips.push(`${AGE_CLS[w.amin][1]} vanus: ${AGE_CLS[w.amin][2].toLowerCase()}${w.amin < 4 ? ' või vanem' : ''}`);
  if (w.type === 'hybrid') chips.push(`🧬 ${RAR2[w.rmin || 1][0]} või haruldasem`);
  let pic, name;
  if (w.type === 'fish' && w.species) { pic = `<canvas data-fl="${w.species}" data-r="${(FD.sp[w.species] || {}).rarity || 1}" data-nobg="1"></canvas>`; name = (FD.sp[w.species] || {}).name || w.species }
  else if (w.type === 'fish') { pic = '<span class="bz-big">' + (w.amin >= 3 ? '🏛️' : '🐟') + '</span>'; name = w.amin >= 4 ? 'Mis tahes erakordselt vana kala' : 'Mis tahes kala' }
  else if (w.type === 'item') { pic = typeof gearCv === 'function' ? gearCv('item', w.item, 'gi') : '💎'; name = (FD.item && FD.item[w.item] && FD.item[w.item].name) || w.item }
  else if (w.type === 'mat') { pic = typeof matIc === 'function' ? matIc(w.mat, 48) : '📦'; name = (BZ.d && BZ.d.mats && BZ.d.mats[w.mat]) || w.mat }
  else { pic = '<span class="bz-big">🧬</span>'; name = 'Labori hübriid (muteerunud kala)' }
  const kind = w.type === 'mat' ? (['filee', 'filee_hea'].includes(w.mat) ? 'Fileeritud kala' : 'Töödeldud kaup') : w.type === 'hybrid' ? 'Muteerunud kala' : w.type === 'item' ? 'Aare (Sadama retkedelt ja varahoidlast)' : w.type === 'smoked' ? 'Suitsukala' : 'Toorkala';
  return { pic, name, chips, kind };
}
function bzCard(o) {
  const C = bzComp(o.company), W = bzWant(o), need = o.qty - o.progress, ok = o.have >= need || (o.kind === 'contract' && o.have > 0), act = o.status === 'active';
  const ev = o.event && BZ_EV[o.event], timer = act ? o.deadline : o.offer_until, short = Date.parse(timer) - Date.now() < 30 * 60000;
  return `<div class="bz-card ${o.kind} ${act ? 'act' : ''}" style="--cc:${C.color}">
    <div class="bz-top">${bzCrest(C, 46)}<div><small>${esc(C.name)}</small><h3>${ev ? ev[0] + ' ' : o.kind === 'contract' ? '📜 ' : ''}${esc(o.title)}</h3></div>${ev ? `<span class="bz-ev">${ev[1]}</span>` : o.kind === 'contract' ? '<span class="bz-ev ct">Leping</span>' : ''}</div>
    <div class="bz-want"><div class="bz-pic">${W.pic}</div><div><b>${fmt(o.qty)} × ${esc(W.name)}</b><small>${W.kind}</small><div class="kt-chips">${W.chips.map(c => `<span class="kt-chip">${c}</span>`).join('')}</div></div></div>
    <div class="bz-have ${o.have >= need ? 'ok' : ''}">${o.kind === 'contract' ? `Tarnitud ${fmt(o.progress)}/${fmt(o.qty)} · ` : ''}Sul on sobivat: <b>${fmt(o.have)}/${fmt(need)}</b>
      ${o.kind === 'contract' ? `<div class="kt-bar"><i style="width:${(o.progress / o.qty * 100).toFixed(1)}%"></i></div>` : ''}</div>
    <div class="kt-chips"><span class="kt-chip ok">🪙 ${fmt(o.gold)}</span><span class="kt-chip ok">⭐ ${o.rep} mainet</span><span class="kt-chip ok">🤝 +${o.trust} usaldust</span>${o.bonus ? `<span class="kt-chip ok">🎁 ${RAR2[o.bonus][0]} ese</span>` : ''}</div>
    <div class="bz-time ${short ? 'hot' : ''}">⏳ ${act ? 'Tähtaeg' : 'Pakkumine kehtib'}: <b data-bzt="${timer}">${bzLeft(timer)}</b>${!act ? ` · aega täitmiseks ${o.hours >= 24 ? Math.round(o.hours / 24) + ' p' : o.hours + ' h'}` : ''}</div>
    <div class="kt-act">${act
      ? `<button class="btn sm" type="button" data-bz="deliver" data-arg="${o.id}" ${!ok || BZ.busy ? 'disabled' : ''}>📦 ${o.kind === 'contract' && o.have < need ? `Tarni ${fmt(o.have)}` : 'Anna üle'}</button>`
      : `<button class="btn sm" type="button" data-bz="accept" data-arg="${o.id}" ${BZ.busy ? 'disabled' : ''}>✍️ Võta vastu</button>${o.have >= need ? `<button class="btn sm" type="button" data-bz="deliver" data-arg="${o.id}" ${BZ.busy ? 'disabled' : ''}>📦 Anna kohe üle</button>` : ''}<button class="btn sm ghost" type="button" data-bz="decline" data-arg="${o.id}" ${BZ.busy ? 'disabled' : ''}>Loobu</button>`}</div></div>`;
}
function bzCompCard(c) {
  const pct = c.next ? Math.min(100, (c.pts - c.cur) / Math.max(1, c.next - c.cur) * 100) : 100, nx = BZ_UNLOCK.find(([l]) => l > c.trust);
  const price = c.trust >= 10 ? 1500 : c.trust >= 8 ? 900 : 400;
  return `<div class="bz-co" style="--cc:${c.color}"><div class="bz-top">${bzCrest(c, 58)}<div><h3>${esc(c.name)}</h3><small>${esc(c.descr)}</small></div></div>
    <small class="lead">🛒 Ostab: ${esc(c.likes)}</small>
    <div class="bz-trust"><span class="bz-tl">${c.trust}</span><div><b>Usaldus ${c.trust}/10</b><div class="kt-bar"><i style="width:${pct.toFixed(1)}%"></i></div><small class="lead">${c.next ? `${c.pts}/${c.next} punkti` : 'Täielik usaldus!'} · täidetud ${c.done}${c.failed ? ` · ebaõnnestunud ${c.failed}` : ''}</small></div></div>
    ${nx ? `<small class="lead">🔓 Tase ${nx[0]}: ${nx[1]}</small>` : ''}
    ${c.trust >= 6 ? `<button class="btn sm ${c.offer_ok ? '' : 'ghost'}" type="button" data-bz="offer" data-arg="${c.id}" ${!c.offer_ok || BZ.busy ? 'disabled' : ''}>🎁 ${c.offer_ok ? `Eripakkumine: ${BZ_OFFER[c.id] || 'haruldane ese'} – ${fmt(price)} kulda` : 'Tänane eripakkumine kasutatud'}</button>` : ''}</div>`;
}
function bzTab() {
  if (!BZ.d || Date.now() - BZ.at > 60000) bzLoad(true);
  if (typeof KTK !== 'undefined' && !KTK.d && !KTK.loading) ktLoad(true);
  if (!BZ.d) return '<div class="fv-card"><p class="lead">Laen äripartnereid…</p></div>';
  const D = BZ.d, open = D.orders.filter(o => o.status === 'open'), act = D.orders.filter(o => o.status === 'active');
  const evs = open.filter(o => o.kind !== 'order'), normal = open.filter(o => o.kind === 'order');
  const mx = Math.max(0, ...open.map(o => o.id)); if (mx > BZ.seen) { BZ.seen = mx; try { localStorage.setItem('mk.bizSeen', mx) } catch (e) { } }
  let h = `<div class="fv-card bz-head"><h2>🤝 Äripartnerid</h2><p class="lead">Kuningriigi ettevõtted saadavad sulle tellimusi juhuslikel aegadel. Võta tellimus vastu, too nõutud kaup ja teeni kulda, mainet ning ettevõtte usaldust. Mida suurem usaldus, seda suuremad tellimused, paremad tasud ja eripakkumised.</p>
    <div class="kt-chips"><span class="kt-chip">📋 Pooleli ${D.active_n}/3</span><span class="kt-chip">📬 Uusi pakkumisi ${open.length}</span>${D.next_at ? `<span class="kt-chip">🕐 Järgmine pakkumine umbes <b data-bzt="${D.next_at}">${bzLeft(D.next_at)}</b> pärast</span>` : ''}</div></div>`;
  if (act.length) h += `<div class="fv-card"><h2>📋 Pooleli tellimused</h2><p class="lead">Too kaup enne tähtaega – hilinemine vähendab ettevõtte usaldust.</p><div class="bz-grid">${act.map(bzCard).join('')}</div></div>`;
  if (evs.length) h += `<div class="fv-card bz-evs"><h2>✨ Erisündmused ja lepingud</h2><div class="bz-grid">${evs.map(bzCard).join('')}</div></div>`;
  h += `<div class="fv-card"><h2>📬 Uued pakkumised</h2>${normal.length ? `<div class="bz-grid">${normal.map(bzCard).join('')}</div>` : '<div class="kt-empty">Praegu uusi pakkumisi pole. Ettevõtted saadavad neid juhuslikel aegadel – vaata varsti uuesti!</div>'}</div>`;
  h += `<div class="fv-card"><h2>🏢 Ettevõtted</h2><div class="bz-grid">${D.companies.map(bzCompCard).join('')}</div></div>`;
  if ((D.recent || []).length) h += `<div class="fv-card"><h2>🗂 Viimased tehingud</h2><div class="ka-log">${D.recent.map(r => `<div><span>${bzComp(r.company).icon}</span><span><b>${esc(r.title)}</b><br><small>${esc(bzComp(r.company).name)}</small></span><b>${r.status === 'done' ? '✓ ' + fmt(r.gold) + ' 🪙' : '✗ Ebaõnnestus'}</b></div>`).join('')}</div></div>`;
  return h;
}
async function bzLoad(silent) {
  if (BZ.loading) return; BZ.loading = true; BZ.at = Date.now();
  try { const d = await rpc('biz_state'); bzSet(d) } catch (e) { if (!silent) toast('Äripartnereid ei õnnestunud laadida: ' + e.message, 'bad') }
  BZ.loading = false; if (FV.open && FV.tab === 'biz') renderFV(true);
}
function bzSet(d) { BZ.d = d; BZ.at = Date.now(); BZ.off = Date.parse(d.now) - Date.now() }
async function bzAct(a, arg) {
  if (BZ.busy) return; BZ.busy = true; renderFV(true);
  try {
    if (a === 'accept') { bzSet(await rpc('biz_accept', { p_id: +arg })); toast('✍️ Tellimus vastu võetud! Jälgi tähtaega.', 'good') }
    else if (a === 'decline') { bzSet(await rpc('biz_decline', { p_id: +arg })) }
    else if (a === 'deliver') {
      const d = await rpc('biz_deliver', { p_id: +arg }); bzSet(d); await refreshFS(); if (typeof KTK !== 'undefined') KTK.d = null;
      const r = d.delivered; if (r.done) bzDone(r); else toast(`📦 Tarnitud ${r.took} – leping jätkub!`, 'good');
    } else if (a === 'offer') {
      const d = await rpc('biz_offer', { p_company: arg }); bzSet(d); await refreshFS();
      toast(`🎁 ${bzComp(arg).name}: said ${d.offer.what}${(d.offer.items || []).length ? ' (' + d.offer.items.map(x => FD.item[x.id] ? FD.item[x.id].name : x.id).join(', ') + ')' : ''}!`, 'gold', 'gold');
    }
  } catch (e) { toast(e.message, 'bad') }
  BZ.busy = false; renderFV(true);
}
function bzDone(r) {
  const C = bzComp(r.company);
  showModal(() => `<div class="kt-res">${bzCrest(C, 76)}<h2 style="margin:0">Tellimus täidetud!</h2><p class="lead" style="margin:0"><b>${esc(C.name)}</b> on rahul: „${esc(r.title)}“</p>
    <div class="kt-got"><div><span style="font-size:30px">🪙</span><b>+${fmt(r.gold)}</b><small>kulda</small></div><div><span style="font-size:30px">⭐</span><b>+${r.rep}</b><small>mainet</small></div>
    ${(r.items || []).map(x => `<div class="rare"><span style="font-size:30px">🎁</span><b>${esc(FD.item[x.id] ? FD.item[x.id].name : x.id)}</b><small>lisaauhind</small></div>`).join('')}</div>
    ${r.trust_up ? `<p style="margin:0;font-weight:900;color:#ffe08a">🤝 Usaldus tõusis ${r.trust_up}. tasemele!${(BZ_UNLOCK.find(([l]) => l === r.trust_up) || [])[1] ? ' Avanes: ' + BZ_UNLOCK.find(([l]) => l === r.trust_up)[1] : ''}</p>` : ''}
    <div class="mbtns" style="justify-content:center"><button class="btn" type="button" data-act="closeModal">Suurepärane!</button></div></div>`, 'bzmodal');
  if (typeof sfx === 'function') sfx(r.trust_up ? 'levelup' : 'chime');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-bz]'); if (b && !b.disabled) { bzAct(b.dataset.bz, b.dataset.arg); return }
  if (e.target.closest('[data-bz-go]')) { FV.tab = 'biz'; renderFV(true); const fv = document.getElementById('fishView'); if (fv) fv.scrollTop = 0 }
});
// taimerid uuenevad iga sekund; kui midagi aegub, laetakse seis serverist uuesti
setInterval(() => {
  let gone = false;
  document.querySelectorAll('[data-bzt]').forEach(el => { const t = bzLeft(el.dataset.bzt); el.textContent = t; if (t === 'aegunud') gone = true });
  if (gone && FV.open && FV.tab === 'biz' && Date.now() - BZ.at > 5000) bzLoad(true);
}, 1000);
// märk menüüs ja teade uue pakkumise kohta (server loob tellimusi ka siis, kui see vaade pole lahti)
{
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); const s = FS && FS.biz; if (!s) return b; const n = (s.max > BZ.seen ? s.open : 0) + (s.ready || 0); if (n) b.biz = n; return b };
  const _r = renderFV;
  renderFV = function () {
    const r = _r.apply(this, arguments); const s = FS && FS.biz;
    if (s && s.max > (BZ.toasted || BZ.seen) && FV.open && FV.tab !== 'biz') { BZ.toasted = s.max; toast('📬 Uus äripakkumine! Vaata Äripartnerite alt.', 'gold', 'gold') }
    return r;
  };
}
document.head.insertAdjacentHTML('beforeend', `<style>
.bz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.bz-card{overflow:hidden}
.bz-card,.bz-co{position:relative;display:grid;gap:9px;align-content:start;padding:14px;border-radius:16px;
  background:radial-gradient(120% 80% at 0% 0%,color-mix(in srgb,var(--cc) 22%,transparent),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.2));
  border:1px solid color-mix(in srgb,var(--cc) 45%,rgba(134,205,224,.16));box-shadow:0 6px 16px rgba(0,0,0,.22)}
.bz-card.act{box-shadow:0 0 0 1px rgba(130,245,230,.4),0 0 16px rgba(70,208,198,.18)}
.bz-card.event,.bz-card.contract{border-color:rgba(232,182,90,.6);background:radial-gradient(120% 80% at 0% 0%,rgba(232,182,90,.22),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.2))}
.bz-card.event::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(110deg,transparent 35%,rgba(255,230,160,.14) 50%,transparent 65%);transform:translateX(-100%);animation:bzSweep 4.5s ease-in-out infinite;overflow:hidden}
.bz-top{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}
.bz-top h3{margin:1px 0 0;font-size:16.5px;line-height:1.2}.bz-top small{color:#a9c4c8;font-size:12.5px;line-height:1.35;display:block}
.bz-crest{filter:drop-shadow(0 4px 6px rgba(0,0,0,.4));flex:none}
.bz-ev{align-self:start;font-size:11.5px;font-weight:900;padding:3px 9px;border-radius:999px;background:#e8b65a;color:#2a1a06;white-space:nowrap}
.bz-ev.ct{background:#8a5ad8;color:#fff}
.bz-want{display:grid;grid-template-columns:96px minmax(0,1fr);gap:10px;align-items:center;padding:8px;border-radius:12px;background:rgba(0,0,0,.22)}
.bz-pic{display:grid;place-items:center;height:56px}.bz-pic canvas{width:96px;height:52px}.bz-big{font-size:34px}
.bz-want b{display:block;font-size:15px}.bz-want small{display:block;color:#a9c4c8;font-size:12px;margin-bottom:4px}
.bz-have{font-size:13.5px;color:#ffc8b8}.bz-have.ok{color:#9ff0b8}.bz-have .kt-bar i{background:linear-gradient(90deg,#2fb5c4,#7fe8e0)}
.bz-time{font-size:13px;color:#cfe0da}.bz-time.hot{color:#ff9f8a}.bz-time b{font-variant-numeric:tabular-nums}
.bz-trust{display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center}
.bz-tl{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-weight:900;font-size:20px;color:#fff6dc;background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--cc) 70%,#fff 10%),#14343f 80%);box-shadow:0 0 0 2px #e8b65a}
.bz-co h3{margin:0;font-size:17px}
@keyframes bzSweep{0%,55%{transform:translateX(-100%)}85%,100%{transform:translateX(100%)}}
@media (max-width:600px){.bz-grid{grid-template-columns:1fr}.bz-want{grid-template-columns:76px minmax(0,1fr)}.bz-pic canvas{width:76px;height:42px}}
@media (prefers-reduced-motion:reduce){.bz-card.event::after{animation:none}}
</style>`);
