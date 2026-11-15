/* =====================================================================
   Kalapüügi vahekaartide ikoonid samas peene joone stiilis nagu peamenüüs (vt navi.js MN_SVG).
   Asendab sildi alguses olevad emojid; sildi tekst jääb samaks.
   ===================================================================== */
const FT_SVG = Object.assign({}, MN_SVG, {
  puuk: MN_SVG.puuk, saak: MN_SVG.saak, sundmused: MN_SVG.sundmused, kalurimaja: MN_SVG.kalurimaja,
  maja: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10.5h14V10"/><path d="M8 15.3c1.3-1 2.7-1 4 0s2.7 1 4 0"/><path d="M8 18.3c1.3-1 2.7-1 4 0s2.7 1 4 0"/>',
  tookoda: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5L3.5 17.2a1.8 1.8 0 0 0 2.5 2.6l5.8-5.7a4 4 0 0 0 5-5.3l-2.4 2.4-2.3-.5-.5-2.3Z"/>',
  tellimus: '<path d="M8 4.5H6A1.5 1.5 0 0 0 4.5 6v14A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 18 4.5h-2"/><rect x="8" y="3" width="8" height="3.2" rx="1"/><path d="m8.5 13.5 2.3 2.3 4.7-4.8"/>',
  pood: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12v8.5h13V12"/><path d="M10 20.5v-5h4v5"/>',
  raamat: '<path d="M12 6.5C10 4.9 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 4.9 12 6.5Z"/><path d="M12 6.5V20"/>',
  turg: '<path d="M12 3.5v17"/><path d="M7.5 20.5h9"/><path d="M5 7h14"/><path d="M5 7 2.5 13a2.7 2.7 0 0 0 5 0Z"/><path d="M19 7l-2.5 6a2.7 2.7 0 0 0 5 0Z"/>',
  kalatund: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2"/><path d="M9.5 2.5h5"/><path d="M12 2.5V6"/>',
  voistlus: '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4.5a3 3 0 0 0 3.5 4"/><path d="M16 6h3.5a3 3 0 0 1-3.5 4"/><path d="M12 13v4"/><path d="M8.5 20.5h7l-.8-3.5H9.3Z"/>',
  uudised: '<path d="M4.5 5.5h12v14H6A1.5 1.5 0 0 1 4.5 18Z"/><path d="M16.5 9h3v9a1.5 1.5 0 0 1-3 0"/><path d="M7.5 9h6M7.5 12h6M7.5 15h4"/>',
  saladus: '<path d="M6.5 4h11a2 2 0 0 1 2 2v1.5h-3"/><path d="M16.5 6v12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-1.5h11"/><path d="M6.5 4a2 2 0 0 0-2 2v10.5"/><path d="M8 9h5M8 12h5"/>',
  labor: '<path d="M8 3c0 6 8 6 8 9s-8 3-8 9"/><path d="M16 3c0 6-8 6-8 9s8 3 8 9"/><path d="M9 6h6M9.5 18h5M10.5 9.5h3M10.5 14.5h3"/>',
  puunised: '<path d="M3 8h18l-2.5 11.5h-13Z"/><path d="M3 8c3-2.5 15-2.5 18 0"/><path d="M8 8l1.2 11.5M16 8l-1.2 11.5M12 8v11.5"/><path d="M4 12.5h16M5 16.5h14"/>',
  riided: '<path d="M8.5 3.5 4 6l1.5 4.5 2-1v11h9v-11l2 1L20 6l-4.5-2.5a3.5 3.5 0 0 1-7 0Z"/>'
});
document.head.insertAdjacentHTML('beforeend', `<style>
.fv-tabs button{display:inline-flex;align-items:center;gap:6px}
.fv-tabs .ft-ic{display:inline-grid;place-items:center;width:18px;height:18px;flex:none;opacity:.85;transition:color .2s,opacity .2s,filter .2s}
.fv-tabs .ft-ic svg{width:18px;height:18px;display:block}
.fv-tabs button:hover .ft-ic{opacity:1}
.fv-tabs button.on .ft-ic{opacity:1;color:#ffd28a;filter:drop-shadow(0 0 5px rgba(255,190,90,.55))}
@media (max-width:600px){.fv-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px}.fv-tabs button{flex-direction:column;gap:3px;padding:7px 2px 6px;font-size:11.5px;line-height:1.15;text-align:center;justify-content:center}.fv-tabs .ft-ic,.fv-tabs .ft-ic svg{width:20px;height:20px}.fv-tabs .dot{right:4px}}
</style>`);
function ftIcon(k) { return FT_SVG[k] ? `<span class="ft-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FT_SVG[k]}</svg></span>` : '' }
// silt: emoji maha, ikoon ette (kehtib ka hiljem lisatud vahekaartidele, sest tehakse iga joonistamise eel)
{
  const _r = renderFV;
  renderFV = function (force) {
    for (const k in FTABS) { const v = FTABS[k]; if (typeof v === 'string' && !v.includes('ft-ic') && FT_SVG[k]) FTABS[k] = ftIcon(k) + v.replace(/^[^\p{L}]+/u, '').trim() }
    return _r(force);
  };
}
