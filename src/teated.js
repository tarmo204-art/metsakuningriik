/* =====================================================================
   Ägedamad teated: iga teade saab sisu järgi sobiva Lucide ikooni, preemiad (+kuld, +kogemus,
   +maine) muutuvad ikooniga märkideks, kuldsed teated pillavad sädemeid ja eriti tähtsad
   (saavutus, võit, uus tase, legend) on suuremad ja helendava raamiga. Hoiatus väriseb korra.
   ===================================================================== */
Object.assign(LU, {
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
  hammer: '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
  package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  swords: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>',
  'tree-pine': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'
});
// sisu järgi ikoon (esimene sobiv); "epic" = eriti tähtis teade
const TQ_RULES = [
  [/^torm|tormi/i, 'cloud-lightning'],
  [/kalaparv/i, 'fish'],
  [/^udu/i, 'cloud'],
  [/^Tase \d|tase tõusis/i, 'crown', 1],
  [/saavutus|tiitel|\d\. koht|alistatud|viimase löögi|retk läbitud|kalakuningas/i, 'trophy', 1],
  [/legend|uus liik|uus geen|avastasid uue|uus aare/i, 'sparkles', 1],
  [/ülesanne täidetud|tehing tehtud/i, 'circle-check'],
  [/kink|kingitus|kingipak|advendi|õnnistus/i, 'gift'],
  [/tellimus|tarnitud|leping|äripakkumine|äripartner/i, 'package'],
  [/kahevõitlus|kuninga vari|võistlus/i, 'swords'],
  [/suitsu|ahi köeb|tulekahju|põles|kustuta/i, 'flame'],
  [/ostsid|ostetud|puuduvad/i, 'shopping-bag'],
  [/müüdud|müüsid|müüdi|kassasse|kulda saadeti|said \d/i, 'coins'],
  [/ehita|valmis!|taastamine|taastatud|parandatud|parandusse|töökoda|täiendamine|täiustatud|paigaldatud|lammutati/i, 'hammer'],
  [/aardekaart|aare|retk|piirkond|ekspeditsioon/i, 'map'],
  [/sõpr|mängija|monument/i, 'users'],
  [/puu|metsa|hunt/i, 'tree-pine'],
  [/kala|püü|õng|sööt|kalatund|bossi|võrk|akvaarium|kalastuskaart/i, 'fish'],
  [/kogemust/i, 'zap']
];
const TQ_KIND = { bad: 'triangle-alert', good: 'circle-check', gold: 'star', info: 'info' };
function tqDecorate(el, msg, kind) {
  if (!el || typeof luc !== 'function') return;
  let icon = null, epic = false;
  if (kind === 'bad') icon = 'triangle-alert';
  else for (const [re, ic, ep] of TQ_RULES) if (re.test(msg)) { icon = ic; epic = !!ep && kind === 'gold'; break }
  icon = icon || TQ_KIND[kind] || 'info';
  const t = el.querySelector('.tic'); if (t) t.innerHTML = luc(icon);
  if (epic) el.classList.add('epic');
  // preemiad märkideks: +50 kulda → münt-ikooniga kuldne märk
  el.querySelectorAll('.tnum').forEach(b => {
    const s = b.textContent, k = /kulda/.test(s) ? ['coins', 'g'] : /kogemust/.test(s) ? ['zap', 'x'] : /kuulsust|mainet/.test(s) ? ['star', 'f'] : /kg$/.test(s) ? ['weight', 'n'] : null;
    if (!k) return; b.className = 'tchip ' + k[1]; b.innerHTML = luc(k[0]) + esc(s.replace(/\s?(kulda|kogemust|kuulsust|mainet)$/, '')) + `<small>${(s.match(/(kulda|kogemust|kuulsust|mainet)$/) || [''])[0]}</small>`;
  });
  // märkide vahelt koma ja punkt ära
  el.querySelectorAll('.tchip').forEach(c => { const n = c.nextSibling; if (n && n.nodeType === 3 && /^\s*[,·]\s*$/.test(n.textContent) && n.nextSibling && n.nextSibling.classList && n.nextSibling.classList.contains('tchip')) n.textContent = ' ';
    const p = c.previousSibling; if (p && p.nodeType === 3) p.textContent = p.textContent.replace(/\s*·\s*$/, ' ') });
  // kuldsed teated: sädemed ikooni ümbert
  if ((kind === 'gold' || epic) && !matchMedia('(prefers-reduced-motion: reduce)').matches && t) {
    const n = epic ? 14 : 8;
    t.insertAdjacentHTML('beforeend', [...Array(n)].map((_, i) => { const a = i / n * Math.PI * 2 + Math.random() * .4, d = (epic ? 34 : 24) + Math.random() * 14;
      return `<i class="tsp" style="--x:${(Math.cos(a) * d).toFixed(1)}px;--y:${(Math.sin(a) * d).toFixed(1)}px;--d:${(Math.random() * .15).toFixed(2)}s"></i>` }).join(''));
  }
}
{
  const _t = toast;
  toast = function (msg, kind, icon) {
    const box = document.getElementById('toasts'), before = box ? box.lastElementChild : null;
    const r = _t.apply(this, arguments);
    const el = box ? box.lastElementChild : null;
    if (el && el !== before && !el._tq) { el._tq = 1; try { tqDecorate(el, el.dataset.msg || String(msg), kind || 'info') } catch (e) { } }
    else if (el && el === before) { const c = [...box.children].find(x => x.dataset.msg && String(msg).endsWith(x.dataset.msg)); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump') } }
    return r;
  };
}
document.head.insertAdjacentHTML('beforeend', `<style>
.toast{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--tc) 28%,transparent);animation:tqIn .55s cubic-bezier(.2,1.35,.35,1)}
.toast::before{width:3px;box-shadow:0 0 14px var(--tc)}
.toast .tic{position:relative;overflow:visible;color:#fff;animation:tqPop .6s .08s cubic-bezier(.3,1.8,.4,1) backwards}
.toast .tic .lu{width:20px;height:20px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35))}
.toast .tic::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--tc);opacity:0;animation:tqRing .9s .15s ease-out}
.toast .tchip{display:inline-flex;align-items:center;gap:3px;margin:0 1px;padding:1px 7px 1px 5px;border-radius:999px;font-weight:800;white-space:nowrap;vertical-align:1px;font-size:.92em}
.toast .tchip .lu{width:13px;height:13px}.toast .tchip small{font-weight:600;opacity:.8;font-size:.86em;margin-left:2px}
.toast .tchip.g{background:rgba(242,181,82,.18);color:#ffd27a}.toast .tchip.x{background:rgba(126,200,227,.18);color:#a8e2f6}
.toast .tchip.f{background:rgba(197,140,255,.18);color:#e2c8ff}.toast .tchip.n{background:rgba(255,255,255,.1);color:#e6efec}
.toast .tsp{position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px;border-radius:50%;background:#ffe39a;box-shadow:0 0 6px #ffd27a;opacity:0;animation:tqSpark .8s var(--d) ease-out}
.toast.bad{animation:tqIn .45s cubic-bezier(.2,1.35,.35,1),tqShake .4s .45s ease-in-out}
.toast.epic{padding-block:14px 16px;border:1px solid transparent;background:linear-gradient(135deg,rgba(84,58,14,.97),rgba(20,32,22,.97) 70%) padding-box,conic-gradient(from var(--tqa,0deg),#f2b552,#fff1c2,#c58cff,#7ec8e3,#f2b552) border-box;animation:tqIn .6s cubic-bezier(.2,1.35,.35,1),tqSpin 3s linear infinite}
.toast.epic .tic{width:44px;height:44px}.toast.epic .tic .lu{width:24px;height:24px}
.toast.epic .tt{font-size:15.5px;background:linear-gradient(90deg,#fff1c2,#ffd27a,#fff1c2);-webkit-background-clip:text;background-clip:text;color:transparent}
.toast.bump .tcnt{animation:tqPop .4s cubic-bezier(.3,1.8,.4,1)}
@property --tqa{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes tqSpin{to{--tqa:360deg}}
@keyframes tqIn{from{opacity:0;transform:translateY(-22px) scale(.92);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes tqPop{from{transform:scale(.3) rotate(-25deg)}to{transform:none}}
@keyframes tqRing{0%{opacity:.8;transform:scale(.9)}100%{opacity:0;transform:scale(1.7)}}
@keyframes tqSpark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(.3)}}
@keyframes tqShake{0%,100%{transform:none}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
@media (prefers-reduced-motion:reduce){.toast,.toast .tic,.toast .tic::after,.toast.bad,.toast.epic,.toast .tsp{animation:none!important}}
</style>`);
