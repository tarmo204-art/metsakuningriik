/* =====================================================================
   Kalastuskaardid: õigus püügiviisidele ja püügikohtadele.
   Kehtivust kontrollib server oma kella järgi (license_state, license_buy2, fx_lic_check).
   Kaardi aegumine ei kustuta püütud kalu ega katkesta pooleliolevat püüki ega vees olevaid püüniseid –
   kaarti on vaja ainult uue viske või uue püünise vettepanekuks.
   ===================================================================== */
const KA = { d: null, at: 0, busy: false, conf: null, focus: null, fresh: null, off: 0 };
const LIC_N = { harrastus: 'Harrastuskaluri kaart', vork: 'Nakkevõrgu kaart', pyynis: 'Püüniste kaart', sugavee: 'Süvaveekaluri kaart', kuninglik: 'Kuninglik kalastuskaart' };
const LIC_IC = { harrastus: '🎣', vork: '🕸️', pyynis: '🪤', sugavee: '🚤', kuninglik: '👑' };
function licNeed(spot) { return spot === 'metsajarv' ? [] : spot === 'avameri' || spot === 'sugavik' ? ['harrastus', 'sugavee'] : spot === 'kuningatiik' ? ['harrastus', 'kuninglik'] : ['harrastus'] }
function kaNow() { return Date.now() + KA.off }
function licOk(k) { const u = FS && FS.lic && FS.lic[k]; return !!u && Date.parse(u) > kaNow() }
// esimene puuduv kaart selle koha jaoks (või null, kui kõik on korras)
function licMiss(spot) { if (!FS || !FS.lic) return null; return licNeed(spot).find(k => !licOk(k)) || null }

FTABS.kaardid = '🎫 Kaardid';
{ // vahekaart kohe pärast Töökoda
  const e = Object.entries(FTABS).filter(([k]) => k !== 'kaardid'); for (const k of Object.keys(FTABS)) delete FTABS[k];
  for (const [k, v] of e) { FTABS[k] = v; if (k === 'tookoda') FTABS.kaardid = '🎫 Kaardid' }
  if (!FTABS.kaardid) FTABS.kaardid = '🎫 Kaardid';
}
FTAB_FN.kaardid = kaTab;
if (typeof FT_SVG !== 'undefined') FT_SVG.kaardid = '<rect x="2.5" y="5.5" width="19" height="13" rx="2.2"/><circle cx="8.3" cy="11" r="2.2"/><path d="M5.2 16c.6-1.5 1.7-2.2 3.1-2.2s2.5.7 3.1 2.2"/><path d="M14 10h4.5M14 13h3"/>';

document.head.insertAdjacentHTML('beforeend', `<style>
.ka-need-t{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px}
.ka-need-t td{padding:7px 8px;border-top:1px solid rgba(255,255,255,.08);vertical-align:top}
.ka-need-t td:first-child{color:#d6e2de}.ka-need-t td:last-child{font-weight:700;text-align:right}
.ka-need-t .ok{color:#8fe0a0}.ka-need-t .no{color:#ffb4a0}.ka-need-t .free{color:#a9bfb8;font-weight:600}
.ka-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:16px;margin-top:4px}
.ka-blk{display:grid;gap:10px;align-content:start;padding:14px;border-radius:18px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.06)}
.ka-blk.focus{animation:kaFocus 1.6s ease 2;border-color:#f2b552}
.ka-card{--a:#2f7a4a;--b:#7cc48a;--ink:#f6fff6;position:relative;aspect-ratio:1.586;border-radius:16px;overflow:hidden;color:var(--ink);padding:14px 16px;display:grid;grid-template-rows:auto 1fr auto;
  background:radial-gradient(120% 90% at 100% 0%,color-mix(in srgb,var(--b) 70%,transparent),transparent 60%),linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 55%,#000));
  box-shadow:0 10px 26px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.25)}
.ka-card::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.22;
  background:repeating-radial-gradient(circle at 78% 120%,transparent 0 9px,rgba(255,255,255,.55) 9px 10px),repeating-linear-gradient(115deg,transparent 0 14px,rgba(255,255,255,.12) 14px 15px)}
.ka-card > *{position:relative}
.ka-card.c-roheline{--a:#2a6a40;--b:#86d090}
.ka-card.c-sinine{--a:#1c4f8a;--b:#70b8ee}
.ka-card.c-pruun{--a:#5e3a1c;--b:#d0965a}
.ka-card.c-lilla{--a:#43246e;--b:#b48af0}
.ka-card.c-kuldne{--a:#7a4e0a;--b:#ffd868;--ink:#fffaf0}
.ka-card.c-kuldne::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 35%,rgba(255,250,210,.35) 50%,transparent 65%);transform:translateX(-100%);animation:kaSweep 4.5s ease-in-out infinite}
.ka-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ka-org{font-size:10.5px;font-weight:800;letter-spacing:.14em;opacity:.85}
.ka-chip{width:34px;height:26px;border-radius:6px;background:linear-gradient(135deg,#f6e2a0,#b8902e);box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);position:relative}
.ka-chip::after{content:"";position:absolute;inset:6px 4px;border:1px solid rgba(90,60,10,.45);border-radius:3px}
.ka-mid{display:flex;align-items:center;gap:12px}
.ka-ic{width:54px;height:54px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:28px;background:rgba(255,255,255,.16);box-shadow:inset 0 0 0 2px rgba(255,255,255,.3)}
.ka-name{display:block;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:21px;line-height:1.1;text-shadow:0 1px 6px rgba(0,0,0,.35)}
.ka-holder{display:block;font-size:14px;font-weight:700;opacity:.95;margin-top:3px}
.ka-holder small{font-weight:600;opacity:.75;font-size:11.5px}
.ka-bot{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
.ka-bot small{display:block;font-size:10.5px;opacity:.75;font-weight:600}
.ka-bot b{font-size:13.5px;font-variant-numeric:tabular-nums}
.ka-st{display:inline-block;font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.3)}
.ka-st.ok{background:#e8fff0;color:#1d6b2e}.ka-st.soon{background:#fff0c8;color:#8a5a00}.ka-st.no{background:#ffe2dc;color:#9a2a1a}.ka-st.none{background:rgba(255,255,255,.2);color:#fff}
.ka-card.expired .ka-org{visibility:hidden}
.ka-stamp{position:absolute!important;left:14px;top:12px;transform:rotate(-6deg);border:3px solid #ff6a5a;color:#ff6a5a;font-weight:900;letter-spacing:.12em;font-size:16px;padding:1px 9px;border-radius:7px;background:rgba(40,0,0,.25)}
.ka-card.expired,.ka-card.locked{filter:saturate(.35) brightness(.8)}
.ka-card.none{filter:saturate(.7) brightness(.85)}
.ka-card.fresh{animation:kaNew .9s cubic-bezier(.2,1.4,.4,1) both}
.ka-info{display:grid;gap:6px;font-size:13.5px;line-height:1.45}
.ka-info p{margin:0;color:#dbe6e2}
.ka-info .gv{color:#fff}
.ka-left{font-weight:800;color:#ffe0a0;font-variant-numeric:tabular-nums}
.ka-req{list-style:none;margin:0;padding:0;display:grid;gap:3px;font-size:13px}
.ka-req li.ok{color:#8fe0a0}.ka-req li.no{color:#ffb4a0}
.ka-act{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.ka-price{font-size:13px;color:#a9bfb8}.ka-price b{color:#ffe0a0}
.ka-log{display:grid;gap:6px;margin-top:8px}
.ka-log div{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:8px;align-items:center;font-size:13px;padding:7px 10px;border-radius:10px;background:rgba(0,0,0,.18)}
.ka-log small{color:#a9bfb8}
.ka-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:12px}
.ka-mini button{all:unset;cursor:pointer;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;padding:10px 12px;border-radius:14px;color:#fff;
  background:linear-gradient(135deg,var(--a),color-mix(in srgb,var(--a) 55%,#000));box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.ka-mini button:focus-visible{outline:2px solid #f2b552;outline-offset:2px}
.ka-mini .ic{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:rgba(255,255,255,.16)}
.ka-mini b{display:block;font-size:14px}.ka-mini small{font-size:12px;opacity:.9}
.ka-need{margin:4px 0 6px;padding:8px 10px;border-radius:10px;background:rgba(242,181,82,.12);color:#ffe0a0;font-size:13px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ka-royalc{background:linear-gradient(160deg,rgba(242,181,82,.16),rgba(0,0,0,.15) 60%)!important;border:1px solid rgba(242,181,82,.35)}
@keyframes kaSweep{0%,50%{transform:translateX(-100%)}85%,100%{transform:translateX(100%)}}
@keyframes kaNew{0%{opacity:0;transform:rotateY(80deg) scale(.9)}100%{opacity:1;transform:none}}
@keyframes kaFocus{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 4px rgba(242,181,82,.45)}}
@media (max-width:420px){.ka-grid{grid-template-columns:1fr}.ka-card{padding:12px 13px}.ka-name{font-size:18px}.ka-ic{width:44px;height:44px;font-size:22px}}
@media (prefers-reduced-motion:reduce){.ka-card::after,.ka-card.fresh,.ka-blk.focus{animation:none!important}}
</style>`);

function kaDate(t) { const d = new Date(t); return `${d.toLocaleDateString('et-EE', { day: 'numeric', month: 'numeric', year: 'numeric' })} kell ${d.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' })}` }
function kaLeft(ms) { if (ms <= 0) return 'aegunud'; const m = Math.floor(ms / 60000), dd = Math.floor(m / 1440), hh = Math.floor(m % 1440 / 60), mm = m % 60; return dd ? `jäänud ${dd} p ${hh} h` : hh ? `jäänud ${hh} h ${mm} min` : `jäänud ${mm} min` }
function kaStatus(t) {
  const u = t.until ? Date.parse(t.until) : 0, left = u - kaNow();
  if (!u) return t.can ? ['none', 'Ostmata'] : ['locked', 'Lukus'];
  if (left <= 0) return ['expired', 'Aegunud'];
  if (left < Math.min(2, t.days / 3) * 864e5) return ['soon', 'Aegub peagi'];
  return ['ok', 'Kehtib'];
}
async function kaLoad(force) {
  if (KA.loading) return; KA.loading = true; KA.at = Date.now();
  try {
    const d = await rpc('license_state'); KA.d = d; KA.at = Date.now(); KA.off = Date.parse(d.now) - Date.now();
    if (FS) { FS.lic = {}; d.types.forEach(t => { if (t.until) FS.lic[t.id] = t.until }) }
  } catch (e) { toast('Kalastuskaarte ei õnnestunud laadida: ' + e.message, 'bad') }
  KA.loading = false;
  if (FV.open && FV.tab === 'kaardid') renderFV(true);
}
function kaCard(t, nm) {
  const [st, sl] = kaStatus(t), cls = st === 'expired' ? 'expired' : st === 'locked' ? 'locked' : st === 'none' ? 'none' : '';
  return `<div class="ka-card c-${t.color} ${cls} ${KA.fresh === t.id ? 'fresh' : ''}" role="img" aria-label="${esc(t.name)}: ${sl}">
    <div class="ka-top"><span class="ka-org">METSAKUNINGRIIGI KALASTUSKAART</span><span class="ka-chip"></span></div>
    <div class="ka-mid"><span class="ka-ic">${t.icon}</span><div><b class="ka-name">${esc(t.name)}</b><span class="ka-holder"><small>Omanik:</small> ${esc(nm || 'Kalur')}</span></div></div>
    <div class="ka-bot"><div><small>Kehtib kuni</small><b>${t.until ? kaDate(t.until) : '—'}</b></div><div style="text-align:right"><small>Staatus</small><span class="ka-st ${st === 'expired' || st === 'locked' ? 'no' : st}">${sl}</span></div></div>
    ${st === 'expired' ? '<span class="ka-stamp">AEGUNUD</span>' : ''}</div>`;
}
function kaBlock(t, d) {
  const [st] = kaStatus(t), live = st === 'ok' || st === 'soon', u = t.until ? Date.parse(t.until) : 0;
  const req = [[`Kalapüügi ${t.min_level}. tase`, d.level >= t.min_level, t.min_level > 1], [`Püütud vähemalt ${fmt(t.need_total)} kala (sul ${fmt(d.total)})`, d.total >= t.need_total, t.need_total > 0], [`Vähemalt ${t.need_ach} saavutust (sul ${d.ach})`, d.ach >= t.need_ach, t.need_ach > 0]].filter(x => x[2]);
  const capped = live && u - kaNow() > t.days * 2 * 864e5, conf = KA.conf === t.id;
  const label = live ? `Pikenda +${t.days} päeva` : t.until ? 'Uuenda kaart' : 'Osta kaart';
  const dis = KA.busy || !t.can || capped || FS.gold < t.price;
  return `<div class="ka-blk ${KA.focus === t.id ? 'focus' : ''}" id="ka-${t.id}">${kaCard(t, d.name)}
    <div class="ka-info"><p>${esc(t.descr)}</p><p class="gv"><b>Annab:</b> ${esc(t.gives)}</p>
      ${live ? `<p class="ka-left" data-kaleft="${t.until}">⏳ ${kaLeft(u - kaNow())}</p>` : ''}
      ${req.length ? `<ul class="ka-req">${req.map(([x, ok]) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${x}</li>`).join('')}</ul>` : ''}
      <div class="ka-act"><span class="ka-price">Hind <b>${fmt(t.price)} kulda</b> · kehtib ${t.days} päeva${live ? '<br>Pikendamisel lisandub aeg praegusele lõppkuupäevale.' : ''}</span>
        <button class="btn sm ${conf ? '' : live ? 'ghost' : ''}" type="button" data-ka-buy="${t.id}" ${dis ? 'disabled' : ''}>${conf ? `Kinnita: ${fmt(t.price)} 🪙` : label}</button></div>
      ${capped ? `<p class="lead" style="font-size:12px">Pikendada saab, kui kaardi kehtivusest on jäänud alla ${t.days * 2} päeva.</p>` : !t.can ? '<p class="lead" style="font-size:12px">🔒 Täida nõuded, et kaarti osta.</p>' : FS.gold < t.price ? '<p class="lead" style="font-size:12px">Kulda jääb puudu.</p>' : ''}</div></div>`;
}
function kaTab() {
  const d = KA.d;
  if (Date.now() - KA.at > 60000) kaLoad();
  if (!d) return '<div class="fv-card"><p class="lead">Laadin kalastuskaarte…</p></div>';
  const T = Object.fromEntries(d.types.map(t => [t.id, t])), ok = k => T[k] && T[k].until && Date.parse(T[k].until) > kaNow();
  const row = (what, k) => `<tr><td>${what}</td><td class="${!k ? 'free' : ok(k) ? 'ok' : 'no'}">${!k ? 'Kaarti pole vaja' : `${LIC_IC[k]} ${LIC_N[k]} ${ok(k) ? '✓' : '✗'}`}</td></tr>`;
  let h = `<div class="fv-card"><h2>🎫 Kalastuskaardid</h2><p class="lead">Kalastuskaardid annavad sulle õiguse kasutada erinevaid püügivahendeid, avada uusi püügivõimalusi ja pääseda eripüügikohtadesse. Kaardi kehtivust kontrollitakse serveri aja järgi.</p>
    <p class="lead">Kui kaart aegub, jäävad püütud kalad alles ja pooleli olev püük ning vees olevad püünised lõpevad tavapäraselt – uut viset või püünist ilma kehtiva kaardita teha ei saa.</p>
    <h3 style="margin:12px 0 0">Mida mul vaja on?</h3><table class="ka-need-t"><tbody>
      ${row('🎣 Õngepüük Metsajärves', null)}${row('🎣 Õngepüük teistes püügikohtades', 'harrastus')}${row('🕸️ Nakkevõrk', 'vork')}${row('🪤 Mõrd, katiska ja vähimõrd', 'pyynis')}
      ${row('🚤 Avameri ja Sügavik', 'sugavee')}${row('👑 Kuninga tiik ja Kuninglik nädalavõistlus', 'kuninglik')}</tbody></table></div>
    <div class="ka-grid">${d.types.map(t => kaBlock(t, d)).join('')}</div>`;
  if ((d.log || []).length) h += `<div class="fv-card" style="margin-top:16px"><h2>Ostuajalugu</h2><p class="lead">Kõik kaartide ostud ja pikendamised on salvestatud sinu kontole.</p><div class="ka-log">${d.log.map(g => `<div><span>${LIC_IC[g.kind] || '🎫'}</span><span><b>${esc(g.what)}:</b> ${esc(LIC_N[g.kind] || g.kind)}<br><small>${kaDate(g.at)} · kehtib kuni ${kaDate(g.until)}</small></span><b>${g.price ? fmt(g.price) + ' 🪙' : 'tasuta'}</b></div>`).join('')}</div></div>`;
  if (KA.focus) setTimeout(() => { const el = document.getElementById('ka-' + KA.focus); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); KA.focus = null }, 120);
  if (KA.fresh) setTimeout(() => { KA.fresh = null }, 1200);
  return h;
}
// väike kaardiriba teistes vaadetes (nt Püünised)
function kaMini(kinds) {
  const col = { harrastus: '#2a6a40', vork: '#1c4f8a', pyynis: '#5e3a1c', sugavee: '#43246e', kuninglik: '#7a4e0a' };
  return `<div class="ka-mini">${kinds.map(k => { const u = FS && FS.lic && FS.lic[k], ok = licOk(k);
    return `<button type="button" data-ka-go="${k}" style="--a:${col[k]}"><span class="ic">${LIC_IC[k]}</span><span><b>${LIC_N[k]}</b><small>${ok ? `✓ Kehtib kuni ${kaDate(u)}` : u ? '✗ Aegunud – vajuta, et pikendada' : '✗ Kaarti pole – vajuta, et osta'}</small></span></button>` }).join('')}</div>`;
}
document.addEventListener('click', async e => {
  const g = e.target.closest('[data-ka-go]');
  if (g) { KA.focus = g.dataset.kaGo; FV.tab = 'kaardid'; renderFV(true); return }
  const b = e.target.closest('[data-ka-buy]'); if (!b || KA.busy) return;
  const id = b.dataset.kaBuy;
  if (KA.conf !== id) { KA.conf = id; renderFV(true); setTimeout(() => { if (KA.conf === id) { KA.conf = null; if (FV.tab === 'kaardid') renderFV(true) } }, 6000); return }
  KA.busy = true; KA.conf = null; renderFV(true);
  try {
    const r = await rpc('license_buy2', { p_kind: id }); KA.d = r; KA.at = Date.now(); KA.off = Date.parse(r.now) - Date.now(); KA.fresh = id;
    await refreshFS(); FS.lic = {}; r.types.forEach(t => { if (t.until) FS.lic[t.id] = t.until });
    if (typeof KV !== 'undefined') KV.d = null;
    toast(`${LIC_N[id]} ${r.ext ? 'pikendatud' : 'on nüüd sinu oma'}! Kehtib kuni ${kaDate(r.until)}.`, 'good', 'fish'); if (typeof sfx === 'function') sfx('chime');
  } catch (er) { toast(er.message, 'bad') }
  KA.busy = false; renderFV(true);
});
// järelejäänud aeg uueneb ise; kui kaart aegub, joonistatakse vaade uuesti
setInterval(() => {
  let gone = false;
  document.querySelectorAll('[data-kaleft]').forEach(el => { const left = Date.parse(el.dataset.kaleft) - kaNow(); if (left <= 0) gone = true; else el.textContent = '⏳ ' + kaLeft(left) });
  if (gone && FV.open && FV.tab === 'kaardid') renderFV(true);
}, 30000);
// märk vahekaardil: mõni ostetud kaart aegub peagi või on hiljuti aegunud
{
  const _b = fvBadges;
  fvBadges = function () {
    const b = _b(); if (!FS || !FS.lic) return b;
    const n = Object.entries(FS.lic).filter(([k, u]) => { const left = Date.parse(u) - kaNow(); return left < 2 * 864e5 && left > -3 * 864e5 }).length;
    if (n) b.kaardid = n; return b;
  };
}
