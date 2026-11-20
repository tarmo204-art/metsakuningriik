/* =====================================================================
   Kalurikassa summa üleval paremal uueneb kohe pärast iga ostu.
   Mõni ost (Sadam, Töökoda, Kalurimaja, Suitsuahi…) uuendas ainult oma vaadet ja kassa summa
   jäi vanaks, kuni mängija läks teisele lehele. Nüüd küsitakse pärast iga ostu/uuendust
   kassa seis üle ja summa vahetatakse kohe (lehte ennast uuesti ei joonistata).
   ===================================================================== */
const KASSA = { t: 0 };
function kassaShow() {
  if (typeof FS === 'undefined' || !FS) return;
  document.querySelectorAll('.fv-purse .num').forEach(e => { const v = fmt(FS.gold); if (e.textContent !== v) { e.textContent = v; e.parentElement.classList.remove('kassa-pop'); void e.offsetWidth; e.parentElement.classList.add('kassa-pop') } });
}
function kassaSync() {
  clearTimeout(KASSA.t);
  KASSA.t = setTimeout(async () => { try { await refreshFS(); kassaShow() } catch (e) { } }, 30);
}
function kassaInstall() {
  const _rpc = rpc, SKIP = /^fish_(state|cast|reel|bite|hook|strike|odds|market$)|_state$|_list$|_info$|^get_/;
  rpc = async function (fn, args) {
    const r = await _rpc.apply(this, arguments);
    if (typeof FV !== 'undefined' && FV.open && FS && !SKIP.test(fn) && /buy|upgrade|repair|crew|build|shop|order|craft|deliver|transfer|sell|collect|send|pay|hire|unlock|learn|start|rush|fuse|enchant|license|duel|hall|offer/.test(fn)) {
      // summa vahetatakse kohe vastuse põhjal (ei oota järgmist päringut)
      try {
        if (r && typeof r === 'object') {
          if (fn === 'fish_shop' && r.cost > 0) FS.gold = Math.max(0, FS.gold - r.cost);
          else if (typeof r.gold === 'number' && r.level !== undefined) FS.gold = r.gold;
        }
        kassaShow();
      } catch (e) { }
      kassaSync();
    }
    return r;
  };
}
kassaInstall();
document.head.insertAdjacentHTML('beforeend', `<style>
.fv-purse.kassa-pop{animation:kassaPop .5s ease-out}
@keyframes kassaPop{0%{transform:scale(1)}35%{transform:scale(1.1);box-shadow:0 0 0 3px rgba(255,210,90,.35)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.fv-purse.kassa-pop{animation:none}}
</style>`);
