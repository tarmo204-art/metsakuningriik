/* =====================================================================
   „Sinu äraolekul“ – kokkuvõte sellest, mis päriselt juhtus, kui mängija oli üle 30 minuti eemal.
   Server (presence_ping) jätab äraoleku alguse meelde ja away_digest annab ainult tegelikud sündmused:
   turumüügid, akvaariumi imetlejad, kingitused, täis püünised, valmis ruumid, duellikutsed,
   bossi alistamine, Järve kalurite saak ja kuningriigi uudised.
   ===================================================================== */
const AW = { tries: 0, done: false, t0: Date.now() };
document.head.insertAdjacentHTML('beforeend', `<style>
.modal-card.awmodal{max-width:560px}
.aw-head{display:grid;justify-items:center;gap:4px;text-align:center}
.aw-head .ic{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;font-size:34px;background:radial-gradient(circle at 50% 35%,#2f7486,#14343f 75%);box-shadow:0 0 0 2px #e8b65a,0 0 22px rgba(232,182,90,.25)}
.aw-head h2{margin:6px 0 0}
.aw-list{display:grid;gap:8px;margin-top:12px}
.aw-row{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;align-items:start;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(134,205,224,.14);animation:awIn .45s cubic-bezier(.2,1.2,.4,1) both}
.aw-row .i{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;font-size:21px;background:rgba(0,0,0,.25)}
.aw-row b.g{color:#ffe0a0}
.aw-row p{margin:0;line-height:1.45;font-size:14.5px}
.aw-row small{display:block;color:#a9c4c8;font-size:12.5px;margin-top:2px;line-height:1.4}
.aw-row .btn{margin-top:6px}
.aw-row.bad{border-color:rgba(255,120,90,.45);background:linear-gradient(100deg,rgba(255,110,80,.14),rgba(255,255,255,.03) 60%)}
.aw-row.wx{border-color:rgba(140,190,255,.35);background:linear-gradient(100deg,rgba(110,160,255,.12),rgba(255,255,255,.03) 60%)}
.aw-row.gold{border-color:rgba(232,182,90,.4);background:linear-gradient(100deg,rgba(232,182,90,.14),rgba(255,255,255,.03) 60%)}
@media (max-width:600px){.modal-card.awmodal{max-height:calc(100dvh - 110px);overflow-y:auto;margin-bottom:70px}}
@keyframes awIn{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){.aw-row{animation:none}}
</style>`);

function awDur(ms) { const m = Math.round(ms / 60000), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60; return d ? `${d} p ${h} h` : h ? `${h} h ${mm} min` : `${mm} min` }
function awSp(id) { return FD.sp && FD.sp[id] ? FD.sp[id].name : id }
function awRows(d) {
  const R = [], row = (i, html, cls) => R.push(`<div class="aw-row ${cls || ''}" style="animation-delay:${R.length * 70}ms"><span class="i">${i}</span><div>${html}</div></div>`);
  const N = d.nature;
  if (N) {
    const parts = [], x = (n, one, many) => n ? `${n === 1 ? one : n + ' ' + many}` : '';
    if (N.storm) parts.push(`möllas ${x(N.storm, 'üks torm', 'tormi')}`); if (N.rain) parts.push(`sadas ${x(N.rain, 'korra vihma', 'korda vihma')}`);
    if (N.fog) parts.push(`${N.fog === 1 ? 'oli korra' : 'oli ' + N.fog + ' korda'} udu`); if (N.sun) parts.push(`${N.sun === 1 ? 'paistis korra' : 'paistis ' + N.sun + ' korda'} päike`);
    if (parts.length) row(N.storm ? '🌪️' : N.rain ? '🌧️' : '🌤️', `<p>Sinu äraolekul ${parts.join(', ').replace(/, ([^,]*)$/, ' ja $1')}.</p>${N.storm_at ? `<small>Esimene torm algas ${new Date(N.storm_at).toLocaleString('et-EE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}.</small>` : ''}`, 'wx');
    (N.damage || []).forEach(g => row(g.icon || '🏚', `<p><b>Tormikahju: ${esc(g.name)}</b></p><small>${esc(g.what)}</small><small>Ruumi boonus ei tööta, kuni see on parandatud.</small><button class="btn sm" type="button" data-aw="kalurimaja">🔧 Paranda Kalurimajas</button>`, 'bad'));
    const got = [];
    if (N.wood) got.push(`🪵 ${N.wood} triivpuitu`); if (N.amber) got.push(`🟠 ${N.amber} merevaik${N.amber > 1 ? 'u' : ''}`); if (N.berries) got.push(`🫐 ${N.berries} marja`); if (N.worms) got.push(`🪱 ${N.worms} vihmaussi`);
    if (got.length) row('🌊', `<p>Loodus tõi sulle midagi head: <b>${got.join(', ')}</b>.</p><small>${N.wood ? 'Torm uhtus kaldale puitu' + (N.amber ? ' ja merevaiku' : '') + '. ' : ''}${N.worms ? 'Pärast vihma roomasid vihmaussid maa peale – need on sinu söödakastis. ' : ''}Puit ja marjad lähevad kuningriigi varudesse.</small>`, 'gold');
    (N.fog_item || []).forEach(it => row('🌫️', `<p>Udulahe udust leidsid kaldalt: <b>${esc((FD.item && FD.item[it.id] ? FD.item[it.id].name : it.id))}</b>!</p>`, 'gold'));
  }
  const m = d.market || {};
  if (m.n) row('💰', `<p>Turul müüdi <b>${m.n}</b> sinu kala. Said kokku <b class="g">${fmt(m.gold)} kulda</b>!</p>${(m.list || []).map(x => `<small>${esc(x.who)} ostis: ${esc(awSp(x.species))} ${fKg(+x.weight)} – ${fmt(x.price)} kulda</small>`).join('')}`, 'gold');
  if (d.lab && d.lab.n) row('🧬', `<p>Geenilabori turul müüdi <b>${d.lab.n}</b> sinu hübriidi. Said <b class="g">${fmt(d.lab.gold)} kulda</b>.</p>`, 'gold');
  if (d.likes) row('🐠', `<p><b>${d.likes}</b> ${d.likes === 1 ? 'kalur käis' : 'kalurit käisid'} sinu akvaariumi imetlemas. Iga imetlus tõi sulle <b class="g">15 kulda</b>.</p>${(d.likers || []).length ? `<small>${d.likers.map(esc).join(', ')}</small>` : ''}`);
  if (d.gift) row('🎁', `<p><b>${esc(d.gift)}</b> saatis sulle sõprusekingi. Leiad selle kuningriigi postkastist.</p>`);
  if (d.traps) row('🪤', `<p><b>${d.traps}</b> ${d.traps === 1 ? 'püünis on' : 'püünist on'} täis ja ootab tühjendamist!</p><button class="btn sm" type="button" data-aw="puunised">Mine püüniste juurde</button>`, 'gold');
  if ((d.cabin || []).length) row('🏠', `<p>Kalurimajas sai valmis: <b>${d.cabin.map(esc).join(', ')}</b>.</p><button class="btn sm ghost" type="button" data-aw="kalurimaja">Vaata Kalurimaja</button>`);
  if (d.duels) row('⚔️', `<p>Sind kutsuti <b>${d.duels}</b> ${d.duels === 1 ? 'korra' : 'korda'} kahevõitlusele, aga sind polnud kohal.</p><button class="btn sm ghost" type="button" data-aw="sundmused">Kutsu ise kedagi duellile</button>`);
  if (d.boss && d.boss.killer) row('🐉', `<p>${d.boss.me ? 'Sina andsid' : `<b>${esc(d.boss.killer)}</b> andis`} Kalatunni bossile viimase löögi – järvekoletis on alistatud!</p>`);
  if (d.bots && d.bots.n) { const b = d.bots.best; row('🎣', `<p>Järve kalurid püüdsid selle ajaga <b>${fmt(d.bots.n)}</b> kala.</p>${b ? `<small>Parim saak: ${esc(b.who)} – ${esc(awSp(b.species))} ${fKg(+b.weight)}</small>` : ''}`) }
  if (d.news_n) row('📰', `<p>Kuningriigis ilmus <b>${d.news_n}</b> ${d.news_n === 1 ? 'uudis' : 'uudist'}.</p>${(d.news || []).map(n => `<small>${newsText(n)}</small>`).join('')}<button class="btn sm ghost" type="button" data-aw="uudised">Ava uudised</button>`);
  return R;
}
function awShow(d) {
  const rows = awRows(d); if (!rows.length) return;
  const away = Date.parse(d.now) - Date.parse(d.since);
  showModal(() => `<div class="aw-head"><span class="ic">🌙</span><h2>Tere tulemast tagasi!</h2><p class="lead" style="margin:0">Olid eemal <b>${awDur(away)}</b>. Selle ajal juhtus kuningriigis nii mõndagi:</p></div>
    <div class="aw-list">${rows.join('')}</div><div class="mbtns" style="justify-content:center;margin-top:12px"><button class="btn" type="button" data-act="closeModal">Lähme püüdma!</button></div>`, 'awmodal');
  if (typeof sfx === 'function') sfx('chime');
}
async function awCheck() {
  if (AW.done || !CL || !CL.user) return;
  if (UI.modalView) return; // ära sega teisi aknaid – proovime hiljem uuesti
  AW.tries++;
  let d; try { d = await rpc('away_digest') } catch (e) { if (AW.tries >= 4) AW.done = true; return }
  if (d && d.show) { AW.done = true; awShow(d); if (d.nature) { try { await refreshFS(); if (typeof claimInbox === 'function') claimInbox(); if (typeof CB !== 'undefined') CB.d = null } catch (e) { } } return }
  if (AW.tries >= 4) AW.done = true;
}
// esimene kontroll mõne sekundi pärast (siis on kohaloleku märge juba tehtud), siis veel paar korda
setInterval(() => { if (AW.done) return; const s = (Date.now() - AW.t0) / 1000; if (s > 6 + AW.tries * 25) awCheck() }, 3000);
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-aw]'); if (!b) return;
  const tab = b.dataset.aw; closeModal();
  if (!FV.open) await openFishView(tab); else { FV.tab = tab; renderFV(true); const fv = document.getElementById('fishView'); if (fv) fv.scrollTop = 0 }
});
// Kalurimaja vahekaardil märk, kui torm on midagi lõhkunud
{
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); if (FS && FS.cabin_dmg > 0) b.kalurimaja = (b.kalurimaja || 0) + FS.cabin_dmg; return b };
}
