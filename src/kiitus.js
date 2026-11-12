/* =====================================================================
   Kiitusbänner püügi järel: „Vau! Sinu haug kaalub 10 kg ja on 76 cm pikk! Super püük!“
   Toon sõltub sellest, kui suur kala oma liigi kohta on (tavaline / hea / suur / hiiglane).
   Mõõdulindil liigub nõel kohta, kuhu see kala liigi suuruste seas jääb.
   ===================================================================== */
const KIT = { el: null, t1: 0, t2: 0 };
const KIT_TXT = {
  vaike: [['Kena!', 'Saak käes!', 'Hea algus!'], ''],
  hea: [['Tubli!', 'Ilus kala!', 'Hästi tehtud!'], 'Ilus saak!'],
  suur: [['Vau!', 'Super!', 'Võimas!'], 'Super püük!'],
  hiid: [['USKUMATU!', 'HIIGLANE!', 'LEGENDAARNE!'], 'Sellist kala näeb harva!']
};

document.head.insertAdjacentHTML('beforeend', `<style>
.kit{position:fixed;z-index:60;transform:translate(-50%,0);width:min(440px,calc(100vw - 24px));pointer-events:auto;cursor:pointer;
  border-radius:18px;padding:14px 16px 12px;color:#fff;text-align:center;display:grid;gap:6px;overflow:hidden;
  background:radial-gradient(120% 120% at 50% 0%,color-mix(in srgb,var(--kc) 45%,#0e2a35) 0%,#0e2530 70%);
  border:1px solid color-mix(in srgb,var(--kc) 70%,transparent);box-shadow:0 18px 50px rgba(0,0,0,.5),0 0 30px color-mix(in srgb,var(--kc) 35%,transparent);
  animation:kitIn .55s cubic-bezier(.2,1.5,.4,1) both}
.kit.out{animation:kitOut .45s ease-in both}
.kit > *{position:relative;z-index:1}
.kit h3{margin:0;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:34px;line-height:1;letter-spacing:.01em;
  background:linear-gradient(180deg,#fff,color-mix(in srgb,var(--kc) 55%,#fff));-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 2px 6px rgba(0,0,0,.45))}
.kit p{margin:0;font-size:15px;line-height:1.4;color:#eaf4f6}
.kit p b{color:#fff;font-size:16.5px}
.kit .sup{font-weight:800;color:color-mix(in srgb,var(--kc) 60%,#fff);font-size:14px}
.kit-chips{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.kit-chips span{padding:2px 9px;border-radius:999px;font:800 12px system-ui;background:rgba(255,255,255,.14);color:#fff}
.kit-chips .age{background:color-mix(in srgb,var(--ac) 30%,rgba(0,0,0,.2));border:1px solid var(--ac);color:#fff}
.kit-chips .rec{background:linear-gradient(180deg,#ffe2a0,#f2b552);color:#2a1a05}
.kit-chips .new{background:linear-gradient(180deg,#b8f5c4,#5ccf7a);color:#0a2a12}
.kit-chips .fav{background:linear-gradient(180deg,#ffc2d4,#ff8fb0);color:#3a0b1c}
.kit-tape{position:relative;height:14px;margin:4px 6px 2px;border-radius:4px;background:linear-gradient(180deg,#ffe066,#e8b522);box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}
.kit-tape .nz{position:absolute;top:4px;height:6px;border-radius:3px;background:#1f8a7a}
.kit-tape .gz{position:absolute;top:4px;height:6px;border-radius:3px;background:repeating-linear-gradient(135deg,#c2410c 0 4px,#f97316 4px 8px)}
.kit-tape .pin{position:absolute;top:-5px;bottom:-5px;width:3px;margin-left:-1.5px;border-radius:2px;background:#fff;box-shadow:0 0 8px #fff;left:0;animation:kitPin 1.1s .35s cubic-bezier(.3,1.3,.4,1) both}
.kit .rays{position:absolute;z-index:0;left:50%;top:-160px;width:420px;height:420px;margin-left:-210px;border-radius:50%;
  background:repeating-conic-gradient(rgba(255,214,140,.18) 0 9deg,transparent 9deg 18deg);-webkit-mask-image:radial-gradient(circle,#000 15%,transparent 65%);mask-image:radial-gradient(circle,#000 15%,transparent 65%);animation:spin 30s linear infinite}
.kit .cf{position:absolute;z-index:0;top:-8px;width:7px;height:11px;border-radius:2px;opacity:0;animation:kitFall 2.6s ease-in var(--d) forwards}
.kit.hiid h3{font-size:40px}
@keyframes kitIn{from{opacity:0;transform:translate(-50%,-14px) scale(.85)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
@keyframes kitOut{to{opacity:0;transform:translate(-50%,-10px) scale(.96)}}
@keyframes kitPin{from{left:0}to{left:var(--p)}}
@keyframes kitFall{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--x),170px) rotate(540deg)}}
@media (prefers-reduced-motion:reduce){.kit,.kit.out,.kit .rays,.kit .cf,.kit-tape .pin{animation:none!important}.kit-tape .pin{left:var(--p)}.kit .cf{display:none}}
</style>`);

function kitHide() { clearTimeout(KIT.t1); clearTimeout(KIT.t2); const el = KIT.el; if (!el) return; KIT.el = null; el.classList.add('out'); setTimeout(() => el.remove(), 450) }
function kitShow(r) {
  const s = FD.sp[r.species]; if (!s) return;
  const w = +r.weight, gm = s.max_w * (typeof FISH_GIANT !== 'undefined' ? FISH_GIANT : 1.6);
  const p = Math.max(0, Math.min(1, (w - s.min_w) / Math.max(1e-9, s.max_w - s.min_w)));
  const tier = r.giant || w > s.max_w ? 'hiid' : p >= .7 ? 'suur' : p >= .35 ? 'hea' : 'vaike';
  const [heads, sup] = KIT_TXT[tier], head = heads[Math.floor(Math.random() * heads.length)];
  const name = s.name.charAt(0).toLowerCase() + s.name.slice(1), len = typeof fLen === 'function' ? fLen(s, w) : '';
  const col = tier === 'hiid' ? '#f2b552' : (RAR2[s.rarity] || RAR2[1])[1];
  // mõõdulint pikkuse järgi (sama mis kalakaardil)
  const L = (x) => s.max_len ? Math.cbrt(x / s.max_w) : x / s.max_w, top = L(gm), pos = (x) => Math.max(0, Math.min(100, L(x) / top * 100));
  const ag = typeof fAge === 'function' ? fAge(s, w) : null;
  const chips = [ag ? `<span class="age" style="--ac:${ag.col}">${ag.txt}</span>` : '', r.record || r.new_species ? (r.new_species ? '<span class="new">📖 Uus liik</span>' : '<span class="rec">🏆 Isiklik rekord</span>') : '', r.fav ? '<span class="fav">❤ Lemmiksööt</span>' : ''].filter(Boolean).join('');
  const conf = tier === 'suur' || tier === 'hiid' ? Array.from({ length: tier === 'hiid' ? 26 : 14 }, (_, i) => `<i class="cf" style="left:${(4 + i * 92 / (tier === 'hiid' ? 26 : 14)).toFixed(1)}%;background:${['#ffd286', '#ff8fb0', '#7ae0ff', '#b8f5c4', '#fff'][i % 5]};--x:${((i % 2 ? 1 : -1) * (10 + (i * 7) % 30))}px;--d:${(.1 + (i % 7) * .09).toFixed(2)}s"></i>`).join('') : '';
  kitHide();
  const el = document.createElement('div'); el.className = 'kit ' + tier; el.style.setProperty('--kc', col); el.setAttribute('role', 'status');
  el.innerHTML = `${tier === 'hiid' ? '<div class="rays"></div>' : ''}${conf}
    <h3>${head}</h3>
    <p>Sinu ${esc(name)} kaalub <b>${fKg(w)}</b>${len ? ` ja on <b>${len}</b> pikk` : ''}!${sup ? ` <span class="sup">${sup}</span>` : ''}</p>
    ${chips ? `<div class="kit-chips">${chips}</div>` : ''}
    <div class="kit-tape" aria-hidden="true"><span class="nz" style="left:${pos(s.min_w).toFixed(1)}%;width:${(pos(s.max_w) - pos(s.min_w)).toFixed(1)}%"></span><span class="gz" style="left:${pos(s.max_w).toFixed(1)}%;width:${(100 - pos(s.max_w)).toFixed(1)}%"></span><span class="pin" style="--p:${pos(w).toFixed(1)}%"></span></div>`;
  // asukoht: püügistseeni kohal (kui stseen on nähtav), muidu ekraani ülaosas
  const rc = typeof sceneCv !== 'undefined' && sceneCv.isConnected ? sceneCv.getBoundingClientRect() : null;
  el.style.left = (rc && rc.width ? rc.left + rc.width / 2 : innerWidth / 2) + 'px';
  el.style.top = Math.max(10, rc && rc.height && rc.top > -rc.height ? rc.top + 10 : 70) + 'px';
  el.addEventListener('click', kitHide);
  document.body.appendChild(el); KIT.el = el;
  if (typeof sfx === 'function') sfx(tier === 'hiid' ? 'levelup' : tier === 'suur' ? 'chime' : 'coin');
  KIT.t1 = setTimeout(kitHide, tier === 'hiid' ? 6000 : tier === 'suur' ? 5000 : 3600);
}
{
  const baseLandK = fxLand;
  fxLand = function (r) { baseLandK(r); if (r && r.kind === 'fish' && r.ok !== false) { clearTimeout(KIT.t2); KIT.t2 = setTimeout(() => { try { kitShow(r) } catch (e) { } }, 950) } };
  const baseCloseK = closeFishView;
  closeFishView = function () { kitHide(); return baseCloseK.apply(this, arguments) };
}
