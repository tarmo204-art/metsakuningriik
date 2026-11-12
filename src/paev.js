/* =====================================================================
   Päevapreemia kalapüügi boonus.
   Mängus on juba kuningriigi päevapreemia (engine.js claimDaily + tervitusaken joulud.js).
   Sisseloginud mängija saab samast nupust lisaks serveri kontrollitud kalapüügi boonuse
   (daily_state / daily_claim, 7 päeva ring, 7. päeval suur aardekirst). Eraldi akent ei ole.
   ===================================================================== */
const FDAY = { d: null, loading: false };
const FDAY_R = ['200 kulda kalurikassasse', '10 sööta', 'juhuslik ese', '500 kulda kalurikassasse', 'koopakristall', 'aardekaart kuningriiki', 'suur aardekirst'];

document.head.insertAdjacentHTML('beforeend', `<style>
.fday{display:flex;gap:10px;align-items:center;margin:0;padding:9px 12px;border-radius:12px;font-size:13.5px;line-height:1.4;color:#d8eef4;
  background:linear-gradient(110deg,rgba(47,106,132,.45),rgba(47,106,132,.15));border:1px solid rgba(134,205,224,.25);text-align:left}
.fday .e{font-size:22px}.fday b{color:#ffe2a0}.fday small{display:block;color:#9cc0ca;font-size:12px}
.fday.done{opacity:.7}
</style>`);

async function fdayLoad() {
  if (!CL.user || FDAY.loading) return; FDAY.loading = true;
  try { FDAY.d = await rpc('daily_state') } catch (e) { }
  FDAY.loading = false;
  if (UI.modalView) renderModal(); if (FV.open) renderFV();
}
// rida tervitusaknas ja kuningriigi päevapreemia kaardil
function fdayLine() {
  if (!CL.user || !FDAY.d) return '';
  const d = FDAY.d, nx = d.can ? d.day : (d.day % 7) + 1;
  return d.can
    ? `<p class="fday"><span class="e">🎣</span><span>Lisaks kalapüügi boonus: <b>${FDAY_R[d.day - 1]}</b><small>Kalapüügi jada ${d.streak} päeva · 7. päeval suur aardekirst</small></span></p>`
    : `<p class="fday done"><span class="e">🎣</span><span>Kalapüügi boonus on täna võetud<small>Homme: ${FDAY_R[nx - 1]} · jada ${d.streak} päeva</small></span></p>`;
}
{
  // sama nupp annab nüüd ka kalapüügi boonuse
  const baseClaim = claimDaily;
  claimDaily = function () {
    const can = dailyState().can; baseClaim();
    if (!can || !CL.user) return;
    rpc('daily_claim').then(r => {
      const { claimed: c, sec, ...st } = r; FDAY.d = st;
      const parts = [c.gold ? `+${fmt(c.gold)} kulda kalurikassasse` : '', c.bait_qty ? `+${c.bait_qty} sööta` : '', ...(c.items || []).map(x => itemName(x.id) + (x.qty > 1 ? ' ×' + x.qty : '')),
        c.kingdom && c.kingdom.map ? 'aardekaart kuningriiki' : '', c.kingdom && c.kingdom.fame ? `+${c.kingdom.fame} kuulsust` : ''].filter(Boolean);
      setTimeout(() => toast(`Kalapüügi boonus (${c.streak}. päev järjest${c.day === 7 ? ', aardekirst!' : ''}): ${parts.join(', ')}`, 'gold', 'fish'), 900);
      if (c.kingdom && Object.keys(c.kingdom).length && typeof claimInbox === 'function') setTimeout(claimInbox, 1500);
      if (FV.open) refreshFS().then(() => renderFV(true));
      if (UI.modalView) renderModal(true);
    }).catch(() => fdayLoad());
  };
  const baseEnter = enterGame;
  enterGame = function () { baseEnter(); if (CL.user) fdayLoad() };
  const baseRefreshD = refreshFS;
  refreshFS = async function () { const r = await baseRefreshD(); if (!FDAY.d && !FDAY.loading) fdayLoad(); return r };
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-daily="open"]'); if (!el) return;
  if (typeof openWelcome === 'function') openWelcome();
});
// kesköö järel tuleb uus päev
setInterval(() => { if (CL.user && FDAY.d && !FDAY.d.can) fdayLoad() }, 10 * 60000);
