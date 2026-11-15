/* =====================================================================
   Kes on mängus: väike roheline silt ekraani nurgas ja paneel kõigi praegu mängivate inimestega
   (server presence_ping). Järve kalurid on eraldi ja alati märgistatud.
   ===================================================================== */
const ON = { d: null, seen: null, t: 0, busy: false };
const ON_WHERE = {
  kuningriik: ['🏰', 'oma kuningriigis'], puuk: ['🎣', 'kalapüügil'], saak: ['🧺', 'sorteerib saaki'], maja: ['🏠', 'kalamajas'],
  tookoda: ['🔧', 'töökojas'], tellimus: ['📋', 'teeb ülesandeid'], pood: ['🛒', 'kalapoes'], raamat: ['📖', 'loeb kalaraamatut'],
  turg: ['⚖️', 'kalaturul'], kalatund: ['⏰', 'kalatunnis'], voistlus: ['🏆', 'võistlustel'], uudised: ['📰', 'loeb uudiseid'],
  labor: ['🧬', 'geenilaboris'], riided: ['👕', 'riidekapi juures'], saladus: ['📜', 'uurib saladusi'], sundmused: ['🎪', 'sündmustel'],
  puunised: ['🪤', 'püüniste juures']
};

document.head.insertAdjacentHTML('beforeend', `<style>
.on-chip{display:flex;align-items:center;gap:7px;flex:none;padding:5px 11px 5px 8px;border-radius:999px;border:1px solid rgba(120,230,150,.35);background:rgba(10,26,20,.7);color:#e8f5ea;
  font:700 13px/1 inherit;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s;white-space:nowrap}
.on-chip:hover{transform:translateY(-1px);border-color:rgba(120,230,150,.7)}
.on-chip:focus-visible{outline:2px solid #8fe6a6;outline-offset:2px}
.on-chip[hidden]{display:none}
.on-dot{position:relative;width:10px;height:10px;border-radius:50%;background:#4fdc7c;flex:none}
.on-dot::after{content:'';position:absolute;inset:0;border-radius:50%;border:2px solid #4fdc7c;animation:onSonar 2.2s ease-out infinite}
@keyframes onSonar{0%{transform:scale(1);opacity:.9}100%{transform:scale(2.8);opacity:0}}
.on-faces{display:flex}
.on-faces i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:800 11px/1 inherit;font-style:normal;color:#fff;border:2px solid #0d2219;margin-left:-7px;text-shadow:0 1px 1px rgba(0,0,0,.4)}
.on-faces i:first-child{margin-left:0}
.on-chip small{opacity:.7;font-weight:700}
.on-chip.pop{animation:onPop .6s ease}
@keyframes onPop{40%{transform:scale(1.12);border-color:#8fe6a6;box-shadow:0 0 22px rgba(79,220,124,.55)}}
.on-card h2{display:flex;align-items:center;gap:10px}
.on-sec{margin:16px 0 6px;font-size:14px;opacity:.85;display:flex;align-items:center;gap:8px}
.on-list{display:grid;gap:7px}
.on-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)}
.on-row.me{background:rgba(79,220,124,.08);border-color:rgba(79,220,124,.3)}
.on-av{position:relative;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font:800 17px/1 inherit;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.on-av.bot{background:rgba(255,255,255,.1);font-size:22px}
.on-av b{position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;background:#4fdc7c;border:2px solid #10261c}
.on-av b.busy{background:#ffb648}
.on-nm{min-width:0}
.on-nm strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.on-nm small{display:block;opacity:.8;margin-top:2px}
.on-acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.on-acts .btn{padding:6px 10px;font-size:12.5px}
.on-xp{display:block;height:5px;margin-top:5px;max-width:180px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}
.on-xp i{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#7fd6ff,#4fdc7c)}
.on-empty{padding:14px;border-radius:14px;background:rgba(255,255,255,.04);text-align:center;opacity:.85}
@media (max-width:600px){.on-faces,.on-chip small{display:none}.on-chip{padding:5px 10px 5px 8px}}
@media (max-width:420px){.on-chip em{display:none}.fv-top:has(>.on-chip){gap:8px}.fv-top:has(>.on-chip) h1{font-size:21px}.fv-top>.on-chip{padding:5px 8px 5px 7px;gap:5px}}
.on-chip em{font-style:normal}
@media (max-width:520px){.on-row{grid-template-columns:40px minmax(0,1fr)}.on-acts{grid-column:1/-1;justify-content:stretch}.on-acts .btn{flex:1}}
@media (prefers-reduced-motion:reduce){.on-dot::after,.on-chip.pop{animation:none}}
</style>`);
// silt on üks ja sama element, mida tõstetakse päisest päisesse (kalapüügi vaade joonistatakse tihti uuesti, silt ei tohi sellega kaduda)
ON.el = document.createElement('button'); ON.el.className = 'on-chip'; ON.el.id = 'onChip'; ON.el.type = 'button'; ON.el.hidden = true; ON.el.setAttribute('aria-label', 'Kes on praegu mängus');
ON.el.addEventListener('click', () => { showModal(onView, 'wide'); onPing() });
document.body.appendChild(ON.el);
// silt elab kuningriigis päises, kalapüügil kalapüügi päises
function onPlace() {
  const c = ON.el; if (!c) return;
  const tgt = FV.open ? document.querySelector('#fvIn .fv-top') : document.querySelector('.hud-world');
  if (!tgt) return;
  if (FV.open) { const h = tgt.querySelector('h1'); if (c.parentNode !== tgt) h ? h.after(c) : tgt.appendChild(c) }
  else if (c.parentNode !== tgt) tgt.prepend(c);
}
const _onRenderFV = renderFV; renderFV = function (...a) { const r = _onRenderFV.apply(this, a); onPlace(); return r };

function onHue(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) % 360; return h }
function onFace(name) { const h = onHue(name); return `background:linear-gradient(135deg,hsl(${h} 55% 48%),hsl(${(h + 40) % 360} 60% 34%))` }
function onInit(name) { return esc(([...String(name || '?').trim()][0] || '?').toUpperCase()) }
function onWhere(p) {
  if (p.spot) { const sp = FD.spot && FD.spot[p.spot]; return `🎣 püüab kala${sp ? ': ' + esc(sp.name) : ''}` }
  const w = ON_WHERE[p.where] || ON_WHERE.kuningriik; return w[0] + ' ' + w[1];
}
function onMyWhere() { return FV.open ? (FV.tab || 'puuk') : 'kuningriik' }
function onVisible() { const g = document.getElementById('game'); return !!(CL.user && g && !g.hidden) }

async function onPing() {
  if (!onVisible() || document.hidden) { onChip(); return }
  let d; try { d = await rpc('presence_ping', { p_where: onMyWhere() }) } catch (e) { return }
  const ids = new Set((d.players || []).map(p => p.id));
  if (ON.seen) {
    const fresh = (d.players || []).filter(p => !ON.seen.has(p.id));
    if (fresh.length) {
      toast(fresh.length === 1 ? `🟢 ${fresh[0].name} tuli mängu` : `🟢 ${fresh.length} mängijat tuli mängu`, 'info');
      const c = ON.el; if (c) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }
    }
  }
  ON.seen = ids; ON.d = d; onChip();
  if (UI.modalView === onView) renderModal(true);
}
function onChip() {
  const c = ON.el; if (!c) return;
  if (!onVisible() || !ON.d) { c.hidden = true; return }
  const pl = ON.d.players || [], bots = ON.d.bots || [], n = pl.length + 1;
  const faces = pl.slice(0, 3).map(p => `<i style="${onFace(p.name)}">${onInit(p.name)}</i>`).join('');
  c.innerHTML = `<span class="on-dot"></span>${faces ? `<span class="on-faces">${faces}</span>` : ''}<span>${n}<em> mängus</em></span>${bots.length ? `<small>· 🎣 ${bots.length}</small>` : ''}`;
  c.title = pl.length ? 'Praegu mängivad: ' + pl.map(p => p.name).join(', ') : 'Praegu oled ainult sina mängus';
  c.hidden = false; onPlace();
}
function onView() {
  const d = ON.d; if (!d) return '<h2>Kes on mängus?</h2><p class="lead">Laen…</p>';
  const pl = d.players || [], bots = d.bots || [], myName = (S && S.name) || 'Sina';
  const me = `<div class="on-row me"><div class="on-av" style="${onFace(myName)}">${onInit(myName)}<b></b></div><div class="on-nm"><strong>${esc(myName)} <small style="display:inline">(sina)</small></strong><small>${onWhere({ where: onMyWhere() })}</small></div></div>`;
  const rows = pl.map(p => {
    const inFish = p.where && p.where !== 'kuningriik', duel = inFish && p.flevel && !p.busy;
    return `<div class="on-row"><div class="on-av" style="${onFace(p.name)}">${onInit(p.name)}<b class="${p.busy ? 'busy' : ''}" title="${p.busy ? 'Duellis' : 'Mängus'}"></b></div>
      <div class="on-nm"><strong>${esc(p.name)}</strong><small>${esc(p.kingdom || '')} · 👑 ${p.level}. tase${p.flevel ? ` · 🎣 ${p.flevel}. tase` : ''}</small><small>${p.busy ? '⚔ on praegu duellis' : onWhere(p)}</small></div>
      <div class="on-acts"><button class="btn ghost" type="button" data-on="visit" data-arg="${p.id}">🏰 Külasta</button>${duel ? `<button class="btn" type="button" data-on="duel" data-arg="${p.id}">⚔ Kutsu duellile</button>` : ''}</div></div>`;
  }).join('');
  const brows = bots.map(b => { const sp = FD.spot && FD.spot[b.spot];
    return `<div class="on-row"><div class="on-av bot">${b.emoji || '🎣'}<b></b></div>
      <div class="on-nm"><strong>${esc(b.name)} ${duBotTag()}</strong><small>🎣 ${b.level}. tase · püüab${sp ? ': ' + esc(sp.name) : ''}</small>${b.xp_need ? `<span class="on-xp" title="${fmt(b.xp)} / ${fmt(b.xp_need)} kogemust"><i style="width:${Math.min(100, b.xp / b.xp_need * 100).toFixed(1)}%"></i></span>` : ''}</div>
      <div class="on-acts"><button class="btn ghost" type="button" data-on="duel" data-arg="bot:${b.bot}">⚔ Kutsu</button></div></div>` }).join('');
  return `<div class="on-card"><h2><span class="on-dot"></span>Kes on mängus?</h2>
    <p class="lead">${pl.length ? `Praegu mängib peale sinu veel <b>${pl.length}</b> ${pl.length === 1 ? 'inimene' : 'inimest'}.` : 'Praegu oled ainuke päris mängija. Kui keegi tuleb, annan sulle märku!'}</p>
    <div class="on-sec">Päris mängijad</div><div class="on-list">${me}${rows || ''}</div>
    ${bots.length ? `<div class="on-sec">Järve kalurid <small>– mängu tegelased, mitte päris inimesed</small></div><div class="on-list">${brows}</div>` : ''}
    <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Sulge</button></div></div>`;
}
async function onDuel(id) {
  closeModal();
  if (!FV.open) await openFishView('sundmused'); else { FV.tab = 'sundmused'; renderFV(true) }
  DU.pick = id; renderFV(true);
  setTimeout(() => { const el = document.querySelector('.du-list'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 500);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-on]'); if (!b) return;
  if (b.dataset.on === 'visit') { closeModal(); visitK(b.dataset.arg) }
  else if (b.dataset.on === 'duel') onDuel(b.dataset.arg);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) onPing() });
(function onLoop() { onPing(); setTimeout(onLoop, 30000) })();
setInterval(() => { const c = ON.el; if (!c) return; if (onVisible() && !ON.d && !ON.busy) { ON.busy = true; onPing().finally(() => ON.busy = false) } else if ((!onVisible()) !== c.hidden) onChip(); onPlace() }, 1500);
