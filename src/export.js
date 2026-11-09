/* ================= KOLIMISKOOD (claude.ai versioon → veebiversioon) ================= */
function moveCode() { const o = JSON.parse(JSON.stringify(S)); delete o.fish; return 'MK1:' + btoa(unescape(encodeURIComponent(JSON.stringify(o)))) }
// Pakitud kood (MK2) on umbes 10 korda lühem, nii et see ei lähe kopeerimisel katki
async function moveCode2() {
  try {
    if (!window.CompressionStream) return moveCode();
    const o = JSON.parse(JSON.stringify(S)); delete o.fish;
    const st = new Blob([new TextEncoder().encode(JSON.stringify(o))]).stream().pipeThrough(new CompressionStream('gzip'));
    const u = new Uint8Array(await new Response(st).arrayBuffer());
    let bin = ''; for (let i = 0; i < u.length; i += 8192) bin += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
    return 'MK2:' + btoa(bin);
  } catch (e) { return moveCode() }
}
{
  const base = TABS.kuningriik.r;
  TABS.kuningriik.r = () => base() + `<div class="card"><div class="sec-h" style="margin:0">Koli uude mängu</div><p class="lead">Mäng on nüüd ka aadressil metsakuningriik.netlify.app, kus areng salvestub serverisse. Kopeeri kood ja kleebi see uues mängus pärast sisselogimist nupu „Too kuningriik claude.ai mängust“ alla.</p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="copyMove">Kopeeri kolimiskood</button></div></div>`;
}
ACT.copyMove = async () => {
  const code = await moveCode2();
  showModal(() => `<h2>Kolimiskood</h2><p>Kood on ${code.length.toLocaleString('et-EE')} märki pikk. Kopeeri see <b>tervikuna</b> ja kleebi uues mängus kasti „Too kuningriik claude.ai mängust“. Ära saada koodi sõnumiga, sest sõnumirakendused võivad selle pooleks lõigata.</p><textarea id="moveCodeBox" readonly style="width:100%;min-height:120px;font:12px monospace;background:rgba(0,0,0,.3);color:var(--birch);border:1px solid var(--line);border-radius:10px;padding:8px">${code}</textarea><div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Sulge</button><button class="btn" type="button" data-act="copyMoveAgain">Kopeeri uuesti</button></div>`);
  const cp = () => { const t = $('#moveCodeBox'); if (t) { t.focus(); t.select() } try { navigator.clipboard.writeText(code).then(() => toast('Kolimiskood on kopeeritud!', 'good'), () => { try { document.execCommand('copy'); toast('Kolimiskood on kopeeritud!', 'good') } catch (e) { } }) } catch (e) { try { document.execCommand('copy') } catch (e2) { } } };
  ACT.copyMoveAgain = cp; setTimeout(cp, 60);
};
