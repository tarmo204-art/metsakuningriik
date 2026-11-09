/* ================= KOLIMISKOOD (claude.ai versioon → veebiversioon) ================= */
function moveCode() { const o = JSON.parse(JSON.stringify(S)); delete o.fish; return 'MK1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))) }
{
  const base = TABS.kuningriik.r;
  TABS.kuningriik.r = () => base() + `<div class="card"><div class="sec-h" style="margin:0">Koli uude mängu</div><p class="lead">Mäng on nüüd ka aadressil metsakuningriik.netlify.app, kus areng salvestub serverisse. Kopeeri kood ja kleebi see uues mängus pärast sisselogimist nupu „Too kuningriik claude.ai mängust“ alla.</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="copyMove">Kopeeri kolimiskood</button></div></div>`;
}
ACT.copyMove = () => {
  const code = moveCode();
  const fallback = () => showModal(() => `<h2>Kolimiskood</h2><p>Vali kogu tekst ja kopeeri see.</p><textarea id="moveCodeBox" readonly style="width:100%;min-height:140px;font:12px monospace;background:rgba(0,0,0,.3);color:var(--birch);border:1px solid var(--line);border-radius:10px;padding:8px">${code}</textarea><div class="mbtns"><button class="btn" type="button" data-act="closeModal">Valmis</button></div>`);
  try { navigator.clipboard.writeText(code).then(() => toast('Kolimiskood on kopeeritud! Kleebi see uues mängus.', 'good'), () => { fallback(); setTimeout(() => { const t = $('#moveCodeBox'); if (t) t.select() }, 50) }) }
  catch (e) { fallback() }
};
