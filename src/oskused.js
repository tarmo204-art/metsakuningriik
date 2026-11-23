/* =====================================================================
   Kaluri oskuste puu
   Iga kalapüügi tase annab 1 oskuspunkti. Kolm haru (Püügivõte, Kalateadmised, Kaubandus),
   igas 4 oskust, igaüks kuni 5 astet. Haru järgmine oskus avaneb, kui harus on 3 punkti rohkem.
   Kõik boonused arvestab server (fx_sk), siin on ainult vaade.
   ===================================================================== */
const OSK = { d: null, loading: false, err: '', busy: false, pop: '' };
const OSK_BR = {
  vote: { name: 'Püügivõte', sub: 'Kiirem näkk, tugevam õng ja säästlikum sööt', c: '#5fd4c4', c2: '#1f6f6a' },
  tead: { name: 'Kalateadmised', sub: 'Rohkem kogemust, haruldasi ja hiiglaslikke kalu', c: '#a99bff', c2: '#4a3f9a' },
  kaup: { name: 'Kaubandus', sub: 'Parem hind, rohkem aardeid ja kiirem droon', c: '#f4c15d', c2: '#8a5a14' }
};
document.head.insertAdjacentHTML('beforeend', `<style>
.osk-top{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}
.osk-pts{position:relative;width:78px;height:78px;border-radius:50%;display:grid;place-items:center;text-align:center;
  background:radial-gradient(circle at 50% 35%,rgba(255,214,130,.25),rgba(0,0,0,.25) 70%);box-shadow:inset 0 0 0 2px rgba(255,210,130,.45),0 0 24px rgba(255,190,90,.15)}
.osk-pts b{display:block;font:800 30px/1 var(--f-body);color:#ffe2a0}
.osk-pts small{display:block;font-size:10.5px;color:#cdbb92;margin-top:2px}
.osk-pts.zero{box-shadow:inset 0 0 0 2px rgba(160,190,200,.25)}.osk-pts.zero b{color:#b9c8cc}
.osk-top h2{margin:0}.osk-top p{margin:2px 0 0;font-size:13.5px;color:var(--muted)}
.osk-tree{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.osk-br{--c:#5fd4c4;--c2:#1f6f6a;position:relative;border-radius:16px;padding:14px 12px 12px;background:linear-gradient(180deg,color-mix(in srgb,var(--c2) 38%,rgba(10,24,30,.9)),rgba(10,24,30,.85) 60%);
  border:1px solid color-mix(in srgb,var(--c) 30%,transparent);display:grid;gap:0;align-content:start}
.osk-bh{display:grid;gap:2px;margin-bottom:10px}
.osk-bh b{font-family:var(--f-head);font-size:18px;color:var(--c)}
.osk-bh small{font-size:12.5px;color:var(--muted)}
.osk-bh .in{font-size:12px;color:#d8e4e8}
.osk-n{position:relative;display:grid;grid-template-columns:54px 1fr;gap:10px;align-items:center;padding:8px 0}
.osk-n + .osk-n::before{content:"";position:absolute;left:26px;top:-10px;width:3px;height:22px;border-radius:2px;background:rgba(255,255,255,.08)}
.osk-n.open + .osk-n.open::before{background:linear-gradient(var(--c),color-mix(in srgb,var(--c) 40%,transparent));box-shadow:0 0 8px var(--c)}
.osk-m{position:relative;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;font-size:24px;border:0;padding:0;cursor:pointer;
  background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--c) 45%,#14232a),#0b161b 75%);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--c) 70%,transparent),0 4px 12px rgba(0,0,0,.4);
  transition:transform .15s,box-shadow .2s}
.osk-m:hover:not(:disabled){transform:scale(1.06)}
.osk-m:active:not(:disabled){transform:scale(.95)}
.osk-m:disabled{cursor:default}
.osk-n.lock .osk-m{filter:grayscale(1) brightness(.6);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)}
.osk-n.max .osk-m{box-shadow:inset 0 0 0 2px #ffe2a0,0 0 16px color-mix(in srgb,var(--c) 60%,transparent)}
.osk-m .plus{position:absolute;right:-3px;bottom:-3px;width:20px;height:20px;border-radius:50%;background:var(--c);color:#0b1a1e;font:900 15px/20px var(--f-body);box-shadow:0 0 0 2px #0f1f25}
.osk-m.pop{animation:oskPop .5s cubic-bezier(.2,.9,.3,1.4)}
@keyframes oskPop{0%{transform:scale(.8)}60%{transform:scale(1.18);box-shadow:inset 0 0 0 2px #fff,0 0 30px var(--c)}100%{transform:scale(1)}}
.osk-t{min-width:0;display:grid;gap:3px}
.osk-t b{font-size:15px;color:#eef4f0}
.osk-t span{font-size:12.5px;color:var(--muted);line-height:1.3}
.osk-t .v{font-size:12.5px;color:#d8e8e4}.osk-t .v i{font-style:normal;color:var(--c);font-weight:700}
.osk-pip{display:flex;gap:3px}.osk-pip i{width:14px;height:5px;border-radius:3px;background:rgba(255,255,255,.12)}.osk-pip i.on{background:var(--c);box-shadow:0 0 6px var(--c)}
.osk-lock{font-size:12px;color:#c9a46a}
.osk-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
@media (max-width:760px){.osk-tree{grid-template-columns:1fr}.osk-top{grid-template-columns:auto 1fr}.osk-top .btn{grid-column:1/-1}}
@media (prefers-reduced-motion:reduce){.osk-m.pop{animation:none}}
</style>`);

async function oskLoad(force) {
  if (OSK.loading || (!force && OSK.d && Date.now() - OSK.d._at < 30000)) return;
  OSK.loading = true;
  try { OSK.d = await rpc('skills_state'); OSK.d._at = Date.now(); OSK.err = '' } catch (e) { OSK.err = e.message }
  OSK.loading = false; if (FV.open && FV.tab === 'oskused') renderFV(true);
}
function oskVal(d, r) { const v = +d.per * r; return (Math.round(v * 10) / 10).toString().replace('.', ',') }
function oskNode(d, rk, inBr, free) {
  const r = +rk[d.id] || 0, need = d.tier * 3, open = inBr >= need, max = r >= d.max, can = open && !max && free > 0 && !OSK.busy;
  const cls = ['osk-n', open ? 'open' : 'lock', max ? 'max' : ''].join(' ');
  const now = r ? `Praegu <i>+${oskVal(d, r)}${d.unit}</i>` : 'Pole veel õpitud';
  const nxt = max ? ' · täielikult arendatud' : open ? ` · järgmine aste <i>+${oskVal(d, r + 1)}${d.unit}</i>` : '';
  return `<div class="${cls}"><button type="button" class="osk-m ${OSK.pop === d.id ? 'pop' : ''}" data-osk="${d.id}" ${can ? '' : 'disabled'}
      aria-label="${esc(d.name)}: aste ${r}/${d.max}${can ? '. Õpi järgmine aste' : ''}">${d.icon}${can ? '<span class="plus" aria-hidden="true">+</span>' : ''}</button>
    <div class="osk-t"><b>${esc(d.name)}</b><span>${esc(d.descr)}</span>
      <div class="osk-pip" aria-hidden="true">${Array.from({ length: d.max }, (_, i) => `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</div>
      ${open ? `<div class="v">${now}${nxt}</div>` : `<div class="osk-lock">🔒 Avaneb, kui sellesse harusse on pandud ${need} punkti (praegu ${inBr})</div>`}</div></div>`;
}
function oskTab() {
  if (!OSK.d) { oskLoad(); return `<div class="fv-card"><p class="lead">${OSK.err ? esc(OSK.err) : 'Laen oskusi…'}</p></div>` }
  const d = OSK.d, rk = d.ranks || {}, free = +d.free;
  let h = `<div class="fv-card"><div class="osk-top"><div class="osk-pts ${free ? '' : 'zero'}"><div><b>${free}</b><small>${free === 1 ? 'vaba punkt' : 'vaba punkti'}</small></div></div>
    <div><h2>Kaluri oskused</h2><p>Iga kalapüügi tase annab ühe oskuspunkti. Kasutatud ${d.spent}/${d.points}. Vali, milline kalur sinust saab – kiire püüdja, kalade tundja või osav kaupmees.</p></div>
    <button class="btn ghost sm" type="button" data-osk-reset ${d.spent ? '' : 'disabled'}>${d.reset_cost ? `Jaga ümber · ${fmt(d.reset_cost)} kulda` : 'Jaga ümber (tasuta)'}</button></div></div>`;
  h += '<div class="osk-tree">';
  for (const b of Object.keys(OSK_BR)) {
    const B = OSK_BR[b], defs = d.defs.filter(x => x.branch === b).sort((a, c) => a.tier - c.tier);
    const inBr = defs.reduce((s, x) => s + (+rk[x.id] || 0), 0), mx = defs.reduce((s, x) => s + x.max, 0);
    h += `<section class="osk-br" style="--c:${B.c};--c2:${B.c2}" aria-label="${B.name}"><div class="osk-bh"><b>${B.name}</b><small>${B.sub}</small><span class="in">${inBr}/${mx} punkti</span></div>
      ${defs.map(x => oskNode(x, rk, inBr, free)).join('')}</section>`;
  }
  h += '</div>';
  h += `<div class="fv-card"><div class="osk-foot"><span>💡 Oskused kehtivad kohe igal püügil. ${free ? 'Puuduta helendavat oskust, et see õppida.' : 'Uue punkti saad järgmisel kalapüügi tasemel.'}</span></div></div>`;
  OSK.pop = '';
  return h;
}
async function oskUp(id) {
  if (OSK.busy) return; OSK.busy = true;
  try {
    OSK.d = await rpc('skill_up', { p_id: id }); OSK.d._at = Date.now(); OSK.pop = id;
    const df = OSK.d.defs.find(x => x.id === id), r = +OSK.d.ranks[id];
    if (typeof sfx === 'function') sfx('chime');
    toast(`${df.icon} ${df.name}: aste ${r}/${df.max}`, 'good');
  } catch (e) { toast(e.message, 'bad') }
  OSK.busy = false; renderFV(true);
}
async function oskReset() {
  const c = OSK.d ? +OSK.d.reset_cost : 0;
  if (!confirmDialogSafe(c ? `Jagada kõik oskuspunktid ümber? See maksab ${fmt(c)} kulda.` : 'Jagada kõik oskuspunktid ümber? Esimene kord on tasuta.')) return;
  OSK.busy = true;
  try { OSK.d = await rpc('skills_reset'); OSK.d._at = Date.now(); toast('Oskuspunktid on tagasi – jaga need uuesti.', 'good'); if (typeof kassaSync === 'function') kassaSync() } catch (e) { toast(e.message, 'bad') }
  OSK.busy = false; renderFV(true);
}
// kinnitus ilma brauseri dialoogita: teine vajutus 4 s jooksul kinnitab
function confirmDialogSafe(msg) {
  const now = Date.now();
  if (OSK._conf && now - OSK._conf < 4000) { OSK._conf = 0; return true }
  OSK._conf = now; toast(msg + ' Vajuta uuesti kinnitamiseks.', 'info'); return false;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-osk]'); if (b && !b.disabled) { oskUp(b.dataset.osk); return }
  if (e.target.closest('[data-osk-reset]')) oskReset();
});
FTABS.oskused = 'Oskused';
FTAB_FN.oskused = oskTab;
if (typeof FT_SVG !== 'undefined') FT_SVG.oskused = '<path d="M12 21v-7"/><path d="M12 14 7 9.5"/><path d="M12 14l5-4.5"/><path d="M12 10V5"/><circle cx="12" cy="4" r="1.8"/><circle cx="6" cy="8.5" r="1.8"/><circle cx="18" cy="8.5" r="1.8"/><path d="M8 21h8"/>';
{
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); const lv = FS ? +FS.level || 1 : 1; if (OSK.d) { const f = Math.max(0, lv - 1 - OSK.d.spent); if (f) b.oskused = f } return b };
}
// uue taseme järel värskenda punktid
{
  const _r = renderFV;
  renderFV = function () { if (OSK.d && FS && +FS.level !== +OSK.d.level && !OSK.loading) { OSK.d.level = +FS.level; oskLoad(true) } return _r.apply(this, arguments) };
}
