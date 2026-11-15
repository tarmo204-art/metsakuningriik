/* =====================================================================
   Kuningriigi uudised – ülemaailmne teadetetahvel.
   Uudised tekivad ainult päris sündmustest serveris (fish_news): esimene haruldane liik,
   legendaarne/müütiline saak, kuldne aardekirst, rekordkalad, võistluste esikolmik ja bossi alistamine.
   Kõik mängijad näevad sama nimekirja, uusim on üleval, korduseid ei näidata ja vanemaid uudiseid
   saab juurde laadida.
   ===================================================================== */
const NU = { older: [], end: false, busy: false, only: false };
try { NU.only = localStorage.getItem('mk.newsOnly') === '1' } catch (e) { }

const NU_RW = { 3: 'haruldase', 4: 'eepilise', 5: 'legendaarse', 6: 'müütilise' };
function nuWho(n) {
  if (n.bot) return `${n.bot_emoji || '🎣'} <b>${esc(n.name)}</b>${typeof duBotTag === 'function' ? ' ' + duBotTag() : ''}`;
  return `<b>${esc(n.name)}</b>${n.title ? ` <small class="nu-tt">${esc(n.title)}</small>` : ''}`;
}
function nuFish(d) { const sp = FD.sp[d.species]; return `<b class="nu-fish">${esc(sp ? sp.name : d.species || 'kala')}</b>` }
function nuKg(d) { return d.weight ? `<b class="nu-kg">${fKg(+d.weight)}</b>` : '' }
function nuPlace(d) { return Math.max(1, Math.min(3, +d.place || 1)) }
function nuComp(d) { return COMPN[d.comp] ? COMPN[d.comp][0] : (d.comp || 'võistlus') }

// esiletõstetud uudised: pealkiri, tekst, värviklass ja pilt
const NU_HL = {
  first: n => { const d = n.data || {}; return { t: 'ESMAAVASTUS!', r: d.rarity || 3, b: `Mängija ${nuWho(n)} püüdis kogu kuningriigi esimesena haruldase liigi ${nuFish(d)}${d.weight ? ` kaaluga ${nuKg(d)}` : ''}!`, cg: 1 } },
  catch: n => { const d = n.data || {}, r = d.rarity || 5; return { t: r >= 6 ? 'MÜÜTILINE SAAVUTUS!' : r >= 5 ? 'LEGENDAARNE SAAVUTUS!' : r >= 4 ? 'EEPILINE SAAK!' : 'HARULDANE SAAK!', r, b: `Mängija ${nuWho(n)} püüdis ${NU_RW[r] || 'haruldase'} kala ${nuFish(d)}${d.weight ? ` kaaluga ${nuKg(d)}` : ''}!`, cg: 1 } },
  giant: n => { const d = n.data || {}; return { t: 'REKORDSUURUS!', r: d.rarity || 3, b: `Mängija ${nuWho(n)} püüdis hiiglasliku kala ${nuFish(d)}${d.weight ? ` kaaluga ${nuKg(d)}` : ''}!`, cg: 1 } },
  grecord: n => { const d = n.data || {}; return { t: 'UUS MÄNGUREKORD!', r: Math.max(4, d.rarity || 1), b: `Mängija ${nuWho(n)} püüdis kõigi aegade suurima kala ${nuFish(d)} – ${nuKg(d)}! Keegi pole sellest liigist varem nii suurt kala välja tõmmanud.`, cg: 1 } },
  pbig: n => { const d = n.data || {}; return { t: 'ISIKLIK REKORD!', r: Math.max(3, d.rarity || 1), b: `Mängija ${nuWho(n)} püüdis oma elu suurima kala: ${nuFish(d)} kaaluga ${nuKg(d)}!`, cg: 1 } },
  chest: n => { const d = n.data || {}; return { t: 'KULDNE AARDEKIRST!', r: 5, junk: 'chest_kuld', b: `Mängija ${nuWho(n)} leidis kuldse aardekirstu${d.gold ? ` ja sai <b class="nu-kg">${fmt(d.gold)} kulda</b>` : ''}!`, cg: 1 } },
  comp: n => { const d = n.data || {}, p = nuPlace(d); return { t: ['', 'VÕISTLUSE VÕITJA!', 'VÕISTLUSE 2. KOHT!', 'VÕISTLUSE 3. KOHT!'][p], r: 5, cls: 'p' + p, ic: ['', '🥇', '🥈', '🥉'][p], b: p === 1 ? `Mängija ${nuWho(n)} võitis võistluse „${esc(nuComp(d))}“!` : `Mängija ${nuWho(n)} saavutas võistluses „${esc(nuComp(d))}“ <b class="nu-kg">${p}. koha</b>!`, cg: 1 } },
  boss: n => ({ t: 'VIIMANE LÖÖK!', r: 6, cls: 'boss', ic: '⚔️', b: `Mängija ${nuWho(n)} andis Kalatunni bossile viimase löögi! Järvekoletis on alistatud.`, cg: 1 }),
  boss_team: n => { const d = n.data || {}, nm = (d.names || []).map(x => esc(x)), more = Math.max(0, (+d.n || nm.length) - nm.length);
    return { t: 'JÄRVEKOLETIS ALISTATUD!', r: 6, cls: 'boss', ic: '🐉', b: `Kalurid alistasid ühiselt Kalatunni bossi! Viimase löögi andis ${nuWho(n)}.${nm.length ? `<span class="nu-team">⚔️ Võitluses osalesid: ${nm.join(', ')}${more ? ` ja veel ${more}` : ''}</span>` : ''}`, cg: 1 } },
  kalatund: n => { const d = n.data || {}; return { t: 'KALATUNNI VÕITJA!', r: 5, ic: '👑', b: `Mängija ${nuWho(n)} võitis Kalatunni${d.pts ? ` <b class="nu-kg">${fmt(d.pts)} punktiga</b>` : ''}!`, cg: 1 } }
};
// vanad tekstid uute liikide jaoks (kasutatakse ka teadetes ja kuningriigi paneelil)
{
  const _nt = newsText;
  newsText = function (n) {
    const d = n.data || {}, who = `<b>${esc(n.name)}</b>${n.title ? ` <small class="lead">${esc(n.title)}</small>` : ''}`, sp = FD.sp[d.species], fn = esc(sp ? sp.name : d.species || 'kala');
    if (n.kind === 'grecord') return `${who} püüdis uue mängurekordi: <b>${fn}</b> (${fKg(+d.weight)})! 🏆`;
    if (n.kind === 'pbig') return `${who} püüdis oma elu suurima kala: <b>${fn}</b> (${fKg(+d.weight)})! 🎣`;
    if (n.kind === 'boss_team') return `Järvekoletis on alistatud! Viimase löögi andis ${who}${d.n ? `, võitluses osales ${d.n} kalurit` : ''}. 🐉`;
    if (n.kind === 'comp' && nuPlace(d) > 1) return `${who} saavutas võistluses „${nuComp(d)}“ ${nuPlace(d)}. koha!`;
    return _nt(n);
  };
  Object.assign(NEWS_IC, { grecord: '🏆', pbig: '🎣', boss: '⚔️', boss_team: '🐉', kalatund: '👑' });
}

document.head.insertAdjacentHTML('beforeend', `<style>
.nu-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.nu-filter{display:inline-flex;border-radius:999px;background:rgba(0,0,0,.25);padding:3px}
.nu-filter button{border:0;background:none;color:#cfe0da;font:inherit;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;cursor:pointer}
.nu-filter button.on{background:#f2b552;color:#2a1a06}
.nu-list{display:grid;gap:10px;margin-top:12px}
.nw{--rc:#6cb8ff;position:relative;overflow:hidden;display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:center;padding:12px 14px;border-radius:14px;
  background:linear-gradient(100deg,color-mix(in srgb,var(--rc) 20%,transparent),rgba(8,22,28,.55) 55%);border:1px solid color-mix(in srgb,var(--rc) 45%,transparent);
  box-shadow:inset 3px 0 0 var(--rc)}
.nw .pic{width:96px;height:64px;border-radius:10px;display:grid;place-items:center;background:radial-gradient(circle at 50% 55%,color-mix(in srgb,var(--rc) 35%,transparent),rgba(0,0,0,.25) 70%);font-size:36px}
.nw .pic canvas{width:96px;height:64px;display:block}
.nw h4{margin:0 0 3px;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:19px;line-height:1.1;color:var(--rc);text-shadow:0 1px 8px rgba(0,0,0,.4)}
.nw p{margin:0;font-size:14px;line-height:1.45;color:#eef2f0}
.nw .nu-fish{color:var(--rc)}.nw .nu-kg{color:#ffe0a0}
.nw .nu-tt{color:#9fb7b0;font-weight:600;font-size:11.5px}
.nw .nu-team{display:block;margin-top:4px;font-size:12.5px;color:#d6e2de}
.nw .meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin-top:5px;font-size:12px;color:#a9bfb8}
.nw .cg{color:#ffd27a;font-weight:800}
.nw .new{font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:#ff6b5a;color:#fff}
.nw.me{border-color:#f2b552}
.nw.r5,.nw.r6{box-shadow:inset 3px 0 0 var(--rc),0 0 18px color-mix(in srgb,var(--rc) 25%,transparent)}
.nw.r5::after,.nw.r6::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.16) 50%,transparent 65%);transform:translateX(-100%);animation:nuSweep 5s ease-in-out infinite}
.nw.r6{background:linear-gradient(100deg,rgba(255,107,154,.22),rgba(140,110,255,.16) 30%,rgba(8,22,28,.55) 60%)}
.nw.r6 h4{background:linear-gradient(90deg,#ff8ab0,#c9a0ff,#7fd6ff,#ff8ab0);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:nuRain 4s linear infinite}
.nw.boss{--rc:#ff7058}
.nw.p2{--rc:#d9e2ea}.nw.p3{--rc:#e0a070}
.nw.fresh{animation:nuIn .7s cubic-bezier(.2,1.3,.4,1) both}
.nu-small{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:start;padding:8px 12px;border-radius:10px;background:rgba(0,0,0,.2);font-size:13.5px;line-height:1.4}
.nu-small .ni{font-size:19px;line-height:1}.nu-small small{font-size:11.5px;color:#a9bfb8}
.nu-small.me{background:rgba(242,181,82,.12)}
.nu-more{display:flex;justify-content:center;margin-top:12px}
@keyframes nuSweep{0%,55%{transform:translateX(-100%)}85%,100%{transform:translateX(100%)}}
@keyframes nuRain{to{background-position:200% 0}}
@keyframes nuIn{from{opacity:0;transform:translateY(10px) scale(.97)}}
@media (max-width:560px){.nw{grid-template-columns:64px minmax(0,1fr);gap:10px;padding:10px 12px}.nw .pic,.nw .pic canvas{width:64px;height:48px}.nw .pic{font-size:28px}.nw h4{font-size:17px}.nw p{font-size:13.5px}}
@media (prefers-reduced-motion:reduce){.nw::after,.nw.r6 h4,.nw.fresh{animation:none!important}}
</style>`);

function nuWhen(at) { const d = new Date(at); return `${d.toLocaleDateString('et-EE', { day: 'numeric', month: 'numeric', year: 'numeric' })} kell ${d.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' })}` }
// kõik teadaolevad uudised ühes nimekirjas: uusim üleval, iga uudis ainult üks kord
function nuAll() {
  const m = new Map();
  for (const n of [...(NEWS.list || []), ...NU.older]) if (!m.has(n.id)) m.set(n.id, n);
  const all = [...m.values()].sort((a, b) => b.id - a.id);
  // kui sama päeva bossist on ühisuudis, ei näidata eraldi „viimane löök“ uudist
  const team = new Set(all.filter(n => n.kind === 'boss_team').map(n => (n.data || {}).day));
  return all.filter(n => !(n.kind === 'boss' && team.has((n.data || {}).day)));
}
function nuCard(n, seen) {
  const f = NU_HL[n.kind]; if (!f) return '';
  const H = f(n), d = n.data || {}, rc = H.cls === 'boss' ? '' : `--rc:${(RAR2[H.r] || RAR2[3])[1]}`;
  const pic = H.ic ? `<span>${H.ic}</span>` : H.junk ? `<canvas data-fl="" data-junk="${H.junk}" data-r="5" data-nobg="1"></canvas>` : d.species && FD.sp[d.species] ? `<canvas data-fl="${esc(d.species)}" data-r="${H.r}" data-nobg="1"></canvas>` : `<span>${NEWS_IC[n.kind] || '📣'}</span>`;
  const fresh = n.id > seen && !n.me;
  return `<div class="nw r${H.r} ${H.cls || ''} ${n.me ? 'me' : ''} ${fresh ? 'fresh' : ''}" style="${rc}"><div class="pic">${pic}</div><div><h4>${H.t}</h4><p>${H.b}${H.cg ? ' <span class="cg">🎉 Palju õnne!</span>' : ''}</p>
    <div class="meta">${fresh ? '<span class="new">UUS</span>' : ''}<span>🕒 ${nuWhen(n.at)}</span><span>${newsAgo(n.at)}</span>${n.me ? '<span class="cg">See oled sina!</span>' : ''}</div></div></div>`;
}
function nuSmall(n) { return `<div class="nu-small ${n.me ? 'me' : ''}"><span class="ni">${NEWS_IC[n.kind] || '📣'}</span><div><div>${newsText(n)}</div><small>🕒 ${nuWhen(n.at)} · ${newsAgo(n.at)}</small></div></div>` }

tabUudised = function () {
  const seen0 = NEWS.seen;
  if (NEWS.unread) { NU.seenAt = NEWS.seen; NU.seenTill = Date.now() + 90000; NEWS.unread = 0; NEWS.seen = NEWS.last; try { localStorage.setItem('mk.newsSeen', NEWS.seen) } catch (e) { } setTimeout(() => renderFV(), 0) }
  const seen = Date.now() < (NU.seenTill || 0) ? NU.seenAt : seen0;
  let body;
  if (!NEWS.list) body = '<p class="lead">Laadin uudiseid…</p>';
  else {
    const all = nuAll().filter(n => !NU.only || NU_HL[n.kind]);
    body = all.length ? `<div class="nu-list">${all.map(n => NU_HL[n.kind] ? nuCard(n, seen) : nuSmall(n)).join('')}</div>`
      : `<p class="lead" style="margin-top:12px">${NU.only ? 'Erakordseid saavutusi veel pole. Püüa midagi erakordset ja sinust räägib kogu kuningriik!' : 'Uudiseid veel pole. Püüa midagi erakordset ja sinust räägib kogu kuningriik!'}</p>`;
    if (NEWS.list.length >= 40 && !NU.end) body += `<div class="nu-more"><button class="btn sm ghost" type="button" data-nuold ${NU.busy ? 'disabled' : ''}>${NU.busy ? 'Laadin…' : '📜 Laadi vanemaid uudiseid'}</button></div>`;
    else if (NU.end) body += '<p class="lead" style="text-align:center;margin-top:12px">Siin algab kuningriigi ajalugu. Vanemaid uudiseid pole.</p>';
  }
  return `<div class="fv-card"><div class="nu-head"><h2 style="margin:0">📰 Kuningriigi uudised</h2><div class="nu-filter"><button type="button" class="${NU.only ? '' : 'on'}" data-nuf="0">Kõik</button><button type="button" class="${NU.only ? 'on' : ''}" data-nuf="1">Ainult saavutused</button></div></div>
    <p class="lead">Ülemaailmne teadetetahvel: siin kuulutatakse välja kõigi mängijate erakordsed saavutused – esimesed haruldased liigid, legendaarsed ja müütilised kalad, rekordid, kuldsed aardekirstud, võistluste esikolmikud ja bossi alistajad.</p>${body}</div>`;
};
document.addEventListener('click', async e => {
  const f = e.target.closest('[data-nuf]');
  if (f) { NU.only = f.dataset.nuf === '1'; try { localStorage.setItem('mk.newsOnly', NU.only ? '1' : '0') } catch (er) { } renderFV(true); return }
  const b = e.target.closest('[data-nuold]'); if (!b || NU.busy) return;
  const all = nuAll(), min = all.length ? Math.min(...all.map(n => n.id)) : 0; if (!min) return;
  NU.busy = true; renderFV(true);
  try { const rows = await rpc('kingdom_news_older', { p_before: min }); NU.older.push(...rows); if (rows.length < 30) NU.end = true }
  catch (er) { toast('Vanemaid uudiseid ei õnnestunud laadida.', 'bad') }
  NU.busy = false; renderFV(true);
});
